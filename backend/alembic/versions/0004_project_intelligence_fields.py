"""Add project intelligence input fields."""

from alembic import op
import sqlalchemy as sa

revision = "0004_project_intelligence_fields"
down_revision = "0003_prediction_runs"
branch_labels = None
depends_on = None


def upgrade() -> None:
    for name, column in (
        ("state", sa.String(100)), ("state_id", sa.String(100)), ("district", sa.String(100)),
        ("district_id", sa.String(100)), ("project_type", sa.String(100)), ("land_area", sa.Float()),
        ("affected_families", sa.Integer()), ("acquisition_stage", sa.String(100)),
    ):
        op.add_column("projects", sa.Column(name, column, nullable=True))
    op.add_column("projects", sa.Column("is_demo", sa.Boolean(), nullable=False, server_default=sa.true()))
    op.add_column("projects", sa.Column("status", sa.String(50), nullable=False, server_default="draft"))


def downgrade() -> None:
    for name in ("status", "is_demo", "acquisition_stage", "affected_families", "land_area", "project_type", "district_id", "district", "state_id", "state"):
        op.drop_column("projects", name)
