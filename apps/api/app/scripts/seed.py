"""Синтетические данные для local/staging: `make seed`. Идемпотентно, реальных данных нет.

Демо-аккаунты (пароль у всех demo12345):
  maria@demo.local   — дизайнер, ищет первый опыт
  alina@demo.local   — основатель ВкусноРядом
  admin@demo.local   — администратор
"""

import asyncio
import random
from datetime import UTC, datetime, timedelta

from sqlalchemy import select

from app.core.security import hash_password
from app.db.session import SessionLocal
from app.models import Application, Profile, ProfileLink, Role, Skill, Startup, StartupRole, User
from app.models.enums import ApplicationDirection, ApplicationStatus, LinkKind, StartupStatus
from app.services.slug import slugify

ROLES = [
    ("frontend", "Frontend-разработчик"),
    ("backend", "Backend-разработчик"),
    ("mobile", "Mobile-разработчик"),
    ("designer", "Дизайнер"),
    ("product", "Продакт-менеджер"),
    ("marketer", "Маркетолог"),
    ("smm", "SMM-специалист"),
    ("analyst", "Аналитик данных"),
    ("ml", "ML-инженер"),
    ("qa", "QA-инженер"),
    ("devops", "DevOps-инженер"),
    ("copywriter", "Копирайтер"),
]

SKILLS = {
    "dev": "Python FastAPI Django JavaScript TypeScript React Next.js Vue Node.js Go Java Kotlin Swift "
    "Flutter PostgreSQL Docker Git Linux REST GraphQL",
    "design": "Figma UX-исследования Прототипирование Дизайн-системы Мобильные-интерфейсы Иллюстрация "
    "Брендинг Motion Tilda Adobe-Illustrator",
    "data": "SQL pandas scikit-learn PyTorch Статистика A/B-тесты Power-BI Excel",
    "marketing": "SMM Таргет-VK SEO Контент-маркетинг Email-маркетинг Аналитика-трафика Копирайтинг "
    "Customer-Development",
    "product": "Jira Roadmap Unit-экономика Интервью-с-пользователями",
}

PEOPLE = [
    (
        "maria",
        "Мария Ким",
        "designer",
        "courses",
        "UI/UX дизайнер, ищу первый реальный проект",
        ["Figma", "UX-исследования", "Прототипирование", "Мобильные-интерфейсы"],
        ["free", "equity"],
    ),
    (
        "egor",
        "Егор Волков",
        "designer",
        "internship",
        "Продуктовый дизайнер после стажировки",
        ["Figma", "Дизайн-системы", "Прототипирование"],
        ["equity", "paid"],
    ),
    (
        "artem",
        "Артём Смирнов",
        "backend",
        "internship",
        "Python-разработчик, люблю чистые API",
        ["Python", "FastAPI", "PostgreSQL", "Docker"],
        ["paid", "equity"],
    ),
    (
        "ilya",
        "Илья Новиков",
        "frontend",
        "courses",
        "Frontend на React, закончил курс",
        ["React", "TypeScript", "Next.js"],
        ["free", "equity"],
    ),
    (
        "dasha",
        "Даша Лебедева",
        "marketer",
        "no_experience",
        "Студентка маркетинга, хочу реальные кейсы",
        ["SMM", "Контент-маркетинг", "Копирайтинг"],
        ["free"],
    ),
    (
        "sonya",
        "Соня Павлова",
        "analyst",
        "courses",
        "Аналитик данных: SQL и дашборды",
        ["SQL", "pandas", "Power-BI", "A/B-тесты"],
        ["free", "paid"],
    ),
    (
        "nikita",
        "Никита Вершинин",
        "mobile",
        "junior",
        "Flutter-разработчик, 1 приложение в сторе",
        ["Flutter", "Kotlin", "Git"],
        ["paid", "equity"],
    ),
    (
        "vera",
        "Вера Гусева",
        "smm",
        "no_experience",
        "Веду соцсети, хочу в стартап",
        ["SMM", "Таргет-VK", "Копирайтинг"],
        ["free", "equity"],
    ),
    (
        "rustam",
        "Рустам Алиев",
        "ml",
        "courses",
        "ML-инженер, классический ML и немного NLP",
        ["Python", "scikit-learn", "PyTorch", "pandas"],
        ["equity"],
    ),
    (
        "katya",
        "Катя Орлова",
        "product",
        "internship",
        "Продакт после стажировки в EdTech",
        ["Jira", "Customer-Development", "Unit-экономика"],
        ["equity", "paid"],
    ),
    (
        "timur",
        "Тимур Рахимов",
        "backend",
        "junior",
        "Backend на Go и Python",
        ["Go", "Python", "PostgreSQL"],
        ["paid"],
    ),
    (
        "oleg",
        "Олег Соколов",
        "marketer",
        "courses",
        "Перформанс-маркетолог, таргет и аналитика",
        ["Таргет-VK", "Аналитика-трафика", "SEO"],
        ["free", "equity"],
    ),
]

