"""Журнал согласий: кто, с какой редакцией документа и когда согласился (152-ФЗ, ст. 9).

Записи не удаляются вместе с аккаунтом: это доказательство согласия. Поэтому user_id без
внешнего ключа, а email копируется на момент согласия.
"""

import uuid
from datetime import datetime

from sqlalchemy import DateTime, Index, String, func
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base


class Consent(Base):
    __tablename__ = "consents"
    __table_args__ = (Index("ix_consents_user_kind", "user_id", "kind"),)

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    user_id: Mapped[uuid.UUID] = mapped_column()
    email: Mapped[str] = mapped_column(String(320), default="")
    # terms — пользовательское соглашение, adult — подтверждение «мне есть 18».
    kind: Mapped[str] = mapped_column(String(32))
    # Редакция документа (дата), см. app.core.legal.
    version: Mapped[str] = mapped_column(String(32))
    # Как получено: register — галочки в форме регистрации, prompt — экран после входа.
    source: Mapped[str] = mapped_column(String(16))
    ip: Mapped[str] = mapped_column(String(64), default="")
    user_agent: Mapped[str] = mapped_column(String(300), default="")
    accepted_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )
    revoked_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
