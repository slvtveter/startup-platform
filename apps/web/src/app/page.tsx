import { ArrowRight, PlusIcon } from "lucide-react";
import type { CSSProperties } from "react";
import Image from "next/image";
import Link from "next/link";

import { Avatar } from "@/components/domain/avatar-upload";
import { DemoBadge, TermsBadge } from "@/components/domain/badges";
import { Dashboard } from "@/components/domain/dashboard";
import { SeatRow } from "@/components/domain/seats";
import { SearchBar } from "@/components/landing/search-bar";
import { JsonLd, siteUrl } from "@/components/site/json-ld";
import { PathLink } from "@/components/site/path-link";
import { Reveal } from "@/components/site/reveal";
import { TrackView } from "@/components/site/track-view";
import { buttonVariants } from "@/components/ui/button";
import {
  listPeople,
  listStartups,
  publicStats,
  type PersonCard,
  type StartupCard as StartupCardData,
} from "@/lib/api";
import { LEVEL, plural } from "@/lib/labels";
import { getMe, serverClient } from "@/lib/server-api";

export default async function Home() {
  const user = await getMe();
  return user ? <Dashboard /> : <Landing />;
}

const wrap = "mx-auto w-full max-w-[1360px] px-4 sm:px-6 lg:px-10";
const delay = (ms: number) => ({ "--d": `${ms}ms` }) as CSSProperties;

