import { ChevronLeftIcon } from "lucide-react";
import Link from "next/link";

import { Container, PageHeader } from "@/components/domain/page-header";
import { ProfileEditor, type Goal } from "@/components/domain/profile-editor";
import { getMyProfile, listRoles, listSkills } from "@/lib/api";
import { requireMe, serverClient } from "@/lib/server-api";

export const metadata = { title: "Редактировать профиль" };

export default async function MyProfilePage({ searchParams }: { searchParams: Promise<{ welcome?: string }> }) {
  const user = await requireMe("/me/profile/edit");
  const { welcome } = await searchParams;
  // ?welcome=idea|cofound|join — цель из развилки после регистрации; «1» — старые ссылки.
  const goal = (["idea", "cofound", "join"] as const).find((g) => g === welcome) as Goal | undefined;
  const client = await serverClient();
  const [{ data: profile }, { data: roles }, { data: skills }] = await Promise.all([
    getMyProfile({ client }),
    listRoles({ client }),
    listSkills({ client }),
  ]);
  return (
    <Container>
      {!welcome && (
        <Link href="/me/profile" className="mb-6 inline-flex min-h-6 items-center gap-1 text-sm font-semibold text-muted-foreground transition-colors hover:text-foreground">
          <ChevronLeftIcon className="size-4" /> Мой профиль
        </Link>
      )}
      <PageHeader
        title={welcome ? "Расскажи о себе" : "Редактировать профиль"}
        description={
          welcome
            ? goal === "idea"
              ? "Три коротких шага, потом опишешь идею."
              : "Три коротких шага."
            : "Так тебя увидят основатели в каталоге людей."
        }
      />
      <div className="mt-8">
        <ProfileEditor profile={profile!} roles={roles ?? []} skills={skills ?? []} emailVerified={user.email_verified} welcome={!!welcome} goal={goal} />
      </div>
    </Container>
  );
}
