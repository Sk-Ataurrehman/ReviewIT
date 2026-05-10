# ReviewIT — AI-Powered GitHub Code Review Bot

ReviewIT is a GitHub App that automatically reviews pull requests using AI. When a PR is opened or updated, ReviewIT fetches the diff, analyzes it for bugs, security vulnerabilities, and performance issues, and posts inline review comments directly on the PR — all within seconds.

Built as a deep-dive learning project to understand event-driven architecture, async job processing, GitHub App authentication, and LLM integration in a real production-like system.

---

## How It Works

1. A pull request is opened or updated on a GitHub repository where ReviewIT is installed
2. GitHub fires a webhook to the ReviewIT server
3. The server verifies the webhook signature and queues a review job
4. A background worker picks up the job, fetches the PR diff via GitHub API
5. The diff is sent to Groq's Llama 3.3 70B model with a structured prompt
6. The AI response is parsed and posted back as inline review comments on the PR
7. The review is saved to PostgreSQL for history and deduplication

---

## Tech Stack

| Layer | Technology |
|---|---|
| Server | Node.js, TypeScript, Express |
| Job Queue | BullMQ + Redis (Memurai on Windows) |
| AI / LLM | Groq API — Llama 3.3 70B Versatile |
| GitHub Integration | GitHub App, @octokit/rest, @octokit/auth-app |
| Database | PostgreSQL + Prisma ORM |
| Dev Tooling | tsx, ngrok |

---

## Features

- **Webhook signature verification** — HMAC-SHA256 validation on every incoming request using Node's built-in `crypto` module
- **GitHub App authentication** — short-lived installation tokens per request, no static personal access tokens
- **Async job processing** — BullMQ queue with exponential backoff retries, concurrency control, and graceful shutdown
- **Duplicate prevention** — DB-level unique constraint on `repo + PR number + commit SHA` prevents re-reviewing the same commit twice
- **Review lifecycle tracking** — every review is stored in PostgreSQL with status (`PENDING → PROCESSING → COMPLETED / FAILED / SKIPPED`), token usage, duration, and error messages
- **Diff truncation** — large diffs are capped at 20,000 characters before sending to the LLM to stay within rate limits
- **Rate limiting** — 30 requests per 15 minutes per IP on the webhook endpoint
- **Health check endpoint** — verifies live Redis and PostgreSQL connectivity

---

## Project Structure

```
src/
├── libs/               # Infrastructure clients (Prisma, Redis, GitHub Auth)
├── prompts/            # LLM prompt templates
├── queues/             # BullMQ queue definitions
├── routes/             # Express route handlers
├── services/           # GitHub API and Groq API service layers
├── types/              # Shared TypeScript types
└── workers/            # BullMQ job processors
prisma/
└── schema.prisma       # Database schema
```

---

## Getting Started

### Prerequisites

- Node.js 18+
- PostgreSQL
- Redis (or Memurai on Windows)
- A GitHub App with Pull Requests (Read & Write) and Contents (Read) permissions
- A Groq API key (free at console.groq.com)
- ngrok (for local webhook testing)

### Setup

1. Clone the repository

```bash
git clone https://github.com/Sk-Ataurrehman/ReviewIT.git
cd ReviewIT
```

2. Install dependencies

```bash
npm install
```

3. Create a `.env` file at the root:

```env
PORT=3000
DATABASE_URL=postgresql://user:password@localhost:5432/reviewit
REDIS_URL=redis://localhost:6379
WEBHOOK_SECRET=your_github_webhook_secret
GITHUB_APP_ID=your_github_app_id
GITHUB_PRIVATE_KEY_PATH=./your-app.private-key.pem
GROQ_API_KEY=your_groq_api_key
```

4. Run database migrations

```bash
npm run db:migrate
```

5. Start the development server

```bash
npm run dev
```

6. Expose your local server with ngrok

```bash
ngrok http 3000
```

7. Install the github app on a repository

---

## API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| POST | `/webhook` | Receives GitHub PR events |
| GET | `/health` | Returns server, Redis, and DB health status |
| GET | `/reviews/:owner/:repo/:prNumber` | Returns the latest review for a PR |

---