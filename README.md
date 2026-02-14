# CareOps - Unified Operations Platform

A comprehensive operations platform for service-based businesses that consolidates leads, bookings, communications, forms, and inventory into a single unified system.

## Overview

CareOps replaces the chaos of disconnected tools used by service businesses. Instead of juggling multiple applications for leads, bookings, email, SMS, forms, and inventory, CareOps provides a single dashboard where businesses can see, act, and operate clearly.

## Features

### 1. Business Onboarding

- **Workspace Setup**: Create workspace with business name, address, timezone, and contact info
- **Communication Channels**: Connect email (SMTP) and SMS (Twilio) integration
- **Contact Forms**: Public-facing forms that create contacts and start conversations automatically
- **Service Configuration**: Define services/meetings with duration, availability, and location
- **Post-Booking Forms**: Attach intake forms, agreements, and documents to booking types
- **Inventory Management**: Track items/resources used per booking with low-stock alerts
- **Staff Management**: Invite staff with granular permissions (inbox, bookings, forms, inventory)
- **Workspace Activation**: System validates configuration before allowing public access

### 2. Customer Inquiries & Contact Management

- Public contact form submission creates Contact + Conversation automatically
- Welcome messages sent via email/SMS/WhatsApp based on availability
- Contact source tracking and notes
- Complete contact history

### 3. Booking System

- Public booking page with real-time availability
- Service duration and availability configuration
- Booking status tracking (Pending → Confirmed → Completed)
- Inventory blocking - prevents overbooking when inventory is insufficient
- Google Calendar integration for sync
- Automated confirmation messages

### 4. Communication Hub (Inbox)

- Unified inbox for all customer communications
- Multi-channel support: Email, SMS, WhatsApp
- Conversation threading per contact
- Automated messages triggered by events
- Staff reply detection pauses automation temporarily

### 5. Forms & Intake

- Custom intake forms linked to services
- Form submission tracking (Pending → Sent → Completed)
- Due date management
- Automated form sending after booking

### 6. Inventory Management

- Track items/resources used per booking
- Quantity and threshold configuration
- Automatic inventory deduction on booking completion
- Low-stock alerts
- Full audit history with changes tracked

### 7. Dashboard & Analytics

- Real-time booking overview
- Key metrics: today's bookings, pending confirmations, form completion rates
- Low stock alerts visibility
- Quick action items

### 8. Automation System

Triggers:
- **NEW_CONTACT**: When new contact is created
- **BOOKING_CREATED**: When a booking is made
- **BEFORE_BOOKING**: Reminder before appointment
- **FORM_PENDING**: When form is awaiting completion
- **INVENTORY_LOW**: When stock falls below threshold
- **STAFF_REPLY**: When staff replies to a conversation

Features:
- Delay support for scheduled automation
- Channel selection (Email → WhatsApp → SMS fallback)
- Auto-pause on staff reply with 24-hour auto-resume

### 9. Webhooks

- HTTP webhook subscriptions for external integrations
- HMAC signature verification for security
- Event types: NEW_CONTACT, BOOKING_CREATED, BEFORE_BOOKING, FORM_PENDING, INVENTORY_LOW
- Delivery logging with retry queue
- Manual retry capability
- Exponential backoff for failed deliveries

### 10. API & Integrations

- RESTful API for all resources
- Public API endpoints for contact forms and bookings
- Rate limiting on public endpoints
- Webhook delivery system

## Tech Stack

- **Framework**: Next.js 16 (App Router)
- **Database**: PostgreSQL with Prisma ORM
- **Authentication**: Custom token-based with OTP support
- **Styling**: Tailwind CSS + Radix UI components
- **Testing**: Vitest (unit) + Playwright (E2E)
- **SMS**: Twilio
- **Email**: Nodemailer (SMTP)
- **AI**: Google Gemini for message generation

## Project Structure

