import { PlusIcon } from "lucide-react";
import Link from "next/link";

import { TermsBadge } from "@/components/domain/badges";
import { Container } from "@/components/domain/page-header";
import { initialsOf, Seat } from "@/components/domain/seats";
import { StartupCard } from "@/components/domain/startup-card";
import { PathLink } from "@/components/site/path-link";
import { buttonVariants } from "@/components/ui/button";
import { listOpenSeats, listRecommendedStartups, publicStats, type OpenSeat } from "@/lib/api";
import { plural } from "@/lib/labels";
import { getMe, serverClient } from "@/lib/server-api";

export default async function Home() {
  const user = await getMe();
  return user ? <Dashboard /> : <Landing />;
}

async function Landing() {
  const client = await serverClient();
  const [{ data: stats }, { data: seats }] = await Promise.all([
    publicStats({ client }),
    listOpenSeats({ client, query: { limit: 6 } }),
  ]);
  const openRoles = stats?.open_roles ?? 0;

  return (
    <>
      <Container className="grid grid-cols-1 gap-12 pt-12 pb-16 lg:grid-cols-[1.1fr_1fr] lg:gap-16 lg:pt-20">
        <div className="flex min-w-0 flex-col">
          <h1 className="text-[32px] leading-[1.1] sm:text-[56px] sm:leading-[1.08]">Тебя ждёт место в команде</h1>
          <p className="mt-6 max-w-xl text-lg text-muted-foreground">
            Студенты и начинающие находят стартапы для первого реального опыта. Основатели собирают первых людей в
            команду. Бесплатно для обеих сторон.
          </p>
          <div className="mt-10 grid gap-3 sm:grid-cols-2">
            <PathLink
              path="seeker"
              href="/startups"
              className="group rounded-2xl bg-brand p-5 text-white transition-colors hover:bg-brand-ink"
            >
              <span className="block text-lg font-bold">Ищу первый опыт</span>
              <span className="mt-1 block text-sm text-white/85">Смотри свободные места и откликайся</span>
            </PathLink>
            <PathLink
              path="founder"
              href="/register?next=/startups/new"
              className="group rounded-2xl border-[1.5px] border-foreground p-5 transition-colors hover:bg-secondary"
            >
              <span className="block text-lg font-bold">Собираю команду</span>
              <span className="mt-1 block text-sm text-muted-foreground">Опиши идею и открой места в команде</span>
            </PathLink>
          </div>
          <p className="mt-6 text-sm text-muted-foreground">
            {stats?.startups ?? 0} {plural(stats?.startups ?? 0, "стартап", "стартапа", "стартапов")} и{" "}
            {stats?.people ?? 0} {plural(stats?.people ?? 0, "человек", "человека", "человек")} уже здесь
          </p>
        </div>

        <SeatBoard seats={seats ?? []} total={openRoles} />
      </Container>

      <section className="border-y bg-secondary/60">
        <Container className="py-16">
          <h2 className="max-w-2xl text-2xl sm:text-[32px] sm:leading-tight">Контакты открываются, только когда согласны обе стороны</h2>
          <p className="mt-3 max-w-2xl text-muted-foreground">
            Никаких «напиши в личку». Ты откликаешься на конкретное место, основатель отвечает, и только после этого
            вы видите телеграм и почту друг друга.
          </p>
          <ApplicationTimeline />
        </Container>
      </section>

      <Container className="grid grid-cols-1 gap-12 py-20 lg:grid-cols-2 lg:items-center">
        <div>
          <h2 className="text-2xl sm:text-[32px] sm:leading-tight">Основателю: команда без бюджета на найм</h2>
          <ul className="mt-6 space-y-4 text-[15px]">
            {[
              ["Открой места под конкретные роли", "Сколько часов в неделю, что делать и что человек получит взамен."],
              ["Получай отклики с профилем", "Роль, навыки, ссылки на работы. Принять или отклонить можно в один клик."],
              ["Ищи сам в каталоге людей", "Фильтр по роли и навыкам, приглашение на место прямо из профиля."],
            ].map(([title, text]) => (
              <li key={title} className="flex gap-3">
                <Seat filled={false} size="sm" className="mt-0.5 size-4 rounded-[5px] border" />
                <span>
                  <span className="block font-bold">{title}</span>
                  <span className="text-muted-foreground">{text}</span>
                </span>
              </li>
            ))}
          </ul>
          <Link href="/register?next=/startups/new" className={buttonVariants({ size: "lg", className: "mt-8" })}>
            Создать стартап
          </Link>
        </div>
        <TeamPreview />
      </Container>

      <Container className="pb-8">
        <h2 className="text-2xl sm:text-[32px]">Частые вопросы</h2>
        <div className="mt-6 divide-y border-y">
          {[
            ["Это бесплатно?", "Да. Регистрация, профиль, отклики и приглашения бесплатны для всех."],
            ["Что значит «работа за долю»?", "Основатель предлагает долю в будущей компании вместо зарплаты. Обычно с вестингом: доля начисляется постепенно, пока ты в проекте. Условия указаны в карточке стартапа."],
            ["Кто увидит мои контакты?", "Только основатель стартапа, чей отклик или приглашение ты принял. В каталоге видны имя, роль и навыки."],
            ["Как защищена моя идея?", "Подробности проекта ты рассказываешь сам и тем, кому решишь. В карточке достаточно описать идею в общих чертах."],
            ["Сколько времени это займёт?", "У каждого места указано, сколько часов в неделю ждёт команда. Обычно от 4 до 15 часов, это совместимо с учёбой."],
          ].map(([q, a]) => (
            <details key={q} className="group py-5">
              <summary className="flex cursor-pointer list-none items-center gap-4 text-[17px] font-semibold">
                {q}
                <PlusIcon className="ml-auto size-5 shrink-0 text-muted-foreground transition-transform group-open:rotate-45" />
              </summary>
              <p className="mt-3 max-w-3xl text-muted-foreground">{a}</p>
            </details>
          ))}
        </div>
      </Container>
    </>
  );
}

