import { fileURLToPath } from "url";
import { dirname, resolve } from "path";
import { defineConfig, devices } from "@playwright/test";
import dotenv from "dotenv";

/**
 * Read environment variables from file.
 * https://github.com/motdotla/dotenv
 */
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Real Stripe Checkout / Paddle sandbox flows are flaky when run concurrently.
const SERIAL_PAYMENT_TESTS = [
  "**/paddle/*.test.ts",
  "**/stripe-checkout/*.test.ts",
];

dotenv.config({
  path: resolve(__dirname, ".env"),
});

dotenv.config({
  path: resolve(__dirname, ".env.local"),
  override: true,
});

/**
 * See https://playwright.dev/docs/test-configuration.
 */
export default defineConfig({
  globalSetup: (await import("path")).resolve("./playwright-global-setup.ts"),
  testDir: "./src/tests",
  /* Run tests in files in parallel */
  fullyParallel: true,
  /* Fail the build on CI if you accidentally left test.only in the source code. */
  forbidOnly: !!process.env.CI,
  /* Retry on CI only */
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 4 : 1,
  /* Reporter to use. See https://playwright.dev/docs/test-reporters */
  reporter: process.env.CI
    ? [["junit", { outputFile: "results.xml" }]]
    : "list",
  /* Shared settings for all the projects below. See https://playwright.dev/docs/api/class-testoptions. */
  use: {
    /* Base URL to use in actions like `await page.goto('/')`. */
    // baseURL: 'http://127.0.0.1:3000',
    /* Collect trace when retrying the failed test. See https://playwright.dev/docs/trace-viewer */
    trace: "on-first-retry",
    ...(process.env.CI
      ? {
          headless: true, // Run in headless mode
          viewport: { width: 1280, height: 720 }, // Set a smaller viewport
          ignoreHTTPSErrors: true, // Ignore HTTPS errors
          video: "off", // Disable video recording
          screenshot: "off", // Disable screenshots
          trace: "off", // Disable tracing
        }
      : {}),
  },

  /* Configure projects for major browsers */
  projects: [
    {
      name: "chromium",
      testIgnore: SERIAL_PAYMENT_TESTS,
      use: { ...devices["Desktop Chrome"] },
    },

    {
      name: "chromium-payments",
      testMatch: SERIAL_PAYMENT_TESTS,
      workers: 1,
      use: { ...devices["Desktop Chrome"] },
    },

    {
      name: "firefox",
      use: { ...devices["Desktop Firefox"] },
    },

    {
      name: "webkit",
      use: { ...devices["Desktop Safari"] },
    },

    /* Test against mobile viewports. */
    // {
    //   name: 'Mobile Chrome',
    //   use: { ...devices['Pixel 5'] },
    // },
    // {
    //   name: 'Mobile Safari',
    //   use: { ...devices['iPhone 12'] },
    // },

    /* Test against branded browsers. */
    // {
    //   name: 'Microsoft Edge',
    //   use: { ...devices['Desktop Edge'], channel: 'msedge' },
    // },
    // {
    //   name: 'Google Chrome',
    //   use: { ...devices['Desktop Chrome'], channel: 'chrome' },
    // },
  ],

  /* Run your local dev server before starting the tests */
  // webServer: {
  //   command: 'npm run start',
  //   url: 'http://127.0.0.1:3000',
  //   reuseExistingServer: !process.env.CI,
  // },

  expect: {
    timeout: 30_000,
  },
});
