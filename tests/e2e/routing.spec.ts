/* eslint-disable @typescript-eslint/no-explicit-any */
import { test, expect } from "@playwright/test";

/**
 * Exhaustive Routing Validation
 * Verifies that all major public and protected routes are accessible and render correctly.
 */

// Use a single worker for this spec to prevent dev server overloading
test.use({ navigationTimeout: 60000, actionTimeout: 60000 });
test.describe.configure({ mode: "serial" });

test.describe("Public Routing Validation", () => {
  const publicRoutes = [
    { path: "/", check: { role: "heading", name: /CareOps|Business|Operations/i } },
    { path: "/login", check: { role: "heading", name: /Sign in|Welcome|Login/i } },
    { path: "/register", check: { role: "heading", name: /Create account|Start for free/i } },
    { path: "/pricing", check: { role: "heading", name: /Pricing|Plan/i } },
    { path: "/terms", check: { role: "heading", name: /Terms/i } },
    { path: "/privacy", check: { role: "heading", name: /Privacy/i } },
    { path: "/faq", check: { role: "heading", name: /Frequently Asked Questions|FAQ/i } },
    { path: "/cookies", check: { role: "heading", name: /Cookie/i } },
    { path: "/contact", check: { role: "heading", name: /Talk|Message|Contact/i } },
  ];

  for (const route of publicRoutes) {
    test(`should access ${route.path}`, async ({ page }) => {
      // Use 'load' for more stability in dev server
      await page.goto(route.path, { waitUntil: "load" });

      // Verify redirection hasn't happened to login (unless intended)
      if (route.path !== "/login" && route.path !== "/register") {
        await expect(page).not.toHaveURL(/login/);
      }

      const { role, name } = route.check;
      await expect(page.getByRole(role as any, { name }).first()).toBeVisible({ timeout: 30000 });
    });
  }
});

test.describe("Protected (Dashboard) Routing Validation", () => {
  let token: string;

  test.beforeAll(async ({ request }) => {
    // Seed a test user with retry logic to handle dev server readiness
    const email = `auth-routing-${Date.now()}@example.com`;
    let success = false;
    let lastError = "";

    for (let i = 0; i < 5; i++) {
      try {
        const seedRes = await request.post("/api/test/seed", {
          data: {
            email,
            name: "Routing Auditor",
            password: "password123",
            status: "ACTIVE",
            onboardingStep: 8,
          },
          timeout: 30000,
        });

        if (seedRes.status() < 400) {
          const data = await seedRes.json();
          token = data.token;
          success = true;
          break;
        } else {
          lastError = `Status ${seedRes.status()}: ${await seedRes.text()}`;
          await new Promise((r) => setTimeout(r, 4000));
        }
      } catch (e: any) {
        lastError = e.message;
        await new Promise((r) => setTimeout(r, 4000));
      }
    }

    if (!success) {
      throw new Error(
        `Auth Seeding failed after retries. Last error: ${lastError.substring(0, 500)}`
      );
    }
  });

  test.beforeEach(async ({ context }) => {
    const baseURL = test.info().project.use.baseURL || "http://localhost:5000";
    await context.addCookies([
      {
        name: "auth-token",
        value: token,
        url: baseURL,
      },
    ]);
  });

  const protectedRoutes = [
    { path: "/dashboard", heading: /Dashboard|Overview/i },
    { path: "/inbox", heading: /Inbox|Messages/i },
    { path: "/bookings", heading: /Bookings|Appointments/i },
    { path: "/contacts", heading: /Contacts|Leads|Clients/i },
    { path: "/forms", heading: /Forms|Intake/i },
    { path: "/inventory", heading: /Inventory|Stock|Products/i },
    { path: "/staff", heading: /Staff|Team|Members/i },
    { path: "/automation", heading: /Automation|Workflows/i },
    { path: "/settings", heading: /Settings|Preferences/i },
    { path: "/voice/setup", heading: /Voice|Receptionist|Setup/i },
    { path: "/onboarding", heading: /Setup|Onboarding|Welcome/i },
  ];

  for (const route of protectedRoutes) {
    test(`should access protected route ${route.path}`, async ({ page }) => {
      await page.goto(route.path, { waitUntil: "load" });

      // Verify redirection hasn't happened back to login
      await expect(page).not.toHaveURL(/login/);

      // Verify main heading or unique element via sidebar/header
      await expect(
        page.locator("h1, h2, header, main").filter({ hasText: route.heading }).first()
      ).toBeVisible({ timeout: 30000 });
    });
  }
});
