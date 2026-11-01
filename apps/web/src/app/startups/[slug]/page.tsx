import { Check, ChevronLeftIcon } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { ApplyDialog, type ApplyState } from "@/components/domain/apply-dialog";
import {
    SkillChip,
  StageBadge,
  StartupStatusBadge,
  TermsBadge,
} from "@/components/domain/badges";
import { Container } from "@/components/domain/page-header";
import { ReportButton } from "@/components/domain/report-button";
import { Avatar } from "@/components/domain/avatar-upload";
import { ShareButton } from "@/components/domain/share-button";
import { StartupCover } from "@/components/domain/startup-card";
import { WriteDialog } from "@/components/domain/chat/write-dialog";
import { TrackView } from "@/components/site/track-view";
import { buttonVariants } from "@/components/ui/button";
import { JsonLd, breadcrumbs, siteUrl } from "@/components/site/json-ld";
import {
  getMyProfile,
  getStartup,
  listRoles,
  type StartupDetail,
} from "@/lib/api";
import { TERMS, TERMS_HINT, plural } from "@/lib/labels";
import { getMe, serverClient } from "@/lib/server-api";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const { data } = await getStartup({
    client: await serverClient(),
    path: { slug },
  });
  if (!data) return { title: "Стартап не найден" };
  const roles = data.open_roles.map((r) => r.title).join(", ");
  return {
    title: data.title,
    description: `${data.pitch}${roles ? `. Ищут: ${roles}` : ""}`,
    openGraph: { title: data.title, description: data.pitch },
    alternates: { canonical: `/startups/${data.slug}` },
    // Примеры (app.scripts.demo) не должны попасть в поиск как настоящие проекты.
    ...(data.is_demo ? { robots: { index: false, follow: true } } : {}),
  };
}

