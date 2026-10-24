from datetime import datetime

from pydantic import BaseModel, Field

from app.models.enums import ReportReason, ReportStatus


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


class AdminUserOut(BaseModel):
    id: str
    email: str
    display_name: str
    is_active: bool
    is_admin: bool
    email_verified: bool
    created_at: datetime


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
