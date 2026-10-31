import Link from "next/link";
import { notFound } from "next/navigation";

import { ApplicationCard } from "@/components/domain/application-card";
import { MarkSeen } from "@/components/site/mark-seen";
import { Container, EmptyState, PageHeader } from "@/components/domain/page-header";
import { buttonVariants } from "@/components/ui/button";
import { getStartup, listStartupApplications } from "@/lib/api";
import { requireMe, serverClient } from "@/lib/server-api";

export const metadata = { title: "Входящие отклики" };

export default async function IncomingPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  await requireMe(`/me/startups/${slug}`);
  const client = await serverClient();
  const { data: s } = await getStartup({ client, path: { slug } });
  if (!s || !s.is_owner) notFound();
  const { data } = await listStartupApplications({ client, path: { startup_id: s.id } });
  const apps = data ?? [];
  const pending = apps.filter((a) => a.status === "pending" && a.direction === "apply");
  const rest = apps.filter((a) => !pending.includes(a));

  return (
    <Container className="max-w-4xl">
      <MarkSeen section="incoming" />
      <Link href="/me/startups" className="text-sm font-semibold text-muted-foreground hover:text-foreground">
        ← Мои стартапы
      </Link>
      <div className="mt-4">
        <PageHeader
          title={`${s.title}: отклики`}
          actions={
            <>
              <Link href="/people" className={buttonVariants({ variant: "outline" })}>
                Найти людей
              </Link>
              <Link href={`/startups/${s.slug}/edit`} className={buttonVariants({ variant: "outline" })}>
                Роли
              </Link>
            </>
          }
        />
      </div>
      {apps.length === 0 ? (
        <div className="mt-8">
          <EmptyState
            sticker="chat"
            title="Откликов пока нет"
            text="Пригласи подходящих людей из каталога сам."
            action={
              <Link href="/people" className={buttonVariants({ variant: "brand" })}>
                Открыть каталог людей
              </Link>
            }
          />
        </div>
      ) : (
        <div className="mt-6 grid gap-4">
          {[...pending, ...rest].map((a) => (
            <ApplicationCard key={a.id} app={a} perspective="founder" />
          ))}
        </div>
      )}
    </Container>
  );
}
