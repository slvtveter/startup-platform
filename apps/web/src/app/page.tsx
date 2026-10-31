import { ArrowRight, PlusIcon } from "lucide-react";
import type { Metadata } from "next";
import type { CSSProperties } from "react";
import Image from "next/image";
import Link from "next/link";

import { Dashboard } from "@/components/domain/dashboard";
import { StartupCard } from "@/components/domain/startup-card";
import { HomeFeed, type FeedTab } from "@/components/landing/home-feed";
import { JsonLd, siteUrl } from "@/components/site/json-ld";
import { PathLink } from "@/components/site/path-link";
import { Reveal } from "@/components/site/reveal";
import { TrackView } from "@/components/site/track-view";
import { buttonVariants } from "@/components/ui/button";
import { listPeople, listStartups, startupFacets, type PersonCard as Person, type StartupCard as Startup } from "@/lib/api";
import { COFOUND, STAGE, initials, plural } from "@/lib/labels";
import { PHOTOS } from "@/lib/photos";
import { getMe, getRoles, serverClient } from "@/lib/server-api";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { alternates: { canonical: "/" } };

export default async function Home() {
  const user = await getMe();
  return user ? <Dashboard /> : <Landing />;
}

const wrap = "mx-auto w-full max-w-[1360px] px-4 sm:px-6 lg:px-10";
const delay = (ms: number) => ({ "--d": `${ms}ms` }) as CSSProperties;

/**
 * Лендинг для гостя. Главное — попасть в стартап и быстро набрать опыт; идеи и сообщники — дополнение.
 * Порядок по разбору конкурентов (docs/research/competitors-home.md): первый экран с живыми фрагментами
 * интерфейса → кого ищут → стартапы → четыре дороги → сообщники → три шага → вопросы → призыв.
 */
async function Landing() {
  const client = await serverClient();
  const [allRoles, { data: facets }, { data: catalog }, { data: people }] = await Promise.all([
    getRoles(),
    startupFacets({ client }),
    listStartups({ client, query: { limit: 100 } }),
    listPeople({ client, query: { limit: 100 } }),
  ]);

  // Сколько проектов ищет каждую роль — чипсы «кого ищут» с числами, как «Популярное» на hh.
  const roles = allRoles
    .map((r) => ({ slug: r.slug, name: r.name, n: facets?.role[r.slug] ?? 0 }))
    .filter((r) => r.n > 0)
    .sort((a, b) => b.n - a.n);

  // На главной закреплены примеры (is_demo): новые профили и проекты не сдвигают карточки витрины.
  const projects = pinned(catalog?.items ?? []);
  const startups = projects.filter((s) => s.stage !== "idea");
  const ideas = projects.filter((s) => s.stage === "idea");
  const folks = pinned(people?.items ?? []).filter((p) => p.avatar_url);
  const cofounders = folks.filter((p) => p.looking_for.includes(COFOUND));
  const featured = startups.find((s) => s.open_roles.length > 0 && s.owner_avatar_url) ?? startups[0];

  const grid = "grid gap-3 sm:grid-cols-2 lg:grid-cols-3";
  const feed: FeedTab[] = [];
  if (startups.length)
    feed.push({
      value: "startups",
      label: "Стартапы",
      more: { href: "/startups?stage=prototype&stage=mvp&stage=launched", label: "Все стартапы" },
      content: (
        <div className={grid}>
          {startups.slice(0, 6).map((s, i) => (
            <div key={s.id} className={cn(i >= 3 && "max-sm:hidden")}>
              <StartupCard startup={s} />
            </div>
          ))}
        </div>
      ),
    });
  if (ideas.length) {
    const shown = ideas.slice(0, 5);
    feed.push({
      value: "ideas",
      label: "Идеи",
      more: { href: "/startups?stage=idea", label: "Все идеи" },
      content: (
        <div className={grid}>
          {shown.map((s) => (
            <StartupCard key={s.id} startup={s} />
          ))}
          {/* Приглашение добивает последний ряд до конца: на широком экране тянется на свободные колонки. */}
          <OwnIdeaCard
            wide={shown.length % 3 !== 2}
            className={cn(shown.length % 2 === 0 && "sm:col-span-2", { 0: "lg:col-span-3", 1: "lg:col-span-2", 2: "lg:col-span-1" }[shown.length % 3])}
          />
        </div>
      ),
    });
  }

  return (
    <>
      <TrackView name="landing_viewed" />
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@graph": [
            { "@type": "WebSite", name: "Envola", url: siteUrl("/"), inLanguage: "ru" },
            {
              "@type": "Organization",
              name: "Envola",
              url: siteUrl("/"),
              logo: siteUrl("/brand/logo.svg"),
              description: "Стартапы, которые ищут студентов и начинающих в IT: первый опыт в настоящей команде.",
            },
            {
              "@type": "FAQPage",
              mainEntity: FAQ.map(([q, a]) => ({ "@type": "Question", name: q, acceptedAnswer: { "@type": "Answer", text: a } })),
            },
          ],
        }}
      />

      <Hero startup={featured} faces={folks.slice(0, 5)} />

      {roles.length > 0 && <RoleStrip roles={roles} />}

      {feed.length > 0 && (
        <Section id="feed" eyebrow="Сейчас в каталоге" title="Стартапы, которые ищут людей">
          <HomeFeed tabs={feed} />
        </Section>
      )}

      <Section eyebrow="С чего начать" title="Четыре дороги в команду">
        <Paths startups={startups.slice(0, 3)} idea={ideas[0]} people={folks.slice(5, 8)} faces={cofounders.slice(0, 6)} />
      </Section>

      {cofounders.length > 0 && <Cofounders people={cofounders.slice(0, 4)} total={cofounders.length} />}


      <Section title="Как попасть в команду стартапа" className="max-md:hidden">
        <Steps />
      </Section>

      <Section id="faq" eyebrow="Вопросы" title="Частые вопросы">
        <Faq />
      </Section>

      <FinalCta />
    </>
  );
}

