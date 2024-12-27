# Personal Productivity Monorepo

A collection of productivity tools and bots built with Next.js, Prisma, and TypeScript.

## Projects

### 1. Habit Tracking Bot
A Telegram bot that helps users track their daily habits using Notion as a backend. Features include:
- Creating and managing habits
- Daily habit logging
- Reminders at specified times
- Habit summaries and statistics
- Timezone management

### 2. Quippet Bot
A Telegram bot for collecting and managing quotes. Features include:
- Adding quotes via text or image (using OpenAI for parsing)
- Managing a reading list
- Daily quote reminders
- Quote organization with tags and favorites

### 3. AI Newsletter
A system for managing and distributing AI-related newsletters with:
- Topic voting
- Newsletter generation
- Email distribution via AWS SES

## Tech Stack

- **Frontend**: Next.js with TypeScript
- **Database**: PostgreSQL with Prisma ORM
- **APIs & Integration**:
  - Telegram Bot API
  - Notion API
  - OpenAI API
  - AWS SES
- **Styling**: Tailwind CSS
- **Development**:
  - TypeScript
  - ESLint
  - Environment management with dotenv

## Project Structure
text
.
├── lib/ # Core business logic
│ ├── db/ # Database operations
│ ├── telegram/ # Telegram bot implementations
│ └── util/ # Shared utilities
├── pages/ # Next.js pages and API routes
├── prisma/ # Database schema and migrations
└── scripts/ # Utility scripts

## Cron Jobs

Schedules are made on [Cron-Job.org](https://console.cron-job.org/dashboard)