import { ChevronLeftIcon } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { WriteDialog } from "@/components/domain/chat/write-dialog";
import {
  InviteDialog,
  type InviteOption,
} from "@/components/domain/invite-dialog";
import { Container } from "@/components/domain/page-header";
import { ReportButton } from "@/components/domain/report-button";
import { PersonView } from "@/components/domain/person-view";
import { buttonVariants } from "@/components/ui/button";
import { JsonLd, breadcrumbs, siteUrl } from "@/components/site/json-ld";
import { TrackView } from "@/components/site/track-view";
import { getPerson, getStartup, listMyStartups } from "@/lib/api";
import { TERMS, termsOf } from "@/lib/labels";
import { getMe, serverClient } from "@/lib/server-api";
import { roleLower } from "@/lib/seo";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const { data } = await getPerson({
    client: await serverClient(),
    path: { slug },
  });
  if (!data) return { title: "Профиль не найден" };
  const title = `${data.display_name}${data.primary_role ? `, ${roleLower(data.primary_role.name)}` : ""}`;
  // Короткий заголовок вроде «-» поисковик показал бы как сниппет: собираем описание из роли и навыков.
  const skills = data.skills.slice(0, 5).map((s) => s.name).join(", ");
  const description =
    data.headline.trim().length >= 20
      ? data.headline
      : `${title}. ${skills ? `Навыки: ${skills}. ` : ""}Профиль на Envola, где собирают команды для стартапов.`;
  return {
    title,
    description,
    alternates: { canonical: `/people/${data.slug}` },
    // Примеры (app.scripts.demo) не должны попасть в поиск как настоящие люди.
    ...(data.is_demo ? { robots: { index: false, follow: true } } : {}),
  };
}

export default async function PersonPage({ params }: Props) {
  const { slug } = await params;
  const client = await serverClient();
  const [{ data: p }, user] = await Promise.all([
    getPerson({ client, path: { slug } }),
    getMe(),
  ]);
  if (!p) notFound();

  // Варианты приглашения: открытые роли в стартапах, которые сейчас набирают.
  let options: InviteOption[] = [];
  if (user && user.profile?.slug !== p.slug) {
    const { data: mine } = await listMyStartups({ client });
    const recruiting = (mine ?? []).filter((s) => s.status === "recruiting");
    const details = await Promise.all(
      recruiting.map((s) => getStartup({ client, path: { slug: s.slug } })),
    );
    options = details.flatMap(({ data }) =>
      data
        ? data.roles
            .filter((r) => r.is_open)
            .map((r) => ({ roleId: r.id, label: `${data.title}: ${r.title}` }))
        : [],
    );
  }

  const showBar = !p.is_demo && user?.profile?.slug !== p.slug;

  return (
    <Container className={showBar ? "pb-28 lg:pb-10" : undefined}>
      {/* Просмотр чужого профиля: владелец видит счётчик «посмотрели за 30 дней» на главной. */}
      {!p.is_demo && user?.profile?.slug !== p.slug && <TrackView name="profile_viewed" slug={p.slug} />}
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@graph": [
            {
              "@type": "ProfilePage",
              url: siteUrl(`/people/${p.slug}`),
              mainEntity: {
                "@type": "Person",
                name: p.display_name,
                ...(p.headline ? { description: p.headline } : {}),
                ...(p.primary_role ? { jobTitle: p.primary_role.name } : {}),
                ...(p.avatar_url ? { image: siteUrl(p.avatar_url) } : {}),
                ...(p.skills.length
                  ? { knowsAbout: p.skills.map((sk) => sk.name) }
                  : {}),
              },
            },
            breadcrumbs([
              ["Люди", "/people"],
              [p.display_name, `/people/${p.slug}`],
            ]),
          ],
        }}
      />
      <Link
        href="/people"
        className="inline-flex min-h-6 items-center gap-1 text-sm font-semibold text-muted-foreground hover:text-foreground"
      >
        <ChevronLeftIcon className="size-4" /> Все люди
      </Link>

      <div className="mt-6">
        <PersonView
          p={p}
          signedIn={!!user}
          footer={<ReportButton targetType="profile" targetId={p.slug} />}
          actions={
            p.is_demo ? (
              <>
                <Link href={p.primary_role ? `/people?role=${p.primary_role.slug}` : "/people"} className={buttonVariants({ size: "lg" })}>
                  Найти похожих людей
                </Link>
                <span className="text-sm text-muted-foreground">Это пример: так выглядит профиль на Envola</span>
              </>
            ) : !user ? (
              <Link href={`/login?next=/people/${p.slug}`} className={buttonVariants({ size: "lg" })}>
                Войти, чтобы написать
              </Link>
            ) : user.profile?.slug === p.slug ? (
              <Link href="/me/profile" className={buttonVariants({ variant: "outline", size: "lg" })}>
                Это ты: перейти в свой профиль
              </Link>
            ) : (
              <span id="contact" className="flex scroll-mt-24 flex-wrap gap-2.5">
                {options.length > 0 && <InviteDialog slug={p.slug} name={p.display_name} options={options} />}
                <WriteDialog slug={p.slug} name={p.display_name} />
              </span>
            )
          }
        />
      </div>

      {/* На телефоне блок с кнопкой оказывается в самом конце — дублируем действие внизу экрана, как на странице стартапа. */}
      {showBar && (
        <div className="sticky-cta fixed inset-x-0 bottom-[var(--cookie-offset,0px)] z-30 border-t bg-background/95 px-4 py-3 backdrop-blur lg:hidden">
          <div className="mx-auto flex max-w-[1360px] items-center gap-3">
            <span className="min-w-0 text-sm">
              <span className="block truncate font-semibold">{p.display_name}</span>
              {termsOf(p.looking_for).length > 0 && (
                <span className="block truncate text-muted-foreground">
                  Условия: {termsOf(p.looking_for).map((t) => TERMS[t].toLowerCase()).join(", ")}
                </span>
              )}
            </span>
            {user ? (
              <a href="#contact" className={buttonVariants({ size: "lg", className: "ml-auto shrink-0" })}>
                {options.length > 0 ? "Пригласить" : "Написать"}
              </a>
            ) : (
              <Link href={`/login?next=/people/${p.slug}`} className={buttonVariants({ size: "lg", className: "ml-auto shrink-0" })}>
                Войти и написать
              </Link>
            )}
          </div>
        </div>
      )}
    </Container>
  );
}
