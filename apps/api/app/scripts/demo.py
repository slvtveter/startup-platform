"""Примеры для пустого прода: 3 стартапа и 7 человек с пометкой «Пример» (app.core.demo).

  python -m app.scripts.demo add      — создать (идемпотентно)
  python -m app.scripts.demo remove   — удалить всё демо вместе с аватарами

Люди и проекты выдуманы. Почта @demo.invalid: войти нельзя, письма туда не уходят,
откликнуться, пригласить или написать нельзя.
"""

import asyncio
import io
import random
import secrets
import sys
from datetime import UTC, datetime, timedelta

from PIL import Image, ImageDraw, ImageFilter
from sqlalchemy import select

from app.core.demo import DEMO_EMAIL_DOMAIN
from app.db.session import SessionLocal
from app.models import Profile, ProfileLink, Startup, StartupRole, User
from app.models.enums import LinkKind, StartupStatus
from app.scripts.catalog import ensure_catalog
from app.services.avatars import SIZES
from app.services.slug import unique_slug
from app.services.storage import get_storage

# (логин, имя, роль, уровень, город, заголовок, о себе, навыки, условия, доступность, ссылка)
PEOPLE = [
    (
        "anna-demo",
        "Анна Белова",
        "product",
        None,
        "Москва",
        "Основатель Подсобки: веду продукт и общаюсь с мастерами",
        "8 лет работала аналитиком в ритейле, последние два года — продакт в маркетплейсе услуг. "
        "Ушла делать свой проект, потому что сама полгода искала нормального сантехника. "
        "Отвечаю на отклики в течение дня, созваниваемся по вечерам.",
        ["Unit-экономика", "Интервью-с-пользователями", "Jira", "SQL"],
        [],
        "part_time",
        None,
    ),
    (
        "timur-demo",
        "Тимур Галиев",
        "backend",
        None,
        "Казань",
        "Основатель Конспектума, backend и ML",
        "Python-разработчик, 5 лет в финтехе. Учился в КФУ и видел, как однокурсники фотографируют "
        "доску и потом не могут найти нужное. Делаю сервис, который превращает фото и записи лекций "
        "в конспекты с поиском. Код-ревью и созвоны раз в неделю, помогаю расти.",
        ["Python", "FastAPI", "PostgreSQL", "PyTorch"],
        [],
        "part_time",
        "https://github.com/",
    ),
    (
        "vera-demo",
        "Вера Соколова",
        "marketer",
        None,
        "Санкт-Петербург",
        "Основатель Корешка, книжный маркетинг",
        "Пять лет вела соцсети независимых книжных магазинов Петербурга. Делаю приложение для "
        "обмена бумажными книгами между соседями: уже есть 300 человек в Telegram-чате и бот. "
        "Ищу тех, кто поможет сделать из этого нормальный продукт.",
        ["SMM", "Контент-маркетинг", "Customer-Development"],
        [],
        "few_hours",
        None,
    ),
    (
        "kirill-demo",
        "Кирилл Морозов",
        "frontend",
        "courses",
        "Новосибирск",
        "Frontend-разработчик, React и TypeScript",
        "Закончил курс по фронтенду, сделал три учебных проекта: трекер привычек, клон Trello и лендинг "
        "для знакомой студии йоги (он реально работает). Хочу попасть в команду, где будет код-ревью "
        "и настоящие пользователи. Могу 15 часов в неделю, по вечерам и в выходные.",
        ["React", "TypeScript", "Next.js", "Git"],
        ["free", "equity"],
        "part_time",
        "https://github.com/",
    ),
    (
        "polina-demo",
        "Полина Орлова",
        "designer",
        "internship",
        "Москва",
        "Продуктовый дизайнер, после стажировки в банке",
        "Три месяца стажировалась в команде мобильного банка: делала экраны переводов и проводила "
        "юзабилити-тесты. Хочу собрать в портфолио продукт с нуля — от интервью до готовых экранов. "
        "Люблю дизайн-системы и аккуратные состояния ошибок.",
        ["Figma", "UX-исследования", "Прототипирование", "Дизайн-системы"],
        ["free", "paid", "equity"],
        "part_time",
        "https://www.behance.net/",
    ),
    (
        "denis-demo",
        "Денис Ахмедов",
        "analyst",
        "courses",
        "Екатеринбург",
        "Аналитик данных: SQL, pandas, дашборды",
        "Учусь на прикладной математике, параллельно прошёл курс по аналитике. Собирал дашборд "
        "по продажам для семейного магазина и разбирал открытые данные о метро. Хочу в команду, "
        "где решения принимают по цифрам, а не по ощущениям.",
        ["SQL", "pandas", "Статистика", "Power-BI"],
        ["free", "equity"],
        "few_hours",
        "https://github.com/",
    ),
    (
        "sabina-demo",
        "Сабина Юсупова",
        "smm",
        "no_experience",
        "Онлайн",
        "SMM и тексты, ищу первый проект",
        "Студентка журфака, веду свой книжный блог на 2 тысячи подписчиков. Умею писать короткие "
        "понятные тексты и снимать рилсы на телефон. Хочу первый настоящий кейс для портфолио и "
        "команду, у которой можно учиться.",
        ["SMM", "Копирайтинг", "Контент-маркетинг"],
        ["free"],
        "few_hours",
        None,
    ),
]

