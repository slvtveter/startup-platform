import { ArrowRightIcon } from "lucide-react";
import Link from "next/link";

import { Container } from "@/components/domain/page-header";
import { StartupCard } from "@/components/domain/startup-card";
import { buttonVariants } from "@/components/ui/button";
import { listRecommendedStartups, listStartups, publicStats } from "@/lib/api";
import { plural } from "@/lib/labels";
import { getMe, serverClient } from "@/lib/server-api";

export default async function Home() {
  const user = await getMe();
  return user ? <Dashboard /> : <Landing />;
}

async function Landing() {
  const client = await serverClient();
  const [{ data: stats }, { data: feed }] = await Promise.all([
    publicStats({ client }),
    listStartups({ client, query: { limit: 3 } }),
  ]);

  return (
    <>
      <section className="border-b bg-white">
        <Container className="grid gap-12 py-16 lg:grid-cols-[1.35fr_1fr] lg:items-center lg:py-24">
          <div>
            <p className="text-sm font-bold tracking-widest text-brand uppercase">Бесплатно для участников</p>
            <h1 className="mt-4 text-4xl leading-[1.05] font-extrabold sm:text-6xl">
              Первый реальный опыт в&nbsp;IT и команда для твоей идеи
            </h1>
            <p className="mt-6 max-w-xl text-lg text-muted-foreground">
              Везде просят опыт, которого у новичков нет. А основателям не у кого найти первых людей в команду.
              Здесь эти две проблемы решают друг друга.
            </p>
            <div className="mt-8 grid max-w-2xl gap-3 sm:grid-cols-2">
              <Link href="/register" className="group rounded-2xl bg-brand p-6 text-white transition-transform hover:-translate-y-0.5">
                <div className="flex items-center justify-between text-xl font-extrabold">
                  Ищу первый опыт <ArrowRightIcon className="size-5 transition-transform group-hover:translate-x-1" />
                </div>
                <div className="mt-1 text-sm text-white/85">Заполни профиль и откликайся на роли в стартапах</div>
              </Link>
              <Link href="/register?founder=1" className="group rounded-2xl bg-foreground p-6 text-white transition-transform hover:-translate-y-0.5">
                <div className="flex items-center justify-between text-xl font-extrabold">
                  Собираю команду <ArrowRightIcon className="size-5 transition-transform group-hover:translate-x-1" />
                </div>
                <div className="mt-1 text-sm text-white/75">Опиши идею, открой роли и приглашай людей</div>
              </Link>
            </div>
          </div>
          <dl className="grid gap-px overflow-hidden rounded-3xl border bg-border">
            {[
              { n: stats?.startups ?? 0, label: plural(stats?.startups ?? 0, "стартап ищет участников", "стартапа ищут участников", "стартапов ищут участников") },
              { n: stats?.people ?? 0, label: plural(stats?.people ?? 0, "человек в каталоге", "человека в каталоге", "человек в каталоге") },
              // Пока знакомств мало, показываем число открытых ролей: ноль на главной отпугивает.
              stats && stats.intros_30d >= 10
                ? { n: stats.intros_30d, label: plural(stats.intros_30d, "знакомство за месяц", "знакомства за месяц", "знакомств за месяц"), accent: true }
                : { n: stats?.open_roles ?? 0, label: plural(stats?.open_roles ?? 0, "открытая роль ждёт тебя", "открытые роли ждут тебя", "открытых ролей ждут тебя"), accent: true },
            ].map((s) => (
              <div key={s.label} className="bg-white p-7">
                <dt className="sr-only">{s.label}</dt>
                <dd className={`text-5xl font-extrabold ${s.accent ? "text-brand" : ""}`}>{s.n}</dd>
                <dd className="mt-1 text-muted-foreground">{s.label}</dd>
              </div>
            ))}
          </dl>
        </Container>
      </section>

      <Container className="py-16">
        <h2 className="text-2xl font-extrabold sm:text-3xl">Как это работает</h2>
        <ol className="mt-6 grid gap-4 md:grid-cols-3">
          {[
            ["Профиль за 3 минуты", "Роль, навыки, портфолио и на каких условиях ты готов работать: бесплатно, за деньги или за долю."],
            ["Отклик или приглашение", "Откликайся на открытые роли или жди приглашения: основатели ищут людей в каталоге."],
            ["Знакомство", "Контакты открываются только после взаимного согласия. Никакого спама в личку."],
          ].map(([title, text], i) => (
            <li key={title} className="rounded-2xl border bg-card p-6">
              <div className="font-extrabold text-brand">0{i + 1}</div>
              <div className="mt-2 text-lg font-bold">{title}</div>
              <p className="mt-1 text-sm text-muted-foreground">{text}</p>
            </li>
          ))}
        </ol>
      </Container>

      {feed && feed.items.length > 0 && (
        <Container className="py-4">
          <div className="flex items-end">
            <h2 className="text-2xl font-extrabold sm:text-3xl">Свежие стартапы</h2>
            <Link href="/startups" className="ml-auto text-sm font-bold hover:text-brand-ink">
              Все {feed.total} {plural(feed.total, "стартап", "стартапа", "стартапов")} →
            </Link>
          </div>
          <div className="mt-6 grid gap-4 md:grid-cols-3">
            {feed.items.map((s) => (
              <StartupCard key={s.id} startup={s} />
            ))}
          </div>
        </Container>
      )}

      <Container className="py-16">
        <h2 className="text-2xl font-extrabold sm:text-3xl">Частые вопросы</h2>
        <div className="mt-6 grid gap-3 md:grid-cols-2">
          {[
            ["Это бесплатно?", "Да. Регистрация, профиль, отклики и приглашения бесплатны для всех."],
            ["Что значит «работа за долю»?", "Основатель предлагает долю в будущей компании вместо зарплаты. Обычно с вестингом: доля начисляется постепенно, пока ты в проекте. Условия указываются в карточке стартапа."],
            ["Кто увидит мои контакты?", "Только основатель стартапа, чей отклик или приглашение ты принял. В каталоге видны имя, роль и навыки."],
            ["Как защищена моя идея?", "Подробности проекта ты рассказываешь сам и тем, кому решишь. Шаблоны NDA появятся в следующих версиях."],
          ].map(([q, a]) => (
            <details key={q} className="group rounded-2xl border bg-card p-5 open:border-foreground">
              <summary className="cursor-pointer list-none font-bold">
                {q}
                <span className="float-right text-muted-foreground group-open:rotate-45">+</span>
              </summary>
              <p className="mt-3 text-sm text-muted-foreground">{a}</p>
            </details>
          ))}
        </div>
        <div className="mt-12 flex flex-col items-start gap-4 rounded-3xl bg-foreground p-8 text-white sm:flex-row sm:items-center sm:p-10">
          <div>
            <div className="text-2xl font-extrabold">Начни с профиля: это займёт 3 минуты</div>
            <p className="mt-1 text-white/70">Основатели ищут людей в каталоге каждый день.</p>
          </div>
          <Link href="/register" className={buttonVariants({ variant: "brand", size: "lg", className: "sm:ml-auto" })}>
            Создать профиль
          </Link>
        </div>
      </Container>
    </>
  );
}

