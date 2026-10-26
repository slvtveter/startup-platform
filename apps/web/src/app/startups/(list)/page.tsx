import type { Metadata } from "next";
import Link from "next/link";

import { FilterBar } from "@/components/domain/filter-bar";
import { Pager, SearchBox, asList, toggleHref, type SearchParams } from "@/components/domain/filters";
import { Container, EmptyState, PageHeader } from "@/components/domain/page-header";
import { StartupCard } from "@/components/domain/startup-card";
import { buttonVariants } from "@/components/ui/button";
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

  const active = ["role", "terms", "stage", "q"].some((k) => asList(params[k]).length > 0);

  return (
    <Container>
      <PageHeader
        title="Стартапы"
        description="Проекты, которые прямо сейчас ищут людей в команду. Откликнуться можно на любую открытую роль."
      />
      <div className="mt-8 space-y-3">
        <SearchBox params={params} placeholder="Поиск по названию и описанию" />
        <FilterBar
          basePath="/startups"
          params={params}
          groups={[
            { name: "role", title: "Кого ищут", options: (roles ?? []).map((r) => ({ value: r.slug, label: r.name })) },
            { name: "terms", title: "Условия", options: Object.entries(TERMS).map(([value, label]) => ({ value, label })) },
            { name: "stage", title: "Стадия", options: Object.entries(STAGE).map(([value, label]) => ({ value, label })) },
          ]}
        />
      </div>
      <div className="mt-8 flex flex-wrap items-center gap-x-4 gap-y-2 border-t pt-5 text-sm">
        {/* h2 между h1 страницы и h3 карточек: порядок заголовков для экранных читалок. */}
        <h2 className="font-sans text-sm font-semibold tracking-normal">
          {total} {plural(total, "стартап", "стартапа", "стартапов")}
        </h2>
        {active && (
          <Link href="/startups" className="text-muted-foreground underline-offset-4 hover:underline">
            Сбросить фильтры
          </Link>
        )}
        <span className="ml-auto flex gap-1">
          {[
            ["new", "Сначала новые"],
            ["roles", "Больше мест"],
          ].map(([value, label]) => (
            <Link
              key={value}
              href={toggleHref("/startups", { ...params, sort: undefined }, "sort", value === "new" ? null : value)}
              aria-current={sort === value ? "true" : undefined}
              className={`rounded-lg px-3 py-1.5 font-medium ${sort === value ? "bg-secondary text-foreground" : "text-muted-foreground hover:text-foreground"}`}
            >
              {label}
            </Link>
          ))}
        </span>
      </div>
      {data && data.items.length > 0 ? (
        <div className="stagger mt-5 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {data.items.map((s) => (
            <StartupCard key={s.id} startup={s} />
          ))}
        </div>
      ) : (
        <div className="mt-5">
          <EmptyState
            title="Под этот фильтр ничего нет"
            text="Попробуй убрать часть условий. Или создай свой стартап: возможно, именно его здесь не хватает."
            action={
              <Link href="/startups/new" className={buttonVariants({ variant: "brand" })}>
                Разместить стартап
              </Link>
            }
          />
        </div>
      )}
      <Pager basePath="/startups" params={params} total={total} limit={LIMIT} page={page} />
    </Container>
  );
}
