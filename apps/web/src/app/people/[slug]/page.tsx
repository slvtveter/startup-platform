import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { SkillChip } from "@/components/domain/badges";
import { InviteDialog, type InviteOption } from "@/components/domain/invite-dialog";
import { Container } from "@/components/domain/page-header";
import { PersonAvatar } from "@/components/domain/person-card";
import { ReportButton } from "@/components/domain/report-button";
import { getPerson, getStartup, listMyStartups } from "@/lib/api";
import { AVAILABILITY, LEVEL, LINK_KIND, TERMS } from "@/lib/labels";
import { getMe, serverClient } from "@/lib/server-api";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const { data } = await getPerson({ client: await serverClient(), path: { slug } });
  if (!data) return { title: "Профиль не найден" };
  const title = `${data.display_name}${data.primary_role ? `, ${data.primary_role.name.toLowerCase()}` : ""}`;
  return { title, description: data.headline || undefined, alternates: { canonical: `/people/${data.slug}` } };
}

export default async function PersonPage({ params }: Props) {
  const { slug } = await params;
  const client = await serverClient();
  const [{ data: p }, user] = await Promise.all([getPerson({ client, path: { slug } }), getMe()]);
  if (!p) notFound();

  // Варианты приглашения: открытые роли в стартапах, которые сейчас набирают.
  let options: InviteOption[] = [];
  if (user && user.profile?.slug !== p.slug) {
    const { data: mine } = await listMyStartups({ client });
    const recruiting = (mine ?? []).filter((s) => s.status === "recruiting");
    const details = await Promise.all(recruiting.map((s) => getStartup({ client, path: { slug: s.slug } })));
    options = details.flatMap(({ data }) =>
      data ? data.roles.filter((r) => r.is_open).map((r) => ({ roleId: r.id, label: `${data.title}: ${r.title}` })) : [],
    );
  }

  const facts = [
    p.experience_level && LEVEL[p.experience_level],
    p.availability && AVAILABILITY[p.availability],
    p.city,
  ].filter(Boolean);

  return (
    <Container>
      <Link href="/people" className="text-sm font-semibold text-muted-foreground hover:text-foreground">
        ← Все люди
      </Link>
      <div className="mt-4 grid gap-8 lg:grid-cols-[1fr_340px]">
        <article className="rounded-3xl border bg-card p-6 sm:p-10">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
            <PersonAvatar name={p.display_name} size="lg" />
            <div>
              <h1 className="text-3xl font-extrabold sm:text-4xl">{p.display_name}</h1>
              <p className="mt-1 text-lg text-muted-foreground">{p.primary_role?.name ?? "Роль не указана"}</p>
              {facts.length > 0 && <p className="mt-1 text-sm text-muted-foreground">{facts.join(" · ")}</p>}
            </div>
          </div>
          {p.headline && <p className="mt-6 text-xl font-semibold">{p.headline}</p>}
          {p.bio && <p className="mt-4 leading-relaxed whitespace-pre-line text-foreground/85">{p.bio}</p>}

          <h2 className="mt-8 text-lg font-extrabold">Навыки</h2>
          <div className="mt-3 flex flex-wrap gap-2">
            {p.skills.length ? p.skills.map((s) => <SkillChip key={s.slug} name={s.name} />) : <span className="text-muted-foreground">Не указаны</span>}
          </div>

          {p.links.length > 0 && (
            <>
              <h2 className="mt-8 text-lg font-extrabold">Работы</h2>
              <ul className="mt-3 grid gap-2">
                {p.links.map((l) => (
                  <li key={l.url}>
                    <a href={l.url} target="_blank" rel="noopener noreferrer nofollow" className="font-semibold underline decoration-brand underline-offset-4">
                      {LINK_KIND[l.kind]}: {l.url.replace(/^https?:\/\//, "")}
                    </a>
                  </li>
                ))}
              </ul>
            </>
          )}

          {(p.memberships ?? []).length > 0 && (
            <>
              <h2 className="mt-8 text-lg font-extrabold">В командах</h2>
              <ul className="mt-3 grid gap-2">
                {(p.memberships ?? []).map((m) => (
                  <li key={m.startup_slug}>
                    <Link href={`/startups/${m.startup_slug}`} className="font-semibold hover:underline">
                      {m.startup_title}
                    </Link>{" "}
                    <span className="text-muted-foreground">· {m.role_title}</span>
                  </li>
                ))}
              </ul>
            </>
          )}
          <div className="mt-10 border-t pt-4">
            <ReportButton targetType="profile" targetId={p.slug} />
          </div>
        </article>

        <aside className="grid h-fit gap-4 lg:sticky lg:top-24">
          <div className="rounded-2xl border bg-card p-5">
            <div className="text-sm font-extrabold">Готов работать</div>
            <div className="mt-2 flex flex-wrap gap-2">
              {p.looking_for.map((t) => (
                <span key={t} className="rounded-full bg-warn-soft px-3 py-1 text-sm font-bold text-warn-ink">
                  {TERMS[t]}
                </span>
              ))}
            </div>
            <p className="mt-4 text-sm text-muted-foreground">Контакты откроются, если человек примет приглашение в проект.</p>
            <div className="mt-4">
              {!user ? (
                <Link href={`/login?next=/people/${p.slug}`} className="font-bold underline">
                  Войди, чтобы пригласить
                </Link>
              ) : user.profile?.slug === p.slug ? (
                <Link href="/me/profile" className="font-bold underline">
                  Редактировать профиль
                </Link>
              ) : options.length > 0 ? (
                <InviteDialog slug={p.slug} name={p.display_name} options={options} />
              ) : (
                <p className="text-sm">
                  Чтобы пригласить, нужен{" "}
                  <Link href="/startups/new" className="font-bold underline">
                    опубликованный стартап
                  </Link>{" "}
                  с открытой ролью.
                </p>
              )}
            </div>
          </div>
        </aside>
      </div>
    </Container>
  );
}