/** Лендинг «Разговор» (design/concepts-v3/a-razgovor): стартапы начинаются с переписки двух людей. */
async function Landing() {
  const client = await serverClient();
  const [{ data: stats }, { data: ideas }, { data: people }, { data: startups }] = await Promise.all([
    publicStats({ client }),
    listStartups({ client, query: { stage: ["idea"], limit: 4 } }),
    listPeople({ client, query: { limit: 4 } }),
    listStartups({ client, query: { stage: ["prototype", "mvp", "launched"], limit: 3 } }),
  ]);

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
              logo: siteUrl("/apple-icon.png"),
              description:
                "Место, где студенты и начинающие в IT обсуждают идеи, находят сообщников и вступают в стартапы.",
            },
          ],
        }}
      />

      <div className={`${wrap} pt-2`}>
        <Hero />
        <div className="mt-3">
          <SearchBar />
        </div>
      </div>

      <Section title="Три способа начать" lead="Неважно, есть ли у тебя идея, команда или только желание попробовать. С любого места можно сделать первый шаг.">
        <Ways />
      </Section>

      {ideas && ideas.items.length > 0 && (
        <Section
          id="ideas"
          title="Идеи, вокруг которых собираются люди"
          lead="Сырые, но живые. Открой идею, задай вопрос автору или откликнись на роль, которой не хватает."
          more={{ href: "/startups?stage=idea", label: "Все идеи" }}
        >
          <Reveal className="grid gap-3 md:grid-cols-2">
            {ideas.items.map((s, i) => (
              <IdeaCard key={s.id} idea={s} style={delay((i % 2) * 80)} />
            ))}
            {ideas.items.length % 2 === 1 && <OwnIdeaCard style={delay(80)} />}
          </Reveal>
        </Section>
      )}

      {people && people.items.length > 0 && (
        <Section
          id="people"
          title="Люди, которым можно написать прямо сейчас"
          lead="Все открыты к разговору: про идею, совместный проект или просто про то, куда расти."
          more={{ href: "/people", label: "Все люди" }}
        >
          <Reveal className="grid grid-cols-2 gap-2 sm:gap-3 lg:grid-cols-4">
            {people.items.map((p, i) => (
              <PersonTile key={p.slug} person={p} style={delay(i * 70)} />
            ))}
          </Reveal>
        </Section>
      )}

      <Section title="Как из разговора вырастает команда" lead="Обычно это занимает пару недель. Иногда один вечер.">
        <Flow />
      </Section>

      {startups && startups.items.length > 0 && (
        <Section
          id="startups"
          title="Стартапы, которые ищут людей"
          lead="Для тех, кто хочет присоединиться к проекту, который уже работает."
          more={{ href: "/startups", label: "Все стартапы" }}
        >
          <Reveal className="grid gap-3 lg:grid-cols-3">
            {startups.items.map((s, i) => (
              <StartupStrip key={s.id} startup={s} style={delay(i * 70)} />
            ))}
          </Reveal>
        </Section>
      )}

      {/* Считаются только настоящие: примеры (is_demo) в счётчик не входят, а при нуле блок не показываем. */}
      {stats && (stats.people > 0 || stats.startups > 0) && (
        <section aria-label="Envola в цифрах" className={`${wrap} pt-[clamp(88px,10vw,150px)]`}>
          <Reveal className="grid grid-cols-1 gap-2 sm:grid-cols-3">
            {[
              [stats.people, plural(stats.people, "человек открыт к разговору", "человека открыты к разговору", "человек открыты к разговору")],
              [stats.startups, plural(stats.startups, "идея или стартап", "идеи и стартапа", "идей и стартапов")],
              [stats.open_roles, plural(stats.open_roles, "свободное место в командах", "свободных места в командах", "свободных мест в командах")],
            ].map(([n, label], i) => (
              <div key={i} className="reveal-item rounded-3xl bg-brand-soft p-6" style={delay(i * 60)}>
                <b className="block text-[clamp(32px,3.4vw,48px)] leading-none font-extrabold tracking-[-0.04em] text-brand-ink">{n}</b>
                <span className="mt-2 block text-[15px] text-muted-foreground">{label}</span>
              </div>
            ))}
          </Reveal>
        </section>
      )}

      <Section id="faq" title="Частые вопросы">
        <Faq />
      </Section>

      <section aria-labelledby="final-h" className={`${wrap} pt-[clamp(88px,10vw,150px)]`}>
        <div className="relative isolate grid gap-8 overflow-hidden rounded-[40px] px-6 py-[clamp(48px,7vw,110px)] text-white sm:px-[clamp(24px,5vw,72px)] lg:grid-cols-[1.2fr_1fr] lg:items-end">
          <Image src="/img/team-evening.jpg" alt="" fill sizes="(min-width: 1360px) 1360px, 100vw" className="-z-20 object-cover" />
          <div aria-hidden className="absolute inset-0 -z-10 bg-[rgb(14_26_52/0.72)]" />
          <div>
            <h2 id="final-h" className="max-w-[14ch] text-[clamp(36px,4.8vw,70px)] leading-[1.02]">
              Напиши первое сообщение сегодня
            </h2>
            <p className="mt-4 max-w-[42ch] text-[17px] text-white/85">
              Профиль занимает пять минут. Дальше люди, идеи и стартапы подстроятся под твои навыки.
            </p>
          </div>
          <div className="flex flex-wrap gap-2.5 lg:justify-end">
            <PathLink path="seeker" href="/register" className={buttonVariants({ variant: "light", size: "lg" })}>
              Создать профиль
            </PathLink>
            <PathLink path="founder" href="/register?next=/startups/new" className={buttonVariants({ variant: "onphoto", size: "lg" })}>
              Опубликовать идею
            </PathLink>
          </div>
        </div>
      </section>
    </>
  );
}

function Section({
  id,
  title,
  lead,
  more,
  children,
}: {
  id?: string;
  title: string;
  lead?: string;
  more?: { href: string; label: string };
  children: React.ReactNode;
}) {
  const hid = `${id ?? title.slice(0, 12).replace(/\s+/g, "-")}-h`;
  return (
    <section id={id} aria-labelledby={hid} className={`${wrap} scroll-mt-24 pt-[clamp(88px,10vw,150px)]`}>
      <div className="mb-10 flex flex-wrap items-end gap-x-10 gap-y-4">
        <h2 id={hid} className="max-w-[17ch] text-[clamp(32px,4vw,58px)] leading-[1.02]">
          {title}
        </h2>
        {(lead || more) && (
          <div className="flex max-w-[46ch] flex-col gap-3 sm:ml-auto">
            {lead && <p className="text-[17px] text-muted-foreground">{lead}</p>}
            {more && (
              <Link href={more.href} className="inline-flex items-center gap-1.5 font-bold text-brand-ink hover:underline">
                {more.label}
                <ArrowRight aria-hidden className="size-4" />
              </Link>
            )}
          </div>
        )}
      </div>
      {children}
    </section>
  );
}

