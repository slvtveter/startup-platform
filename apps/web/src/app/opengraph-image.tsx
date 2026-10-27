import { OG_SIZE, ogImage } from "@/lib/og";

export const size = OG_SIZE;
export const contentType = "image/png";
export const alt = "Envola: здесь стартапы начинаются с разговора";

/** Превью главной в Telegram и соцсетях: заголовок лендинга «Разговор». */
export default async function Image() {
  return ogImage({
    title: "Здесь стартапы начинаются с разговора",
    subtitle: "Обсуждай идеи, находи сообщников и вступай в стартапы",
    filled: 2,
    open: 1,
    footer: "envola.ru",
  });
}
