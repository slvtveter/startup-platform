import type { NextConfig } from "next";

const API_URL = process.env.API_INTERNAL_URL ?? "http://localhost:8000";

const nextConfig: NextConfig = {
  // Минимальный образ для Docker: .next/standalone содержит только нужное для запуска.
  output: "standalone",
  poweredByHeader: false,
  // В docker-окружении /api забирает Caddy; rewrite нужен, когда web запущен сам по себе.
  async rewrites() {
    return [{ source: "/api/:path*", destination: `${API_URL}/api/:path*` }];
  },
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