const CHAT = [
  { who: "Алина, дизайнер", photo: "/img/a-alina.jpg", text: "Привет! Видела твою идею бота для расписания. Могу взять на себя дизайн, хочешь?" },
  { who: "Илья, Flutter", photo: "/img/a-ilya.jpg", text: "Да, как раз искал дизайнера! Созвонимся вечером?", me: true },
  { who: "Алина", photo: "/img/a-alina.jpg", text: "Давай в 19:00. Позови Лизу, она же у вас тестирует?" },
];

function Hero() {
  return (
    <div className="relative isolate grid min-h-[min(820px,calc(100svh-84px))] items-end gap-6 overflow-hidden rounded-[28px] px-4 pt-28 pb-5 text-white sm:rounded-[36px] sm:p-[clamp(24px,4vw,56px)] sm:pt-32 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)]">
      <Image
        src="/img/duo-window.jpg"
        alt="Двое обсуждают идею за ноутбуками у окна"
        fill
        preload
        sizes="(min-width: 1360px) 1360px, 100vw"
        className="hero-photo -z-20 object-cover object-[center_30%]"
      />
      <div aria-hidden className="absolute inset-0 -z-10 bg-[linear-gradient(90deg,rgb(10_18_34/0.84),rgb(10_18_34/0.5)_55%,rgb(10_18_34/0.2))] max-lg:bg-[linear-gradient(180deg,rgb(10_18_34/0.35),rgb(10_18_34/0.85)_60%)]" />
      <div>
        <h1 className="max-w-[14ch] text-[clamp(40px,5vw,76px)] leading-[1.02]">Здесь стартапы начинаются с разговора</h1>
        <p className="mt-5 max-w-[46ch] text-[clamp(17px,1.4vw,20px)] text-white/90">
          Envola — место для студентов и начинающих. Обсуди идею, найди тех, с кем её делать, или вступи в стартап, который
          уже ищет людей.
        </p>
        <div className="mt-8 flex flex-wrap gap-2.5">
          <Link href="/register" className={buttonVariants({ size: "lg" })}>
            Начать бесплатно
          </Link>
          <Link href="/startups?stage=idea" className={buttonVariants({ variant: "onphoto", size: "lg" })}>
            Посмотреть идеи
          </Link>
        </div>
        <ul className="mt-7 flex flex-wrap gap-x-[18px] gap-y-2 text-[15px] font-semibold text-white/85">
          {["Обсуждать идеи", "Искать сообщников", "Вступать в стартапы"].map((t) => (
            <li key={t} className="flex items-center gap-2">
              <span aria-hidden className="size-2 rounded-full bg-cornflower" />
              {t}
            </li>
          ))}
        </ul>
      </div>
      <figure aria-label="Пример переписки на Envola" className="flex w-full flex-col gap-2.5 justify-self-end lg:w-[min(420px,100%)]">
        {CHAT.map((m, i) => (
          <div
            key={i}
            className={`chat-msg flex items-end gap-2.5 ${m.me ? "flex-row-reverse" : ""} ${i > 1 ? "max-sm:hidden" : ""}`}
            style={delay(700 + i * 1300)}
          >
            <Image src={m.photo} alt="" width={36} height={36} className="size-9 shrink-0 rounded-full object-cover shadow-[0_0_0_2px_rgb(255_255_255/0.8)]" />
            <p
              className={`rounded-[18px] px-3.5 py-2.5 text-[15px] leading-snug shadow-[0_14px_40px_rgb(0_0_0/0.25)] ${
                m.me ? "rounded-br-md bg-brand text-white" : "rounded-bl-md bg-white text-foreground"
              }`}
            >
              <small className={`mb-0.5 block text-xs font-bold ${m.me ? "text-white/80" : "text-muted-foreground"}`}>{m.who}</small>
              {m.text}
            </p>
          </div>
        ))}
        <figcaption className="chat-msg self-center rounded-full bg-white/18 px-3.5 py-1.5 text-[13px] font-bold backdrop-blur-md" style={delay(700 + 3 * 1300)}>
          Алина присоединилась к идее «Бот для расписания»
        </figcaption>
      </figure>
    </div>
  );
}