async function Dashboard() {
  const user = (await getMe())!;
  const client = await serverClient();
  const { data: recs } = await listRecommendedStartups({ client });
  const p = user.profile;
  const name = p?.display_name || user.email.split("@")[0];

  return (
    <Container>
      <h1 className="text-3xl font-extrabold sm:text-4xl">Привет, {name}!</h1>
      <div className="mt-6 grid gap-4 md:grid-cols-3">
        {!user.email_verified && (
          <Notice tone="warn" title="Подтверди email" text="Мы отправили письмо со ссылкой. Без подтверждения нельзя публиковать профиль и откликаться." />
        )}
        {p && !p.is_published && (
          <Notice
            tone="brand"
            title={`Профиль заполнен на ${p.completeness}%`}
            text="Опубликуй профиль, чтобы откликаться на роли и попадать в каталог."
            href="/me/profile"
            cta="Заполнить профиль"
          />
        )}
        {p?.is_published && (
          <Notice tone="ok" title="Профиль опубликован" text="Основатели видят тебя в каталоге людей." href={`/people/${p.slug}`} cta="Как меня видят" />
        )}
      </div>

      <section className="mt-12">
        <div className="flex items-end">
          <div>
            <h2 className="text-2xl font-extrabold">Подходят тебе</h2>
            <p className="mt-1 text-sm text-muted-foreground">Подбор по твоей роли, навыкам и условиям</p>
          </div>
          <Link href="/startups" className="ml-auto text-sm font-bold hover:text-brand-ink">
            Все стартапы →
          </Link>
        </div>
        {recs && recs.length > 0 ? (
          <div className="mt-6 grid gap-4 md:grid-cols-3">
            {recs.map((r) => (
              <div key={r.startup.id} className="flex flex-col">
                <StartupCard startup={r.startup} />
                <div className="mt-2 px-1 text-xs text-muted-foreground">{r.reasons.join(" · ")}</div>
              </div>
            ))}
          </div>
        ) : (
          <div className="mt-6 rounded-2xl border border-dashed bg-card p-8 text-muted-foreground">
            Укажи роль и навыки в{" "}
            <Link href="/me/profile" className="font-bold text-foreground underline">
              профиле
            </Link>
            , и здесь появятся стартапы, которым ты нужен.
          </div>
        )}
      </section>
    </Container>
  );
}

function Notice({
  tone,
  title,
  text,
  href,
  cta,
}: {
  tone: "warn" | "brand" | "ok";
  title: string;
  text: string;
  href?: string;
  cta?: string;
}) {
  const bg = tone === "warn" ? "bg-warn-soft" : tone === "ok" ? "bg-success-soft" : "bg-brand-soft";
  return (
    <div className={`rounded-2xl p-5 ${bg}`}>
      <div className="font-extrabold">{title}</div>
      <p className="mt-1 text-sm text-foreground/75">{text}</p>
      {href && (
        <Link href={href} className={buttonVariants({ size: "sm", className: "mt-4" })}>
          {cta}
        </Link>
      )}
    </div>
  );
}
