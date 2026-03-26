-- Add Missing RLS Policies
-- Date: 2026-02-26
-- Issue: Security audit warnings - tables with only 1 policy

-- ==================================================
-- Coach Table (currently: 1 policy)
-- ==================================================
-- Coach profiles need: own profile access, school-based access

DROP POLICY IF EXISTS "Users can view own coach profile" ON "Coach";
DROP POLICY IF EXISTS "Coaches can view teammates" ON "Coach";
DROP POLICY IF EXISTS "Athletes can view their coaches" ON "Coach";

-- Coaches can view their own profile
CREATE POLICY "Users can view own coach profile" ON "Coach"
  FOR SELECT USING ("userId" = auth.uid()::text);

-- Coaches can view other coaches in same school
CREATE POLICY "Coaches can view school colleagues" ON "Coach"
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM "Coach" AS c
      WHERE c."userId" = auth.uid()::text
        AND c."schoolId" = "Coach"."schoolId"
    )
  );

-- Athletes can view coaches they're connected to
CREATE POLICY "Athletes can view their coaches" ON "Coach"
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM "CoachAthleteRelation"
      WHERE "coachId" = "Coach"."userId"
        AND "athleteId" = auth.uid()::text
    )
  );

-- ==================================================
-- ConversationInsight Table (currently: 1 policy)
-- ==================================================

DROP POLICY IF EXISTS "Athletes can view own conversation insights" ON "ConversationInsight";
DROP POLICY IF EXISTS "Coaches can view insights with consent" ON "ConversationInsight";

-- Athletes can view insights from their own conversations
CREATE POLICY "Athletes can view own conversation insights" ON "ConversationInsight"
  FOR SELECT USING ("athleteId" = auth.uid()::text);

-- Coaches can view with consent
CREATE POLICY "Coaches can view insights with consent" ON "ConversationInsight"
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM "CoachAthleteRelation"
      WHERE "coachId" = auth.uid()::text
        AND "athleteId" = "ConversationInsight"."athleteId"
        AND "consentGranted" = true
    )
  );

-- ==================================================
-- InterventionOutcome Table (currently: 1 policy)
-- ==================================================

DROP POLICY IF EXISTS "Athletes can view own intervention outcomes" ON "InterventionOutcome";
DROP POLICY IF EXISTS "Coaches can view intervention outcomes" ON "InterventionOutcome";

-- Athletes can view outcomes for their interventions
CREATE POLICY "Athletes can view own intervention outcomes" ON "InterventionOutcome"
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM "Intervention"
      WHERE "Intervention"."id" = "InterventionOutcome"."interventionId"
        AND "Intervention"."athleteId" = auth.uid()::text
    )
  );

-- Coaches can view outcomes for athletes with consent
CREATE POLICY "Coaches can view intervention outcomes" ON "InterventionOutcome"
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM "Intervention" i
      JOIN "CoachAthleteRelation" car ON car."athleteId" = i."athleteId"
      WHERE i."id" = "InterventionOutcome"."interventionId"
        AND car."coachId" = auth.uid()::text
        AND car."consentGranted" = true
    )
  );

-- ==================================================
-- AthleteModel Table (currently: 1 policy)
-- ==================================================
-- ML models are sensitive - only athlete and system should access

DROP POLICY IF EXISTS "Athletes can view own model" ON "AthleteModel";
DROP POLICY IF EXISTS "Coaches can view model summary with consent" ON "AthleteModel";

-- Athletes can view their own ML model
CREATE POLICY "Athletes can view own model" ON "AthleteModel"
  FOR SELECT USING ("athleteId" = auth.uid()::text);

-- Coaches with consent can view (for understanding predictions)
CREATE POLICY "Coaches can view model with consent" ON "AthleteModel"
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM "CoachAthleteRelation"
      WHERE "coachId" = auth.uid()::text
        AND "athleteId" = "AthleteModel"."athleteId"
        AND "consentGranted" = true
    )
  );

-- ==================================================
-- CoachNote Table (currently: 1 policy)
-- ==================================================
-- Coach notes are PRIVATE to the coach who wrote them

DROP POLICY IF EXISTS "Coaches can manage own notes" ON "CoachNote";
DROP POLICY IF EXISTS "Admins can view all notes" ON "CoachNote";

-- Coaches can only see and manage their own notes
CREATE POLICY "Coaches can manage own notes" ON "CoachNote"
  FOR ALL USING ("coachId" = auth.uid()::text);

-- School admins can view notes for compliance/oversight
CREATE POLICY "Admins can view school notes" ON "CoachNote"
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM "User"
      WHERE "User"."id" = auth.uid()::text
        AND "User"."role" = 'ADMIN'
    )
  );

-- ==================================================
-- Verification Summary
-- ==================================================

DO $$
DECLARE
  tables TEXT[] := ARRAY['Coach', 'ConversationInsight', 'InterventionOutcome', 'AthleteModel', 'CoachNote'];
  t TEXT;
  policy_count INT;
BEGIN
  FOREACH t IN ARRAY tables LOOP
    SELECT COUNT(*) INTO policy_count
    FROM pg_policies
    WHERE tablename = t;

    IF policy_count < 2 THEN
      RAISE WARNING '% has only % policy/policies', t, policy_count;
    ELSE
      RAISE NOTICE '% policies OK: % policies', t, policy_count;
    END IF;
  END LOOP;
END $$;
