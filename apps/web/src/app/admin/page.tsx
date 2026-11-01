import { ChevronDownIcon } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";

import { AdminAction, AdminDeleteUser } from "@/components/domain/admin-actions";
import { CatalogEditor, PlatformStartupForm } from "@/components/domain/admin-cold-start";
import { Container, PageHeader } from "@/components/domain/page-header";
import { adminActivity, adminAuditLog, adminFeedback, adminListReports, adminListStartups, adminListUsers, adminOverviewPage, listRoles, listSkills } from "@/lib/api";
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
type Params = { days?: string; q?: string; tab?: string; kind?: string; period?: string; status?: string };

const PERIODS = [
  ["", "За всё время"],
  ["1", "24 часа"],
  ["7", "7 дней"],
  ["30", "30 дней"],
] as const;

/** Ссылка на ту же вкладку с изменённым параметром (остальные фильтры сохраняются). */
function withParam(params: Params, tab: string, key: keyof Params, value: string) {
  const q = new URLSearchParams({ tab });
  for (const [k, v] of Object.entries(params)) if (v && k !== "tab" && k !== key) q.set(k, v);
  if (value) q.set(key, value);
  return `/admin?${q.toString()}`;
}

function Chip({ href, on, children }: { href: string; on: boolean; children: React.ReactNode }) {
  return (
    <Link href={href} aria-current={on ? "true" : undefined} className={cn("rounded-full px-3.5 py-1.5 text-sm font-semibold transition-colors", on ? "bg-second text-on-second" : "bg-tone hover:bg-tone-2")}>
      {children}
    </Link>
  );
}

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
                  <span className="mt-2 block">
                    <AdminDeleteUser kind="feedback" id={String(f.id)} name="это сообщение" />
                  </span>
                  {f.has_screenshot && (
                    <a href={`/api/admin/feedback/${f.id}/screenshot`} target="_blank" rel="noopener" className="mt-2 block w-fit overflow-hidden rounded-lg border">
                      {/* Скриншот отдаёт только API админки; next/image для приватного файла не нужен. */}
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={`/api/admin/feedback/${f.id}/screenshot`} alt="Скриншот к сообщению" className="max-h-56 max-w-full bg-tone object-contain" />
                    </a>
                  )}
                  <p className="mt-2 text-xs text-muted-foreground">
                    {timeAgo(f.created_at)} · {f.user_email ?? "гость или удалённый аккаунт"}
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
    const kind = (["real", "demo", "admins"] as const).find((k) => k === params.kind) ?? "all";
    const period = PERIODS.find(([v]) => v === params.period)?.[0] ?? "";
    const { data: users } = await adminListUsers({ client, query: { q: params.q, kind, ...(period ? { days: Number(period) } : {}) } });
    const filters = [
      ["all", "Все"],
      ["real", "Настоящие"],
      ["demo", "Демо"],
      ["admins", "Админы"],
    ] as const;
    return (
      <section className="mt-8 max-w-4xl">
        <div className="flex flex-wrap items-center gap-2">
          {filters.map(([k, label]) => (
            <Chip key={k} href={withParam(params, "users", "kind", k === "all" ? "" : k)} on={kind === k}>
              {label}
            </Chip>
          ))}
          <form className="ml-auto min-w-0">
            <input type="hidden" name="tab" value="users" />
            {kind !== "all" && <input type="hidden" name="kind" value={kind} />}
            {params.period && <input type="hidden" name="period" value={params.period} />}
            <input
              name="q"
              defaultValue={params.q}
              placeholder="Почта или имя"
              aria-label="Поиск пользователей"
              className="h-9 w-44 rounded-xl border border-[var(--field)] bg-white px-3 text-sm outline-none focus-visible:ring-3 focus-visible:ring-ring/25 sm:w-64"
            />
          </form>
        </div>
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <span className="text-sm text-muted-foreground">Регистрация:</span>
          {PERIODS.map(([v, label]) => (
            <Chip key={v} href={withParam(params, "users", "period", v)} on={period === v}>
              {label}
            </Chip>
          ))}
        </div>
        <p className="mt-3 text-sm text-muted-foreground">
          {users?.length ?? 0} {plural(users?.length ?? 0, "аккаунт", "аккаунта", "аккаунтов")}, новые сверху
        </p>
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
    const STATUSES = [
      ["all", "Все"],
      ["recruiting", "Идёт набор"],
      ["draft", "Черновики"],
      ["closed", "Набор закрыт"],
      ["archived", "В архиве"],
      ["hidden", "Скрыты"],
    ] as const;
    const status = STATUSES.find(([v]) => v === params.status)?.[0] ?? "all";
    const period = PERIODS.find(([v]) => v === params.period)?.[0] ?? "";
    const { data: startups } = await adminListStartups({
      client,
      query: { status, q: params.q, ...(period ? { days: Number(period) } : {}) },
    });
    return (
      <>
        <section className="mt-8 max-w-4xl">
          <div className="flex flex-wrap items-center gap-2">
            {STATUSES.map(([v, label]) => (
              <Chip key={v} href={withParam(params, "startups", "status", v === "all" ? "" : v)} on={status === v}>
                {label}
              </Chip>
            ))}
            <form className="ml-auto min-w-0">
              <input type="hidden" name="tab" value="startups" />
              {status !== "all" && <input type="hidden" name="status" value={status} />}
              {period && <input type="hidden" name="period" value={period} />}
              <input
                name="q"
                defaultValue={params.q}
                placeholder="Название или почта владельца"
                aria-label="Поиск стартапов"
                className="h-9 w-48 rounded-xl border border-[var(--field)] bg-white px-3 text-sm outline-none focus-visible:ring-3 focus-visible:ring-ring/25 sm:w-72"
              />
            </form>
          </div>
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <span className="text-sm text-muted-foreground">Созданы:</span>
            {PERIODS.map(([v, label]) => (
              <Chip key={v} href={withParam(params, "startups", "period", v)} on={period === v}>
                {label}
              </Chip>
            ))}
          </div>
          <p className="mt-3 text-sm text-muted-foreground">{startups?.length ?? 0} {plural(startups?.length ?? 0, "стартап", "стартапа", "стартапов")}, новые сверху</p>
          <div className="mt-2 divide-y rounded-xl border bg-card">
            {startups?.map((s) => (
              <div key={s.id} className="flex items-center gap-3 p-3 text-sm">
                <div className="min-w-0">
                  <Link href={`/startups/${s.slug}`} className="truncate font-semibold hover:underline">
                    {s.title}
                  </Link>
                  <div className="truncate text-muted-foreground">
                    {STARTUP_STATUS[s.status]} · {s.owner_email} · {timeAgo(s.created_at)}
                    {s.is_hidden && " · скрыт"}
                  </div>
                </div>
                <span className="ml-auto flex shrink-0 gap-2">
                  {s.is_hidden ? <AdminAction kind="unhide" id={s.id} label="Вернуть" /> : <AdminAction kind="hide" id={s.id} label="Скрыть" variant="outline" />}
                  <AdminDeleteUser kind="startup" id={s.id} name={s.title} />
                </span>
              </div>
            ))}
          </div>
        </section>
        <section className="mt-10 max-w-3xl rounded-2xl border bg-card p-6">
          <h2 className="font-sans text-base font-bold">Перенести стартап на платформу</h2>
          <p className="mt-1 mb-4 text-sm text-muted-foreground">
            Для холодного старта: оформить открытый проект за основателя. Здесь — только основа (название, суть, почта основателя); после
            «Создать черновик» откроется полный редактор стартапа: описание, стадия, условия, обложка и места в команде. Черновик принадлежит
            платформе, пока основатель не зарегистрируется с этой почтой.
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
  // Сервер не знает пояс админа: показываем московское время явно.
  const fmt = new Intl.DateTimeFormat("ru-RU", { timeZone: "Europe/Moscow", day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit", second: "2-digit" });
  return (
    <section className="mt-8 overflow-x-auto rounded-xl border bg-card" tabIndex={0} role="region" aria-label="Журнал действий админов">
      <table className="w-full min-w-[720px] text-sm">
        <thead className="border-b bg-tone text-left text-xs text-muted-foreground">
          <tr>
            <th className="px-4 py-2.5 font-semibold">Дата и время, МСК</th>
            <th className="px-4 py-2.5 font-semibold">Админ</th>
            <th className="px-4 py-2.5 font-semibold">Действие</th>
            <th className="px-4 py-2.5 font-semibold">Объект</th>
          </tr>
        </thead>
        <tbody className="divide-y">
          {audit?.length ? (
            audit.map((a) => (
              <tr key={a.id} className="align-top">
                <td className="px-4 py-2.5 whitespace-nowrap text-muted-foreground tabular-nums">{fmt.format(new Date(a.created_at))}</td>
                <td className="px-4 py-2.5 whitespace-nowrap">{a.admin_email ?? "удалённый админ"}</td>
                <td className="px-4 py-2.5 font-semibold">{a.label || a.action}</td>
                <td className="px-4 py-2.5">
                  {a.target_href ? (
                    <Link href={a.target_href} className="font-semibold text-brand-ink hover:underline">
                      {a.target_label}
                    </Link>
                  ) : (
                    <span className="text-muted-foreground">{a.target_label}</span>
                  )}
                </td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan={4} className="px-4 py-3 text-muted-foreground">
                Пока пусто
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </section>
  );
}

/** Обзор: простая аналитика по настоящим пользователям (без демо и тестовых аккаунтов). */
async function Overview({ days }: { days: number }) {
  const period = [7, 14, 30].includes(days) ? days : 14;
  const client = await serverClient();
  const [{ data }, { data: activity }] = await Promise.all([
    adminOverviewPage({ client, query: { days: period } }),
    adminActivity({ client, query: { limit: 30 } }),
  ]);
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
      <section className="rounded-2xl border bg-card p-5">
        <h2 className="font-sans text-base font-bold">Последние события</h2>
        <p className="mt-1 text-xs text-muted-foreground">
          Ключевые шаги людей: регистрация, подтверждение почты, публикация, отклики. Технические ошибки (коды 4xx/5xx) — в логах сервера.
        </p>
        <ul className="mt-3 divide-y text-sm">
          {activity?.length ? (
            activity.map((e, i) => (
              <li key={i} className="flex flex-wrap items-baseline gap-x-3 gap-y-0.5 py-2">
                <span className={cn("rounded-full px-2 py-0.5 text-xs font-bold", e.name === "signup" ? "bg-brand-soft text-brand-ink" : "bg-success-soft text-success-ink")}>{e.label}</span>
                <span className="truncate">{e.user_email ?? "без аккаунта"}</span>
                <span className="ml-auto text-xs text-muted-foreground tabular-nums">{timeAgo(e.created_at)}</span>
              </li>
            ))
          ) : (
            <li className="py-2 text-muted-foreground">Событий пока нет</li>
          )}
        </ul>
      </section>
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
