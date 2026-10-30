import Link from "next/link";

import { ApplicationCard } from "@/components/domain/application-card";
import { MarkSeen } from "@/components/site/mark-seen";
import {
  Container,
  EmptyState,
  PageHeader,
} from "@/components/domain/page-header";
import { buttonVariants } from "@/components/ui/button";
import { listMyApplications } from "@/lib/api";
import { requireMe, serverClient } from "@/lib/server-api";

export const metadata = { title: "Мои отклики" };

const ARCHIVED = new Set(["rejected", "withdrawn"]);

export default async function MyApplicationsPage({
  searchParams,
}: {
  searchParams: Promise<{ view?: string }>;
}) {
  await requireMe("/me/applications");
  const { view } = await searchParams;
  const archive = view === "archive";
  const { data } = await listMyApplications({ client: await serverClient() });
  const all = data ?? [];
  const archived = all.filter((a) => ARCHIVED.has(a.status));
  const active = all.filter((a) => !ARCHIVED.has(a.status));
  const apps = archive ? archived : active;
  const invites = apps.filter(
    (a) => a.direction === "invite" && a.status === "pending",
  );
  const accepted = apps.filter((a) => a.status === "accepted");
  const rest = apps.filter(
    (a) => !invites.includes(a) && !accepted.includes(a),
  );

  return (
    <Container className="max-w-4xl">
      <MarkSeen section="mine" />
      <PageHeader
        title="Мои отклики"
        description="Отклики на роли и приглашения от основателей."
      />
      <nav
        aria-label="Фильтр заявок"
        className="mt-6 flex gap-1 border-b text-sm font-semibold"
      >
        {[
          ["", `Активные (${active.length})`],
          ["archive", `Архив (${archived.length})`],
        ].map(([value, label]) => {
          const current = (value === "archive") === archive;
          return (
            <Link
              key={value}
              href={
                value ? `/me/applications?view=${value}` : "/me/applications"
              }
              aria-current={current ? "page" : undefined}
              className={`-mb-px border-b-2 px-3 py-2 ${current ? "border-foreground" : "border-transparent text-muted-foreground hover:text-foreground"}`}
            >
              {label}
            </Link>
          );
        })}
      </nav>
      {apps.length === 0 ? (
        <div className="mt-8">
          <EmptyState
            title={archive ? "Архив пуст" : "Пока ни одной активной заявки"}
            text={
              archive
                ? "Здесь будут отклонённые и отозванные заявки."
                : "Найди стартап, где нужен человек с твоими навыками, и откликнись."
            }
            action={
              <Link
                href="/startups"
                className={buttonVariants({ variant: "brand" })}
              >
                Смотреть стартапы
              </Link>
            }
          />
        </div>
      ) : (
        <div className="mt-8 grid gap-8">
          {accepted.length > 0 && (
            <section>
              <h2 className="font-sans text-lg font-bold tracking-normal">
                Тебя приняли
              </h2>
              <div className="mt-3 grid gap-4">
                {accepted.map((a) => (
                  <ApplicationCard key={a.id} app={a} perspective="candidate" />
                ))}
              </div>
            </section>
          )}
          {invites.length > 0 && (
            <section>
              <h2 className="font-sans text-lg font-bold tracking-normal">
                Ждут твоего ответа
              </h2>
              <div className="mt-3 grid gap-4">
                {invites.map((a) => (
                  <ApplicationCard key={a.id} app={a} perspective="candidate" />
                ))}
              </div>
            </section>
          )}
          {rest.length > 0 && (
            <section className="grid gap-4">
              {rest.map((a) => (
                <ApplicationCard key={a.id} app={a} perspective="candidate" />
              ))}
            </section>
          )}
        </div>
      )}
    </Container>
  );
}
