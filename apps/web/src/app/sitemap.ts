import type { MetadataRoute } from "next";

import { listPeople, listStartups } from "@/lib/api";
import { createClient, createConfig } from "@/lib/api/client";

export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const site = process.env.SITE_URL ?? "http://localhost:8080";
  const client = createClient(
    createConfig({
      baseUrl: process.env.API_INTERNAL_URL ?? "http://localhost:8000",
    }),
  );
  const [{ data: startups }, { data: people }] = await Promise.all([
    listStartups({ client, query: { limit: 100 } }),
    listPeople({ client, query: { limit: 100 } }),
  ]);
  return [
    { url: `${site}/`, changeFrequency: "daily", priority: 1 },
    { url: `${site}/startups`, changeFrequency: "hourly", priority: 0.9 },
    { url: `${site}/people`, changeFrequency: "daily", priority: 0.7 },
    { url: `${site}/cofounders`, changeFrequency: "daily", priority: 0.8 },
    // Примеры в карту сайта не попадают: у них noindex.
    ...(startups?.items ?? [])
      .filter((s) => !s.is_demo)
      .map((s) => ({
        url: `${site}/startups/${s.slug}`,
        lastModified: s.published_at ?? undefined,
        priority: 0.8,
      })),
    ...(people?.items ?? [])
      .filter((p) => !p.is_demo)
      .map((p) => ({ url: `${site}/people/${p.slug}`, priority: 0.5 })),
  ];
}
