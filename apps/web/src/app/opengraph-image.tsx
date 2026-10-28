import { OG_SIZE, ogImage } from "@/lib/og";

export const size = OG_SIZE;
export const contentType = "image/png";
export const alt = "Envola: здесь стартапы начинаются с разговора";

/** Превью главной в Telegram и соцсетях: заголовок и фото с репликой, как на лендинге. */
export default async function Image() {
  return ogImage({
    title: "Здесь стартапы начинаются с разговора",
    subtitle: "Обсуждай идеи, находи сообщников и вступай в команды стартапов",
    chips: [{ text: "Идеи" }, { text: "Стартапы" }, { text: "Сообщники", accent: true }],
    aside: { kind: "photo" },
  });
}
