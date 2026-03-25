import { defineConfig, devices } from "@playwright/test";

/**
 * Playwright configuration.
 * Docs: https://playwright.dev/docs/test-configuration
 */
export default defineConfig({
  testDir: "./e2e/tests",

  /* Run tests in parallel */
  fullyParallel: true,

  /* Fail the build on CI if you accidentally left test.only */
  forbidOnly: !!process.env.CI,

  /* Retry on CI only */
  retries: process.env.CI ? 2 : 0,

  /* Limit parallel workers on CI */
  workers: process.env.CI ? 1 : undefined,

  /* Reporter */
  reporter: process.env.CI ? "html" : [["list"], ["html", { open: "never" }]],

  /* Shared config for all projects */
  use: {
    /* Base URL — no hard-coded URLs in tests */
    baseURL: process.env.BASE_URL || "http://localhost:3000",

    /* Capture screenshot on failure */
    screenshot: "only-on-failure",

    /* Record video on first retry */
    video: "on-first-retry",

    /* Collect trace on first retry */
    trace: "on-first-retry",

    /* Timeout for each action */
    actionTimeout: 10_000,
  },

  /* Test timeout */
  timeout: 30_000,

  /* Expect timeout (auto-retry assertions) */
  expect: {
    timeout: 5_000,
  },

  /* Projects */
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
    {
      name: "mobile",
      use: { ...devices["Pixel 5"] },
    },
  ],

  /* Auto-start dev server before running tests */
  // Uncomment and adjust to match your project:
  // webServer: {
  //   command: 'bun run dev',
  //   port: 3000,
  //   reuseExistingServer: !process.env.CI,
  //   timeout: 120_000,
  // },
});
