import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { ProjectCatalog } from "@/components/catalog/project-catalog";
import { asList, type SearchParams } from "@/components/domain/filters";

export const metadata: Metadata = {
  title: "Стартапы ищут людей в команду",
  description:
    "Стартапы от прототипа до запущенного продукта, которые ищут дизайнеров, разработчиков, маркетологов и аналитиков.",
};

export default async function StartupsPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const params = await searchParams;
  // Старые ссылки на идеи (/startups?stage=idea) ведут на отдельную страницу.
  if (asList(params.stage).join() === "idea") {
    const rest = new URLSearchParams();
    for (const [k, v] of Object.entries(params)) if (k !== "stage") for (const x of asList(v)) rest.append(k, x);
    redirect(rest.size ? `/ideas?${rest}` : "/ideas");
  }
  return <ProjectCatalog mode="startups" params={params} />;
}
