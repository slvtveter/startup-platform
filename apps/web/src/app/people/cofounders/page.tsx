import { ArrowRight } from "lucide-react";
import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";

import { DemoNote } from "@/components/domain/badges";
import { PeopleTabs } from "@/components/catalog/people-tabs";
import { Container } from "@/components/domain/page-header";
import { PersonCard } from "@/components/domain/person-card";
import { StartupCard } from "@/components/domain/startup-card";
import { CopyStarter } from "@/components/landing/copy-starter";
import { buttonVariants } from "@/components/ui/button";
import { asList, QuickChips, type SearchParams } from "@/components/domain/filters";
import { listPeople, listRoles, listStartups } from "@/lib/api";
import { plural } from "@/lib/labels";
import { PHOTOS } from "@/lib/photos";
import { getMe, serverClient } from "@/lib/server-api";

export const metadata: Metadata = {
  title: "Сообщники: найди людей, с кем придумать стартап",
  description:
    "Нет идеи, но хочется своё? Здесь собираются разработчики, дизайнеры и маркетологи, которые хотят вместе придумать и запустить стартап.",
};

const STEPS = [
  ["Отметься", "В профиле включи «Ищу сообщников». Идея не нужна: достаточно навыков и желания сделать своё."],
  ["Напиши первым", "Выбери пару человек с другими навыками: разработчику нужен дизайнер, дизайнеру — разработчик и маркетолог."],
  ["Накидайте идеи", "Созвонитесь на полчаса, обсудите, что бесит в жизни и учёбе. Лучшую мысль опубликуйте как идею — она соберёт остальных."],
];

const STARTERS = [
  "Привет! Вижу, ты тоже ищешь, с кем сделать стартап. Мне интересно всё вокруг учёбы и студентов. Созвонимся на 20 минут и накидаем идей?",
  "Привет! Я дизайнер, ищу разработчика, чтобы вместе придумать небольшой продукт и довести до первых пользователей. Как тебе идея?",
  "Привет! Есть пара сырых идей, но хочется обсудить их с кем-то, кто думает иначе. Расскажу в двух словах — интересно?",
];