export default async function StartupPage({ params }: Props) {
  const { slug } = await params;
  const client = await serverClient();
  const [{ data: s }, user] = await Promise.all([
    getStartup({ client, path: { slug } }),
    getMe(),
  ]);
  if (!s) notFound();
  const profile = user ? (await getMyProfile({ client })).data : null;
  const mySkills = new Set(profile?.skills.map((x) => x.slug));
  const blockers = profile?.apply_blockers ?? [];
  const needs = {
    name: blockers.includes("Укажите имя"),
    role: blockers.includes("Выберите основную роль"),
    proof: blockers.some((b) => b.startsWith("Добавьте ссылку")),
  };
  const roleOptions = needs.role
    ? ((await listRoles({ client })).data ?? [])
    : [];

  const founder = s.team[0];
  const openRoles = s.roles.filter((r) => r.is_open);
  const closedRoles = s.roles.filter((r) => !r.is_open);
  const openSeats = openRoles.reduce(
    (n, r) => n + Math.max(0, (r.slots ?? 1) - (r.filled ?? 0)),
    0,
  );
  const state = (roleId: string): ApplyState =>
    !user
      ? "guest"
      : (s.my_active_role_ids ?? []).includes(roleId)
        ? "applied"
        : !user.email_verified
          ? "unverified"
          : blockers.length
            ? "incomplete"
            : "can_apply";

  return (
    <Container className="pb-28 lg:pb-10">
      {!s.is_owner && <TrackView name="startup_viewed" slug={s.slug} />}
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@graph": [
            {
              "@type": "Organization",
              name: s.title,
              description: s.pitch,
              url: siteUrl(`/startups/${s.slug}`),
              ...(s.website ? { sameAs: [s.website] } : {}),
            },
            breadcrumbs([
              ["Стартапы", "/startups"],
              [s.title, `/startups/${s.slug}`],
            ]),
          ],
        }}
      />
      <Link
        href="/startups"
        className="inline-flex min-h-6 items-center gap-1 text-sm font-semibold text-muted-foreground transition-colors hover:text-foreground"
      >
        <ChevronLeftIcon className="size-4" /> Все стартапы
      </Link>

      <header className="mt-6 grid gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,0.9fr)] lg:items-center">
        <div className="min-w-0">
          <div className="flex flex-wrap gap-2">
            <StageBadge stage={s.stage} />
            <TermsBadge terms={s.terms} />
            {s.status === "closed" && openSeats === 0 ? (
              <span className="inline-flex items-center rounded-full bg-success-soft px-2.5 py-1 text-xs font-bold text-success-ink">
                Команда собрана
              </span>
            ) : (
              s.status !== "recruiting" && <StartupStatusBadge status={s.status} />
            )}
          </div>
          <h1 className="mt-4 text-[36px] leading-[1.04] wrap-anywhere sm:text-[56px]">{s.title}</h1>
          <p className="mt-4 max-w-[46ch] text-xl wrap-anywhere text-muted-foreground">{s.pitch}</p>
          <div className="mt-6 flex flex-wrap items-center gap-x-4 gap-y-3">
            <span className="flex">
              {s.team.slice(0, 5).map((m, i) => (
                <Avatar
                  key={m.display_name + m.role_title}
                  name={m.display_name}
                  url={m.avatar_url}
                  className={`size-10 rounded-full text-xs shadow-[0_0_0_3px_#fff] ${i ? "-ml-2.5" : ""}`}
                />
              ))}
            </span>
            <span className="text-sm text-muted-foreground">
              <span className="font-semibold text-foreground">{founder?.display_name ?? s.owner_name}</span>
              {s.team.length > 1 ? ` и ещё ${s.team.length - 1}` : ""}
              {openSeats > 0 && (
                <span className="ml-2 rounded-full bg-brand-soft px-2.5 py-1 text-xs font-bold text-brand-ink">
                  {plural(openSeats, `ищут ${openSeats} человека`, `ищут ${openSeats} человека`, `ищут ${openSeats} человек`)}
                </span>
              )}
            </span>
          </div>
          <div className="mt-7 flex flex-wrap gap-2.5">
            {openSeats > 0 && !s.is_owner && !s.is_demo && (
              <a href="#roles" className={buttonVariants({ size: "lg" })}>
                Выбрать место
              </a>
            )}
            {!s.is_owner && !s.is_demo && founder?.slug && (
              user ? (
                <WriteDialog
                  slug={founder.slug}
                  name={founder.display_name}
                  label={s.stage === "idea" ? "Обсудить идею" : "Написать основателю"}
                  className=""
                  draft={`Привет! Посмотрел(а) «${s.title}». Интересно, `}
                />
              ) : (
                <Link href={`/login?next=/startups/${s.slug}`} className={buttonVariants({ variant: "outline", size: "lg" })}>
                  {s.stage === "idea" ? "Обсудить идею" : "Написать основателю"}
                </Link>
              )
            )}
            {!s.is_demo && <ShareButton size="lg" title={s.title} text={s.pitch} path={`/startups/${s.slug}`} />}
            {s.is_demo && (
              <>
                <Link href={s.stage === "idea" ? "/startups?stage=idea" : "/startups"} className={buttonVariants({ size: "lg" })}>
                  {s.stage === "idea" ? "Смотреть идеи" : "Смотреть стартапы"}
                </Link>
                <Link href="/startups/new" className={buttonVariants({ variant: "secondary", size: "lg" })}>
                  Опубликовать свою
                </Link>
              </>
            )}
          </div>
          {s.is_demo && (
            <p className="mt-4 max-w-[52ch] text-sm text-muted-foreground">
              Это пример: так выглядит проект на Envola.
            </p>
          )}
        </div>
        <div className="relative aspect-[16/10] overflow-hidden rounded-[28px] bg-tone sm:rounded-[36px]">
          <StartupCover startup={s} eager sizes="(min-width: 1024px) 600px, 100vw" />
        </div>
      </header>

      {s.is_owner && (
        <section aria-labelledby="owner-h" className="mt-8 rounded-[28px] bg-brand-soft p-5 sm:p-6">
          <div className="flex flex-wrap items-center gap-2">
            <h2 id="owner-h" className="mr-auto text-lg font-extrabold tracking-[-0.02em]">
              Это твой {s.stage === "idea" ? "проект" : "стартап"}: что дальше
            </h2>
            <Link href={`/startups/${s.slug}/edit`} className={buttonVariants({ variant: "light", size: "sm" })}>
              Редактировать
            </Link>
            <Link href={`/me/startups/${s.slug}`} className={buttonVariants({ size: "sm" })}>
              Отклики
            </Link>
          </div>
          {s.status === "draft" && (
            <p className="mt-4 rounded-2xl bg-white p-4 text-sm">
              <b>Это черновик, его видишь только ты.</b> Подтверди почту и опубликуй проект в редакторе.
              {" "}
              <Link href={`/startups/${s.slug}/edit`} className="font-bold text-brand-ink hover:underline">
                Перейти к публикации
              </Link>
            </p>
          )}
          <ol className="mt-4 grid gap-2 sm:grid-cols-3">
            <li className="rounded-2xl bg-white p-4">
              <b className="block">{s.cover_url ? "Обложка есть" : "Добавь обложку"}</b>
              <span className="mt-1 block text-sm text-muted-foreground">
                {s.cover_url ? "Поменять её можно в редакторе." : "Фото продукта или команды."}
              </span>
              {!s.cover_url && (
                <Link href={`/startups/${s.slug}/edit`} className="mt-2 inline-block text-sm font-bold text-brand-ink hover:underline">
                  Загрузить фото
                </Link>
              )}
            </li>
            <li className="rounded-2xl bg-white p-4">
              <b className="block">Напиши людям первым</b>
              <span className="mt-1 block text-sm text-muted-foreground">Подборка тех, чья роль совпадает с открытыми местами.</span>
              <Link
                href={`/people?${[...new Set(openRoles.map((r) => `role=${r.role.slug}`))].join("&")}`}
                className="mt-2 inline-block text-sm font-bold text-brand-ink hover:underline"
              >
                Найти людей
              </Link>
            </li>
            <li className="rounded-2xl bg-white p-4">
              <b className="block">Поделись ссылкой</b>
              <span className="mt-1 block text-sm text-muted-foreground">Например, в чате курса или вуза.</span>
              <span className="mt-2 inline-block">
                <ShareButton title={s.title} text={s.pitch} path={`/startups/${s.slug}`} />
              </span>
            </li>
          </ol>
        </section>
      )}

      {/* Факты одной полосой под шапкой: условия, отклик команды, места. Без отдельной колонки справа. */}
      <dl className="mt-10 grid gap-px overflow-hidden rounded-[28px] bg-border shadow-[0_0_0_1px_var(--border)] sm:grid-cols-3">
        <div className="bg-white p-5 sm:p-6">
          <dt className="text-sm text-muted-foreground">Условия</dt>
          <dd className="mt-1 text-lg font-extrabold tracking-[-0.02em]">{TERMS[s.terms]}</dd>
          <dd className="mt-1 text-sm whitespace-pre-line wrap-anywhere text-foreground/80">{s.terms_details || TERMS_HINT[s.terms]}</dd>
        </div>
        <div className="bg-white p-5 sm:p-6">
          <dt className="text-sm text-muted-foreground">Свободные места</dt>
          <dd className="mt-1 text-lg font-extrabold tracking-[-0.02em]">
            {openSeats > 0 ? plural(openSeats, `${openSeats} место`, `${openSeats} места`, `${openSeats} мест`) : "Все заняты"}
          </dd>
          {openRoles.length > 0 && <dd className="mt-1 text-sm text-foreground/80">{openRoles.map((r) => r.title).join(", ")}</dd>}
        </div>
        <div className="bg-white p-5 sm:p-6">
          <dt className="text-sm text-muted-foreground">Как команда отвечает</dt>
          <dd className="mt-1 text-lg font-extrabold tracking-[-0.02em]">{s.response_stats ? responseHead(s.response_stats) : "Новая команда"}</dd>
          <dd className="mt-1 text-sm text-foreground/80">{s.response_stats ? responseText(s.response_stats) : "Статистики откликов пока нет"}</dd>
        </div>
      </dl>

      <div className="mt-14 max-w-[960px]">
          {s.stage === "idea" && <About s={s} title="Идея" className="mb-14" />}
          <section id="roles" className="scroll-mt-24">
            <h2 className="text-[28px] sm:text-[36px]">Свободные места</h2>
            {openRoles.length === 0 && (
              <p className="mt-3 text-muted-foreground">
                Сейчас все места заняты.
              </p>
            )}
            <div className="mt-6 space-y-3">
              {openRoles.map((r) => {
                const matched = r.skills.filter((sk) => mySkills.has(sk.slug)).length;
                const left = Math.max(0, (r.slots ?? 1) - (r.filled ?? 0));
                const meta = [
                  r.role.name !== r.title && r.role.name,
                  r.hours_per_week ? `${r.hours_per_week} ч в неделю` : null,
                  TERMS[s.terms],
                  plural(left, `${left} место`, `${left} места`, `${left} мест`),
                ].filter(Boolean);
                return (
                  <article key={r.id} className="rounded-[28px] bg-white p-5 shadow-[0_0_0_1px_var(--border)] sm:p-7">
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
                      <div className="min-w-0 flex-1">
                        <h3 className="text-2xl leading-tight font-extrabold tracking-[-0.03em]">{r.title}</h3>
                        <p className="mt-1.5 text-muted-foreground">{meta.join(" · ")}</p>
                      </div>
                      {!s.is_owner && !s.is_demo && (
                        <div className="w-full shrink-0 sm:w-auto">
                          <ApplyDialog
                            roleId={r.id}
                            roleTitle={r.title}
                            startupTitle={s.title}
                            primary
                            state={state(r.id)}
                            needs={needs}
                            roles={roleOptions}
                          />
                        </div>
                      )}
                    </div>
                    {(r.description || r.outcome) && (
                      <div className="mt-5 grid gap-5 sm:grid-cols-2 sm:gap-8">
                        {r.description && (
                          <div>
                            <h4 className="text-sm font-bold">Задачи</h4>
                            <p className="mt-1 whitespace-pre-line wrap-anywhere text-foreground/85">{r.description}</p>
                          </div>
                        )}
                        {r.outcome && (
                          <div>
                            <h4 className="text-sm font-bold">Что получишь</h4>
                            <p className="mt-1 whitespace-pre-line wrap-anywhere text-foreground/85">{r.outcome}</p>
                          </div>
                        )}
                      </div>
                    )}
                    {r.skills.length > 0 && (
                      <div className="mt-5 flex flex-wrap items-center gap-1.5">
                        {r.skills.map((sk) => (
                          <SkillChip key={sk.slug} name={sk.name} highlight={mySkills.has(sk.slug)} />
                        ))}
                        {profile && matched > 0 && (
                          <span className="ml-1 inline-flex items-center gap-1 text-xs font-bold text-success-ink">
                            <Check aria-hidden className="size-3.5" strokeWidth={3} />
                            {matched} из {r.skills.length} {plural(r.skills.length, "навыка", "навыков", "навыков")} у тебя есть
                          </span>
                        )}
                      </div>
                    )}
                  </article>
                );
              })}
              {closedRoles.map((r) => (
                <div
                  key={r.id}
                  className="flex items-center gap-4 rounded-2xl bg-tone p-4 text-muted-foreground"
                >
                  <Check aria-hidden className="size-4 shrink-0" />
                  <span className="font-semibold">{r.title}</span>
                  <span className="ml-auto text-sm">Место занято</span>
                </div>
              ))}
            </div>
          </section>

          {s.stage !== "idea" && <About s={s} title="О проекте" className="mt-14" />}

          <section className="mt-14">
            <h2 className="text-[28px] sm:text-[36px]">Команда</h2>
            <ul className="mt-4 grid gap-2 sm:grid-cols-2">
              {s.team.map((m) => {
                const body = (
                  <>
                    <Avatar
                      name={m.display_name}
                      url={m.avatar_url}
                      className="size-12 rounded-full text-sm"
                    />
                    <span>
                      <span className="block font-semibold">
                        {m.display_name}
                      </span>
                      <span className="block text-sm text-muted-foreground">
                        {m.role_title}
                      </span>
                    </span>
                  </>
                );
                return (
                  <li key={m.display_name + m.role_title}>
                    {m.slug ? (
                      <Link
                        href={`/people/${m.slug}`}
                        className="flex items-center gap-3 rounded-2xl bg-tone p-3 transition-colors duration-200 hover:bg-tone-2"
                      >
                        {body}
                      </Link>
                    ) : (
                      <div className="flex items-center gap-3 rounded-2xl bg-tone p-3">{body}</div>
                    )}
                  </li>
                );
              })}
            </ul>
          </section>

          <div className="mt-12 flex flex-wrap items-center gap-4 border-t pt-5 text-sm">
            {s.website && (
              <a
                href={s.website}
                target="_blank"
                rel="noopener noreferrer nofollow"
                className="font-semibold underline underline-offset-4"
              >
                Сайт проекта
              </a>
            )}
            {s.telegram && (
              <a
                href={`https://t.me/${s.telegram.replace(/^@/, "")}`}
                target="_blank"
                rel="noopener noreferrer nofollow"
                className="font-semibold underline underline-offset-4"
              >
                Telegram: {s.telegram}
              </a>
            )}
            {!s.is_owner && (
              <span className="ml-auto">
                <ReportButton targetType="startup" targetId={s.slug} />
              </span>
            )}
          </div>
        </div>


      {openSeats > 0 && !s.is_owner && !s.is_demo && (
        <div className="sticky-cta fixed inset-x-0 bottom-[var(--cookie-offset,0px)] z-30 border-t bg-background/95 px-4 py-3 backdrop-blur lg:hidden">
          <div className="mx-auto flex max-w-[1360px] items-center gap-3">
            <span className="text-sm">
              <span className="block font-semibold">{TERMS[s.terms]}</span>
              <span className="text-muted-foreground">
                {plural(
                  openSeats,
                  `${openSeats} свободное место`,
                  `${openSeats} свободных места`,
                  `${openSeats} свободных мест`,
                )}
              </span>
            </span>
            <a
              href="#roles"
              className={buttonVariants({
                size: "lg",
                className: "ml-auto",
              })}
            >
              Выбрать место
            </a>
          </div>
        </div>
      )}
    </Container>
  );
}

