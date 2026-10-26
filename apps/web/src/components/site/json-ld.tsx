/** Структурированные данные для поисковиков (schema.org). `<` экранируем: текст пишут пользователи. */
export function JsonLd({ data }: { data: Record<string, unknown> }) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        __html: JSON.stringify(data).replace(/</g, "\\u003c"),
      }}
    />
  );
}

export function siteUrl(path = "") {
  return (process.env.SITE_URL ?? "http://localhost:8080") + path;
}

export function breadcrumbs(items: [string, string][]) {
  return {
    "@type": "BreadcrumbList",
    itemListElement: items.map(([name, path], i) => ({
      "@type": "ListItem",
      position: i + 1,
      name,
      item: siteUrl(path),
    })),
  };
}
