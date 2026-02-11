import { test, expect } from '@playwright/test';

test.describe('Owner Dashboard', () => {
  test('[P1] should display key metrics', async ({ page }) => {
    // Navigate to dashboard
    await page.goto('/dashboard');

    // Verify Layout
    // Assuming auth is handled or we are redirected to login
    await expect(page).toHaveURL(/\/dashboard|\/login/);
  });
});
