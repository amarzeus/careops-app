import { test, expect } from "@playwright/test";

test.describe("STAFF Granular RBAC", () => {
  const staffEmail = `staff-rbac-${Date.now()}@example.com`;

  test("should restrict access for STAFF with no permissions", async ({ page, request }) => {
    // 1. Seed STAFF user with NO permissions
    const seedResponse = await request.post("/api/test/seed", {
      data: {
        email: staffEmail,
        name: "Restricted Staff",
        role: "STAFF",
        status: "ACTIVE",
        canAccessInbox: false,
        canAccessBookings: false,
        canAccessForms: false,
        canAccessInventory: false,
      },
    });
    expect(seedResponse.ok()).toBe(true);

    // 2. Login
    await page.goto("/login");
    await page.fill('input[type="email"]', staffEmail);
    await page.fill('input[type="password"]', "password123");
    await page.click('button[type="submit"]');
    await page.waitForURL("/dashboard");

    // 3. Verify Sidebar restrictions (Settings/Automation should be hidden by role OWNER check)
    await expect(page.locator('a[href="/settings"]')).not.toBeVisible();
    await expect(page.locator('a[href="/automation"]')).not.toBeVisible();

    // 4. Test Inbox access (API returns 403)
    await page.goto("/inbox");
    // Since there's no specific 403 UI, we check if the list is empty or generic error toast appears
    // We can also intercept the request to verify the 403 status
    const inboxResponse = await page.waitForResponse((res) =>
      res.url().includes("/api/inbox/conversations")
    );
    expect(inboxResponse.status()).toBe(403);

    // 5. Test Bookings access
    await page.goto("/bookings");
    const bookingsResponse = await page.waitForResponse((res) =>
      res.url().includes("/api/bookings")
    );
    expect(bookingsResponse.status()).toBe(403);

    // 6. Test Inventory access
    await page.goto("/inventory");
    const inventoryResponse = await page.waitForResponse((res) =>
      res.url().includes("/api/inventory")
    );
    expect(inventoryResponse.status()).toBe(403);
  });

  test("should allow access for STAFF with all permissions", async ({ page, request }) => {
    const fullStaffEmail = `staff-full-${Date.now()}@example.com`;

    // 1. Seed STAFF user with ALL permissions
    const seedResponse = await request.post("/api/test/seed", {
      data: {
        email: fullStaffEmail,
        name: "Full Staff",
        role: "STAFF",
        status: "ACTIVE",
        canAccessInbox: true,
        canAccessBookings: true,
        canAccessForms: true,
        canAccessInventory: true,
      },
    });
    expect(seedResponse.ok()).toBe(true);

    // 2. Login
    await page.goto("/login");
    await page.fill('input[type="email"]', fullStaffEmail);
    await page.fill('input[type="password"]', "password123");
    await page.click('button[type="submit"]');
    await page.waitForURL("/dashboard");

    // 3. Test Inbox access (API returns 200)
    await page.goto("/inbox");
    const inboxResponse = await page.waitForResponse((res) =>
      res.url().includes("/api/inbox/conversations")
    );
    expect(inboxResponse.status()).toBe(200);

    // 4. Test Bookings access
    await page.goto("/bookings");
    const bookingsResponse = await page.waitForResponse((res) =>
      res.url().includes("/api/bookings")
    );
    expect(bookingsResponse.status()).toBe(200);
  });
});
