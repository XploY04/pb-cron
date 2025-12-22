export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import connectMongoDB from "@/lib/dbConnect";
import { LatestModel, LeaderboardModel } from "@/models/PbHustel";
import FireCrawlApp from "@mendable/firecrawl-js";
import {
  parseVJudgeContests,
  getLatestContestId,
  VJudgeContest,
} from "@/lib/vjudgeParser";
import { parseContestData } from "@/lib/leaderboard";

interface ContestRanking {
  rank: number;
  name: string;
  score: number;
}

interface LeaderboardUser {
  name: string;
  score: number;
  consistency: number;
  rank?: number;
}

interface LeaderboardData {
  rankings?: LeaderboardUser[];
  updatedAt?: Date;
  lastContestCode?: string;
}

/**
 * @swagger
 * /api/hustle/update:
 *   post:
 *     summary: Fetches and updates the leaderboard from VJudge.
 *     description: Fetches contest data from VJudge API, updates the leaderboard, and stores it in the database.
 *     tags:
 *      - Hustle
 *     responses:
 *       200:
 *         description: Successfully updated leaderboard
 *       400:
 *         description: Invalid response from VJudge or missing data.
 *       500:
 *         description: Error while processing or updating data.
 */

// export async function PUT () {
//     await updateLeaderboard();
//     return NextResponse.json({ message: "Leaderboard update initiated." }, { status: 200 });
// }

export async function POST(request: Request) {
  try {
    await connectMongoDB();

    // Check for force refresh parameter
    const url = new URL(request.url);
    const forceRefresh = url.searchParams.get("force") === "true";

    // Use FireCrawl to scrape contest data from VJudge
    const app = new FireCrawlApp({
      apiKey: process.env.FIRECRAWL_API_KEY,
    });

    const scrapeResult = await app.scrapeUrl(
      "https://vjudge.net/contest#category=public&running=0&title=&owner=Pbhustle",
      {
        formats: ["markdown"],
      }
    );

    // Check if we have markdown content in the response
    if (!("markdown" in scrapeResult) || !scrapeResult.markdown) {
      return NextResponse.json(
        {
          error: "Failed to scrape contest data",
          message: "No markdown content in response",
        },
        { status: 400 }
      );
    }

    // Parse the markdown to extract contest data using our utility function
    const contests = parseVJudgeContests(scrapeResult.markdown);

    console.log("Contests:", contests);

    // Get the latest contest ID
    const latestContestId = getLatestContestId(contests);

    if (!latestContestId) {
      return NextResponse.json(
        {
          error: "Failed to get the contest ID",
          message: "Contest ID not found",
        },
        { status: 400 }
      );
    }

    const leaderboardDoc = await LeaderboardModel.findOne({
      name: "leaderboard",
    });

    const existingData = leaderboardDoc as LeaderboardData | undefined;
    const lastContestCode = existingData?.lastContestCode;

    if (Number(lastContestCode) == Number(latestContestId) && !forceRefresh) {
      console.log("Leaderboard is already up-to-date.");
      return NextResponse.json({
        message: "Leaderboard is already up-to-date.",
      });
    }

    if (forceRefresh) {
      console.log("Force refresh enabled, updating leaderboard...");
    }

    const scrapeResult2 = await app.scrapeUrl(
      `https://vjudge.net/contest/${Number(latestContestId)}#rank`,
      {
        formats: ["markdown"],
      }
    );

    // Check if we have markdown content in the second response
    if (!("markdown" in scrapeResult2) || !scrapeResult2.markdown) {
      return NextResponse.json(
        {
          error: "Failed to scrape contest details",
          message: "No markdown content in response",
        },
        { status: 400 }
      );
    }

    // Debug: Log markdown sample to understand format
    console.log("Contest markdown sample (first 1000 chars):", scrapeResult2.markdown.substring(0, 1000));
    
    const contestDetails = parseContestData(scrapeResult2.markdown);
    
    console.log("Parsed participants count:", contestDetails.participants.length);
    if (contestDetails.participants.length === 0) {
      console.log("No participants found. Full markdown:", scrapeResult2.markdown.substring(0, 3000));
    }

    const latest: ContestRanking[] = contestDetails.participants.map(
      (user, index) => ({
        rank: index + 1,
        name: user.username.replace(/\\/g, ""),
        score: Object.keys(user.solvedProblems).length,
      })
    );

    await LatestModel.findOneAndUpdate(
      { name: "latest" },
      {
        $set: {
          results: latest,
          updateTime: new Date(),
        },
      },
      { upsert: true }
    );

    let leaderboardRankings: LeaderboardUser[] = existingData?.rankings || [];

    latest.forEach(({ name, score }) => {
      const existingUser = leaderboardRankings.find(
        (user) => user.name === name
      );
      if (existingUser) {
        existingUser.score += score;
        existingUser.consistency += 1;
      } else {
        leaderboardRankings.push({ name, score, consistency: 1 });
      }
    });

    leaderboardRankings.sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      if (b.consistency !== a.consistency) return b.consistency - a.consistency;
      return (a.rank || 0) - (b.rank || 0);
    });

    leaderboardRankings.forEach((user, index) => {
      user.rank = index + 1;
    });

    await LeaderboardModel.findOneAndUpdate(
      { name: "leaderboard" },
      {
        $set: {
          rankings: leaderboardRankings,
          updatedAt: new Date(),
          lastContestCode: latestContestId,
        },
      },
      { upsert: true }
    );

    return NextResponse.json(
      {
        message: "Leaderboard updated successfully",
        data: {
          latestContestId,
          latestContestTitle: contestDetails.title,
          latestContestBeginTime: contestDetails.beginTime,
          latestContestEndTime: contestDetails.endTime,
          latestContestDuration: contestDetails.duration,
          latestContestStatus: contestDetails.status,
          lastContestCode: latestContestId,
        },
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("Error during scraping:", error);
    return NextResponse.json(
      {
        error: "Failed to update leaderboard",
        details: error.message,
      },
      { status: 500 }
    );
  }
}


/**
 * @swagger
 * /api/hustle/fetch:
 *   get:
 *     summary: Fetches the latest and leaderboard data from the database.
 *     description: Fetches the latest contest results and leaderboard rankings from the database.
 *     tags:
 *      - Hustle
 *     responses:
 *       200:
 *         description: Successfully fetched hustle data
 *       500:
 *         description: Error while fetching data from the database.
 */
export async function GET() {
  const dynamic = "force-dynamic";
  try {
    await connectMongoDB();
    const latestDoc = await LatestModel.findOne({ name: "latest" });
    const leaderboardDoc = await LeaderboardModel.findOne({
      name: "leaderboard",
    });

    return new Response(
      JSON.stringify({
        message: "Fetched hustle data successfully",
        data: {
          latest: latestDoc,
          leaderboard: leaderboardDoc,
        },
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error: any) {
    console.error("Database error:", error);
    return NextResponse.json(
      {
        error: "Failed to fetch hustle data",
        details: error.message,
      },
      { status: 500 }
    );
  }
}