/** Только примеры, если они есть; иначе (локально без сида) — всё как есть. */
function pinned<T extends { is_demo?: boolean }>(items: T[]) {
  return items.some((x) => x.is_demo) ? items.filter((x) => x.is_demo) : items;
}

/* ───────────── Первый экран ───────────── */

function Hero({ startup, faces }: { startup?: Startup; faces: Person[] }) {
  return (
    <section className={`${wrap} grid items-center gap-10 pt-8 pb-4 sm:pt-12 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.02fr)] lg:gap-14 lg:pt-14`}>
      <div className="max-w-[640px]">
        <p className="inline-flex items-center gap-2 rounded-full bg-brand-soft px-3.5 py-1.5 text-sm font-bold text-brand-ink">
          <span aria-hidden className="size-1.5 rounded-full bg-brand" />
          Для студентов и начинающих в IT
        </p>
        <h1 className="mt-5 text-[38px] leading-[1] tracking-[-0.045em] text-balance sm:mt-6 sm:text-[60px] sm:leading-[0.98] lg:text-[64px]">
          Получи первый опыт в настоящем <span className="text-brand">стартапе</span>
        </h1>
        <p className="mt-6 max-w-[44ch] text-lg text-muted-foreground sm:text-xl">
          Можно без опыта и без резюме.
        </p>
        <div className="mt-8 grid gap-2.5 sm:mt-9 sm:flex sm:flex-wrap">
          <PathLink path="seeker" href="/startups" className={buttonVariants({ size: "lg" })}>
            Смотреть стартапы
            <ArrowRight aria-hidden />
          </PathLink>
          <PathLink path="seeker" href="/register" className={buttonVariants({ variant: "secondary", size: "lg" })}>
            Создать профиль
          </PathLink>
        </div>
        {faces.length >= 3 && (
          <div className="mt-9 flex items-center gap-3.5">
            <span className="flex shrink-0 -space-x-2.5">
              {faces.map((p) => (
                // eslint-disable-next-line @next/next/no-img-element -- аватары уже пережаты api в WebP
                <img key={p.slug} src={p.avatar_url!} alt="" className="size-10 rounded-full object-cover ring-[3px] ring-background" />
              ))}
            </span>
            <span className="text-sm leading-5 text-muted-foreground">
              <b className="block font-bold text-foreground">Разработчики, дизайнеры, маркетологи</b>
              ищут команду и проекты
            </span>
          </div>
        )}
      </div>

      {/* Фото и поверх карточка настоящего стартапа из каталога (как у Wellfound). */}
      <div className="relative">
        <div className="relative aspect-[4/3.4] overflow-hidden rounded-[32px] sm:aspect-[4/3] lg:aspect-[5/5.2]">
          <Image
            src={PHOTOS.heroTeam}
            alt="Команда обсуждает проект за столом с ноутбуком"
            fill
            preload
            placeholder="blur"
            quality={85}
            sizes="(min-width: 1024px) 50vw, 100vw"
            className="object-cover object-[60%_40%]"
          />
        </div>

        {startup && (
          <Link
            href={`/startups/${startup.slug}`}
            className="chat-msg absolute right-4 bottom-4 left-4 flex items-center gap-3.5 rounded-3xl bg-white p-3 shadow-[0_24px_50px_-16px_rgb(15_27_45/0.45)] transition-shadow duration-200 hover:shadow-[0_24px_50px_-12px_rgb(15_27_45/0.55)] sm:right-auto sm:bottom-6 sm:left-6 sm:w-[380px] lg:-left-10"
            style={delay(900)}
          >
            <span className="relative size-16 shrink-0 overflow-hidden rounded-2xl bg-brand-soft">
              {startup.cover_url ? (
                // eslint-disable-next-line @next/next/no-img-element -- обложки уже пережаты api в WebP
                <img src={startup.cover_url} alt="" className="size-full object-cover" />
              ) : (
                <span className="grid size-full place-items-center text-xl font-extrabold text-brand-ink">{initials(startup.title)}</span>
              )}
            </span>
            <span className="min-w-0 flex-1">
              <span className="flex items-center gap-2">
                <b className="truncate text-base font-extrabold tracking-[-0.02em]">{startup.title}</b>
                <span className="shrink-0 rounded-full bg-tone px-2 py-0.5 text-[11px] font-bold">{STAGE[startup.stage]}</span>
              </span>
              <span className="mt-0.5 block truncate text-sm text-muted-foreground">{startup.pitch}</span>
              {startup.open_roles.length > 0 && (
                <span className="mt-1.5 flex gap-1 overflow-hidden">
                  {startup.open_roles.slice(0, 2).map((r) => (
                    <span key={r.id} className="truncate rounded-full bg-brand-soft px-2 py-0.5 text-xs font-bold text-brand-ink">
                      Ищут: {r.role.name}
                    </span>
                  ))}
                </span>
              )}
            </span>
          </Link>
        )}
      </div>
    </section>
  );
}

