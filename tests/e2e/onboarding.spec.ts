import { test, expect } from '@playwright/test';

test.describe('Onboarding Flow', () => {
  test('[P0] should complete full business setup', async ({ page }) => {
    // Navigate to onboarding
    await page.goto('/onboarding');

    // Step 1: Workspace
    await expect(page.getByText('Business Name *')).toBeVisible();
    await page.locator('input[placeholder="Acme Health Clinic"]').fill('My Test Clinic');
    await page.locator('input[placeholder="123 Main St"]').fill('123 Test St');
    await page.locator('input[placeholder="contact@business.com"]').fill(`contact-${Date.now()}@test.com`);
    await page.getByRole('button', { name: 'Save & Continue' }).click();

    // Step 2: Communication
    await expect(page.getByText('Communication')).toBeVisible();
    await page.getByLabel('Enable Email').click();
    await page.getByRole('button', { name: 'Save & Continue' }).click();

    // Step 3: Contact Form
    await expect(page.getByText('Contact Form')).toBeVisible();
    await page.getByRole('button', { name: 'Save & Continue' }).click();

    // Step 4: Bookings
    await expect(page.getByText('Bookings')).toBeVisible();
    await page.locator('input[placeholder="Initial Consultation"]').fill('General Checkup');
    await page.getByRole('button', { name: 'Add Service' }).click();
    await page.getByRole('button', { name: 'Save & Continue' }).click();

    // Step 5: Intake Forms
    await expect(page.getByText('Intake Forms')).toBeVisible();
    await page.locator('input[placeholder="Patient Intake Form"]').fill('General Intake');
    await page.getByRole('button', { name: 'Add Form' }).click();
    await page.getByRole('button', { name: 'Save & Continue' }).click();

    // Step 6: Inventory
    await expect(page.getByText('Inventory')).toBeVisible();
    await page.locator('input[placeholder="Surgical Gloves"]').fill('Bandages');
    await page.getByRole('button', { name: 'Add Item' }).click();
    await page.getByRole('button', { name: 'Save & Continue' }).click();

    // Step 7: Staff
    await expect(page.getByText('Staff')).toBeVisible();
    // Skip adding staff for now (optional)
    await page.getByRole('button', { name: 'Save & Continue' }).click();

    // Step 8: Activate
    await expect(page.getByText('Activate')).toBeVisible();
    await page.getByRole('button', { name: 'Activate Workspace' }).click();

    // Verify Dashboard Redirect
    await expect(page).toHaveURL(/dashboard/);
  });
});
