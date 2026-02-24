import { test, expect } from "@playwright/test";

test.describe("Feature API Tests", () => {
  let authToken: string;

  test.beforeAll(async ({ request }) => {
    // 1. Seed User using the test endpoint
    const email = `test-api-${Date.now()}@example.com`;
    const seedRes = await request.post("/api/test/seed", {
      data: {
        email,
        password: "password123",
        name: "API Test User",
        status: "ACTIVE",
        onboardingStep: 8,
      },
    });

    if (!seedRes.ok()) {
      console.error("Seeding failed:", await seedRes.text());
    }
    expect(seedRes.ok()).toBeTruthy();

    const { token } = await seedRes.json();
    authToken = token;
  });

  // Helper function to create authenticated request context or headers
  // Since we can't easily modify the fixture, we'll just pass headers
  const headers = () => ({
    Cookie: `auth-token=${authToken}`,
  });

  test("RBAC: Should reject unauthorized access", async ({ request }) => {
    // Request without headers (unauthorized)
    const res1 = await request.post("/api/upload", {
      multipart: {
        file: {
          name: "test.txt",
          mimeType: "text/plain",
          buffer: Buffer.from("test content"),
        },
      },
    });
    // Should be 401 or 403
    expect([401, 403]).toContain(res1.status());

    const res2 = await request.get("/api/webhooks");
    expect([401, 403]).toContain(res2.status());
  });

  test("File Storage: Should upload a file", async ({ request }) => {
    const buffer = Buffer.from("This is a test file content");
    const response = await request.post("/api/upload", {
      headers: headers(),
      multipart: {
        file: {
          name: "test-upload.pdf",
          mimeType: "application/pdf",
          buffer: buffer,
        },
      },
    });

    if (!response.ok()) console.log("Upload failed:", await response.text());
    expect(response.ok()).toBeTruthy();
    const data = await response.json();
    expect(data.url).toContain("/uploads/");
    expect(data.name).toBe("test-upload.pdf");
  });

  test("Webhooks: Should create and list webhooks", async ({ request }) => {
    const webhookData = {
      url: "https://example.com/webhook",
      event: "BOOKING_CREATED",
    };

    // Create
    const createRes = await request.post("/api/webhooks", {
      headers: headers(),
      data: webhookData,
    });

    if (!createRes.ok()) console.log("Create webhook failed:", await createRes.text());
    expect(createRes.status()).toBe(201);
    const created = await createRes.json();
    expect(created.webhook.url).toBe(webhookData.url);

    // List
    const listRes = await request.get("/api/webhooks", {
      headers: headers(),
    });
    expect(listRes.ok()).toBeTruthy();
    const listData = await listRes.json();
    expect(Array.isArray(listData.webhooks)).toBeTruthy();
    expect(listData.webhooks.some((w: { url?: string }) => w.url === webhookData.url)).toBeTruthy();
  });

  test("AI Wiring: Should chat with AI assistant", async ({ request }) => {
    const chatData = {
      message: "Hello, I want to set up my workspace.",
      currentStep: 1,
      businessInfo: {},
      conversationHistory: [],
    };

    const response = await request.post("/api/ai/chat", {
      headers: headers(),
      data: chatData,
    });

    if (!response.ok()) console.log("AI Chat failed:", await response.text());
    expect(response.ok()).toBeTruthy();
    const data = await response.json();

    expect(data.message).toBeDefined();
    expect(typeof data.message).toBe("string");
    expect(data.extractedData).toBeDefined();
  });
});
