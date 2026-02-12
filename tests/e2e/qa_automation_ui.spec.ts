import { test, expect } from '@playwright/test';

test.describe('Feature UI Tests', () => {
  test.setTimeout(60000);

  test('AI Wiring: Should chat with onboarding assistant', async ({ page, request, context }) => {
    // 1. Seed user in onboarding
    const email = `test-ai-${Date.now()}@example.com`;
    const seedRes = await request.post('/api/test/seed', {
      data: {
        email,
        name: 'AI Test User',
        password: 'password123',
        status: 'ONBOARDING',
        onboardingStep: 1
      }
    });
    expect(seedRes.ok(), await seedRes.text()).toBeTruthy();
    const { token } = await seedRes.json();

    // 2. Set Auth Cookie
    await context.addCookies([{
      name: 'auth-token',
      value: token,
      url: 'http://localhost:3000',
    }]);

    // 3. Go to Onboarding
    await page.goto('/onboarding');
    // Wait for loading to finish if any
    await expect(page.locator('.animate-pulse')).toBeHidden();
    
    await expect(page).toHaveURL(/onboarding/);

    // 4. Interact with Chat
    // Use specific placeholder for the chat input
    const chatInput = page.getByPlaceholder(/Ask me anything/i);
    await expect(chatInput).toBeVisible();

    await chatInput.fill('My business is a dental clinic called Smile Bright.');
    await page.keyboard.press('Enter');

    // 5. Expect AI Response
    // Look for a message bubble with gray background (assistant)
    await expect(page.locator('.bg-gray-100').filter({ hasText: /dental|smile|great|help/i }).first()).toBeVisible({ timeout: 15000 });
  });

  test('Webhooks: Should add a new webhook', async ({ page, request, context }) => {
    // 1. Seed user in active state
    const email = `test-hooks-${Date.now()}@example.com`;
    const seedRes = await request.post('/api/test/seed', {
      data: {
        email,
        name: 'Webhook User',
        password: 'password123',
        status: 'ACTIVE',
        onboardingStep: 8
      }
    });
    expect(seedRes.ok(), await seedRes.text()).toBeTruthy();
    const { token } = await seedRes.json();

    // 2. Set Auth Cookie
    await context.addCookies([{
      name: 'auth-token',
      value: token,
      url: 'http://localhost:3000',
    }]);

    // 3. Go to Settings
    await page.goto('/settings');
    await expect(page.locator('.animate-pulse')).toBeHidden({ timeout: 30000 });
    
    // 4. Find Webhooks Section in Integrations Tab
    const integrationsTab = page.getByRole('tab', { name: /integrations/i });
    await integrationsTab.click();

    // 5. Add Webhook
    // Locate the Webhooks card by heading
    await expect(page.getByRole('heading', { name: 'Webhooks' })).toBeVisible();

    // Fill inputs FIRST
    const urlInput = page.getByPlaceholder(/hooks\.zapier\.com/i);
    await urlInput.fill('https://example.com/hook');
    
    // Click Add Button
    await page.getByRole('button').filter({ has: page.locator('.lucide-plus') }).click();
    
    // 6. Verify
    await expect(page.getByText('https://example.com/hook')).toBeVisible();
  });

});
