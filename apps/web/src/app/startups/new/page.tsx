import { Container, PageHeader } from "@/components/domain/page-header";
import { StartupWizard } from "@/components/domain/startup-wizard";
import { listRoles } from "@/lib/api";
import { requireMe, serverClient } from "@/lib/server-api";

export const metadata = { title: "Новая идея или стартап" };

export default async function NewStartupPage() {
  const user = await requireMe("/startups/new", { signup: true });
  const { data: roles } = await listRoles({ client: await serverClient() });
  return (
    <Container>
      <PageHeader title="Идея или стартап" description="Пара минут: по одному вопросу на экран. Всё можно поменять потом." />
      <div className="mt-8">
        <StartupWizard roles={roles ?? []} emailVerified={user.email_verified} />
      </div>
    </Container>
  );
}
