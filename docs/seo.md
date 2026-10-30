# SEO и производительность

## Что уже есть
- `sitemap.xml` и `robots.txt` генерируются из API (`src/app/sitemap.ts`, `robots.ts`).
- У страниц стартапа и профиля есть canonical, title и description из данных.
- OG-картинки 1200×630 для стартапа и профиля (`opengraph-image.tsx`, рендер в `src/lib/og.tsx`). Шрифты лежат в `apps/web/assets/og-fonts`, внешних запросов нет.
- **Адреса стабильны:** slug стартапа задаётся при создании и не меняется при переименовании, slug профиля задаётся один раз при первом имени. Поэтому 301 со старых адресов не нужен, это закреплено тестом `test_founder_sees_views_and_urls_stay_stable`. Если когда-нибудь slug станет изменяемым, понадобится таблица редиректов.

- **Посадочные каталогов** (`src/lib/seo.ts`): индексируются `/startups`, `/startups?role=<slug>`, `/startups?stage=idea`, `/people`, `/people?role=<slug>` со своими title и h1. У любой другой комбинации фильтров, поиска и страниц canonical ведёт на ближайшую посадочную. Непустые посадочные попадают в sitemap, подвал ссылается на семь ролей.
- **Вебмастер и Search Console:** коды из мета-тега задаются в `.env.prod` (`YANDEX_VERIFICATION`, `GOOGLE_SITE_VERIFICATION`), тег появляется на главной.

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
