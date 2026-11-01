import { ArrowRight, PlusIcon } from "lucide-react";
import type { Metadata } from "next";
import type { CSSProperties } from "react";
import Image from "next/image";
import Link from "next/link";

import { Sticker } from "@/components/brand/stickers";
import { Dashboard } from "@/components/domain/dashboard";
import { PersonCard } from "@/components/domain/person-card";
import { StartupCard } from "@/components/domain/startup-card";
import { FaqTabs } from "@/components/landing/faq-tabs";
import { HomeFeed, type FeedTab } from "@/components/landing/home-feed";
import { StepsLive } from "@/components/landing/steps-live";
import { JsonLd, siteUrl } from "@/components/site/json-ld";
import { PathLink } from "@/components/site/path-link";
import { Reveal } from "@/components/site/reveal";
import { TrackView } from "@/components/site/track-view";
import { buttonVariants } from "@/components/ui/button";
import { startupFacets, type PersonCard as Person, type StartupCard as Startup } from "@/lib/api";
import { plural } from "@/lib/labels";
import { PHOTOS } from "@/lib/photos";
import { getMe, getRoles, publicClient } from "@/lib/server-api";
import { COFOUNDER_FACES, HERO_FACES, HOME_PEOPLE, IDEAS, PATH_PEOPLE, STARTUPS, STEP_PERSON, personHref, startupHref } from "@/lib/showcase";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { alternates: { canonical: "/" } };

export default async function Home() {
  const user = await getMe();
  return user ? <Dashboard /> : <Landing />;
}

const wrap = "mx-auto w-full max-w-[1360px] px-4 sm:px-6 lg:px-10";
const delay = (ms: number) => ({ "--d": `${ms}ms` }) as CSSProperties;

/**
 * Лендинг для гостя. Главное — попасть в стартап и быстро набрать опыт; идеи — дополнение.
 * Порядок (редизайн v4, docs/research/2026-10-31-home-graphics.md): первый экран → кого ищут →
 * четыре дороги → проекты → люди → как попасть в команду → вопросы → призыв.
 * Карточки проектов и людей — постоянная витрина (lib/showcase.ts), не зависят от базы; цифры ролей — живые.
 */
async function Landing() {
  const [allRoles, { data: facets }] = await Promise.all([getRoles(), startupFacets({ client: publicClient() })]);

  // Сколько проектов ищет каждую роль — чипсы «кого ищут» с числами, как «Популярное» на hh.
  const roles = allRoles
    .map((r) => ({ slug: r.slug, name: r.name, n: facets?.role[r.slug] ?? 0 }))
    .filter((r) => r.n > 0)
    .sort((a, b) => b.n - a.n);

  const grid = "grid gap-3 lg:grid-cols-2";
  const feed: FeedTab[] = [
    {
      value: "startups",
      label: "Стартапы",
      more: { href: "/startups?stage=prototype&stage=mvp&stage=launched", label: "Все стартапы" },
      content: (
        <div className={grid}>
          {STARTUPS.slice(0, 4).map((s, i) => (
            <div key={s.slug} className={cn(i >= 3 && "max-sm:hidden")}>
              <StartupCard startup={s} href={startupHref(s)} compact />
            </div>
          ))}
        </div>
      ),
    },
    {
      value: "ideas",
      label: "Идеи",
      more: { href: "/startups?stage=idea", label: "Все идеи" },
      content: (
        <div className={grid}>
          {IDEAS.slice(0, 3).map((s) => (
            <StartupCard key={s.slug} startup={s} href={startupHref(s)} compact />
          ))}
          <OwnIdeaCard className="min-h-0" />
        </div>
      ),
    },
  ];

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

      <Hero faces={HERO_FACES} />

      {roles.length > 0 && <RoleStrip roles={roles} />}

      <Section eyebrow="С чего начать" title="Четыре дороги в команду">
        <Paths startups={STARTUPS.slice(0, 3)} idea={IDEAS[0]} people={PATH_PEOPLE} faces={COFOUNDER_FACES} />
      </Section>

      <Section id="feed" title="Стартапы, которые ищут людей" tight sticker={<Sticker name="megaphone" className="size-16 -rotate-6 lg:size-20" />}>
        <HomeFeed tabs={feed} />
      </Section>

      <Section
        title="Кто уже ищет команду"
        tight
        sticker={
          <span className="relative block h-16 w-28 lg:h-20 lg:w-32">
            <Sticker name="code" className="absolute top-0 left-0 size-14 -rotate-12 lg:size-16" />
            <Sticker name="pen" className="absolute right-0 bottom-0 size-14 rotate-6 lg:size-16" />
          </span>
        }
        aside={
          <Link href="/people" className="inline-flex items-center gap-1.5 font-bold text-brand-ink transition-colors hover:text-brand-hover">
            Все люди
            <ArrowRight aria-hidden className="size-4" />
          </Link>
        }
      >
        <div className={grid}>
          {HOME_PEOPLE.map((p, i) => (
            <div key={p.slug} className={cn(i >= 2 && "max-sm:hidden")}>
              <PersonCard person={p} href={personHref(p)} compact />
            </div>
          ))}
        </div>
      </Section>

      <Section title="Как попасть в команду стартапа">
        <StepsLive role={STARTUPS[0]?.open_roles[0]?.role.name} person={STEP_PERSON} />
      </Section>

      <Section id="faq" title="Частые вопросы" sticker={<Sticker name="question" className="size-20 -rotate-6 lg:size-24" />}>
        <FaqTabs items={FAQ} stickers={["cap", "coin", "clock", "bulb", "like"]} />
      </Section>

      <FinalCta />
    </>
  );
}

