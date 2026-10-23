from fastapi import APIRouter
from sqlalchemy import or_, select

from app.db.session import DbSession
from app.models import Role, Skill
from app.schemas.catalog import RoleOut, SkillOut

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
