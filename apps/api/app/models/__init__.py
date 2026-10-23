# Импортируем все модели здесь, чтобы Alembic видел их в Base.metadata.
from app.models.user import User

__all__ = ["User"]
