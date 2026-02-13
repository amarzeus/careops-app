# CareOps Test Suite

## Setup

1. Install dependencies: `npm install`
2. Ensure `.env` is configured (copy from `.env.example`).

## Running Tests

- **Run all E2E tests:** `npm run test:e2e`
- **Run with UI:** `npm run test:e2e:ui`
- **Run specific test:** `npx playwright test tests/e2e/smoke.spec.ts`

## Architecture

- **Fixtures:** `tests/support/fixtures/base.ts` - Shared setup logic.
- **E2E Tests:** `tests/e2e/` - Full user journey tests.

## Best Practices

- **Network-First:** Wait for network responses (`page.waitForResponse`) instead of arbitrary timeouts.
- **Isolation:** Tests should not depend on each other. Use fixtures to seed data.
- **Selectors:** Use `data-testid` or user-facing locators (role, text).
