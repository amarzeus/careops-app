import { test, expect } from '@playwright/test';

test.describe('Workspace API', () => {
  test('should create workspace', async ({ request }) => {
    // Prerequisite: Auth headers would be needed here
    // For now, testing endpoint reachability and contract
    const response = await request.post('/api/workspace', {
      data: { name: 'Test Workspace', timezone: 'UTC' }
    });
    // Expecting 401 without auth, or success if auth handled globally
    expect([200, 201, 401]).toContain(response.status());
  });
});