/* ───────────── Кого ищут прямо сейчас ───────────── */

function RoleStrip({ roles }: { roles: { slug: string; name: string; n: number }[] }) {
  return (
    <section aria-labelledby="roles-h" className={`${wrap} pt-12`}>
      <div className="flex flex-col gap-4 rounded-[28px] bg-tone p-5 sm:p-6 lg:flex-row lg:items-center lg:gap-8">
        <h2 id="roles-h" className="shrink-0 text-lg font-bold tracking-[-0.01em] lg:w-44">
          Кого ищут прямо сейчас
        </h2>
        <ul className="-mx-5 flex gap-2 overflow-x-auto px-5 pb-1 [mask-image:linear-gradient(90deg,#000_85%,transparent)] [scrollbar-width:none] sm:mx-0 sm:flex-wrap sm:overflow-visible sm:px-0 sm:pb-0 sm:[mask-image:none]">
          {roles.slice(0, 8).map((r) => (
            <li key={r.slug}>
              <Link
                href={`/startups?role=${r.slug}`}
                className="inline-flex h-10 items-center gap-2 rounded-full bg-white pr-2 pl-4 text-sm font-semibold whitespace-nowrap transition-colors hover:bg-brand-soft hover:text-brand-ink"
              >
                {r.name}
                <span className="grid h-6 min-w-6 place-items-center rounded-full bg-tone px-1.5 text-xs font-bold tabular-nums">{r.n}</span>
              </Link>
            </li>
          ))}
          <li>
            <Link href="/startups" className="inline-flex h-10 items-center gap-1.5 px-3 text-sm font-bold whitespace-nowrap text-brand-ink hover:text-brand-hover">
              Все стартапы
              <ArrowRight aria-hidden className="size-4" />
            </Link>
          </li>
        </ul>
      </div>
    </section>
  );
}

/* ───────────── Четыре дороги ───────────── */

