# Deployment Guide — CareOps

## Prerequisites

- Node.js 20+
- PostgreSQL 15+ (production) or SQLite (local dev)
- A Render account (or any Node.js-compatible host)
- Environment variables from `.env.example`

---

## Local Development

```bash
# 1. Clone and install
git clone https://github.com/amarzeus/careops-app.git
cd careops-app
npm install

# 2. Configure environment
cp .env.example .env
# Fill in all required values in .env

# 3. Push database schema (SQLite for local dev)
npx prisma db push --schema=prisma/schema.sqlite.prisma

# 4. Seed demo data
npm run db:seed

# 5. Start dev server
npm run dev
# App runs at http://localhost:3000
```

---

## Production Deployment on Render

CareOps ships with a `render.yaml` Blueprint for one-click deployment.

### Steps

1. Fork or push the repository to GitHub.
2. In the Render dashboard, click **New → Blueprint** and connect your repository.
3. Render will read `render.yaml` and provision:
   - A **Web Service** running the Next.js app
   - A **PostgreSQL** managed database
4. Add all required environment variables in the Render dashboard under **Environment**.
5. Deploy. Render will run `npm run build` (which includes `prisma generate`) and start the app.

### Required Environment Variables

| Variable | Description |
|---|---|
| `DATABASE_URL` | PostgreSQL connection string (auto-set by Render if using managed DB) |
| `JWT_SECRET` | Random secret for signing JWT tokens |
| `GEMINI_API_KEY` | Google Gemini API key |
| `GOOGLE_CLIENT_ID` | Google OAuth client ID |
| `GOOGLE_CLIENT_SECRET` | Google OAuth client secret |
| `TWILIO_ACCOUNT_SID` | Twilio account SID |
| `TWILIO_AUTH_TOKEN` | Twilio auth token |
| `TWILIO_PHONE_NUMBER` | Twilio phone number |
| `VAPI_API_KEY` | Vapi.ai API key |
| `EMAIL_HOST` | SMTP host |
| `EMAIL_PORT` | SMTP port (587) |
| `EMAIL_USER` | SMTP username |
| `EMAIL_PASS` | SMTP password |
| `EMAIL_FROM` | From address for outbound emails |
| `NEXT_PUBLIC_APP_URL` | Production URL (e.g. `https://careops-app.onrender.com`) |

---

## Docker

A `Dockerfile` and `docker-compose.yml` are included for containerised deployment.

```bash
# Build and run with Docker Compose
docker-compose up --build
```

The compose file starts:
- `app` — the Next.js application
- `db` — a PostgreSQL container

---

## Database Migrations

```bash
# Apply migrations (production)
npx prisma migrate deploy

# Push schema without migrations (dev/SQLite)
npx prisma db push

# Reset and reseed (dev only)
npx prisma migrate reset
npm run db:seed
```

---

## CI/CD

GitHub Actions workflow (`.github/workflows/ci.yml`) runs on every push and PR to `main`:

1. Install dependencies
2. Run ESLint
3. Run Vitest unit tests
4. Build the Next.js app

Deployments to Render are triggered automatically on pushes to `main` via Render's GitHub integration.
