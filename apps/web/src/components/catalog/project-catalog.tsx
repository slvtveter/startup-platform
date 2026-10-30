import { Plus } from "lucide-react";
import Link from "next/link";

import { CatalogToolbar, FilterSidebar, type FilterGroup } from "@/components/domain/filter-bar";
import { Pager, asList, toggleHref, type SearchParams } from "@/components/domain/filters";
import { Container, EmptyState, PageHeader } from "@/components/domain/page-header";
import { StartupCard } from "@/components/domain/startup-card";
import { buttonVariants } from "@/components/ui/button";
import { listStartups, startupFacets } from "@/lib/api";
import { STAGE, TERMS, plural } from "@/lib/labels";
import { startupsSeo } from "@/lib/seo";
import { getRoles, serverClient } from "@/lib/server-api";
import { cn } from "@/lib/utils";

const LIMIT = 12;
const BASE = "/startups";

const STAGES = [
  { value: "idea", label: "Идеи", hint: "только задумка" },
  { value: "prototype", label: STAGE.prototype, hint: "макеты" },
  { value: "mvp", label: STAGE.mvp, hint: "первая версия" },
  { value: "launched", label: "Запущены", hint: "есть пользователи" },
];

/**
 * Каталог проектов: идеи и работающие стартапы в одном месте. Стадия — главный фильтр,
 * он стоит отдельной строкой с числами: сразу видно, сколько идей и сколько готовых проектов.
 */
