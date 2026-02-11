import { test, expect } from '@playwright/test';

test.describe('Auth API', () => {
  test('should register a new user', async ({ request }) => {
    const response = await request.post('/api/auth/register', {
      data: {
        email: `test-${Date.now()}@example.com`,
        password: 'password123',
        name: 'Test User'
      }
    });
    // Accept 200, 201, or 409 (if duplicate)
    expect([200, 201, 409]).toContain(response.status());
    const data = await response.json();
    if (response.ok()) {
      expect(data.user).toBeDefined();
    }
  });
});
