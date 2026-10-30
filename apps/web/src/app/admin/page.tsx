import Link from "next/link";
import { ChevronDownIcon } from "lucide-react";
import { notFound } from "next/navigation";

import { AdminAction } from "@/components/domain/admin-actions";
import { CatalogEditor, PlatformStartupForm } from "@/components/domain/admin-cold-start";
import { Container, PageHeader } from "@/components/domain/page-header";
import { adminAuditLog, adminHypotheses, adminListReports, adminListStartups, adminListUsers, adminCohorts, adminMetrics, listRoles, listSkills, type HypothesisRow } from "@/lib/api";
import { STARTUP_STATUS, timeAgo } from "@/lib/labels";
import { requireMe, serverClient } from "@/lib/server-api";

export const metadata = { title: "Админка", robots: { index: false } };

export default async function AdminPage({ searchParams }: { searchParams: Promise<{ days?: string; q?: string }> }) {
  const user = await requireMe("/admin");
  if (!user.is_admin) notFound();
  const { days = "7", q } = await searchParams;
  const client = await serverClient();
  const [{ data: m }, { data: users }, { data: startups }, { data: reports }, { data: audit }, { data: hyp }, { data: roles }, { data: skills }, { data: cohorts }] = await Promise.all([
    adminMetrics({ client, query: { days: Number(days) } }),
    adminListUsers({ client, query: { q } }),
    adminListStartups({ client }),
    adminListReports({ client }),
    adminAuditLog({ client }),
    adminHypotheses({ client, query: { days: Number(days) } }),
    listRoles({ client }),
    listSkills({ client }),
    adminCohorts({ client }),
  ]);
  const top = Math.max(1, ...(m?.funnel.map((f) => f.count) ?? [1]));

  return (
    <Container className="ym-hide-content">
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

      {/* Страница длинная, особенно на телефоне: быстрый переход к разделам. */}
      <nav aria-label="Разделы админки" className="mt-6 flex flex-wrap gap-2 text-sm font-semibold">
        {[
          ["#metrics", "Метрики"],
          ["#reports", `Жалобы${reports?.length ? ` (${reports.length})` : ""}`],
          ["#users", "Пользователи"],
          ["#startups", "Стартапы"],
          ["#catalog", "Справочники"],
          ["#audit", "Журнал"],
        ].map(([href, label]) => (
          <a key={href} href={href} className="rounded-lg border bg-card px-3 py-1.5 hover:bg-secondary">
            {label}
          </a>
        ))}
      </nav>

      <section id="metrics" className="mt-8 scroll-mt-20 grid grid-cols-1 gap-4 lg:grid-cols-[1.4fr_1fr]">
        <div className="rounded-2xl border bg-card p-6">
          <h2 className="font-sans text-base font-bold">Воронка за {m?.days} дней</h2>
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
            <div className="mt-1 text-[36px] font-bold">{m?.answered_72h_share == null ? "—" : `${Math.round(m.answered_72h_share * 100)}%`}</div>
            <div className="mt-4 text-sm text-muted-foreground">Активных стартапов</div>
            <div className="mt-1 text-[36px] font-bold">{m?.active_startups ?? 0}</div>
            <div className="mt-4 text-sm text-muted-foreground">Фоновые задачи</div>
            <div className="mt-1 text-sm">
              <span className="font-semibold">{m?.jobs_pending ?? 0}</span> в очереди,{" "}
              <span className={`font-semibold ${m?.jobs_failed ? "text-destructive" : ""}`}>{m?.jobs_failed ?? 0}</span> упало
            </div>
          </div>
          <div className="rounded-2xl border bg-card p-6">
            <div className="font-bold">Источники регистраций</div>
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

      <section className="mt-8 rounded-2xl border bg-card p-6">
        <div className="flex flex-wrap items-baseline gap-x-4 gap-y-2">
          <h2 className="font-sans text-base font-bold">Удержание по неделям регистрации</h2>
          <span className="ml-auto flex gap-3 text-sm font-semibold">
            <a href={`/api/admin/export?kind=funnel&days=${days}`} className="text-brand-ink hover:underline">
              Воронка в CSV
            </a>
            <a href="/api/admin/export?kind=cohorts" className="text-brand-ink hover:underline">
              Когорты в CSV
            </a>
          </span>
        </div>
        <p className="mt-1 text-sm text-muted-foreground">
          Доля тех, кто сделал осмысленное действие (отклик, приглашение, ответ, публикация) на 7–13 и 30–36 день.
        </p>
        <div className="mt-4 overflow-x-auto" tabIndex={0} role="region" aria-label="Таблица когорт">
          <table className="w-full min-w-[420px] text-sm">
            <thead className="text-left text-muted-foreground">
              <tr className="border-b">
                <th className="py-2 pr-3 font-semibold">Неделя</th>
                <th className="py-2 pr-3 text-right font-semibold">Регистраций</th>
                <th className="py-2 pr-3 text-right font-semibold">D7</th>
                <th className="py-2 text-right font-semibold">D30</th>
              </tr>
            </thead>
            <tbody>
              {(cohorts ?? []).map((c) => (
                <tr key={c.week} className="border-b last:border-0">
                  <td className="py-2.5 pr-3">с {new Date(c.week).toLocaleDateString("ru-RU", { day: "numeric", month: "short" })}</td>
                  <td className="py-2.5 pr-3 text-right tabular-nums">{c.signups}</td>
                  <td className="py-2.5 pr-3 text-right tabular-nums">{fmtShare(c.d7)}</td>
                  <td className="py-2.5 text-right tabular-nums">{fmtShare(c.d30)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="mt-8 rounded-2xl border bg-card p-6">
        <h2 className="font-sans text-base font-bold">Гипотезы редизайна за {days} дней</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Сравнение с предыдущими {days} днями. Описание гипотез: docs/ux/research.md.
        </p>
        <div className="mt-4 overflow-x-auto" tabIndex={0} role="region" aria-label="Таблица гипотез">
          <table className="w-full min-w-[640px] text-sm">
            <thead className="text-left text-muted-foreground">
              <tr className="border-b">
                <th className="py-2 pr-3 font-semibold">Гипотеза</th>
                <th className="py-2 pr-3 font-semibold">Метрика</th>
                <th className="py-2 pr-3 text-right font-semibold">Сейчас</th>
                <th className="py-2 text-right font-semibold">Было</th>
              </tr>
            </thead>
            <tbody>
              {(hyp ?? []).map((h) => (
                <tr key={h.key} className="border-b last:border-0">
                  <td className="py-3 pr-3">
                    <span className="mr-2 font-bold">{h.key}</span>
                    {h.title}
                  </td>
                  <td className="py-3 pr-3 text-muted-foreground">{h.metric}</td>
                  <td className="py-3 pr-3 text-right font-semibold tabular-nums">{fmtMetric(h.current, h.unit)}</td>
                  <td className="py-3 text-right text-muted-foreground tabular-nums">{fmtMetric(h.previous, h.unit)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="mt-8 rounded-2xl border bg-card p-6">
        <h2 className="font-sans text-base font-bold">Перенести стартап на платформу</h2>
        <p className="mt-1 mb-4 text-sm text-muted-foreground">
          Для холодного старта: оформить открытый проект за основателя. Черновик принадлежит платформе, пока основатель не
          зарегистрируется и не подтвердит почту.
        </p>
        <PlatformStartupForm />
      </section>


      <section id="reports" className="mt-10 scroll-mt-20">
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

      <section className="mt-10 grid gap-8 lg:grid-cols-2">
        <div id="users" className="scroll-mt-20">
          <div className="flex items-center gap-3">
            <h2 className="text-xl">Пользователи</h2>
            <form className="ml-auto min-w-0">
              <input name="q" defaultValue={q} placeholder="Поиск" aria-label="Поиск пользователей" className="h-9 w-36 rounded-xl bg-tone px-3 text-sm outline-none focus-visible:ring-3 focus-visible:ring-ring/25 sm:w-56" />
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
        <div id="startups" className="scroll-mt-20">
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
        </div>
      </section>

      {/* Справочники правят редко, а списки длинные: по умолчанию свёрнуты. */}
      <section id="catalog" className="mt-10 grid scroll-mt-20 grid-cols-1 items-start gap-4 lg:grid-cols-2">
        {(
          [
            ["roles", "Роли", roles],
            ["skills", "Навыки", skills],
          ] as const
        ).map(([kind, title, items]) => (
          <details key={kind} className="group rounded-2xl border bg-card p-6">
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

      <section id="audit" className="mt-10 scroll-mt-20">
        <h2 className="text-xl">Журнал действий</h2>
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

function fmtMetric(v: number | null | undefined, unit: HypothesisRow["unit"]) {
  if (v == null) return "нет данных";
  if (unit === "%") return `${Math.round(v * 1000) / 10}%`;
  return unit === "ч" ? `${v} ч` : String(v);
}

function fmtShare(v: number | null | undefined) {
  return v == null ? "рано считать" : `${Math.round(v * 1000) / 10}%`;
}
