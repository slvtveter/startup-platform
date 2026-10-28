import { Check, ChevronLeftIcon } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { ApplyDialog, type ApplyState } from "@/components/domain/apply-dialog";
import {
  DemoBadge,
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
              s.stage === "idea" ? ["Идеи", "/ideas"] : ["Стартапы", "/startups"],
              [s.title, `/startups/${s.slug}`],
            ]),
          ],
        }}
      />
      <Link
        href={s.stage === "idea" ? "/ideas" : "/startups"}
        className="inline-flex items-center gap-1 text-sm font-semibold text-muted-foreground transition-colors hover:text-foreground"
      >
        <ChevronLeftIcon className="size-4" /> {s.stage === "idea" ? "Все идеи" : "Все стартапы"}
      </Link>

      <header className="mt-6 grid gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,0.9fr)] lg:items-center">
        <div className="min-w-0">
          <div className="flex flex-wrap gap-2">
            <StageBadge stage={s.stage} />
            <TermsBadge terms={s.terms} />
            {s.is_demo && <DemoBadge />}
            {s.status === "closed" && openSeats === 0 ? (
              <span className="inline-flex items-center rounded-full bg-success-soft px-2.5 py-1 text-xs font-bold text-success-ink">
                Команда собрана
              </span>
            ) : (
              s.status !== "recruiting" && <StartupStatusBadge status={s.status} />
            )}
          </div>
          <h1 className="mt-4 text-[36px] leading-[1.04] sm:text-[56px]">{s.title}</h1>
          <p className="mt-4 max-w-[46ch] text-xl text-muted-foreground">{s.pitch}</p>
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
            {!s.is_demo && <ShareButton title={s.title} text={s.pitch} path={`/startups/${s.slug}`} />}
            {s.is_demo && (
              <Link href="/startups/new" className={buttonVariants({ size: "lg" })}>
                Сделать такую страницу для своей идеи
              </Link>
            )}
          </div>
          {s.is_demo && (
            <p className="mt-4 max-w-[52ch] text-sm text-muted-foreground">
              Это пример проекта: так выглядит стартап на Envola. Откликнуться на него нельзя — опубликуй свою идею, и
              люди смогут откликаться уже на неё.
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
          <ol className="mt-4 grid gap-2 sm:grid-cols-3">
            <li className="rounded-2xl bg-white p-4">
              <b className="block">{s.cover_url ? "Обложка есть" : "Добавь обложку"}</b>
              <span className="mt-1 block text-sm text-muted-foreground">
                {s.cover_url ? "Её видно в каталоге и на главной." : "С фото карточку открывают заметно чаще, чем с буквой."}
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
              <span className="mt-1 block text-sm text-muted-foreground">В чатах вуза и у друзей — так приходят первые отклики.</span>
              <span className="mt-2 inline-block">
                <ShareButton title={s.title} text={s.pitch} path={`/startups/${s.slug}`} />
              </span>
            </li>
          </ol>
        </section>
      )}

      <div className="mt-14 grid gap-10 lg:grid-cols-[1fr_360px]">
        <div className="min-w-0">
{s.stage === "idea" && (
          <section className="mb-14">
            <h2 className="text-[28px] sm:text-[34px]">Идея</h2>
            <p className="mt-4 max-w-[68ch] text-[17px] leading-relaxed whitespace-pre-line text-foreground/85">
              {s.description || "Описание пока не заполнено."}
            </p>
          </section>
)}
          <section id="roles" className="scroll-mt-24">
            <h2 className="text-[28px] sm:text-[34px]">Свободные места</h2>
            {openRoles.length === 0 && (
              <p className="mt-3 text-muted-foreground">
                Сейчас все места заняты.
              </p>
            )}
            <div className="mt-6 space-y-4">
              {openRoles.map((r) => {
                const matched = r.skills.filter((sk) =>
                  mySkills.has(sk.slug),
                ).length;
                const left = Math.max(0, (r.slots ?? 1) - (r.filled ?? 0));
                return (
                  <article key={r.id} className="overflow-hidden rounded-[28px] bg-white shadow-[0_0_0_1.5px_var(--border)]">
                    {/* Шапка роли: кого ищут и сколько это времени — главное, что нужно понять за секунду. */}
                    <div className="flex flex-wrap items-start gap-x-4 gap-y-3 p-5 sm:p-7 sm:pb-5">
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-bold text-brand-ink">Ищут в команду</p>
                        <h3 className="mt-1 text-[24px] leading-tight font-extrabold tracking-[-0.03em] sm:text-[28px]">{r.title}</h3>
                        <div className="mt-3 flex flex-wrap gap-1.5 text-[13px] font-semibold">
                          <span className="rounded-full bg-brand-soft px-3 py-1 text-brand-ink">
                            {plural(left, `${left} место`, `${left} места`, `${left} мест`)}
                          </span>
                          {r.hours_per_week ? <span className="rounded-full bg-tone px-3 py-1">{r.hours_per_week} ч в неделю</span> : null}
                          {r.role.name !== r.title && <span className="rounded-full bg-tone px-3 py-1">{r.role.name}</span>}
                          <span className="rounded-full bg-tone px-3 py-1">{TERMS[s.terms]}</span>
                        </div>
                      </div>
                      {!s.is_owner && !s.is_demo && (
                        <div className="w-full sm:w-auto">
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
                      <div className="grid gap-px border-t bg-border sm:grid-cols-2">
                        {r.description && (
                          <div className="bg-white p-5 sm:px-7">
                            <div className="text-xs font-bold tracking-wide text-muted-foreground uppercase">Что делать</div>
                            <p className="mt-2 whitespace-pre-line">{r.description}</p>
                          </div>
                        )}
                        {r.outcome && (
                          <div className="bg-brand-soft/60 p-5 sm:px-7">
                            <div className="text-xs font-bold tracking-wide text-brand-ink uppercase">Что получишь</div>
                            <p className="mt-2 whitespace-pre-line">{r.outcome}</p>
                          </div>
                        )}
                      </div>
                    )}
                    {r.skills.length > 0 && (
                      <div className="flex flex-wrap items-center gap-1.5 border-t px-5 py-4 sm:px-7">
                        <span className="mr-1 text-sm text-muted-foreground">Навыки:</span>
                        {r.skills.map((sk) => (
                          <SkillChip key={sk.slug} name={sk.name} highlight={mySkills.has(sk.slug)} />
                        ))}
                        {profile && matched > 0 && (
                          <span className="ml-auto text-xs font-bold text-success-ink">
                            {matched} из {r.skills.length} совпадают с твоими
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
                  className="flex items-center gap-4 rounded-[22px] bg-tone p-4 text-muted-foreground"
                >
                  <Check aria-hidden className="size-4 shrink-0" />
                  <span className="font-semibold">{r.title}</span>
                  <span className="ml-auto text-sm">Место занято</span>
                </div>
              ))}
            </div>
          </section>

{s.stage !== "idea" && (
          <section className="mt-14">
            <h2 className="text-[28px] sm:text-[34px]">О проекте</h2>
            <p className="mt-4 max-w-[68ch] text-[17px] leading-relaxed whitespace-pre-line text-foreground/85">
              {s.description || "Описание пока не заполнено."}
            </p>
          </section>
)}

          <section className="mt-14">
            <h2 className="text-[28px] sm:text-[34px]">Команда</h2>
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
              <span className="font-semibold">Telegram: {s.telegram}</span>
            )}
            <span className="ml-auto">
              <ReportButton targetType="startup" targetId={s.slug} />
            </span>
          </div>
        </div>

        <aside className="h-fit space-y-4 lg:sticky lg:top-24">
          <div className="rounded-[26px] bg-tone p-6">
            <div className="text-sm text-muted-foreground">Условия участия</div>
            <div className="mt-1 text-2xl font-extrabold tracking-[-0.02em]">{TERMS[s.terms]}</div>
            <p className="mt-1 text-sm text-muted-foreground">
              {TERMS_HINT[s.terms]}
            </p>
            {s.terms_details && (
              <p className="mt-3 text-sm whitespace-pre-line">
                {s.terms_details}
              </p>
            )}
            {s.response_stats && (
              <div className="mt-5 border-t border-foreground/10 pt-4">
                <div className="text-sm text-muted-foreground">Как команда отвечает</div>
                <div className="mt-1 font-semibold">{responseText(s.response_stats)}</div>
              </div>
            )}
            {openSeats > 0 && !s.is_owner && !s.is_demo && (
              <a
                href="#roles"
                className={buttonVariants({
                  size: "lg",
                  className: "mt-5 w-full max-lg:hidden",
                })}
              >
                Выбрать место
              </a>
            )}
          </div>
          {!s.is_owner && (
            <div className="rounded-[26px] bg-white p-6 shadow-[0_0_0_1.5px_var(--border)]">
              <div className="text-sm font-bold">Что будет после отклика</div>
              <ol className="mt-3 grid gap-3 text-sm">
                {[
                  ["Пара фраз о себе", "Отклик уходит основателю вместе с твоим профилем."],
                  ["Ответ обычно за 2–3 дня", "Основатель может сразу написать тебе в сообщения."],
                  ["Контакты открываются", "Когда отклик примут, вы видите телеграм и почту друг друга."],
                ].map(([t, d], i) => (
                  <li key={t} className="flex gap-3">
                    <span className="grid size-6 shrink-0 place-items-center rounded-full bg-brand-soft text-xs font-extrabold text-brand-ink">{i + 1}</span>
                    <span>
                      <b className="block">{t}</b>
                      <span className="text-muted-foreground">{d}</span>
                    </span>
                  </li>
                ))}
              </ol>
            </div>
          )}
        </aside>
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

function responseText(stats: StartupDetail["response_stats"]) {
  if (!stats) return "Новая команда, статистики пока нет";
  const share = `Отвечают на ${Math.round(stats.answered_share * 100)}% откликов`;
  if (stats.median_hours == null) return share;
  const h = stats.median_hours;
  const when =
    h < 24
      ? `${Math.max(1, Math.ceil(h))} ч`
      : `${Math.round(h / 24)} ${plural(Math.round(h / 24), "день", "дня", "дней")}`;
  return `${share}, обычно за ${when}`;
}
