"""Create baseline application tables."""

from alembic import op
import sqlalchemy as sa

revision = "0001_initial"
down_revision = None
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table("users", sa.Column("id", sa.Integer(), primary_key=True), sa.Column("email", sa.String(255), nullable=False), sa.Column("hashed_password", sa.String(255), nullable=False), sa.Column("role", sa.String(50), nullable=False, server_default="analyst"), sa.Column("created_at", sa.DateTime(), nullable=False))
    op.create_index("ix_users_email", "users", ["email"], unique=True)
    op.create_index("ix_users_role", "users", ["role"])
    op.create_table("projects", sa.Column("id", sa.Integer(), primary_key=True), sa.Column("name", sa.String(255), nullable=False), sa.Column("description", sa.Text()), sa.Column("latitude", sa.Float()), sa.Column("longitude", sa.Float()), sa.Column("created_at", sa.DateTime(), nullable=False))
    op.create_index("ix_projects_name", "projects", ["name"])
    op.create_table("risk_scores", sa.Column("id", sa.Integer(), primary_key=True), sa.Column("project_id", sa.Integer(), sa.ForeignKey("projects.id"), nullable=False), sa.Column("score", sa.Float(), nullable=False), sa.Column("risk_level", sa.String(30), nullable=False), sa.Column("created_at", sa.DateTime(), nullable=False))
    op.create_index("ix_risk_scores_project_id", "risk_scores", ["project_id"])
    op.create_table("notifications", sa.Column("id", sa.Integer(), primary_key=True), sa.Column("recipient_email", sa.String(255), nullable=False), sa.Column("message", sa.Text(), nullable=False), sa.Column("read", sa.Boolean(), nullable=False, server_default=sa.false()), sa.Column("created_at", sa.DateTime(), nullable=False))
    op.create_index("ix_notifications_recipient_email", "notifications", ["recipient_email"])


def downgrade() -> None:
    op.drop_table("notifications")
    op.drop_table("risk_scores")
    op.drop_table("projects")
    op.drop_table("users")
