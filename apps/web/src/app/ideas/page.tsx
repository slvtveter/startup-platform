import type { Metadata } from "next";

import { ProjectCatalog } from "@/components/catalog/project-catalog";
import type { SearchParams } from "@/components/domain/filters";

export const metadata: Metadata = {
  title: "Идеи стартапов, к которым можно подключиться",
  description: "Идеи студентов и начинающих: обсуди с автором, подключись к роли, которой не хватает, или предложи свою.",
};

export default async function IdeasPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  return <ProjectCatalog mode="ideas" params={await searchParams} />;
}
