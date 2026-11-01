from datetime import datetime

from pydantic import BaseModel, Field, HttpUrl

from app.models.enums import Availability, ExperienceLevel, LinkKind, LookingFor
from app.schemas.catalog import RoleOut, SkillOut
from app.schemas.common import ORM


class LinkIn(BaseModel):
    kind: LinkKind = LinkKind.portfolio
    url: HttpUrl


class LinkOut(ORM):
    kind: LinkKind
    url: str


class ProfileUpdate(BaseModel):
    display_name: str | None = Field(default=None, min_length=2, max_length=80)
    headline: str | None = Field(default=None, max_length=140)
    bio: str | None = Field(default=None, max_length=3000)
    primary_role: str | None = Field(default=None, description="slug роли")
    experience_level: ExperienceLevel | None = None
    availability: Availability | None = None
    looking_for: list[LookingFor] | None = None
    city: str | None = Field(default=None, max_length=80)
    education: str | None = Field(default=None, max_length=120)
    contact_telegram: str | None = Field(default=None, max_length=64)
    show_email: bool | None = None
    skills: list[str] | None = Field(default=None, max_length=20, description="slug навыков")
    links: list[LinkIn] | None = Field(default=None, max_length=8)


class PublishIn(BaseModel):
    published: bool
    # Галочка «даю согласие на распространение сведений профиля» (ст. 10.1 152-ФЗ).
    consent: bool = False


class PersonCard(ORM):
    slug: str
    display_name: str
    headline: str
    primary_role: RoleOut | None
    experience_level: ExperienceLevel | None
    availability: Availability | None
    looking_for: list[str]
    city: str
    skills: list[SkillOut]
    avatar_url: str | None = None
    avatar_url_lg: str | None = None
    is_demo: bool = False


class MembershipOut(BaseModel):
    startup_slug: str
    startup_title: str
    role_title: str
    since: datetime


class PersonDetail(PersonCard):
    bio: str
    education: str = ""
    # Само резюме скачивается через /people/{slug}/resume и только после входа.
    has_resume: bool = False
    links: list[LinkOut]
    memberships: list[MembershipOut] = []


class MyProfileOut(PersonDetail):
    is_published: bool
    contact_telegram: str
    show_email: bool
    resume_name: str = ""
    completeness: int
    missing: list[str]
    can_publish: bool
    apply_blockers: list[str] = []
    # Сколько раз профиль открывали другие за 30 дней (клиентское событие profile_viewed).
    views_30d: int = 0
