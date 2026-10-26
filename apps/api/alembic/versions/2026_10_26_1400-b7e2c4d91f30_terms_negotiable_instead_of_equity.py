"""terms: negotiable instead of equity/mixed (KAN-138)

«За долю» больше не предлагаем: equity → negotiable («обсуждается»),
mixed (деньги + доля) → paid. Колонки строковые (native_enum=False), схема не меняется.

Revision ID: b7e2c4d91f30
Revises: 3dc58bc7aa69
Create Date: 2026-10-26 14:00:00

"""
from typing import Sequence, Union

from alembic import op


# revision identifiers, used by Alembic.
revision: str = 'b7e2c4d91f30'
down_revision: Union[str, Sequence[str], None] = '3dc58bc7aa69'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.execute("UPDATE startups SET terms = 'negotiable' WHERE terms = 'equity'")
    op.execute("UPDATE startups SET terms = 'paid' WHERE terms = 'mixed'")
    op.execute(
        """
        UPDATE profiles SET looking_for = ARRAY(
            SELECT DISTINCT CASE x WHEN 'equity' THEN 'negotiable' WHEN 'mixed' THEN 'paid' ELSE x END
            FROM unnest(looking_for) AS x
        )::varchar(16)[]
        WHERE looking_for && ARRAY['equity', 'mixed']::varchar(16)[]
        """
    )


def downgrade() -> None:
    op.execute("UPDATE startups SET terms = 'equity' WHERE terms = 'negotiable'")
    op.execute(
        """
        UPDATE profiles SET looking_for = array_replace(looking_for, 'negotiable', 'equity')
        WHERE 'negotiable' = ANY(looking_for)
        """
    )
