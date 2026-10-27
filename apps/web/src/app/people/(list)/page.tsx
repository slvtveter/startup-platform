import type { Metadata } from "next";
import Link from "next/link";

import { DemoNote } from "@/components/domain/badges";
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
  const cofound = params.cofound === "1";
  const q = typeof params.q === "string" ? params.q : "";
  const client = await serverClient();
  const [{ data: roles }, { data }] = await Promise.all([
    listRoles({ client }),
    listPeople({ client, query: { ...selected, cofound, q: q || undefined, limit: LIMIT, offset: (page - 1) * LIMIT } }),
  ]);
  const total = data?.total ?? 0;
  const roleGroup = { name: "role", title: "Роль", options: (roles ?? []).map((r) => ({ value: r.slug, label: r.name })) };

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
        <SearchBox params={params} placeholder="Имя, роль, навык или город" />
        <QuickChips basePath="/people" params={params} name="role" allLabel="Все роли" options={roleGroup.options} />
        <FilterBar
          basePath="/people"
          params={params}
          chipGroups={[roleGroup]}
          groups={[
            { name: "cofound", title: "Ищет сообщников", options: [{ value: "1", label: "Только те, кто хочет придумать стартап с нуля" }] },
            { name: "looking_for", title: "Оплата", options: Object.entries(TERMS).map(([value, label]) => ({ value, label })) },
            { name: "level", title: "Опыт", options: Object.entries(LEVEL).map(([value, label]) => ({ value, label })) },
          ]}
        />
      </div>

      <div className="mt-8 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm">
        {/* h2 между h1 страницы и h3 карточек: порядок заголовков для экранных читалок. */}
        <h2 className="text-base font-bold tracking-normal">
          {total} {plural(total, "человек", "человека", "человек")}
        </h2>
      </div>
      {data?.items.some((x) => x.is_demo) && (
        <div className="mt-5">
          <DemoNote kind="people" />
        </div>
      )}
      {data && data.items.length > 0 ? (
        <ul className="mt-5 grid grid-cols-1 gap-2 sm:grid-cols-2 sm:gap-3 md:grid-cols-3 xl:grid-cols-4">
          {data.items.map((p, i) => (
            <PersonCard key={p.slug} person={p} as="li" eager={i < 4} />
          ))}
        </ul>
      ) : (
        <div className="mt-5">
          <EmptyState
            title="Никого не нашли"
            text={q ? `По запросу «${q}» никого нет. Попробуй другое слово или убери часть фильтров.` : "Попробуй убрать часть фильтров."}
            action={
              <span className="flex flex-wrap justify-center gap-2">
                <Link href="/people" className={buttonVariants({ variant: "outline" })}>
                  Сбросить фильтры
                </Link>
                <Link href="/cofounders" className={buttonVariants()}>
                  Кто ищет сообщников
                </Link>
              </span>
            }
          />
        </div>
      )}
      <Pager basePath="/people" params={params} total={total} limit={LIMIT} page={page} />
    </Container>
  );
}