const WAYS = [
  {
    title: "Есть идея",
    text: "Опиши её в двух абзацах и отметь, кого не хватает. Люди зададут вопросы, а кто-то захочет делать вместе с тобой.",
    cta: "Опубликовать идею",
    href: "/register?next=/startups/new",
    path: "founder" as const,
    photo: "/img/table-top.jpg",
    alt: "Обсуждение идеи за общим столом",
    ui: { avatar: "/img/a-ilya.jpg", title: "Бот для расписания", sub: "Идея, 2 в команде", tag: "Ищут дизайнера" },
  },
  {
    title: "Нужны люди",
    text: "Найди разработчика, дизайнера или маркетолога по навыкам и просто напиши первым. Резюме и созвоны с HR не нужны.",
    cta: "Найти людей",
    href: "/people",
    photo: "/img/hands-laptop.jpg",
    alt: "Работа за ноутбуком",
    ui: { avatar: "/img/a-kirill.jpg", title: "Кирилл Морозов", sub: "Frontend, открыт к проектам", tag: "Написать" },
  },
  {
    title: "Хочу в команду",
    text: "Вступи в стартап, который уже работает и ищет людей. Роль, нагрузка и условия видны сразу.",
    cta: "Смотреть стартапы",
    href: "/startups",
    path: "seeker" as const,
    photo: "/img/office-bright.jpg",
    alt: "Команда стартапа за работой",
    ui: { letter: "F", title: "Flowly", sub: "Frontend, 10 ч в неделю", tag: "Открыто" },
  },
];

function Ways() {
  return (
    <Reveal className="grid gap-3 md:grid-cols-3">
      {WAYS.map((w, i) => {
        const body = (
          <>
            <span className="relative block aspect-[4/3.1] overflow-hidden">
              <Image src={w.photo} alt={w.alt} fill sizes="(min-width: 768px) 33vw, 100vw" className="object-cover transition-transform duration-1000 ease-[var(--ease-out)] group-hover:scale-[1.04]" />
              <span aria-hidden className="absolute inset-x-3.5 bottom-3.5 flex items-center gap-2.5 rounded-2xl bg-white px-3.5 py-3 text-sm shadow-[0_12px_30px_rgb(0_0_0/0.15)]">
                {"avatar" in w.ui ? (
                  <Image src={w.ui.avatar!} alt="" width={32} height={32} className="size-8 rounded-full object-cover" />
                ) : (
                  <span className="grid size-8 place-items-center rounded-[10px] bg-brand font-extrabold text-white">{w.ui.letter}</span>
                )}
                <span className="min-w-0">
                  <b className="block truncate">{w.ui.title}</b>
                  <span className="block truncate text-[13px] text-muted-foreground">{w.ui.sub}</span>
                </span>
                <em className="ml-auto rounded-full bg-brand-soft px-2.5 py-1 text-xs font-bold whitespace-nowrap text-brand-ink not-italic">{w.ui.tag}</em>
              </span>
            </span>
            <span className="flex flex-1 flex-col gap-2.5 p-6">
              <h3 className="text-[28px] leading-tight font-extrabold tracking-[-0.04em]">{w.title}</h3>
              <span className="text-muted-foreground">{w.text}</span>
              <span className="mt-auto inline-flex items-center gap-1.5 pt-2 font-bold text-brand-ink">
                {w.cta}
                <ArrowRight aria-hidden className="size-4 transition-transform duration-300 group-hover:translate-x-1" />
              </span>
            </span>
          </>
        );
        const cls =
          "reveal-item group flex flex-col overflow-hidden rounded-[30px] bg-tone transition-transform duration-500 ease-[var(--ease-out)] hover:-translate-y-1.5";
        return w.path ? (
          <PathLink key={w.title} path={w.path} href={w.href} className={cls} style={delay(i * 80)}>
            {body}
          </PathLink>
        ) : (
          <Link key={w.title} href={w.href} className={cls} style={delay(i * 80)}>
            {body}
          </Link>
        );
      })}
    </Reveal>
  );
}

