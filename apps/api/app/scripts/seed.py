"""Синтетические данные для local/staging: `make seed`. Идемпотентно, реальных данных нет.

Демо-аккаунты (пароль у всех demo12345):
  maria@example.com   — дизайнер, ищет первый опыт
  alina@example.com   — основатель ВкусноРядом
  admin@example.com   — администратор
"""

import asyncio
import random
from datetime import UTC, datetime, timedelta

from sqlalchemy import select

from app.core.legal import TERMS_VERSION
from app.core.security import hash_password
from app.db.session import SessionLocal
from app.models import Application, Profile, ProfileLink, Startup, StartupRole, User
from app.models.enums import ApplicationDirection, ApplicationStatus, LinkKind, StartupStatus, Terms
from app.scripts.catalog import ensure_catalog
from app.services.slug import slugify

# Демо-нагрузка по типу роли и что человек получает при разных условиях участия.
HOURS = {"frontend": 10, "backend": 10, "mobile": 10, "ml": 8, "designer": 8, "analyst": 6}
OUTCOME = {
    Terms.free: "Кейс в портфолио, рекомендация от основателя и опыт работы в команде",
    Terms.paid: "Оплата по договорённости за задачи, кейс в портфолио",
    Terms.negotiable: "Условия обсудим на созвоне, кейс в портфолио",
}

PEOPLE = [
    (
        "maria",
        "Мария Ким",
        "designer",
        "courses",
        "UI/UX дизайнер, ищу первый реальный проект",
        ["Figma", "UX-исследования", "Прототипирование", "Мобильные-интерфейсы"],
        ["free", "negotiable"],
    ),
    (
        "egor",
        "Егор Волков",
        "designer",
        "internship",
        "Продуктовый дизайнер после стажировки",
        ["Figma", "Дизайн-системы", "Прототипирование"],
        ["negotiable", "paid"],
    ),
    (
        "artem",
        "Артём Смирнов",
        "backend",
        "internship",
        "Python-разработчик, люблю чистые API",
        ["Python", "FastAPI", "PostgreSQL", "Docker"],
        ["paid", "negotiable"],
    ),
    (
        "ilya",
        "Илья Новиков",
        "frontend",
        "courses",
        "Frontend на React, закончил курс",
        ["React", "TypeScript", "Next.js"],
        ["free", "negotiable"],
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
        ["paid", "negotiable"],
    ),
    (
        "vera",
        "Вера Гусева",
        "smm",
        "no_experience",
        "Веду соцсети, хочу в стартап",
        ["SMM", "Таргет-VK", "Копирайтинг"],
        ["free", "negotiable"],
    ),
    (
        "rustam",
        "Рустам Алиев",
        "ml",
        "courses",
        "ML-инженер, классический ML и немного NLP",
        ["Python", "scikit-learn", "PyTorch", "pandas"],
        ["negotiable"],
    ),
    (
        "katya",
        "Катя Орлова",
        "product",
        "internship",
        "Продакт после стажировки в EdTech",
        ["Jira", "Customer-Development", "Unit-экономика"],
        ["negotiable", "paid"],
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
        ["free", "negotiable"],
    ),
]

STARTUPS = [
    (
        "alina",
        "Алина Белова",
        "ВкусноРядом",
        "Домашняя еда от соседей с доставкой за 30 минут",
        "prototype",
        "negotiable",
        "Оплату или формат участия обсудим на созвоне. 10 часов в неделю.",
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
        "paid",
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
        "negotiable",
        "Условия обсуждаются, 8 часов в неделю.",
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


async def _user(db, email: str, name: str, **profile) -> User:
    user = await db.scalar(select(User).where(User.email == email))
    if user:
        # Синтетические аккаунты сразу с действующей редакцией соглашения: иначе экран согласия
        # закрывает им сайт в e2e и на стенде.
        user.terms_version = TERMS_VERSION
        return user
    user = User(
        email=email,
        password_hash=hash_password("demo12345"),
        email_verified_at=datetime.now(UTC),
        terms_version=TERMS_VERSION,
    )
    profile.setdefault("looking_for", [])
    user.profile = Profile(slug=slugify(name), display_name=name, skills=[], links=[], **profile)
    db.add(user)
    await db.flush()
    return user


async def main() -> None:
    random.seed(7)
    async with SessionLocal() as db:
        roles, skills = await ensure_catalog(db)

        for login, name, role, level, headline, skill_names, looking in PEOPLE:
            user = await _user(
                db,
                f"{login}@example.com",
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

        admin = await _user(db, "admin@example.com", "Админ")
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
                f"{login}@example.com",
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
                    hours_per_week=HOURS.get(r, 6),
                    outcome=OUTCOME[terms],
                    skills=[skills[x] for x in sk],
                )
                for r, t, d, sk in role_rows
            ]
            db.add(s)
        await db.flush()

        # Роли, созданные до появления часов и «что получишь», дозаполняем (идемпотентно).
        stale = await db.scalars(
            select(StartupRole).where(
                StartupRole.hours_per_week.is_(None), StartupRole.outcome == ""
            )
        )
        for role in stale:
            role.hours_per_week = HOURS.get(role.role.slug, 6)
            role.outcome = OUTCOME[role.startup.terms]

        # Пара откликов, чтобы «Входящие» и «Мои заявки» не были пустыми.
        maria = await db.scalar(select(User).where(User.email == "maria@example.com"))
        oleg = await db.scalar(select(User).where(User.email == "oleg@example.com"))
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
