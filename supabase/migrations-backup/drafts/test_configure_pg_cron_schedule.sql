-- =====================================================
-- Test Script: Configure pg_cron Schedule
-- Story 5-1: Automated Status Detection Job - Task 4
-- =====================================================
-- Purpose: Test and verify the pg_cron configuration
-- Author: System
-- Date: 2025-11-13
-- =====================================================

-- Start a test transaction (for inspection, will rollback read-only queries)
BEGIN;

\echo '==========================================';
\echo 'Test Suite: pg_cron Schedule Configuration';
\echo '==========================================';
\echo '';

-- =====================================================
-- Test 1: Verify pg_cron Extension is Enabled
-- =====================================================

\echo '### Test 1: Verify pg_cron extension is enabled';
SELECT
  extname,
  extversion,
  CASE
    WHEN extname = 'pg_cron' THEN '✓ PASS'
    ELSE '✗ FAIL'
  END AS test_result
FROM pg_extension
WHERE extname = 'pg_cron';

\echo '';

-- =====================================================
-- Test 2: Verify http Extension is Enabled
-- =====================================================

\echo '### Test 2: Verify http extension is enabled';
SELECT
  extname,
  extversion,
  CASE
    WHEN extname = 'http' THEN '✓ PASS'
    ELSE '✗ FAIL'
  END AS test_result
FROM pg_extension
WHERE extname = 'http';

\echo '';

-- =====================================================
-- Test 3: Verify API Key Configuration Setting
-- =====================================================

\echo '### Test 3: Verify API key configuration setting exists';
SELECT
  name,
  setting,
  CASE
    WHEN setting IS NOT NULL AND setting != '' THEN '✓ PASS'
    ELSE '✗ FAIL'
  END AS test_result,
  'API key is configured' AS description
FROM pg_settings
WHERE name = 'app.supabase_function_key';

-- Alternative test using current_setting
\echo '';
\echo '### Test 3b: Verify API key can be retrieved via current_setting()';
SELECT
  current_setting('app.supabase_function_key', true) IS NOT NULL AS key_exists,
  CASE
    WHEN current_setting('app.supabase_function_key', true) IS NOT NULL THEN '✓ PASS'
    ELSE '✗ FAIL'
  END AS test_result,
  'API key can be retrieved' AS description;

\echo '';

-- =====================================================
-- Test 4: Verify Job is Scheduled
-- =====================================================

\echo '### Test 4: Verify the cron job is scheduled';
SELECT
  jobid,
  jobname,
  schedule,
  active,
  CASE
    WHEN jobname = 'update-installment-statuses-daily' THEN '✓ PASS'
    ELSE '✗ FAIL'
  END AS test_result
FROM cron.job
WHERE jobname = 'update-installment-statuses-daily';

\echo '';

-- =====================================================
-- Test 5: Verify Cron Schedule Expression
-- =====================================================

\echo '### Test 5: Verify cron schedule is correct (0 7 * * *)';
SELECT
  jobname,
  schedule,
  CASE
    WHEN schedule = '0 7 * * *' THEN '✓ PASS'
    ELSE '✗ FAIL: Expected "0 7 * * *", got "' || schedule || '"'
  END AS test_result
FROM cron.job
WHERE jobname = 'update-installment-statuses-daily';

\echo '';

-- =====================================================
-- Test 6: Verify Job is Active
-- =====================================================

\echo '### Test 6: Verify the cron job is active';
SELECT
  jobname,
  active,
  CASE
    WHEN active = true THEN '✓ PASS'
    ELSE '✗ FAIL: Job is not active'
  END AS test_result
FROM cron.job
WHERE jobname = 'update-installment-statuses-daily';

\echo '';

-- =====================================================
-- Test 7: Verify Job Command Contains Required Elements
-- =====================================================

\echo '### Test 7: Verify job command contains net.http_post';
SELECT
  jobname,
  command LIKE '%net.http_post%' AS has_http_post,
  command LIKE '%update-installment-statuses%' AS has_function_name,
  command LIKE '%X-API-Key%' AS has_api_key_header,
  command LIKE '%current_setting%' AS has_setting_retrieval,
  CASE
    WHEN command LIKE '%net.http_post%'
      AND command LIKE '%update-installment-statuses%'
      AND command LIKE '%X-API-Key%'
      AND command LIKE '%current_setting%'
    THEN '✓ PASS'
    ELSE '✗ FAIL: Command missing required elements'
  END AS test_result
FROM cron.job
WHERE jobname = 'update-installment-statuses-daily';

\echo '';

-- =====================================================
-- Test 8: View Complete Job Details
-- =====================================================

\echo '### Test 8: View complete job details';
SELECT
  jobid,
  jobname,
  schedule,
  command,
  nodename,
  nodeport,
  database,
  username,
  active,
  jobid AS "Job ID"
FROM cron.job
WHERE jobname = 'update-installment-statuses-daily';

\echo '';

-- =====================================================
-- Test 9: Check Job Run History (if any)
-- =====================================================

