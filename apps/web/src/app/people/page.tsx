import type { Metadata } from "next";
import Link from "next/link";

import { FilterBar } from "@/components/domain/filter-bar";
import { Pager, SearchBox, asList, type SearchParams } from "@/components/domain/filters";
import { Container, EmptyState, PageHeader } from "@/components/domain/page-header";
import { PersonCard } from "@/components/domain/person-card";
import { buttonVariants } from "@/components/ui/button";
import { listPeople, listRoles } from "@/lib/api";
import { LEVEL, TERMS, plural } from "@/lib/labels";
import { serverClient } from "@/lib/server-api";

export const metadata: Metadata = {
  title: "Люди: дизайнеры, разработчики, маркетологи",
  description: "Стажёры и выпускники, которые ищут первый опыт в стартапах. Фильтр по роли, навыкам и условиям.",
};

const LIMIT = 24;

export default async function PeoplePage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const params = await searchParams;
  const page = Math.max(1, Number(params.page) || 1);
  const selected = { role: asList(params.role), level: asList(params.level), looking_for: asList(params.looking_for) };
  const q = typeof params.q === "string" ? params.q : "";
  const client = await serverClient();
  const [{ data: roles }, { data }] = await Promise.all([
    listRoles({ client }),
    listPeople({ client, query: { ...selected, q: q || undefined, limit: LIMIT, offset: (page - 1) * LIMIT } }),
  ]);
  const total = data?.total ?? 0;

  return (
    <Container>
      <PageHeader title="Люди" description="Контакты открываются только после взаимного согласия. Нашёл подходящего человека? Пригласи его на роль в своём стартапе." />
      <div className="mt-8 space-y-3">
        <SearchBox params={params} placeholder="Поиск по имени и описанию" />
        <FilterBar
          basePath="/people"
          params={params}
          groups={[
            { name: "role", title: "Роль", options: (roles ?? []).map((r) => ({ value: r.slug, label: r.name })) },
            { name: "looking_for", title: "Условия", options: Object.entries(TERMS).filter(([v]) => v !== "mixed").map(([value, label]) => ({ value, label })) },
            { name: "level", title: "Опыт", options: Object.entries(LEVEL).map(([value, label]) => ({ value, label })) },
          ]}
        />
      </div>
      <div className="mt-8 flex items-center gap-4 border-t pt-5 text-sm">
        {/* h2 между h1 страницы и h3 карточек: порядок заголовков для экранных читалок. */}
        <h2 className="font-sans text-sm font-semibold tracking-normal">
          {total} {plural(total, "человек", "человека", "человек")}
        </h2>
        {["role", "looking_for", "level", "q"].some((k) => asList(params[k]).length > 0) && (
          <Link href="/people" className="text-muted-foreground underline-offset-4 hover:underline">
            Сбросить фильтры
          </Link>
        )}
      </div>
      {data && data.items.length > 0 ? (
        <div className="stagger mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {data.items.map((p) => (
            <PersonCard key={p.slug} person={p} />
          ))}
        </div>
      ) : (
        <div className="mt-5">
          <EmptyState
            title="Никого не нашли"
            text="Попробуй убрать часть фильтров."
            action={
              <Link href="/people" className={buttonVariants({ variant: "outline" })}>
                Сбросить фильтры
              </Link>
            }
          />
        </div>
      )}
      <Pager basePath="/people" params={params} total={total} limit={LIMIT} page={page} />
    </Container>
  );
}
