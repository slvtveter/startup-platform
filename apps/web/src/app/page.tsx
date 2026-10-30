import { ArrowRight, MessageCircle, PlusIcon, Search, UserRound } from "lucide-react";
import type { Metadata } from "next";
import type { CSSProperties } from "react";
import Image from "next/image";
import Link from "next/link";

import { Dashboard } from "@/components/domain/dashboard";
import { PersonCard } from "@/components/domain/person-card";
import { StartupCard } from "@/components/domain/startup-card";
import { HomeFeed, type FeedTab } from "@/components/landing/home-feed";
import { JsonLd, siteUrl } from "@/components/site/json-ld";
import { PathLink } from "@/components/site/path-link";
import { Reveal } from "@/components/site/reveal";
import { TrackView } from "@/components/site/track-view";
import { buttonVariants } from "@/components/ui/button";
import { listPeople, listStartups, startupFacets, type PersonCard as Person, type StartupCard as Startup } from "@/lib/api";
import { initials, plural } from "@/lib/labels";
import { FACES, PHOTOS } from "@/lib/photos";
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
 * Лендинг для гостя. Порядок по разбору конкурентов (docs/research/competitors-home.md):
 * первый экран с живыми фрагментами интерфейса → кого ищут прямо сейчас → свежие проекты →
 * четыре дороги → сообщники → три шага → вопросы → призыв.
 */
async function Landing() {
  const client = await serverClient();
  const [allRoles, { data: facets }, { data: ideas }, { data: startups }, { data: cofounders }, { data: people }] = await Promise.all([
    getRoles(),
    startupFacets({ client }),
    listStartups({ client, query: { stage: ["idea"], limit: 5 } }),
    listStartups({ client, query: { stage: ["prototype", "mvp", "launched"], limit: 6 } }),
    listPeople({ client, query: { cofound: true, limit: 24 } }),
    listPeople({ client, query: { limit: 24 } }),
  ]);

  // Сколько проектов ищет каждую роль — чипсы «кого ищут» с числами, как «Популярное» на hh.
  // Ссылки ведут на посадочные «Стартапы ищут дизайнера» (src/lib/seo.ts).
  const roles = allRoles
    .map((r) => ({ slug: r.slug, name: r.name, n: facets?.role[r.slug] ?? 0 }))
    .filter((r) => r.n > 0)
    .sort((a, b) => b.n - a.n);

  const withPhoto = (people?.items ?? []).filter((p) => p.avatar_url);
  const cofWithPhoto = (cofounders?.items ?? []).filter((p) => p.avatar_url);
  const idea = ideas?.items[0];

  const grid = "grid gap-3 sm:grid-cols-2 lg:grid-cols-3";
  const feed: FeedTab[] = [];
  if (ideas?.items.length)
    feed.push({
      value: "ideas",
      label: "Идеи",
      count: ideas.total,
      more: { href: "/startups?stage=idea", label: "Все идеи" },
      content: (
        <div className={grid}>
          {ideas.items.map((s) => (
            <StartupCard key={s.id} startup={s} />
          ))}
          {/* Приглашение добивает последний ряд до конца: на широком экране тянется на свободные колонки. */}
          <OwnIdeaCard
            wide={ideas.items.length % 3 !== 2}
            className={cn(ideas.items.length % 2 === 0 && "sm:col-span-2", { 0: "lg:col-span-3", 1: "lg:col-span-2", 2: "lg:col-span-1" }[ideas.items.length % 3])}
          />
        </div>
      ),
    });
  if (startups?.items.length)
    feed.push({
      value: "startups",
      label: "Стартапы",
      count: startups.total,
      more: { href: "/startups?stage=prototype&stage=mvp&stage=launched", label: "Все стартапы" },
      content: (
        <div className={grid}>
          {startups.items.map((s) => (
            <StartupCard key={s.id} startup={s} />
          ))}
        </div>
      ),
    });
  if (cofounders?.items.length)
    feed.push({
      value: "people",
      label: "Сообщники",
      count: cofounders.total,
      more: { href: "/people?cofound=1", label: "Все, кто ищет сообщников" },
      content: (
        <div className="grid gap-3">
          {cofounders.items.slice(0, 3).map((p) => (
            <PersonCard key={p.slug} person={p} />
          ))}
        </div>
      ),
    });

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
              description: "Место, где студенты и начинающие в IT обсуждают идеи, находят сообщников и вступают в стартапы.",
            },
          ],
        }}
      />

      <Hero idea={idea} faces={withPhoto.slice(0, 5)} />

      {roles.length > 0 && <RoleStrip roles={roles} />}

      {feed.length > 0 && (
        <Section id="feed" eyebrow="Свежее" title="Идеи и проекты, которым нужны люди">
          <HomeFeed tabs={feed} />
        </Section>
      )}

      <Section eyebrow="С чего начать" title="Четыре дороги в команду">
        <Paths idea={idea} startups={(startups?.items ?? []).slice(0, 3)} people={withPhoto.slice(5, 8)} faces={cofWithPhoto.slice(0, 6)} />
      </Section>

      {cofounders && cofounders.items.length > 0 && <Cofounders people={cofounders.items.slice(0, 2)} faces={cofWithPhoto.slice(0, 12)} total={cofounders.total} />}

      <Section eyebrow="Как это устроено" title="От знакомства до команды — три шага">
        <Steps />
      </Section>

      <Section id="faq" eyebrow="Вопросы" title="Частые вопросы">
        <Faq />
      </Section>

      <FinalCta />
    </>
  );
}

