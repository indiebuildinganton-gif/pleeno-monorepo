-- Drop all tables to start fresh with migrations
-- Run this in Supabase SQL Editor before applying migrations

-- Disable triggers temporarily
SET session_replication_role = 'replica';

-- Drop all policies first (they depend on tables)
DO $$
DECLARE
    r RECORD;
BEGIN
    FOR r IN (SELECT tablename, policyname FROM pg_policies WHERE schemaname = 'public')
    LOOP
        EXECUTE 'DROP POLICY IF EXISTS "' || r.policyname || '" ON ' || r.tablename || ' CASCADE';
    END LOOP;
END $$;

-- Drop all triggers
DO $$
DECLARE
    r RECORD;
BEGIN
    FOR r IN (SELECT DISTINCT trigger_name, event_object_table
              FROM information_schema.triggers
              WHERE trigger_schema = 'public')
    LOOP
        EXECUTE 'DROP TRIGGER IF EXISTS ' || r.trigger_name || ' ON ' || r.event_object_table || ' CASCADE';
    END LOOP;
END $$;

-- Drop all functions
DO $$
DECLARE
    r RECORD;
BEGIN
    FOR r IN (SELECT routine_name, specific_name
              FROM information_schema.routines
              WHERE routine_schema = 'public'
              AND routine_type = 'FUNCTION')
    LOOP
        EXECUTE 'DROP FUNCTION IF EXISTS ' || r.routine_name || ' CASCADE';
    END LOOP;
END $$;

-- Drop all tables
DO $$
DECLARE
    r RECORD;
BEGIN
    FOR r IN (SELECT tablename FROM pg_tables WHERE schemaname = 'public')
    LOOP
        EXECUTE 'DROP TABLE IF EXISTS ' || r.tablename || ' CASCADE';
    END LOOP;
END $$;

-- Re-enable triggers
SET session_replication_role = 'origin';

-- Verify all tables are dropped
SELECT 'Tables remaining: ' || COUNT(*)::text as status
FROM pg_tables
WHERE schemaname = 'public';