function IdeaCard({ idea, style }: { idea: StartupCardData; style?: CSSProperties }) {
  const open = idea.open_roles.reduce((n, r) => n + (r.slots ?? 1), 0);
  const team = idea.team_size ?? 1;
  return (
    <Link
      href={`/startups/${idea.slug}`}
      style={style}
      className="reveal-item group flex flex-col gap-3.5 rounded-[28px] bg-white p-6 shadow-[0_0_0_1.5px_var(--border)] transition-[box-shadow,transform] duration-300 ease-[var(--ease-out)] hover:-translate-y-0.5 hover:shadow-[0_0_0_1.5px_var(--cornflower)]"
    >
      <span className="flex items-center gap-2.5 text-sm text-muted-foreground">
        <Avatar name={idea.owner_name} url={null} className="size-9 rounded-full text-xs" />
        <span className="min-w-0">
          <b className="block truncate text-[15px] text-foreground">{idea.owner_name}</b>
          автор идеи
        </span>
        {idea.is_demo && <DemoBadge className="ml-auto" />}
      </span>
      <h3 className="text-2xl leading-[1.12] font-extrabold tracking-[-0.03em] group-hover:text-brand-ink">{idea.title}</h3>
      <p className="line-clamp-3 text-muted-foreground">{idea.pitch}</p>
      {idea.open_roles.length > 0 && (
        <span className="flex flex-wrap items-center gap-1.5 text-sm text-muted-foreground">
          Не хватает:
          {idea.open_roles.slice(0, 3).map((r) => (
            <span key={r.id} className="rounded-full bg-brand-soft px-3 py-1 text-[13px] font-bold text-brand-ink">
              {r.title}
            </span>
          ))}
        </span>
      )}
      <span className="mt-auto flex flex-wrap items-center gap-3 pt-1.5">
        <span aria-hidden className="flex">
          {Array.from({ length: Math.min(team, 4) }).map((_, i) => (
            <span key={`t${i}`} className={`size-[30px] rounded-full bg-foreground shadow-[0_0_0_2px_#fff] ${i ? "-ml-2" : ""}`} />
          ))}
          {Array.from({ length: Math.min(open, 3) }).map((_, i) => (
            <span key={`o${i}`} className="-ml-2 size-[30px] rounded-full border-[1.5px] border-dashed border-cornflower bg-brand-soft shadow-[0_0_0_2px_#fff]" />
          ))}
        </span>
        <SeatRow filled={team} open={open} />
        <span className={buttonVariants({ variant: "outline", size: "sm", className: "ml-auto max-sm:w-full" })}>Хочу участвовать</span>
      </span>
    </Link>
  );
}

/** Добивает сетку идей до чётного числа: приглашение опубликовать свою. */
function OwnIdeaCard({ style }: { style?: CSSProperties }) {
  return (
    <PathLink
      path="founder"
      href="/register?next=/startups/new"
      style={style}
      className="reveal-item group flex flex-col justify-between gap-6 rounded-[28px] bg-brand-soft p-6 transition-transform duration-300 ease-[var(--ease-out)] hover:-translate-y-0.5"
    >
      <span>
        <h3 className="text-2xl leading-[1.12] font-extrabold tracking-[-0.03em]">Есть своя идея?</h3>
        <span className="mt-3 block max-w-[40ch] text-muted-foreground">
          Опиши её в двух абзацах и отметь, кого не хватает. Её увидят разработчики, дизайнеры и маркетологи, которые ищут, с кем начать.
        </span>
      </span>
      <span className={buttonVariants({ className: "self-start" })}>
        Опубликовать идею
        <ArrowRight aria-hidden className="size-4 transition-transform duration-300 group-hover:translate-x-1" />
      </span>
    </PathLink>
  );
}

