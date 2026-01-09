-- ============================================
-- RLS POLICIES: Chat Tables (Sessions, Messages, Summaries)
-- ============================================
-- Purpose: Enable Row-Level Security on chat-related tables
-- Security: Athletes own data + coaches with consent
-- Created: 2025-01-05

-- ============================================
-- TABLE: chat_sessions
-- ============================================
ALTER TABLE chat_sessions ENABLE ROW LEVEL SECURITY;

-- Policy: Athletes can view their own sessions
CREATE POLICY "Athletes view own sessions"
ON chat_sessions FOR SELECT
USING (
  athlete_id = auth.uid()
  AND school_id IN (
    SELECT school_id FROM users WHERE id = auth.uid()
  )
);

-- Policy: Athletes can create their own sessions
CREATE POLICY "Athletes create own sessions"
ON chat_sessions FOR INSERT
WITH CHECK (
  athlete_id = auth.uid()
  AND school_id IN (
    SELECT school_id FROM users WHERE id = auth.uid()
  )
);

-- Policy: Athletes can update their own sessions
CREATE POLICY "Athletes update own sessions"
ON chat_sessions FOR UPDATE
USING (
  athlete_id = auth.uid()
  AND school_id IN (
    SELECT school_id FROM users WHERE id = auth.uid()
  )
);

-- Policy: Athletes can delete their own sessions
CREATE POLICY "Athletes delete own sessions"
ON chat_sessions FOR DELETE
USING (
  athlete_id = auth.uid()
  AND school_id IN (
    SELECT school_id FROM users WHERE id = auth.uid()
  )
);

-- Policy: Coaches can view sessions with consent
CREATE POLICY "Coaches view sessions with consent"
ON chat_sessions FOR SELECT
USING (
  school_id IN (
    SELECT school_id FROM users
    WHERE id = auth.uid()
    AND role IN ('COACH', 'ADMIN')
  )
  AND EXISTS (
    SELECT 1 FROM coach_athlete_relations
    WHERE coach_id = auth.uid()
    AND athlete_id = chat_sessions.athlete_id
    AND consent_granted = true
  )
);

-- ============================================
-- TABLE: messages
-- ============================================
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- Policy: Athletes can view messages in their sessions
CREATE POLICY "Athletes view own messages"
ON messages FOR SELECT
USING (
  session_id IN (
    SELECT id FROM chat_sessions WHERE athlete_id = auth.uid()
  )
);

-- Policy: Athletes can create messages in their sessions
CREATE POLICY "Athletes create own messages"
ON messages FOR INSERT
WITH CHECK (
  session_id IN (
    SELECT id FROM chat_sessions WHERE athlete_id = auth.uid()
  )
);

-- Policy: Coaches can view messages with consent
CREATE POLICY "Coaches view messages with consent"
ON messages FOR SELECT
USING (
  session_id IN (
    SELECT cs.id FROM chat_sessions cs
    WHERE cs.school_id IN (
      SELECT school_id FROM users
      WHERE id = auth.uid()
      AND role IN ('COACH', 'ADMIN')
    )
    AND EXISTS (
      SELECT 1 FROM coach_athlete_relations car
      WHERE car.coach_id = auth.uid()
      AND car.athlete_id = cs.athlete_id
      AND car.consent_granted = true
    )
  )
);

-- ============================================
-- TABLE: chat_summaries
-- ============================================
ALTER TABLE chat_summaries ENABLE ROW LEVEL SECURITY;

-- Policy: Athletes can view their own summaries
CREATE POLICY "Athletes view own summaries"
ON chat_summaries FOR SELECT
USING (
  session_id IN (
    SELECT id FROM chat_sessions WHERE athlete_id = auth.uid()
  )
);

-- Policy: Coaches can view summaries with consent
CREATE POLICY "Coaches view summaries with consent"
ON chat_summaries FOR SELECT
USING (
  session_id IN (
    SELECT cs.id FROM chat_sessions cs
    WHERE cs.school_id IN (
      SELECT school_id FROM users
      WHERE id = auth.uid()
      AND role IN ('COACH', 'ADMIN')
    )
    AND EXISTS (
      SELECT 1 FROM coach_athlete_relations car
      WHERE car.coach_id = auth.uid()
      AND car.athlete_id = cs.athlete_id
      AND car.consent_granted = true
    )
  )
);

-- Policy: System can create summaries (service role)
-- NOTE: This requires service role key, not regular JWT
CREATE POLICY "System creates summaries"
ON chat_summaries FOR INSERT
WITH CHECK (true);

-- Policy: System can update summaries (service role)
CREATE POLICY "System updates summaries"
ON chat_summaries FOR UPDATE
USING (true);