function Paths({ startups, idea, people, faces }: { startups: Startup[]; idea?: Startup; people: Person[]; faces: Person[] }) {
  const card = "reveal-item card-hover group flex flex-col overflow-hidden rounded-[28px] p-6 sm:rounded-[32px] sm:p-9";
  const cta = "mt-auto inline-flex items-center gap-1.5 pt-6 font-bold sm:pt-8";
  const arrow = <ArrowRight aria-hidden className="size-4 transition-transform duration-300 group-hover:translate-x-1" />;
  const slots = idea?.open_roles.length
    ? idea.open_roles.slice(0, 2).map((r) => ({ name: r.role.name, n: r.slots ?? 1 }))
    : [
        { name: "Дизайнер", n: 1 },
        { name: "Frontend-разработчик", n: 2 },
      ];
  return (
    <Reveal className="grid gap-3 lg:grid-cols-5">
      {/* Хочу в команду: главная дорога, крупная и в цвете бренда. */}
      <PathLink path="seeker" href="/startups" className={cn(card, "bg-brand text-white hover:bg-brand-hover lg:col-span-3")} style={delay(0)}>
        <span className="grid gap-8 sm:grid-cols-[minmax(0,1fr)_minmax(0,300px)] sm:items-start">
          <span>
            <span className="text-sm font-bold text-white/70">Хочу в команду</span>
            <h3 className="mt-3 max-w-[14ch] text-[32px] leading-[1.02] font-extrabold tracking-[-0.04em] sm:text-[40px]">Залети в стартап и набери опыт</h3>
            <span className="mt-4 block max-w-[34ch] text-lg text-white/80">Настоящие задачи и кейс в портфолио.</span>
          </span>
          <span aria-hidden className="grid gap-1.5 rounded-2xl bg-white p-2 text-foreground max-sm:hidden shadow-[0_24px_50px_-20px_rgb(0_0_0/0.5)] transition-transform duration-500 group-hover:-translate-y-1">
            {startups.map((s) => (
              <span key={s.id} className="flex items-center gap-3 rounded-xl bg-tone p-2 pr-3">
                <span className="relative size-10 shrink-0 overflow-hidden rounded-lg bg-brand-soft">
                  {s.cover_url && (
                    // eslint-disable-next-line @next/next/no-img-element -- обложки уже пережаты api в WebP
                    <img src={s.cover_url} alt="" className="size-full object-cover" />
                  )}
                </span>
                <span className="min-w-0 flex-1">
                  <b className="block truncate text-sm font-extrabold">{s.title}</b>
                  <span className="block truncate text-xs text-muted-foreground">Ищут: {s.open_roles.map((r) => r.role.name).join(", ") || "команда собрана"}</span>
                </span>
              </span>
            ))}
          </span>
        </span>
        <span className={cn(cta, "text-white")}>
          Смотреть стартапы
          {arrow}
        </span>
      </PathLink>

      {/* Есть идея. */}
      <PathLink path="founder" href="/register?next=/startups/new" className={cn(card, "bg-tone hover:bg-tone-2 lg:col-span-2")} style={delay(60)}>
        <span className="text-sm font-bold text-muted-foreground">Есть идея</span>
        <h3 className="mt-3 text-[28px] leading-[1.05] font-extrabold tracking-[-0.04em] sm:text-[32px]">Собери под неё команду</h3>
        <span aria-hidden className="mt-6 rounded-2xl bg-white p-4 max-sm:hidden transition-transform duration-500 group-hover:-translate-y-0.5">
          <b className="block truncate text-sm font-extrabold">{idea?.title ?? "Твоя идея"}</b>
          <span className="mt-0.5 block text-xs text-muted-foreground">Места в команде</span>
          <span className="mt-3 grid gap-1.5">
            {slots.map((s) => (
              <span key={s.name} className="flex items-center justify-between gap-2 rounded-xl bg-tone px-3 py-2 text-xs font-semibold">
                <span className="truncate">{s.name}</span>
                <span className="shrink-0 text-brand-ink">{plural(s.n, `${s.n} место`, `${s.n} места`, `${s.n} мест`)}</span>
              </span>
            ))}
          </span>
        </span>
        <span className={cn(cta, "text-brand-ink")}>
          Опубликовать идею
          {arrow}
        </span>
      </PathLink>

      {/* Нет идеи. */}
      <Link href="/people/cofounders" className={cn(card, "bg-tone hover:bg-tone-2 lg:col-span-2")} style={delay(120)}>
        <span className="text-sm font-bold text-muted-foreground">Нет идеи</span>
        <h3 className="mt-3 text-[28px] leading-[1.05] font-extrabold tracking-[-0.04em] sm:text-[32px]">Придумай её вместе с сообщниками</h3>
        {faces.length > 0 && (
          <span aria-hidden className="mt-6 flex -space-x-3 max-sm:mt-5">
            {faces.map((p) => (
              // eslint-disable-next-line @next/next/no-img-element -- аватары уже пережаты api в WebP
              <img key={p.slug} src={p.avatar_url!} alt="" className="size-14 rounded-full object-cover ring-4 ring-tone transition-transform duration-500 group-hover:-translate-y-0.5" />
            ))}
          </span>
        )}
        <span className={cn(cta, "text-brand-ink")}>
          Кто такие сообщники
          {arrow}
        </span>
      </Link>

      {/* Нужны люди. */}
      <Link href="/people" className={cn(card, "bg-foreground text-background hover:bg-[#1d2a3f] lg:col-span-3")} style={delay(180)}>
        <span className="grid gap-8 sm:grid-cols-[minmax(0,1fr)_minmax(0,300px)] sm:items-start">
          <span>
            <span className="text-sm font-bold text-white/60">Нужны люди</span>
            <h3 className="mt-3 max-w-[16ch] text-[32px] leading-[1.02] font-extrabold tracking-[-0.04em] text-white sm:text-[40px]">Найди разработчика или дизайнера</h3>
          </span>
          <span aria-hidden className="grid gap-1.5 max-sm:hidden">
            {people.map((p) => (
              <span key={p.slug} className="flex items-center gap-3 rounded-2xl bg-white/10 p-2.5 pr-3.5 text-white">
                {/* eslint-disable-next-line @next/next/no-img-element -- аватары уже пережаты api в WebP */}
                <img src={p.avatar_url!} alt="" className="size-10 shrink-0 rounded-xl object-cover" />
                <span className="min-w-0 flex-1">
                  <b className="block truncate text-sm font-extrabold">{p.primary_role?.name ?? p.display_name}</b>
                  <span className="block truncate text-xs text-white/60">
                    {p.display_name}
                    {p.city ? ` · ${p.city}` : ""}
                  </span>
                </span>
              </span>
            ))}
          </span>
        </span>
        <span className={cn(cta, "text-white")}>
          Смотреть людей
          {arrow}
        </span>
      </Link>
    </Reveal>
  );
}

