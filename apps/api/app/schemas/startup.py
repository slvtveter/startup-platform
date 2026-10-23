from datetime import datetime

from pydantic import BaseModel, Field

from app.models.enums import Stage, StartupStatus, Terms
from app.schemas.catalog import RoleOut, SkillOut


class StartupIn(BaseModel):
    title: str = Field(min_length=2, max_length=80)
    pitch: str = Field(default="", max_length=160)
    description: str = Field(default="", max_length=8000)
    stage: Stage
    terms: Terms
    terms_details: str = Field(default="", max_length=2000)
    website: str = Field(default="", max_length=300)
    telegram: str = Field(default="", max_length=100)


class StartupUpdate(BaseModel):
    title: str | None = Field(default=None, min_length=2, max_length=80)
    pitch: str | None = Field(default=None, max_length=160)
    description: str | None = Field(default=None, max_length=8000)
    stage: Stage | None = None
    terms: Terms | None = None
    terms_details: str | None = Field(default=None, max_length=2000)
    website: str | None = Field(default=None, max_length=300)
    telegram: str | None = Field(default=None, max_length=100)


class RoleIn(BaseModel):
    role: str = Field(description="slug роли из справочника")
    title: str = Field(min_length=2, max_length=100)
    description: str = Field(default="", max_length=2000)
    slots: int = Field(default=1, ge=1, le=20)
    skills: list[str] = Field(default_factory=list, max_length=12)


class RoleUpdate(BaseModel):
    title: str | None = Field(default=None, min_length=2, max_length=100)
    description: str | None = Field(default=None, max_length=2000)
    slots: int | None = Field(default=None, ge=1, le=20)
    skills: list[str] | None = Field(default=None, max_length=12)
    is_open: bool | None = None


class RoleBrief(BaseModel):
    id: str
    title: str
    role: RoleOut


class StartupRoleOut(RoleBrief):
    description: str
    slots: int
    is_open: bool
    skills: list[SkillOut]
    filled: int = 0


class MemberOut(BaseModel):
    display_name: str
    slug: str | None
    role_title: str


class StartupCard(BaseModel):
    id: str
    slug: str
    title: str
    pitch: str
    stage: Stage
    terms: Terms
    status: StartupStatus
    published_at: datetime | None
    owner_name: str
    open_roles: list[RoleBrief]


class StartupDetail(StartupCard):
    description: str
    terms_details: str
    website: str
    telegram: str
    roles: list[StartupRoleOut]
    team: list[MemberOut]
    is_owner: bool
    my_active_role_ids: list[str] = []


class MyStartupOut(StartupCard):
    pending_applications: int
    is_hidden: bool


class RecommendedStartup(BaseModel):
    startup: StartupCard
    score: int
    reasons: list[str]
