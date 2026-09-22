"""Add development login usernames."""

from alembic import op
import sqlalchemy as sa

revision = "0005_usernames"
down_revision = "0004_project_intelligence_fields"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column("users", sa.Column("username", sa.String(100), nullable=True))
    connection = op.get_bind()
    connection.execute(sa.text("UPDATE users SET username = substr(email, 1, instr(email, '@') - 1) WHERE username IS NULL"))
    op.create_index("ix_users_username", "users", ["username"], unique=True)


def downgrade() -> None:
    op.drop_index("ix_users_username", table_name="users")
    op.drop_column("users", "username")
