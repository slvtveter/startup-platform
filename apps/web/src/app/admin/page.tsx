import { ChevronDownIcon } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";

import { AdminAction, AdminDeleteUser } from "@/components/domain/admin-actions";
import { CatalogEditor, PlatformStartupForm } from "@/components/domain/admin-cold-start";
import { Container, PageHeader } from "@/components/domain/page-header";
import { adminAuditLog, adminFeedback, adminListReports, adminListStartups, adminListUsers, adminOverviewPage, listRoles, listSkills } from "@/lib/api";
import { STARTUP_STATUS, plural, timeAgo } from "@/lib/labels";
import { requireMe, serverClient } from "@/lib/server-api";
import { cn } from "@/lib/utils";

export const metadata = { title: "Админка", robots: { index: false } };

const TABS = [
  ["overview", "Обзор"],
  ["moderation", "Модерация"],
  ["users", "Пользователи"],
  ["startups", "Стартапы"],
  ["catalog", "Справочники"],
  ["audit", "Журнал"],
] as const;
type Tab = (typeof TABS)[number][0];
type Params = { days?: string; q?: string; tab?: string; kind?: string };

/**
 * Админка на вкладках (?tab=). Каждая вкладка грузит только свои данные, а пока они идут —
 * скелетон (Suspense с ключом по параметрам: при смене вкладки он показывается сразу).
 * Права — только is_admin (docs/admin.md).
 */
export default async function AdminPage({ searchParams }: { searchParams: Promise<Params> }) {
  const user = await requireMe("/admin");
  if (!user.is_admin) notFound();
  const params = await searchParams;
  const tab: Tab = (TABS.find(([t]) => t === params.tab)?.[0] ?? (params.q ? "users" : "overview")) as Tab;

  return (
    <Container className="ym-hide-content">
      <PageHeader title="Админка" />
      <nav aria-label="Разделы админки" className="-mx-4 mt-6 flex gap-1 overflow-x-auto border-b px-4 [scrollbar-width:none] sm:mx-0 sm:px-0">
        {TABS.map(([t, label]) => (
          <Link
            key={t}
            href={t === "overview" ? "/admin" : `/admin?tab=${t}`}
            aria-current={tab === t ? "page" : undefined}
            className={cn(
              "-mb-px inline-flex h-11 shrink-0 items-center gap-2 border-b-2 px-3 text-sm font-semibold whitespace-nowrap transition-colors",
              tab === t ? "border-brand text-foreground" : "border-transparent text-muted-foreground hover:text-foreground",
            )}
          >
            {label}
          </Link>
        ))}
      </nav>
      <Suspense key={JSON.stringify({ ...params, tab })} fallback={<TabSkeleton />}>
        <TabBody tab={tab} params={params} />
      </Suspense>
    </Container>
  );
}

function TabSkeleton() {
  return (
    <div aria-busy="true" aria-label="Загрузка" className="mt-8 grid animate-pulse gap-3">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {Array.from({ length: 8 }, (_, i) => (
          <div key={i} className="h-24 rounded-2xl bg-tone" />
        ))}
      </div>
      <div className="h-56 rounded-2xl bg-tone" />
      <div className="h-40 rounded-2xl bg-tone" />
    </div>
  );
}

