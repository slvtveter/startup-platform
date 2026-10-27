import type { NextConfig } from "next";

const API_URL = process.env.API_INTERNAL_URL ?? "http://localhost:8000";

const nextConfig: NextConfig = {
  // Минимальный образ для Docker: .next/standalone содержит только нужное для запуска.
  output: "standalone",
  poweredByHeader: false,
  // Фото лендинга импортируются статически (src/assets/photos): у адреса есть хеш содержимого,
  // поэтому браузер может кешировать год. Только WebP: AVIF жмётся в разы дольше, а на первом
  // запросе после выкатки это заметно (кеш прогревает infra/deploy.sh).
  images: {
    formats: ["image/webp"],
    minimumCacheTTL: 31536000,
    deviceSizes: [640, 828, 1080, 1440, 1920, 2560],
    imageSizes: [64, 96, 160, 256, 384],
    qualities: [75, 85],
  },
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
