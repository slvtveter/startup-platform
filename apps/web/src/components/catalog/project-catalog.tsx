import { ArrowRight, Plus } from "lucide-react";
import Link from "next/link";

import { CatalogToolbar } from "@/components/domain/filter-bar";
import { Pager, asList, type SearchParams } from "@/components/domain/filters";
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
    search: "Тема, роль или навык",
    empty: "Убери часть фильтров или опубликуй свою идею: возможно, именно её здесь не хватает.",
    other: { href: "/startups", text: "Хочешь в проект, который уже работает?", cta: "Смотреть стартапы" },
  },
  startups: {
    title: "Стартапы",
    description: "Проекты, которые уже делают: от прототипа до запущенного продукта. Каждый ищет людей — открой карточку и откликнись на роль.",
    search: "Название, роль или навык",
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
  const countLabel = `${total} ${mode === "ideas" ? plural(total, "идея", "идеи", "идей") : plural(total, "стартап", "стартапа", "стартапов")}`;
  const roleOptions = (roles ?? []).map((r) => ({ value: r.slug, label: r.name }));

  return (
    <Container>
      <PageHeader
        title={copy.title}
        description={copy.description}
        actions={
          <Link href="/startups/new" className={buttonVariants()}>
            <Plus aria-hidden />
            {mode === "ideas" ? "Предложить идею" : "Добавить стартап"}
          </Link>
        }
      />

      <div className="mt-8">
        <CatalogToolbar
          basePath={base}
          params={params}
          placeholder={copy.search}
          groups={[
            { name: "role", title: "Кого ищут", options: roleOptions },
            { name: "terms", title: "Оплата", options: Object.entries(TERMS).map(([value, label]) => ({ value, label })) },
            ...(mode === "startups" ? [{ name: "stage", title: "Стадия", options: STAGES }] : []),
          ]}
          sorts={[
            { value: "new", label: "Сначала новые", short: "новые" },
            { value: "roles", label: "Больше открытых ролей", short: "больше ролей" },
          ]}
          resultLabel={countLabel}
          summary={
            // h2 между h1 страницы и h3 карточек: порядок заголовков для экранных читалок.
            <span className="flex flex-wrap items-baseline gap-x-4 gap-y-1">
              <h2 className="text-[15px] font-bold tracking-normal">{countLabel}</h2>
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
                  <span className="block text-2xl leading-tight font-extrabold tracking-[-0.03em]">
                    {mode === "ideas" ? "Твоя идея здесь" : "Твой проект здесь"}
                  </span>
                  <span className="mt-3 block max-w-[34ch] text-muted-foreground">
                    Опиши её в двух абзацах и отметь, кого не хватает. Её увидят разработчики, дизайнеры и маркетологи.
                  </span>
                </span>
                <span className={buttonVariants({ className: "self-start" })}>
                  <Plus aria-hidden />
                  Предложить идею
                </span>
              </Link>
            </li>
          )}
        </ul>
      ) : (
        <div className="mt-4">
          <EmptyState
            title={q && !["role", "terms", "stage"].some((k) => asList(params[k]).length) ? "Ничего не нашли" : "Под этот фильтр ничего нет"}
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
