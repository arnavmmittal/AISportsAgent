-- Enable RLS Security for CI Testing (Idempotent)
-- This script can be run multiple times safely

-- Enable RLS on all tables (idempotent - won't fail if already enabled)
DO $$
DECLARE
    tbl RECORD;
BEGIN
    FOR tbl IN
        SELECT schemaname, tablename
        FROM pg_tables
        WHERE schemaname = 'public'
    LOOP
        EXECUTE format('ALTER TABLE %I.%I ENABLE ROW LEVEL SECURITY', tbl.schemaname, tbl.tablename);
    END LOOP;
END $$;

-- Create basic RLS policies for CI testing
-- These are permissive policies for testing purposes

-- User table policy (if exists)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'User') THEN
        -- Drop existing policy if exists
        DROP POLICY IF EXISTS "users_all_access" ON "User";
        -- Create permissive policy for testing
        CREATE POLICY "users_all_access" ON "User"
            FOR ALL
            USING (true)
            WITH CHECK (true);
    END IF;
END $$;

-- Athlete table policy (if exists)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'Athlete') THEN
        DROP POLICY IF EXISTS "athletes_all_access" ON "Athlete";
        CREATE POLICY "athletes_all_access" ON "Athlete"
            FOR ALL
            USING (true)
            WITH CHECK (true);
    END IF;
END $$;

-- ChatSession table policy (if exists)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'ChatSession') THEN
        DROP POLICY IF EXISTS "chat_sessions_all_access" ON "ChatSession";
        CREATE POLICY "chat_sessions_all_access" ON "ChatSession"
            FOR ALL
            USING (true)
            WITH CHECK (true);
    END IF;
END $$;

-- Message table policy (if exists)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'Message') THEN
        DROP POLICY IF EXISTS "messages_all_access" ON "Message";
        CREATE POLICY "messages_all_access" ON "Message"
            FOR ALL
            USING (true)
            WITH CHECK (true);
    END IF;
END $$;

-- MoodLog table policy (if exists)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'MoodLog') THEN
        DROP POLICY IF EXISTS "mood_logs_all_access" ON "MoodLog";
        CREATE POLICY "mood_logs_all_access" ON "MoodLog"
            FOR ALL
            USING (true)
            WITH CHECK (true);
    END IF;
END $$;

-- Goal table policy (if exists)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'Goal') THEN
        DROP POLICY IF EXISTS "goals_all_access" ON "Goal";
        CREATE POLICY "goals_all_access" ON "Goal"
            FOR ALL
            USING (true)
            WITH CHECK (true);
    END IF;
END $$;

-- Log completion
DO $$
BEGIN
    RAISE NOTICE 'RLS policies applied successfully for CI testing';
END $$;
