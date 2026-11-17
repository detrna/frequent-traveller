import { defineConfig, devices } from "@playwright/test";

// e2e berjalan terhadap database tes (aps_test) yang di-seed ulang setiap kali, bukan database pengembangan.
const urlTes = process.env.DATABASE_URL_TEST ?? "postgresql://aps:aps@localhost:5433/aps_test";
const PORT = 3100;

export default defineConfig({
  testDir: "./tests/e2e",
  globalSetup: "./tests/e2e/global-setup.ts",
  fullyParallel: false,
  workers: 1,
  retries: 0,
  reporter: "list",
  use: {
    baseURL: `http://localhost:${PORT}`,
    trace: "on-first-retry",
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  webServer: {
    command: `npm run dev -- --port ${PORT}`,
    url: `http://localhost:${PORT}/login`,
    reuseExistingServer: false,
    timeout: 120_000,
    env: {
      DB_TARGET: "local",
      DATABASE_URL_LOCAL: urlTes,
      AUTH_SECRET: process.env.AUTH_SECRET ?? "rahasia-khusus-e2e",
      AUTH_URL: `http://localhost:${PORT}`,
      NEXT_DIST_DIR: ".next-e2e",
      EMAIL_DRIVER: "smtp",
    },
  },
});
