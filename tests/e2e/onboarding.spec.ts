import { test, expect } from "@playwright/test";

test.describe("Onboarding Flow", () => {
  test("[P0] should complete full business setup", async ({ page, request, context }) => {
    const email = `test-${Date.now()}@example.com`;
    const seedRes = await request.post("/api/test/seed", {
      data: {
        email,
        name: "Test Setup User",
        password: "password123",
        status: "ONBOARDING",
        onboardingStep: 1,
      },
    });
    expect(seedRes.ok(), await seedRes.text()).toBeTruthy();
    const { token } = await seedRes.json();

    const authHeaders = { Cookie: `auth-token=${token}` };

    await context.addCookies([
      {
        name: "auth-token",
        value: token,
        url: "http://localhost:5000",
      },
    ]);

    // Step 1: Workspace
    const step1 = await request.put("/api/workspace", {
      headers: authHeaders,
      data: {
        name: "My Test Clinic",
        address: "123 Test St",
        timezone: "UTC",
        contactEmail: `contact-${Date.now()}@test.com`,
        onboardingStep: 2,
      },
    });
    expect(step1.ok(), await step1.text()).toBeTruthy();

    // Step 2: Communication
    const step2 = await request.put("/api/workspace", {
      headers: authHeaders,
      data: {
        emailProvider: "smtp",
        emailFromName: "My Test Clinic",
        emailFromAddress: "hello@testclinic.com",
        emailConfigured: true,
        onboardingStep: 3,
      },
    });
    expect(step2.ok(), await step2.text()).toBeTruthy();

    // Step 3: Contact Form
    const step3Form = await request.post("/api/forms/contact-forms", {
      headers: {
        ...authHeaders,
        "Content-Type": "application/json",
      },
      data: {
        name: "Contact Us",
        welcomeMessage: "Thank you for reaching out!",
      },
    });
    expect(step3Form.ok(), await step3Form.text()).toBeTruthy();

    const step3 = await request.put("/api/workspace", {
      headers: authHeaders,
      data: { onboardingStep: 4 },
    });
    expect(step3.ok(), await step3.text()).toBeTruthy();

    // Step 4: Services
    const step4Service = await request.post("/api/services", {
      headers: {
        ...authHeaders,
        "Content-Type": "application/json",
      },
      data: {
        name: "General Checkup",
        duration: 30,
        location: "Office",
        availableDays: "1,2,3,4,5",
        startTime: "09:00",
        endTime: "17:00",
      },
    });
    expect(step4Service.ok(), await step4Service.text()).toBeTruthy();
    const serviceData = await step4Service.json();

    const step4 = await request.put("/api/workspace", {
      headers: authHeaders,
      data: { onboardingStep: 5 },
    });
    expect(step4.ok(), await step4.text()).toBeTruthy();

    // Step 5: Intake Forms
    const step5Form = await request.post("/api/forms/intake-forms", {
      headers: {
        ...authHeaders,
        "Content-Type": "application/json",
      },
      data: {
        name: "General Intake",
        description: "Please complete before booking",
        fields: "[]",
        serviceId: serviceData?.service?.id,
      },
    });
    expect(step5Form.ok(), await step5Form.text()).toBeTruthy();

    const step5 = await request.put("/api/workspace", {
      headers: authHeaders,
      data: { onboardingStep: 6 },
    });
    expect(step5.ok(), await step5.text()).toBeTruthy();

    // Step 6: Inventory
    const step6Item = await request.post("/api/inventory", {
      headers: {
        ...authHeaders,
        "Content-Type": "application/json",
      },
      data: {
        name: "Bandages",
        quantity: 100,
        threshold: 10,
        unit: "units",
      },
    });
    expect(step6Item.ok(), await step6Item.text()).toBeTruthy();

    const step6 = await request.put("/api/workspace", {
      headers: authHeaders,
      data: { onboardingStep: 7 },
    });
    expect(step6.ok(), await step6.text()).toBeTruthy();

    // Step 7: Staff (optional in this test)
    const step7 = await request.put("/api/workspace", {
      headers: authHeaders,
      data: { onboardingStep: 8 },
    });
    expect(step7.ok(), await step7.text()).toBeTruthy();

    // Step 8: Activation validation + activation
    const validationRes = await request.get("/api/workspace/validate-activation", {
      headers: authHeaders,
    });
    expect(validationRes.ok(), await validationRes.text()).toBeTruthy();
    const validation = await validationRes.json();
    expect(validation.valid).toBeTruthy();

    const activateRes = await request.put("/api/workspace", {
      headers: authHeaders,
      data: { status: "ACTIVE", onboardingStep: 8 },
    });
    expect(activateRes.ok(), await activateRes.text()).toBeTruthy();

    // UI smoke verification after activation
    await page.goto("/dashboard");
    await expect(page).toHaveURL(/dashboard/);
    await expect(page.getByRole("link", { name: "Dashboard" })).toBeVisible();
  });
});
