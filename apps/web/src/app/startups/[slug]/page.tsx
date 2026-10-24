import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { ApplyDialog } from "@/components/domain/apply-dialog";
import { SkillChip, StageBadge, StartupStatusBadge, TermsBadge } from "@/components/domain/badges";
import { Container } from "@/components/domain/page-header";
import { PersonAvatar } from "@/components/domain/person-card";
import { ReportButton } from "@/components/domain/report-button";
import { buttonVariants } from "@/components/ui/button";
import { getMyProfile, getStartup } from "@/lib/api";
import { TERMS_HINT, plural } from "@/lib/labels";
import { getMe, serverClient } from "@/lib/server-api";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const { data } = await getStartup({ client: await serverClient(), path: { slug } });
  if (!data) return { title: "Стартап не найден" };
  const roles = data.open_roles.map((r) => r.title).join(", ");
  return {
    title: data.title,
    description: `${data.pitch}${roles ? `. Ищут: ${roles}` : ""}`,
    openGraph: { title: data.title, description: data.pitch },
    alternates: { canonical: `/startups/${data.slug}` },
  };
}

export default async function StartupPage({ params }: Props) {
  const { slug } = await params;
  const client = await serverClient();
  const [{ data: s }, user] = await Promise.all([getStartup({ client, path: { slug } }), getMe()]);
  if (!s) notFound();
  const profile = user ? (await getMyProfile({ client })).data : null;
  const mySkills = new Set(profile?.skills.map((x) => x.slug));
  const ready = !!user?.email_verified && !!profile?.is_published;

  return (
    <Container>
      <Link href="/startups" className="text-sm font-semibold text-muted-foreground hover:text-foreground">
        ← Все стартапы
      </Link>
      <div className="mt-4 grid gap-8 lg:grid-cols-[1fr_400px]">
        <article className="rounded-3xl border bg-card p-6 sm:p-10">
          <div className="flex flex-wrap gap-2">
            <TermsBadge terms={s.terms} />
            <StageBadge stage={s.stage} />
            <StartupStatusBadge status={s.status} />
          </div>
          <h1 className="mt-4 text-4xl font-extrabold sm:text-5xl">{s.title}</h1>
          <p className="mt-3 text-xl text-muted-foreground">{s.pitch}</p>

          {s.is_owner && (
            <div className="mt-6 flex flex-wrap gap-2 rounded-2xl bg-secondary p-4">
              <span className="mr-auto self-center text-sm font-bold">Это ваш стартап</span>
              <Link href={`/startups/${s.slug}/edit`} className={buttonVariants({ variant: "outline", size: "sm" })}>
                Редактировать
              </Link>
              <Link href={`/me/startups/${s.slug}`} className={buttonVariants({ size: "sm" })}>
                Отклики
              </Link>
            </div>
          )}

          <h2 className="mt-10 text-lg font-extrabold">Идея</h2>
          <p className="mt-2 leading-relaxed whitespace-pre-line text-foreground/85">{s.description || "Описание пока не заполнено."}</p>

          <h2 className="mt-8 text-lg font-extrabold">Условия участия</h2>
          <p className="mt-2 text-sm text-muted-foreground">{TERMS_HINT[s.terms]}</p>
          {s.terms_details && <p className="mt-2 leading-relaxed whitespace-pre-line text-foreground/85">{s.terms_details}</p>}

          <h2 className="mt-8 text-lg font-extrabold">Команда</h2>
          <ul className="mt-3 flex flex-wrap gap-3">
            {s.team.map((m) => {
              const body = (
                <>
                  <PersonAvatar name={m.display_name} />
                  <span>
                    <span className="block font-bold">{m.display_name}</span>
                    <span className="block text-sm text-muted-foreground">{m.role_title}</span>
                  </span>
                </>
              );
              return (
                <li key={m.display_name + m.role_title}>
                  {m.slug ? (
                    <Link href={`/people/${m.slug}`} className="flex items-center gap-3 rounded-xl bg-secondary px-4 py-3 hover:bg-accent">
                      {body}
                    </Link>
                  ) : (
                    <div className="flex items-center gap-3 rounded-xl bg-secondary px-4 py-3">{body}</div>
                  )}
                </li>
              );
            })}
          </ul>

          {(s.website || s.telegram) && (
            <div className="mt-8 flex flex-wrap gap-4 text-sm font-semibold">
              {s.website && (
                <a href={s.website} target="_blank" rel="noopener noreferrer nofollow" className="underline">
                  Сайт проекта
                </a>
              )}
              {s.telegram && <span>Telegram: {s.telegram}</span>}
            </div>
          )}
          <div className="mt-10 border-t pt-4">
            <ReportButton targetType="startup" targetId={s.slug} />
          </div>
        </article>

        <aside className="grid h-fit gap-4 lg:sticky lg:top-24">
          <h2 className="text-2xl font-extrabold">Открытые роли</h2>
          {s.roles.length === 0 && <p className="text-muted-foreground">Роли пока не добавлены.</p>}
          {s.roles.map((r, i) => {
            const matched = r.skills.filter((sk) => mySkills.has(sk.slug)).length;
            const left = r.slots - (r.filled ?? 0);
            const applied = (s.my_active_role_ids ?? []).includes(r.id);
            return (
              <div key={r.id} className={`rounded-2xl border bg-card p-5 ${r.is_open && i === 0 ? "border-foreground" : ""}`}>
                <div className="flex items-start gap-2">
                  <div>
                    <div className="text-lg font-extrabold">{r.title}</div>
                    {r.role.name !== r.title && <div className="text-sm text-muted-foreground">{r.role.name}</div>}
                  </div>
                  <span className="ml-auto shrink-0 text-sm text-muted-foreground">
                    {r.is_open ? `${left} ${plural(left, "место", "места", "мест")}` : "Закрыта"}
                  </span>
                </div>
                {r.description && <p className="mt-2 text-sm text-foreground/80">{r.description}</p>}
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {r.skills.map((sk) => (
                    <SkillChip key={sk.slug} name={sk.name} highlight={mySkills.has(sk.slug)} />
                  ))}
                </div>
                {profile && r.skills.length > 0 && matched > 0 && (
                  <div className="mt-2 text-xs font-bold text-success-ink">
                    Совпадение с твоим профилем: {matched} из {r.skills.length}
                  </div>
                )}
                {r.is_open && !s.is_owner && (
                  <div className="mt-4">
                    <ApplyDialog
                      roleId={r.id}
                      roleTitle={r.title}
                      startupTitle={s.title}
                      primary={i === 0}
                      state={!user ? "guest" : applied ? "applied" : ready ? "can_apply" : "not_ready"}
                    />
                  </div>
                )}
              </div>
            );
          })}
        </aside>
      </div>
    </Container>
  );
}