```
careops-app/
├── prisma/
│   └── schema.prisma          # Database schema
├── src/
│   ├── app/                   # Next.js App Router
│   │   ├── (dashboard)/       # Protected dashboard routes
│   │   ├── api/               # API routes
│   │   │   ├── auth/          # Authentication endpoints
│   │   │   ├── booking/       # Booking management
│   │   │   ├── contact/       # Contact management
│   │   │   ├── workspace/     # Workspace configuration
│   │   │   ├── public/        # Public endpoints
│   │   │   ├── automation/    # Automation cron jobs
│   │   │   ├── webhooks/      # Webhook management
│   │   │   └── inventory/     # Inventory management
│   │   ├── onboarding/        # Onboarding flow
│   │   └── login/             # Authentication pages
│   ├── components/            # React components
│   │   └── ui/                # Reusable UI components
│   ├── lib/                   # Core libraries
│   │   ├── prisma.ts          # Database client
│   │   ├── automation.ts      # Automation engine
│   │   ├── email.ts           # Email service
│   │   ├── sms.ts             # SMS service
│   │   ├── twilio.ts          # Twilio integration
│   │   ├── whatsapp.ts        # WhatsApp integration
│   │   ├── gemini.ts          # AI message generation
│   │   ├── google-calendar.ts # Calendar sync
│   │   ├── date-utils.ts      # Timezone utilities
│   │   ├── rate-limiter.ts    # Rate limiting
│   │   ├── webhook-security.ts # HMAC signatures
│   │   ├── webhook-retry.ts   # Retry queue
│   │   └── inventory-log.ts   # Audit logging
│   └── types/                  # TypeScript types
├── tests/
│   ├── e2e/                   # Playwright E2E tests
│   ├── unit/                  # Vitest unit tests
│   └── support/               # Test fixtures
├── public/                    # Static assets
└── package.json
```

## Getting Started

### Prerequisites

- Node.js 18+
- PostgreSQL database
- npm or yarn

### Installation

```bash
# Install dependencies
npm install

# Generate Prisma client
npx prisma generate

# Push database schema
npx prisma db push

# (Optional) Seed database
npm run db:seed
```

### Environment Variables

Create a `.env` file based on `.env.example`:

```env
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/careops"

# App
NEXT_PUBLIC_APP_URL="http://localhost:5000"

# Email (SMTP)
SMTP_HOST=""
SMTP_PORT=""
SMTP_USER=""
SMTP_PASS=""
SMTP_FROM=""

# SMS (Twilio)
TWILIO_ACCOUNT_SID=""
TWILIO_AUTH_TOKEN=""
TWILIO_PHONE_NUMBER=""

# WhatsApp (Twilio)
TWILIO_WHATSAPP_NUMBER=""

# Google Calendar
GOOGLE_CLIENT_ID=""
GOOGLE_CLIENT_SECRET=""

# AI
GEMINI_API_KEY=""
```

### Development

```bash
# Start development server
npm run dev

# Run linting
npm run lint

# Run type checking
npx tsc --noEmit
```

### Testing

```bash
# Run unit tests
npm run test:unit
# or
npx vitest run

# Run E2E tests
npm run test:e2e
# or
npx playwright test

# Run E2E tests with UI
npm run test:e2e:ui
```

## API Endpoints

### Authentication

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/login` | User login |
| POST | `/api/auth/register` | User registration |
| POST | `/api/auth/logout` | User logout |
| POST | `/api/auth/verify-otp` | OTP verification |
| POST | `/api/auth/forgot-password` | Password reset request |
| POST | `/api/auth/reset-password` | Password reset |

### Public Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/public/contact` | Submit contact form |
| GET | `/api/public/booking/availability` | Check availability |
| POST | `/api/public/booking/create` | Create booking |

### Workspace

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET/POST | `/api/workspace` | Get/update workspace |
| POST | `/api/workspace/validate-activation` | Validate activation requirements |
| POST | `/api/workspace/activate` | Activate workspace |

