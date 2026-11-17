import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: { tsconfigPaths: true },
  test: {
    environment: "node",
    include: ["src/**/*.test.ts", "tests/unit/**/*.test.ts", "tests/integration/**/*.test.ts"],
    // tes integrasi berbagi satu database Postgres, jadi jalankan file satu per satu
    fileParallelism: false,
  },
});
