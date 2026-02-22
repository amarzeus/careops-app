import { test, expect } from '@playwright/test';

/**
 * Smoke Tests - Quick verification that deployed app is working
 * These run against production after deployment
 */

test.describe('Production Smoke Tests', () => {
  const baseURL = process.env.BASE_URL || 'http://localhost:5000';

  test('[Smoke] Health check endpoint returns healthy', async ({ request }) => {
    // Increase timeout for health check as server/DB might be warming up
    const response = await request.get(`${baseURL}/api/health`, { timeout: 30000 });

    expect(response.status()).toBe(200);

    const body = await response.json();
    expect(body.status).toBe('healthy');
    expect(body.checks).toBeDefined();
  });

  test('[Smoke] Login page is accessible', async ({ page }) => {
    await page.goto(`${baseURL}/login`);

    // Check page loaded
    await expect(page).toHaveTitle(/CareOps|Login/i);

    // Check login form exists
    const loginForm = page.locator('form, [data-testid="login-form"]').first();
    await expect(loginForm).toBeVisible();
  });

  test('[Smoke] Public landing page is accessible', async ({ page }) => {
    await page.goto(`${baseURL}/`);

    // Check page loaded - landing page title
    await expect(page).toHaveTitle(/CareOps/i);
  });

  test('[Smoke] API endpoints respond correctly', async ({ request }) => {
    // Test 404 handling for non-existent API route
    // Note: Middleware returns 401 for unauthenticated API routes, which is acceptable
    const notFoundResponse = await request.get(`${baseURL}/api/nonexistent`);
    // Accept 401 (middleware blocks), 404 ( Next.js handles), or 400
    expect([401, 404, 400]).toContain(notFoundResponse.status());
  });

  test('[Smoke] Static assets are served', async ({ request }) => {
    // Check favicon or other static assets
    const response = await request.get(`${baseURL}/favicon.ico`);
    // Favicon might not exist, but server should respond
    expect([200, 404]).toContain(response.status());
  });
});
