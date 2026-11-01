"""Справочник ролей и навыков: без него в профиле и стартапе нечего выбрать.

Идемпотентно, запускается при каждой выкатке (infra/deploy.sh) и из `make seed`.
Админ может дополнять справочник в /admin: существующие записи скрипт не трогает.
"""

import asyncio

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import SessionLocal
from app.models import Role, Skill
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
    # 2026-11-01: справочник удвоен по просьбе владельца. Первое слово названия — существительное
    # мужского рода: его склоняет SEO-заголовок «Стартапы ищут …» (apps/web/src/lib/seo.ts).
    ("fullstack", "Fullstack-разработчик"),
    ("gamedev", "Разработчик игр"),
    ("data-engineer", "Data-инженер"),
    ("data-scientist", "Data Scientist"),
    ("motion-designer", "Motion-дизайнер"),
    ("ux-researcher", "UX-исследователь"),
    ("project", "Проджект-менеджер"),
    ("business-analyst", "Бизнес-аналитик"),
    ("sales", "Менеджер по продажам"),
    ("hr", "HR-менеджер"),
    ("community", "Комьюнити-менеджер"),
    ("video", "Видеомонтажёр"),
]

SKILLS = {
    "dev": "Python FastAPI Django JavaScript TypeScript React Next.js Vue Node.js Go Java Kotlin Swift "
    "Flutter PostgreSQL Docker Git Linux REST GraphQL C++ .NET PHP Laravel Spring Angular Svelte Tailwind "
    "HTML/CSS Redis MongoDB Kubernetes CI/CD Unity Rust",
    "design": "Figma UX-исследования Прототипирование Дизайн-системы Мобильные-интерфейсы Иллюстрация "
    "Брендинг Motion Tilda Adobe-Illustrator Photoshop After-Effects Blender UI-дизайн Веб-дизайн Типографика "
    "Framer Webflow 3D-моделирование",
    "data": "SQL pandas scikit-learn PyTorch Статистика A/B-тесты Power-BI Excel Tableau DataLens ClickHouse "
    "Airflow Spark Машинное-обучение NLP Computer-Vision LLM Data-визуализация",
    "marketing": "SMM Таргет-VK SEO Контент-маркетинг Email-маркетинг Аналитика-трафика Копирайтинг "
    "Customer-Development Яндекс-Директ Telegram-Ads Performance-маркетинг Продажи PR Видеомонтаж Сторителлинг",
    "product": "Jira Roadmap Unit-экономика Интервью-с-пользователями Product-аналитика CJM Agile Scrum Notion "
    "Miro Управление-проектами Питчинг Презентации",
}


async def ensure_catalog(db: AsyncSession) -> tuple[dict[str, Role], dict[str, Skill]]:
    """Добавить недостающие роли и навыки. Ключи: slug роли и написание навыка из SKILLS."""
    roles: dict[str, Role] = {}
    for i, (slug, name) in enumerate(ROLES):
        role = await db.scalar(select(Role).where(Role.slug == slug))
        if role is None:
            role = Role(slug=slug, name=name, sort=i)
            db.add(role)
        roles[slug] = role
    skills: dict[str, Skill] = {}
    for category, names in SKILLS.items():
        for raw in names.split():
            slug = slugify(raw)
            skill = await db.scalar(select(Skill).where(Skill.slug == slug))
            if skill is None:
                skill = Skill(slug=slug, name=raw.replace("-", " "), category=category)
                db.add(skill)
            skills[raw] = skill
    await db.flush()
    return roles, skills


async def main() -> None:
    async with SessionLocal() as db:
        roles, skills = await ensure_catalog(db)
        await db.commit()
    print(f"catalog: {len(roles)} roles, {len(skills)} skills")


if __name__ == "__main__":
    asyncio.run(main())