export async function ProjectCatalog({ params }: { params: SearchParams }) {
  const page = Math.max(1, Number(params.page) || 1);
  const stage = asList(params.stage).filter((v) => STAGES.some((s) => s.value === v));
  const role = asList(params.role);
  const terms = asList(params.terms);
  const q = typeof params.q === "string" ? params.q : "";
  const sort = params.sort === "roles" ? "roles" : "new";
  const client = await serverClient();
  const common = { role, terms, q: q || undefined };
  // Числа у всех фильтров — одним запросом facets, а не отдельным запросом на каждую стадию.
  const [roles, { data }, { data: facets }] = await Promise.all([
    getRoles(),
    listStartups({ client, query: { ...common, stage, sort, limit: LIMIT, offset: (page - 1) * LIMIT } }),
    startupFacets({ client, query: { ...common, stage } }),
  ]);
  const counts = Object.fromEntries(STAGES.map((s) => [s.value, facets?.stage[s.value] ?? 0]));
  const all = Object.values(counts).reduce((a, b) => a + b, 0);
  const total = data?.total ?? 0;
  const onlyIdeas = stage.length === 1 && stage[0] === "idea";
  const countLabel = onlyIdeas ? `${total} ${plural(total, "идея", "идеи", "идей")}` : `${total} ${plural(total, "проект", "проекта", "проектов")}`;
  const seo = startupsSeo(params, roles);
  // Роли, под которыми есть проекты, — наверх: пустые не должны занимать первые строки списка.
  const roleOptions = roles
    .map((r) => ({ value: r.slug, label: r.name, count: facets?.role[r.slug] ?? 0 }))
    .sort((a, b) => Number(b.count > 0) - Number(a.count > 0));
  const chip = "inline-flex h-11 shrink-0 items-center gap-2 rounded-full pr-2 pl-4 text-sm font-semibold whitespace-nowrap transition-colors";
  const badge = "grid h-7 min-w-7 place-items-center rounded-full px-2 text-xs font-bold tabular-nums";
  const groups: FilterGroup[] = [
    { name: "stage", title: "Стадия", allLabel: "Все стадии", sheet: false, options: STAGES.map((s) => ({ value: s.value, label: s.label, count: counts[s.value] })) },
    { name: "role", title: "Кого ищут", options: roleOptions },
    { name: "terms", title: "Оплата", options: Object.entries(TERMS).map(([value, label]) => ({ value, label, count: facets?.terms[value] ?? 0 })) },
  ];

  return (
    <Container>
      <PageHeader
        title={seo.h1}
        actions={
          <Link href="/startups/new" className={buttonVariants()}>
            <Plus aria-hidden />
            Добавить проект
          </Link>
        }
      />

      {/* Телефон: стадия рядом прокручиваемых переключателей над поиском. На широком экране она в колонке фильтров. */}
      <nav aria-label="Стадия проекта" className="-mx-4 mt-6 flex gap-1.5 overflow-x-auto px-4 pb-1 [scrollbar-width:none] sm:mx-0 sm:flex-wrap sm:px-0 lg:hidden">
        <Link
          href={toggleHref(BASE, params, "stage", null)}
          scroll={false}
          aria-current={stage.length === 0 ? "true" : undefined}
          className={cn(chip, stage.length === 0 ? "bg-foreground text-background hover:bg-[#1d2a3f]" : "bg-tone hover:bg-tone-2")}
        >
          Все
          <span className={cn(badge, stage.length === 0 ? "bg-white/15" : "bg-white")}>{all}</span>
        </Link>
        {STAGES.map((s) => {
          const on = stage.includes(s.value);
          return (
            <Link
              key={s.value}
              href={toggleHref(BASE, params, "stage", s.value)}
              scroll={false}
              aria-current={on ? "true" : undefined}
              className={cn(chip, on ? "bg-foreground text-background hover:bg-[#1d2a3f]" : "bg-tone hover:bg-tone-2")}
            >
              {s.label}
              <span className={cn(badge, on ? "bg-white/15" : "bg-white")}>{counts[s.value]}</span>
            </Link>
          );
        })}
      </nav>

      <div className="mt-4 lg:mt-10 lg:grid lg:grid-cols-[240px_minmax(0,1fr)] lg:gap-12">
        <FilterSidebar basePath={BASE} params={params} groups={groups} />
        <div className="min-w-0">
          <CatalogToolbar
            basePath={BASE}
            params={params}
            placeholder="Название, тема, роль или навык"
            groups={groups}
            sorts={[
              { value: "new", label: "Сначала новые", short: "новые" },
              { value: "roles", label: "Больше открытых ролей", short: "больше ролей" },
            ]}
            resultLabel={countLabel}
            summary={
              // h2 между h1 страницы и h3 карточек: порядок заголовков для экранных читалок.
              <span className="flex flex-wrap items-baseline gap-x-4 gap-y-1">
                <h2 className="text-base font-bold tracking-normal">{countLabel}</h2>
                <Link href="/me/settings" className="text-sm font-semibold text-brand-ink transition-colors hover:text-brand-hover">
                  Присылать новые роли на почту
                </Link>
              </span>
            }
          />

          {data && data.items.length > 0 ? (
            <ul className="mt-4 grid gap-3 md:grid-cols-2">
              {data.items.map((s, i) => (
                <StartupCard key={s.id} startup={s} as="li" eager={i < 6} />
              ))}
              {/* Последняя страница: пустое место в ряду — приглашение опубликовать свою идею, а не дыра в сетке. */}
              {page * LIMIT >= total && (
                <li className={`h-full ${data.items.length % 2 === 0 ? "md:hidden" : ""}`}>
                  <Link
                    href="/startups/new"
                    className="card-hover flex h-full min-h-[240px] flex-col justify-center gap-6 rounded-3xl bg-brand-soft p-6 hover:bg-marker sm:p-8"
                  >
                    <span>
                      <span className="block text-2xl leading-tight font-extrabold tracking-[-0.03em]">Твой проект здесь</span>
                      <span className="mt-3 block max-w-[34ch] text-muted-foreground">Даже если это пока только идея. Отметь, кого не хватает в команде.</span>
                    </span>
                    <span className={buttonVariants({ className: "self-start" })}>
                      <Plus aria-hidden />
                      Добавить проект
                    </span>
                  </Link>
                </li>
              )}
            </ul>
          ) : (
            <div className="mt-4">
              <EmptyState
                title={q && !["role", "terms", "stage"].some((k) => asList(params[k]).length) ? "Ничего не нашли" : "Под этот фильтр ничего нет"}
                text={
                  q
                    ? `По запросу «${q}» ничего нет. Попробуй другое слово или убери часть фильтров.`
                    : "Убери часть фильтров или выбери другую стадию. Или добавь свой проект."
                }
                action={
                  <span className="flex flex-wrap justify-center gap-2">
                    <Link href={BASE} className={buttonVariants({ variant: "outline" })}>
                      Сбросить фильтры
                    </Link>
                    <Link href="/startups/new" className={buttonVariants()}>
                      Добавить проект
                    </Link>
                  </span>
                }
              />
            </div>
          )}
          <Pager basePath={BASE} params={params} total={total} limit={LIMIT} page={page} />
        </div>
      </div>
    </Container>
  );
}
