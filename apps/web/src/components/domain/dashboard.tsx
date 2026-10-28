import { ArrowRightIcon, InboxIcon, MailIcon, MessageCircleIcon, PlusIcon, SearchIcon, SendIcon } from "lucide-react";
import Link from "next/link";

import { Container, EmptyState } from "@/components/domain/page-header";
import { SeatRow } from "@/components/domain/seats";
import { PersonCard } from "@/components/domain/person-card";
import { StartupCard } from "@/components/domain/startup-card";
import { buttonVariants } from "@/components/ui/button";
import {
  getMyProfile,
  listMyApplications,
  listMyStartups,
  listPeople,
  listRecommendedStartups,
  unreadChats,
  type ApplicationOut,
} from "@/lib/api";
import { APP_STATUS, plural, timeAgo } from "@/lib/labels";
import { nextStep } from "@/lib/next-step";
import { getMe, serverClient } from "@/lib/server-api";
import { cn } from "@/lib/utils";

const STATUS_TONE: Record<string, string> = {
  pending: "bg-warn-soft text-warn-ink",
  accepted: "bg-success-soft text-success-ink",
  rejected: "bg-secondary text-muted-foreground",
  withdrawn: "bg-secondary text-muted-foreground",
};

/**
 * Главная для вошедшего (KAN-138 п.2, 7, 10): сразу видно самое важное — мои стартапы
 * и отклики, счётчики того, что ждёт ответа, и следующий шаг. Ниже — подбор стартапов.
 */
