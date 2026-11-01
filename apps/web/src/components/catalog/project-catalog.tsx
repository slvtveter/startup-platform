import { Plus } from "lucide-react";
import Link from "next/link";

import { CatalogToolbar, FilterSidebar, type FilterGroup } from "@/components/domain/filter-bar";
import { Pager, asList, type SearchParams } from "@/components/domain/filters";
import { Container, EmptyState } from "@/components/domain/page-header";
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
  const total = data?.total ?? 0;
  const onlyIdeas = stage.length === 1 && stage[0] === "idea";
  const countLabel = onlyIdeas ? `${total} ${plural(total, "идея", "идеи", "идей")}` : `${total} ${plural(total, "проект", "проекта", "проектов")}`;
  const seo = startupsSeo(params, roles);
  // Роли, под которыми есть проекты, — наверх: пустые не должны занимать первые строки списка.
  const roleOptions = roles
    .map((r) => ({ value: r.slug, label: r.name, count: facets?.role[r.slug] ?? 0 }))
    .sort((a, b) => Number(b.count > 0) - Number(a.count > 0));
  const groups: FilterGroup[] = [
    { name: "stage", title: "Стадия", options: STAGES.map((s) => ({ value: s.value, label: s.label, count: counts[s.value] })) },
    { name: "role", title: "Кого ищут", options: roleOptions },
    { name: "terms", title: "Оплата", options: Object.entries(TERMS).map(([value, label]) => ({ value, label, count: facets?.terms[value] ?? 0 })) },
  ];

  return (
    <Container>
      {/* Заголовок — над колонкой фильтров, на одной линии с поиском: без пустой полосы над каталогом.
          Длинный SEO-заголовок («Стартапы ищут Frontend-разработчика») — на всю ширину. */}
      <div className="grid gap-y-5 lg:grid-cols-[240px_minmax(0,1fr)] lg:gap-x-12 lg:gap-y-6">
        <div className={cn("flex items-center justify-between gap-4 lg:min-h-11 lg:self-start", seo.h1.length > 12 && "lg:col-span-2")}>
          <h1 className="text-[32px] leading-[1.05] sm:text-[40px]">{seo.h1}</h1>
          <Link href="/startups/new" className={buttonVariants({ size: "sm", variant: "outline", className: "shrink-0 lg:hidden" })}>
            <Plus aria-hidden />
            Проект
          </Link>
        </div>
          <div className="min-w-0 lg:col-start-2">
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
            action={
              <Link href="/startups/new" className={buttonVariants({ className: "h-11" })}>
                <Plus aria-hidden />
                Добавить проект
              </Link>
            }
            summary={
              // h2 между h1 страницы и h3 карточек: порядок заголовков для экранных читалок.
              <span className="flex flex-wrap items-baseline gap-x-4 gap-y-1">
                <h2 className="text-base font-bold tracking-normal">{countLabel}</h2>
                <Link href="/me/settings" className="inline-flex min-h-6 items-center text-sm font-semibold text-brand-ink transition-colors hover:text-brand-hover">
                  Присылать новые стартапы на почту
                </Link>
              </span>
            }
          />
        </div>
        <div className={cn("lg:col-start-1 lg:row-start-2", seo.h1.length > 12 && "lg:row-span-2")}>
          <FilterSidebar basePath={BASE} params={params} groups={groups} />
        </div>
        <div className="min-w-0 lg:col-start-2">
          {data && data.items.length > 0 ? (
            <ul className="grid gap-3">
              {data.items.map((s, i) => (
                <StartupCard key={s.id} startup={s} as="li" eager={i < 6} />
              ))}
              {/* Последняя страница: пустое место в ряду — приглашение опубликовать свою идею, а не дыра в сетке. */}
              {page * LIMIT >= total && (
                <li>
                  <Link
                    href="/startups/new"
                    className="card-hover flex h-full flex-col justify-center gap-6 rounded-3xl bg-brand-soft p-6 hover:bg-marker sm:p-8"
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
            <div>
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