# (логин основателя, название, питч, стадия, условия, детали условий, описание, роли)
STARTUPS = [
    (
        "anna-demo",
        "Подсобка",
        "Мастера на час с честными ценами и отзывами соседей",
        "mvp",
        "mixed",
        "10 000 ₽ в месяц за part-time и доля до 1,5% после первых продаж, вестинг на 2 года.",
        "Сервис, где жители дома находят проверенных мастеров: сантехников, электриков, сборщиков "
        "мебели. Цена известна заранее, отзывы оставляют только соседи по дому.\n\n"
        "Сейчас работаем в двух районах Москвы, за три месяца прошло 140 заказов. Сайт на Next.js, "
        "заявки пока обрабатываем вручную. Следующий шаг — личный кабинет мастера и онлайн-оплата.",
        [
            (
                "frontend",
                "Frontend-разработчик",
                "Личный кабинет мастера: расписание, заказы, выплаты",
                ["React", "TypeScript", "Next.js"],
                12,
            ),
            (
                "designer",
                "Продуктовый дизайнер",
                "Сценарий заказа и кабинет мастера, от интервью до макетов",
                ["Figma", "UX-исследования"],
                8,
            ),
        ],
    ),
    (
        "timur-demo",
        "Конспектум",
        "Фото доски и запись лекции превращаются в конспект с поиском",
        "prototype",
        "equity",
        "Доля до 3% с вестингом на 2 года, 8–10 часов в неделю. Код-ревью от основателя.",
        "Студент фотографирует доску или записывает лекцию, а Конспектум распознаёт текст и формулы, "
        "делит по темам и даёт искать по всему семестру.\n\n"
        "Есть прототип: распознавание на открытых моделях и простой веб-интерфейс, пользуются "
        "60 студентов КФУ. Хотим к сессии выпустить мобильное приложение и разобраться в метриках.",
        [
            (
                "mobile",
                "Mobile-разработчик",
                "Приложение на Flutter: съёмка, загрузка, просмотр конспекта",
                ["Flutter"],
                10,
            ),
            (
                "analyst",
                "Аналитик данных",
                "Воронка и удержание студентов, A/B-тесты онбординга",
                ["SQL", "A/B-тесты"],
                6,
            ),
        ],
    ),
    (
        "vera-demo",
        "Корешок",
        "Обмен бумажными книгами между соседями",
        "idea",
        "free",
        "Без оплаты: кейс в портфолио, рекомендация и упоминание в команде на сайте.",
        "Люди отдают прочитанные книги и забирают новые у соседей, без доставки и денег. Сейчас это "
        "Telegram-чат на 300 человек в Петербурге и бот, который ведёт список книг.\n\n"
        "Хотим понять, нужно ли отдельное приложение, и запустить второй город. Нужны люди, которые "
        "помогут с исследованием, контентом и первой версией продукта.",
        [
            (
                "smm",
                "SMM-специалист",
                "Telegram-канал и VK: истории обменов и книжные подборки",
                ["SMM", "Копирайтинг"],
                5,
            ),
            (
                "product",
                "Продакт-менеджер",
                "Интервью с участниками и план запуска второго города",
                ["Интервью-с-пользователями"],
                6,
            ),
        ],
    ),
]

OUTCOME = {
    "free": "Кейс в портфолио, рекомендация от основателя и опыт работы в команде",
    "paid": "Оплата за задачи и кейс в портфолио",
    "equity": "Доля в проекте с вестингом и кейс в портфолио",
    "mixed": "Небольшая оплата сейчас и доля после первых продаж",
}

PALETTES = [
    ("#1f3a5f", "#f2b880", "#5fa8d3"),
    ("#3d2c4e", "#e8a0bf", "#f7d488"),
    ("#2f4f3a", "#c5e1a5", "#f4a261"),
    ("#5a2a27", "#f6bd60", "#84a59d"),
    ("#22333b", "#c6ac8f", "#9ad1d4"),
    ("#403d58", "#fc7753", "#66d7d1"),
    ("#264653", "#e9c46a", "#e76f51"),
]


