"""Согласие с пользовательским соглашением и подтверждение возраста."""

from sqlalchemy.ext.asyncio import AsyncSession

from app.core.legal import TERMS_VERSION
from app.models import Consent, User


def needs_terms(user: User) -> bool:
    return user.terms_version != TERMS_VERSION


def record_terms(db: AsyncSession, user: User, source: str, ip: str, user_agent: str) -> None:
    """Две записи в журнал (соглашение и 18+) и отметка в аккаунте. Коммит — у вызывающего."""
    for kind in ("terms", "adult"):
        db.add(
            Consent(
                user_id=user.id,
                email=user.email,
                kind=kind,
                version=TERMS_VERSION,
                source=source,
                ip=ip[:64],
                user_agent=user_agent[:300],
            )
        )
    user.terms_version = TERMS_VERSION