/* ───────────── Сообщники ───────────── */

function Cofounders({ people, total }: { people: Person[]; total: number }) {
  return (
    <section aria-labelledby="cof-h" className={`${wrap} pt-[clamp(80px,9vw,128px)] max-md:hidden`}>
      <div className="rounded-[36px] bg-brand-soft p-6 sm:p-10 lg:p-12">
        <div className="flex flex-wrap items-end justify-between gap-x-10 gap-y-6">
          <div>
            <p className="text-sm font-bold text-brand-ink">Сообщники</p>
            <h2 id="cof-h" className="mt-3 max-w-[18ch] text-[32px] leading-[1.02] text-balance sm:text-[44px] lg:text-[52px]">
              Нет идеи? Придумайте её вместе
            </h2>
            <p className="mt-4 max-w-[46ch] text-lg text-muted-foreground">
              {total} {plural(total, "человек ищет", "человека ищут", "человек ищут")}, с кем придумать проект с нуля.
            </p>
          </div>
          <div className="flex flex-wrap gap-2.5">
            <Link href="/people?cofound=1" className={buttonVariants({ size: "lg" })}>
              Посмотреть всех
              <ArrowRight aria-hidden />
            </Link>
            <Link href="/register?next=/me/profile" className={buttonVariants({ variant: "light", size: "lg" })}>
              Я тоже ищу
            </Link>
          </div>
        </div>
        <Reveal className="mt-10 grid grid-cols-2 gap-3 lg:grid-cols-4">
          {people.map((p, i) => (
            <Link
              key={p.slug}
              href={`/people/${p.slug}`}
              className="reveal-item group flex flex-col rounded-[24px] bg-white p-2 transition-[transform,box-shadow] duration-300 hover:-translate-y-1 hover:shadow-[0_24px_50px_-24px_rgb(15_27_45/0.35)]"
              style={delay(i * 70)}
            >
              <span className="relative block aspect-[4/5] overflow-hidden rounded-[18px] bg-tone">
                {/* eslint-disable-next-line @next/next/no-img-element -- аватары уже пережаты api в WebP */}
                <img
                  src={p.avatar_url_lg ?? p.avatar_url!}
                  alt=""
                  loading="lazy"
                  className="size-full object-cover transition-transform duration-700 group-hover:scale-[1.03]"
                />
                {p.primary_role && (
                  <span className="absolute bottom-2.5 left-2.5 max-w-[calc(100%-20px)] truncate rounded-full bg-white/95 px-3 py-1 text-xs font-bold">{p.primary_role.name}</span>
                )}
              </span>
              <span className="flex flex-1 flex-col px-2.5 pt-3.5 pb-2">
                <b className="truncate text-base font-extrabold tracking-[-0.02em] sm:text-lg">{p.display_name}</b>
                {p.city && <span className="text-sm text-muted-foreground">{p.city}</span>}
                {p.headline && <span className="mt-2 line-clamp-2 text-sm text-foreground/80 max-sm:hidden">{p.headline}</span>}
              </span>
            </Link>
          ))}
        </Reveal>
      </div>
    </section>
  );
}

