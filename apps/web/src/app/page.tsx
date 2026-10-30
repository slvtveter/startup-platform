import { ArrowRight, PlusIcon } from "lucide-react";
import type { CSSProperties } from "react";
import Image from "next/image";
import Link from "next/link";

import { Dashboard } from "@/components/domain/dashboard";
import { PersonCard } from "@/components/domain/person-card";
import { StartupCard } from "@/components/domain/startup-card";
import { HomeFeed, type FeedTab } from "@/components/landing/home-feed";
import { IntentForm } from "@/components/landing/intent-form";
import { JsonLd, siteUrl } from "@/components/site/json-ld";
import { PathLink } from "@/components/site/path-link";
import { TrackView } from "@/components/site/track-view";
import { buttonVariants } from "@/components/ui/button";
import { listPeople, listRoles, listStartups } from "@/lib/api";
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
  const [{ data: roles }, { data: ideas }, { data: cofounders }, { data: startups }] = await Promise.all([
    listRoles({ client }),
    listStartups({ client, query: { stage: ["idea"], limit: 3 } }),
    listPeople({ client, query: { cofound: true, limit: 2 } }),
    listStartups({ client, query: { stage: ["prototype", "mvp", "launched"], limit: 3 } }),
  ]);
  const grid = "grid gap-3 sm:grid-cols-2 lg:grid-cols-3";
  const feed: FeedTab[] = [];
  if (ideas?.items.length)
    feed.push({
      value: "ideas",
      label: "Идеи",
      count: ideas.total,
      more: { href: "/startups?stage=idea", label: "Все идеи" },
      content: <div className={grid}>{ideas.items.map((s) => <StartupCard key={s.id} startup={s} />)}</div>,
    });
  if (cofounders?.items.length)
    feed.push({
      value: "cofounders",
      label: "Сообщники",
      count: cofounders.total,
      more: { href: "/people?cofound=1", label: "Все, кто ищет сообщников" },
      content: <div className="grid gap-3">{cofounders.items.map((p) => <PersonCard key={p.slug} person={p} />)}</div>,
    });
  if (startups?.items.length)
    feed.push({
      value: "startups",
      label: "Стартапы",
      count: startups.total,
      more: { href: "/startups", label: "Все стартапы" },
      content: <div className={grid}>{startups.items.map((s) => <StartupCard key={s.id} startup={s} />)}</div>,
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

      <div className={`${wrap} pt-2`}>
        <Hero roles={(roles ?? []).map((r) => ({ value: r.slug, label: r.name }))} />
      </div>

      {feed.length > 0 && (
        <Section id="feed" title="Кто сейчас ищет людей">
          <HomeFeed tabs={feed} />
        </Section>
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
              Начни с профиля
            </h2>
            <p className="mt-4 max-w-[42ch] text-lg text-white/85">
              Две минуты: роль, пара навыков и что ищешь.
            </p>
          </div>
          <div className="flex flex-wrap gap-2.5 lg:justify-end">
            <PathLink path="seeker" href="/register" className={buttonVariants({ variant: "light", size: "lg" })}>
              Создать профиль
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
  { who: "Алина, дизайнер", photo: FACES.alina, text: "Привет! Видела, ты пишешь фронт на React. Собираю команду под приложение для поиска соседей по квартире, макеты уже есть. Глянешь?" },
  { who: "Кирилл, frontend", photo: FACES.kirill, text: "Привет, давай. Кидай ссылку", me: true },
  { who: "Алина", photo: FACES.alina, text: "Держи. Если зайдёт, созвонимся завтра после пар? Бэкендер Егор тоже будет" },
  { who: "Кирилл", photo: FACES.kirill, text: "Ок, в шесть удобно", me: true },
];

function Hero({ roles }: { roles: { value: string; label: string }[] }) {
  return (
    <div className="relative isolate grid min-h-[min(780px,calc(100svh-84px))] items-end gap-10 overflow-hidden rounded-[28px] px-4 pt-28 pb-6 text-white sm:rounded-[36px] sm:p-[clamp(24px,4vw,56px)] sm:pt-32 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,0.85fr)]">
      <Image
        src={PHOTOS.heroTeam}
        alt="Команда обсуждает проект за столом с ноутбуком"
        fill
        preload
        placeholder="blur"
        quality={85}
        sizes="(max-width: 640px) 220vw, (min-width: 1360px) 1360px, 100vw"
        className="-z-20 object-cover object-[center_40%]"
      />
      <div aria-hidden className="absolute inset-0 -z-10 bg-[linear-gradient(90deg,rgb(10_18_34/0.86),rgb(10_18_34/0.55)_55%,rgb(10_18_34/0.25))] max-lg:bg-[linear-gradient(180deg,rgb(10_18_34/0.35),rgb(10_18_34/0.88)_55%)]" />
      <div>
        <h1 className="max-w-[13ch] text-[40px] sm:text-[56px] lg:text-[72px] leading-[1]">Найди, с кем делать стартап</h1>
        <p className="mt-5 max-w-[40ch] text-lg text-white/85 sm:text-xl">Студенты и начинающие в IT. Можно без идеи и без опыта.</p>
        <div className="mt-9">
          <IntentForm roles={roles} />
        </div>
        <p className="mt-6 text-sm text-white/75">
          Уже есть аккаунт?{" "}
          <Link href="/login" className="font-bold text-white underline-offset-4 hover:underline">
            Войти
          </Link>
        </p>
      </div>
      <figure aria-label="Пример переписки на Envola" className="flex w-full flex-col gap-2 justify-self-end max-lg:hidden lg:w-[min(420px,100%)]">
        {CHAT.map((m, i) => (
          <div key={i} className={`chat-msg flex items-end gap-2.5 ${m.me ? "flex-row-reverse" : ""}`} style={delay(600 + i * 900)}>
            {/* Аватар только у первой реплики подряд от одного человека, как в мессенджерах. */}
            {CHAT[i - 1]?.photo === m.photo ? (
              <span aria-hidden className="size-9 shrink-0" />
            ) : (
              <Image src={m.photo} alt="" width={36} height={36} className="size-9 shrink-0 rounded-full object-cover shadow-[0_0_0_2px_rgb(255_255_255/0.8)]" />
            )}
            <p
              className={`rounded-2xl px-3.5 py-2.5 text-base leading-snug shadow-[0_14px_40px_rgb(0_0_0/0.25)] ${
                m.me ? "rounded-br-md bg-brand text-white" : "rounded-bl-md bg-white text-foreground"
              }`}
            >
              {m.who.includes(",") && <small className={`mb-0.5 block text-xs font-bold ${m.me ? "text-white/80" : "text-muted-foreground"}`}>{m.who}</small>}
              {m.text}
            </p>
          </div>
        ))}
      </figure>
    </div>
  );
}

const FAQ = [
  ["У меня нет идеи. Мне сюда?", "Да. Включи в профиле «Ищу сообщников»: тебя найдут те, кто тоже хочет своё. Идею можно придумать вместе."],
  ["У меня нет опыта. Со мной будут разговаривать?", "Здесь почти все в начале пути: студенты, выпускники курсов, начинающие основатели. Важнее, что ты умеешь и чем хочешь заниматься."],
  ["А если мою идею украдут?", "Опиши её в общих чертах, а подробности расскажи тем, с кем решишь работать."],
  ["Это бесплатно? А платить будут?", "Envola бесплатна. Оплата за работу зависит от проекта: в каждой роли написано, без оплаты она, с оплатой или договоритесь."],
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
