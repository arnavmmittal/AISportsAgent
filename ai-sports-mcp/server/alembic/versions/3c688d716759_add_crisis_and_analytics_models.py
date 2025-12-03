"""Add crisis and analytics models

Revision ID: 3c688d716759
Revises:
Create Date: 2025-12-03 13:44:53.711347

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql


# revision identifiers, used by Alembic.
revision: str = '3c688d716759'
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Create CrisisSeverity enum
    crisis_severity_enum = postgresql.ENUM('CRITICAL', 'HIGH', 'MEDIUM', 'LOW', name='crisisseverity')
    crisis_severity_enum.create(op.get_bind())

    # Create CrisisAlert table
    op.create_table(
        'CrisisAlert',
        sa.Column('id', sa.String(), nullable=False),
        sa.Column('athleteId', sa.String(), nullable=False),
        sa.Column('sessionId', sa.String(), nullable=True),
        sa.Column('severity', crisis_severity_enum, nullable=False),
        sa.Column('detectedAt', sa.DateTime(), nullable=False),
        sa.Column('reviewed', sa.Boolean(), nullable=False, server_default='false'),
        sa.Column('reviewedAt', sa.DateTime(), nullable=True),
        sa.Column('reviewedBy', sa.String(), nullable=True),
        sa.Column('escalated', sa.Boolean(), nullable=False, server_default='false'),
        sa.Column('escalatedTo', sa.String(), nullable=True),
        sa.Column('escalatedAt', sa.DateTime(), nullable=True),
        sa.Column('notes', sa.Text(), nullable=True),
        sa.Column('context', sa.JSON(), nullable=True),
        sa.Column('resolved', sa.Boolean(), nullable=False, server_default='false'),
        sa.Column('resolvedAt', sa.DateTime(), nullable=True),
        sa.Column('createdAt', sa.DateTime(), nullable=False),
        sa.Column('updatedAt', sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(['athleteId'], ['Athlete.userId'], ),
        sa.ForeignKeyConstraint(['sessionId'], ['ChatSession.id'], ),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index('idx_crisisalert_athleteId', 'CrisisAlert', ['athleteId'])
    op.create_index('idx_crisisalert_severity', 'CrisisAlert', ['severity'])
    op.create_index('idx_crisisalert_detectedAt', 'CrisisAlert', ['detectedAt'])
    op.create_index('idx_crisisalert_reviewed', 'CrisisAlert', ['reviewed'])

    # Create ConversationInsight table
    op.create_table(
        'ConversationInsight',
        sa.Column('id', sa.String(), nullable=False),
        sa.Column('athleteId', sa.String(), nullable=False),
        sa.Column('sessionId', sa.String(), nullable=False),
        sa.Column('themes', postgresql.ARRAY(sa.String()), nullable=False, server_default='{}'),
        sa.Column('sentiment', sa.Integer(), nullable=True),
        sa.Column('emotions', sa.JSON(), nullable=True),
        sa.Column('discoveryPhase', sa.String(), nullable=True),
        sa.Column('interventionUsed', sa.String(), nullable=True),
        sa.Column('keyTopics', postgresql.ARRAY(sa.String()), nullable=False, server_default='{}'),
        sa.Column('actionItems', postgresql.ARRAY(sa.String()), nullable=False, server_default='{}'),
        sa.Column('extractedAt', sa.DateTime(), nullable=False),
        sa.Column('createdAt', sa.DateTime(), nullable=False),
        sa.Column('updatedAt', sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(['athleteId'], ['Athlete.userId'], ),
        sa.ForeignKeyConstraint(['sessionId'], ['ChatSession.id'], ),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index('idx_conversationinsight_athleteId', 'ConversationInsight', ['athleteId'])
    op.create_index('idx_conversationinsight_sessionId', 'ConversationInsight', ['sessionId'])
    op.create_index('idx_conversationinsight_extractedAt', 'ConversationInsight', ['extractedAt'])


def downgrade() -> None:
    # Drop indexes and tables in reverse order
    op.drop_index('idx_conversationinsight_extractedAt', table_name='ConversationInsight')
    op.drop_index('idx_conversationinsight_sessionId', table_name='ConversationInsight')
    op.drop_index('idx_conversationinsight_athleteId', table_name='ConversationInsight')
    op.drop_table('ConversationInsight')

    op.drop_index('idx_crisisalert_reviewed', table_name='CrisisAlert')
    op.drop_index('idx_crisisalert_detectedAt', table_name='CrisisAlert')
    op.drop_index('idx_crisisalert_severity', table_name='CrisisAlert')
    op.drop_index('idx_crisisalert_athleteId', table_name='CrisisAlert')
    op.drop_table('CrisisAlert')

    # Drop enum
    crisis_severity_enum = postgresql.ENUM('CRITICAL', 'HIGH', 'MEDIUM', 'LOW', name='crisisseverity')
    crisis_severity_enum.drop(op.get_bind())
