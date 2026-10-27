import type { Metadata } from "next";
import Link from "next/link";

import { FilterBar } from "@/components/domain/filter-bar";
import { Pager, QuickChips, SearchBox, asList, type SearchParams } from "@/components/domain/filters";
import { Container, EmptyState, PageHeader } from "@/components/domain/page-header";
import { PersonCard } from "@/components/domain/person-card";
import { buttonVariants } from "@/components/ui/button";
import { listPeople, listRoles } from "@/lib/api";
import { LEVEL, TERMS, plural } from "@/lib/labels";
import { serverClient } from "@/lib/server-api";

export const metadata: Metadata = {
  title: "Люди: дизайнеры, разработчики, маркетологи",
  description:
    "Студенты и начинающие в IT: кто ищет команду, кто хочет придумать стартап с нуля. Фильтр по роли, опыту и условиям.",
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
  const active = ["role", "looking_for", "level", "q"].some((k) => asList(params[k]).length > 0);

  return (
    <Container>
      <PageHeader
        title="Люди"
        description="Напиши первым: обсудить идею, позвать в проект или просто познакомиться. Контакты открываются, только когда согласны оба."
        actions={
          <Link href="/cofounders" className={buttonVariants({ variant: "outline" })}>
            Кто ищет сообщников
          </Link>
        }
      />

      <div className="mt-8 grid gap-4">
        <SearchBox params={params} placeholder="Имя, роль или навык, например Figma или Python" />
        <QuickChips
          basePath="/people"
          params={params}
          name="role"
          allLabel="Все роли"
          options={(roles ?? []).slice(0, 7).map((r) => ({ value: r.slug, label: r.name }))}
        />
        <FilterBar
          basePath="/people"
          params={params}
          groups={[
            {
              name: "looking_for",
              title: "Что ищет",
              options: [{ value: "cofound", label: "Сообщников на свой стартап" }, ...Object.entries(TERMS).map(([value, label]) => ({ value, label }))],
            },
            { name: "level", title: "Опыт", options: Object.entries(LEVEL).map(([value, label]) => ({ value, label })) },
          ]}
        />
      </div>

      <div className="mt-8 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm">
        {/* h2 между h1 страницы и h3 карточек: порядок заголовков для экранных читалок. */}
        <h2 className="text-base font-bold tracking-normal">
          {total} {plural(total, "человек", "человека", "человек")}
        </h2>
        {active && (
          <Link href="/people" className="text-muted-foreground underline-offset-4 transition-colors hover:text-foreground hover:underline">
            Сбросить фильтры
          </Link>
        )}
      </div>
      {data && data.items.length > 0 ? (
        <ul className="mt-5 grid grid-cols-1 gap-3 min-[480px]:grid-cols-2 md:grid-cols-3 xl:grid-cols-4">
          {data.items.map((p, i) => (
            <PersonCard key={p.slug} person={p} as="li" eager={i < 4} />
          ))}
        </ul>
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