/* ───────────── Первый экран ───────────── */

function Hero({ faces }: { faces: Person[] }) {
  return (
    <section className={`${wrap} grid items-center gap-10 pt-8 pb-4 sm:pt-12 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.02fr)] lg:gap-14 lg:pt-14`}>
      <div className="max-w-[640px]">
        <h1 className="text-[36px] leading-[1] tracking-[-0.045em] text-balance sm:text-[56px] lg:text-[64px]">
          Получи первый опыт в настоящем <span className="text-brand">стартапе</span>
        </h1>
        <p className="mt-6 max-w-[44ch] text-lg text-muted-foreground sm:text-xl">Можно без опыта и без резюме.</p>
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
                // eslint-disable-next-line @next/next/no-img-element -- фото витрины уже пережаты в WebP
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

      {/* Фото и наклейки бренда по краям (как стикеры у Drinkit): знак и разговор. */}
      <div className="relative px-[4%] py-[5%]">
        <div className="relative aspect-[4/3.4] overflow-hidden rounded-[36px] sm:aspect-[4/3] lg:aspect-square">
          <Image
            src={PHOTOS.heroTeam}
            alt="Команда обсуждает проект за столом с ноутбуком"
            fill
            preload
            placeholder="blur"
            quality={85}
            sizes="(min-width: 1024px) 48vw, 100vw"
            className="object-cover object-[60%_40%]"
          />
        </div>
        <Sticker name="mark" className="absolute top-0 left-0 size-[24%] -rotate-12" />
        <Sticker name="chat" className="absolute right-0 bottom-[6%] size-[24%] rotate-6" />
      </div>
    </section>
  );
}

/* ───────────── Кого ищут прямо сейчас ───────────── */

