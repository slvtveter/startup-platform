import type { MetadataRoute } from "next";

// SITE_URL задаётся при запуске контейнера, а не при сборке: без этого в robots.txt попал бы localhost.
export const dynamic = "force-dynamic";

export default function robots(): MetadataRoute.Robots {
  const site = process.env.SITE_URL ?? "http://localhost:8080";
  return {
    rules: { userAgent: "*", allow: "/", disallow: ["/me", "/admin", "/api", "/login", "/register"] },
    sitemap: `${site}/sitemap.xml`,
  };
}
