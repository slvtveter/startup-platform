import { Container, PageHeader } from "@/components/domain/page-header";
import { ProfileEditor } from "@/components/domain/profile-editor";
import { getMyProfile, listRoles, listSkills } from "@/lib/api";
import { requireMe, serverClient } from "@/lib/server-api";

export const metadata = { title: "Мой профиль" };

export default async function MyProfilePage({ searchParams }: { searchParams: Promise<{ welcome?: string }> }) {
  const user = await requireMe("/me/profile");
  const { welcome } = await searchParams;
  const client = await serverClient();
  const [{ data: profile }, { data: roles }, { data: skills }] = await Promise.all([
    getMyProfile({ client }),
    listRoles({ client }),
    listSkills({ client }),
  ]);
  return (
    <Container>
      <PageHeader
        title={welcome ? "Добро пожаловать! Расскажи о себе" : "Мой профиль"}
        description={welcome ? "Три коротких шага, и основатели смогут найти тебя в каталоге." : "Профиль видят основатели стартапов в каталоге людей."}
      />
      <div className="mt-8">
        <ProfileEditor profile={profile!} roles={roles ?? []} skills={skills ?? []} emailVerified={user.email_verified} welcome={!!welcome} />
      </div>
    </Container>
  );
}
