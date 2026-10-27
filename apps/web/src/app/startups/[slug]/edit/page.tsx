import Link from "next/link";
import { notFound } from "next/navigation";

import { StartupStatusBadge } from "@/components/domain/badges";
import { CoverUpload } from "@/components/domain/cover-upload";
import { Container, PageHeader } from "@/components/domain/page-header";
import { StartupEditor } from "@/components/domain/startup-editor";
import { buttonVariants } from "@/components/ui/button";
import { getStartup, listRoles, listSkills } from "@/lib/api";
import { requireMe, serverClient } from "@/lib/server-api";

export const metadata = { title: "Редактирование стартапа" };

export default async function EditStartupPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  await requireMe(`/startups/${slug}/edit`);
  const client = await serverClient();
  const [{ data: s }, { data: roles }, { data: skills }] = await Promise.all([
    getStartup({ client, path: { slug } }),
    listRoles({ client }),
    listSkills({ client }),
  ]);
  if (!s || !s.is_owner) notFound();
  return (
    <Container>
      <PageHeader
        title={s.title}
        description={<StartupStatusBadge status={s.status} />}
        actions={
          <Link href={`/startups/${s.slug}`} className={buttonVariants({ variant: "outline" })}>
            Как видят другие
          </Link>
        }
      />
      <div className="mt-8">
        <CoverUpload startup={s} />
      </div>
      <div className="mt-8">
        <StartupEditor startup={s} roles={roles ?? []} skills={skills ?? []} />
      </div>
    </Container>
  );
}
