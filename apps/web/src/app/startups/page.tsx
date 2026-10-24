import type { Metadata } from "next";
import Link from "next/link";

import { FilterActions, FilterGroup, Pager, asList, type SearchParams } from "@/components/domain/filters";
import { Container, EmptyState, PageHeader } from "@/components/domain/page-header";
import { StartupCard } from "@/components/domain/startup-card";
import { buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { listRoles, listStartups } from "@/lib/api";
import { STAGE, TERMS, plural } from "@/lib/labels";
import { serverClient } from "@/lib/server-api";

export const metadata: Metadata = {
  title: "Стартапы ищут участников",
  description: "Стартапы, которые ищут дизайнеров, разработчиков, маркетологов и аналитиков. Бесплатно, за деньги или за долю.",
};

const LIMIT = 12;

export default async function StartupsPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const params = await searchParams;
  const page = Math.max(1, Number(params.page) || 1);
  const selected = {
    role: asList(params.role),
    terms: asList(params.terms),
    stage: asList(params.stage),
  };
  const q = typeof params.q === "string" ? params.q : "";
  const sort = params.sort === "roles" ? "roles" : "new";
  const client = await serverClient();
  const [{ data: roles }, { data }] = await Promise.all([
    listRoles({ client }),
    listStartups({ client, query: { ...selected, q: q || undefined, sort, limit: LIMIT, offset: (page - 1) * LIMIT } }),
  ]);
  const total = data?.total ?? 0;

  return (
    <Container>
      <PageHeader
        title="Стартапы"
        description="Проекты, которые прямо сейчас ищут людей в команду. Условия участия указаны в каждой карточке."
        actions={
          <Link href="/startups/new" className={buttonVariants({ variant: "brand" })}>
            Создать стартап
          </Link>
        }
      />
      <form className="mt-8 grid gap-8 lg:grid-cols-[240px_1fr]">
        <aside className="grid h-fit gap-6 rounded-2xl border bg-card p-5 lg:sticky lg:top-24">
          <FilterGroup name="role" title="Кого ищут" selected={selected.role} options={(roles ?? []).map((r) => ({ value: r.slug, label: r.name }))} />
          <FilterGroup name="terms" title="Условия" selected={selected.terms} options={Object.entries(TERMS).map(([value, label]) => ({ value, label }))} />
          <FilterGroup name="stage" title="Стадия" selected={selected.stage} options={Object.entries(STAGE).map(([value, label]) => ({ value, label }))} />
          <FilterActions resetHref="/startups" />
        </aside>
        <section>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <Input name="q" defaultValue={q} placeholder="Поиск по названию и описанию" className="h-11 bg-card sm:flex-1" />
            <select name="sort" defaultValue={sort} className="h-11 rounded-lg border bg-card px-3 text-sm font-semibold">
              <option value="new">Сначала новые</option>
              <option value="roles">Больше открытых ролей</option>
            </select>
          </div>
          <p className="mt-4 text-sm text-muted-foreground">
            Найдено {total} {plural(total, "стартап", "стартапа", "стартапов")}
          </p>
          {data && data.items.length > 0 ? (
            <div className="mt-4 grid gap-4 md:grid-cols-2">
              {data.items.map((s) => (
                <StartupCard key={s.id} startup={s} />
              ))}
            </div>
          ) : (
            <div className="mt-4">
              <EmptyState
                title="Под этот фильтр ничего нет"
                text="Попробуй убрать часть условий. Или создай свой стартап: возможно, именно его здесь не хватает."
                action={
                  <Link href="/startups/new" className={buttonVariants({ variant: "brand" })}>
                    Создать стартап
                  </Link>
                }
              />
            </div>
          )}
          <Pager basePath="/startups" params={params} total={total} limit={LIMIT} page={page} />
        </section>
      </form>
    </Container>
  );
}
