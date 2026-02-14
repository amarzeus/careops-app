# CareOps - Unified Operations Platform

> [!IMPORTANT]
> **Live Site:** [https://careops-app.onrender.com](https://careops-app.onrender.com)
> 🚀 Built for the **CareOps Hackathon 2026**

CareOps is a comprehensive operations platform for service-based businesses that consolidates leads, bookings, communications, forms, and inventory into a single unified system. Stop juggling 6+ tools and start operating smarter.

## ✨ Premium UI & Experience

CareOps features a state-of-the-art, high-conversion landing page and dashboard designed for the modern web:
- **Glassmorphism Design**: Frosted glass effects and smooth backdrops.
- **Micro-animations**: Subtle hover states and interactive elements that make the app feel alive.
- **Dynamic Gradients**: Rich, modern color palettes (Blue-Indigo-Rose).
- **Responsive Layout**: Seamless experience from mobile to desktop.

## 🛠️ Unified Core Features

### 1. Unified Inbox
Communicate with your customers via **Email** and **SMS** from a single interface. All conversations are threaded per contact, with full history and AI-powered reply suggestions.
*(Note: WhatsApp integration has been removed to simplify and streamline core communication flows.)*

### 2. Smart Booking System
Public booking pages with real-time availability. Automated confirmations and reminders ensure you never miss a lead or an appointment.
- **Google Calendar Sync**: Two-way synchronization with your existing calendar.

### 3. Inventory & Resource Management
Track supplies and resources used per booking. Set thresholds and receive **Low-Stock Alerts** automatically.
- **Auto-Deduction**: Inventory is automatically updated when bookings are completed.

### 4. Dynamic Forms & Intake
Create custom contact and intake forms. Automated sending based on booking events ensures all necessary information is captured without manual follow-up.

### 5. AI-Powered Insights
Leverage the power of **Google Gemini AI** to generate insights, draft messages, and automate business logic.

---

## 📚 Documentation Center

Explore our detailed specialized guides:

### 🚀 Getting Started
- [**Developer Quickstart**](docs/DEVELOPER_QUICKSTART.md): Set up your local environment in minutes.
- [**Local Development**](docs/LOCAL_DEVELOPMENT.md): Detailed local configuration and Prisma setup.

### 🌐 Deployment & Setup
- [**Deployment Guide**](docs/DEPLOYMENT_GUIDE.md): Instructions for Render, Docker, and more.
- [**Google Auth Setup**](docs/GOOGLE_AUTH_SETUP.md): **CRITICAL** steps for whitelisting URLs in Google Cloud Console.
- [**Webhooks Guide**](docs/webhooks_guide.md): Integrate CareOps with your existing tools.

### 🛠️ Maintenance & Fixes
- [**Email & SMS Restoration**](docs/EMAIL_SMS_FIX.md): Details on the communication layer fixes.
- [**Prisma 6 & Render Deep Dive**](docs/RENDER_DEEP_DIVE_FIX.md): Technical overview of the platform's stability improvements.

---

## 💻 Tech Stack

- **Framework**: [Next.js 16](https://nextjs.org/) (App Router, Turbopack)
- **Database**: [PostgreSQL](https://www.postgresql.org/) with [Prisma 6](https://www.prisma.io/)
- **Authentication**: Custom OAuth + OTP support
- **Styling**: [Tailwind CSS](https://tailwindcss.com/) + [Radix UI](https://www.radix-ui.com/)
- **Communication**: [Twilio](https://www.twilio.com/) (SMS), [Resend](https://resend.com/) (Email/SMTP)
- **AI**: [Google Gemini](https://deepmind.google/technologies/gemini/)
- **Hosting**: [Render](https://render.com/)

## 🚀 Quick Install

```bash
# 1. Install dependencies
npm install

# 2. Environment Setup
cp .env.example .env
# Edit .env with your credentials

# 3. Database Initialization
npx prisma generate
npx prisma db push

# 4. Start Development
npm run dev
```

## 🧪 Testing

```bash
# Unit tests
npm run test:unit

# E2E tests
npm run test:e2e
```

## 🎖️ Awards & Certification
Built for the **CareOps Hackathon 2026**. This project represents a complete, production-ready MVP for service operations.

---
**License:** MIT
