"""Служебные таблицы: события аналитики, жалобы, отзывы, журнал админов."""

import uuid
from datetime import datetime

from sqlalchemy import DateTime, Enum, ForeignKey, Index, String, Text, func, text
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base
from app.models.enums import ReportReason, ReportStatus


class Event(Base):
    __tablename__ = "events"
    __table_args__ = (
        Index("ix_events_name_created_at", "name", "created_at"),
        # KAN-105: лимит и дедупликация клиентских событий по хешу посетителя.
        Index("ix_events_visitor_created_at", text("(props->>'v')"), "created_at"),
        # Просмотры стартапа за 30 дней.
        Index("ix_events_name_slug_created_at", "name", text("(props->>'slug')"), "created_at"),
        # Когорты: активность конкретных пользователей.
        Index("ix_events_user_name_created_at", "user_id", "name", "created_at"),
    )

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    name: Mapped[str] = mapped_column(String(64))
    user_id: Mapped[uuid.UUID | None] = mapped_column(ForeignKey("users.id", ondelete="SET NULL"))
    entity_type: Mapped[str] = mapped_column(String(32), default="")
    entity_id: Mapped[str] = mapped_column(String(64), default="")
    props: Mapped[dict] = mapped_column(JSONB, default=dict)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())


class Report(Base):
    __tablename__ = "reports"

    id: Mapped[int] = mapped_column(primary_key=True)
    reporter_id: Mapped[uuid.UUID | None] = mapped_column(
        ForeignKey("users.id", ondelete="SET NULL")
    )
    target_type: Mapped[str] = mapped_column(String(16))  # profile | startup
    target_id: Mapped[str] = mapped_column(String(64))
    reason: Mapped[ReportReason] = mapped_column(Enum(ReportReason, native_enum=False, length=16))
    comment: Mapped[str] = mapped_column(Text, default="")
    status: Mapped[ReportStatus] = mapped_column(
        Enum(ReportStatus, native_enum=False, length=16), default=ReportStatus.new, index=True
    )
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())


class Feedback(Base):
    __tablename__ = "feedback"

    id: Mapped[int] = mapped_column(primary_key=True)
    user_id: Mapped[uuid.UUID | None] = mapped_column(ForeignKey("users.id", ondelete="SET NULL"))
    text: Mapped[str] = mapped_column(Text)
    page_url: Mapped[str] = mapped_column(String(500), default="")
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())


class AdminAction(Base):
    __tablename__ = "admin_actions"

    id: Mapped[int] = mapped_column(primary_key=True)
    admin_id: Mapped[uuid.UUID | None] = mapped_column(ForeignKey("users.id", ondelete="SET NULL"))
    action: Mapped[str] = mapped_column(String(64))
    target_type: Mapped[str] = mapped_column(String(32))
    target_id: Mapped[str] = mapped_column(String(64))
    details: Mapped[dict] = mapped_column(JSONB, default=dict)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())


class Job(Base):
    """Фоновая задача (KAN-91): очередь в Postgres, разбирает `python -m app.worker`.

    Воркер берёт задачу через SELECT … FOR UPDATE SKIP LOCKED, поэтому несколько воркеров
    не возьмут одну и ту же. Отдельный брокер (Redis, RabbitMQ) на нашем объёме не нужен.
    """

    __tablename__ = "jobs"
    __table_args__ = (Index("ix_jobs_pending", "run_at", postgresql_where="done_at IS NULL"),)

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    kind: Mapped[str] = mapped_column(String(64))
    payload: Mapped[dict] = mapped_column(JSONB, default=dict)
    run_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    attempts: Mapped[int] = mapped_column(default=0)
    locked_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    done_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    # Задача исчерпала попытки: done_at проставлен, failed — True.
    failed: Mapped[bool] = mapped_column(default=False)
    last_error: Mapped[str] = mapped_column(Text, default="")
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
