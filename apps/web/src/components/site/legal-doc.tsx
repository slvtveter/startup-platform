import { Container } from "@/components/domain/page-header";
import { fill } from "@/lib/legal/operator";

/** Юридический документ: текст юриста как есть (h2, p, table), оформленный стилями .legal из globals.css. */
export function LegalDoc({ title, html }: { title: string; html: string }) {
  return (
    <Container className="max-w-[56rem] py-16">
      <h1 className="text-[32px] leading-[1.1] sm:text-[36px]">{title}</h1>
      <article className="legal mt-8" dangerouslySetInnerHTML={{ __html: scrollableTables(fill(html)) }} />
    </Container>
  );
}

/** Широкая таблица листается вбок: область фокусируется с клавиатуры (axe scrollable-region-focusable). */
function scrollableTables(html: string) {
  return html.replaceAll("<table>", '<div class="legal-scroll" role="region" aria-label="Таблица" tabindex="0"><table>').replaceAll("</table>", "</table></div>");
}
