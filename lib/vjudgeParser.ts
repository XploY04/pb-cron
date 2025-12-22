/**
 * Utility functions for parsing VJudge contest data from markdown
 */

export interface VJudgeContest {
  id: string;
  title: string;
  beginTime: string;
  length: string;
  owner: string;
}

/**
 * Safely extracts text from markdown links [text](url) or returns the original text
 * @param text The text that might contain markdown links
 * @returns The extracted text without markdown formatting
 */
function extractTextFromMarkdown(text: string | undefined): string {
  if (!text) return "";

  // Try to match [text](url) pattern or [text] pattern
  const linkMatch = text.match(/\[(.*?)\](?:\(.*?\))?/);
  return linkMatch ? linkMatch[1] : text;
}

/**
 * Parses the markdown table from VJudge to extract contest information
 * @param markdown The markdown string from VJudge
 * @returns Array of contest objects with parsed information
 */
export function parseVJudgeContests(markdown: string): VJudgeContest[] {
  const contests: VJudgeContest[] = [];

  try {
    if (!markdown) {
      console.warn("No markdown content provided to parse");
      return [];
    }

    // Find the table rows - looks for lines that start with | followed by numbers (contest IDs)
    const rows = markdown.match(/\|\s*\d+\s*\|.*\|/g);

    if (!rows) {
      console.warn("No table rows found in the markdown");
      return [];
    }

    for (const row of rows) {
      try {
        const columns = row.split("|").map((col) => col.trim());

        if (columns.length >= 8) {
          const id = columns[1] || "";

          const title = extractTextFromMarkdown(columns[3]);

          // Extract begin time - find the date pattern in the string (column 5)
          let beginTime = "";
          if (columns[5]) {
            const dateMatch = columns[5].match(
              /(\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2})/
            );
            beginTime = dateMatch ? dateMatch[1] : columns[5];
          }

          const length = columns[6] || "";

          
          const owner = extractTextFromMarkdown(columns[7]);

          contests.push({
            id,
            title,
            beginTime,
            length,
            owner,
          });
        } else {
          console.warn(`Skipping row with insufficient columns (${columns.length}): ${row}`);
        }
      } catch (rowError) {
        console.error("Error processing row:", rowError);
        // Continue with the next row
      }
    }
  } catch (error) {
    console.error("Error parsing VJudge contests:", error);
  }

  return contests;
}

/**
 * Gets the latest contest ID from the parsed contests
 * @param contests Array of VJudgeContest objects
 * @returns The ID of the latest contest or null if no contests are available
 */
export function getLatestContestId(contests: VJudgeContest[]): string | null {
  if (!contests || contests.length === 0) {
    return null;
  }

  // The first contest in the array is typically the latest one
  return contests[0].id;
}
