from fastapi import APIRouter
from sqlalchemy import text

from app.db.session import DbSession
from app.schemas.health import HealthOut

router = APIRouter(tags=["system"])


@router.get("/health", response_model=HealthOut)
async def health(db: DbSession) -> HealthOut:
    try:
        await db.execute(text("SELECT 1"))
        db_status = "ok"
    except Exception:
        db_status = "error"
    return HealthOut(status="ok", db=db_status)
