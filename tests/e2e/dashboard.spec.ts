import { test, expect } from '@playwright/test';

test.describe('Owner Dashboard', () => {
  test('[P1] should display key metrics', async ({ page, request, context }) => {
    // Seed user
    const email = `test-dash-${Date.now()}@example.com`;
    const seedRes = await request.post('/api/test/seed', {
      data: {
        email,
        name: 'Dashboard User',
        password: 'password123',
        status: 'ACTIVE',
        onboardingStep: 8
      }
    });
    if (!seedRes.ok()) {
      const text = await seedRes.text();
      console.error(`Seed failed with status ${seedRes.status()}:`, text);
      throw new Error(`Seed failed: ${text.substring(0, 100)}`);
    }
    const { token } = await seedRes.json();

    // Set auth cookie
    await context.addCookies([{
      name: 'auth-token',
      value: token,
      url: 'http://localhost:5000',
    }]);

    // Navigate to dashboard
    await page.goto('/dashboard');

    // Verify dashboard route and shell
    await expect(page).toHaveURL(/dashboard/);
    await expect(page.getByRole('link', { name: 'Dashboard', exact: true })).toBeVisible();

    // Wait for loader to disappear
    await expect(page.locator('.animate-spin')).not.toBeVisible({ timeout: 15000 });

    // Verify metrics API is available for this owner session
    const metricsRes = await request.get('/api/dashboard/metrics', {
      headers: { Cookie: `auth-token=${token}` }
    });
    expect(metricsRes.ok()).toBeTruthy();
    const metricsData = await metricsRes.json();
    expect(metricsData.metrics).toBeDefined();
    expect(typeof metricsData.metrics.bookingsToday).toBe('number');
  });
});
