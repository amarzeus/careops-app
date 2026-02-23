# Changelog

All notable changes to CareOps will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [Unreleased]

### Added

- Google AdSense readiness: `ads.txt`, AdSense script, cookie policy page
- FAQ page with structured content for SEO
- Full Open Graph + Twitter Card metadata across all pages
- Dynamic `sitemap.xml` and `robots.txt` via Next.js App Router
- PWA web app manifest
- Schema.org JSON-LD structured data on landing page
- GitHub community health files: `CONTRIBUTING.md`, `CODE_OF_CONDUCT.md`, `SECURITY.md`
- GitHub issue and PR templates
- Architecture, API, and deployment documentation under `docs/`

---

## [0.1.0] — 2026-02-14

### Added

- Initial public hackathon release of CareOps
- Unified dashboard: bookings, leads, forms, inventory, inbox, automation
- Google Gemini 2.0 AI integration (onboarding assistant, inventory forecast, smart reply)
- Vapi.ai voice AI receptionist for outbound appointment reminders
- Twilio SMS / WhatsApp messaging hub
- Google Calendar two-way sync
- Nodemailer SMTP for intake forms and vendor alerts
- Google OAuth authentication
- Dark mode via `next-themes`
- Invoice scanning via Gemini multimodal API
- Playwright E2E test suite + Vitest unit tests
- Docker + Render deployment support
- Pre-seeded demo workspace (Zeus Wellness Center)

[Unreleased]: https://github.com/amarzeus/careops-app/compare/v0.1.0...HEAD
[0.1.0]: https://github.com/amarzeus/careops-app/releases/tag/v0.1.0
