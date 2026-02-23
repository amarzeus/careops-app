import { test as base } from "@playwright/test";

type AuthFixtures = {
  authenticatedUser: import("@playwright/test").Page;
};

export const test = base.extend<AuthFixtures>({
  authenticatedUser: async ({ page }, runFixture) => {
    // Login logic placeholder
    await page.goto("/login");
    // Implement actual login steps here
    await runFixture(page);
  },
});
