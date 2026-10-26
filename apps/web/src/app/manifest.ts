import type { MetadataRoute } from "next";

/** Название и иконка, когда сайт добавляют на главный экран телефона. */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Envola: первый опыт в IT и команда для стартапа",
    short_name: "Envola",
    description: "Стажёры и выпускники находят стартапы для первого опыта, а основатели собирают команду.",
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
