from fastapi import APIRouter, Request, Response

from app.core.config import get_settings
from app.core.deps import CurrentUser, client_ip
from app.db.session import DbSession
from app.models import User
from app.schemas.auth import (
    ChangeEmailIn,
    ChangePasswordIn,
    ForgotIn,
    LoginIn,
    MeOut,
    MeProfile,
    RegisterIn,
    ResetIn,
    TokenIn,
)
from app.schemas.common import OkOut
from app.services import auth as auth_service
from app.services.profiles import completeness

router = APIRouter(prefix="/auth", tags=["auth"])


def _set_cookie(response: Response, token: str) -> None:
    s = get_settings()
    response.set_cookie(
        s.session_cookie_name,
        token,
        max_age=s.session_ttl_days * 86400,
        httponly=True,
        samesite="lax",
        secure=s.cookie_secure,
        path="/",
    )


def me_out(user: User) -> MeOut:
    p = user.profile
    return MeOut(
        id=str(user.id),
        email=user.email,
        is_admin=user.is_admin,
        email_verified=user.email_verified,
        profile=MeProfile(
            slug=p.slug,
            display_name=p.display_name,
            is_published=p.is_published,
            completeness=completeness(p)[0],
        )
        if p
        else None,
    )


@router.post("/register", response_model=MeOut, status_code=201)
async def register(data: RegisterIn, request: Request, response: Response, db: DbSession) -> MeOut:
    user, token = await auth_service.register(
        db, data.email, data.password, client_ip(request), data.utm_source
    )
    _set_cookie(response, token)
    return me_out(user)


@router.post("/login", response_model=MeOut)
async def login(data: LoginIn, request: Request, response: Response, db: DbSession) -> MeOut:
    user, token = await auth_service.login(db, data.email, data.password, client_ip(request))
    _set_cookie(response, token)
    return me_out(user)


@router.post("/logout", response_model=OkOut)
async def logout(request: Request, response: Response, db: DbSession) -> OkOut:
    s = get_settings()
    token = request.cookies.get(s.session_cookie_name)
    if token:
        await auth_service.logout(db, token)
    response.delete_cookie(s.session_cookie_name, path="/")
    return OkOut()


@router.get("/me", response_model=MeOut)
async def me(user: CurrentUser) -> MeOut:
    return me_out(user)


@router.post("/verify-email", response_model=OkOut)
async def verify_email(data: TokenIn, db: DbSession) -> OkOut:
    await auth_service.verify_email(db, data.token)
    return OkOut()


@router.post("/resend-verification", response_model=OkOut)
async def resend_verification(user: CurrentUser, db: DbSession) -> OkOut:
    if not user.email_verified:
        await auth_service.resend_verification(db, user)
    return OkOut()


@router.post("/password/forgot", response_model=OkOut)
async def forgot_password(data: ForgotIn, request: Request, db: DbSession) -> OkOut:
    await auth_service.forgot_password(db, data.email.lower(), client_ip(request))
    return OkOut()


@router.post("/password/reset", response_model=OkOut)
async def reset_password(data: ResetIn, db: DbSession) -> OkOut:
    await auth_service.reset_password(db, data.token, data.password)
    return OkOut()


@router.post("/password/change", response_model=OkOut)
async def change_password(
    data: ChangePasswordIn, request: Request, user: CurrentUser, db: DbSession
) -> OkOut:
    token = request.cookies.get(get_settings().session_cookie_name, "")
    await auth_service.change_password(db, user, data.current_password, data.new_password, token)
    return OkOut()


@router.post("/change-email", response_model=OkOut)
async def change_email(data: ChangeEmailIn, user: CurrentUser, db: DbSession) -> OkOut:
    await auth_service.request_email_change(db, user, data.new_email, data.password)
    return OkOut()


@router.post("/confirm-email", response_model=OkOut)
async def confirm_email_change(data: TokenIn, db: DbSession) -> OkOut:
    """Переход по ссылке из письма на новый адрес. Вход не нужен: доказательство — сама ссылка."""
    await auth_service.confirm_email_change(db, data.token)
    return OkOut()


@router.delete("/account", response_model=OkOut)
async def delete_account(user: CurrentUser, response: Response, db: DbSession) -> OkOut:
    await auth_service.delete_account(db, user)
    response.delete_cookie(get_settings().session_cookie_name, path="/")
    return OkOut()
