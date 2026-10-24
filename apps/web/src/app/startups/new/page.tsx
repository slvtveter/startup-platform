import { Container, PageHeader } from "@/components/domain/page-header";
import { StartupEditor } from "@/components/domain/startup-editor";
import { listRoles, listSkills } from "@/lib/api";
import { requireMe, serverClient } from "@/lib/server-api";

export const metadata = { title: "Новый стартап" };

export default async function NewStartupPage() {
  await requireMe("/startups/new");
  const client = await serverClient();
  const [{ data: roles }, { data: skills }] = await Promise.all([listRoles({ client }), listSkills({ client })]);
  return (
    <Container>
      <PageHeader title="Новый стартап" description="Расскажи об идее. Опубликовать можно после того, как добавишь роли." />
      <div className="mt-8">
        <StartupEditor roles={roles ?? []} skills={skills ?? []} />
      </div>
    </Container>
  );
}