\echo '### Test 9: Check job run history (last 5 runs if available)';
SELECT
  runid,
  start_time,
  end_time,
  status,
  return_message,
  CASE
    WHEN status = 'succeeded' THEN '✓ Success'
    WHEN status = 'failed' THEN '✗ Failed'
    ELSE 'Unknown'
  END AS result
FROM cron.job_run_details
WHERE jobid = (SELECT jobid FROM cron.job WHERE jobname = 'update-installment-statuses-daily')
ORDER BY start_time DESC
LIMIT 5;

-- Note: If this returns no rows, the job hasn't run yet (which is expected for a new installation)
\echo '';
\echo 'Note: If no run history is found, the job has not executed yet.';
\echo 'This is expected for a newly scheduled job.';
\echo '';

-- =====================================================
-- Test 10: Verify jobs_log Table Exists
-- =====================================================

\echo '### Test 10: Verify jobs_log table exists (for logging)';
SELECT
  schemaname,
  tablename,
  CASE
    WHEN tablename = 'jobs_log' THEN '✓ PASS'
    ELSE '✗ FAIL'
  END AS test_result
FROM pg_tables
WHERE tablename = 'jobs_log';

\echo '';

-- =====================================================
-- Manual Testing Instructions
-- =====================================================

\echo '==========================================';
\echo 'Manual Testing Instructions';
\echo '==========================================';
\echo '';
\echo '1. To manually trigger the job (for testing):';
\echo '   Execute the following command (update URL with your project reference):';
\echo '';
\echo '   SELECT net.http_post(';
\echo '     url := ''https://your-project-ref.supabase.co/functions/v1/update-installment-statuses'',';
\echo '     headers := jsonb_build_object(';
\echo '       ''Content-Type'', ''application/json'',';
\echo '       ''X-API-Key'', current_setting(''app.supabase_function_key'')';
\echo '     ),';
\echo '     body := ''{}''::jsonb';
\echo '   );';
\echo '';
\echo '2. After manual trigger, check jobs_log table:';
\echo '   SELECT * FROM jobs_log ORDER BY started_at DESC LIMIT 1;';
\echo '';
\echo '3. To view all scheduled jobs:';
\echo '   SELECT * FROM cron.job;';
\echo '';
\echo '4. To unschedule the job (if needed):';
\echo '   SELECT cron.unschedule(''update-installment-statuses-daily'');';
\echo '';
\echo '5. To check next scheduled run time:';
\echo '   SELECT jobid, jobname, schedule FROM cron.job';
\echo '   WHERE jobname = ''update-installment-statuses-daily'';';
\echo '';

-- =====================================================
-- Test Summary
-- =====================================================

\echo '==========================================';
\echo 'Test Summary';
\echo '==========================================';

WITH test_results AS (
  SELECT
    (SELECT COUNT(*) FROM pg_extension WHERE extname = 'pg_cron') AS pg_cron_enabled,
    (SELECT COUNT(*) FROM pg_extension WHERE extname = 'http') AS http_enabled,
    (SELECT COUNT(*) FROM pg_settings WHERE name = 'app.supabase_function_key' AND setting IS NOT NULL) AS api_key_configured,
    (SELECT COUNT(*) FROM cron.job WHERE jobname = 'update-installment-statuses-daily') AS job_scheduled,
    (SELECT COUNT(*) FROM cron.job WHERE jobname = 'update-installment-statuses-daily' AND schedule = '0 7 * * *') AS schedule_correct,
    (SELECT COUNT(*) FROM cron.job WHERE jobname = 'update-installment-statuses-daily' AND active = true) AS job_active
)
SELECT
  pg_cron_enabled + http_enabled + api_key_configured + job_scheduled + schedule_correct + job_active AS tests_passed,
  6 AS total_tests,
  CASE
    WHEN pg_cron_enabled + http_enabled + api_key_configured + job_scheduled + schedule_correct + job_active = 6
    THEN '✓ ALL TESTS PASSED'
    ELSE '✗ SOME TESTS FAILED - Review output above'
  END AS overall_result
FROM test_results;

\echo '';
\echo '==========================================';
\echo 'Production Deployment Checklist';
\echo '==========================================';
\echo '';
\echo '[ ] Update project reference URL in cron job command';
\echo '[ ] Configure actual API key (after Task 5)';
\echo '[ ] Verify Edge Function is deployed: supabase functions list';
\echo '[ ] Test Edge Function manually before waiting for scheduled run';
\echo '[ ] Verify timezone alignment (7:00 AM UTC = 5:00 PM Brisbane AEST)';
\echo '[ ] Monitor jobs_log table after first scheduled run';
\echo '[ ] Check cron.job_run_details for execution history';
\echo '[ ] Set up alerting for failed job runs (Task 8)';
\echo '';

-- Rollback the transaction (no changes needed for read-only tests)
ROLLBACK;

\echo '==========================================';
\echo 'Test suite completed.';
\echo '==========================================';
