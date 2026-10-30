# Каталог событий аналитики

Пишутся в таблицу `events` через `app.services.events.track()` в той же транзакции, что и действие.
Дашборд: `/admin`. Это источник правды по воронке. Яндекс Метрика (с согласия посетителя) дублирует ключевые события как цели, подробнее в `docs/analytics.md`.

| Событие | Когда | entity | props |
|---|---|---|---|
| `signup` | регистрация | user | `method`, `utm_source` (из `?utm_source=` или `?ref=`) |
| `email_verified` | подтвердил почту | user | |
| `email_changed` | подтвердил новый адрес почты (KAN-72) | user | |
| `startup_claimed` | получил стартап, перенесённый админом на его email (KAN-75) | startup | |
| `profile_completed` | заполненность профиля перешла порог 80% | profile | `completeness` |
| `profile_published` | опубликовал профиль | profile | |
| `startup_created` | создал черновик стартапа | startup | |
| `startup_published` | опубликовал стартап | startup | |
| `application_sent` | откликнулся на роль | startup_role | `startup_id` |
| `invite_sent` | основатель пригласил человека | startup_role | `startup_id` |
| `application_answered` | ответ на отклик/приглашение | application | `accepted`, `hours`, `direction` |
| `team_assembled` | заняли последнее свободное место, набор закрылся сам (KAN-99) | startup | |
| `contacts_exchanged` | знакомство состоялось (принят отклик или приглашение) | application | `startup_id` |
| `landing_viewed` | показ лендинга гостю (знаменатель H1, H2), с клиента | | |
| `startup_viewed` | показ страницы стартапа не владельцу (H3), с клиента | | `slug` |
| `digest_sent` | воркер отправил еженедельную подборку ролей (KAN-107) | user | `roles` — сколько ролей в письме, `week` — ISO-неделя (защита от повтора) |
| `chat_started` | человек начал новый диалог с профиля в «Людях» (KAN-127). Диалоги из откликов не считаются, это `application_sent` | user | `entity_id` — кому написали |
| `apply_started` | открыт диалог отклика (H4), с клиента | | |
| `landing_path_selected` | клик по дороге на лендинге (гипотеза H2): «Создать профиль», «Опубликовать идею», карточки «Есть идея» и «Хочу в команду»; пишется с клиента через `POST /api/events` | | `path`: `seeker` / `founder` |
| `recommendation_shown` | стартап показан в блоке «Подходят тебе» | startup | |

**Главная метрика фазы 1** — `contacts_exchanged` и доля откликов с ответом за 72 часа.

События «с клиента» принимает `POST /api/events` только из белого списка (`ClientEventIn`). Панель гипотез H1–H8: `/admin`, эндпоинт `GET /api/admin/hypotheses`.

**Защита от накрутки (KAN-95):** у каждого клиентского события в `props.v` лежит хеш посетителя: `sha256(EVENTS_SALT | IP | дата)`, первые 24 символа. Сам IP не хранится. Лимит — `CLIENT_EVENTS_PER_MINUTE` (60) на посетителя. `landing_viewed` и `startup_viewed` записываются не чаще раза в 30 минут на посетителя и страницу.

Переход из письма-подборки: у `startup_viewed` появляется `src = "digest"` (ссылки в письме несут `?src=digest`). Клики подборки = `startup_viewed` с `src = digest` за неделю после `digest_sent`.

## Индексы и нагрузка (KAN-105)
Запросы по `props` идут через индексы на выражения:
- `(props->>'v', created_at)` — лимит и дедупликация клиентских событий;
- `(name, props->>'slug', created_at)` — просмотры стартапа;
- `(user_id, name, created_at)` — когорты.

Новый запрос к `events` с фильтром по `props` — сначала проверьте план на синтетике: `uv run python -m app.scripts.perf_seed` (100 тыс. событий, только local), затем `EXPLAIN ANALYZE`.
