import { ChevronLeftIcon } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { SkillChip } from "@/components/domain/badges";
import { InviteDialog, type InviteOption } from "@/components/domain/invite-dialog";
import { Container } from "@/components/domain/page-header";
import { ReportButton } from "@/components/domain/report-button";
import { initialsOf, Seat } from "@/components/domain/seats";
import { buttonVariants } from "@/components/ui/button";
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
    p.primary_role?.name ?? "Роль не указана",
    p.experience_level && LEVEL[p.experience_level].toLowerCase(),
    p.city,
  ].filter(Boolean);
  const experience = p.memberships ?? [];
  const month = new Intl.DateTimeFormat("ru-RU", { month: "long", year: "numeric" });

  return (
    <Container>
      <Link href="/people" className="inline-flex items-center gap-1 text-sm font-semibold text-muted-foreground hover:text-foreground">
        <ChevronLeftIcon className="size-4" /> Все люди
      </Link>

      <div className="mt-6 grid gap-10 lg:grid-cols-[1fr_320px]">
        <div className="min-w-0">
          <header className="flex flex-col gap-5 sm:flex-row sm:items-center">
            <Seat filled initials={initialsOf(p.display_name)} className="size-20 rounded-2xl text-2xl" />
            <div className="min-w-0">
              <h1 className="text-[30px] leading-tight sm:text-[40px]">{p.display_name}</h1>
              <p className="mt-1 text-lg text-muted-foreground">{facts.join(", ")}</p>
            </div>
          </header>
          {p.headline && <p className="mt-6 max-w-2xl text-xl font-semibold">{p.headline}</p>}
          {p.bio && <p className="mt-3 max-w-2xl leading-relaxed whitespace-pre-line text-foreground/85">{p.bio}</p>}

          <section className="mt-10">
            <h2 className="text-xl sm:text-2xl">Опыт на платформе</h2>
            {experience.length ? (
              <ol className="mt-4 divide-y border-y">
                {experience.map((m) => (
                  <li key={m.startup_slug + m.role_title} className="flex flex-wrap items-baseline gap-x-4 gap-y-1 py-4">
                    <Link href={`/startups/${m.startup_slug}`} className="font-semibold hover:text-brand-ink">
                      {m.startup_title}
                    </Link>
                    <span className="text-muted-foreground">{m.role_title}</span>
                    <span className="ml-auto text-sm text-muted-foreground">с {month.format(new Date(m.since)).replace(" г.", "")}</span>
                  </li>
                ))}
              </ol>
            ) : (
              <p className="mt-3 text-muted-foreground">Пока ни одной команды на платформе.</p>
            )}
          </section>

          <section className="mt-10">
            <h2 className="text-xl sm:text-2xl">Навыки</h2>
            <div className="mt-4 flex flex-wrap gap-2">
              {p.skills.length ? p.skills.map((s) => <SkillChip key={s.slug} name={s.name} />) : <span className="text-muted-foreground">Не указаны</span>}
            </div>
          </section>

          {p.links.length > 0 && (
            <section className="mt-10">
              <h2 className="text-xl sm:text-2xl">Работы</h2>
              <ul className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
                {p.links.map((l) => (
                  <li key={l.url}>
                    <a
                      href={l.url}
                      target="_blank"
                      rel="noopener noreferrer nofollow"
                      className="flex h-full flex-col rounded-xl border p-4 transition-colors hover:border-foreground"
                    >
                      <span className="text-sm text-muted-foreground">{LINK_KIND[l.kind]}</span>
                      <span className="mt-1 truncate font-semibold">{domainOf(l.url)}</span>
                      <span className="truncate text-sm text-muted-foreground">{l.url.replace(/^https?:\/\/[^/]+/, "") || "/"}</span>
                    </a>
                  </li>
                ))}
              </ul>
            </section>
          )}

          <div className="mt-12 border-t pt-5 text-sm">
            <ReportButton targetType="profile" targetId={p.slug} />
          </div>
        </div>

        <aside className="h-fit space-y-4 lg:sticky lg:top-24">
          <div className="rounded-2xl bg-secondary p-5">
            <div className="text-sm text-muted-foreground">Ищет проект</div>
            <div className="mt-2 flex flex-wrap gap-2">
              {p.looking_for.length ? (
                p.looking_for.map((t) => (
                  <span key={t} className="rounded-full bg-card px-3 py-1 text-sm font-semibold">
                    {TERMS[t]}
                  </span>
                ))
              ) : (
                <span className="text-sm">Условия не указаны</span>
              )}
            </div>
            {p.availability && (
              <>
                <div className="mt-4 text-sm text-muted-foreground">Время</div>
                <div className="mt-1 font-semibold">{AVAILABILITY[p.availability]}</div>
              </>
            )}
            <div className="mt-5">
              {!user ? (
                <Link href={`/login?next=/people/${p.slug}`} className={buttonVariants({ variant: "brand", className: "w-full" })}>
                  Войти, чтобы пригласить
                </Link>
              ) : user.profile?.slug === p.slug ? (
                <Link href="/me/profile" className={buttonVariants({ variant: "outline", className: "w-full" })}>
                  Редактировать профиль
                </Link>
              ) : options.length > 0 ? (
                <InviteDialog slug={p.slug} name={p.display_name} options={options} />
              ) : (
                <p className="text-sm">
                  Чтобы пригласить, нужен{" "}
                  <Link href="/startups/new" className="font-semibold underline">
                    опубликованный стартап
                  </Link>{" "}
                  со свободным местом.
                </p>
              )}
            </div>
          </div>
          <p className="px-1 text-sm text-muted-foreground">Контакты откроются, если человек примет приглашение в команду.</p>
        </aside>
      </div>
    </Container>
  );
}

function domainOf(url: string) {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return url;
  }
}
