import type { Metadata } from "next";
import Link from "next/link";

import { CatalogToolbar, FilterSidebar, type FilterGroup } from "@/components/domain/filter-bar";
import { Pager, asList, type SearchParams } from "@/components/domain/filters";
import { Container, EmptyState } from "@/components/domain/page-header";
import { PersonCard } from "@/components/domain/person-card";
import { buttonVariants } from "@/components/ui/button";
import { listPeople } from "@/lib/api";
import { LEVEL, TERMS, plural } from "@/lib/labels";
import { peopleSeo } from "@/lib/seo";
import { getRoles, serverClient } from "@/lib/server-api";
import { cn } from "@/lib/utils";

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
  const sort = params.sort === "experience" ? "experience" : "new";
  const client = await serverClient();
  const [roles, { data }] = await Promise.all([
    getRoles(),
    listPeople({ client, query: { ...selected, cofound, sort, q: q || undefined, limit: LIMIT, offset: (page - 1) * LIMIT } }),
  ]);
  const total = data?.total ?? 0;
  const seo = peopleSeo(params, roles);
  const countLabel = `${total} ${plural(total, "человек", "человека", "человек")}`;
  const groups: FilterGroup[] = [
    { name: "role", title: "Роль", options: roles.map((r) => ({ value: r.slug, label: r.name })) },
    {
      name: "cofound",
      title: "Ищет сообщников",
      toggle: true,
      info: { text: "Хочет придумать стартап с нуля вместе с кем-то.", href: "/people/cofounders" },
      options: [{ value: "1", label: "Ищет сообщников" }],
    },
    { name: "looking_for", title: "Оплата", options: Object.entries(TERMS).map(([value, label]) => ({ value, label })) },
    { name: "level", title: "Опыт", options: Object.entries(LEVEL).map(([value, label]) => ({ value, label })) },
  ];

  return (
    <Container>
      {/* Заголовок — над колонкой фильтров, на одной линии с поиском: без пустой полосы над каталогом. */}
      <div className="grid gap-y-5 lg:grid-cols-[240px_minmax(0,1fr)] lg:gap-x-12 lg:gap-y-6">
        <h1 className={cn("flex items-center text-[32px] leading-[1.05] sm:text-[40px] lg:min-h-11", seo.h1.length > 12 && "lg:col-span-2")}>{seo.h1}</h1>
        <div className="min-w-0 lg:col-start-2">
        <CatalogToolbar
            basePath="/people"
            params={params}
            placeholder="Имя, роль, навык или город"
            groups={groups}
            sorts={[
              { value: "new", label: "Сначала новые", short: "новые" },
              { value: "experience", label: "Сначала с опытом", short: "с опытом" },
            ]}
            resultLabel={countLabel}
            summary={
              // h2 между h1 страницы и h3 карточек: порядок заголовков для экранных читалок.
              <h2 className="text-base font-bold tracking-normal">{countLabel}</h2>
            }
          />
        </div>
        <div className={cn("lg:col-start-1 lg:row-start-2", seo.h1.length > 12 && "lg:row-span-2")}>
          <FilterSidebar basePath="/people" params={params} groups={groups} />
        </div>
        <div className="min-w-0 lg:col-start-2">
          {data && data.items.length > 0 ? (
            <ul className="grid gap-3">
              {data.items.map((p, i) => (
                <PersonCard key={p.slug} person={p} as="li" eager={i < 4} />
              ))}
            </ul>
          ) : (
            <div>
              <EmptyState
                sticker="team"
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