function SeatBoard({ seats, total }: { seats: OpenSeat[]; total: number }) {
  return (
    <div className="rounded-3xl bg-secondary p-5 sm:p-6">
      <div className="flex items-baseline gap-3">
        <h2 className="font-sans text-base font-bold tracking-normal">Свободные места сейчас</h2>
        <span className="ml-auto text-sm text-muted-foreground">
          {total} {plural(total, "роль", "роли", "ролей")}
        </span>
      </div>
      {seats.length ? (
        <ul className="mt-4 space-y-2">
          {seats.map((s) => (
            <li key={s.id}>
              <Link
                href={`/startups/${s.startup.slug}`}
                className="flex items-center gap-3 rounded-xl bg-card p-3 transition-colors hover:bg-marker-soft"
              >
                <Seat filled={false} size="md" />
                <span className="min-w-0">
                  <span className="block truncate font-semibold">{s.title}</span>
                  <span className="block truncate text-sm text-muted-foreground">
                    {s.startup.title}
                    {s.hours_per_week ? `, ${s.hours_per_week} ч в неделю` : ""}
                  </span>
                </span>
                <TermsBadge terms={s.startup.terms} className="ml-auto" />
              </Link>
            </li>
          ))}
        </ul>
      ) : (
        <div className="mt-4 rounded-xl bg-card p-6 text-sm text-muted-foreground">
          Пока ни одного открытого места.{" "}
          <Link href="/register?next=/startups/new" className="font-semibold text-foreground underline">
            Создай стартап
          </Link>{" "}
          и стань первым, кто ищет команду.
        </div>
      )}
      <Link href="/startups" className="mt-4 inline-block text-sm font-semibold text-brand-ink hover:underline">
        Все стартапы и места
      </Link>
    </div>
  );
}

function ApplicationTimeline() {
  const steps = [
    { title: "Отклик отправлен", text: "Пара фраз о себе и профиль", pill: "На рассмотрении", tone: "bg-warn-soft text-warn-ink" },
    { title: "Основатель принял", text: "Обычно в течение 2–3 дней", pill: "Принят", tone: "bg-success-soft text-success-ink" },
    { title: "Контакты открыты", text: "Телеграм и почта друг друга", pill: "@maria_design", tone: "bg-foreground text-background" },
  ];
  return (
    <ol className="relative mt-10 grid gap-4 md:grid-cols-3">
      <span aria-hidden className="absolute top-[22px] right-[16%] left-[16%] hidden h-px bg-foreground/20 md:block" />
      {steps.map((s, i) => (
        <li key={s.title} className="relative rounded-2xl border bg-card p-5">
          <span className={`inline-flex rounded-full px-3 py-1 text-xs font-bold ${s.tone}`}>{s.pill}</span>
          <span className="mt-4 block font-bold">{s.title}</span>
          <span className="mt-1 block text-sm text-muted-foreground">{s.text}</span>
          <span className="sr-only">Шаг {i + 1} из 3</span>
        </li>
      ))}
    </ol>
  );
}

