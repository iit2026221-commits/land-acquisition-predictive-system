"""Add Part 9 authorization and audit tables."""

from alembic import op
import sqlalchemy as sa


revision = "0002_part9_authorization"
down_revision = "0001_initial"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "project_assignments",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("user_id", sa.Integer(), sa.ForeignKey("users.id"), nullable=False),
        sa.Column("project_id", sa.Integer(), sa.ForeignKey("projects.id"), nullable=False),
        sa.Column("domain", sa.String(length=50)),
        sa.Column("assigned_at", sa.DateTime(), nullable=False),
    )
    op.create_index("ix_project_assignments_user_id", "project_assignments", ["user_id"])
    op.create_index("ix_project_assignments_project_id", "project_assignments", ["project_id"])
    op.create_table(
        "access_scopes",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("user_id", sa.Integer(), sa.ForeignKey("users.id"), nullable=False),
        sa.Column("scope_type", sa.String(length=20), nullable=False),
        sa.Column("scope_value", sa.String(length=255), nullable=False),
        sa.Column("domain", sa.String(length=50)),
    )
    op.create_index("ix_access_scopes_user_id", "access_scopes", ["user_id"])
    op.create_table(
        "audit_logs",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("event", sa.String(length=100), nullable=False),
        sa.Column("user_id", sa.Integer(), sa.ForeignKey("users.id")),
        sa.Column("request_id", sa.String(length=64), nullable=False),
        sa.Column("resource_type", sa.String(length=50)),
        sa.Column("resource_id", sa.String(length=255)),
        sa.Column("details", sa.String(length=1000)),
        sa.Column("created_at", sa.DateTime(), nullable=False),
    )
    op.create_index("ix_audit_logs_event", "audit_logs", ["event"])
    op.create_index("ix_audit_logs_request_id", "audit_logs", ["request_id"])


def downgrade() -> None:
    op.drop_table("audit_logs")
    op.drop_table("access_scopes")
    op.drop_table("project_assignments")
