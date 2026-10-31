import { ArrowRightIcon, InboxIcon, MailIcon, MessageCircleIcon, PlusIcon, SearchIcon, SendIcon } from "lucide-react";
import Link from "next/link";

import { Container, EmptyState } from "@/components/domain/page-header";
import { SeatRow } from "@/components/domain/seats";
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
import { APP_STATUS, initials, plural, timeAgo } from "@/lib/labels";
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
  const partners = (cof?.items ?? []).filter((p) => p.slug !== profile?.slug && p.primary_role?.slug !== myRole).slice(0, 2);
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

  // Кого позвать: люди под открытые роли моих стартапов. Закрывает пустую половину ряда, когда у
  // основателя нет своих откликов, и даёт следующее действие прямо отсюда.
  const openRoleSlugs = [...new Set(myStartups.flatMap((m) => m.open_roles.map((r) => r.role.slug)))];
  const { data: fit } =
    openRoleSlugs.length > 0 ? await listPeople({ client, query: { role: openRoleSlugs, limit: 8 } }) : { data: undefined };
  const candidates = (fit?.items ?? []).filter((p) => p.slug !== profile?.slug).slice(0, 4);

  const firstName = name?.split(/\s+/)[0];
  const waitingTotal = stats.reduce((n, x) => n + x.value, 0);
  const findPeople = myStartups.some((m) => m.open_roles.length > 0);

  return (
    <Container>
      <div className="flex flex-wrap items-end gap-x-6 gap-y-5">
        <div className="min-w-0">
          <h1 className="text-[32px] leading-[1.05] sm:text-[48px]">{firstName ? `Привет, ${firstName}` : "Привет!"}</h1>
          <p className="mt-2 text-muted-foreground sm:mt-3 sm:text-lg">Отклики, приглашения и стартапы под твою роль.</p>
        </div>
        <div className="grid w-full grid-cols-2 gap-2 sm:ml-auto sm:flex sm:w-auto">
          {/* Основателю с открытыми местами нужнее люди, остальным — проекты. */}
          {findPeople ? (
            <Link href={`/people?${myStartups.flatMap((m) => m.open_roles.map((r) => `role=${r.role.slug}`)).filter((v, i, a) => a.indexOf(v) === i).join("&")}`} className={buttonVariants()}>
              <SearchIcon aria-hidden className="size-4" />
              Найти людей
            </Link>
          ) : (
            <Link href="/startups" className={buttonVariants()}>
              <SearchIcon aria-hidden className="size-4" />
              Найти стартап
            </Link>
          )}
          <Link href="/startups/new" className={buttonVariants({ variant: "outline" })}>
            <PlusIcon aria-hidden className="size-4" />
            Своя идея
          </Link>
        </div>
      </div>

      <section aria-labelledby="next-step" className="mt-8 flex flex-col gap-4 rounded-[24px] bg-brand-soft p-5 sm:flex-row sm:items-center sm:gap-6 sm:px-6">
        <div className="min-w-0">
          <h2 id="next-step" className="font-sans text-lg font-bold tracking-normal">
            {step.title}
          </h2>
          <p className="mt-1 text-muted-foreground">{step.text}</p>
        </div>
        <Link href={step.href} className={buttonVariants({ variant: "brand", className: "shrink-0 sm:ml-auto" })}>
          {step.cta}
        </Link>
      </section>

      {profile && profile.completeness < 80 && (
        <Link href="/me/profile" className="card-hover mt-3 flex items-center gap-4 rounded-[24px] bg-tone p-5 hover:bg-tone-2 sm:px-6">
          <span className="min-w-0 flex-1">
            <span className="flex items-baseline justify-between gap-3">
              <span className="font-semibold">Профиль заполнен на {profile.completeness}%</span>
              {profile.missing[0] && <span className="truncate text-sm text-muted-foreground max-sm:hidden">дальше: {profile.missing[0].toLowerCase()}</span>}
            </span>
            <span aria-hidden className="mt-3 block h-2 overflow-hidden rounded-full bg-white">
              <span className="block h-full rounded-full bg-brand" style={{ width: `${Math.max(profile.completeness, 3)}%` }} />
            </span>
          </span>
          <ArrowRightIcon aria-hidden className="size-5 shrink-0 text-brand-ink" />
        </Link>
      )}

      {/* Счётчики показываем, только когда что-то ждёт ответа: ряд нулей у новичка — шум. */}
      {waitingTotal > 0 && (
        <ul aria-label="Что ждёт ответа" className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4 sm:gap-3">
          {stats.map((st) => (
            <li key={st.label}>
              <Link
                href={st.href}
                className={cn(
                  "flex h-full items-center justify-between gap-3 rounded-2xl bg-tone p-4 transition-colors duration-200 hover:bg-tone-2 sm:flex-col sm:items-start sm:justify-start",
                  st.value > 0 && "bg-brand-soft hover:bg-marker",
                )}
              >
                <span className="flex items-center gap-2 text-sm leading-tight font-semibold">
                  <st.icon aria-hidden className={cn("size-4 max-sm:hidden", st.value > 0 ? "text-brand-ink" : "text-muted-foreground")} />
                  {st.label}
                </span>
                <span className="text-2xl font-extrabold tracking-[-0.03em] tabular-nums sm:text-[32px]">{st.value}</span>
              </Link>
            </li>
          ))}
        </ul>
      )}

      {/* Панели — только когда в них есть что показать; пустые подсказки уже в карточке следующего шага. */}
      {(myStartups.length > 0 || activeApps.length > 0) && (
        <div className="mt-8 grid grid-cols-1 gap-3 lg:grid-cols-2">
          {myStartups.length > 0 && (
            <Panel title="Мои стартапы" href="/me/startups" more="Управлять">
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
                            +{m.pending_applications} {plural(m.pending_applications, "отклик", "отклика", "откликов")}
                          </span>
                        ) : (
                          <ArrowRightIcon aria-hidden className="size-4 shrink-0 text-muted-foreground" />
                        )}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </Panel>
          )}
          {activeApps.length === 0 && candidates.length > 0 && (
            <Panel title="Кого позвать в команду" href={`/people?${openRoleSlugs.map((r) => `role=${r}`).join("&")}`} more="Все">
              <ul className="divide-y">
                {candidates.map((p) => (
                  <li key={p.slug}>
                    <Link href={`/people/${p.slug}`} className="group flex items-center gap-3 py-3">
                      {p.avatar_url ? (
                        // eslint-disable-next-line @next/next/no-img-element -- аватары уже пережаты api в WebP
                        <img src={p.avatar_url} alt="" className="size-10 shrink-0 rounded-xl object-cover" />
                      ) : (
                        <span aria-hidden className="grid size-10 shrink-0 place-items-center rounded-xl bg-brand-soft text-sm font-bold text-brand-ink">
                          {initials(p.display_name)}
                        </span>
                      )}
                      <span className="min-w-0 flex-1">
                        <span className="block truncate font-semibold group-hover:text-brand-ink">{p.primary_role?.name ?? p.display_name}</span>
                        <span className="block truncate text-xs text-muted-foreground">
                          {p.display_name}
                          {p.city ? ` · ${p.city}` : ""}
                        </span>
                      </span>
                      <ArrowRightIcon aria-hidden className="size-4 shrink-0 text-muted-foreground" />
                    </Link>
                  </li>
                ))}
              </ul>
            </Panel>
          )}
          {activeApps.length > 0 && (
            <Panel title="Мои отклики" href="/me/applications" more="Все отклики">
              <ul className="divide-y">
                {activeApps.slice(0, 5).map((a) => (
                  <AppRow key={a.id} app={a} />
                ))}
              </ul>
            </Panel>
          )}
        </div>
      )}

      <section className="mt-12 sm:mt-16">
        <SectionHead title="Подходят тебе" text="Стартапы под твою роль, навыки и условия." href="/startups" more="Все стартапы" />
        {recs && recs.length > 0 ? (
          <div className="mt-5 grid grid-cols-1 gap-3 sm:mt-6 sm:grid-cols-2 lg:grid-cols-3">
            {recs.map((r) => (
              <StartupCard key={r.startup.id} startup={r.startup} reasons={r.reasons} />
            ))}
          </div>
        ) : (
          <div className="mt-5 sm:mt-6">
            <EmptyState
              sticker="check"
              title="Пока нечего предложить"
              text="Укажи роль и навыки в профиле, и здесь появятся стартапы, которым ты нужен."
              action={
                <Link href="/me/profile" className={buttonVariants({ variant: "brand" })}>
                  Заполнить профиль
                </Link>
              }
            />
          </div>
        )}
      </section>

      {partners.length > 0 && (
        <section className="mt-12 sm:mt-16">
          <SectionHead title="Сообщники для тебя" text="Хотят придумать проект с нуля, и их навыки дополняют твои." href="/people?cofound=1" more="Все" />
          <ul className="mt-5 grid gap-2 sm:mt-6 sm:grid-cols-2 sm:gap-3">
            {partners.map((p) => (
              <li key={p.slug}>
                <Link href={`/people/${p.slug}`} className="card-hover flex items-center gap-4 rounded-[24px] bg-tone p-3 pr-5 hover:bg-tone-2">
                  {p.avatar_url ? (
                    // eslint-disable-next-line @next/next/no-img-element -- аватары уже пережаты api в WebP
                    <img src={p.avatar_url} alt="" loading="lazy" className="size-16 shrink-0 rounded-2xl object-cover" />
                  ) : (
                    <span aria-hidden className="grid size-16 shrink-0 place-items-center rounded-2xl bg-brand-soft text-lg font-extrabold text-brand-ink">
                      {initials(p.display_name)}
                    </span>
                  )}
                  <span className="min-w-0 flex-1">
                    <b className="block truncate text-base font-bold text-brand-ink">{p.primary_role?.name ?? p.display_name}</b>
                    <span className="block truncate text-sm">
                      {p.display_name}
                      {p.city && <span className="text-muted-foreground"> · {p.city}</span>}
                    </span>
                    {p.headline && <span className="mt-0.5 block truncate text-sm text-muted-foreground">{p.headline}</span>}
                  </span>
                  <ArrowRightIcon aria-hidden className="size-4 shrink-0 text-muted-foreground" />
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}
    </Container>
  );
}

function SectionHead({ title, text, href, more }: { title: string; text: string; href: string; more: string }) {
  return (
    <div className="flex items-end justify-between gap-4">
      <div className="min-w-0">
        <h2 className="text-2xl sm:text-[32px]">{title}</h2>
        <p className="mt-1.5 text-muted-foreground">{text}</p>
      </div>
      <Link href={href} className="shrink-0 pb-0.5 text-sm font-semibold text-brand-ink hover:text-brand-hover">
        {more}
      </Link>
    </div>
  );
}

function Panel({ title, href, more, children }: { title: string; href: string; more?: string; children: React.ReactNode }) {
  return (
    <section className="flex flex-col rounded-[24px] bg-tone p-5 sm:p-6">
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
