-- ============================================
-- RLS POLICIES: Audit & System Tables
-- ============================================
-- Purpose: Enable Row-Level Security on audit logs and system tables
-- Security: Admins only for audit logs, school-scoped for system tables
-- Created: 2025-01-05

-- ============================================
-- TABLE: audit_logs
-- ============================================
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- Policy: Admins can view audit logs for their school
CREATE POLICY "Admins view audit logs in school"
ON audit_logs FOR SELECT
USING (
  school_id IN (
    SELECT school_id FROM users
    WHERE id = auth.uid()
    AND role = 'ADMIN'
  )
);

-- Policy: System can create audit logs (service role)
-- NOTE: All data access is logged, created by service
CREATE POLICY "System creates audit logs"
ON audit_logs FOR INSERT
WITH CHECK (true);

-- Policy: Audit logs are immutable (no updates or deletes)
-- Exception: Admins can soft-delete logs older than 90 days
CREATE POLICY "Admins soft-delete old audit logs"
ON audit_logs FOR UPDATE
USING (
  school_id IN (
    SELECT school_id FROM users
    WHERE id = auth.uid()
    AND role = 'ADMIN'
  )
  AND created_at < NOW() - INTERVAL '90 days'
);

-- ============================================
-- TABLE: token_usage
-- ============================================
ALTER TABLE token_usage ENABLE ROW LEVEL SECURITY;

-- Policy: Admins can view token usage for their school
CREATE POLICY "Admins view token usage in school"
ON token_usage FOR SELECT
USING (
  school_id IN (
    SELECT school_id FROM users
    WHERE id = auth.uid()
    AND role = 'ADMIN'
  )
);

-- Policy: System can create token usage records (service role)
CREATE POLICY "System creates token usage"
ON token_usage FOR INSERT
WITH CHECK (true);

-- Policy: System can update token usage (for aggregations)
CREATE POLICY "System updates token usage"
ON token_usage FOR UPDATE
USING (true);

-- ============================================
-- TABLE: rate_limit_history
-- ============================================
ALTER TABLE rate_limit_history ENABLE ROW LEVEL SECURITY;

-- Policy: Admins can view rate limit history for their school
CREATE POLICY "Admins view rate limit history in school"
ON rate_limit_history FOR SELECT
USING (
  school_id IN (
    SELECT school_id FROM users
    WHERE id = auth.uid()
    AND role = 'ADMIN'
  )
);

-- Policy: System can create rate limit records (service role)
CREATE POLICY "System creates rate limit history"
ON rate_limit_history FOR INSERT
WITH CHECK (true);

-- ============================================
-- TABLE: circuit_breaker_events
-- ============================================
ALTER TABLE circuit_breaker_events ENABLE ROW LEVEL SECURITY;

-- Policy: Admins can view circuit breaker events for their school
CREATE POLICY "Admins view circuit breaker events in school"
ON circuit_breaker_events FOR SELECT
USING (
  school_id IN (
    SELECT school_id FROM users
    WHERE id = auth.uid()
    AND role = 'ADMIN'
  )
);

-- Policy: System can create circuit breaker events (service role)
CREATE POLICY "System creates circuit breaker events"
ON circuit_breaker_events FOR INSERT
WITH CHECK (true);

-- ============================================
-- TABLE: feature_flags
-- ============================================
ALTER TABLE feature_flags ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view feature flags for their school
CREATE POLICY "Users view feature flags in school"
ON feature_flags FOR SELECT
USING (
  school_id IN (
    SELECT school_id FROM users WHERE id = auth.uid()
  )
  OR school_id IS NULL  -- Global flags
);

-- Policy: Admins can create feature flags for their school
CREATE POLICY "Admins create feature flags for school"
ON feature_flags FOR INSERT
WITH CHECK (
  school_id IN (
    SELECT school_id FROM users
    WHERE id = auth.uid()
    AND role = 'ADMIN'
  )
);

-- Policy: Admins can update feature flags for their school
CREATE POLICY "Admins update feature flags for school"
ON feature_flags FOR UPDATE
USING (
  school_id IN (
    SELECT school_id FROM users
    WHERE id = auth.uid()
    AND role = 'ADMIN'
  )
);

-- ============================================
-- TABLE: notifications
-- ============================================
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view their own notifications
CREATE POLICY "Users view own notifications"
ON notifications FOR SELECT
USING (user_id = auth.uid());

-- Policy: Users can update their own notifications (mark as read)
CREATE POLICY "Users update own notifications"
ON notifications FOR UPDATE
USING (user_id = auth.uid());

-- Policy: Users can delete their own notifications
CREATE POLICY "Users delete own notifications"
ON notifications FOR DELETE
USING (user_id = auth.uid());

-- Policy: System can create notifications (service role)
CREATE POLICY "System creates notifications"
ON notifications FOR INSERT
WITH CHECK (true);

-- ============================================
-- TABLE: consent_logs
-- ============================================
ALTER TABLE consent_logs ENABLE ROW LEVEL SECURITY;

-- Policy: Athletes can view their own consent logs
CREATE POLICY "Athletes view own consent logs"
ON consent_logs FOR SELECT
USING (
  athlete_id = auth.uid()
  AND school_id IN (
    SELECT school_id FROM users WHERE id = auth.uid()
  )
);

-- Policy: Coaches can view consent logs for their relations
CREATE POLICY "Coaches view consent logs for relations"
ON consent_logs FOR SELECT
USING (
  coach_id = auth.uid()
  OR school_id IN (
    SELECT school_id FROM users
    WHERE id = auth.uid()
    AND role = 'ADMIN'
  )
);

-- Policy: System can create consent logs (service role)
CREATE POLICY "System creates consent logs"
ON consent_logs FOR INSERT
WITH CHECK (true);

-- Policy: Consent logs are immutable (no updates or deletes)
-- Required for FERPA compliance and audit trail
