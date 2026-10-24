from pydantic import BaseModel, Field, HttpUrl

from app.models.enums import Availability, ExperienceLevel, LinkKind, Terms
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
    looking_for: list[Terms] | None = None
    city: str | None = Field(default=None, max_length=80)
    contact_telegram: str | None = Field(default=None, max_length=64)
    show_email: bool | None = None
    skills: list[str] | None = Field(default=None, max_length=20, description="slug навыков")
    links: list[LinkIn] | None = Field(default=None, max_length=8)


class PublishIn(BaseModel):
    published: bool


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


class MembershipOut(BaseModel):
    startup_slug: str
    startup_title: str
    role_title: str


class PersonDetail(PersonCard):
    bio: str
    links: list[LinkOut]
    memberships: list[MembershipOut] = []


class MyProfileOut(PersonDetail):
    is_published: bool
    contact_telegram: str
    show_email: bool
    completeness: int
    missing: list[str]
    can_publish: bool
    apply_blockers: list[str] = []
