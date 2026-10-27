import type { MetadataRoute } from "next";

/** Название и иконка, когда сайт добавляют на главный экран телефона. */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Envola: здесь стартапы начинаются с разговора",
    short_name: "Envola",
    description: "Обсуждай идеи, находи сообщников и вступай в стартапы. Для студентов и начинающих в IT.",
    lang: "ru",
    start_url: "/",
    display: "standalone",
    background_color: "#ffffff",
    theme_color: "#ffffff",
    icons: [
      { src: "/icon.svg", sizes: "any", type: "image/svg+xml" },
      { src: "/apple-icon.png", sizes: "180x180", type: "image/png" },
    ],
  };
}
