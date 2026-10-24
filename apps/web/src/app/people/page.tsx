import type { Metadata } from "next";

import { FilterActions, FilterGroup, Pager, asList, type SearchParams } from "@/components/domain/filters";
import { Container, EmptyState, PageHeader } from "@/components/domain/page-header";
import { PersonCard } from "@/components/domain/person-card";
import { Input } from "@/components/ui/input";
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
      <form className="mt-8 grid gap-8 lg:grid-cols-[240px_1fr]">
        <aside className="grid h-fit gap-6 rounded-2xl border bg-card p-5 lg:sticky lg:top-24">
          <FilterGroup name="role" title="Роль" selected={selected.role} options={(roles ?? []).map((r) => ({ value: r.slug, label: r.name }))} />
          <FilterGroup name="looking_for" title="Готов работать" selected={selected.looking_for} options={Object.entries(TERMS).filter(([v]) => v !== "mixed").map(([value, label]) => ({ value, label }))} />
          <FilterGroup name="level" title="Опыт" selected={selected.level} options={Object.entries(LEVEL).map(([value, label]) => ({ value, label }))} />
          <FilterActions resetHref="/people" />
        </aside>
        <section>
          <Input name="q" defaultValue={q} placeholder="Поиск по имени и описанию" className="h-11 bg-card" />
          <p className="mt-4 text-sm text-muted-foreground">
            {total} {plural(total, "человек", "человека", "человек")}
          </p>
          {data && data.items.length > 0 ? (
            <div className="mt-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {data.items.map((p) => (
                <PersonCard key={p.slug} person={p} />
              ))}
            </div>
          ) : (
            <div className="mt-4">
              <EmptyState title="Никого не нашли" text="Попробуй ослабить фильтры." />
            </div>
          )}
          <Pager basePath="/people" params={params} total={total} limit={LIMIT} page={page} />
        </section>
      </form>
    </Container>
  );
}
