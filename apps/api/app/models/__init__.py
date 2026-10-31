# Импортируем все модели здесь, чтобы Alembic видел их в Base.metadata.
from app.models.application import Application
from app.models.catalog import Role, Skill
from app.models.chat import Conversation, Message
from app.models.consent import Consent
from app.models.ops import AdminAction, Event, Feedback, Job, Report
from app.models.profile import Profile, ProfileLink
from app.models.startup import Startup, StartupMember, StartupRole
from app.models.user import AuthAttempt, EmailToken, Session, SocialAccount, User

__all__ = [
    "AdminAction",
    "Application",
    "AuthAttempt",
    "Consent",
    "Conversation",
    "EmailToken",
    "Event",
    "Feedback",
    "Job",
    "Message",
    "Profile",
    "ProfileLink",
    "Report",
    "Role",
    "Session",
    "SocialAccount",
    "Skill",
    "Startup",
    "StartupMember",
    "StartupRole",
    "User",
]
