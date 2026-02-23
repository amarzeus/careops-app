import { defineConfig, devices } from "@playwright/test";
import path from "path";
import dotenv from "dotenv";

// Read from .env file
dotenv.config({ path: path.resolve(__dirname, ".env") });

const baseURL = process.env.BASE_URL || "http://localhost:5000";
// shouldUseLocalWebServer = !process.env.BASE_URL;

export default defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 3 : 1,
  workers: process.env.CI ? 1 : undefined,
  reporter: "html",
  use: {
    baseURL,
    trace: "on-first-retry",
    actionTimeout: 60000,
    navigationTimeout: 60000,
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
  webServer: {
    command: "npm run dev",
    url: "http://localhost:5000",
    reuseExistingServer: !process.env.CI,
    timeout: 300 * 1000,
    env: {
      PORT: "5000",
    },
  },
});