### Bookings

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET/POST | `/api/bookings` | List/create bookings |
| GET/PATCH/DELETE | `/api/bookings/[id]` | Manage booking |
| POST | `/api/bookings/[id]/confirm` | Confirm booking |
| POST | `/api/bookings/[id]/cancel` | Cancel booking |

### Contacts

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET/POST | `/api/contacts` | List/create contacts |
| GET/PATCH | `/api/contacts/[id]` | Manage contact |

### Services

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET/POST | `/api/services` | List/create services |
| GET/PATCH/DELETE | `/api/services/[id]` | Manage service |

### Inventory

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET/POST | `/api/inventory` | List/create inventory |
| GET/PATCH/DELETE | `/api/inventory/[id]` | Manage item |
| GET | `/api/inventory/[id]/history` | Item history |
| GET/POST | `/api/inventory/history` | All inventory history |

### Webhooks

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET/POST | `/api/webhooks` | List/create webhooks |
| DELETE | `/api/webhooks/[id]` | Delete webhook |
| POST | `/api/webhooks/delivery/[id]/retry` | Retry failed delivery |

### Automation

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET/POST | `/api/automation/rules` | List/create rules |
| PATCH/DELETE | `/api/automation/rules/[id]` | Manage rule |
| POST | `/api/automation/cron` | Cron job endpoint |

## Database Schema

### Core Models

- **User**: Authentication and staff management
- **Workspace**: Business configuration and settings
- **Contact**: Customer information
- **Service**: Booking types with availability
- **Booking**: Appointment records
- **Conversation**: Threaded communications
- **Message**: Individual communications
- **IntakeForm**: Custom forms
- **FormSubmission**: Form completion records
- **InventoryItem**: Stock items
- **InventoryLog**: Audit trail
- **AutomationRule**: Automation triggers
- **Webhook**: External integrations
- **WebhookDeliveryLog**: Delivery history
- **Alert**: System notifications
- **IntegrationLog**: External service logs

## Security Features

- HMAC-signed webhooks for payload verification
- Rate limiting on public endpoints
- Workspace-scoped data isolation
- OTP-based authentication
- Password hashing with bcrypt
- Input validation with Zod

## Testing Strategy

### Unit Tests (Vitest)

- Library functions
- Utility functions
- Data transformations
- Automation logic

### E2E Tests (Playwright)

- Authentication flow
- Onboarding process
- Dashboard functionality
- Booking flow
- Webhook delivery
- RBAC enforcement

## Deployment

### Production Build

```bash
npm run build
```

### Docker

```bash
docker build -t careops-app .
docker run -p 5000:5000 careops-app
```

## CI/CD Pipeline

This project uses **GitHub Actions** for Continuous Integration and Deployment.

### Pipeline Stages

1. **Code Quality** - ESLint and TypeScript type checking
2. **Unit Tests** - Vitest unit tests with coverage
3. **Database Check** - Prisma migration validation
4. **Build** - Next.js production build
5. **E2E Tests** - Playwright end-to-end tests
6. **Security Audit** - npm audit and Snyk scans
7. **Deployment Ready** - Confirms all checks passed

### Deployment

Render automatically deploys when you push to the `main` branch (free tier):

1. **Connect Render to GitHub** (one-time):
   - Go to Render Dashboard → Your Service → Settings
   - Connect your GitHub repository

2. **Push to deploy**:
   ```bash
   git push origin main
   ```

3. **Monitor**: Check Render dashboard for deployment status

### Optional GitHub Secrets

- `SNYK_TOKEN` - Security scanning
- `CODECOV_TOKEN` - Coverage reports
- `SLACK_WEBHOOK_URL` - Notifications

See [CI/CD Documentation](docs/CI_CD.md) for detailed setup.

### Status Badges

```markdown
![CI](https://github.com/yourusername/careops-app/workflows/CI%20Pipeline/badge.svg)
![Tests](https://img.shields.io/badge/tests-passing-brightgreen)
```

## License

MIT
