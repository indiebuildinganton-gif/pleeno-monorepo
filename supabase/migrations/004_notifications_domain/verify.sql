-- =====================================================
-- Verification Queries: Jobs Infrastructure Migration
-- Epic: 5 - Intelligent Status Automation
-- Story: 5.1 - Automated Status Detection Job
-- =====================================================

-- Run these queries after applying the migration to verify
-- that all components have been installed correctly.

-- =====================================================
-- SECTION 1: Verify Extensions
-- =====================================================

-- Check that pg_cron and http extensions are installed
SELECT
  extname AS extension_name,
  extversion AS version,
  CASE
    WHEN extname = 'pg_cron' THEN '✓ Job scheduler installed'
    WHEN extname = 'http' THEN '✓ HTTP client installed'
  END AS status
FROM pg_extension
WHERE extname IN ('pg_cron', 'http')
ORDER BY extname;

-- Expected: 2 rows (pg_cron and http)

-- =====================================================
-- SECTION 2: Verify Jobs Log Table
-- =====================================================

-- Check that jobs_log table exists with correct structure
SELECT
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_name = 'jobs_log'
ORDER BY ordinal_position;

-- Expected: 9 columns (id, job_name, started_at, completed_at,
--           records_updated, status, error_message, metadata, created_at)

-- Check indexes on jobs_log
SELECT
  indexname AS index_name,
  indexdef AS definition
FROM pg_indexes
WHERE tablename = 'jobs_log'
ORDER BY indexname;

-- Expected: At least 3 indexes (PK + idx_jobs_log_job_name + idx_jobs_log_status)

-- Check RLS is enabled
SELECT
  tablename,
  rowsecurity AS rls_enabled
FROM pg_tables
WHERE tablename = 'jobs_log';

-- Expected: rls_enabled = true

-- Check RLS policies
SELECT
  policyname AS policy_name,
  cmd AS command,
  roles
FROM pg_policies
WHERE tablename = 'jobs_log'
ORDER BY policyname;

-- Expected: 3 policies (admin SELECT, service_role INSERT, service_role UPDATE)

-- =====================================================
-- SECTION 3: Verify Agency Configuration Fields
-- =====================================================

-- Check that new columns were added to agencies table
SELECT
  column_name,
  data_type,
  column_default,
  is_nullable
FROM information_schema.columns
WHERE table_name = 'agencies'
  AND column_name IN ('timezone', 'overdue_cutoff_time', 'due_soon_threshold_days')
ORDER BY column_name;

-- Expected: 3 rows (timezone, overdue_cutoff_time, due_soon_threshold_days)

-- Check constraints on agencies table
SELECT
  conname AS constraint_name,
  contype AS constraint_type,
  pg_get_constraintdef(oid) AS definition
FROM pg_constraint
WHERE conrelid = 'agencies'::regclass
  AND conname LIKE 'agencies_%_check'
ORDER BY conname;

-- Expected: 3 CHECK constraints (timezone, cutoff_time, due_soon_days)

-- Check sample agency data with new fields
SELECT
  id,
  name,
  timezone,
  overdue_cutoff_time,
  due_soon_threshold_days
FROM agencies
LIMIT 5;

-- Expected: Agencies with default values (timezone='Australia/Brisbane',
--           overdue_cutoff_time='17:00:00', due_soon_threshold_days=4)

-- =====================================================
-- SECTION 4: Verify Status Update Function
-- =====================================================

-- Check that update_installment_statuses function exists
SELECT
  routine_name AS function_name,
  routine_type AS type,
  data_type AS return_type,
  security_type
FROM information_schema.routines
WHERE routine_name = 'update_installment_statuses';

-- Expected: 1 row (function exists, security_type='DEFINER')

-- Check function parameters and return structure
SELECT
  proname AS function_name,
  pg_get_function_arguments(oid) AS arguments,
  pg_get_function_result(oid) AS returns
FROM pg_proc
WHERE proname = 'update_installment_statuses';

-- Expected: Returns TABLE(agency_id uuid, updated_count integer, transitions jsonb)

-- =====================================================
-- SECTION 5: Verify Alert Trigger
-- =====================================================

-- Check that notify_job_failure function exists
SELECT
  routine_name AS function_name,
  routine_type AS type
FROM information_schema.routines
WHERE routine_name = 'notify_job_failure';

-- Expected: 1 row (function exists)

-- Check that trigger exists on jobs_log table
SELECT
  trigger_name,
  event_manipulation AS event,
  action_timing AS timing,
  action_statement
