import type { Metadata } from "next";
import Link from "next/link";

import { CatalogToolbar } from "@/components/domain/filter-bar";
import { Pager, asList, type SearchParams } from "@/components/domain/filters";
import { Container, EmptyState, PageHeader } from "@/components/domain/page-header";
import { PeopleTabs } from "@/components/catalog/people-tabs";
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
  const [{ data: roles }, { data }, { data: cof }] = await Promise.all([
    listRoles({ client }),
    listPeople({ client, query: { ...selected, cofound, q: q || undefined, limit: LIMIT, offset: (page - 1) * LIMIT } }),
    listPeople({ client, query: { cofound: true, limit: 1 } }),
  ]);
  const total = data?.total ?? 0;
  const countLabel = `${total} ${plural(total, "человек", "человека", "человек")}`;
  const roleGroup = { name: "role", title: "Роль", options: (roles ?? []).map((r) => ({ value: r.slug, label: r.name })) };

  return (
    <Container>
      <PageHeader
        title="Люди"
        description="Напиши первым: обсудить идею, позвать в проект или просто познакомиться. Контакты открываются, только когда согласны оба."
      />
      <div className="mt-6">
        <PeopleTabs active="all" cofounders={cof?.total} />
      </div>

      <div className="mt-8">
        <CatalogToolbar
          basePath="/people"
          params={params}
          placeholder="Имя, роль, навык или город"
          groups={[
            roleGroup,
            { name: "cofound", title: "Ищет сообщников", toggle: true, options: [{ value: "1", label: "Только те, кто хочет придумать стартап с нуля" }] },
            { name: "looking_for", title: "Оплата", options: Object.entries(TERMS).map(([value, label]) => ({ value, label })) },
            { name: "level", title: "Опыт", options: Object.entries(LEVEL).map(([value, label]) => ({ value, label })) },
          ]}
          resultLabel={countLabel}
          summary={
            // h2 между h1 страницы и h3 карточек: порядок заголовков для экранных читалок.
            <h2 className="text-[15px] font-bold tracking-normal">{countLabel}</h2>
          }
        />
      </div>

      {data && data.items.length > 0 ? (
        <ul className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-2 sm:gap-3 md:grid-cols-3 xl:grid-cols-4">
          {data.items.map((p, i) => (
            <PersonCard key={p.slug} person={p} as="li" eager={i < 4} />
          ))}
        </ul>
      ) : (
        <div className="mt-4">
          <EmptyState
            title="Никого не нашли"
            text={q ? `По запросу «${q}» никого нет. Попробуй другое слово или убери часть фильтров.` : "Попробуй убрать часть фильтров."}
            action={
              <span className="flex flex-wrap justify-center gap-2">
                <Link href="/people" className={buttonVariants({ variant: "outline" })}>
                  Сбросить фильтры
                </Link>
                <Link href="/people/cofounders" className={buttonVariants()}>
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
