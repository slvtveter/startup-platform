import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  const site = process.env.SITE_URL ?? "http://localhost:8080";
  return {
    rules: { userAgent: "*", allow: "/", disallow: ["/me", "/admin", "/api", "/login", "/register"] },
    sitemap: `${site}/sitemap.xml`,
  };
}