/* ───────────── Как попасть в команду ───────────── */

const STEPS = [
  { title: "Создай профиль", text: "Роль, навыки и свободные часы в неделю." },
  { title: "Выбери стартап", text: "Под твою роль, с оплатой или без." },
  { title: "Откликнись и созвонись", text: "Обсуди задачи с основателем." },
];

/** Одна строка-таймлайн: линия прорисовывается слева направо, шаги проявляются по очереди. Без иконок и номеров. */
function Steps() {
  return (
    <Reveal>
      <ol className="relative grid gap-10 md:grid-cols-3 md:gap-8">
        <span aria-hidden className="absolute inset-x-0 top-[7px] h-0.5 rounded-full bg-tone-2 max-md:hidden" />
        <span aria-hidden className="reveal-line absolute inset-x-0 top-[7px] h-0.5 rounded-full bg-cornflower max-md:hidden" />
        {STEPS.map((s, i) => (
          <li key={s.title} className="reveal-item relative" style={delay(150 + i * 120)}>
            <span aria-hidden className="block size-4 rounded-full bg-brand ring-4 ring-background" />
            <h3 className="mt-6 text-2xl font-extrabold tracking-[-0.03em]">{s.title}</h3>
            <p className="mt-2 max-w-[30ch] text-lg text-muted-foreground">{s.text}</p>
          </li>
        ))}
      </ol>
    </Reveal>
  );
}

/* ───────────── Общие куски ───────────── */

function Section({
  id,
  eyebrow,
  title,
  lead,
  className,
  children,
}: {
  id?: string;
  eyebrow?: string;
  title: string;
  lead?: string;
  /** Например, max-md:hidden: на телефоне блок не нужен. */
  className?: string;
  children: React.ReactNode;
}) {
  const hid = `${id ?? title.slice(0, 12).replace(/\s+/g, "-")}-h`;
  return (
    <section id={id} aria-labelledby={hid} className={cn(wrap, "scroll-mt-24 pt-[clamp(72px,9vw,128px)]", className)}>
      <div className="mb-10 flex flex-wrap items-end gap-x-10 gap-y-4">
        <div>
          {eyebrow && <p className="mb-3 text-sm font-bold text-brand-ink">{eyebrow}</p>}
          <h2 id={hid} className="max-w-[18ch] text-[32px] leading-[1.02] text-balance sm:text-[44px] lg:text-[52px]">
            {title}
          </h2>
        </div>
        {lead && <p className="max-w-[40ch] text-lg text-muted-foreground sm:ml-auto">{lead}</p>}
      </div>
      {children}
    </section>
  );
}

