"""Согласие с пользовательским соглашением и подтверждение возраста."""

from sqlalchemy.ext.asyncio import AsyncSession

from app.core.legal import PUBLICATION_VERSION, TERMS_VERSION
from app.models import Consent, User


def needs_terms(user: User) -> bool:
    return user.terms_version != TERMS_VERSION


def needs_publication(user: User) -> bool:
    """Профиль виден в каталоге, а согласия с действующей редакцией нет."""
    return bool(user.profile and user.profile.is_published) and (
        user.publication_version != PUBLICATION_VERSION
    )


def has_publication(user: User) -> bool:
    return user.publication_version == PUBLICATION_VERSION


def record_publication(
    db: AsyncSession, user: User, source: str = "publish", ip: str = "", user_agent: str = ""
) -> None:
    db.add(
        Consent(
            user_id=user.id,
            email=user.email,
            kind="publication",
            version=PUBLICATION_VERSION,
            source=source,
            ip=ip[:64],
            user_agent=user_agent[:300],
        )
    )
    user.publication_version = PUBLICATION_VERSION


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
