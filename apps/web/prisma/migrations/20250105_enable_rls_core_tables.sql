-- ============================================
-- RLS POLICIES: Core Tables (Users, Schools, Athletes, Coaches)
-- ============================================
-- Purpose: Enable Row-Level Security on core identity tables
-- Security: Multi-tenant isolation + role-based access
-- Created: 2025-01-05

-- ============================================
-- TABLE: users
-- ============================================
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view their own record
CREATE POLICY "Users can view own record"
ON users FOR SELECT
USING (id = auth.uid());

-- Policy: Users can update their own record
CREATE POLICY "Users can update own record"
ON users FOR UPDATE
USING (id = auth.uid());

-- Policy: Admins can view all users in their school
CREATE POLICY "Admins view all users in school"
ON users FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM users AS u
    WHERE u.id = auth.uid()
    AND u.role = 'ADMIN'
    AND u.school_id = users.school_id
  )
);

-- Policy: Admins can update users in their school
CREATE POLICY "Admins update users in school"
ON users FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM users AS u
    WHERE u.id = auth.uid()
    AND u.role = 'ADMIN'
    AND u.school_id = users.school_id
  )
);

-- ============================================
-- TABLE: schools
-- ============================================
ALTER TABLE schools ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view their own school
CREATE POLICY "Users view own school"
ON schools FOR SELECT
USING (
  id IN (
    SELECT school_id FROM users WHERE id = auth.uid()
  )
);

-- Policy: Admins can update their school
CREATE POLICY "Admins update own school"
ON schools FOR UPDATE
USING (
  id IN (
    SELECT school_id FROM users
    WHERE id = auth.uid()
    AND role = 'ADMIN'
  )
);

-- ============================================
-- TABLE: athletes
-- ============================================
ALTER TABLE athletes ENABLE ROW LEVEL SECURITY;

-- Policy: Athletes can view their own record
CREATE POLICY "Athletes view own record"
ON athletes FOR SELECT
USING (user_id = auth.uid());

-- Policy: Athletes can update their own record
CREATE POLICY "Athletes update own record"
ON athletes FOR UPDATE
USING (user_id = auth.uid());

-- Policy: Coaches can view athletes in their school
CREATE POLICY "Coaches view athletes in school"
ON athletes FOR SELECT
USING (
  school_id IN (
    SELECT school_id FROM users
    WHERE id = auth.uid()
    AND role IN ('COACH', 'ADMIN')
  )
);

-- Policy: Admins can update athletes in their school
CREATE POLICY "Admins update athletes in school"
ON athletes FOR UPDATE
USING (
  school_id IN (
    SELECT school_id FROM users
    WHERE id = auth.uid()
    AND role = 'ADMIN'
  )
);

-- ============================================
-- TABLE: coaches
-- ============================================
ALTER TABLE coaches ENABLE ROW LEVEL SECURITY;

-- Policy: Coaches can view their own record
CREATE POLICY "Coaches view own record"
ON coaches FOR SELECT
USING (user_id = auth.uid());

-- Policy: Coaches can update their own record
CREATE POLICY "Coaches update own record"
ON coaches FOR UPDATE
USING (user_id = auth.uid());

-- Policy: Admins can view all coaches in their school
CREATE POLICY "Admins view coaches in school"
ON coaches FOR SELECT
USING (
  school_id IN (
    SELECT school_id FROM users
    WHERE id = auth.uid()
    AND role = 'ADMIN'
  )
);

-- Policy: Athletes can view their assigned coaches
CREATE POLICY "Athletes view assigned coaches"
ON coaches FOR SELECT
USING (
  user_id IN (
    SELECT coach_id FROM coach_athlete_relations
    WHERE athlete_id = auth.uid()
  )
);

-- ============================================
-- TABLE: coach_athlete_relations
-- ============================================
ALTER TABLE coach_athlete_relations ENABLE ROW LEVEL SECURITY;

-- Policy: Coaches can view their athlete relations
CREATE POLICY "Coaches view own relations"
ON coach_athlete_relations FOR SELECT
USING (coach_id = auth.uid());

-- Policy: Athletes can view their coach relations
CREATE POLICY "Athletes view own relations"
ON coach_athlete_relations FOR SELECT
USING (athlete_id = auth.uid());

-- Policy: Coaches can create relations (assign themselves)
CREATE POLICY "Coaches create relations"
ON coach_athlete_relations FOR INSERT
WITH CHECK (
  coach_id = auth.uid()
  AND EXISTS (
    SELECT 1 FROM users
    WHERE id = auth.uid()
    AND role = 'COACH'
  )
);

-- Policy: Coaches and athletes can update consent
CREATE POLICY "Update consent on own relations"
ON coach_athlete_relations FOR UPDATE
USING (
  coach_id = auth.uid() OR athlete_id = auth.uid()
);

-- Policy: Admins can view all relations in their school
CREATE POLICY "Admins view relations in school"
ON coach_athlete_relations FOR SELECT
USING (
  school_id IN (
    SELECT school_id FROM users
    WHERE id = auth.uid()
    AND role = 'ADMIN'
  )
);

-- Policy: Admins can delete relations in their school
CREATE POLICY "Admins delete relations in school"
ON coach_athlete_relations FOR DELETE
USING (
  school_id IN (
    SELECT school_id FROM users
    WHERE id = auth.uid()
    AND role = 'ADMIN'
  )
);
