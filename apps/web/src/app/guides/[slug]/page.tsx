import { ArrowRight, ChevronLeftIcon } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { Container } from "@/components/domain/page-header";
import { JsonLd, breadcrumbs, siteUrl } from "@/components/site/json-ld";
import { buttonVariants } from "@/components/ui/button";
import { GUIDES, guideBySlug } from "@/lib/guides";

type Props = { params: Promise<{ slug: string }> };

export function generateStaticParams() {
  return GUIDES.map((g) => ({ slug: g.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const g = guideBySlug((await params).slug);
  if (!g) return { title: "Гайд не найден" };
  return {
    title: g.title,
    description: g.description,
    alternates: { canonical: `/guides/${g.slug}` },
    // openGraph сегмента целиком заменяет общий из layout, поэтому повторяем сайт, язык и картинку.
    openGraph: {
      type: "article",
      siteName: "Envola",
      locale: "ru_RU",
      title: g.title,
      description: g.description,
      images: [
        { url: "/opengraph-image", width: 1200, height: 630, alt: "Envola" },
      ],
    },
  };
}

/** Гайд: короткий ответ сверху, разделы, вопросы. Разметка Article + FAQPage для поиска и нейросетей. */
export default async function GuidePage({ params }: Props) {
  const g = guideBySlug((await params).slug);
  if (!g) notFound();
  const others = GUIDES.filter((o) => o.slug !== g.slug);

  return (
    <Container>
      <div className="max-w-3xl">
        <JsonLd
          data={{
            "@context": "https://schema.org",
            "@graph": [
              {
                "@type": "Article",
                headline: g.title,
                description: g.description,
                datePublished: g.published,
                inLanguage: "ru",
                mainEntityOfPage: siteUrl(`/guides/${g.slug}`),
                author: {
                  "@type": "Organization",
                  name: "Envola",
                  url: siteUrl("/"),
                },
                publisher: {
                  "@type": "Organization",
                  name: "Envola",
                  logo: siteUrl("/brand/logo.svg"),
                },
              },
              {
                "@type": "FAQPage",
                mainEntity: g.faq.map(([q, a]) => ({
                  "@type": "Question",
                  name: q,
                  acceptedAnswer: { "@type": "Answer", text: a },
                })),
              },
              breadcrumbs([
                ["Envola", "/"],
                ["Гайды", "/guides"],
                [g.title, `/guides/${g.slug}`],
              ]),
            ],
          }}
        />
        <Link
          href="/guides"
          className="inline-flex items-center gap-1 text-sm font-semibold text-muted-foreground hover:text-foreground"
        >
          <ChevronLeftIcon aria-hidden className="size-4" />
          Все гайды
        </Link>
        <article className="mt-6">
          <h1 className="text-[32px] leading-[1.05] text-balance sm:text-[44px]">
            {g.title}
          </h1>
          <p className="mt-6 rounded-2xl bg-brand-soft p-5 text-lg sm:p-6">
            {g.answer}
          </p>

          {g.sections.map((s) => (
            <section key={s.h} className="mt-10">
              <h2 className="text-2xl font-bold">{s.h}</h2>
              {s.p?.map((t) => (
                <p key={t} className="mt-4 text-lg text-foreground/80">
                  {t}
                </p>
              ))}
              {s.list && (
                <ul className="mt-4 grid list-disc gap-3 pl-6 text-lg text-foreground/80 marker:text-brand">
                  {s.list.map((t) => (
                    <li key={t}>{t}</li>
                  ))}
                </ul>
              )}
            </section>
          ))}

          <section className="mt-12">
            <h2 className="text-2xl font-bold">Частые вопросы</h2>
            <div className="mt-4 grid gap-3">
              {g.faq.map(([q, a]) => (
                <details
                  key={q}
                  className="group rounded-2xl bg-tone open:bg-brand-soft"
                >
                  <summary className="cursor-pointer list-none p-5 font-bold">
                    {q}
                  </summary>
                  <p className="px-5 pb-5 text-foreground/75">{a}</p>
                </details>
              ))}
            </div>
          </section>

          <div className="mt-12 flex flex-wrap items-center gap-4 rounded-3xl bg-tone p-6 sm:p-8">
            <p className="min-w-56 flex-1 text-lg font-semibold">
              {g.cta.text}
            </p>
            <Link href={g.cta.href} className={buttonVariants({ size: "lg" })}>
              {g.cta.label}
              <ArrowRight aria-hidden />
            </Link>
          </div>
        </article>

        <nav aria-label="Другие гайды" className="mt-12">
          <h2 className="text-xl font-bold">Ещё по теме</h2>
          <ul className="mt-4 grid gap-2">
            {others.map((o) => (
              <li key={o.slug}>
                <Link
                  href={`/guides/${o.slug}`}
                  className="font-semibold underline underline-offset-4 hover:text-brand"
                >
                  {o.title}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </div>
    </Container>
  );
}
