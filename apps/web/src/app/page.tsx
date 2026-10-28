import { ArrowRight, PlusIcon } from "lucide-react";
import type { CSSProperties } from "react";
import Image, { type StaticImageData } from "next/image";
import Link from "next/link";

import { Dashboard } from "@/components/domain/dashboard";
import { PersonCard } from "@/components/domain/person-card";
import { StartupCard } from "@/components/domain/startup-card";
import { SearchBar } from "@/components/landing/search-bar";
import { JsonLd, siteUrl } from "@/components/site/json-ld";
import { PathLink } from "@/components/site/path-link";
import { Reveal } from "@/components/site/reveal";
import { TrackView } from "@/components/site/track-view";
import { buttonVariants } from "@/components/ui/button";
import { listPeople, listStartups, publicStats } from "@/lib/api";
import { plural } from "@/lib/labels";
import { FACES, PHOTOS } from "@/lib/photos";
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
  const [{ data: stats }, { data: ideas }, { data: cofounders }, { data: people }, { data: startups }] = await Promise.all([
    publicStats({ client }),
    listStartups({ client, query: { stage: ["idea"], limit: 3 } }),
    listPeople({ client, query: { looking_for: ["cofound"], limit: 4 } }),
    listPeople({ client, query: { limit: 8 } }),
    listStartups({ client, query: { stage: ["prototype", "mvp", "launched"], limit: 3 } }),
  ]);
  // В «Людях» не повторяем тех, кто уже показан в «Сообщниках».
  const shown = new Set(cofounders?.items.map((p) => p.slug));
  const others = (people?.items ?? []).filter((p) => !shown.has(p.slug)).slice(0, 4);

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

      <div className={`${wrap} pt-2`}>
        <Hero />
        <div className="mt-3">
          <SearchBar />
        </div>
      </div>

      <Section title="С чего начать" lead="Неважно, есть ли у тебя идея, команда или только желание попробовать. С любого места можно сделать первый шаг.">
        <Ways />
      </Section>

      {ideas && ideas.items.length > 0 && (
        <Section
          id="ideas"
          title="Идеи, вокруг которых собираются люди"
          lead="Сырые, но живые. Открой идею, задай вопрос автору или откликнись на роль, которой не хватает."
          more={{ href: "/ideas", label: "Все идеи" }}
        >
          <Reveal className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {ideas.items.map((s, i) => (
              <div key={s.id} className="reveal-item" style={delay(i * 50)}>
                <StartupCard startup={s} />
              </div>
            ))}
            {ideas.items.length < 3 && (
              <div className="reveal-item" style={delay(ideas.items.length * 80)}>
                <OwnIdeaCard />
              </div>
            )}
          </Reveal>
        </Section>
      )}

      {cofounders && cofounders.items.length > 0 && (
        <section aria-labelledby="cof-h" className={`${wrap} pt-[clamp(72px,8vw,120px)]`}>
          <div className="rounded-[36px] bg-brand-soft p-4 sm:p-8 lg:p-10">
            <div className="flex flex-wrap items-end gap-x-10 gap-y-6 p-2 sm:p-0">
              <div>
                <p className="text-sm font-bold tracking-wide text-brand-ink uppercase">Сообщники</p>
                <h2 id="cof-h" className="mt-3 max-w-[16ch] text-[32px] sm:text-[36px] lg:text-[48px] leading-[1.02]">
                  Нет идеи? Придумайте её вместе
                </h2>
                <p className="mt-4 max-w-[48ch] text-lg text-muted-foreground">
                  Эти люди хотят своё, но не хотят делать в одиночку. Напиши тому, чьи навыки дополняют твои, созвонитесь и накидайте идей.
                </p>
              </div>
              <div className="flex flex-wrap gap-2.5 sm:ml-auto">
                <Link href="/people/cofounders" className={buttonVariants({ size: "lg" })}>
                  Все сообщники
                  <ArrowRight aria-hidden />
                </Link>
                <Link href="/register?next=/me/profile" className={buttonVariants({ variant: "light", size: "lg" })}>
                  Я тоже ищу
                </Link>
              </div>
            </div>
            <Reveal className="mt-8 grid grid-cols-1 gap-2 sm:grid-cols-2 sm:gap-3 lg:grid-cols-4">
              {cofounders.items.map((p, i) => (
                <div key={p.slug} className="reveal-item" style={delay(i * 50)}>
                  <PersonCard person={p} surface="white" />
                </div>
              ))}
            </Reveal>
          </div>
        </section>
      )}

      {others.length > 0 && (
        <Section
          id="people"
          title="Кто уже здесь"
          lead="Разработчики, дизайнеры, маркетологи и аналитики в начале пути. Открой профиль: навыки, опыт и что человек ищет."
          more={{ href: "/people", label: "Все люди" }}
        >
          <Reveal className="grid grid-cols-1 gap-2 sm:grid-cols-2 sm:gap-3 lg:grid-cols-4">
            {others.map((p, i) => (
              <div key={p.slug} className="reveal-item" style={delay(i * 50)}>
                <PersonCard person={p} />
              </div>
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
          <Reveal className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {startups.items.map((s, i) => (
              <div key={s.id} className="reveal-item" style={delay(i * 50)}>
                <StartupCard startup={s} />
              </div>
            ))}
          </Reveal>
        </Section>
      )}

      {/* Считаются только настоящие: примеры (is_demo) в счётчик не входят, а при нуле блок не показываем. */}
      {stats && (stats.people > 0 || stats.startups > 0) && (
        <section aria-label="Envola в цифрах" className={`${wrap} pt-[clamp(72px,8vw,120px)]`}>
          <Reveal className="grid grid-cols-1 gap-2 sm:grid-cols-3">
            {[
              [stats.people, plural(stats.people, "человек открыт к разговору", "человека открыты к разговору", "человек открыты к разговору")],
              [stats.startups, plural(stats.startups, "идея или стартап", "идеи и стартапа", "идей и стартапов")],
              [stats.open_roles, plural(stats.open_roles, "свободное место в командах", "свободных места в командах", "свободных мест в командах")],
            ].map(([n, label], i) => (
              <div key={i} className="reveal-item rounded-3xl bg-tone p-6" style={delay(i * 60)}>
                <b className="block text-[32px] lg:text-[48px] leading-none font-extrabold tracking-[-0.04em] text-brand-ink">{n}</b>
                <span className="mt-2 block text-base text-muted-foreground">{label}</span>
              </div>
            ))}
          </Reveal>
        </section>
      )}

      <Section id="faq" title="Частые вопросы">
        <Faq />
      </Section>

      <section aria-labelledby="final-h" className={`${wrap} pt-[clamp(72px,8vw,120px)]`}>
        <div className="relative isolate grid gap-8 overflow-hidden rounded-[36px] px-6 py-[clamp(48px,7vw,110px)] text-white sm:px-[clamp(24px,5vw,72px)] lg:grid-cols-[1.2fr_1fr] lg:items-end">
          <Image src={PHOTOS.teamEvening} alt="" fill placeholder="blur" sizes="(min-width: 1360px) 1360px, 100vw" className="-z-20 object-cover" />
          <div aria-hidden className="absolute inset-0 -z-10 bg-[rgb(14_26_52/0.72)]" />
          <div>
            <h2 id="final-h" className="max-w-[14ch] text-[36px] sm:text-[48px] lg:text-[64px] leading-[1.02]">
              Начни с профиля или идеи
            </h2>
            <p className="mt-4 max-w-[42ch] text-lg text-white/85">
              Профиль занимает пять минут, идея — пару абзацев. Дальше тебя найдут люди с нужными навыками.
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
    <section id={id} aria-labelledby={hid} className={`${wrap} scroll-mt-24 pt-[clamp(72px,8vw,120px)]`}>
      <div className="mb-10 flex flex-wrap items-end gap-x-10 gap-y-4">
        <h2 id={hid} className="max-w-[17ch] text-[32px] sm:text-[48px] lg:text-[56px] leading-[1.02]">
          {title}
        </h2>
        {(lead || more) && (
          <div className="flex max-w-[46ch] flex-col gap-3 sm:ml-auto">
            {lead && <p className="text-lg text-muted-foreground">{lead}</p>}
            {more && (
              <Link href={more.href} className="inline-flex items-center gap-1.5 font-bold text-brand-ink transition-colors hover:text-brand-hover">
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
  { who: "Алина, дизайнер", photo: FACES.alina, text: "Привет! Видела, ты тоже ищешь сообщников. Есть мысль про сервис для поиска соседей по квартире — обсудим?" },
  { who: "Кирилл, frontend", photo: FACES.kirill, text: "Давай! Я как раз хотел сделать что-то для студентов. Созвонимся вечером?", me: true },
  { who: "Алина", photo: FACES.alina, text: "В 19:00. Позову Егора, он пишет на Python." },
];

function Hero() {
  return (
    <div className="relative isolate grid min-h-[min(820px,calc(100svh-84px))] items-end gap-6 overflow-hidden rounded-[28px] px-4 pt-28 pb-5 text-white sm:rounded-[36px] sm:p-[clamp(24px,4vw,56px)] sm:pt-32 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)]">
      <Image
        src={PHOTOS.duoWindow}
        alt="Двое обсуждают идею за ноутбуками у окна"
        fill
        preload
        placeholder="blur"
        quality={85}
        sizes="(max-width: 640px) 220vw, (min-width: 1360px) 1360px, 100vw"
        className="-z-20 object-cover object-[center_30%]"
      />
      <div aria-hidden className="absolute inset-0 -z-10 bg-[linear-gradient(90deg,rgb(10_18_34/0.84),rgb(10_18_34/0.5)_55%,rgb(10_18_34/0.2))] max-lg:bg-[linear-gradient(180deg,rgb(10_18_34/0.35),rgb(10_18_34/0.85)_60%)]" />
      <div>
        <h1 className="max-w-[14ch] text-[36px] sm:text-[48px] lg:text-[64px] leading-[1.02]">Здесь стартапы начинаются с разговора</h1>
        <p className="mt-5 max-w-[46ch] text-lg sm:text-xl text-white/90">
          Envola — место для студентов и начинающих. Обсуди идею, найди сообщников, чтобы придумать свою, или вступи в стартап, который уже ищет людей.
        </p>
        <div className="mt-8 flex flex-wrap gap-2.5">
          <Link href="/register" className={buttonVariants({ size: "lg" })}>
            Создать профиль
          </Link>
          <Link href="/people/cofounders" className={buttonVariants({ variant: "onphoto", size: "lg" })}>
            Найти сообщников
          </Link>
        </div>
        <p className="mt-4 text-sm font-semibold text-white/75">Бесплатно · без резюме · профиль за пару минут</p>
      </div>
      <figure aria-label="Пример переписки на Envola" className="flex w-full flex-col gap-2.5 justify-self-end lg:w-[min(420px,100%)]">
        {CHAT.map((m, i) => (
          <div key={i} className={`chat-msg flex items-end gap-2.5 ${m.me ? "flex-row-reverse" : ""} ${i > 1 ? "max-sm:hidden" : ""}`} style={delay(600 + i * 1100)}>
            <Image src={m.photo} alt="" width={36} height={36} className="size-9 shrink-0 rounded-full object-cover shadow-[0_0_0_2px_rgb(255_255_255/0.8)]" />
            <p
              className={`rounded-2xl px-3.5 py-2.5 text-base leading-snug shadow-[0_14px_40px_rgb(0_0_0/0.25)] ${
                m.me ? "rounded-br-md bg-brand text-white" : "rounded-bl-md bg-white text-foreground"
              }`}
            >
              <small className={`mb-0.5 block text-xs font-bold ${m.me ? "text-white/80" : "text-muted-foreground"}`}>{m.who}</small>
              {m.text}
            </p>
          </div>
        ))}
        <figcaption className="chat-msg self-center rounded-full bg-white/18 px-3.5 py-1.5 text-sm font-bold backdrop-blur-md" style={delay(600 + 3 * 1100)}>
          Алина, Кирилл и Егор собрали команду
        </figcaption>
      </figure>
    </div>
  );
}

type Way = {
  title: string;
  text: string;
  cta: string;
  href: string;
  path?: "seeker" | "founder";
  photo: StaticImageData;
  alt: string;
  ui: { avatar?: StaticImageData; letter?: string; title: string; sub: string; tag: string };
};

const WAYS: Way[] = [
  {
    title: "Есть идея",
    text: "Опиши её в двух абзацах и отметь, кого не хватает. Люди зададут вопросы, кто-то захочет делать вместе.",
    cta: "Опубликовать идею",
    href: "/register?next=/startups/new",
    path: "founder",
    photo: PHOTOS.tableTop,
    alt: "Обсуждение идеи за общим столом",
    ui: { avatar: FACES.ilya, title: "Бот расписания", sub: "Идея", tag: "Нужен дизайнер" },
  },
  {
    title: "Нет идеи",
    text: "Найди сообщников с другими навыками, созвонитесь и придумайте стартап вместе. Идея не нужна.",
    cta: "Найти сообщников",
    href: "/people/cofounders",
    photo: PHOTOS.whiteboardDuo,
    alt: "Двое накидывают идеи у доски",
    ui: { avatar: FACES.vera, title: "Вера", sub: "ML-инженер", tag: "Ищет сообщников" },
  },
  {
    title: "Нужны люди",
    text: "Найди разработчика, дизайнера или маркетолога по навыкам и напиши первым. Резюме не нужно.",
    cta: "Найти людей",
    href: "/people",
    photo: PHOTOS.handsLaptop,
    alt: "Работа за ноутбуком",
    ui: { avatar: FACES.kirill, title: "Кирилл", sub: "Frontend", tag: "Открыт к проектам" },
  },
  {
    title: "Хочу в команду",
    text: "Вступи в стартап, который уже работает и ищет людей. Роль, нагрузка и условия видны сразу.",
    cta: "Смотреть стартапы",
    href: "/startups",
    path: "seeker",
    photo: PHOTOS.officeBright,
    alt: "Команда стартапа за работой",
    ui: { letter: "F", title: "Flowly", sub: "MVP", tag: "2 места" },
  },
];

function Ways() {
  return (
    <Reveal className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
      {WAYS.map((w, i) => {
        const body = (
          <>
            <span className="relative block aspect-[4/3] overflow-hidden rounded-2xl">
              <Image src={w.photo} alt={w.alt} fill placeholder="blur" sizes="(min-width: 1280px) 25vw, (min-width: 640px) 50vw, 100vw" className="object-cover" />
              <span aria-hidden className="absolute inset-x-3 bottom-3 flex items-center gap-2.5 rounded-2xl bg-white px-3 py-2.5 text-sm shadow-[0_12px_30px_rgb(0_0_0/0.15)]">
                {w.ui.avatar ? (
                  <Image src={w.ui.avatar} alt="" width={32} height={32} className="size-8 rounded-full object-cover" />
                ) : (
                  <span className="grid size-8 place-items-center rounded-xl bg-brand font-extrabold text-white">{w.ui.letter}</span>
                )}
                <span className="min-w-0 flex-1">
                  <b className="block truncate">{w.ui.title}</b>
                  <span className="block truncate text-sm text-muted-foreground">{w.ui.sub}</span>
                </span>
                <em className="shrink-0 rounded-full bg-brand-soft px-2.5 py-1 text-xs font-bold whitespace-nowrap text-brand-ink not-italic">{w.ui.tag}</em>
              </span>
            </span>
            <span className="flex flex-1 flex-col gap-2 px-4 pt-5 pb-4">
              <h3 className="text-[28px] leading-tight font-extrabold tracking-[-0.04em]">{w.title}</h3>
              <span className="text-muted-foreground">{w.text}</span>
              <span className="mt-auto inline-flex items-center gap-1.5 pt-3 font-bold text-brand-ink">
                {w.cta}
                <ArrowRight aria-hidden className="size-4" />
              </span>
            </span>
          </>
        );
        const cls = "reveal-item card-hover group flex flex-col rounded-[28px] bg-tone p-2 hover:bg-tone-2";
        return w.path ? (
          <PathLink key={w.title} path={w.path} href={w.href} className={cls} style={delay(i * 50)}>
            {body}
          </PathLink>
        ) : (
          <Link key={w.title} href={w.href} className={cls} style={delay(i * 50)}>
            {body}
          </Link>
        );
      })}
    </Reveal>
  );
}

/** Добивает ряд идей: приглашение опубликовать свою. */
function OwnIdeaCard() {
  return (
    <PathLink
      path="founder"
      href="/register?next=/startups/new"
      className="card-hover group flex h-full min-h-[320px] flex-col justify-between gap-6 rounded-[28px] bg-brand-soft p-6 hover:bg-marker"
    >
      <span>
        <h3 className="text-2xl leading-[1.12] font-extrabold tracking-[-0.03em]">Есть своя идея?</h3>
        <span className="mt-3 block max-w-[36ch] text-muted-foreground">
          Опиши её в двух абзацах и отметь, кого не хватает. Её увидят разработчики, дизайнеры и маркетологи, которые ищут, с кем начать.
        </span>
      </span>
      <span className={buttonVariants({ className: "self-start" })}>
        <PlusIcon aria-hidden />
        Опубликовать идею
      </span>
    </PathLink>
  );
}

const FLOW = [
  { tag: "Идея", photo: PHOTOS.homeLaptop, title: "Мысль в двух абзацах", text: "Своя или придуманная вместе с сообщниками: что за проблема и кого не хватает." },
  { tag: "Разговор", photo: PHOTOS.videoCall, title: "Сообщения и созвон", text: "Пишешь людям напрямую, обсуждаете, понимаете, сработаетесь ли." },
  { tag: "Команда", photo: PHOTOS.stickyMeeting, title: "Места в команде", text: "Открываешь роли с нагрузкой и условиями, люди откликаются." },
  { tag: "Стартап", photo: PHOTOS.teamTable, title: "Контакты и работа", text: "Принял отклик — телеграм и почта открываются обоим." },
];

function Flow() {
  return (
    <Reveal>
      <ol className="grid grid-cols-2 gap-x-2 gap-y-6 sm:gap-3 lg:grid-cols-4">
        {FLOW.map((f, i) => (
          <li key={f.tag} className="reveal-item flex flex-col gap-3" style={delay(i * 60)}>
            <span className="relative block aspect-[3/3.4] overflow-hidden rounded-2xl sm:rounded-3xl">
              <Image src={f.photo} alt="" fill placeholder="blur" sizes="(min-width: 1024px) 25vw, 50vw" className="object-cover" />
              <span className="absolute top-2.5 left-2.5 rounded-full bg-white px-2.5 py-1 text-xs font-extrabold sm:top-3 sm:left-3 sm:px-3 sm:text-sm">
                {i + 1}. {f.tag}
              </span>
            </span>
            <span aria-hidden className="relative h-1 overflow-hidden rounded-sm bg-tone-2">
              <span className="reveal-line absolute inset-0 bg-cornflower" style={delay(300 + i * 300)} />
            </span>
            <h3 className="text-lg font-extrabold tracking-[-0.03em] sm:text-2xl">{f.title}</h3>
            <p className="text-base text-muted-foreground">{f.text}</p>
          </li>
        ))}
      </ol>
    </Reveal>
  );
}

const FAQ = [
  ["Что здесь можно делать?", "Обсуждать идеи и собирать вокруг них людей. Искать сообщников, чтобы придумать стартап с нуля. Писать тем, с кем хочешь что-то сделать. И вступать в стартапы, которые уже ищут команду."],
  ["У меня нет идеи. Мне сюда?", "Да. Включи в профиле «Ищу сообщников» и загляни в раздел «Сообщники»: там люди, которые тоже хотят своё. Созвонитесь, накидайте идеи и опубликуйте лучшую."],
  ["Можно просто пообщаться, без стартапа?", "Да. Многие приходят найти единомышленников, обсудить идею или понять, куда расти. Стартап часто появляется уже потом, из разговора."],
  ["У меня нет опыта. Со мной будут разговаривать?", "Здесь почти все в начале пути: студенты, выпускники курсов, начинающие основатели. В профиле важнее, что ты умеешь и чем хочешь заниматься, чем стаж."],
  ["А если мою идею украдут?", "Опиши идею в общих чертах, а подробности расскажи в личном разговоре тем, кому доверяешь. Сама по себе идея стоит мало: ценность в команде, которая её сделает."],
  ["Это платно?", "Нет. Профиль, сообщения, идеи и отклики бесплатны."],
  ["Мне будут платить?", "Условия указаны в карточке каждого места: бесплатно (опыт и кейс в портфолио), за деньги или «обсуждается» — формат договариваетесь на созвоне."],
  ["Кто видит мои контакты?", "Общение идёт в сообщениях Envola. Телеграм и почта открываются, только когда основатель принял твой отклик или ты принял приглашение."],
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
