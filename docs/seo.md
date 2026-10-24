# SEO и производительность

## Что уже есть
- `sitemap.xml` и `robots.txt` генерируются из API (`src/app/sitemap.ts`, `robots.ts`).
- У страниц стартапа и профиля есть canonical, title и description из данных.
- OG-картинки 1200×630 для стартапа и профиля (`opengraph-image.tsx`, рендер в `src/lib/og.tsx`). Шрифты лежат в `apps/web/assets/og-fonts`, внешних запросов нет.
- **Адреса стабильны:** slug стартапа задаётся при создании и не меняется при переименовании, slug профиля задаётся один раз при первом имени. Поэтому 301 со старых адресов не нужен, это закреплено тестом `test_founder_sees_views_and_urls_stay_stable`. Если когда-нибудь slug станет изменяемым, понадобится таблица редиректов.

## Lighthouse (24.10.2026)
Prod-сборка (`compose.prod.yml`, seed-данные), Lighthouse 12.8.2, мобильный профиль по умолчанию:

| Страница | Performance | Accessibility | Best practices | SEO |
|---|---|---|---|---|
| `/` | 95 | 100 | 100 | 100 |
| `/startups` | 96 | 98 | 100 | 100 |
| `/startups/vkusnoryadom` | 96 | 100 | 100 | 100 |
| `/people/mariya-kim` | 96 | 100 | 100 | 100 |

Повторить замер: поднять prod-стек как в CI-джобе `images`, затем
`npx lighthouse@12.8.2 https://localhost/ --chrome-flags="--headless=new --ignore-certificate-errors"`.