async function TabBody({ tab, params }: { tab: Tab; params: Params }) {
  const client = await serverClient();
  if (tab === "overview") return <Overview days={Number(params.days) || 14} />;
  if (tab === "moderation") {
    const [{ data: reports }, { data: feedback }] = await Promise.all([adminListReports({ client }), adminFeedback({ client })]);
    return (
      <>
        <section className="mt-8">
          <h2 className="text-xl">Жалобы</h2>
          <div className="mt-3 grid gap-2">
            {reports?.length ? (
              reports.map((r) => (
                <div key={r.id} className="flex flex-wrap items-center gap-3 rounded-xl border bg-card p-4 text-sm">
                  <Link href={`/${r.target_type === "startup" ? "startups" : "people"}/${r.target_id}`} className="font-bold underline">
                    {r.target_type}: {r.target_id}
                  </Link>
                  <span>{r.reason}</span>
                  {r.comment && <span className="text-muted-foreground">«{r.comment}»</span>}
                  <span className="ml-auto flex gap-2">
                    <AdminAction kind="resolve" id={String(r.id)} label="Решено" />
                    <AdminAction kind="dismiss" id={String(r.id)} label="Отклонить" variant="ghost" />
                  </span>
                </div>
              ))
            ) : (
              <p className="text-sm text-muted-foreground">Новых жалоб нет.</p>
            )}
          </div>
        </section>
        <section className="mt-10">
          <h2 className="text-xl">Обратная связь</h2>
          <p className="mt-1 text-sm text-muted-foreground">Сообщения из формы «Сообщить о проблеме или идее» в подвале сайта.</p>
          <ul className="mt-3 grid gap-2">
            {feedback?.length ? (
              feedback.map((f) => (
                <li key={f.id} className="rounded-xl border bg-card p-4 text-sm">
                  <p className="whitespace-pre-line wrap-anywhere">{f.text}</p>
                  <p className="mt-2 text-xs text-muted-foreground">
                    {timeAgo(f.created_at)} · {f.user_email ?? "гость"}
                    {f.page_url && (
                      <>
                        {" · "}
                        <Link href={f.page_url} className="underline">
                          {f.page_url}
                        </Link>
                      </>
                    )}
                  </p>
                </li>
              ))
            ) : (
              <li className="text-sm text-muted-foreground">Сообщений пока нет.</li>
            )}
          </ul>
        </section>
      </>
    );
  }
  if (tab === "users") {
    const kind = (["real", "demo"] as const).find((k) => k === params.kind) ?? "all";
    const { data: users } = await adminListUsers({ client, query: { q: params.q, kind } });
    const filters = [
      ["all", "Все"],
      ["real", "Настоящие"],
      ["demo", "Демо"],
    ] as const;
    return (
      <section className="mt-8 max-w-4xl">
        <div className="flex flex-wrap items-center gap-2">
          {filters.map(([k, label]) => (
            <Link
              key={k}
              href={`/admin?tab=users${k === "all" ? "" : `&kind=${k}`}${params.q ? `&q=${encodeURIComponent(params.q)}` : ""}`}
              aria-current={kind === k ? "true" : undefined}
              className={cn("rounded-full px-3.5 py-1.5 text-sm font-semibold transition-colors", kind === k ? "bg-second text-on-second" : "bg-tone hover:bg-tone-2")}
            >
              {label}
            </Link>
          ))}
          <form className="ml-auto min-w-0">
            <input type="hidden" name="tab" value="users" />
            {kind !== "all" && <input type="hidden" name="kind" value={kind} />}
            <input
              name="q"
              defaultValue={params.q}
              placeholder="Почта или имя"
              aria-label="Поиск пользователей"
              className="h-9 w-44 rounded-xl border border-[var(--field)] bg-white px-3 text-sm outline-none focus-visible:ring-3 focus-visible:ring-ring/25 sm:w-64"
            />
          </form>
        </div>
        <p className="mt-3 text-sm text-muted-foreground">{users?.length ?? 0} {plural(users?.length ?? 0, "аккаунт", "аккаунта", "аккаунтов")}</p>
        <div className="mt-2 divide-y rounded-xl border bg-card">
          {users?.map((u) => (
            <div key={u.id} className="flex flex-wrap items-center gap-3 p-3 text-sm">
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-1.5">
                  <span className="truncate font-semibold">{u.display_name || u.email}</span>
                  {u.is_demo && <Badge tone="tone">демо</Badge>}
                  {u.is_admin && <Badge tone="brand">админ</Badge>}
                  {!u.is_active && <Badge tone="danger">заблокирован</Badge>}
                  {u.is_published && <Badge tone="success">в каталоге</Badge>}
                </div>
                <div className="truncate text-muted-foreground">
                  {u.email}
                  {u.role ? ` · ${u.role}` : ""} · {timeAgo(u.created_at)}
                  {!u.email_verified && " · почта не подтверждена"}
                </div>
              </div>
              {!u.is_admin && (
                <span className="flex shrink-0 gap-2">
                  {u.is_active ? (
                    <AdminAction kind="block" id={u.id} label="Заблокировать" variant="outline" />
                  ) : (
                    <AdminAction kind="unblock" id={u.id} label="Разблокировать" />
                  )}
                  <AdminDeleteUser id={u.id} name={u.display_name || u.email} />
                </span>
              )}
            </div>
          ))}
        </div>
      </section>
    );
  }
  if (tab === "startups") {
    const { data: startups } = await adminListStartups({ client });
    return (
      <>
        <section className="mt-8 max-w-3xl">
          <h2 className="text-xl">Стартапы</h2>
          <div className="mt-3 divide-y rounded-xl border bg-card">
            {startups?.map((s) => (
              <div key={s.id} className="flex items-center gap-3 p-3 text-sm">
                <div className="min-w-0">
                  <Link href={`/startups/${s.slug}`} className="truncate font-semibold hover:underline">
                    {s.title}
                  </Link>
                  <div className="truncate text-muted-foreground">
                    {STARTUP_STATUS[s.status]} · {s.owner_email}
                    {s.is_hidden && " · скрыт"}
                  </div>
                </div>
                <span className="ml-auto shrink-0">
                  {s.is_hidden ? <AdminAction kind="unhide" id={s.id} label="Вернуть" /> : <AdminAction kind="hide" id={s.id} label="Скрыть" variant="destructive" />}
                </span>
              </div>
            ))}
          </div>
        </section>
        <section className="mt-10 max-w-3xl rounded-2xl border bg-card p-6">
          <h2 className="font-sans text-base font-bold">Перенести стартап на платформу</h2>
          <p className="mt-1 mb-4 text-sm text-muted-foreground">
            Для холодного старта: оформить открытый проект за основателя. Черновик принадлежит платформе, пока основатель не зарегистрируется и не подтвердит почту.
          </p>
          <PlatformStartupForm />
        </section>
      </>
    );
  }
  if (tab === "catalog") {
    const [{ data: roles }, { data: skills }] = await Promise.all([listRoles({ client }), listSkills({ client })]);
    return (
      <section className="mt-8 grid grid-cols-1 items-start gap-4 lg:grid-cols-2">
        {(
          [
            ["roles", "Роли", roles],
            ["skills", "Навыки", skills],
          ] as const
        ).map(([kind, title, items]) => (
          <details key={kind} open className="group rounded-2xl border bg-card p-6">
            <summary className="flex cursor-pointer list-none items-center gap-2 font-sans text-base font-bold">
              {title}
              <span className="font-normal text-muted-foreground">{items?.length ?? 0}</span>
              <ChevronDownIcon className="ml-auto size-4 transition-transform group-open:rotate-180" aria-hidden />
            </summary>
            <div className="mt-4">
              <CatalogEditor kind={kind} items={items ?? []} />
            </div>
          </details>
        ))}
      </section>
    );
  }
  const { data: audit } = await adminAuditLog({ client });
  return (
    <section className="mt-8">
      <ul className="grid gap-1 text-sm text-muted-foreground">
        {audit?.length ? (
          audit.slice(0, 50).map((a) => (
            <li key={a.id}>
              {timeAgo(a.created_at)} · {a.admin_email} · {a.action} · {a.target_type} {a.target_id.slice(0, 8)}
            </li>
          ))
        ) : (
          <li>Пока пусто</li>
        )}
      </ul>
    </section>
  );
}

