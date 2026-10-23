import uuid

from fastapi import APIRouter

from app.core.deps import CurrentUser
from app.db.session import DbSession
from app.schemas.application import ApplicationOut, ApplyIn, DecisionIn, InviteIn
from app.services import applications as service

router = APIRouter(tags=["applications"])


@router.post(
    "/startup-roles/{role_id}/applications", response_model=ApplicationOut, status_code=201
)
async def apply_to_role(
    role_id: uuid.UUID, data: ApplyIn, user: CurrentUser, db: DbSession
) -> ApplicationOut:
    return service.to_out(await service.apply(db, user, role_id, data.message), user)


@router.post("/people/{slug}/invite", response_model=ApplicationOut, status_code=201)
async def invite_person(
    slug: str, data: InviteIn, user: CurrentUser, db: DbSession
) -> ApplicationOut:
    app = await service.invite(db, user, slug, uuid.UUID(data.startup_role_id), data.message)
    return service.to_out(app, user)


@router.get("/me/applications", response_model=list[ApplicationOut])
async def list_my_applications(user: CurrentUser, db: DbSession) -> list[ApplicationOut]:
    return [service.to_out(a, user) for a in await service.mine(db, user)]


@router.post("/applications/{app_id}/withdraw", response_model=ApplicationOut)
async def withdraw_application(
    app_id: uuid.UUID, user: CurrentUser, db: DbSession
) -> ApplicationOut:
    return service.to_out(await service.withdraw(db, user, app_id), user)


@router.post("/applications/{app_id}/accept", response_model=ApplicationOut)
async def accept_application(
    app_id: uuid.UUID, data: DecisionIn, user: CurrentUser, db: DbSession
) -> ApplicationOut:
    return service.to_out(await service.decide(db, user, app_id, True, data.note), user)


@router.post("/applications/{app_id}/reject", response_model=ApplicationOut)
async def reject_application(
    app_id: uuid.UUID, data: DecisionIn, user: CurrentUser, db: DbSession
) -> ApplicationOut:
    return service.to_out(await service.decide(db, user, app_id, False, data.note), user)