/** Добивает ряд идей: приглашение опубликовать свою. Широкая версия — с фото справа. */
function OwnIdeaCard({ className, wide }: { className?: string; wide?: boolean }) {
  return (
    <PathLink
      path="founder"
      href="/register?next=/startups/new"
      className={cn(
        "card-hover group grid h-full min-h-[260px] overflow-hidden rounded-[28px] bg-brand-soft p-2 hover:bg-marker",
        wide && "lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]",
        className,
      )}
    >
      <span className="flex flex-col justify-between gap-6 p-5">
        <span>
          <span className="block max-w-[16ch] text-[28px] leading-[1.05] font-extrabold tracking-[-0.04em]">Твоя идея может быть здесь</span>
          <span className="mt-3 block max-w-[30ch] text-muted-foreground">Даже если пока нет ни кода, ни макетов.</span>
        </span>
        <span className={buttonVariants({ className: "self-start" })}>
          <PlusIcon aria-hidden />
          Опубликовать идею
        </span>
      </span>
      {wide && (
        <span className="relative hidden overflow-hidden rounded-[22px] lg:block">
          <Image src={PHOTOS.whiteboardDuo} alt="" fill placeholder="blur" sizes="30vw" className="object-cover transition-transform duration-700 group-hover:scale-[1.03]" />
        </span>
      )}
    </PathLink>
  );
}

const FAQ = [
  ["Нужен ли опыт, чтобы попасть в стартап?", "Нет. Важнее, что ты умеешь и сколько времени готов уделять."],
  ["Что я получу, кроме опыта?", "Задачи из настоящего продукта, кейс в портфолио и людей, с которыми можно делать следующие проекты."],
  ["Мне будут платить?", "Зависит от проекта. В каждой роли написано: без оплаты, с оплатой или договоритесь."],
  ["Это бесплатно?", "Да. Профиль, отклики и сообщения бесплатны."],
  ["У меня есть своя идея. Мне сюда?", "Да. Опиши её и отметь, кого не хватает, или найди сообщников и придумайте проект вместе."],
  ["А если мою идею украдут?", "Опиши её в общих чертах, а подробности расскажи тем, с кем решишь работать."],
]

function Faq() {
  // Две независимые колонки: открытый вопрос не раздвигает соседнюю.
  const half = Math.ceil(FAQ.length / 2);
  return (
    <div className="grid items-start gap-2 md:grid-cols-2">
      {[FAQ.slice(0, half), FAQ.slice(half)].map((col, c) => (
        <div key={c} className="grid gap-2">
          {col.map(([q, a]) => (
            <details key={q} className="faq group rounded-2xl bg-tone transition-colors open:bg-brand-soft hover:bg-tone-2 open:hover:bg-brand-soft">
              <summary className="flex list-none items-center gap-4 px-[22px] py-5 text-lg font-bold [&::-webkit-details-marker]:hidden">
                {q}
                <span aria-hidden className="ml-auto grid size-7 shrink-0 place-items-center rounded-full bg-white">
                  <PlusIcon className="size-4 transition-transform duration-300 group-open:rotate-45" />
                </span>
              </summary>
              <p className="faq-answer px-[22px] pb-[22px] text-foreground/75">{a}</p>
            </details>
          ))}
        </div>
      ))}
    </div>
  );
}

function FinalCta() {
  return (
    <section aria-labelledby="final-h" className={`${wrap} pt-[clamp(80px,9vw,128px)]`}>
      <div className="relative isolate grid gap-8 overflow-hidden rounded-[36px] px-6 py-[clamp(56px,7vw,112px)] text-white sm:px-[clamp(24px,5vw,72px)] lg:grid-cols-[1.2fr_1fr] lg:items-end">
        <Image src={PHOTOS.teamEvening} alt="" fill placeholder="blur" sizes="(min-width: 1360px) 1360px, 100vw" className="-z-20 object-cover" />
        <div aria-hidden className="absolute inset-0 -z-10 bg-[linear-gradient(90deg,rgb(14_26_52/0.85),rgb(14_26_52/0.55))]" />
        <div>
          <h2 id="final-h" className="max-w-[14ch] text-[40px] leading-[1.02] sm:text-[56px] lg:text-[64px]">
            Найди свой первый стартап
          </h2>
          <p className="mt-4 max-w-[40ch] text-lg text-white/85">От прототипов до продуктов с пользователями.</p>
        </div>
        <div className="flex flex-wrap gap-2.5 lg:justify-end">
          <PathLink path="seeker" href="/startups" className={buttonVariants({ variant: "light", size: "lg" })}>
            Смотреть стартапы
            <ArrowRight aria-hidden />
          </PathLink>
          <PathLink path="seeker" href="/register" className={buttonVariants({ variant: "onphoto", size: "lg" })}>
            Создать профиль
          </PathLink>
        </div>
      </div>
    </section>
  );
}
