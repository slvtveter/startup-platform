import type { Metadata } from "next";

import { ProjectCatalog } from "@/components/catalog/project-catalog";
import type { SearchParams } from "@/components/domain/filters";
import { startupFacets } from "@/lib/api";
import { startupsSeo } from "@/lib/seo";
import { getRoles, publicClient } from "@/lib/server-api";

type Props = { searchParams: Promise<SearchParams> };

export async function generateMetadata({ searchParams }: Props): Promise<Metadata> {
  const seo = startupsSeo(await searchParams, await getRoles());
  const meta: Metadata = { title: seo.title, description: seo.description, alternates: { canonical: seo.canonical } };
  // Посадочная роли без проектов — пустая страница: в индекс её не пускаем, ссылки по ней поисковик обходит.
  const role = new URLSearchParams(seo.canonical.split("?")[1]).get("role");
  if (role) {
    const { data } = await startupFacets({ client: publicClient() });
    if (!data?.role[role]) meta.robots = { index: false, follow: true };
  }
  return meta;
}

export default async function StartupsPage({ searchParams }: Props) {
  return <ProjectCatalog params={await searchParams} />;
}
