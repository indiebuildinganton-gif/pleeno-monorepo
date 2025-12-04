-- =====================================================
-- Rollback Migration: Jobs Infrastructure
-- Epic: 5 - Intelligent Status Automation
-- Story: 5.1 - Automated Status Detection Job
-- =====================================================

-- This rollback migration removes all jobs infrastructure
-- components added in 001_jobs_infrastructure.sql

-- IMPORTANT: Run this only if you need to completely remove
-- the jobs infrastructure. This will:
-- - Unschedule all cron jobs
-- - Drop triggers and functions
-- - Remove agency configuration columns
-- - Drop jobs_log table
-- - Optionally drop extensions (if not used elsewhere)

-- =====================================================
-- SECTION 1: Unschedule pg_cron Jobs
-- =====================================================

-- Unschedule the daily status update job
SELECT cron.unschedule('update-installment-statuses-daily')
WHERE EXISTS (
  SELECT 1 FROM cron.job WHERE jobname = 'update-installment-statuses-daily'
);

-- =====================================================
-- SECTION 2: Drop Triggers and Alert Functions
-- =====================================================

-- Drop trigger
DROP TRIGGER IF EXISTS trigger_notify_job_failure ON jobs_log;

-- Drop notification function
DROP FUNCTION IF EXISTS notify_job_failure();

-- =====================================================
-- SECTION 3: Drop Status Update Function
-- =====================================================

-- Drop the main status update function
DROP FUNCTION IF EXISTS update_installment_statuses();

-- =====================================================
-- SECTION 4: Remove Agency Configuration Fields
-- =====================================================

-- Remove constraints first
ALTER TABLE agencies DROP CONSTRAINT IF EXISTS agencies_timezone_check;
ALTER TABLE agencies DROP CONSTRAINT IF EXISTS agencies_cutoff_time_check;
ALTER TABLE agencies DROP CONSTRAINT IF EXISTS agencies_due_soon_days_check;

-- Remove columns
ALTER TABLE agencies
DROP COLUMN IF EXISTS due_soon_threshold_days,
DROP COLUMN IF EXISTS overdue_cutoff_time,
DROP COLUMN IF EXISTS timezone;

-- =====================================================
-- SECTION 5: Drop Jobs Log Table
-- =====================================================

-- Drop jobs_log table (this will also drop associated policies and indexes)
DROP TABLE IF EXISTS jobs_log CASCADE;

-- =====================================================
-- SECTION 6: Remove API Key Configuration
-- =====================================================

-- Reset the API key setting
-- Note: This requires superuser privileges
-- ALTER DATABASE postgres RESET app.supabase_function_key;

-- =====================================================
-- SECTION 7: Drop Extensions (Optional)
-- =====================================================

-- WARNING: Only drop extensions if they are not used by other features
-- Uncomment the following lines only if you're certain these extensions
-- are not needed elsewhere in your application

-- DROP EXTENSION IF EXISTS http;
-- DROP EXTENSION IF EXISTS pg_cron;

-- =====================================================
-- END OF ROLLBACK MIGRATION
-- =====================================================

-- Verification queries (run manually after rollback):

-- Verify cron job removed
-- SELECT * FROM cron.job WHERE jobname = 'update-installment-statuses-daily';
-- Expected: No rows returned

-- Verify jobs_log table removed
-- SELECT table_name FROM information_schema.tables WHERE table_name = 'jobs_log';
-- Expected: No rows returned

-- Verify agency columns removed
-- SELECT column_name FROM information_schema.columns
-- WHERE table_name = 'agencies'
--   AND column_name IN ('timezone', 'overdue_cutoff_time', 'due_soon_threshold_days');
-- Expected: No rows returned

-- Verify functions removed
-- SELECT routine_name FROM information_schema.routines
-- WHERE routine_name IN ('update_installment_statuses', 'notify_job_failure');
-- Expected: No rows returned
