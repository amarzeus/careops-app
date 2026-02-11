import { test, expect } from '@playwright/test';

test.describe('Onboarding Flow', () => {
  test('[P0] should complete full business setup', async ({ page, request, context }) => {
    // Seed user
    const email = `test-${Date.now()}@example.com`;
    const seedRes = await request.post('/api/test/seed', {
      data: {
        email,
        name: 'Test Setup User',
        password: 'password123'
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

    // Navigate to onboarding
    await page.goto('/onboarding');

    // Step 1: Workspace
    await expect(page.getByText('Business Name *')).toBeVisible();
    await page.locator('input[placeholder="Acme Health Clinic"]').fill('My Test Clinic');
    await page.locator('input[placeholder="123 Main St"]').fill('123 Test St');
    await page.locator('input[placeholder="contact@business.com"]').fill(`contact-${Date.now()}@test.com`);
    await page.getByRole('button', { name: 'Save & Continue' }).click();

    // Step 2: Communication
    await expect(page.getByText('Connect at least one channel')).toBeVisible();
    await page.getByLabel('Enable Email').click();
    await page.getByRole('button', { name: 'Save & Continue' }).click();

    // Step 3: Contact Form
    await expect(page.getByText('This form will be public')).toBeVisible();
    await page.getByRole('button', { name: 'Save & Continue' }).click();

    // Step 4: Bookings
    await expect(page.getByText('Create services customers can book')).toBeVisible();
    await page.locator('input[placeholder="Initial Consultation"]').fill('General Checkup');
    await page.getByRole('button', { name: 'Add Service' }).click();
    await page.getByRole('button', { name: 'Save & Continue' }).click();

    // Step 5: Intake Forms
    await expect(page.getByText('Auto-send forms after booking')).toBeVisible();
    await page.locator('input[placeholder="Patient Intake Form"]').fill('General Intake');
    await page.getByRole('button', { name: 'Add Form' }).click();
    await page.getByRole('button', { name: 'Save & Continue' }).click();

    // Step 6: Inventory
    // "Inventory" text likely in sidebar. Use description text or heading.
    // Based on page.tsx, header structure is not fully visible but content has text.
    // Let's assume there is some unique text.
    // Truncated file showed switch case 6 start but not content.
    // Let's just use getByRole('heading', { name: 'Inventory' }) if it exists, but sidebar might be 'Inventory'.
    // Sidebar usually is <button> or <div>. Headings are <h2> or <h3>.
    // The error said `<h3>...Contact Form</h3>`. So heading locator is safe.
    await expect(page.getByRole('heading', { name: 'Inventory' })).toBeVisible();
    await page.locator('input[placeholder="Surgical Gloves"]').fill('Bandages');
    await page.getByRole('button', { name: 'Add Item' }).click();
    await page.getByRole('button', { name: 'Save & Continue' }).click();

    // Step 7: Staff
    await expect(page.getByRole('heading', { name: 'Staff' })).toBeVisible();
    // Skip adding staff for now (optional)
    await page.getByRole('button', { name: 'Save & Continue' }).click();

    // Step 8: Activate
    await expect(page.getByRole('heading', { name: 'Activate' })).toBeVisible();
    await page.getByRole('button', { name: 'Activate Workspace' }).click();

    // Verify Dashboard Redirect
    await expect(page).toHaveURL(/dashboard/);
  });
});
