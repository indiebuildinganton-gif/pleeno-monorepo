-- Migration 007: RLS Policy Summary for Entities Domain
-- Epic 3: Entities Domain - Student Registry
-- Story 3.2: Student Registry - Database foundation for student management system

-- ============================================================
-- RLS POLICY SUMMARY
-- ============================================================

-- This migration serves as a summary and verification that all entities
-- domain tables have Row-Level Security (RLS) enabled with proper
-- multi-tenant isolation via agency_id.

-- All RLS policies are defined inline within each table's schema file:
-- - 003_students_schema.sql
-- - 004_enrollments_schema.sql
-- - 005_student_notes_schema.sql
-- - 006_student_documents_schema.sql

-- ============================================================
-- RLS VERIFICATION
-- ============================================================

-- Verify that all entities tables have RLS enabled
DO $$
BEGIN
  -- Check students table
  IF NOT (SELECT relrowsecurity FROM pg_class WHERE relname = 'students') THEN
    RAISE EXCEPTION 'RLS is not enabled on students table';
  END IF;

  -- Check student_enrollments table
  IF NOT (SELECT relrowsecurity FROM pg_class WHERE relname = 'student_enrollments') THEN
    RAISE EXCEPTION 'RLS is not enabled on student_enrollments table';
  END IF;

  -- Check student_notes table
  IF NOT (SELECT relrowsecurity FROM pg_class WHERE relname = 'student_notes') THEN
    RAISE EXCEPTION 'RLS is not enabled on student_notes table';
  END IF;

  -- Check student_documents table
  IF NOT (SELECT relrowsecurity FROM pg_class WHERE relname = 'student_documents') THEN
    RAISE EXCEPTION 'RLS is not enabled on student_documents table';
  END IF;

  RAISE NOTICE 'RLS verification passed: All entities domain tables have RLS enabled';
END $$;

-- ============================================================
-- POLICY PATTERN DOCUMENTATION
-- ============================================================

-- All tables in the entities domain follow the same RLS pattern:
--
-- 1. SELECT Policy: Users can only see records from their agency
--    USING (agency_id = (SELECT agency_id FROM users WHERE id = auth.uid()))
--
-- 2. INSERT Policy: Users can only insert records for their agency
--    WITH CHECK (agency_id = (SELECT agency_id FROM users WHERE id = auth.uid()))
--
-- 3. UPDATE Policy: Users can only update records from their agency
--    USING (agency_id = (SELECT agency_id FROM users WHERE id = auth.uid()))
--    WITH CHECK (agency_id = (SELECT agency_id FROM users WHERE id = auth.uid()))
--
-- 4. DELETE Policy: Users can only delete records from their agency
--    USING (agency_id = (SELECT agency_id FROM users WHERE id = auth.uid()))
--
-- This ensures complete multi-tenant isolation where:
-- - Each agency's data is completely isolated
-- - Users can only access data belonging to their agency
-- - No cross-agency data leakage is possible
-- - All queries are automatically filtered by agency_id

-- ============================================================
-- ADDITIONAL NOTES
-- ============================================================

-- Performance Considerations:
-- - All tables have indexes on agency_id for optimal RLS query performance
-- - The pattern (SELECT agency_id FROM users WHERE id = auth.uid()) is used
--   consistently across all policies for maintainability
-- - Supabase caches auth.uid() so the performance impact is minimal

-- Security Considerations:
-- - RLS policies enforce tenant isolation at the database level
-- - Even if application logic has bugs, data isolation is maintained
-- - Service role can bypass RLS for admin operations and migrations
-- - Authenticated users must exist in the users table to access any data

COMMENT ON SCHEMA public IS
  'Entities domain tables (students, enrollments, notes, documents) use RLS for multi-tenant isolation';
