import { test, expect } from "@playwright/test";
import path from "path";
import fs from "fs";

test.describe("File Storage Lifecycle", () => {
  const testEmail = `test-files-${Date.now()}@example.com`;
  // Using .png to ensure strict MIME type detection works across environments
  const testFileName = `test-upload-${Date.now()}.png`;
  const testFilePath = path.join(process.cwd(), "tests/support/fixtures", testFileName);

  test.beforeAll(async () => {
    // Ensure fixture directory exists
    const fixtureDir = path.join(process.cwd(), "tests/support/fixtures");
    if (!fs.existsSync(fixtureDir)) {
      fs.mkdirSync(fixtureDir, { recursive: true });
    }
    // Create a 1x1 transparent PNG for testing
    const base64Png =
      "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAACklEQVR42mP8/mwWAAXfAjXf59hXAAAAAElFTkSuQmCC";
    fs.writeFileSync(testFilePath, Buffer.from(base64Png, "base64"));
  });

  test.afterAll(async () => {
    // Clean up local system file
    if (fs.existsSync(testFilePath)) {
      try {
        fs.unlinkSync(testFilePath);
      } catch (e) {
        console.warn("Clean up failed:", e);
      }
    }
  });

  test("should complete the full file management lifecycle", async ({ page, request }) => {
    console.log(`Starting File Storage test for ${testEmail}`);

    // Global dialog handler
    page.on("dialog", async (dialog) => {
      console.log(`Dialog [${dialog.type()}]: ${dialog.message()}`);
      await dialog.accept();
    });

    // 1. Seed user and workspace
    const seedResponse = await request.post("/api/test/seed", {
      data: {
        email: testEmail,
        name: "File Test User",
        onboardingStep: 5,
        status: "ACTIVE",
      },
    });
    expect(seedResponse.ok()).toBe(true);

    // 2. Login
    await page.goto("/login");
    await page.fill('input[type="email"]', testEmail);
    await page.fill('input[type="password"]', "password123");

    await Promise.all([
      page.waitForResponse((res) => res.url().includes("/api/auth/login") && res.status() === 200),
      page.click('button[type="submit"]'),
    ]);

    await page.waitForURL((url) => url.pathname.includes("/dashboard"), { timeout: 30000 });

    // 3. Navigate to Files page
    await page.goto("/files");
    const heading = page.locator("h1");
    await expect(heading).toContainText("Files", { timeout: 15000 });

    // 4. Upload file
    await page.locator('button:has-text("Upload Files")').first().click();

    const uploadDialog = page.getByRole("dialog");
    await expect(uploadDialog).toBeVisible();

    // Set up response interceptor before clicking upload
    const uploadPromise = page.waitForResponse(
      (res) => res.url().includes("/api/upload") && res.request().method() === "POST"
    );

    const fileInput = uploadDialog.locator('input[type="file"]');
    await fileInput.setInputFiles(testFilePath);

    // Parse the response to get the renamed filename
    const uploadResponse = await uploadPromise;
    expect(uploadResponse.status()).toBe(200);
    const uploadData = await uploadResponse.json();
    const serverFileName = uploadData.url.split("/").pop();
    expect(serverFileName).toBeTruthy();

    // Dialog should close automatically on successful upload
    await expect(uploadDialog).not.toBeVisible({ timeout: 25000 });

    // Add a manual page reload to ensure SWR/fetch state isn't permanently caching an empty list if there's a race condition
    await page.reload();
    await expect(page.locator("h1")).toContainText("Files", { timeout: 15000 });

    // Wait for the exact server-generated filename to appear in the list
    await expect(page.locator(`text=${serverFileName}`)).toBeVisible({ timeout: 25000 });
    console.log(`File uploaded and visible as ${serverFileName}.`);

    // 6. Test delete
    const fileCard = page.locator("div.overflow-hidden", { hasText: serverFileName }).first();
    const deleteButton = fileCard
      .locator("button")
      .filter({ has: page.locator(".lucide-trash2") })
      .first();

    await deleteButton.click();

    // Wait for file to disappear from UI
    await expect(page.locator(`text=${serverFileName}`)).not.toBeVisible({ timeout: 20000 });
    console.log("File deleted successfully.");
  });
});