function PersonTile({ person, style }: { person: PersonCard; style?: CSSProperties }) {
  const role = [person.primary_role?.name, person.experience_level ? LEVEL[person.experience_level].toLowerCase() : null]
    .filter(Boolean)
    .join(", ");
  return (
    <Link
      href={`/people/${person.slug}`}
      style={style}
      className="reveal-item group flex flex-col overflow-hidden rounded-[26px] bg-tone transition-transform duration-500 ease-[var(--ease-out)] hover:-translate-y-1"
    >
      <span className={`relative block overflow-hidden bg-tone-2 ${person.avatar_url ? "aspect-[1/1.05]" : "aspect-[4/3] bg-[radial-gradient(120%_90%_at_50%_100%,var(--marker),var(--brand-soft)_70%)]"}`}>
        {person.avatar_url ? (
          // eslint-disable-next-line @next/next/no-img-element -- аватар уже нужного размера, оптимизатор не нужен
          <img src={person.avatar_url} alt="" className="size-full object-cover object-[center_22%] transition-transform duration-1000 group-hover:scale-[1.04]" />
        ) : (
          <span aria-hidden className="absolute inset-0 grid place-items-center">
            <span className="grid size-[clamp(64px,9vw,104px)] place-items-center rounded-full bg-white text-[clamp(22px,3vw,36px)] font-extrabold tracking-[-0.04em] text-brand-ink shadow-[0_12px_30px_-10px_rgb(59_111_228/0.45)] transition-transform duration-500 group-hover:scale-105">
              {person.display_name
                .split(/\s+/)
                .slice(0, 2)
                .map((w) => w[0])
                .join("")
                .toUpperCase()}
            </span>
          </span>
        )}
        {person.is_demo && <DemoBadge className="absolute top-3 left-3" />}
      </span>
      <span className="flex flex-1 flex-col gap-2 p-4 sm:px-[18px] sm:pb-[18px]">
        <b className="text-lg leading-tight">{person.display_name}</b>
        {role && <span className="-mt-1 text-sm text-muted-foreground">{role}</span>}
        {person.headline && (
          <span className="rounded-xl bg-white px-2.5 py-2 text-sm leading-snug max-sm:hidden">
            <span className="line-clamp-2">{person.headline}</span>
          </span>
        )}
        <span className={buttonVariants({ size: "sm", className: "mt-auto w-full" })}>Написать</span>
      </span>
    </Link>
  );
}

// Своя «обложка» у стартапа — первая буква на цветной плитке; цвет стабилен для одного и того же slug.
const TILE = ["#3B6FE4", "#7C5CF5", "#0E8F8E", "#C2410C", "#0F1B2D"];
const tileColor = (slug: string) => TILE[[...slug].reduce((n, c) => n + c.charCodeAt(0), 0) % TILE.length];

function StartupStrip({ startup, style }: { startup: StartupCardData; style?: CSSProperties }) {
  return (
    <Link
      href={`/startups/${startup.slug}`}
      style={style}
      className="reveal-item grid grid-cols-[84px_minmax(0,1fr)] items-center gap-4 rounded-3xl bg-tone p-3 transition-[background-color,transform] duration-500 ease-[var(--ease-out)] hover:-translate-y-0.5 hover:bg-tone-2 sm:grid-cols-[110px_minmax(0,1fr)]"
    >
      <span aria-hidden className="grid aspect-square place-items-center rounded-2xl text-4xl font-extrabold text-white" style={{ background: tileColor(startup.slug) }}>
        {startup.title.slice(0, 1).toUpperCase()}
      </span>
      <span className="min-w-0 py-1">
        <span className="flex items-center gap-2">
          <b className="truncate text-[19px]">{startup.title}</b>
          {startup.is_demo ? <DemoBadge className="ml-auto" /> : <TermsBadge terms={startup.terms} className="ml-auto" />}
        </span>
        <span className="mt-0.5 line-clamp-2 text-sm leading-snug text-muted-foreground">{startup.pitch}</span>
        {startup.open_roles.length > 0 && (
          <span className="mt-2 block truncate text-[13px] font-bold text-brand-ink">
            Ищут: {startup.open_roles.map((r) => r.title).join(", ")}
          </span>
        )}
      </span>
    </Link>
  );
}

