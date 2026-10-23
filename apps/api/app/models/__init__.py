# Импортируем все модели здесь, чтобы Alembic видел их в Base.metadata.
from app.models.application import Application
from app.models.catalog import Role, Skill
from app.models.ops import AdminAction, Event, Feedback, Report
from app.models.profile import Profile, ProfileLink
from app.models.startup import Startup, StartupMember, StartupRole
from app.models.user import AuthAttempt, EmailToken, Session, User

__all__ = [
    "AdminAction",
    "Application",
    "AuthAttempt",
    "EmailToken",
    "Event",
    "Feedback",
    "Profile",
    "ProfileLink",
    "Report",
    "Role",
    "Session",
    "Skill",
    "Startup",
    "StartupMember",
    "StartupRole",
    "User",
]