/* ───────────── Первый экран ───────────── */

function Hero({ idea, faces }: { idea?: Startup; faces: Person[] }) {
  return (
    <section className={`${wrap} grid items-center gap-10 pt-8 pb-4 sm:pt-12 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.02fr)] lg:gap-14 lg:pt-14`}>
      <div className="max-w-[620px]">
        <p className="inline-flex items-center gap-2 rounded-full bg-brand-soft px-3.5 py-1.5 text-sm font-bold text-brand-ink">
          <span aria-hidden className="size-1.5 rounded-full bg-brand" />
          Для студентов и начинающих в IT
        </p>
        <h1 className="mt-6 text-[44px] leading-[0.98] tracking-[-0.045em] text-balance sm:text-[64px] lg:text-[76px]">
          Найди, с кем делать <span className="text-brand">стартап</span>
        </h1>
        <p className="mt-6 max-w-[46ch] text-lg text-muted-foreground sm:text-xl">
          Можно без опыта и без своей идеи.
        </p>
        <div className="mt-9 flex flex-wrap gap-2.5">
          <PathLink path="seeker" href="/register" className={buttonVariants({ size: "lg" })}>
            Создать профиль
            <ArrowRight aria-hidden />
          </PathLink>
          <Link href="/startups" className={buttonVariants({ variant: "secondary", size: "lg" })}>
            Смотреть проекты
          </Link>
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

      {/* Фото и живые фрагменты интерфейса поверх (как у Wellfound): реплика, карточка идеи, отклик. */}
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

        <div className="chat-msg absolute top-5 left-4 flex max-w-[300px] items-end gap-2 sm:top-8 sm:left-6 lg:-left-10" style={delay(500)}>
          <Image src={FACES.alina} alt="" width={36} height={36} className="size-9 shrink-0 rounded-full object-cover ring-2 ring-white" />
          <p className="rounded-2xl rounded-bl-md bg-white px-3.5 py-2.5 text-[15px] leading-snug shadow-[0_18px_40px_-12px_rgb(15_27_45/0.35)]">
            <small className="mb-0.5 block text-xs font-bold text-muted-foreground">Алина, дизайнер</small>
            Привет! Нужен фронт для приложения про соседей по квартире. Глянешь макеты?
          </p>
        </div>

        <div className="chat-msg absolute top-[42%] right-4 flex items-center gap-2.5 rounded-full bg-white py-1.5 pr-4 pl-1.5 text-sm shadow-[0_18px_40px_-12px_rgb(15_27_45/0.35)] max-sm:hidden lg:-right-6" style={delay(1300)}>
          <Image src={FACES.kirill} alt="" width={32} height={32} className="size-8 rounded-full object-cover" />
          <span>
            <b className="font-bold">Кирилл</b> <span className="text-muted-foreground">откликнулся на Frontend</span>
          </span>
          <span aria-hidden className="size-2 rounded-full bg-[#22a06b]" />
        </div>

        {idea && (
          <Link
            href={`/startups/${idea.slug}`}
            className="chat-msg absolute right-4 bottom-4 left-4 flex items-center gap-3.5 rounded-3xl bg-white p-3 shadow-[0_24px_50px_-16px_rgb(15_27_45/0.45)] transition-transform duration-300 hover:-translate-y-0.5 sm:right-auto sm:bottom-6 sm:left-6 sm:w-[380px] lg:-left-10"
            style={delay(900)}
          >
            <span className="relative size-16 shrink-0 overflow-hidden rounded-2xl bg-brand-soft">
              {idea.cover_url ? (
                // eslint-disable-next-line @next/next/no-img-element -- обложки уже пережаты api в WebP
                <img src={idea.cover_url} alt="" className="size-full object-cover" />
              ) : (
                <span className="grid size-full place-items-center text-xl font-extrabold text-brand-ink">{initials(idea.title)}</span>
              )}
            </span>
            <span className="min-w-0 flex-1">
              <span className="flex items-center gap-2">
                <b className="truncate text-base font-extrabold tracking-[-0.02em]">{idea.title}</b>
                <span className="shrink-0 rounded-full bg-tone px-2 py-0.5 text-[11px] font-bold">Идея</span>
              </span>
              <span className="mt-0.5 block truncate text-sm text-muted-foreground">{idea.pitch}</span>
              {idea.open_roles.length > 0 && (
                <span className="mt-1.5 flex gap-1 overflow-hidden">
                  {idea.open_roles.slice(0, 2).map((r) => (
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
        <ul className="flex flex-wrap gap-2">
          {roles.slice(0, 8).map((r) => (
            <li key={r.slug}>
              <Link
                href={`/startups?role=${r.slug}`}
                className="inline-flex h-10 items-center gap-2 rounded-full bg-white pr-2 pl-4 text-sm font-semibold transition-colors hover:bg-brand-soft hover:text-brand-ink"
              >
                {r.name}
                <span className="grid h-6 min-w-6 place-items-center rounded-full bg-tone px-1.5 text-xs font-bold tabular-nums">{r.n}</span>
              </Link>
            </li>
          ))}
          <li>
            <Link href="/startups" className="inline-flex h-10 items-center gap-1.5 px-3 text-sm font-bold text-brand-ink hover:text-brand-hover">
              Все проекты
              <ArrowRight aria-hidden className="size-4" />
            </Link>
          </li>
        </ul>
      </div>
    </section>
  );
}

/* ───────────── Четыре дороги ───────────── */

function Paths({ idea, startups, people, faces }: { idea?: Startup; startups: Startup[]; people: Person[]; faces: Person[] }) {
  const card = "reveal-item card-hover group flex flex-col overflow-hidden rounded-[32px] p-7 sm:p-9";
  const cta = "mt-auto inline-flex items-center gap-1.5 pt-8 font-bold";
  const slots = idea?.open_roles.length
    ? idea.open_roles.slice(0, 3).map((r) => ({ name: r.role.name, n: r.slots ?? 1 }))
    : [
        { name: "Дизайнер", n: 1 },
        { name: "Frontend-разработчик", n: 2 },
      ];
  return (
    <Reveal className="grid gap-3 lg:grid-cols-5">
      {/* Есть идея: главная дорога, крупная и в цвете бренда. */}
      <PathLink path="founder" href="/register?next=/startups/new" className={cn(card, "bg-brand text-white hover:bg-brand-hover lg:col-span-3")} style={delay(0)}>
        <span className="grid gap-8 sm:grid-cols-[minmax(0,1fr)_minmax(0,260px)] sm:items-end">
          <span>
            <span className="text-sm font-bold text-white/70">Есть идея</span>
            <h3 className="mt-3 max-w-[14ch] text-[32px] leading-[1.02] font-extrabold tracking-[-0.04em] sm:text-[40px]">Собери под неё команду</h3>
            <span className="mt-4 block max-w-[36ch] text-lg text-white/80">Даже если пока нет ни кода, ни макетов.</span>
          </span>
          <span aria-hidden className="rounded-2xl bg-white p-4 text-foreground shadow-[0_24px_50px_-20px_rgb(0_0_0/0.5)] transition-transform duration-500 group-hover:-translate-y-1">
            <b className="block truncate text-sm font-extrabold">{idea?.title ?? "Бот расписания"}</b>
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
        </span>
        <span className={cn(cta, "text-white")}>
          Опубликовать идею
          <ArrowRight aria-hidden className="size-4 transition-transform duration-300 group-hover:translate-x-1" />
        </span>
      </PathLink>

      {/* Хочу в команду. */}
      <PathLink path="seeker" href="/startups" className={cn(card, "bg-tone hover:bg-tone-2 lg:col-span-2")} style={delay(60)}>
        <span className="text-sm font-bold text-muted-foreground">Хочу в команду</span>
        <h3 className="mt-3 text-[28px] leading-[1.05] font-extrabold tracking-[-0.04em] sm:text-[32px]">Найди проект под свою роль</h3>
        <span aria-hidden className="mt-6 grid gap-1.5">
          {startups.map((s) => (
            <span key={s.id} className="flex items-center gap-3 rounded-2xl bg-white p-2.5 pr-3.5">
              <span className="relative size-10 shrink-0 overflow-hidden rounded-xl bg-brand-soft">
                {s.cover_url && (
                  // eslint-disable-next-line @next/next/no-img-element -- обложки уже пережаты api в WebP
                  <img src={s.cover_url} alt="" className="size-full object-cover" />
                )}
              </span>
              <span className="min-w-0 flex-1">
                <b className="block truncate text-sm font-extrabold">{s.title}</b>
                <span className="block truncate text-xs text-muted-foreground">{s.open_roles.map((r) => r.role.name).join(", ") || "Команда собрана"}</span>
              </span>
            </span>
          ))}
        </span>
        <span className={cn(cta, "text-brand-ink")}>
          Смотреть стартапы
          <ArrowRight aria-hidden className="size-4 transition-transform duration-300 group-hover:translate-x-1" />
        </span>
      </PathLink>

      {/* Нет идеи. */}
      <Link href="/people/cofounders" className={cn(card, "bg-tone hover:bg-tone-2 lg:col-span-2")} style={delay(120)}>
        <span className="text-sm font-bold text-muted-foreground">Нет идеи</span>
        <h3 className="mt-3 text-[28px] leading-[1.05] font-extrabold tracking-[-0.04em] sm:text-[32px]">Придумай её вместе с сообщниками</h3>
        {faces.length > 0 && (
          <span aria-hidden className="mt-6 flex -space-x-3">
            {faces.map((p) => (
              // eslint-disable-next-line @next/next/no-img-element -- аватары уже пережаты api в WebP
              <img key={p.slug} src={p.avatar_url!} alt="" className="size-14 rounded-full object-cover ring-4 ring-tone transition-transform duration-500 group-hover:-translate-y-0.5" />
            ))}
          </span>
        )}
        <span className={cn(cta, "text-brand-ink")}>
          Кто такие сообщники
          <ArrowRight aria-hidden className="size-4 transition-transform duration-300 group-hover:translate-x-1" />
        </span>
      </Link>

      {/* Нужны люди. */}
      <Link href="/people" className={cn(card, "bg-foreground text-background hover:bg-[#1d2a3f] lg:col-span-3")} style={delay(180)}>
        <span className="grid gap-8 sm:grid-cols-[minmax(0,1fr)_minmax(0,280px)] sm:items-end">
          <span>
            <span className="text-sm font-bold text-white/60">Нужны люди</span>
            <h3 className="mt-3 max-w-[16ch] text-[32px] leading-[1.02] font-extrabold tracking-[-0.04em] text-white sm:text-[40px]">Найди разработчика или дизайнера</h3>
          </span>
          <span aria-hidden className="grid gap-1.5">
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
          <ArrowRight aria-hidden className="size-4 transition-transform duration-300 group-hover:translate-x-1" />
        </span>
      </Link>
    </Reveal>
  );
}

/* ───────────── Сообщники ───────────── */

function Cofounders({ people, faces, total }: { people: Person[]; faces: Person[]; total: number }) {
  return (
    <section aria-labelledby="cof-h" className={`${wrap} pt-[clamp(80px,9vw,128px)]`}>
      <div className="grid gap-10 rounded-[36px] bg-brand-soft p-5 sm:p-10 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] lg:gap-12 lg:p-14">
        <div className="flex flex-col p-2 sm:p-0">
          <p className="text-sm font-bold text-brand-ink">Сообщники</p>
          <h2 id="cof-h" className="mt-3 max-w-[13ch] text-[36px] leading-[1.02] sm:text-[48px] lg:text-[56px]">
            Нет идеи? Придумайте её вместе
          </h2>
          <p className="mt-5 max-w-[42ch] text-lg text-muted-foreground">
            {total} {plural(total, "человек хочет", "человека хотят", "человек хотят")} запустить свой проект, но не в одиночку. Напиши тому, чьи навыки дополняют твои.
          </p>
          {faces.length > 0 && (
            <ul aria-hidden className="mt-8 grid max-w-[360px] grid-cols-6 gap-2">
              {faces.map((p, i) => (
                <li key={p.slug} className={cn("aspect-square overflow-hidden rounded-2xl bg-white", i % 3 === 1 && "translate-y-2")}>
                  {/* eslint-disable-next-line @next/next/no-img-element -- аватары уже пережаты api в WebP */}
                  <img src={p.avatar_url!} alt="" loading="lazy" className="size-full object-cover" />
                </li>
              ))}
            </ul>
          )}
          <div className="mt-10 flex flex-wrap gap-2.5 lg:mt-auto lg:pt-10">
            <Link href="/people?cofound=1" className={buttonVariants({ size: "lg" })}>
              Посмотреть всех
              <ArrowRight aria-hidden />
            </Link>
            <Link href="/register?next=/me/profile" className={buttonVariants({ variant: "light", size: "lg" })}>
              Я тоже ищу
            </Link>
          </div>
        </div>
        <Reveal className="grid content-start gap-3">
          {people.map((p, i) => (
            <div key={p.slug} className="reveal-item" style={delay(i * 80)}>
              <PersonCard person={p} surface="white" />
            </div>
          ))}
        </Reveal>
      </div>
    </section>
  );
}

/* ───────────── Три шага ───────────── */

const STEPS = [
  { icon: UserRound, title: "Расскажи о себе", text: "Роль, пара навыков и что ищешь. Резюме не нужно." },
  { icon: Search, title: "Найди своих", text: "Идея, стартап или человек под твою роль." },
  { icon: MessageCircle, title: "Напиши и созвонись", text: "Обсудите задачи и решите, делаете ли проект вместе." },
];

function Steps() {
  return (
    <Reveal className="grid gap-3 md:grid-cols-3">
      {STEPS.map((s, i) => (
        <div key={s.title} className="reveal-item relative rounded-[28px] bg-tone p-7 sm:p-8" style={delay(i * 70)}>
          <span className="flex items-center justify-between">
            <span className="grid size-12 place-items-center rounded-2xl bg-white text-brand">
              <s.icon aria-hidden className="size-5" />
            </span>
            <span className="text-[56px] leading-none font-extrabold tracking-[-0.05em] text-foreground/[0.07] tabular-nums">{i + 1}</span>
          </span>
          <h3 className="mt-8 text-2xl font-extrabold tracking-[-0.03em]">{s.title}</h3>
          <p className="mt-2 text-muted-foreground">{s.text}</p>
        </div>
      ))}
    </Reveal>
  );
}

/* ───────────── Общие куски ───────────── */

function Section({
  id,
  eyebrow,
  title,
  lead,
  children,
}: {
  id?: string;
  eyebrow?: string;
  title: string;
  lead?: string;
  children: React.ReactNode;
}) {
  const hid = `${id ?? title.slice(0, 12).replace(/\s+/g, "-")}-h`;
  return (
    <section id={id} aria-labelledby={hid} className={`${wrap} scroll-mt-24 pt-[clamp(80px,9vw,128px)]`}>
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
  ["У меня нет идеи. Мне сюда?", "Да. Включи в профиле «Ищу сообщников»: тебя найдут те, кто тоже хочет своё. Идею можно придумать вместе."],
  ["У меня нет опыта. Со мной будут разговаривать?", "Здесь почти все в начале пути: студенты, выпускники курсов, начинающие основатели. Важнее, что ты умеешь и чем хочешь заниматься."],
  ["А если мою идею украдут?", "Опиши её в общих чертах, а подробности расскажи тем, с кем решишь работать."],
  ["Это бесплатно?", "Да. Профиль, сообщения, идеи и отклики бесплатны."],
  ["Мне будут платить?", "Зависит от проекта. В каждой роли написано: без оплаты, с оплатой или договоритесь."],
  ["Можно просто пообщаться, без стартапа?", "Да. Обсуждай идеи и знакомься, проект может появиться позже."],
];

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
            Твоя команда уже где-то здесь
          </h2>
          <p className="mt-4 max-w-[40ch] text-lg text-white/85">Начни с профиля: роль, пара навыков и что ищешь.</p>
        </div>
        <div className="flex flex-wrap gap-2.5 lg:justify-end">
          <PathLink path="seeker" href="/register" className={buttonVariants({ variant: "light", size: "lg" })}>
            Создать профиль
            <ArrowRight aria-hidden />
          </PathLink>
          <PathLink path="founder" href="/register?next=/startups/new" className={buttonVariants({ variant: "onphoto", size: "lg" })}>
            Опубликовать идею
          </PathLink>
        </div>
      </div>
    </section>
  );
}
