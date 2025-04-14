# Newsletter Topic Election System

This system manages a daily newsletter with a topic voting system. Each day, a new newsletter is sent and voting begins for the next one.

## Key Features

1. **Topic Election System**:
   - Each election presents 3 randomly selected topics
   - Topics can participate in a maximum of 3 elections
   - Once a topic wins, it is published and excluded from future elections

2. **Database Schema**:
   - `NewsletterTopic` model tracks elections a topic has participated in
   - `TopicStatus` enum: SUGGESTED, VOTING, PUBLISHED, ARCHIVED
   - Topics move through these statuses during their lifecycle

## How It Works

1. **Daily Process**:
   - Current newsletter is sent to subscribers
   - Winning topic is marked as PUBLISHED
   - 3 new topics are selected for the next election
   - Subscriber votes are collected for the next 24 hours

2. **Topic Selection Rules**:
   - Topics are randomly selected from eligible candidates
   - Eligible topics must have participated in fewer than 3 elections
   - Topics marked as PUBLISHED are excluded from selection

## API Endpoints

- `/api/ai-newsletter` - Sends the newsletter and starts a new election cycle if needed
- `/api/newsletter/new-election` - Manually triggers a new election cycle

## Testing the System

1. Seed the database with test topics:
   ```
   npx ts-node scripts/seed-newsletter-topics.ts
   ```

2. View current election topics:
   ```
   curl http://localhost:3000/api/newsletter/topics
   ```

3. Manually trigger a new election:
   ```
   curl -X POST http://localhost:3000/api/newsletter/new-election
   ```

4. Send a test newsletter:
   ```
   curl -X POST http://localhost:3000/api/ai-newsletter
   ```

## External Scheduling

To set up the system to send newsletters daily at 6am:

1. **Using cron on Linux/Mac**:
   ```
   0 6 * * * curl -X POST http://your-domain/api/ai-newsletter
   ```

2. **Using Windows Task Scheduler**:
   - Create a new task that runs daily at 6am
   - Action: Start a program
   - Program/script: `curl.exe -X POST http://your-domain/api/ai-newsletter`

3. **Using a serverless function**:
   - Set up a cloud function (AWS Lambda, GCP Cloud Functions, etc.)
   - Configure it to run daily at 6am
   - Make it call the `/api/ai-newsletter` endpoint 