STARTUPS = [
    (
        "alina",
        "Алина Белова",
        "ВкусноРядом",
        "Домашняя еда от соседей с доставкой за 30 минут",
        "prototype",
        "equity",
        "Доля от 2 до 5% по вестингу на 2 года после 3 месяцев работы. 10 часов в неделю.",
        "Люди, которые любят готовить, продают порции соседям по дому и району. Мы делаем мобильное "
        "приложение: витрина блюд рядом, заказ в два касания, рейтинг поваров. Есть кликабельный прототип "
        "и 40 поваров в листе ожидания в Казани.",
        [
            (
                "designer",
                "UI/UX дизайнер",
                "Экраны заказа и профиля повара, дизайн-система в Figma",
                ["Figma", "Мобильные-интерфейсы"],
            ),
            (
                "marketer",
                "Маркетолог",
                "Запуск в Казани: поиск поваров и первых заказчиков",
                ["SMM", "Таргет-VK"],
            ),
        ],
    ),
    (
        "kirill",
        "Кирилл Морозов",
        "StudyBuddy",
        "Напарник по учёбе и совместная подготовка к сессии",
        "mvp",
        "free",
        "Проект для портфолио, работаем вечерами, созвон раз в неделю.",
        "Студенты находят напарника по предмету, договариваются о сессиях и отмечают прогресс. MVP уже "
        "работает в двух вузах, нужен дизайн и продвижение в соцсетях.",
        [
            (
                "designer",
                "Дизайнер",
                "Обновить онбординг и экран расписания",
                ["Figma", "Прототипирование"],
            ),
            ("smm", "SMM-специалист", "Вести канал и чаты вузов", ["SMM", "Копирайтинг"]),
        ],
    ),
    (
        "pavel",
        "Павел Егоров",
        "Репетитор AI",
        "Подготовка к ЕГЭ с ИИ-наставником",
        "mvp",
        "mixed",
        "Оплата за задачи плюс опцион для ключевых участников.",
        "ИИ-наставник разбирает ошибки ученика и строит персональный план подготовки к ЕГЭ по математике. "
        "Есть 300 пользователей на бесплатном тарифе.",
        [
            ("ml", "ML-инженер", "Модель оценки решений и подбор задач", ["Python", "PyTorch"]),
            ("frontend", "Frontend-разработчик", "Личный кабинет ученика", ["React", "TypeScript"]),
        ],
    ),
    (
        "lena",
        "Лена Захарова",
        "Pet Walk",
        "Студенты выгуливают собак соседей",
        "idea",
        "free",
        "Пока без денег: собираем команду и делаем прототип за месяц.",
        "Сервис, где владельцы собак находят проверенных студентов для выгула рядом с домом. "
        "Начинаем с одного района Москвы и Telegram-бота.",
        [
            ("mobile", "Mobile-разработчик", "Прототип приложения на Flutter", ["Flutter"]),
            ("designer", "Дизайнер", "Айдентика и экраны бота", ["Брендинг", "Figma"]),
        ],
    ),
    (
        "gleb",
        "Глеб Тихонов",
        "ГдеПрактика",
        "Агрегатор стажировок для студентов регионов",
        "prototype",
        "equity",
        "Доля до 3% по вестингу, 8 часов в неделю.",
        "Собираем стажировки и практики из вузов, компаний и Telegram-каналов в одном месте с фильтрами "
        "по городу и специальности. Есть парсер и первая версия сайта.",
        [
            ("backend", "Backend-разработчик", "Парсеры и API поиска", ["Python", "PostgreSQL"]),
            ("analyst", "Аналитик данных", "Метрики и воронка студентов", ["SQL", "A/B-тесты"]),
        ],
    ),
    (
        "nastya",
        "Настя Попова",
        "EcoCup",
        "Сеть залоговых стаканов для кофеен",
        "mvp",
        "paid",
        "Оплата 25 000 ₽ в месяц за part-time, можно совмещать с учёбой.",
        "Кофейни дают стакан под залог, гость возвращает его в любую точку сети. 6 кофеен в Петербурге "
        "уже подключены, ищем маркетолога и продакта.",
        [
            (
                "marketer",
                "Маркетолог",
                "Подключение новых кофеен и коммуникации",
                ["Контент-маркетинг"],
            ),
            (
                "product",
                "Продакт-менеджер",
                "Unit-экономика и развитие сети",
                ["Unit-экономика", "Jira"],
            ),
        ],
    ),
]


