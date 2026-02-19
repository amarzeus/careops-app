# Architecture Overview — CareOps

## System Architecture

CareOps is a **monolithic Next.js 16 application** using the App Router, deployed on Render. It follows a server-first architecture where the majority of business logic, data access, and AI calls happen in API Route Handlers.

```
┌─────────────────────────────────────────────────────────────┐
│                         Browser                             │
│   Next.js 16 App Router (React 19 + Server Components)      │
└──────────────────────┬──────────────────────────────────────┘
                       │ HTTP / fetch
┌──────────────────────▼──────────────────────────────────────┐
│              API Route Handlers (/api/*)                    │
│   Auth │ Bookings │ Inventory │ AI │ Automation │ VAPI      │
└───┬────────────┬──────────────┬──────────────┬─────────────┘
    │            │              │              │
┌───▼───┐  ┌────▼────┐  ┌──────▼──────┐ ┌────▼──────┐
│Prisma │  │ Gemini  │  │   Twilio    │ │  Vapi.ai  │
│  ORM  │  │  2.0    │  │ SMS/WhatsApp│ │  Voice AI │
└───┬───┘  └─────────┘  └─────────────┘ └───────────┘
    │
┌───▼───────────────┐
│  PostgreSQL (Prod) │
│  SQLite (Dev)      │
└───────────────────┘
```

## Directory Structure

```
careops-app/
├── prisma/                   # Database schema, migrations, seed scripts
│   ├── schema.prisma         # PostgreSQL schema
│   ├── schema.sqlite.prisma  # SQLite schema (dev)
│   └── seed.ts               # Demo data seeder
├── public/                   # Static assets, ads.txt
├── src/
│   ├── app/
│   │   ├── (auth)/           # Login, Register pages (unauthenticated)
│   │   ├── (dashboard)/      # Protected business dashboard pages
│   │   ├── (public)/         # Public pages: privacy, terms, faq, cookies
│   │   ├── api/              # All API Route Handlers
│   │   │   ├── ai/           # Gemini AI endpoints
│   │   │   ├── auth/         # Authentication endpoints
│   │   │   ├── booking/      # Booking CRUD + calendar sync
│   │   │   ├── inventory/    # Inventory CRUD
│   │   │   ├── automation/   # Scheduler and messaging automation
│   │   │   └── voice/        # Vapi webhook handlers
│   │   ├── layout.tsx        # Root layout with SEO metadata
│   │   ├── sitemap.ts        # Dynamic XML sitemap
│   │   ├── robots.ts         # robots.txt
│   │   └── manifest.ts       # PWA manifest
│   ├── components/
│   │   ├── ui/               # Radix UI + shadcn components
│   │   ├── layout/           # Header, Sidebar, Shell
│   │   ├── bookings/         # Booking-specific components
│   │   ├── inventory/        # Inventory-specific components
│   │   ├── dashboard/        # Dashboard widgets
│   │   └── providers/        # ThemeProvider, VoiceProvider
│   ├── lib/
│   │   ├── auth.ts           # JWT auth helpers
│   │   ├── prisma.ts         # Prisma client singleton
│   │   ├── vapi.ts           # Vapi SDK wrapper
│   │   └── automation.ts     # Messaging automation logic
│   └── types/
│       └── dto.ts            # Shared TypeScript DTOs
└── tests/
    ├── unit/                 # Vitest unit tests
    └── e2e/                  # Playwright E2E tests
```

## Authentication

CareOps uses a custom JWT-based authentication system:

1. **Registration / Login**: Email + bcrypt-hashed password stored in PostgreSQL.
2. **Google OAuth**: OAuth 2.0 flow for Google Sign-In and Google Calendar access. Tokens stored encrypted in DB.
3. **Session**: JWT stored in an HttpOnly cookie.

## AI Architecture

All AI calls go through dedicated API routes:

| Route | Model | Purpose |
|---|---|---|
| `/api/ai/onboarding` | `gemini-2.0-flash` | Interactive onboarding assistant |
| `/api/ai/inventory-forecast` | `gemini-2.0-flash` | Predict stock depletion |
| `/api/ai/inventory/scan` | `gemini-2.0-flash` (vision) | Extract items from invoice images |
| `/api/ai/smart-reply` | `gemini-2.0-flash` | Generate contextual message replies |
| `/api/voice` | Vapi.ai | Outbound call webhooks |

## Data Flow: Booking Created

```
User creates booking in UI
  → POST /api/booking
  → Prisma: create Booking record
  → Google Calendar API: create event
  → Nodemailer: send confirmation email
  → Twilio: send SMS confirmation
  → Vapi: schedule outbound reminder call (24h before)
```

## Deployment

- **Platform:** Render (see `render.yaml`)
- **Database:** Managed PostgreSQL on Render
- **Environment:** All secrets via environment variables (never committed)
- **Build:** `prisma generate && next build`
- **CI:** GitHub Actions (`.github/workflows/`)
