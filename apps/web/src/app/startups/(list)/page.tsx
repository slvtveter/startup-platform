import type { Metadata } from "next";

import { ProjectCatalog } from "@/components/catalog/project-catalog";
import type { SearchParams } from "@/components/domain/filters";

export const metadata: Metadata = {
  title: "Стартапы и идеи ищут людей в команду",
  description:
    "Идеи и стартапы от прототипа до запущенного продукта, которые ищут дизайнеров, разработчиков, маркетологов и аналитиков.",
};

export default async function StartupsPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  return <ProjectCatalog params={await searchParams} />;
}
