import { redirect } from "next/navigation";

import { MyProfileActions, PhotoDialogButton } from "@/components/domain/my-profile-actions";
import { Container } from "@/components/domain/page-header";
import { PersonView } from "@/components/domain/person-view";
import { getMyProfile } from "@/lib/api";
import { requireMe, serverClient } from "@/lib/server-api";

export const metadata = { title: "Мой профиль" };

/**
 * Свой профиль так, как его видят другие, с кнопками «Редактировать» и «Фото».
 * Пустой профиль (нет имени или роли) смотреть не на что — сразу ведём в редактор.
 */
export default async function MyProfilePage({ searchParams }: { searchParams: Promise<{ welcome?: string }> }) {
  await requireMe("/me/profile");
  const { welcome } = await searchParams;
  // Старые ссылки из развилки после регистрации (/me/profile?welcome=…) ведут в мастер.
  if (welcome) redirect(`/me/profile/edit?welcome=${encodeURIComponent(welcome)}`);
  const { data: p } = await getMyProfile({ client: await serverClient() });
  if (!p || !p.primary_role || p.display_name === "Без имени") redirect("/me/profile/edit");

  return (
    <Container>
      <div
        className={
          p.is_published
            ? "mb-8 flex flex-wrap items-center gap-x-3 gap-y-1 rounded-2xl bg-success-soft px-4 py-3 text-sm text-success-ink"
            : "mb-8 flex flex-wrap items-center gap-x-3 gap-y-1 rounded-2xl bg-warn-soft px-4 py-3 text-sm text-warn-ink"
        }
      >
        <span aria-hidden className={`size-2 rounded-full ${p.is_published ? "bg-success-ink" : "bg-warn-ink"}`} />
        <b>{p.is_published ? "Профиль опубликован" : "Профиль скрыт"}</b>
        <span>{p.is_published ? "Так тебя видят основатели в каталоге людей." : "Пока он скрыт, тебя не найдут в каталоге и нельзя откликаться."}</span>
      </div>
      <PersonView
        p={p}
        signedIn
        photoSlot={<PhotoDialogButton overlay name={p.display_name} url={p.avatar_url ?? null} />}
        actions={<MyProfileActions slug={p.slug} published={p.is_published} canPublish={p.can_publish} />}
      />
    </Container>
  );
}