def _slug_skill(name: str) -> str:
    return slugify(name)


async def _user(db, email: str, name: str, **profile) -> User:
    user = await db.scalar(select(User).where(User.email == email))
    if user:
        return user
    user = User(
        email=email, password_hash=hash_password("demo12345"), email_verified_at=datetime.now(UTC)
    )
    profile.setdefault("looking_for", [])
    user.profile = Profile(slug=slugify(name), display_name=name, skills=[], links=[], **profile)
    db.add(user)
    await db.flush()
    return user


async def main() -> None:
    random.seed(7)
    async with SessionLocal() as db:
        roles: dict[str, Role] = {}
        for i, (slug, name) in enumerate(ROLES):
            role = await db.scalar(select(Role).where(Role.slug == slug)) or Role(
                slug=slug, name=name, sort=i
            )
            db.add(role)
            roles[slug] = role
        skills: dict[str, Skill] = {}
        for category, names in SKILLS.items():
            for raw in names.split():
                name = raw.replace("-", " ")
                slug = _slug_skill(raw)
                skill = await db.scalar(select(Skill).where(Skill.slug == slug)) or Skill(
                    slug=slug, name=name, category=category
                )
                db.add(skill)
                skills[raw] = skill
        await db.flush()

        for login, name, role, level, headline, skill_names, looking in PEOPLE:
            user = await _user(
                db,
                f"{login}@demo.local",
                name,
                headline=headline,
                bio=f"{headline}. Готов(а) уделять проекту 8–12 часов в неделю и быстро учиться.",
                primary_role_id=roles[role].id,
                experience_level=level,
                availability="part_time",
                city=random.choice(
                    ["Москва", "Казань", "Санкт-Петербург", "Новосибирск", "Онлайн"]
                ),
                contact_telegram=login,
                is_published=True,
            )
            p = user.profile
            p.looking_for = looking
            p.skills = [skills[s] for s in skill_names]
            if not p.links:
                p.links = [ProfileLink(kind=LinkKind.portfolio, url=f"https://example.com/{login}")]

        admin = await _user(db, "admin@demo.local", "Админ")
        admin.is_admin = True

        now = datetime.now(UTC)
        for i, (
            login,
            owner_name,
            title,
            pitch,
            stage,
            terms,
            terms_details,
            desc,
            role_rows,
        ) in enumerate(STARTUPS):
            owner = await _user(
                db,
                f"{login}@demo.local",
                owner_name,
                primary_role_id=roles["product"].id,
                contact_telegram=login,
                is_published=True,
                looking_for=[],
            )
            if await db.scalar(select(Startup.id).where(Startup.title == title)):
                continue
            s = Startup(
                owner_id=owner.id,
                title=title,
                slug=slugify(title),
                pitch=pitch,
                description=desc,
                stage=stage,
                terms=terms,
                terms_details=terms_details,
                status=StartupStatus.recruiting,
                published_at=now - timedelta(days=i * 2 + 1),
            )
            s.roles = [
                StartupRole(
                    role_id=roles[r].id,
                    title=t,
                    description=d,
                    slots=1,
                    skills=[skills[x] for x in sk],
                )
                for r, t, d, sk in role_rows
            ]
            db.add(s)
        await db.flush()

        # Пара откликов, чтобы «Входящие» и «Мои заявки» не были пустыми.
        maria = await db.scalar(select(User).where(User.email == "maria@demo.local"))
        oleg = await db.scalar(select(User).where(User.email == "oleg@demo.local"))
        vkusno = await db.scalar(select(Startup).where(Startup.slug == "vkusnoryadom"))
        if vkusno and not await db.scalar(
            select(Application.id).where(Application.applicant_id == maria.id)
        ):
            designer_role, marketer_role = vkusno.roles[0], vkusno.roles[1]
            db.add_all(
                [
                    Application(
                        startup_role_id=designer_role.id,
                        applicant_id=maria.id,
                        direction=ApplicationDirection.apply,
                        message="Здравствуйте, Алина! Я заканчиваю курс по UX и ищу первый реальный проект. "
                        "Делала учебное приложение доставки, кейс в портфолио.",
                        status=ApplicationStatus.pending,
                    ),
                    Application(
                        startup_role_id=marketer_role.id,
                        applicant_id=oleg.id,
                        direction=ApplicationDirection.apply,
                        message="Добрый день! Запускал таргет для локальной кофейни, готов взять запуск в Казани.",
                        status=ApplicationStatus.pending,
                    ),
                ]
            )
        await db.commit()
    print("seed: ok")


if __name__ == "__main__":
    asyncio.run(main())
