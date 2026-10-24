"""events indexes for client events, views and cohorts

Revision ID: 679c20f9ea85
Revises: ae4a9f5a3acb
Create Date: 2026-10-24 11:11:50.208386

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '679c20f9ea85'
down_revision: Union[str, Sequence[str], None] = 'ae4a9f5a3acb'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    # CONCURRENTLY: events пишется на каждый просмотр, обычный CREATE INDEX заблокировал бы вставки.
    with op.get_context().autocommit_block():
        op.create_index(
            "ix_events_name_slug_created_at",
            "events",
            ["name", sa.literal_column("(props->>'slug')"), "created_at"],
            postgresql_concurrently=True,
        )
        op.create_index(
            "ix_events_user_name_created_at",
            "events",
            ["user_id", "name", "created_at"],
            postgresql_concurrently=True,
        )
        op.create_index(
            "ix_events_visitor_created_at",
            "events",
            [sa.literal_column("(props->>'v')"), "created_at"],
            postgresql_concurrently=True,
        )


def downgrade() -> None:
    """Downgrade schema."""
    with op.get_context().autocommit_block():
        for name in (
            "ix_events_visitor_created_at",
            "ix_events_user_name_created_at",
            "ix_events_name_slug_created_at",
        ):
            op.drop_index(name, table_name="events", postgresql_concurrently=True)
