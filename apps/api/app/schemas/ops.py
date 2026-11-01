from datetime import date, datetime
from typing import Literal

from pydantic import BaseModel, EmailStr, Field

from app.models.enums import ReportReason, ReportStatus
from app.schemas.startup import StartupIn


class ReportIn(BaseModel):
    target_type: str = Field(pattern="^(profile|startup)$")
    target_id: str = Field(max_length=64, description="slug профиля или стартапа")
    reason: ReportReason
    comment: str = Field(default="", max_length=1000)


class ReportOut(BaseModel):
    id: int
    target_type: str
    target_id: str
    reason: ReportReason
    comment: str
    status: ReportStatus
    created_at: datetime


class FeedbackIn(BaseModel):
    text: str = Field(min_length=3, max_length=3000)
    page_url: str = Field(default="", max_length=500)


class ClientEventIn(BaseModel):
    """События, которые видит только браузер (docs/events.md). Белый список имён."""

    name: Literal[
        "landing_viewed",
        "landing_path_selected",
        "startup_viewed",
        "profile_viewed",
        "apply_started",
    ]
    path: Literal["seeker", "founder"] | None = None
    slug: str | None = Field(default=None, max_length=100, pattern=r"^[a-z0-9-]+$")
    # Откуда пришёл посетитель: переход из письма-подборки (KAN-107).
    src: Literal["digest"] | None = None


class HypothesisRow(BaseModel):
    key: str
    title: str
    metric: str
    unit: Literal["%", "ч", "шт"]
    current: float | None
    previous: float | None


class StatsOut(BaseModel):
    startups: int
    people: int
    open_roles: int
    intros_30d: int


class FunnelStep(BaseModel):
    name: str
    label: str
    count: int


class SourceRow(BaseModel):
    source: str
    signups: int


class MetricsOut(BaseModel):
    days: int
    funnel: list[FunnelStep]
    active_startups: int
    answered_72h_share: float | None
    sources: list[SourceRow]
    jobs_pending: int = 0
    jobs_failed: int = 0


class AdminTotals(BaseModel):
    """Цифры для обзора админки по настоящим пользователям (без демо и E2E);
    *_new — за выбранный период."""

    users: int
    users_new: int
    active_7d: int
    profiles_published: int
    startups_recruiting: int
    applications_new: int
    applications_pending: int
    messages_new: int
    reports_open: int
    feedback_new: int
    demo_users: int


class DayCount(BaseModel):
    day: date
    count: int


class RecentUser(BaseModel):
    id: str
    email: str
    display_name: str
    role: str | None = None
    is_published: bool
    created_at: datetime


class AdminOverview(BaseModel):
    totals: AdminTotals
    signups: list[DayCount]
    recent: list[RecentUser]


class FeedbackOut(BaseModel):
    id: int
    text: str
    page_url: str
    created_at: datetime
    user_email: str | None = None
    has_screenshot: bool = False


class ActivityOut(BaseModel):
    """Событие продукта для ленты в админке: кто и что сделал."""

    created_at: datetime
    name: str
    label: str
    user_email: str | None = None


class AdminUserOut(BaseModel):
    id: str
    email: str
    display_name: str
    is_active: bool
    is_admin: bool
    email_verified: bool
    created_at: datetime
    is_demo: bool = False
    is_published: bool = False
    role: str | None = None


class AdminStartupOut(BaseModel):
    id: str
    slug: str
    title: str
    owner_email: str
    status: str
    is_hidden: bool
    created_at: datetime


class AdminActionOut(BaseModel):
    id: int
    admin_email: str | None
    action: str
    target_type: str
    target_id: str
    created_at: datetime
    # Для людей: «Скрыл стартап», «Flowly», ссылка, где на него посмотреть (если он ещё есть).
    label: str = ""
    target_label: str = ""
    target_href: str | None = None


class CatalogItemIn(BaseModel):
    name: str = Field(min_length=2, max_length=100)
    category: str | None = Field(default=None, max_length=64)


class CatalogRenameIn(BaseModel):
    name: str = Field(min_length=2, max_length=100)


class CatalogMergeIn(BaseModel):
    into: str = Field(description="slug элемента, в который сливаем дубль")


class PlatformStartupIn(StartupIn):
    """Стартап, который админ переносит на платформу за основателя (KAN-75)."""

    owner_email: EmailStr


class CohortRow(BaseModel):
    week: date
    signups: int
    d7: float | None = Field(
        description="Доля вернувшихся на 7–13 день; None — когорта ещё не дозрела"
    )
    d30: float | None
