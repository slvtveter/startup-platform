import Link from "next/link";

import { StartupStatusBadge, TermsBadge } from "@/components/domain/badges";
import { Container, EmptyState, PageHeader } from "@/components/domain/page-header";
import { StartupCover } from "@/components/domain/startup-card";
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
          items.length > 0 ? (
            <Link href="/startups/new" className={buttonVariants()}>
              Предложить идею
            </Link>
          ) : undefined
        }
      />
      {items.length === 0 ? (
        <div className="mt-8">
          <EmptyState
            sticker="bulb"
            title="У тебя пока нет стартапов"
            text="Опиши идею, открой роли и собери первую команду."
            action={
              <Link href="/startups/new" className={buttonVariants()}>
                Предложить идею
              </Link>
            }
          />
        </div>
      ) : (
        <div className="mt-8 grid gap-4">
          {items.map((s) => (
            <div key={s.id} className="flex flex-col gap-4 rounded-[28px] bg-tone p-4 sm:flex-row sm:items-center sm:p-5">
              <div className="relative aspect-[16/10] w-full shrink-0 overflow-hidden rounded-2xl bg-tone-2 sm:w-40">
                <StartupCover startup={s} sizes="160px" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap gap-2">
                  <StartupStatusBadge status={s.status} />
                  <TermsBadge terms={s.terms} />
                  {s.is_hidden && <span className="rounded-full bg-destructive/10 px-2.5 py-0.5 text-xs font-bold text-destructive">Скрыт модератором</span>}
                </div>
                <Link href={`/startups/${s.slug}`} className="mt-2 block text-xl font-extrabold tracking-[-0.02em] hover:text-brand-ink">
                  {s.title}
                </Link>
                <div className="text-sm text-muted-foreground">
                  {plural(s.open_roles.length, `${s.open_roles.length} место свободно`, `${s.open_roles.length} места свободно`, `${s.open_roles.length} мест свободно`)} · {s.views_30d ?? 0} {plural(s.views_30d ?? 0, "просмотр", "просмотра", "просмотров")} за месяц
                  {s.pending_applications > 0 && (
                    <span className="font-bold text-brand-ink">
                      , {s.pending_applications} {plural(s.pending_applications, "новый отклик", "новых отклика", "новых откликов")}
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