FROM information_schema.triggers
WHERE trigger_name = 'trigger_notify_job_failure'
  AND event_object_table = 'jobs_log';

-- Expected: 1 row (trigger exists, fires AFTER INSERT OR UPDATE)

-- =====================================================
-- SECTION 6: Verify pg_cron Schedule
-- =====================================================

-- Check that the daily job is scheduled
SELECT
  jobid AS job_id,
  jobname AS job_name,
  schedule,
  active,
  command
FROM cron.job
WHERE jobname = 'update-installment-statuses-daily';

-- Expected: 1 row (job scheduled at '0 7 * * *', active=true)
-- Note: If job is not scheduled, it may be commented out in migration
--       waiting for project-ref and API key configuration

-- =====================================================
-- SECTION 7: API Key Configuration
-- =====================================================

-- Check if API key setting exists
-- Note: This may fail if not configured yet, which is expected
SELECT
  name,
  setting
FROM pg_settings
WHERE name = 'app.supabase_function_key';

-- Expected: 1 row with setting value (or 0 rows if not configured yet)
-- Note: Setting value will show as masked for security

-- =====================================================
-- SECTION 8: Integration Test (Optional)
-- =====================================================

-- Test the update_installment_statuses function
-- WARNING: This will modify data. Only run in test/dev environment!
-- Uncomment to run:

/*
SELECT
  agency_id,
  updated_count,
  transitions
FROM update_installment_statuses()
ORDER BY updated_count DESC;
*/

-- Expected: Returns one row per agency with update counts

-- =====================================================
-- SECTION 9: Summary Report
-- =====================================================

-- Generate a summary report of all components
SELECT
  'Extensions' AS component,
  COUNT(*) AS installed,
  2 AS expected,
  CASE WHEN COUNT(*) = 2 THEN '✓ PASS' ELSE '✗ FAIL' END AS status
FROM pg_extension
WHERE extname IN ('pg_cron', 'http')

UNION ALL

SELECT
  'jobs_log table',
  COUNT(*),
  1,
  CASE WHEN COUNT(*) = 1 THEN '✓ PASS' ELSE '✗ FAIL' END
FROM information_schema.tables
WHERE table_name = 'jobs_log'

UNION ALL

SELECT
  'jobs_log columns',
  COUNT(*),
  9,
  CASE WHEN COUNT(*) = 9 THEN '✓ PASS' ELSE '✗ FAIL' END
FROM information_schema.columns
WHERE table_name = 'jobs_log'

UNION ALL

SELECT
  'Agency config columns',
  COUNT(*),
  3,
  CASE WHEN COUNT(*) = 3 THEN '✓ PASS' ELSE '✗ FAIL' END
FROM information_schema.columns
WHERE table_name = 'agencies'
  AND column_name IN ('timezone', 'overdue_cutoff_time', 'due_soon_threshold_days')

UNION ALL

SELECT
  'Agency constraints',
  COUNT(*),
  3,
  CASE WHEN COUNT(*) = 3 THEN '✓ PASS' ELSE '✗ FAIL' END
FROM pg_constraint
WHERE conrelid = 'agencies'::regclass
  AND conname LIKE 'agencies_%_check'

UNION ALL

SELECT
  'Functions',
  COUNT(*),
  2,
  CASE WHEN COUNT(*) = 2 THEN '✓ PASS' ELSE '✗ FAIL' END
FROM information_schema.routines
WHERE routine_name IN ('update_installment_statuses', 'notify_job_failure')

UNION ALL

SELECT
  'Triggers',
  COUNT(*),
  1,
  CASE WHEN COUNT(*) = 1 THEN '✓ PASS' ELSE '✗ FAIL' END
FROM information_schema.triggers
WHERE trigger_name = 'trigger_notify_job_failure'

UNION ALL

SELECT
  'RLS policies',
  COUNT(*),
  3,
  CASE WHEN COUNT(*) >= 3 THEN '✓ PASS' ELSE '✗ FAIL' END
FROM pg_policies
WHERE tablename = 'jobs_log';

-- Expected: All rows show '✓ PASS' status

-- =====================================================
-- END OF VERIFICATION
-- =====================================================

-- If all checks pass, the migration was successful!
-- Next steps:
-- 1. Configure API key (if not done yet)
-- 2. Update pg_cron job with actual project-ref
-- 3. Deploy Edge Function
-- 4. Test end-to-end workflow