function RoleStrip({ roles }: { roles: { slug: string; name: string; n: number }[] }) {
  return (
    <section aria-labelledby="roles-h" className={`${wrap} pt-12`}>
      <div className="flex flex-col gap-4 rounded-[28px] bg-tone p-5 sm:p-6 lg:flex-row lg:items-center lg:gap-8">
        <div className="flex shrink-0 items-center gap-3 lg:w-60">
          <Sticker name="search" className="size-12 shrink-0 -rotate-6 max-sm:hidden" />
          <h2 id="roles-h" className="text-lg font-bold tracking-[-0.01em]">
            Кого ищут прямо сейчас
          </h2>
        </div>
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
  // Четыре дороги в один ряд на широком экране (2×2 на планшете): блок целиком влезает в экран на 100%.
  const card = "reveal-item card-hover group relative flex flex-col overflow-hidden rounded-[28px] p-6 sm:p-7";
  const title = "mt-2 pr-12 text-[26px] leading-[1.05] font-extrabold tracking-[-0.04em]";
  const preview = "mt-5 grid gap-1.5 rounded-2xl bg-white p-2 text-foreground transition-transform duration-500 group-hover:-translate-y-0.5 max-sm:hidden";
  const row = "flex items-center gap-2.5 rounded-xl bg-tone p-2 pr-3";
  const cta = "mt-auto inline-flex items-center gap-1.5 pt-6 font-bold";
  const arrow = <ArrowRight aria-hidden className="size-4 transition-transform duration-300 group-hover:translate-x-1" />;
  const slots = idea?.open_roles.length
    ? idea.open_roles.slice(0, 2).map((r) => ({ name: r.role.name, n: r.slots ?? 1 }))
    : [
        { name: "Дизайнер", n: 1 },
        { name: "Frontend-разработчик", n: 2 },
      ];
  return (
    <Reveal className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
      {/* Хочу в команду: главная дорога, в цвете бренда. */}
      <PathLink path="seeker" href="/startups" className={cn(card, "bg-brand text-white hover:bg-brand-hover")} style={delay(0)}>
        <Sticker name="cap" className="absolute top-4 right-4 size-12 rotate-12" />
        <span className="text-sm font-bold text-white/70">Хочу в команду</span>
        <h3 className={title}>Залети в стартап и набери опыт</h3>
        <span aria-hidden className={cn(preview, "shadow-[0_24px_50px_-20px_rgb(0_0_0/0.5)]")}>
          {startups.slice(0, 2).map((s) => (
            <span key={s.id} className={row}>
              <span className="relative size-9 shrink-0 overflow-hidden rounded-lg bg-brand-soft">
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
        <span className={cn(cta, "text-white")}>
          Смотреть стартапы
          {arrow}
        </span>
      </PathLink>

      {/* Есть идея. */}
      <PathLink path="founder" href="/register?next=/startups/new" className={cn(card, "bg-tone hover:bg-tone-2")} style={delay(60)}>
        <Sticker name="bulb" className="absolute top-4 right-4 size-12 rotate-12" />
        <span className="text-sm font-bold text-muted-foreground">Есть идея</span>
        <h3 className={title}>Собери под неё команду</h3>
        <span aria-hidden className={cn(preview, "p-3")}>
          <b className="block truncate px-1 text-sm font-extrabold">{idea?.title ?? "Твоя идея"}</b>
          {slots.map((s) => (
            <span key={s.name} className="flex items-center justify-between gap-2 rounded-xl bg-tone px-3 py-2 text-xs font-semibold">
              <span className="truncate">{s.name}</span>
              <span className="shrink-0 text-brand-ink">{plural(s.n, `${s.n} место`, `${s.n} места`, `${s.n} мест`)}</span>
            </span>
          ))}
        </span>
        <span className={cn(cta, "text-brand-ink")}>
          Опубликовать идею
          {arrow}
        </span>
      </PathLink>

      {/* Нет идеи. */}
      <Link href="/people/cofounders" className={cn(card, "bg-tone hover:bg-tone-2")} style={delay(120)}>
        <Sticker name="team" className="absolute top-4 right-4 size-12 -rotate-6" />
        <span className="text-sm font-bold text-muted-foreground">Нет идеи</span>
        <h3 className={title}>Придумай её с сообщниками</h3>
        {faces.length > 0 && (
          <span aria-hidden className="mt-5 flex -space-x-3 max-sm:hidden">
            {faces.slice(0, 5).map((p) => (
              // eslint-disable-next-line @next/next/no-img-element -- аватары уже пережаты api в WebP
              <img key={p.slug} src={p.avatar_url!} alt="" className="size-12 rounded-full object-cover ring-4 ring-tone transition-transform duration-500 group-hover:-translate-y-0.5" />
            ))}
          </span>
        )}
        <span className={cn(cta, "text-brand-ink")}>
          Кто такие сообщники
          {arrow}
        </span>
      </Link>

      {/* Нужны люди. */}
      <Link href="/people" className={cn(card, "bg-brand-soft hover:bg-marker")} style={delay(180)}>
        <Sticker name="code" className="absolute top-4 right-4 size-12 rotate-12" />
        <span className="text-sm font-bold text-brand-ink">Нужны люди</span>
        <h3 className={title}>Найди разработчика или дизайнера</h3>
        <span aria-hidden className={preview}>
          {people.slice(0, 2).map((p) => (
            <span key={p.slug} className={row}>
              {/* eslint-disable-next-line @next/next/no-img-element -- фото витрины уже пережаты в WebP */}
              <img src={p.avatar_url!} alt="" className="size-9 shrink-0 rounded-lg object-cover" />
              <span className="min-w-0 flex-1">
                <b className="block truncate text-sm font-extrabold">{p.primary_role?.name ?? p.display_name}</b>
                <span className="block truncate text-xs text-muted-foreground">{p.display_name}</span>
              </span>
            </span>
          ))}
        </span>
        <span className={cn(cta, "text-brand-ink")}>
          Смотреть людей
          {arrow}
        </span>
      </Link>
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
  sticker,
  aside,
  tight = false,
  children,
}: {
  id?: string;
  eyebrow?: string;
  title: string;
  lead?: string;
  /** Например, max-md:hidden: на телефоне блок не нужен. */
  className?: string;
  /** Наклейка бренда справа от заголовка (на телефоне скрыта). */
  sticker?: React.ReactNode;
  /** Ссылка или действие справа от заголовка (видно и на телефоне). */
  aside?: React.ReactNode;
  /** Плотная шапка: заголовок в одну строку, меньше отступ до содержимого — секция влезает в экран. */
  tight?: boolean;
  children: React.ReactNode;
}) {
  const hid = `${id ?? title.slice(0, 12).replace(/\s+/g, "-")}-h`;
  return (
    <section id={id} aria-labelledby={hid} className={cn(wrap, "scroll-mt-24 pt-[clamp(72px,9vw,128px)]", className)}>
      <div className={cn("flex flex-wrap items-end gap-x-10 gap-y-4", tight ? "mb-6" : "mb-10")}>
        <div>
          {eyebrow && <p className="mb-3 text-sm font-bold text-brand-ink">{eyebrow}</p>}
          <h2 id={hid} className={cn("text-[32px] leading-[1.02] text-balance sm:text-[44px] lg:text-[48px]", !tight && "max-w-[18ch]")}>
            {title}
          </h2>
        </div>
        {lead && <p className="max-w-[40ch] text-lg text-muted-foreground sm:ml-auto">{lead}</p>}
        {(sticker || aside) && (
          // Ссылка «Все …» стоит на линии заголовка (по низу), наклейка — над ней, не сдвигая её.
          <div className="ml-auto flex items-end gap-8">
            {sticker && <div className="max-sm:hidden">{sticker}</div>}
            {aside && <div className="pb-1.5">{aside}</div>}
          </div>
        )}
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

// Топ-5 страхов новичка: разбор конкурентов (YC: деньги и обязательства) и UX-исследование (опыт, учёба, своя идея).
const FAQ: [string, string][] = [
  [
    "У меня нет опыта. Меня возьмут?",
    "Да. Здесь собраны стартапы, которые готовы брать студентов и начинающих. Основателю на старте важнее, что ты берёшься за задачи и доводишь их до конца, чем строчки в резюме. Учебные проекты и курсовые тоже считаются: добавь их в профиль.",
  ],
  [
    "Мне будут платить?",
    "Зависит от проекта. У каждой роли написано: без оплаты, оплачивается или обсуждается, а в каталоге есть фильтр по оплате. Если денег нет, ты получаешь задачи из настоящего продукта и кейс в портфолио. Договорись на созвоне, что войдёт в кейс.",
  ],
  [
    "Получится совмещать с учёбой?",
    "В каждой роли указано, сколько часов в неделю ждут. Выбирай то, что влезает в твоё расписание, и сразу скажи основателю про сессию и пары. Со стартапом о таком договориться проще, чем с работодателем.",
  ],
  [
    "У меня своя идея. Мне сюда?",
    "Да. Опиши идею в двух словах и отметь, кого не хватает в команде: разработчики и дизайнеры увидят её в разделе идей и смогут откликнуться. Подробности, которыми не хочется делиться со всеми, расскажешь на созвоне.",
  ],
  ["Это бесплатно?", "Да. Профиль, отклики и переписка бесплатны, платных функций нет."],
];


function FinalCta() {
  return (
    <section aria-labelledby="final-h" className={`${wrap} pt-[clamp(80px,9vw,128px)]`}>
      <div className="relative isolate grid gap-8 overflow-hidden rounded-[36px] px-6 py-[clamp(56px,7vw,112px)] text-white sm:px-[clamp(24px,5vw,72px)] lg:grid-cols-[1.2fr_1fr] lg:items-end">
        <Image src={PHOTOS.teamEvening} alt="" fill placeholder="blur" sizes="(min-width: 1360px) 1360px, 100vw" className="-z-20 object-cover" />
        <div aria-hidden className="absolute inset-0 -z-10 bg-[linear-gradient(90deg,rgb(14_26_52/0.85),rgb(14_26_52/0.55))]" />
        <Sticker name="flag" className="absolute top-8 right-10 size-20 rotate-12 max-lg:hidden" />
        <Sticker name="mark" className="absolute top-24 right-36 size-16 -rotate-6 max-lg:hidden" />
        <div>
          <h2 id="final-h" className="max-w-[14ch] text-[36px] leading-[1.02] sm:text-[56px] lg:text-[64px]">
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
