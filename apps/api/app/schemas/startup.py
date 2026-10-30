import re
from datetime import datetime

from pydantic import BaseModel, Field, field_validator

from app.models.enums import Stage, StartupStatus, Terms
from app.schemas.catalog import RoleOut, SkillOut

MAX_SLOTS = 3


def _website(v: str | None) -> str | None:
    """«example.com» → «https://example.com»; не похожее на адрес сайта не принимаем."""
    if v is None:
        return v
    v = v.strip()
    if not v:
        return ""
    if not re.match(r"^https?://", v, re.I):
        v = "https://" + v
    if not re.match(r"^https?://[^\s/]+\.[^\s/]{2,}(/\S*)?$", v, re.I):
        raise ValueError("Укажи адрес сайта, например example.com")
    return v


def _telegram(v: str | None) -> str | None:
    """@channel, channel или t.me/channel → «@channel»."""
    if v is None:
        return v
    v = v.strip()
    if not v:
        return ""
    v = re.sub(r"^(https?://)?(t\.me|telegram\.me)/", "", v, flags=re.I).lstrip("@")
    if not re.fullmatch(r"[A-Za-z0-9_]{4,32}", v):
        raise ValueError("Укажи Telegram в виде @channel или t.me/channel")
    return "@" + v


class _Links(BaseModel):
    @field_validator("website", check_fields=False)
    @classmethod
    def _check_website(cls, v):
        return _website(v)

    @field_validator("telegram", check_fields=False)
    @classmethod
    def _check_telegram(cls, v):
        return _telegram(v)


class StartupIn(_Links):
    title: str = Field(min_length=2, max_length=80)
    pitch: str = Field(default="", max_length=160)
    description: str = Field(default="", max_length=8000)
    progress: str = Field(default="", max_length=3000)
    plans: str = Field(default="", max_length=3000)
    stage: Stage
    terms: Terms
    terms_details: str = Field(default="", max_length=2000)
    website: str = Field(default="", max_length=300)
    telegram: str = Field(default="", max_length=100)


class StartupUpdate(_Links):
    title: str | None = Field(default=None, min_length=2, max_length=80)
    pitch: str | None = Field(default=None, max_length=160)
    description: str | None = Field(default=None, max_length=8000)
    progress: str | None = Field(default=None, max_length=3000)
    plans: str | None = Field(default=None, max_length=3000)
    stage: Stage | None = None
    terms: Terms | None = None
    terms_details: str | None = Field(default=None, max_length=2000)
    website: str | None = Field(default=None, max_length=300)
    telegram: str | None = Field(default=None, max_length=100)


class RoleIn(BaseModel):
    role: str = Field(description="slug роли из справочника")
    title: str = Field(min_length=2, max_length=100)
    description: str = Field(default="", max_length=2000)
    # Не больше трёх мест на роль: на старте больше не нужно, а «10 дизайнеров» отпугивают.
    slots: int = Field(default=1, ge=1, le=MAX_SLOTS)
    hours_per_week: int | None = Field(default=None, ge=1, le=40)
    outcome: str = Field(default="", max_length=500)
    skills: list[str] = Field(default_factory=list, max_length=12)


class RoleUpdate(BaseModel):
    title: str | None = Field(default=None, min_length=2, max_length=100)
    description: str | None = Field(default=None, max_length=2000)
    slots: int | None = Field(default=None, ge=1, le=MAX_SLOTS)
    hours_per_week: int | None = Field(default=None, ge=1, le=40)
    outcome: str | None = Field(default=None, max_length=500)
    skills: list[str] | None = Field(default=None, max_length=12)
    is_open: bool | None = None


class RoleBrief(BaseModel):
    id: str
    title: str
    role: RoleOut
    slots: int = 1
    hours_per_week: int | None = None


class StartupRoleOut(RoleBrief):
    description: str
    outcome: str = ""
    is_open: bool
    skills: list[SkillOut]
    filled: int = 0


class MemberOut(BaseModel):
    display_name: str
    slug: str | None
    role_title: str
    avatar_url: str | None = None


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
    owner_avatar_url: str | None = None
    open_roles: list[RoleBrief]
    team_size: int = 1
    is_demo: bool = False
    cover_url: str | None = None
    cover_url_lg: str | None = None


class ResponseStats(BaseModel):
    """Как команда отвечает на отклики за 90 дней. Только при ≥ 3 откликах."""

    answered_share: float
    median_hours: float | None


class StartupDetail(StartupCard):
    description: str
    progress: str = ""
    plans: str = ""
    terms_details: str
    website: str
    telegram: str
    roles: list[StartupRoleOut]
    team: list[MemberOut]
    is_owner: bool
    my_active_role_ids: list[str] = []
    response_stats: ResponseStats | None = None


class MyStartupOut(StartupCard):
    pending_applications: int
    is_hidden: bool
    views_30d: int = 0


class OpenSeatStartup(BaseModel):
    slug: str
    title: str
    terms: Terms
    stage: Stage
    is_demo: bool = False


class OpenSeat(RoleBrief):
    """Свободное место в команде: роль открытого стартапа (доска на лендинге)."""

    startup: OpenSeatStartup


class RecommendedStartup(BaseModel):
    startup: StartupCard
    score: int
    reasons: list[str]
