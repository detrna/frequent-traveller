import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Tes e2e memakai direktori build sendiri (NEXT_DIST_DIR) agar dapat berjalan berdampingan dengan `next dev`.
  distDir: process.env.NEXT_DIST_DIR || ".next",
  poweredByHeader: false,
  // Jadwal penerbangan kini publik di /jadwal (US10); tautan lama tetap berfungsi (query string ikut diteruskan).
  async redirects() {
    return [
      { source: "/penerbangan/cari", destination: "/jadwal", permanent: false },
      { source: "/penerbangan/multi-tujuan", destination: "/jadwal/multi-tujuan", permanent: false },
    ];
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
        ],
      },
    ];
  },
  turbopack: {
    // pin ke direktori proyek agar lockfile lain di luar repo (mis. di home) tidak dianggap sebagai root
    root: process.cwd(),
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
