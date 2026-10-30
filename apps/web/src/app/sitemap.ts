import type { MetadataRoute } from "next";

import { listPeople, listRoles, listStartups, startupFacets } from "@/lib/api";
import { createClient, createConfig } from "@/lib/api/client";
import { GUIDES } from "@/lib/guides";

export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const site = process.env.SITE_URL ?? "http://localhost:8080";
  const client = createClient(
    createConfig({
      baseUrl: process.env.API_INTERNAL_URL ?? "http://localhost:8000",
    }),
  );
  const [{ data: startups }, { data: people }, { data: roles }, { data: facets }] = await Promise.all([
    listStartups({ client, query: { limit: 100 } }),
    listPeople({ client, query: { limit: 100 } }),
    listRoles({ client }),
    startupFacets({ client }),
  ]);
  // Посадочные «Дизайнеры», «Стартапы ищут дизайнера» (src/lib/seo.ts) — только непустые: пустая страница в индексе вредит.
  const peopleByRole = await Promise.all(
    (roles ?? []).map(async (r) => [r.slug, (await listPeople({ client, query: { role: [r.slug], limit: 1 } })).data?.total ?? 0] as const),
  );
  return [
    { url: `${site}/`, changeFrequency: "daily", priority: 1 },
    { url: `${site}/startups`, changeFrequency: "hourly", priority: 0.9 },
    { url: `${site}/startups?stage=idea`, changeFrequency: "daily", priority: 0.8 },
    { url: `${site}/people`, changeFrequency: "daily", priority: 0.7 },
    { url: `${site}/people/cofounders`, changeFrequency: "daily", priority: 0.8 },
    { url: `${site}/guides`, changeFrequency: "monthly", priority: 0.6 },
    ...GUIDES.map((g) => ({ url: `${site}/guides/${g.slug}`, lastModified: g.published, changeFrequency: "monthly" as const, priority: 0.7 })),
    ...Object.keys(facets?.role ?? {}).map((slug) => ({ url: `${site}/startups?role=${slug}`, changeFrequency: "daily" as const, priority: 0.7 })),
    ...peopleByRole.filter(([, n]) => n > 0).map(([slug]) => ({ url: `${site}/people?role=${slug}`, changeFrequency: "daily" as const, priority: 0.6 })),
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
