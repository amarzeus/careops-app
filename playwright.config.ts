import { defineConfig, devices } from '@playwright/test';
import path from 'path';
import dotenv from 'dotenv';

// Read from .env file
dotenv.config({ path: path.resolve(__dirname, '.env') });

const baseURL = process.env.BASE_URL || 'http://localhost:5000';
const shouldUseLocalWebServer = !process.env.BASE_URL;

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  use: {
    baseURL,
    trace: 'on-first-retry',
    actionTimeout: 30000,
    navigationTimeout: 30000,
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  // Run local server only when tests target localhost.
  webServer: shouldUseLocalWebServer
    ? {
      command: 'npm run dev',
      url: 'http://localhost:5000',
      reuseExistingServer: !process.env.CI,
      timeout: 120 * 1000,
      env: {
        PORT: '5000',
      },
    }
    : undefined,
});