export default async function CofoundersPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const params = await searchParams;
  const role = asList(params.role);
  const user = await getMe();
  const client = await serverClient();
  const [{ data: people }, { data: ideas }, { data: roles }] = await Promise.all([
    listPeople({ client, query: { cofound: true, role, limit: 24 } }),
    listStartups({ client, query: { stage: ["idea"], limit: 3 } }),
    listRoles({ client }),
  ]);
  const total = people?.total ?? 0;
  const join = user ? "/me/profile" : "/register?next=/me/profile";

  return (
    <>
      <div className="mx-auto w-full max-w-[1360px] px-4 pt-2 sm:px-6 lg:px-10">
        <div className="mb-4 flex flex-wrap items-center gap-x-6 gap-y-3 pt-6">
          <h1 className="text-[32px] leading-[1.05] sm:text-[48px]">Люди</h1>
          <PeopleTabs active="cofounders" cofounders={total} />
        </div>
        <section className="relative isolate grid min-h-[480px] items-end overflow-hidden rounded-[28px] px-5 py-8 text-white sm:rounded-[36px] sm:p-12">
          <Image
            src={PHOTOS.whiteboardDuo}
            alt="Двое обсуждают идеи у доски"
            fill
            preload
            placeholder="blur"
            sizes="(min-width: 1360px) 1360px, 100vw"
            className="-z-20 object-cover object-[center_35%]"
          />
          <div aria-hidden className="absolute inset-0 -z-10 bg-[linear-gradient(90deg,rgb(10_18_34/0.85),rgb(10_18_34/0.45)_60%,rgb(10_18_34/0.15))] max-md:bg-[linear-gradient(180deg,rgb(10_18_34/0.2),rgb(10_18_34/0.85)_55%)]" />
          <div className="max-w-[640px]">
            <p className="text-sm font-bold tracking-wide text-white/80 uppercase">Сообщники</p>
            <h2 className="mt-3 text-[clamp(36px,5vw,68px)] leading-[1.02]">Нет идеи? Найди тех, с кем её придумать</h2>
            <p className="mt-5 max-w-[48ch] text-[clamp(16px,1.4vw,19px)] text-white/90">
              Здесь собираются разработчики, дизайнеры и маркетологи, которые хотят своё, но не хотят делать в одиночку. Познакомься, накидайте
              идеи и запустите лучшую вместе.
            </p>
            <div className="mt-8 flex flex-wrap gap-2.5">
              <Link href={join} className={buttonVariants({ size: "lg" })}>
                Я тоже ищу сообщников
              </Link>
              <Link href="#people" className={buttonVariants({ variant: "onphoto", size: "lg" })}>
                Посмотреть, кто уже здесь
              </Link>
            </div>
          </div>
        </section>
      </div>

      <Container className="pt-16">
        <ol className="grid gap-3 md:grid-cols-3">
          {STEPS.map(([title, text], i) => (
            <li key={title} className="rounded-[28px] bg-tone p-6">
              <span className="grid size-10 place-items-center rounded-full bg-white text-base font-extrabold text-brand-ink">{i + 1}</span>
              <h3 className="mt-5 text-2xl font-extrabold tracking-[-0.03em]">{title}</h3>
              <p className="mt-2 text-muted-foreground">{text}</p>
            </li>
          ))}
        </ol>

        <section id="people" aria-labelledby="people-h" className="scroll-mt-24 pt-16">
          <div className="mb-8 flex flex-wrap items-end gap-x-10 gap-y-3">
            <h2 id="people-h" className="max-w-[16ch] text-[clamp(30px,3.6vw,48px)] leading-[1.04]">
              Ищут сообщников прямо сейчас
            </h2>
            <p className="max-w-[44ch] text-muted-foreground sm:ml-auto">
              {total > 0
                ? `${total} ${plural(total, "человек хочет", "человека хотят", "человек хотят")} придумать стартап с нуля. Напиши тому, чьи навыки дополняют твои.`
                : "Пока никто не отметился. Стань первым — тебе напишут, когда появятся люди с подходящими навыками."}
            </p>
          </div>
          <div className="mb-5">
            <QuickChips basePath="/people/cofounders" params={params} name="role" allLabel="Все роли" options={(roles ?? []).map((r) => ({ value: r.slug, label: r.name }))} />
          </div>
          {people?.items.some((p) => p.is_demo) && (
            <div className="mb-5">
              <DemoNote kind="people" />
            </div>
          )}
          {people && people.items.length > 0 && (
            <ul className="grid grid-cols-1 gap-2 sm:grid-cols-2 sm:gap-3 md:grid-cols-3 xl:grid-cols-4">
              {people.items.map((p) => (
                <PersonCard key={p.slug} person={p} as="li" />
              ))}
            </ul>
          )}
          {total > (people?.items.length ?? 0) && (
            <Link href="/people?cofound=1" className={buttonVariants({ variant: "outline", className: "mt-6" })}>
              Все, кто ищет сообщников
              <ArrowRight aria-hidden />
            </Link>
          )}
        </section>

        <section aria-labelledby="starters-h" className="pt-20">
          <div className="grid gap-8 rounded-[36px] bg-brand-soft p-6 sm:p-10 lg:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)]">
            <div>
              <h2 id="starters-h" className="text-[clamp(28px,3.2vw,42px)] leading-[1.05]">
                Не знаешь, с чего начать разговор?
              </h2>
              <p className="mt-4 max-w-[40ch] text-muted-foreground">
                Возьми готовое первое сообщение и поправь под себя. Короткое и честное сообщение работает лучше длинного письма.
              </p>
            </div>
            <ul className="grid gap-2.5">
              {STARTERS.map((t) => (
                <li key={t}>
                  <CopyStarter text={t} />
                </li>
              ))}
            </ul>
          </div>
        </section>

        {ideas && ideas.items.length > 0 && (
          <section aria-labelledby="ideas-h" className="pt-20">
            <div className="mb-8 flex flex-wrap items-end gap-x-10 gap-y-3">
              <h2 id="ideas-h" className="max-w-[18ch] text-[clamp(30px,3.6vw,48px)] leading-[1.04]">
                Или подключись к идее, которая уже есть
              </h2>
              <Link href="/ideas" className="inline-flex items-center gap-1.5 font-bold text-brand-ink hover:underline sm:ml-auto">
                Все идеи
                <ArrowRight aria-hidden className="size-4" />
              </Link>
            </div>
            <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {ideas.items.map((s) => (
                <StartupCard key={s.id} startup={s} as="li" />
              ))}
            </ul>
          </section>
        )}
      </Container>
    </>
  );
}
