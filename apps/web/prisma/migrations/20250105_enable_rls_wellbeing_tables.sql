-- ============================================
-- RLS POLICIES: Wellbeing Tables (Mood, Goals, Crisis)
-- ============================================
-- Purpose: Enable Row-Level Security on mental health tracking tables
-- Security: Athletes own data + coaches with consent + crisis escalation
-- Created: 2025-01-05

-- ============================================
-- TABLE: mood_logs
-- ============================================
ALTER TABLE mood_logs ENABLE ROW LEVEL SECURITY;

-- Policy: Athletes can view their own mood logs
CREATE POLICY "Athletes view own mood logs"
ON mood_logs FOR SELECT
USING (
  athlete_id = auth.uid()
  AND school_id IN (
    SELECT school_id FROM users WHERE id = auth.uid()
  )
);

-- Policy: Athletes can create their own mood logs
CREATE POLICY "Athletes create own mood logs"
ON mood_logs FOR INSERT
WITH CHECK (
  athlete_id = auth.uid()
  AND school_id IN (
    SELECT school_id FROM users WHERE id = auth.uid()
  )
);

-- Policy: Athletes can update their own mood logs
CREATE POLICY "Athletes update own mood logs"
ON mood_logs FOR UPDATE
USING (
  athlete_id = auth.uid()
  AND school_id IN (
    SELECT school_id FROM users WHERE id = auth.uid()
  )
);

-- Policy: Athletes can delete their own mood logs
CREATE POLICY "Athletes delete own mood logs"
ON mood_logs FOR DELETE
USING (
  athlete_id = auth.uid()
  AND school_id IN (
    SELECT school_id FROM users WHERE id = auth.uid()
  )
);

-- Policy: Coaches can view mood logs with consent
CREATE POLICY "Coaches view mood logs with consent"
ON mood_logs FOR SELECT
USING (
  school_id IN (
    SELECT school_id FROM users
    WHERE id = auth.uid()
    AND role IN ('COACH', 'ADMIN')
  )
  AND EXISTS (
    SELECT 1 FROM coach_athlete_relations
    WHERE coach_id = auth.uid()
    AND athlete_id = mood_logs.athlete_id
    AND consent_granted = true
  )
);

-- ============================================
-- TABLE: goals
-- ============================================
ALTER TABLE goals ENABLE ROW LEVEL SECURITY;

-- Policy: Athletes can view their own goals
CREATE POLICY "Athletes view own goals"
ON goals FOR SELECT
USING (
  athlete_id = auth.uid()
  AND school_id IN (
    SELECT school_id FROM users WHERE id = auth.uid()
  )
);

-- Policy: Athletes can create their own goals
CREATE POLICY "Athletes create own goals"
ON goals FOR INSERT
WITH CHECK (
  athlete_id = auth.uid()
  AND school_id IN (
    SELECT school_id FROM users WHERE id = auth.uid()
  )
);

-- Policy: Athletes can update their own goals
CREATE POLICY "Athletes update own goals"
ON goals FOR UPDATE
USING (
  athlete_id = auth.uid()
  AND school_id IN (
    SELECT school_id FROM users WHERE id = auth.uid()
  )
);

-- Policy: Athletes can delete their own goals
CREATE POLICY "Athletes delete own goals"
ON goals FOR DELETE
USING (
  athlete_id = auth.uid()
  AND school_id IN (
    SELECT school_id FROM users WHERE id = auth.uid()
  )
);

-- Policy: Coaches can view goals with consent
CREATE POLICY "Coaches view goals with consent"
ON goals FOR SELECT
USING (
  school_id IN (
    SELECT school_id FROM users
    WHERE id = auth.uid()
    AND role IN ('COACH', 'ADMIN')
  )
  AND EXISTS (
    SELECT 1 FROM coach_athlete_relations
    WHERE coach_id = auth.uid()
    AND athlete_id = goals.athlete_id
    AND consent_granted = true
  )
);

-- Policy: Coaches can create goals for their athletes
CREATE POLICY "Coaches create goals for athletes"
ON goals FOR INSERT
WITH CHECK (
  school_id IN (
    SELECT school_id FROM users
    WHERE id = auth.uid()
    AND role IN ('COACH', 'ADMIN')
  )
  AND EXISTS (
    SELECT 1 FROM coach_athlete_relations
    WHERE coach_id = auth.uid()
    AND athlete_id = goals.athlete_id
    AND consent_granted = true
  )
);

-- Policy: Coaches can update goals for their athletes
CREATE POLICY "Coaches update goals for athletes"
ON goals FOR UPDATE
USING (
  school_id IN (
    SELECT school_id FROM users
    WHERE id = auth.uid()
    AND role IN ('COACH', 'ADMIN')
  )
  AND EXISTS (
    SELECT 1 FROM coach_athlete_relations
    WHERE coach_id = auth.uid()
    AND athlete_id = goals.athlete_id
    AND consent_granted = true
  )
);

-- ============================================
-- TABLE: crisis_alerts
-- ============================================
ALTER TABLE crisis_alerts ENABLE ROW LEVEL SECURITY;

-- Policy: System can create crisis alerts (service role)
-- NOTE: Alerts are created by AI detection, not users
CREATE POLICY "System creates crisis alerts"
ON crisis_alerts FOR INSERT
WITH CHECK (true);

-- Policy: Coaches can view crisis alerts in their school
CREATE POLICY "Coaches view crisis alerts in school"
ON crisis_alerts FOR SELECT
USING (
  school_id IN (
    SELECT school_id FROM users
    WHERE id = auth.uid()
    AND role IN ('COACH', 'ADMIN')
  )
);

-- Policy: Coaches can update crisis alerts (mark resolved, add notes)
CREATE POLICY "Coaches update crisis alerts in school"
ON crisis_alerts FOR UPDATE
USING (
  school_id IN (
    SELECT school_id FROM users
    WHERE id = auth.uid()
    AND role IN ('COACH', 'ADMIN')
  )
);

-- Policy: Athletes CANNOT view their own crisis alerts
-- (Prevents interference with intervention process)
-- Only coaches and admins can see alerts

-- ============================================
-- TABLE: crisis_escalations
-- ============================================
ALTER TABLE crisis_escalations ENABLE ROW LEVEL SECURITY;

-- Policy: System can create escalations (service role)
CREATE POLICY "System creates escalations"
ON crisis_escalations FOR INSERT
WITH CHECK (true);

-- Policy: Coaches can view escalations in their school
CREATE POLICY "Coaches view escalations in school"
ON crisis_escalations FOR SELECT
USING (
  alert_id IN (
    SELECT id FROM crisis_alerts
    WHERE school_id IN (
      SELECT school_id FROM users
      WHERE id = auth.uid()
      AND role IN ('COACH', 'ADMIN')
    )
  )
);

-- Policy: Coaches can update escalations (acknowledge, resolve)
CREATE POLICY "Coaches update escalations in school"
ON crisis_escalations FOR UPDATE
USING (
  alert_id IN (
    SELECT id FROM crisis_alerts
    WHERE school_id IN (
      SELECT school_id FROM users
      WHERE id = auth.uid()
      AND role IN ('COACH', 'ADMIN')
    )
  )
);
