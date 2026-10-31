import Link from "next/link";

import { Container, PageHeader } from "@/components/domain/page-header";
import { GUIDES } from "@/lib/guides";

export const metadata = {
  title: "Гайды: первый опыт в IT, портфолио, команда для стартапа",
  description:
    "Как получить первый опыт в IT без опыта работы, где взять проект для портфолио и как найти сооснователя для стартапа.",
  alternates: { canonical: "/guides" },
};

export default function GuidesPage() {
  return (
    <Container>
      <div className="max-w-4xl">
        <PageHeader
          sticker="star"
          title="Гайды"
          description="Как начать в IT и собрать команду, коротко и по делу."
        />
        <ul className="mt-10 grid gap-4">
          {GUIDES.map((g) => (
            <li key={g.slug}>
              <Link
                href={`/guides/${g.slug}`}
                className="block rounded-3xl bg-tone p-6 transition-colors hover:bg-tone-2 sm:p-8"
              >
                <h2 className="text-2xl font-bold text-balance">{g.title}</h2>
                <p className="mt-3 text-muted-foreground">{g.description}</p>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </Container>
  );
}
