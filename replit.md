# CareOps App

## Overview
CareOps is an AI-powered operations platform for service businesses. It unifies bookings, leads, forms, inventory, and communication into one intelligent platform.

## Tech Stack
- **Framework**: Next.js 16 with TypeScript
- **Database**: SQLite via Prisma ORM with better-sqlite3 adapter
- **Styling**: Tailwind CSS v4 with Radix UI components
- **AI**: Google Gemini AI integration
- **Communication**: Nodemailer (email), Twilio (SMS)

## Project Structure
- `src/app/` - Next.js App Router pages and API routes
  - `(auth)/` - Authentication pages (login, register, verify-otp)
  - `(dashboard)/` - Protected dashboard pages (bookings, inbox, forms, inventory, etc.)
  - `(public)/` - Public-facing pages (booking, contact forms)
  - `api/` - API route handlers
- `src/components/` - Reusable UI components (layout, ui)
- `src/lib/` - Utility libraries (auth, prisma, email, sms, AI)
- `prisma/` - Prisma schema and seed file
- `public/` - Static assets

## Database
- Uses SQLite with Prisma ORM and better-sqlite3 driver adapter
- Database file: `dev.db` in project root
- Schema defined in `prisma/schema.prisma`
- Push schema: `DATABASE_URL="file:./dev.db" npx prisma db push`
- Seed data: `npm run db:seed`

## Development
- Dev server: `npm run dev` (runs on 0.0.0.0:5000)
- Build: `npm run build`
- Production: `npm run start` (runs on 0.0.0.0:5000)

## Recent Changes
- 2026-02-10: Configured for Replit environment (port 5000, allow all dev origins, server external packages for better-sqlite3)
