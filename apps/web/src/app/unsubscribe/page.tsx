import { Container } from "@/components/domain/page-header";
import { UnsubscribeConfirm } from "@/components/domain/unsubscribe-confirm";

export const metadata = { title: "Отписка от писем", robots: { index: false } };

/**
 * Отписка по ссылке из письма (KAN-74). Отписываем по нажатию кнопки, а не при открытии страницы:
 * почтовые сканеры открывают ссылки сами и иначе отписывали бы людей без их ведома.
 */
export default async function UnsubscribePage({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const { u = "", k = "", t = "" } = await searchParams;
  return (
    <Container className="max-w-xl py-20">
      <UnsubscribeConfirm u={u} k={k} t={t} />
    </Container>
  );
}
