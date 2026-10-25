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
