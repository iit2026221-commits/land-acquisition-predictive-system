"""Persist the complete project registration record."""

from alembic import op
import sqlalchemy as sa

revision = "0006_project_details"
down_revision = "0005_usernames"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column("projects", sa.Column("details", sa.JSON(), nullable=True))


def downgrade() -> None:
    op.drop_column("projects", "details")
