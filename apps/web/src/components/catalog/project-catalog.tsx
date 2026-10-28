import { ArrowRight, Plus } from "lucide-react";
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

const LIMIT = 12;

// Стартапы — проекты, которые уже делают; идеи живут на своей странице /ideas.
const STAGES = [
  { value: "prototype", label: STAGE.prototype },
  { value: "mvp", label: STAGE.mvp },
  { value: "launched", label: "Запущены" },
];
const WORKING = STAGES.map((s) => s.value);

const COPY = {
  ideas: {
    title: "Идеи",
    description: "Сырые, но живые идеи. Открой, задай вопрос автору или подключись к роли, которой не хватает.",
    search: "Тема, роль или навык: учёба, собаки, дизайнер",
    empty: "Убери часть фильтров или опубликуй свою идею: возможно, именно её здесь не хватает.",
    other: { href: "/startups", text: "Хочешь в проект, который уже работает?", cta: "Смотреть стартапы" },
  },
  startups: {
    title: "Стартапы",
    description: "Проекты, которые уже делают: от прототипа до запущенного продукта. Каждый ищет людей — открой карточку и откликнись на роль.",
    search: "Название, роль или навык: дизайнер, React, ML",
    empty: "Убери часть фильтров или загляни в идеи: там проекты в самом начале.",
    other: { href: "/ideas", text: "Хочешь начать с самого начала?", cta: "Смотреть идеи" },
  },
};

/** Каталог проектов в двух режимах: «Идеи» (стадия idea) и «Стартапы» (всё, что уже делают). */
export async function ProjectCatalog({ mode, params }: { mode: "ideas" | "startups"; params: SearchParams }) {
  const base = mode === "ideas" ? "/ideas" : "/startups";
  const copy = COPY[mode];
  const page = Math.max(1, Number(params.page) || 1);
  const selected = {
    role: asList(params.role),
    terms: asList(params.terms),
    stage: mode === "ideas" ? ["idea"] : asList(params.stage).filter((v) => WORKING.includes(v)),
  };
  if (mode === "startups" && selected.stage.length === 0) selected.stage = WORKING;
  const q = typeof params.q === "string" ? params.q : "";
  const sort = params.sort === "roles" ? "roles" : "new";
  const client = await serverClient();
  const [{ data: roles }, { data }] = await Promise.all([
    listRoles({ client }),
    listStartups({ client, query: { ...selected, q: q || undefined, sort, limit: LIMIT, offset: (page - 1) * LIMIT } }),
  ]);
  const total = data?.total ?? 0;

  return (
    <Container>
      <PageHeader
        title={copy.title}
        description={copy.description}
        actions={
          <Link href="/startups/new" className={buttonVariants()}>
            <Plus aria-hidden />
            Предложить идею
          </Link>
        }
      />

      <div className="mt-8 grid gap-4">
        <SearchBox params={params} placeholder={copy.search} />
        {mode === "startups" ? (
          <QuickChips basePath={base} params={params} name="stage" options={STAGES} allLabel="Все стадии" />
        ) : (
          <QuickChips basePath={base} params={params} name="role" options={(roles ?? []).map((r) => ({ value: r.slug, label: r.name }))} allLabel="Все роли" />
        )}
        <FilterBar
          basePath={base}
          params={params}
          chipGroups={
            mode === "startups"
              ? [{ name: "stage", title: "Стадия", options: STAGES }]
              : [{ name: "role", title: "Кого ищут", options: (roles ?? []).map((r) => ({ value: r.slug, label: r.name })) }]
          }
          groups={[
            ...(mode === "startups" ? [{ name: "role", title: "Кого ищут", options: (roles ?? []).map((r) => ({ value: r.slug, label: r.name })) }] : []),
            { name: "terms", title: "Оплата", options: Object.entries(TERMS).map(([value, label]) => ({ value, label })) },
          ]}
        />
      </div>

      <div className="mt-8 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm">
        {/* h2 между h1 страницы и h3 карточек: порядок заголовков для экранных читалок. */}
        <h2 className="text-base font-bold tracking-normal">
          {total} {mode === "ideas" ? plural(total, "идея", "идеи", "идей") : plural(total, "стартап", "стартапа", "стартапов")}
        </h2>
        <span className="ml-auto inline-flex rounded-full bg-tone p-1" role="group" aria-label="Сортировка">
          {[
            ["new", "Сначала новые"],
            ["roles", "Больше открытых ролей"],
          ].map(([value, label]) => (
            <Link
              key={value}
              href={toggleHref(base, { ...params, sort: undefined }, "sort", value === "new" ? null : value)}
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
            text={q ? `По запросу «${q}» ничего нет. Попробуй другое слово или убери часть фильтров.` : copy.empty}
            action={
              <span className="flex flex-wrap justify-center gap-2">
                <Link href={base} className={buttonVariants({ variant: "outline" })}>
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
      <Pager basePath={base} params={params} total={total} limit={LIMIT} page={page} />
      <Link
        href={copy.other.href}
        className="mt-10 flex flex-wrap items-center gap-x-4 gap-y-2 rounded-[26px] bg-tone px-6 py-5 transition-colors hover:bg-tone-2"
      >
        <span className="font-semibold">{copy.other.text}</span>
        <span className="inline-flex items-center gap-1.5 font-bold text-brand-ink sm:ml-auto">
          {copy.other.cta}
          <ArrowRight aria-hidden className="size-4" />
        </span>
      </Link>
    </Container>
  );
}
