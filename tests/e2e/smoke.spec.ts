import { test, expect } from '@playwright/test';

test.describe('Smoke Tests', () => {
  test('homepage should load', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveTitle(/CareOps/);
  });
});
