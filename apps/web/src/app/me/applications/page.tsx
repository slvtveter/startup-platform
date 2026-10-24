import Link from "next/link";

import { ApplicationCard } from "@/components/domain/application-card";
import { Container, EmptyState, PageHeader } from "@/components/domain/page-header";
import { buttonVariants } from "@/components/ui/button";
import { listMyApplications } from "@/lib/api";
import { requireMe, serverClient } from "@/lib/server-api";

export const metadata = { title: "Мои заявки" };

export default async function MyApplicationsPage() {
  await requireMe("/me/applications");
  const { data } = await listMyApplications({ client: await serverClient() });
  const apps = data ?? [];
  const invites = apps.filter((a) => a.direction === "invite" && a.status === "pending");
  const rest = apps.filter((a) => !invites.includes(a));

  return (
    <Container className="max-w-4xl">
      <PageHeader title="Мои заявки" description="Отклики на роли и приглашения от основателей. Основатели обычно отвечают в течение 72 часов." />
      {apps.length === 0 ? (
        <div className="mt-8">
          <EmptyState
            title="Пока ни одной заявки"
            text="Найди стартап, где нужен человек с твоими навыками, и откликнись."
            action={
              <Link href="/startups" className={buttonVariants({ variant: "brand" })}>
                Смотреть стартапы
              </Link>
            }
          />
        </div>
      ) : (
        <div className="mt-8 grid gap-8">
          {invites.length > 0 && (
            <section>
              <h2 className="text-lg">Ждут твоего ответа</h2>
              <div className="mt-3 grid gap-4">
                {invites.map((a) => (
                  <ApplicationCard key={a.id} app={a} perspective="candidate" />
                ))}
              </div>
            </section>
          )}
          <section className="grid gap-4">
            {rest.map((a) => (
              <ApplicationCard key={a.id} app={a} perspective="candidate" />
            ))}
          </section>
        </div>
      )}
    </Container>
  );
}
