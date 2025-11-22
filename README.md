# PB Hustle Leaderboard

A competitive programming leaderboard system that tracks and displays contest results from VJudge. The application automatically scrapes contest data, maintains cumulative rankings, and provides a real-time dashboard for participants.

## Overview

PB Hustle is a Next.js-based web application designed to manage and display programming contest leaderboards. It integrates with VJudge to automatically fetch contest results, calculate cumulative scores, and present rankings through an intuitive user interface.

## Features

- **Automated Contest Tracking**: Scrapes VJudge contest data using FireCrawl API
- **Real-time Leaderboard**: Displays current contest results and overall rankings
- **Cumulative Scoring**: Tracks participant performance across multiple contests
- **Consistency Metrics**: Measures participant engagement over time
- **Responsive UI**: Modern interface built with React, Tailwind CSS, and Framer Motion
- **MongoDB Integration**: Persistent storage for contest history and rankings

## Technology Stack

- **Framework**: Next.js 15.3.1 with React 19
- **Language**: TypeScript 5
- **Styling**: Tailwind CSS 4
- **Database**: MongoDB with Mongoose ODM
- **Web Scraping**: FireCrawl JS
- **UI Components**: Lucide React icons, Framer Motion animations

## Prerequisites

- Node.js 20 or higher
- MongoDB database instance
- FireCrawl API key

## Installation

1. Clone the repository:
```bash
git clone https://github.com/XploY04/pb-cron.git
cd pb-cron
```

2. Install dependencies:
```bash
npm install
```

3. Create environment variables file:
```bash
# Create .env.local file with the following variables
MONGODB_URI=your_mongodb_connection_string
FIRECRAWL_API_KEY=your_firecrawl_api_key
```

4. Run the development server:
```bash
npm run dev
```

5. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Environment Variables

The application requires the following environment variables:

- `MONGODB_URI`: MongoDB connection string for database access
- `FIRECRAWL_API_KEY`: API key for FireCrawl web scraping service

## API Endpoints

### GET /api/hustle

Retrieves the latest contest results and overall leaderboard rankings from the database.

**Response:**
```json
{
  "message": "Fetched hustle data successfully",
  "data": {
    "latest": {
      "name": "latest",
      "results": [
        {
          "rank": 1,
          "name": "username",
          "score": 5
        }
      ],
      "updateTime": "2024-01-01T00:00:00.000Z"
    },
    "leaderboard": {
      "name": "leaderboard",
      "rankings": [
        {
          "rank": 1,
          "name": "username",
          "score": 15,
          "consistency": 3
        }
      ],
      "lastContestCode": "123456",
      "updatedAt": "2024-01-01T00:00:00.000Z"
    }
  }
}
```

### POST /api/hustle

Scrapes the latest contest data from VJudge and updates the leaderboard.

**Response:**
```json
{
  "message": "Leaderboard updated successfully",
  "data": {
    "latestContestId": "123456",
    "latestContestTitle": "Contest Name",
    "latestContestBeginTime": "2024-01-01 00:00:00",
    "latestContestEndTime": "2024-01-01 03:00:00",
    "latestContestDuration": "3:00:00",
    "latestContestStatus": "Ended",
    "lastContestCode": "123456"
  }
}
```

## Project Structure

```
pb-cron/
├── app/
│   ├── api/
│   │   └── hustle/
│   │       └── route.ts        # API routes for data fetching and updates
│   ├── page.tsx                # Main dashboard page
│   ├── layout.tsx              # Root layout component
│   └── globals.css             # Global styles
├── components/
│   └── loading-brackets.tsx    # Loading animation component
├── lib/
│   ├── dbConnect.ts            # MongoDB connection utility
│   ├── leaderboard.ts          # Contest data parsing utilities
│   └── vjudgeParser.ts         # VJudge contest list parsing
├── models/
│   └── PbHustel.ts             # MongoDB schemas and models
└── public/                     # Static assets
```

## Development

### Available Scripts

- `npm run dev`: Start development server
- `npm run build`: Create production build
- `npm run start`: Start production server
- `npm run lint`: Run ESLint code quality checks

### Database Schema

**Latest Collection**:
- `name`: Document identifier (always "latest")
- `results`: Array of contest results with rank, name, and score
- `updateTime`: Timestamp of last update

**Leaderboard Collection**:
- `name`: Document identifier (always "leaderboard")
- `rankings`: Array of cumulative rankings with rank, name, score, and consistency
- `lastContestCode`: ID of the last processed contest
- `updatedAt`: Timestamp of last update

## Deployment

### Vercel Deployment

The application is optimized for deployment on Vercel:

1. Push your code to a Git repository
2. Import the project in Vercel dashboard
3. Configure environment variables
4. Deploy

### Manual Deployment

1. Build the production bundle:
```bash
npm run build
```

2. Start the production server:
```bash
npm start
```

## Contributing

Contributions are welcome. Please ensure code follows the project's ESLint configuration and includes appropriate documentation.

## License

This project does not currently have a specified license. Please contact the repository owner for usage permissions.
