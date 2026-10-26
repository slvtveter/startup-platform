import { OG_SIZE, ogImage } from "@/lib/og";

export const size = OG_SIZE;
export const contentType = "image/png";
export const alt = "Envola: первый опыт в IT и команда для стартапа";

/** Превью главной в Telegram и соцсетях: ряд мест, одно ждёт человека — как на лендинге. */
export default async function Image() {
  return ogImage({
    title: "Тебя ждёт место в команде",
    subtitle: "Новички в IT находят стартапы для первого опыта, основатели собирают команду",
    filled: 2,
    open: 1,
    footer: "envola.ru",
  });
}
