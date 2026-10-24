"""Служебные ручки для E2E. Работают только в local/test: в staging и prod отвечают 404."""

from fastapi import APIRouter
from sqlalchemy import delete

from app.core.config import get_settings
from app.core.errors import NotFound
from app.db.session import DbSession
from app.models import User
from app.schemas.common import OkOut

router = APIRouter(tags=["testing"], include_in_schema=False)

E2E_EMAIL_DOMAIN = "@e2e.example.com"


@router.post("/testing/cleanup-e2e", response_model=OkOut)
async def cleanup_e2e(db: DbSession) -> OkOut:
    if get_settings().env not in ("local", "test"):
        raise NotFound("Не найдено")
    # Стартапы, профили и отклики E2E-пользователей удаляются каскадом.
    await db.execute(delete(User).where(User.email.endswith(E2E_EMAIL_DOMAIN)))
    await db.commit()
    return OkOut()
