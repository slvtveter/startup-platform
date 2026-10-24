"""Справочники ролей и навыков в админке (KAN-75): добавить, переименовать, объединить дубли."""

from sqlalchemy import delete, select, update
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.errors import AppError, Conflict, NotFound
from app.models import Profile, Role, Skill, StartupRole
from app.models.profile import profile_skills
from app.models.startup import startup_role_skills
from app.services.slug import slugify

Model = type[Role] | type[Skill]


async def _get(db: AsyncSession, model: Model, slug: str):
    item = await db.scalar(select(model).where(model.slug == slug))
    if item is None:
        raise NotFound("Не найдено в справочнике")
    return item


async def create(db: AsyncSession, model: Model, name: str, category: str | None = None):
    slug = slugify(name)
    if not slug:
        raise AppError("Название должно содержать буквы или цифры", {"field": "name"})
    if await db.scalar(select(model.id).where(model.slug == slug)):
        raise Conflict("Такой элемент уже есть в справочнике")
    item = model(slug=slug, name=name.strip())
    if model is Skill and category:
        item.category = category
    db.add(item)
    await db.commit()
    return item


async def rename(db: AsyncSession, model: Model, slug: str, name: str):
    item = await _get(db, model, slug)
    item.name = name.strip()  # slug не меняем: на него ссылаются фильтры в URL
    await db.commit()
    return item


async def merge(db: AsyncSession, model: Model, source_slug: str, target_slug: str) -> None:
    """Переносит все связи с source на target и удаляет source. Дубли пар не создаются."""
    if source_slug == target_slug:
        raise AppError("Нельзя объединить элемент сам с собой")
    source = await _get(db, model, source_slug)
    target = await _get(db, model, target_slug)
    if model is Role:
        await db.execute(
            update(StartupRole).where(StartupRole.role_id == source.id).values(role_id=target.id)
        )
        await db.execute(
            update(Profile)
            .where(Profile.primary_role_id == source.id)
            .values(primary_role_id=target.id)
        )
    else:
        for table, owner_col in (
            (profile_skills, profile_skills.c.profile_id),
            (startup_role_skills, startup_role_skills.c.startup_role_id),
        ):
            already = select(owner_col).where(table.c.skill_id == target.id)
            # Где есть оба навыка, просто убираем дубль; в остальных местах перевешиваем.
            await db.execute(
                delete(table).where(table.c.skill_id == source.id, owner_col.in_(already))
            )
            await db.execute(
                update(table).where(table.c.skill_id == source.id).values(skill_id=target.id)
            )
    await db.delete(source)
    await db.commit()
