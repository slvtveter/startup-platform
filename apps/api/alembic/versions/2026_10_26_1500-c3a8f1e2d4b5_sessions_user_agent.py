"""sessions: user_agent (KAN-138 п.9 — список входов в настройках)

Revision ID: c3a8f1e2d4b5
Revises: b7e2c4d91f30
Create Date: 2026-10-26 15:00:00

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'c3a8f1e2d4b5'
down_revision: Union[str, Sequence[str], None] = 'b7e2c4d91f30'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column(
        'sessions', sa.Column('user_agent', sa.String(length=300), server_default='', nullable=False)
    )


def downgrade() -> None:
    op.drop_column('sessions', 'user_agent')
