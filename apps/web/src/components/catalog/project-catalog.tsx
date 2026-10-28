import { Plus } from "lucide-react";
import Link from "next/link";

import { CatalogToolbar } from "@/components/domain/filter-bar";
import { Pager, asList, toggleHref, type SearchParams } from "@/components/domain/filters";
import { Container, EmptyState, PageHeader } from "@/components/domain/page-header";
import { StartupCard } from "@/components/domain/startup-card";
import { buttonVariants } from "@/components/ui/button";
import { listRoles, listStartups } from "@/lib/api";
import { STAGE, TERMS, plural } from "@/lib/labels";
import { serverClient } from "@/lib/server-api";
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
  const [{ data: roles }, { data }, ...perStage] = await Promise.all([
    listRoles({ client }),
    listStartups({ client, query: { ...common, stage, sort, limit: LIMIT, offset: (page - 1) * LIMIT } }),
    // Сколько проектов на каждой стадии при остальных фильтрах — для чисел на переключателе.
    ...STAGES.map((s) => listStartups({ client, query: { ...common, stage: [s.value], limit: 1 } })),
  ]);
  const counts = Object.fromEntries(STAGES.map((s, i) => [s.value, perStage[i].data?.total ?? 0]));
  const all = Object.values(counts).reduce((a, b) => a + b, 0);
  const total = data?.total ?? 0;
  const onlyIdeas = stage.length === 1 && stage[0] === "idea";
  const countLabel = onlyIdeas ? `${total} ${plural(total, "идея", "идеи", "идей")}` : `${total} ${plural(total, "проект", "проекта", "проектов")}`;
  const roleOptions = (roles ?? []).map((r) => ({ value: r.slug, label: r.name }));
  const chip = "inline-flex h-11 shrink-0 items-center gap-2 rounded-full pr-2 pl-4 text-sm font-semibold whitespace-nowrap transition-colors";
  const badge = "grid h-7 min-w-7 place-items-center rounded-full px-2 text-xs font-bold tabular-nums";

  return (
    <Container>
      <PageHeader
        title="Стартапы"
        description="От сырых идей до запущенных продуктов. Выбери стадию: к идее можно подключиться с самого начала, в работающий проект — прийти на готовую роль."
        actions={
          <Link href="/startups/new" className={buttonVariants()}>
            <Plus aria-hidden />
            Добавить проект
          </Link>
        }
      />

      <nav aria-label="Стадия проекта" className="-mx-4 mt-8 flex gap-1.5 overflow-x-auto px-4 pb-1 [scrollbar-width:none] sm:mx-0 sm:flex-wrap sm:px-0">
        <Link
          href={toggleHref(BASE, params, "stage", null)}
          scroll={false}
          aria-current={stage.length === 0 ? "true" : undefined}
          className={cn(chip, stage.length === 0 ? "bg-foreground text-background hover:bg-[#1d2a3f]" : "bg-tone hover:bg-tone-2")}
        >
          Все стадии
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
              title={s.hint}
              className={cn(chip, on ? "bg-foreground text-background hover:bg-[#1d2a3f]" : "bg-tone hover:bg-tone-2")}
            >
              {s.label}
              <span className={cn(badge, on ? "bg-white/15" : "bg-white")}>{counts[s.value]}</span>
            </Link>
          );
        })}
      </nav>

      <div className="mt-4">
        <CatalogToolbar
          basePath={BASE}
          params={params}
          placeholder="Название, тема, роль или навык"
          groups={[
            { name: "role", title: "Кого ищут", options: roleOptions },
            { name: "terms", title: "Оплата", options: Object.entries(TERMS).map(([value, label]) => ({ value, label })) },
          ]}
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
      </div>

      {data && data.items.length > 0 ? (
        <ul className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {data.items.map((s, i) => (
            <StartupCard key={s.id} startup={s} as="li" eager={i < 6} />
          ))}
          {/* Последняя страница: пустое место в ряду — приглашение опубликовать свою идею, а не дыра в сетке. */}
          {page * LIMIT >= total && (
            <li className={`h-full ${data.items.length % 3 === 0 ? "lg:hidden" : ""} ${data.items.length % 2 === 0 ? "sm:max-lg:hidden" : ""}`}>
              <Link
                href="/startups/new"
                className="card-hover flex h-full min-h-[260px] flex-col justify-center gap-6 rounded-[28px] bg-brand-soft p-8 hover:bg-marker"
              >
                <span>
                  <span className="block text-2xl leading-tight font-extrabold tracking-[-0.03em]">Твой проект здесь</span>
                  <span className="mt-3 block max-w-[34ch] text-muted-foreground">
                    Даже если это пока только идея: опиши проблему и отметь, кого не хватает. Её увидят разработчики, дизайнеры и маркетологи.
                  </span>
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
                : "Убери часть фильтров или выбери другую стадию. А может, именно твоего проекта здесь не хватает?"
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
    </Container>
  );
}