type Stats = NonNullable<StartupDetail["response_stats"]>;

/** «Отвечают на 80%» — коротко для полосы фактов. */
function responseHead(stats: Stats) {
  return `Отвечают на ${Math.round(stats.answered_share * 100)}%`;
}

function responseText(stats: Stats) {
  if (stats.median_hours == null) return "откликов";
  const h = stats.median_hours;
  const when =
    h < 24
      ? `${Math.max(1, Math.ceil(h))} ч`
      : `${Math.round(h / 24)} ${plural(Math.round(h / 24), "день", "дня", "дней")}`;
  return `откликов, обычно за ${when}`;
}

/** Описание: проблема — главный текст, «что уже есть» и «планы» — две карточки под ним. */
function About({ s, title, className }: { s: StartupDetail; title: string; className?: string }) {
  const extra = [
    { title: "Что уже есть", text: s.progress },
    { title: "Планы на 2–3 месяца", text: s.plans },
  ].filter((b) => b.text?.trim());
  return (
    <section className={className}>
      <h2 className="text-[28px] sm:text-[36px]">{title}</h2>
      <p className="mt-4 max-w-[68ch] text-lg leading-relaxed whitespace-pre-line wrap-anywhere text-foreground/85">
        {s.description || "Описание пока не заполнено."}
      </p>
      {extra.length > 0 && (
        <div className="mt-6 grid gap-3 sm:grid-cols-2">
          {extra.map((b) => (
            <div key={b.title} className="rounded-[20px] bg-tone p-5">
              <h3 className="font-sans text-base font-bold tracking-normal">{b.title}</h3>
              <p className="mt-2 whitespace-pre-line wrap-anywhere text-foreground/85">{b.text}</p>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