function TeamPreview() {
  const team = [
    { name: "Алина Соколова", role: "Основатель, продукт", filled: true },
    { name: "Мария Ким", role: "UI/UX дизайнер", filled: true },
    { role: "Backend-разработчик", note: "10 ч в неделю, за долю", filled: false },
    { role: "Маркетолог", note: "6 ч в неделю, бесплатно", filled: false },
  ];
  return (
    <figure className="rounded-3xl border p-6">
      <figcaption className="text-sm text-muted-foreground">Так видят команду новички</figcaption>
      <div className="mt-1 text-xl font-bold">ВкусноРядом</div>
      <ul className="mt-5 space-y-3">
        {team.map((m) => (
          <li key={m.role} className="flex items-center gap-3">
            <Seat filled={m.filled} size="lg" initials={m.name ? initialsOf(m.name) : undefined} />
            <span>
              <span className="block font-semibold">{m.filled ? m.name : m.role}</span>
              <span className="block text-sm text-muted-foreground">{m.filled ? m.role : m.note}</span>
            </span>
            {!m.filled && <span className="ml-auto rounded-full bg-marker px-2.5 py-0.5 text-xs font-bold text-marker-ink">Свободно</span>}
          </li>
        ))}
      </ul>
    </figure>
  );
}

async function Dashboard() {
  const user = (await getMe())!;
  const client = await serverClient();
  const { data: recs } = await listRecommendedStartups({ client });
  const p = user.profile;
  const name = p?.display_name || user.email.split("@")[0];

  return (
    <Container>
      <h1 className="text-3xl sm:text-4xl">Привет, {name}!</h1>
      <div className="mt-6 grid gap-4 md:grid-cols-3">
        {!user.email_verified && (
          <Notice tone="warn" title="Подтверди email" text="Мы отправили письмо со ссылкой. Без подтверждения нельзя публиковать профиль и откликаться." />
        )}
        {p && !p.is_published && (
          <Notice
            tone="brand"
            title={`Профиль заполнен на ${p.completeness}%`}
            text="Опубликуй профиль, чтобы откликаться на роли и попадать в каталог."
            href="/me/profile"
            cta="Заполнить профиль"
          />
        )}
        {p?.is_published && (
          <Notice tone="ok" title="Профиль опубликован" text="Основатели видят тебя в каталоге людей." href={`/people/${p.slug}`} cta="Как меня видят" />
        )}
      </div>

      <section className="mt-12">
        <div className="flex items-end">
          <div>
            <h2 className="text-2xl">Подходят тебе</h2>
            <p className="mt-1 text-sm text-muted-foreground">Подбор по твоей роли, навыкам и условиям</p>
          </div>
          <Link href="/startups" className="ml-auto text-sm font-bold hover:text-brand-ink">
            Все стартапы
          </Link>
        </div>
        {recs && recs.length > 0 ? (
          <div className="mt-6 grid gap-4 md:grid-cols-3">
            {recs.map((r) => (
              <div key={r.startup.id} className="flex flex-col">
                <StartupCard startup={r.startup} />
                <div className="mt-2 px-1 text-xs text-muted-foreground">{r.reasons.join(", ")}</div>
              </div>
            ))}
          </div>
        ) : (
          <div className="mt-6 rounded-2xl border border-dashed bg-card p-8 text-muted-foreground">
            Укажи роль и навыки в{" "}
            <Link href="/me/profile" className="font-bold text-foreground underline">
              профиле
            </Link>
            , и здесь появятся стартапы, которым ты нужен.
          </div>
        )}
      </section>
    </Container>
  );
}

function Notice({
  tone,
  title,
  text,
  href,
  cta,
}: {
  tone: "warn" | "brand" | "ok";
  title: string;
  text: string;
  href?: string;
  cta?: string;
}) {
  const bg = tone === "warn" ? "bg-warn-soft" : tone === "ok" ? "bg-success-soft" : "bg-brand-soft";
  return (
    <div className={`rounded-2xl p-5 ${bg}`}>
      <div className="font-extrabold">{title}</div>
      <p className="mt-1 text-sm text-foreground/75">{text}</p>
      {href && (
        <Link href={href} className={buttonVariants({ size: "sm", className: "mt-4" })}>
          {cta}
        </Link>
      )}
    </div>
  );
}
