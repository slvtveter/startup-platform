import { ArrowRight } from "lucide-react";
import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";

import { Container } from "@/components/domain/page-header";
import { PersonCard } from "@/components/domain/person-card";
import { StartupCard } from "@/components/domain/startup-card";
import { buttonVariants } from "@/components/ui/button";
import { listPeople, listStartups } from "@/lib/api";
import { plural } from "@/lib/labels";
import { pinned } from "@/lib/pinned";
import { PHOTOS } from "@/lib/photos";
import { getMe, serverClient } from "@/lib/server-api";

export const metadata: Metadata = {
  title: "Сообщники: найди людей, с кем придумать стартап",
  description:
    "Нет идеи, но хочется своё? Здесь собираются разработчики, дизайнеры и маркетологи, которые хотят вместе придумать и запустить стартап.",
  alternates: { canonical: "/people/cofounders" },
};

const STEPS = [
  ["Отметься", "В профиле включи «Ищу сообщников». Идея не нужна: достаточно навыков и желания сделать своё."],
  ["Напиши первым", "Выбери пару человек с другими навыками: разработчику нужен дизайнер, дизайнеру — разработчик и маркетолог."],
  ["Накидайте идеи", "Созвонитесь на полчаса, обсудите, что неудобно в учёбе, работе или быту. Лучшую мысль опубликуйте как идею, чтобы к ней присоединились другие."],
];

export default async function CofoundersPage() {
  const user = await getMe();
  const client = await serverClient();
  const [{ data: people }, { data: ideas }] = await Promise.all([
    listPeople({ client, query: { cofound: true, limit: 100 } }),
    listStartups({ client, query: { stage: ["idea"], limit: 100 } }),
  ]);
  const total = people?.total ?? 0;
  const shown = pinned(people?.items ?? []).slice(0, 2);
  const shownIdeas = pinned(ideas?.items ?? []).slice(0, 3);
  const join = user ? "/me/profile" : "/register?next=/me/profile";

  return (
    <>
      <div className="mx-auto w-full max-w-[1360px] px-4 pt-6 sm:px-6 sm:pt-8 lg:px-10">
        <section className="relative isolate grid min-h-[480px] items-end overflow-hidden rounded-[28px] px-5 py-8 text-white sm:rounded-[36px] sm:p-12">
          <Image
            src={PHOTOS.whiteboardDuo}
            alt="Двое обсуждают идеи у доски"
            fill
            preload
            placeholder="blur"
            quality={85}
            sizes="(max-width: 640px) 220vw, (min-width: 1360px) 1360px, 100vw"
            className="-z-20 object-cover object-[center_35%]"
          />
          <div aria-hidden className="absolute inset-0 -z-10 bg-[linear-gradient(90deg,rgb(10_18_34/0.85),rgb(10_18_34/0.45)_60%,rgb(10_18_34/0.15))] max-md:bg-[linear-gradient(180deg,rgb(10_18_34/0.2),rgb(10_18_34/0.85)_55%)]" />
          <div className="max-w-[640px]">
            <p className="text-sm font-bold tracking-wide text-white/80 uppercase">Сообщники</p>
            <h1 className="mt-3 text-[36px] sm:text-[48px] lg:text-[64px] leading-[1.02]">Нет идеи? Найди тех, с кем её придумать</h1>
            <p className="mt-5 max-w-[48ch] text-base sm:text-lg text-white/90">
              Сообщники — разработчики, дизайнеры и маркетологи, которые хотят запустить свой проект, но не в одиночку. Познакомьтесь,
              обсудите идеи и возьмитесь за лучшую вместе.
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
        <section aria-label="Как это работает" className="pt-4">
          <ol className="grid gap-3 md:grid-cols-3">
          {STEPS.map(([title, text], i) => (
            <li key={title} className="rounded-[28px] bg-tone p-6">
              <span className="grid size-10 place-items-center rounded-full bg-white text-base font-extrabold text-brand-ink">{i + 1}</span>
              <h3 className="mt-5 text-2xl font-extrabold tracking-[-0.03em]">{title}</h3>
              <p className="mt-2 text-muted-foreground">{text}</p>
            </li>
          ))}
          </ol>
        </section>

        <section id="people" aria-labelledby="people-h" className="scroll-mt-24 pt-20">
          <div className="mb-8 flex flex-wrap items-end gap-x-10 gap-y-3">
            <div>
              <h2 id="people-h" className="max-w-[16ch] text-[32px] lg:text-[48px] leading-[1.04]">
                Ищут сообщников прямо сейчас
              </h2>
              <p className="mt-4 max-w-[52ch] text-lg text-muted-foreground">
                {total > 0
                  ? `${total} ${plural(total, "человек хочет", "человека хотят", "человек хотят")} придумать стартап с нуля. Напиши тому, чьи навыки дополняют твои.`
                  : "Пока здесь никого нет. Включи в профиле «Ищу сообщников», и тебя увидят первым."}
              </p>
            </div>
            {total > 0 && (
              <Link href="/people?cofound=1" className="inline-flex items-center gap-1.5 font-bold text-brand-ink hover:underline sm:ml-auto">
                Посмотреть всех
                <ArrowRight aria-hidden className="size-4" />
              </Link>
            )}
          </div>
          {shown.length > 0 && (
            <ul className="grid gap-3">
              {shown.map((p) => (
                <PersonCard key={p.slug} person={p} as="li" />
              ))}
            </ul>
          )}
        </section>

        {shownIdeas.length > 0 && (
          <section aria-labelledby="ideas-h" className="pt-20">
            <div className="mb-8 flex flex-wrap items-end gap-x-10 gap-y-3">
              <h2 id="ideas-h" className="max-w-[18ch] text-[32px] lg:text-[48px] leading-[1.04]">
                Или подключись к идее, которая уже есть
              </h2>
              <Link href="/startups?stage=idea" className="inline-flex items-center gap-1.5 font-bold text-brand-ink hover:underline sm:ml-auto">
                Все идеи
                <ArrowRight aria-hidden className="size-4" />
              </Link>
            </div>
            <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {shownIdeas.map((s) => (
                <StartupCard key={s.id} startup={s} as="li" />
              ))}
            </ul>
          </section>
        )}
      </Container>
    </>
  );
}
