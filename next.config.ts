import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Tes e2e memakai direktori build sendiri (NEXT_DIST_DIR) agar dapat berjalan berdampingan dengan `next dev`.
  distDir: process.env.NEXT_DIST_DIR || ".next",
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
