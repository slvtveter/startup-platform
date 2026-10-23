import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Минимальный образ для Docker: .next/standalone содержит только нужное для запуска.
  output: "standalone",
  cacheComponents: true,
  partialPrefetching: true,
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