const FLOW = [
  { tag: "Идея", photo: "/img/home-laptop.jpg", title: "Мысль в двух абзацах", text: "Что за проблема и кого не хватает, чтобы её решить." },
  { tag: "Разговор", photo: "/img/video-call.jpg", title: "Сообщения и созвон", text: "Пишешь людям напрямую, обсуждаете, понимаете, сработаетесь ли." },
  { tag: "Команда", photo: "/img/sticky-meeting.jpg", title: "Места в команде", text: "Открываешь роли с нагрузкой и условиями, люди откликаются." },
  { tag: "Стартап", photo: "/img/team-table.jpg", title: "Контакты и работа", text: "Принял отклик — телеграм и почта открываются обоим." },
];

function Flow() {
  return (
    <Reveal>
      <ol className="grid grid-cols-2 gap-x-2 gap-y-6 sm:gap-3 lg:grid-cols-4">
        {FLOW.map((f, i) => (
          <li key={f.tag} className="reveal-item flex flex-col gap-3" style={delay(i * 120)}>
            <span className="relative block aspect-[3/3.4] overflow-hidden rounded-[20px] sm:rounded-3xl">
              <Image src={f.photo} alt="" fill sizes="(min-width: 1024px) 25vw, 50vw" className="object-cover" />
              <span className="absolute top-2.5 left-2.5 rounded-full bg-white px-2.5 py-1 text-xs font-extrabold sm:top-3 sm:left-3 sm:px-3 sm:text-[13px]">
                {i + 1}. {f.tag}
              </span>
            </span>
            <span aria-hidden className="relative h-1 overflow-hidden rounded-sm bg-tone-2">
              <span className="reveal-line absolute inset-0 bg-cornflower" style={delay(300 + i * 300)} />
            </span>
            <h3 className="text-lg font-extrabold tracking-[-0.03em] sm:text-[22px]">{f.title}</h3>
            <p className="text-[15px] text-muted-foreground">{f.text}</p>
          </li>
        ))}
      </ol>
    </Reveal>
  );
}

const FAQ = [
  ["Что здесь можно делать?", "Три вещи. Обсуждать идеи и собирать вокруг них людей. Писать тем, с кем хочешь что-то сделать. И вступать в стартапы, которые уже ищут команду."],
  ["Можно просто пообщаться, без стартапа?", "Да. Многие приходят найти единомышленников, обсудить идею или понять, куда расти. Стартап часто появляется уже потом, из разговора."],
  ["У меня нет опыта. Со мной будут разговаривать?", "Здесь почти все в начале пути: студенты, выпускники курсов, начинающие основатели. В профиле важнее, что ты умеешь и чем хочешь заниматься, чем стаж."],
  ["А если мою идею украдут?", "Опиши идею в общих чертах, а подробности расскажи в личном разговоре тем, кому доверяешь. Сама по себе идея стоит мало: ценность в команде, которая её сделает."],
  ["Как найти сооснователя?", "Опубликуй идею и отметь, кого не хватает, или найди людей в каталоге по роли и навыкам и напиши первым. Обычно хватает пары созвонов, чтобы понять, сработаетесь ли."],
  ["Это платно?", "Нет. Профиль, сообщения, идеи и отклики бесплатны."],
  ["Мне будут платить?", "Условия указаны в карточке каждого места: бесплатно (опыт и кейс в портфолио), за деньги или «обсуждается» — формат договариваетесь на созвоне."],
  ["Кто видит мои контакты?", "Общение идёт в сообщениях Envola. Телеграм и почта открываются, только когда основатель принял твой отклик или ты принял приглашение."],
];

function Faq() {
  return (
    <div className="grid items-start gap-2 md:grid-cols-2">
      {FAQ.map(([q, a]) => (
        <details key={q} className="faq group rounded-[22px] bg-tone transition-colors duration-300 open:bg-brand-soft">
          <summary className="flex cursor-pointer list-none items-center gap-4 px-[22px] py-5 text-[17px] font-bold [&::-webkit-details-marker]:hidden">
            {q}
            <span aria-hidden className="ml-auto grid size-7 shrink-0 place-items-center rounded-full bg-white">
              <PlusIcon className="size-4 transition-transform duration-500 ease-[var(--ease-out)] group-open:rotate-45" />
            </span>
          </summary>
          <p className="faq-answer px-[22px] pb-[22px] text-muted-foreground">{a}</p>
        </details>
      ))}
    </div>
  );
}