export async function Dashboard() {
  const user = (await getMe())!;
  const client = await serverClient();
  const [{ data: recs }, { data: profile }, { data: apps }, { data: mine }, { data: chats }] = await Promise.all([
    listRecommendedStartups({ client }),
    getMyProfile({ client }),
    listMyApplications({ client }),
    listMyStartups({ client }),
    unreadChats({ client }),
  ]);
  // Сообщники для тебя: ищут, с кем начать, и у них другая роль — дополнят, а не повторят.
  const { data: cof } = await listPeople({ client, query: { cofound: true, limit: 24 } });
  const myRole = profile?.primary_role?.slug;
  const partners = (cof?.items ?? []).filter((p) => p.slug !== profile?.slug && p.primary_role?.slug !== myRole).slice(0, 4);
  const name = profile?.display_name;
  const myStartups = mine ?? [];
  const myApps = apps ?? [];
  const step = nextStep({
    emailVerified: user.email_verified,
    applyBlockers: profile?.apply_blockers ?? [],
    pendingIncoming: myStartups.map((m) => ({ slug: m.slug, title: m.title, count: m.pending_applications })),
    applications: myApps.map((a) => ({ status: a.status, startupTitle: a.startup_title, decidedAt: a.decided_at ?? null })),
    hasStartups: myStartups.length > 0,
  });

  const incoming = myStartups.reduce((n, m) => n + m.pending_applications, 0);
  const invites = myApps.filter((a) => a.direction === "invite" && a.status === "pending").length;
  const waiting = myApps.filter((a) => a.direction === "apply" && a.status === "pending").length;
  const activeApps = myApps.filter((a) => a.status === "pending" || a.status === "accepted");
  const stats = [
    { href: "/me/startups", label: "Новые отклики", hint: "на мои стартапы", value: incoming, icon: InboxIcon },
    { href: "/me/applications", label: "Приглашения", hint: "от основателей", value: invites, icon: MailIcon },
    { href: "/me/applications", label: "Ждут ответа", hint: "мои отклики", value: waiting, icon: SendIcon },
    { href: "/chats", label: "Сообщения", hint: "непрочитанные диалоги", value: chats?.count ?? 0, icon: MessageCircleIcon },
  ];

  return (
    <Container>
      <div className="flex flex-wrap items-end gap-x-6 gap-y-4">
        <div className="min-w-0">
          <h1 className="text-[32px] leading-[1.05] sm:text-[48px]">{name ? `Привет, ${name}` : "Привет!"}</h1>
          <p className="mt-3 text-lg text-muted-foreground max-sm:hidden">Всё важное по твоим стартапам и откликам — здесь.</p>
        </div>
        <div className="grid w-full grid-cols-2 gap-2 sm:ml-auto sm:flex sm:w-auto">
          {/* Основателю с открытыми местами нужнее люди, остальным — проекты. */}
          {myStartups.some((m) => m.open_roles.length > 0) ? (
            <Link href={`/people?${myStartups.flatMap((m) => m.open_roles.map((r) => `role=${r.role.slug}`)).filter((v, i, a) => a.indexOf(v) === i).join("&")}`} className={buttonVariants({ variant: "outline" })}>
              <SearchIcon aria-hidden className="size-4" />
              Найти людей
            </Link>
          ) : (
            <Link href="/startups" className={buttonVariants({ variant: "outline" })}>
              <SearchIcon aria-hidden className="size-4" />
              Найти стартап
            </Link>
          )}
          <Link href="/startups/new" className={buttonVariants()}>
            <PlusIcon aria-hidden className="size-4" />
            Предложить идею
          </Link>
        </div>
      </div>

      <section
        aria-labelledby="next-step"
        className="mt-6 flex flex-col gap-3 rounded-[28px] bg-brand-soft px-5 py-5 sm:flex-row sm:items-center sm:gap-6 sm:px-6"
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

      {profile && profile.completeness < 80 && (
        <Link
          href="/me/profile"
          className="card-hover mt-3 flex flex-col gap-3 rounded-[28px] bg-tone px-5 py-5 hover:bg-tone-2 sm:flex-row sm:items-center sm:gap-6 sm:px-6"
        >
          <span className="min-w-0 flex-1">
            <span className="flex items-baseline gap-3">
              <span className="font-semibold">Профиль заполнен на {profile.completeness}%</span>
              {profile.missing[0] && <span className="text-sm text-muted-foreground max-sm:hidden">дальше: {profile.missing[0].toLowerCase()}</span>}
            </span>
            <span aria-hidden className="mt-2.5 block h-2 overflow-hidden rounded-full bg-white">
              <span className="block h-full rounded-full bg-brand" style={{ width: `${Math.max(profile.completeness, 3)}%` }} />
            </span>
          </span>
          <span className="inline-flex shrink-0 items-center gap-1.5 text-sm font-bold text-brand-ink">
            Дополнить профиль
            <ArrowRightIcon aria-hidden className="size-4" />
          </span>
        </Link>
      )}

      <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Panel title="Мои стартапы" href="/me/startups" more={myStartups.length > 0 ? "Управлять" : undefined}>
          {myStartups.length > 0 ? (
            <ul className="divide-y">
              {myStartups.slice(0, 5).map((m) => {
                const open = m.open_roles.reduce((n, r) => n + (r.slots ?? 1), 0);
                return (
                  <li key={m.id}>
                    <Link href={`/me/startups/${m.slug}`} className="group flex items-center gap-3 py-3">
                      <div className="min-w-0 flex-1">
                        <div className="truncate font-semibold group-hover:text-brand-ink">{m.title}</div>
                        <div className="mt-1 flex items-center gap-3 text-xs text-muted-foreground">
                          <SeatRow filled={m.team_size ?? 1} open={open} />
                          <span>
                            {m.views_30d ?? 0} {plural(m.views_30d ?? 0, "просмотр", "просмотра", "просмотров")} за 30 дней
                          </span>
                        </div>
                      </div>
                      {m.pending_applications > 0 ? (
                        <span className="shrink-0 rounded-full bg-brand px-2.5 py-1 text-xs font-semibold text-white">
                          +{m.pending_applications}{" "}
                          {plural(m.pending_applications, "отклик", "отклика", "откликов")}
                        </span>
                      ) : (
                        <ArrowRightIcon aria-hidden className="size-4 shrink-0 text-muted-foreground" />
                      )}
                    </Link>
                  </li>
                );
              })}
            </ul>
          ) : (
            <PanelEmpty
              text="Есть идея? Опиши её за пару минут — и люди начнут откликаться на роли в команде."
              href="/startups/new"
              cta="Предложить идею"
            />
          )}
        </Panel>

        <Panel title="Мои отклики" href="/me/applications" more={myApps.length > 0 ? "Все отклики" : undefined}>
          {activeApps.length > 0 ? (
            <ul className="divide-y">
              {activeApps.slice(0, 5).map((a) => (
                <AppRow key={a.id} app={a} />
              ))}
            </ul>
          ) : (
            <PanelEmpty
              text={myApps.length > 0 ? "Активных откликов нет. Посмотри, кому ты нужен сейчас." : "Откликнись на роль — основатели обычно отвечают в течение 72 часов."}
              href="/startups"
              cta="Найти стартап"
            />
          )}
        </Panel>
      </div>

      <ul aria-label="Что ждёт ответа" className="mt-4 grid grid-cols-4 gap-2 sm:gap-3">
        {stats.map((s) => (
          <li key={s.label}>
            <Link
              href={s.href}
              className={cn(
                "group flex h-full flex-col rounded-2xl bg-tone p-3 transition-colors duration-200 hover:bg-tone-2 sm:rounded-2xl sm:p-4",
                s.value > 0 && "bg-brand-soft hover:bg-marker",
              )}
            >
              <span className="flex items-center gap-2 text-xs leading-tight font-semibold sm:text-sm">
                <s.icon aria-hidden className={cn("size-4 max-sm:hidden", s.value > 0 ? "text-brand-ink" : "text-muted-foreground")} />
                {s.label}
              </span>
              <span className="mt-1 text-xl font-extrabold tracking-[-0.03em] tabular-nums sm:mt-3 sm:text-[32px]">{s.value}</span>
              <span className="mt-0.5 hidden text-xs text-muted-foreground sm:block">{s.hint}</span>
            </Link>
          </li>
        ))}
      </ul>


      {partners.length > 0 && (
        <section className="mt-12">
          <div className="flex flex-wrap items-end gap-2">
            <div>
              <h2 className="text-xl sm:text-2xl">Сообщники для тебя</h2>
              <p className="mt-1 text-muted-foreground">Хотят придумать стартап с нуля, и их навыки дополняют твои. Напиши первым.</p>
            </div>
            <Link href="/people/cofounders" className="ml-auto text-sm font-semibold text-brand-ink hover:underline">
              Все сообщники
            </Link>
          </div>
          <ul className="mt-6 grid grid-cols-1 gap-2 sm:grid-cols-2 sm:gap-3 lg:grid-cols-4">
            {partners.map((p) => (
              <PersonCard key={p.slug} person={p} as="li" />
            ))}
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
          <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
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

function Panel({ title, href, more, children }: { title: string; href: string; more?: string; children: React.ReactNode }) {
  return (
    <section className="flex flex-col rounded-[28px] bg-tone p-6">
      <div className="flex items-center gap-2">
        <h2 className="font-sans text-lg font-bold tracking-normal">{title}</h2>
        {more && (
          <Link href={href} className="ml-auto text-sm font-semibold text-brand-ink hover:underline">
            {more}
          </Link>
        )}
      </div>
      <div className="mt-2 flex flex-1 flex-col">{children}</div>
    </section>
  );
}

function PanelEmpty({ text, href, cta }: { text: string; href: string; cta: string }) {
  return (
    <div className="flex flex-1 flex-col items-start justify-center gap-3 py-4">
      <p className="text-sm text-muted-foreground">{text}</p>
      <Link href={href} className={buttonVariants({ variant: "outline", size: "sm" })}>
        {cta}
      </Link>
    </div>
  );
}

function AppRow({ app }: { app: ApplicationOut }) {
  const invite = app.direction === "invite";
  const status = invite && app.status === "pending" ? "Приглашение" : APP_STATUS[app.status];
  return (
    <li>
      <Link href="/me/applications" className="group flex items-center gap-3 py-3">
        <div className="min-w-0 flex-1">
          <div className="truncate font-semibold group-hover:text-brand-ink">{app.role_title}</div>
          <div className="truncate text-xs text-muted-foreground">
            {app.startup_title} · {timeAgo(app.decided_at ?? app.created_at)}
          </div>
        </div>
        <span
          className={cn(
            "shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold",
            invite && app.status === "pending" ? "bg-brand text-white" : STATUS_TONE[app.status],
          )}
        >
          {status}
        </span>
      </Link>
    </li>
  );
}
