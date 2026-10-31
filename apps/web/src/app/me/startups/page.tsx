import Link from "next/link";

import { StartupStatusBadge, TermsBadge } from "@/components/domain/badges";
import { Container, EmptyState, PageHeader } from "@/components/domain/page-header";
import { PersonCard } from "@/components/domain/person-card";
import { StartupCover } from "@/components/domain/startup-card";
import { buttonVariants } from "@/components/ui/button";
import { listMyStartups, listPeople } from "@/lib/api";
import { plural } from "@/lib/labels";
import { requireMe, serverClient } from "@/lib/server-api";

export const metadata = { title: "Мои стартапы" };

export default async function MyStartupsPage() {
  const me = await requireMe("/me/startups");
  const client = await serverClient();
  const { data } = await listMyStartups({ client });
  const items = data ?? [];
  // Под списком — кого позвать на открытые роли: страница не пустует и сразу ведёт к действию.
  const openRoles = [...new Map(items.flatMap((s) => s.open_roles.map((r) => [r.role.slug, r.role.name] as const))).entries()];
  const { data: fit } =
    openRoles.length > 0 ? await listPeople({ client, query: { role: openRoles.map(([slug]) => slug), limit: 8 } }) : { data: undefined };
  const candidates = (fit?.items ?? []).filter((p) => p.slug !== me.profile?.slug).slice(0, 4);
  return (
    <Container className="max-w-5xl">
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
              <div className="relative aspect-[16/10] w-28 shrink-0 overflow-hidden rounded-2xl bg-tone-2 sm:w-40">
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
      {candidates.length > 0 && (
        <section aria-labelledby="fit-h" className="mt-14">
          <div className="flex flex-wrap items-end gap-x-6 gap-y-2">
            <div>
              <h2 id="fit-h" className="text-[28px] leading-[1.1] sm:text-[36px]">
                Кого позвать в команду
              </h2>
              <p className="mt-2 text-muted-foreground">Ищут проект и подходят на {openRoles.length > 1 ? "твои открытые роли" : `роль «${openRoles[0][1]}»`}.</p>
            </div>
            <Link
              href={`/people?${openRoles.map(([slug]) => `role=${slug}`).join("&")}`}
              className="ml-auto inline-flex min-h-6 items-center font-bold text-brand-ink hover:text-brand-hover"
            >
              Все подходящие
            </Link>
          </div>
          <div className="mt-6 grid gap-3 lg:grid-cols-2">
            {candidates.map((p) => (
              <PersonCard key={p.slug} person={p} compact />
            ))}
          </div>
        </section>
      )}
    </Container>
  );
}