/** Обзор: простая аналитика по настоящим пользователям (без демо и тестовых аккаунтов). */
async function Overview({ days }: { days: number }) {
  const period = [7, 14, 30].includes(days) ? days : 14;
  const { data } = await adminOverviewPage({ client: await serverClient(), query: { days: period } });
  if (!data) return null;
  const t = data.totals;
  const tiles: [string, number, string | null][] = [
    ["Пользователей", t.users, `+${t.users_new} за ${period} дн.`],
    ["Заходили за 7 дней", t.active_7d, null],
    ["Профилей в каталоге", t.profiles_published, null],
    ["Стартапов набирают", t.startups_recruiting, null],
    ["Откликов", t.applications_new, `${t.applications_pending} ждут ответа`],
    ["Сообщений", t.messages_new, `за ${period} дн.`],
    ["Новых жалоб", t.reports_open, null],
    ["Обратная связь", t.feedback_new, `за ${period} дн.`],
  ];
  const top = Math.max(1, ...data.signups.map((d) => d.count));
  return (
    <div className="mt-8 grid gap-4">
      <div className="flex flex-wrap items-center gap-2 text-sm">
        <span className="text-muted-foreground">Период:</span>
        {[7, 14, 30].map((d) => (
          <Link
            key={d}
            href={d === 14 ? "/admin" : `/admin?days=${d}`}
            className={cn("rounded-full px-3 py-1 font-semibold", d === period ? "bg-second text-on-second" : "bg-tone hover:bg-tone-2")}
          >
            {d} дней
          </Link>
        ))}
        <span className="ml-auto text-xs text-muted-foreground">Без демо-аккаунтов ({t.demo_users}) и тестовых</span>
      </div>
      <ul className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {tiles.map(([label, value, hint]) => (
          <li key={label} className="rounded-2xl border bg-card p-4">
            <div className="text-sm text-muted-foreground">{label}</div>
            <div className="mt-1 text-[28px] leading-none font-extrabold tabular-nums">{value}</div>
            {hint && <div className="mt-1.5 text-xs text-muted-foreground">{hint}</div>}
          </li>
        ))}
      </ul>
      <div className="grid gap-4 lg:grid-cols-[1.5fr_1fr]">
        <section className="rounded-2xl border bg-card p-5">
          <h2 className="font-sans text-base font-bold">Регистрации по дням</h2>
          <div className="mt-4 flex h-40 items-end gap-1" role="img" aria-label={`Регистрации за ${period} дней: всего ${t.users_new}`}>
            {data.signups.map((d) => (
              <div key={d.day} className="group relative flex h-full flex-1 flex-col justify-end">
                <div className={cn("rounded-t-md", d.count ? "bg-brand" : "bg-tone")} style={{ height: `${Math.max((d.count / top) * 100, 3)}%` }} />
                <span className="pointer-events-none absolute -top-6 left-1/2 hidden -translate-x-1/2 rounded bg-foreground px-1.5 py-0.5 text-xs whitespace-nowrap text-white group-hover:block">
                  {new Date(d.day).toLocaleDateString("ru-RU", { day: "numeric", month: "short" })}: {d.count}
                </span>
              </div>
            ))}
          </div>
          <div className="mt-2 flex justify-between text-xs text-muted-foreground">
            <span>{new Date(data.signups[0]?.day).toLocaleDateString("ru-RU", { day: "numeric", month: "short" })}</span>
            <span>сегодня</span>
          </div>
        </section>
        <section className="rounded-2xl border bg-card p-5">
          <div className="flex items-center">
            <h2 className="font-sans text-base font-bold">Новые пользователи</h2>
            <Link href="/admin?tab=users&kind=real" className="ml-auto text-sm font-semibold text-brand-ink hover:underline">
              Все
            </Link>
          </div>
          <ul className="mt-3 divide-y text-sm">
            {data.recent.map((u) => (
              <li key={u.id} className="py-2.5">
                <div className="truncate font-semibold">{u.display_name || u.email}</div>
                <div className="truncate text-xs text-muted-foreground">
                  {u.role ?? "роль не указана"}
                  {u.is_published ? " · в каталоге" : ""} · {timeAgo(u.created_at)}
                </div>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </div>
  );
}

function Badge({ tone, children }: { tone: "tone" | "brand" | "danger" | "success"; children: React.ReactNode }) {
  const cls = {
    tone: "bg-tone text-muted-foreground",
    brand: "bg-brand-soft text-brand-ink",
    danger: "bg-destructive/10 text-destructive",
    success: "bg-success-soft text-success-ink",
  }[tone];
  return <span className={cn("rounded-full px-2 py-0.5 text-xs font-bold", cls)}>{children}</span>;
}
