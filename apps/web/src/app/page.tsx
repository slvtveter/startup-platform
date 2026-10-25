import { PlusIcon } from "lucide-react";
import Link from "next/link";

import { DemoBadge, TermsBadge } from "@/components/domain/badges";
import { Container, EmptyState } from "@/components/domain/page-header";
import { initialsOf, Seat, SeatRow } from "@/components/domain/seats";
import { StartupCard } from "@/components/domain/startup-card";
import { PathLink } from "@/components/site/path-link";
import { TrackView } from "@/components/site/track-view";
import { buttonVariants } from "@/components/ui/button";
import {
  getMyProfile,
  listMyApplications,
  listMyStartups,
  listOpenSeats,
  listRecommendedStartups,
  publicStats,
  type OpenSeat,
} from "@/lib/api";
import { plural } from "@/lib/labels";
import { nextStep } from "@/lib/next-step";
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
      <TrackView name="landing_viewed" />
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
              className="group rounded-2xl bg-brand p-5 text-primary-foreground transition-colors hover:bg-brand-ink"
            >
              <span className="block text-lg font-bold">Ищу первый опыт</span>
              <span className="mt-1 block text-sm text-primary-foreground/85">Смотри свободные места и откликайся</span>
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
          {/* Считаются только настоящие: примеры (is_demo) в счётчик не входят, а при нуле строку не показываем. */}
          {(stats?.startups || stats?.people) ? (
            <p className="mt-6 text-sm text-muted-foreground">
              {stats?.startups ?? 0} {plural(stats?.startups ?? 0, "стартап", "стартапа", "стартапов")} и{" "}
              {stats?.people ?? 0} {plural(stats?.people ?? 0, "человек", "человека", "человек")} уже здесь
            </p>
          ) : null}
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
        {total > 0 && (
          <span className="ml-auto text-sm text-muted-foreground">
            {total} {plural(total, "роль", "роли", "ролей")}
          </span>
        )}
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
                {s.startup.is_demo ? (
                  <DemoBadge className="ml-auto" />
                ) : (
                  <TermsBadge terms={s.startup.terms} className="ml-auto" />
                )}
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
  const [{ data: recs }, { data: profile }, { data: apps }, { data: mine }] = await Promise.all([
    listRecommendedStartups({ client }),
    getMyProfile({ client }),
    listMyApplications({ client }),
    listMyStartups({ client }),
  ]);
  const name = profile?.display_name || user.email.split("@")[0];
  const myStartups = mine ?? [];
  const step = nextStep({
    emailVerified: user.email_verified,
    applyBlockers: profile?.apply_blockers ?? [],
    pendingIncoming: myStartups.map((m) => ({ slug: m.slug, title: m.title, count: m.pending_applications })),
    applications: (apps ?? []).map((a) => ({ status: a.status, startupTitle: a.startup_title, decidedAt: a.decided_at ?? null })),
    hasStartups: myStartups.length > 0,
  });

  return (
    <Container>
      <h1 className="text-2xl sm:text-[34px]">Привет, {name}</h1>

      <section
        aria-labelledby="next-step"
        className="mt-5 flex flex-col gap-3 rounded-2xl border border-l-4 border-l-brand px-4 py-3 sm:flex-row sm:items-center sm:gap-4"
      >
        <div className="min-w-0">
          <h2 id="next-step" className="font-sans text-base font-semibold tracking-normal">
            {step.title}
          </h2>
          <p className="text-sm text-muted-foreground">{step.text}</p>
        </div>
        <Link href={step.href} className={buttonVariants({ variant: "brand", size: "sm", className: "shrink-0 sm:ml-auto" })}>
          {step.cta}
        </Link>
      </section>

      {myStartups.length > 0 && (
        <section className="mt-12">
          <h2 className="text-xl sm:text-2xl">Мои стартапы</h2>
          <ul className="mt-4 divide-y border-y">
            {myStartups.map((m) => {
              const open = m.open_roles.reduce((n, r) => n + (r.slots ?? 1), 0);
              return (
                <li key={m.id}>
                  <Link href={`/me/startups/${m.slug}`} className="flex flex-wrap items-center gap-x-4 gap-y-2 py-4 hover:text-brand-ink">
                    <span className="font-semibold">{m.title}</span>
                    <SeatRow filled={m.team_size ?? 1} open={open} />
                    <span className="ml-auto text-sm text-muted-foreground">
                      {plural(m.views_30d ?? 0, `${m.views_30d ?? 0} просмотр`, `${m.views_30d ?? 0} просмотра`, `${m.views_30d ?? 0} просмотров`)} за 30 дней,{" "}
                      {m.pending_applications
                        ? plural(m.pending_applications, `${m.pending_applications} новый отклик`, `${m.pending_applications} новых отклика`, `${m.pending_applications} новых откликов`)
                        : "новых откликов нет"}
                    </span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </section>
      )}

      <section className="mt-12">
        <div className="flex flex-wrap items-end gap-2">
          <div>
            <h2 className="text-xl sm:text-2xl">Подходят тебе</h2>
            <p className="mt-1 text-sm text-muted-foreground">Подбор по твоей роли, навыкам и условиям</p>
          </div>
          <Link href="/startups" className="ml-auto text-sm font-semibold text-brand-ink hover:underline">
            Все стартапы
          </Link>
        </div>
        {recs && recs.length > 0 ? (
          <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            {recs.map((r) => (
              <StartupCard key={r.startup.id} startup={r.startup} reasons={r.reasons} />
            ))}
          </div>
        ) : (
          <EmptyState
            title="Пока нечего предложить"
            text="Укажи роль и навыки в профиле, и здесь появятся стартапы, которым ты нужен."
            action={
              <Link href="/me/profile" className={buttonVariants({ variant: "brand" })}>
                Заполнить профиль
              </Link>
            }
          />
        )}
      </section>
    </Container>
  );
}
