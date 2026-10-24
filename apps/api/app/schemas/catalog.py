from pydantic import BaseModel

from app.schemas.common import ORM


class RoleOut(ORM):
    slug: str
    name: str


class SkillOut(ORM):
    slug: str
    name: str
    category: str


class RoleTemplateOut(BaseModel):
    role: str
    title: str
    description: str
    hours_per_week: int
    outcome: dict[str, str]
