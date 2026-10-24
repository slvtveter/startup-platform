from fastapi import APIRouter
from sqlalchemy import or_, select

from app.db.session import DbSession
from app.models import Role, Skill
from app.schemas.catalog import RoleOut, RoleTemplateOut, SkillOut
from app.services.role_templates import template_for

router = APIRouter(tags=["catalog"])


@router.get("/roles", response_model=list[RoleOut])
async def list_roles(db: DbSession) -> list[Role]:
    return list(await db.scalars(select(Role).order_by(Role.sort, Role.name)))


@router.get("/skills", response_model=list[SkillOut])
async def list_skills(db: DbSession, q: str | None = None, limit: int = 300) -> list[Skill]:
    stmt = select(Skill).order_by(Skill.category, Skill.name).limit(min(limit, 500))
    if q:
        stmt = stmt.where(or_(Skill.name.ilike(f"%{q}%"), Skill.slug.ilike(f"%{q}%")))
    return list(await db.scalars(stmt))


@router.get("/role-templates", response_model=list[RoleTemplateOut])
async def list_role_templates(db: DbSession) -> list[dict]:
    """Пример роли для каждой роли справочника (KAN-98)."""
    roles = await db.scalars(select(Role).order_by(Role.sort, Role.name))
    return [template_for(r.slug, r.name) for r in roles]
