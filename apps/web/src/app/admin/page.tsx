import Link from "next/link";
import { notFound } from "next/navigation";

import { AdminAction } from "@/components/domain/admin-actions";
import { Container, PageHeader } from "@/components/domain/page-header";
import { adminAuditLog, adminListReports, adminListStartups, adminListUsers, adminMetrics } from "@/lib/api";
import { STARTUP_STATUS, timeAgo } from "@/lib/labels";
import { requireMe, serverClient } from "@/lib/server-api";

export const metadata = { title: "Админка", robots: { index: false } };

export default async function AdminPage({ searchParams }: { searchParams: Promise<{ days?: string; q?: string }> }) {
  const user = await requireMe("/admin");
  if (!user.is_admin) notFound();
  const { days = "7", q } = await searchParams;
  const client = await serverClient();
  const [{ data: m }, { data: users }, { data: startups }, { data: reports }, { data: audit }] = await Promise.all([
    adminMetrics({ client, query: { days: Number(days) } }),
    adminListUsers({ client, query: { q } }),
    adminListStartups({ client }),
    adminListReports({ client }),
    adminAuditLog({ client }),
  ]);
  const top = Math.max(1, ...(m?.funnel.map((f) => f.count) ?? [1]));

  return (
    <Container>
      <PageHeader
        title="Админка"
        actions={
          <div className="flex gap-1 rounded-lg border bg-card p-1 text-sm font-semibold">
            {["7", "30", "90"].map((d) => (
              <Link key={d} href={`/admin?days=${d}`} className={`rounded-md px-3 py-1.5 ${d === days ? "bg-foreground text-background" : ""}`}>
                {d} дней
              </Link>
            ))}
          </div>
        }
      />

      <section className="mt-8 grid gap-4 lg:grid-cols-[1.4fr_1fr]">
        <div className="rounded-2xl border bg-card p-6">
          <h2 className="font-extrabold">Воронка за {m?.days} дней</h2>
          <ol className="mt-4 grid gap-3">
            {m?.funnel.map((f) => (
              <li key={f.name}>
                <div className="flex text-sm">
                  <span>{f.label}</span>
                  <span className="ml-auto font-bold tabular-nums">{f.count}</span>
                </div>
                <div className="mt-1 h-2 rounded-full bg-secondary">
                  <div className="h-full rounded-full bg-brand" style={{ width: `${(f.count / top) * 100}%` }} />
                </div>
              </li>
            ))}
          </ol>
        </div>
        <div className="grid gap-4">
          <div className="rounded-2xl border bg-card p-6">
            <div className="text-sm text-muted-foreground">Ответ на отклик за 72 часа</div>
            <div className="mt-1 text-4xl font-extrabold">{m?.answered_72h_share == null ? "—" : `${Math.round(m.answered_72h_share * 100)}%`}</div>
            <div className="mt-4 text-sm text-muted-foreground">Активных стартапов</div>
            <div className="mt-1 text-4xl font-extrabold">{m?.active_startups ?? 0}</div>
          </div>
          <div className="rounded-2xl border bg-card p-6">
            <div className="font-extrabold">Источники регистраций</div>
            <ul className="mt-3 grid gap-1 text-sm">
              {m?.sources.length ? (
                m.sources.map((s) => (
                  <li key={s.source} className="flex">
                    <span>{s.source}</span>
                    <span className="ml-auto font-bold tabular-nums">{s.signups}</span>
                  </li>
                ))
              ) : (
                <li className="text-muted-foreground">Пока нет данных</li>
              )}
            </ul>
          </div>
        </div>
      </section>

      <section className="mt-10">
        <h2 className="text-xl font-extrabold">Жалобы</h2>
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

      <section className="mt-10 grid gap-8 lg:grid-cols-2">
        <div>
          <div className="flex items-center gap-3">
            <h2 className="text-xl font-extrabold">Пользователи</h2>
            <form className="ml-auto">
              <input name="q" defaultValue={q} placeholder="Поиск" className="h-9 rounded-lg border bg-card px-3 text-sm" />
            </form>
          </div>
          <div className="mt-3 divide-y rounded-xl border bg-card">
            {users?.map((u) => (
              <div key={u.id} className="flex items-center gap-3 p-3 text-sm">
                <div className="min-w-0">
                  <div className="truncate font-semibold">{u.display_name || u.email}</div>
                  <div className="truncate text-muted-foreground">
                    {u.email} · {timeAgo(u.created_at)}
                    {!u.email_verified && " · email не подтверждён"}
                  </div>
                </div>
                <span className="ml-auto shrink-0">
                  {u.is_admin ? (
                    <span className="text-xs font-bold">админ</span>
                  ) : u.is_active ? (
                    <AdminAction kind="block" id={u.id} label="Заблокировать" variant="destructive" />
                  ) : (
                    <AdminAction kind="unblock" id={u.id} label="Разблокировать" />
                  )}
                </span>
              </div>
            ))}
          </div>
        </div>
        <div>
          <h2 className="text-xl font-extrabold">Стартапы</h2>
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
        </div>
      </section>

      <section className="mt-10">
        <h2 className="text-xl font-extrabold">Журнал действий</h2>
        <ul className="mt-3 grid gap-1 text-sm text-muted-foreground">
          {audit?.length ? (
            audit.slice(0, 30).map((a) => (
              <li key={a.id}>
                {timeAgo(a.created_at)} · {a.admin_email} · {a.action} · {a.target_type} {a.target_id.slice(0, 8)}
              </li>
            ))
          ) : (
            <li>Пока пусто</li>
          )}
        </ul>
      </section>
    </Container>
  );
}
