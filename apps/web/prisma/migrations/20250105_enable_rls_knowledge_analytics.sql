-- ============================================
-- RLS POLICIES: Knowledge Base & Analytics Tables
-- ============================================
-- Purpose: Enable Row-Level Security on knowledge and analytics tables
-- Security: School-scoped access, coaches only for analytics
-- Created: 2025-01-05

-- ============================================
-- TABLE: knowledge_base
-- ============================================
ALTER TABLE knowledge_base ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view knowledge base for their school
CREATE POLICY "Users view school knowledge base"
ON knowledge_base FOR SELECT
USING (
  school_id IN (
    SELECT school_id FROM users WHERE id = auth.uid()
  )
);

-- Policy: Coaches can create knowledge base entries
CREATE POLICY "Coaches create knowledge base"
ON knowledge_base FOR INSERT
WITH CHECK (
  school_id IN (
    SELECT school_id FROM users
    WHERE id = auth.uid()
    AND role IN ('COACH', 'ADMIN')
  )
);

-- Policy: Coaches can update knowledge base entries
CREATE POLICY "Coaches update knowledge base"
ON knowledge_base FOR UPDATE
USING (
  school_id IN (
    SELECT school_id FROM users
    WHERE id = auth.uid()
    AND role IN ('COACH', 'ADMIN')
  )
);

-- Policy: Admins can delete knowledge base entries
CREATE POLICY "Admins delete knowledge base"
ON knowledge_base FOR DELETE
USING (
  school_id IN (
    SELECT school_id FROM users
    WHERE id = auth.uid()
    AND role = 'ADMIN'
  )
);

-- ============================================
-- TABLE: knowledge_chunks
-- ============================================
ALTER TABLE knowledge_chunks ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view chunks for their school's knowledge base
CREATE POLICY "Users view school knowledge chunks"
ON knowledge_chunks FOR SELECT
USING (
  knowledge_base_id IN (
    SELECT id FROM knowledge_base
    WHERE school_id IN (
      SELECT school_id FROM users WHERE id = auth.uid()
    )
  )
);

-- Policy: System can create chunks (from ingestion pipeline)
CREATE POLICY "System creates knowledge chunks"
ON knowledge_chunks FOR INSERT
WITH CHECK (true);

-- Policy: Coaches can delete chunks
CREATE POLICY "Coaches delete knowledge chunks"
ON knowledge_chunks FOR DELETE
USING (
  knowledge_base_id IN (
    SELECT id FROM knowledge_base
    WHERE school_id IN (
      SELECT school_id FROM users
      WHERE id = auth.uid()
      AND role IN ('COACH', 'ADMIN')
    )
  )
);

-- ============================================
-- TABLE: weekly_summaries
-- ============================================
ALTER TABLE weekly_summaries ENABLE ROW LEVEL SECURITY;

-- Policy: Athletes can view their own summaries
CREATE POLICY "Athletes view own weekly summaries"
ON weekly_summaries FOR SELECT
USING (
  athlete_id = auth.uid()
  AND school_id IN (
    SELECT school_id FROM users WHERE id = auth.uid()
  )
);

-- Policy: Coaches can view summaries with consent
CREATE POLICY "Coaches view weekly summaries with consent"
ON weekly_summaries FOR SELECT
USING (
  school_id IN (
    SELECT school_id FROM users
    WHERE id = auth.uid()
    AND role IN ('COACH', 'ADMIN')
  )
  AND EXISTS (
    SELECT 1 FROM coach_athlete_relations
    WHERE coach_id = auth.uid()
    AND athlete_id = weekly_summaries.athlete_id
    AND consent_granted = true
  )
);

-- Policy: System can create weekly summaries (background job)
CREATE POLICY "System creates weekly summaries"
ON weekly_summaries FOR INSERT
WITH CHECK (true);

-- Policy: System can update weekly summaries
CREATE POLICY "System updates weekly summaries"
ON weekly_summaries FOR UPDATE
USING (true);

-- ============================================
-- TABLE: multi_modal_analytics
-- ============================================
ALTER TABLE multi_modal_analytics ENABLE ROW LEVEL SECURITY;

-- Policy: Athletes can view their own analytics
CREATE POLICY "Athletes view own analytics"
ON multi_modal_analytics FOR SELECT
USING (
  athlete_id = auth.uid()
  AND school_id IN (
    SELECT school_id FROM users WHERE id = auth.uid()
  )
);

-- Policy: Coaches can view analytics with consent
CREATE POLICY "Coaches view analytics with consent"
ON multi_modal_analytics FOR SELECT
USING (
  school_id IN (
    SELECT school_id FROM users
    WHERE id = auth.uid()
    AND role IN ('COACH', 'ADMIN')
  )
  AND EXISTS (
    SELECT 1 FROM coach_athlete_relations
    WHERE coach_id = auth.uid()
    AND athlete_id = multi_modal_analytics.athlete_id
    AND consent_granted = true
  )
);

-- Policy: System can create analytics (background job)
CREATE POLICY "System creates analytics"
ON multi_modal_analytics FOR INSERT
WITH CHECK (true);

-- ============================================
-- TABLE: practice_sessions
-- ============================================
ALTER TABLE practice_sessions ENABLE ROW LEVEL SECURITY;

-- Policy: Athletes can view their own practice sessions
CREATE POLICY "Athletes view own practice sessions"
ON practice_sessions FOR SELECT
USING (
  athlete_id = auth.uid()
  AND school_id IN (
    SELECT school_id FROM users WHERE id = auth.uid()
  )
);

-- Policy: Athletes can create their own practice sessions
CREATE POLICY "Athletes create own practice sessions"
ON practice_sessions FOR INSERT
WITH CHECK (
  athlete_id = auth.uid()
  AND school_id IN (
    SELECT school_id FROM users WHERE id = auth.uid()
  )
);

-- Policy: Coaches can view practice sessions in their school
CREATE POLICY "Coaches view practice sessions in school"
ON practice_sessions FOR SELECT
USING (
  school_id IN (
    SELECT school_id FROM users
    WHERE id = auth.uid()
    AND role IN ('COACH', 'ADMIN')
  )
);

-- Policy: Coaches can create practice sessions
CREATE POLICY "Coaches create practice sessions"
ON practice_sessions FOR INSERT
WITH CHECK (
  school_id IN (
    SELECT school_id FROM users
    WHERE id = auth.uid()
    AND role IN ('COACH', 'ADMIN')
  )
);

-- ============================================
-- TABLE: routine_templates
-- ============================================
ALTER TABLE routine_templates ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view routine templates for their school
CREATE POLICY "Users view school routine templates"
ON routine_templates FOR SELECT
USING (
  school_id IN (
    SELECT school_id FROM users WHERE id = auth.uid()
  )
);

-- Policy: Coaches can create routine templates
CREATE POLICY "Coaches create routine templates"
ON routine_templates FOR INSERT
WITH CHECK (
  school_id IN (
    SELECT school_id FROM users
    WHERE id = auth.uid()
    AND role IN ('COACH', 'ADMIN')
  )
);

-- Policy: Coaches can update routine templates
CREATE POLICY "Coaches update routine templates"
ON routine_templates FOR UPDATE
USING (
  school_id IN (
    SELECT school_id FROM users
    WHERE id = auth.uid()
    AND role IN ('COACH', 'ADMIN')
  )
);

-- Policy: Admins can delete routine templates
CREATE POLICY "Admins delete routine templates"
ON routine_templates FOR DELETE
USING (
  school_id IN (
    SELECT school_id FROM users
    WHERE id = auth.uid()
    AND role = 'ADMIN'
  )
);
