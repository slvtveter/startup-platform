import type { Metadata } from "next";
import Link from "next/link";

import { CatalogToolbar, FilterSidebar, type FilterGroup } from "@/components/domain/filter-bar";
import { Pager, asList, toggleHref, type SearchParams } from "@/components/domain/filters";
import { Container, EmptyState } from "@/components/domain/page-header";
import { PersonCard } from "@/components/domain/person-card";
import { buttonVariants } from "@/components/ui/button";
import { listPeople } from "@/lib/api";
import { LEVEL, TERMS, plural } from "@/lib/labels";
import { peopleSeo } from "@/lib/seo";
import { getRoles, serverClient } from "@/lib/server-api";

type Props = { searchParams: Promise<SearchParams> };

export async function generateMetadata({ searchParams }: Props): Promise<Metadata> {
  const seo = peopleSeo(await searchParams, await getRoles());
  return { title: seo.title, description: seo.description, alternates: { canonical: seo.canonical } };
}

const LIMIT = 24;

export default async function PeoplePage({ searchParams }: Props) {
  const params = await searchParams;
  const page = Math.max(1, Number(params.page) || 1);
  const selected = { role: asList(params.role), level: asList(params.level), looking_for: asList(params.looking_for) };
  const cofound = params.cofound === "1";
  const q = typeof params.q === "string" ? params.q : "";
  const client = await serverClient();
  const [roles, { data }, { data: cof }] = await Promise.all([
    getRoles(),
    listPeople({ client, query: { ...selected, cofound, q: q || undefined, limit: LIMIT, offset: (page - 1) * LIMIT } }),
    listPeople({ client, query: { cofound: true, limit: 1 } }),
  ]);
  const total = data?.total ?? 0;
  const seo = peopleSeo(params, roles);
  const countLabel = `${total} ${plural(total, "человек", "человека", "человек")}`;
  const groups: FilterGroup[] = [
    { name: "role", title: "Роль", options: roles.map((r) => ({ value: r.slug, label: r.name })) },
    { name: "cofound", title: "Ищет сообщников", toggle: true, options: [{ value: "1", label: "Хочет придумать стартап с нуля" }] },
    { name: "looking_for", title: "Оплата", options: Object.entries(TERMS).map(([value, label]) => ({ value, label })) },
    { name: "level", title: "Опыт", options: Object.entries(LEVEL).map(([value, label]) => ({ value, label })) },
  ];

  return (
    <Container>
      <div className="flex flex-wrap items-center justify-between gap-x-10 gap-y-5">
        <h1 className="text-[32px] leading-[1.05] sm:text-[48px]">{seo.h1}</h1>
        {/* «Сообщники» — не отдельный каталог, а фильтр этого: плашка в одну строку включает его и ведёт на объяснение. */}
        {(cof?.total ?? 0) > 0 && (
          <div className="flex w-full flex-wrap items-center gap-x-5 gap-y-3 rounded-2xl bg-brand-soft py-3 pr-3 pl-5 sm:w-auto">
            <p className="flex items-center gap-2 font-bold">
              <span aria-hidden className="size-2 rounded-full bg-brand" />
              {cofound ? "Показаны только сообщники" : `${cof?.total} ${plural(cof?.total ?? 0, "ищет", "ищут", "ищут")} сообщников`}
            </p>
            <Link href="/people/cofounders" className="text-sm font-semibold text-brand-ink hover:text-brand-hover">
              Кто это
            </Link>
            <Link href={toggleHref("/people", params, "cofound", cofound ? null : "1")} scroll={false} className={buttonVariants({ size: "sm", className: "sm:ml-2" })}>
              {cofound ? "Показать всех" : "Показать их"}
            </Link>
          </div>
        )}
      </div>

      <div className="mt-8 lg:mt-10 lg:grid lg:grid-cols-[240px_minmax(0,1fr)] lg:gap-12">
        <FilterSidebar basePath="/people" params={params} groups={groups} />
        <div className="min-w-0">
          <CatalogToolbar
            basePath="/people"
            params={params}
            placeholder="Имя, роль, навык или город"
            groups={groups}
            resultLabel={countLabel}
            summary={
              // h2 между h1 страницы и h3 карточек: порядок заголовков для экранных читалок.
              <h2 className="text-base font-bold tracking-normal">{countLabel}</h2>
            }
          />

          {data && data.items.length > 0 ? (
            <ul className="mt-4 grid gap-3">
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
        </div>
      </div>
    </Container>
  );
}
