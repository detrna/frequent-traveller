import { defineConfig } from "vitest/config";
// Tes selalu memakai database terpisah (aps_test), apa pun isi .env.local. Vitest tidak memuat .env.local ke process.env.
const urlTes = process.env.DATABASE_URL_TEST ?? "postgresql://aps:aps@localhost:5433/aps_test";

export default defineConfig({
  resolve: { tsconfigPaths: true },
  test: {
    environment: "node",
    include: ["src/**/*.test.ts", "tests/unit/**/*.test.ts", "tests/integration/**/*.test.ts"],
    env: { DB_TARGET: "local", DATABASE_URL_LOCAL: urlTes, AUTH_SECRET: "rahasia-khusus-tes" },
    globalSetup: ["tests/global-setup.ts"],
    // tes integrasi berbagi satu database Postgres, jadi jalankan file satu per satu
    fileParallelism: false,
  },
});
