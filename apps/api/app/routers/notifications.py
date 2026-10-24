from fastapi import APIRouter

from app.core.deps import CurrentUser
from app.db.session import DbSession
from app.schemas.notifications import EmailPrefOut, EmailPrefsIn, UnsubscribeIn, UnsubscribeOut
from app.services import notifications as service

router = APIRouter(tags=["notifications"])


def _out(user) -> list[EmailPrefOut]:
    return [
        EmailPrefOut(kind=kind, label=label, enabled=service.enabled(user, kind))
        for kind, label in service.KINDS.items()
    ]


@router.get("/me/email-prefs", response_model=list[EmailPrefOut])
async def get_email_prefs(user: CurrentUser) -> list[EmailPrefOut]:
    return _out(user)


@router.put("/me/email-prefs", response_model=list[EmailPrefOut])
async def update_email_prefs(
    data: EmailPrefsIn, user: CurrentUser, db: DbSession
) -> list[EmailPrefOut]:
    await service.set_prefs(db, user, data.prefs)
    return _out(user)


@router.post("/email/unsubscribe", response_model=UnsubscribeOut)
async def unsubscribe(data: UnsubscribeIn, db: DbSession) -> UnsubscribeOut:
    """Отписка по ссылке из письма, без входа. Подпись проверяется в сервисе."""
    return UnsubscribeOut(label=await service.unsubscribe(db, data.u, data.k, data.t))
