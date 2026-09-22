"""Add prediction run lifecycle storage."""

from alembic import op
import sqlalchemy as sa

revision = "0003_prediction_runs"
down_revision = "0002_part9_authorization"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "prediction_runs",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("project_id", sa.Integer(), sa.ForeignKey("projects.id")),
        sa.Column("project_ref", sa.String(length=255), nullable=False),
        sa.Column("requested_by", sa.Integer(), sa.ForeignKey("users.id"), nullable=False),
        sa.Column("request_id", sa.String(length=64), nullable=False),
        sa.Column("status", sa.String(length=30), nullable=False),
        sa.Column("model_version", sa.String(length=100)),
        sa.Column("response_json", sa.Text()),
        sa.Column("error_code", sa.String(length=100)),
        sa.Column("created_at", sa.DateTime(), nullable=False),
        sa.Column("completed_at", sa.DateTime()),
    )
    for name, column in (("project_ref", "project_ref"), ("requested_by", "requested_by"), ("request_id", "request_id"), ("status", "status")):
        op.create_index(f"ix_prediction_runs_{name}", "prediction_runs", [column])


def downgrade() -> None:
    op.drop_table("prediction_runs")
