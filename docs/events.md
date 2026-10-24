# Каталог событий аналитики

Пишутся в таблицу `events` через `app.services.events.track()` в той же транзакции, что и действие.
Внешних трекеров нет. Дашборд: `/admin`.

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
| `contacts_exchanged` | знакомство состоялось (принят отклик или приглашение) | application | `startup_id` |
| `landing_viewed` | показ лендинга гостю (знаменатель H1, H2), с клиента | | |
| `startup_viewed` | показ страницы стартапа не владельцу (H3), с клиента | | `slug` |
| `apply_started` | открыт диалог отклика (H4), с клиента | | |
| `landing_path_selected` | клик по развилке на лендинге (гипотеза H2), пишется с клиента через `POST /api/events` | | `path`: `seeker` / `founder` |
| `recommendation_shown` | стартап показан в блоке «Подходят тебе» | startup | |

**Главная метрика фазы 1** — `contacts_exchanged` и доля откликов с ответом за 72 часа.

События «с клиента» принимает `POST /api/events` только из белого списка (`ClientEventIn`). Панель гипотез H1–H8: `/admin`, эндпоинт `GET /api/admin/hypotheses`.

**Защита от накрутки (KAN-95):** у каждого клиентского события в `props.v` лежит хеш посетителя: `sha256(EVENTS_SALT | IP | дата)`, первые 24 символа. Сам IP не хранится. Лимит — `CLIENT_EVENTS_PER_MINUTE` (60) на посетителя. `landing_viewed` и `startup_viewed` записываются не чаще раза в 30 минут на посетителя и страницу.
