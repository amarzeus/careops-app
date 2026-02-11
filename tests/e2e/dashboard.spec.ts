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
    const { token } = await seedRes.json();

    // Set auth cookie
    await context.addCookies([{
      name: 'auth-token',
      value: token,
      domain: 'localhost',
      path: '/',
      httpOnly: true,
      secure: false, // Localhost is not secure
      sameSite: 'Lax'
    }]);

    // Navigate to dashboard
    await page.goto('/dashboard');

    // Verify Dashboard Content
    await expect(page).toHaveURL(/dashboard/);

    // Wait for loader to disappear
    await expect(page.locator('.animate-spin')).not.toBeVisible({ timeout: 15000 });

    await expect(page.getByRole('heading', { name: 'Command Center' })).toBeVisible();
    await expect(page.getByText("Today's Bookings")).toBeVisible();
  });
});
