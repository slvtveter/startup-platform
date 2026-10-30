import type { Metadata } from "next";

import { ProjectCatalog } from "@/components/catalog/project-catalog";
import type { SearchParams } from "@/components/domain/filters";
import { startupsSeo } from "@/lib/seo";
import { getRoles } from "@/lib/server-api";

type Props = { searchParams: Promise<SearchParams> };

export async function generateMetadata({ searchParams }: Props): Promise<Metadata> {
  const seo = startupsSeo(await searchParams, await getRoles());
  return { title: seo.title, description: seo.description, alternates: { canonical: seo.canonical } };
}

export default async function StartupsPage({ searchParams }: Props) {
  return <ProjectCatalog params={await searchParams} />;
}
