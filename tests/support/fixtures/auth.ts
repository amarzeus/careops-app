import { test as base } from '@playwright/test';

export const test = base.extend({
  authenticatedUser: async ({ page }, use) => {
    // Login logic placeholder
    await page.goto('/login');
    // Implement actual login steps here
    await use(page);
  },
});
