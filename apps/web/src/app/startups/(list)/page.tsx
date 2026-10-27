import { Plus } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";

import { DemoNote } from "@/components/domain/badges";
import { FilterBar } from "@/components/domain/filter-bar";
import { Pager, QuickChips, SearchBox, asList, toggleHref, type SearchParams } from "@/components/domain/filters";
import { Container, EmptyState, PageHeader } from "@/components/domain/page-header";
import { StartupCard } from "@/components/domain/startup-card";
import { buttonVariants } from "@/components/ui/button";
import { listRoles, listStartups } from "@/lib/api";
import { STAGE, TERMS, plural } from "@/lib/labels";
import { serverClient } from "@/lib/server-api";

export const metadata: Metadata = {
  title: "Идеи и стартапы, которые ищут людей",
  description:
    "Идеи, которые обсуждают и под которые собирают команду, и стартапы, которые ищут дизайнеров, разработчиков, маркетологов и аналитиков.",
};

const LIMIT = 12;

const STAGES = [
  { value: "idea", label: "Идеи" },
  { value: "prototype", label: STAGE.prototype },
  { value: "mvp", label: STAGE.mvp },
  { value: "launched", label: "Запущены" },
];

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
  const ideasOnly = selected.stage.length === 1 && selected.stage[0] === "idea";

  return (
    <Container>
      <PageHeader
        title={ideasOnly ? "Идеи" : "Идеи и стартапы"}
        description={
          ideasOnly
            ? "Сырые, но живые идеи. Открой, задай вопрос автору или откликнись на роль, которой не хватает."
            : "От идеи в двух абзацах до работающего продукта. Каждый проект ищет людей: открой карточку и откликнись на роль."
        }
        actions={
          <Link href="/startups/new" className={buttonVariants()}>
            <Plus aria-hidden />
            Предложить идею
          </Link>
        }
      />

      <div className="mt-8 grid gap-4">
        <SearchBox params={params} placeholder="Тема, роль или навык: собаки, дизайнер, React" />
        <QuickChips basePath="/startups" params={params} name="stage" options={STAGES} allLabel="Все стадии" />
        <FilterBar
          basePath="/startups"
          params={params}
          chipGroups={[{ name: "stage", title: "Стадия", options: STAGES }]}
          groups={[
            { name: "role", title: "Кого ищут", options: (roles ?? []).map((r) => ({ value: r.slug, label: r.name })) },
            { name: "terms", title: "Оплата", options: Object.entries(TERMS).map(([value, label]) => ({ value, label })) },
          ]}
        />
      </div>

      <div className="mt-8 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm">
        {/* h2 между h1 страницы и h3 карточек: порядок заголовков для экранных читалок. */}
        <h2 className="text-base font-bold tracking-normal">
          {total} {plural(total, "проект", "проекта", "проектов")}
        </h2>
        <span className="ml-auto inline-flex rounded-full bg-tone p-1" role="group" aria-label="Сортировка">
          {[
            ["new", "Сначала новые"],
            ["roles", "Больше открытых ролей"],
          ].map(([value, label]) => (
            <Link
              key={value}
              href={toggleHref("/startups", { ...params, sort: undefined }, "sort", value === "new" ? null : value)}
              scroll={false}
              aria-current={sort === value ? "true" : undefined}
              className={`rounded-full px-3.5 py-1.5 font-semibold transition-colors duration-200 ${sort === value ? "bg-white text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}
            >
              {label}
            </Link>
          ))}
        </span>
      </div>

      {data?.items.some((x) => x.is_demo) && (
        <div className="mt-5">
          <DemoNote kind="startups" />
        </div>
      )}
      {data && data.items.length > 0 ? (
        <ul className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {data.items.map((s, i) => (
            <StartupCard key={s.id} startup={s} as="li" eager={i < 3} />
          ))}
        </ul>
      ) : (
        <div className="mt-5">
          <EmptyState
            title="Под этот фильтр ничего нет"
            text={q ? `По запросу «${q}» ничего нет. Попробуй другое слово или убери часть фильтров.` : "Убери часть фильтров или предложи свою идею: возможно, именно её здесь не хватает."}
            action={
              <span className="flex flex-wrap justify-center gap-2">
                <Link href="/startups" className={buttonVariants({ variant: "outline" })}>
                  Сбросить фильтры
                </Link>
                <Link href="/startups/new" className={buttonVariants()}>
                  Предложить идею
                </Link>
              </span>
            }
          />
        </div>
      )}
      <Pager basePath="/startups" params={params} total={total} limit={LIMIT} page={page} />
    </Container>
  );
}
