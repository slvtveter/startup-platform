import Link from "next/link";

import { StartupStatusBadge, TermsBadge } from "@/components/domain/badges";
import { Container, EmptyState, PageHeader } from "@/components/domain/page-header";
import { buttonVariants } from "@/components/ui/button";
import { listMyStartups } from "@/lib/api";
import { plural } from "@/lib/labels";
import { requireMe, serverClient } from "@/lib/server-api";

export const metadata = { title: "Мои стартапы" };

export default async function MyStartupsPage() {
  await requireMe("/me/startups");
  const { data } = await listMyStartups({ client: await serverClient() });
  const items = data ?? [];
  return (
    <Container className="max-w-4xl">
      <PageHeader
        title="Мои стартапы"
        description="Отклики, роли и статус набора по каждому проекту."
        actions={
          <Link href="/startups/new" className={buttonVariants({ variant: "brand" })}>
            Создать стартап
          </Link>
        }
      />
      {items.length === 0 ? (
        <div className="mt-8">
          <EmptyState
            title="У тебя пока нет стартапов"
            text="Опиши идею, открой роли и собери первую команду."
            action={
              <Link href="/startups/new" className={buttonVariants({ variant: "brand" })}>
                Создать стартап
              </Link>
            }
          />
        </div>
      ) : (
        <div className="mt-8 grid gap-4">
          {items.map((s) => (
            <div key={s.id} className="flex flex-col gap-4 rounded-2xl border bg-card p-5 sm:flex-row sm:items-center">
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap gap-2">
                  <StartupStatusBadge status={s.status} />
                  <TermsBadge terms={s.terms} />
                  {s.is_hidden && <span className="rounded-full bg-destructive/10 px-2.5 py-0.5 text-xs font-bold text-destructive">Скрыт модератором</span>}
                </div>
                <div className="mt-2 text-xl font-extrabold">{s.title}</div>
                <div className="text-sm text-muted-foreground">
                  Открытых ролей: {s.open_roles.length}
                  {s.pending_applications > 0 && (
                    <span className="ml-2 font-bold text-brand-ink">
                      · {s.pending_applications} {plural(s.pending_applications, "новый отклик", "новых отклика", "новых откликов")}
                    </span>
                  )}
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                <Link href={`/me/startups/${s.slug}`} className={buttonVariants({ variant: s.pending_applications ? "default" : "outline" })}>
                  Отклики
                </Link>
                <Link href={`/startups/${s.slug}/edit`} className={buttonVariants({ variant: "outline" })}>
                  Редактировать
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </Container>
  );
}
