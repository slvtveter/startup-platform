from app.schemas.common import ORM


class RoleOut(ORM):
    slug: str
    name: str


class SkillOut(ORM):
    slug: str
    name: str
    category: str