def _avatar(seed: str, palette: tuple[str, str, str]) -> bytes:
    """Абстрактная аватарка: мягкие пятна на цветном фоне, у каждого человека своя."""
    rnd = random.Random(seed)
    size = 512
    img = Image.new("RGB", (size, size), palette[0])
    draw = ImageDraw.Draw(img)
    for color in (palette[1], palette[2], palette[1]):
        r = rnd.randint(120, 260)
        x, y = rnd.randint(0, size), rnd.randint(0, size)
        draw.ellipse((x - r, y - r, x + r, y + r), fill=color)
    img = img.filter(ImageFilter.GaussianBlur(40))
    buf = io.BytesIO()
    img.save(buf, "PNG")
    return buf.getvalue()


def _save_avatar(profile: Profile, png: bytes) -> None:
    storage = get_storage()
    key = f"avatars/{profile.id}-{secrets.token_hex(4)}"
    with Image.open(io.BytesIO(png)) as img:
        for size in SIZES:
            buf = io.BytesIO()
            img.resize((size, size), Image.Resampling.LANCZOS).save(buf, "WEBP", quality=85)
            storage.save(f"{key}-{size}.webp", buf.getvalue())
    profile.avatar_key = key


async def add() -> None:
    async with SessionLocal() as db:
        roles, skills = await ensure_catalog(db)
        users: dict[str, User] = {}
        for i, (
            login,
            name,
            role,
            level,
            city,
            headline,
            bio,
            skill_names,
            looking,
            avail,
            link,
        ) in enumerate(PEOPLE):
            email = f"{login}@{DEMO_EMAIL_DOMAIN}"
            user = await db.scalar(select(User).where(User.email == email))
            if user is None:
                # Пароля нет: в демо-аккаунт нельзя войти.
                user = User(email=email, password_hash=None, email_verified_at=datetime.now(UTC))
                user.profile = Profile(
                    slug=await unique_slug(db, Profile, name),
                    display_name=name,
                    headline=headline,
                    bio=bio,
                    primary_role_id=roles[role].id,
                    experience_level=level,
                    availability=avail,
                    looking_for=looking,
                    city=city,
                    show_email=False,
                    is_published=True,
                    skills=[skills[s] for s in skill_names],
                    links=[
                        ProfileLink(
                            kind=LinkKind.github if "github" in link else LinkKind.behance, url=link
                        )
                    ]
                    if link
                    else [],
                )
                db.add(user)
                await db.flush()
                _save_avatar(user.profile, _avatar(login, PALETTES[i % len(PALETTES)]))
            users[login] = user

        now = datetime.now(UTC)
        for i, (login, title, pitch, stage, terms, details, desc, role_rows) in enumerate(STARTUPS):
            owner = users[login]
            # Свой стартап у демо-основателя уже есть — не дублируем. Адрес уникальный: настоящий
            # стартап с тем же названием мог появиться раньше.
            if await db.scalar(
                select(Startup.id).where(Startup.owner_id == owner.id, Startup.title == title)
            ):
                continue
            s = Startup(
                owner_id=owner.id,
                title=title,
                slug=await unique_slug(db, Startup, title),
                pitch=pitch,
                description=desc,
                stage=stage,
                terms=terms,
                terms_details=details,
                status=StartupStatus.recruiting,
                published_at=now - timedelta(days=i * 3 + 2),
            )
            s.roles = [
                StartupRole(
                    role_id=roles[r].id,
                    title=t,
                    description=d,
                    slots=1,
                    hours_per_week=h,
                    outcome=OUTCOME[terms],
                    skills=[skills[x] for x in sk],
                )
                for r, t, d, sk, h in role_rows
            ]
            db.add(s)
        await db.commit()
    print(f"demo: {len(PEOPLE)} people, {len(STARTUPS)} startups")


async def remove() -> None:
    async with SessionLocal() as db:
        demo = (
            await db.scalars(select(User).where(User.email.like(f"%@{DEMO_EMAIL_DOMAIN}")))
        ).all()
        keys = [u.profile.avatar_key for u in demo if u.profile and u.profile.avatar_key]
        for u in demo:
            # Стартапы и профили удаляются каскадом вместе с пользователем.
            await db.delete(u)
        await db.commit()
    storage = get_storage()
    for key in keys:
        for size in SIZES:
            storage.delete(f"{key}-{size}.webp")
    print(f"demo removed: {len(demo)} users")


if __name__ == "__main__":
    action = sys.argv[1] if len(sys.argv) > 1 else ""
    if action not in {"add", "remove"}:
        sys.exit("usage: python -m app.scripts.demo add|remove")
    asyncio.run(add() if action == "add" else remove())
