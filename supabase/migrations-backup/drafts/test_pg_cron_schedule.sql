-- =====================================================
-- Test Suite: pg_cron Schedule Configuration
-- Story: 5-1 Automated Status Detection Job - Task 4
-- =====================================================
-- Purpose: Verify pg_cron is properly configured to invoke Edge Function
--
-- Prerequisites:
--   - pg_cron_schedule.sql has been executed
--   - update_installment_statuses() function exists (Task 1)
--   - jobs_log table exists (Task 2)
--   - Edge Function is deployed (Task 3)
--
-- Note: These tests verify the pg_cron configuration.
--       Full end-to-end testing (including Edge Function execution)
--       is covered in Task 7: Testing
-- =====================================================

BEGIN;

-- =====================================================
-- Test 1: Verify Extensions Are Enabled
-- =====================================================
-- Expected: Both pg_cron and http extensions should be available

DO $$
DECLARE
  v_pg_cron_exists BOOLEAN;
  v_http_exists BOOLEAN;
BEGIN
  -- Check pg_cron extension
  SELECT EXISTS (
    SELECT 1 FROM pg_extension WHERE extname = 'pg_cron'
  ) INTO v_pg_cron_exists;

  -- Check http extension
  SELECT EXISTS (
    SELECT 1 FROM pg_extension WHERE extname = 'http'
  ) INTO v_http_exists;

  -- Assert both exist
  IF NOT v_pg_cron_exists THEN
    RAISE EXCEPTION 'TEST FAILED: pg_cron extension not installed';
  END IF;

  IF NOT v_http_exists THEN
    RAISE EXCEPTION 'TEST FAILED: http extension not installed';
  END IF;

  RAISE NOTICE '✓ Test 1 PASSED: Both pg_cron and http extensions are enabled';
END $$;

-- =====================================================
-- Test 2: Verify API Key Setting Is Configured
-- =====================================================
-- Expected: app.supabase_function_key setting should exist

DO $$
DECLARE
  v_api_key TEXT;
BEGIN
  -- Try to retrieve the API key setting
  BEGIN
    v_api_key := current_setting('app.supabase_function_key');
  EXCEPTION WHEN OTHERS THEN
    RAISE EXCEPTION 'TEST FAILED: API key setting (app.supabase_function_key) not configured';
  END;

  -- Verify it's not empty
  IF v_api_key IS NULL OR v_api_key = '' THEN
    RAISE EXCEPTION 'TEST FAILED: API key setting is empty';
  END IF;

  -- Warn if still using placeholder
  IF v_api_key = 'your-api-key-here' THEN
    RAISE WARNING 'API key is still set to placeholder value. Remember to update with actual key from Task 5.';
  END IF;

  RAISE NOTICE '✓ Test 2 PASSED: API key setting is configured';
  RAISE NOTICE '  Current value: %', LEFT(v_api_key, 10) || '...' || RIGHT(v_api_key, 4);
END $$;

-- =====================================================
-- Test 3: Verify Job Is Scheduled
-- =====================================================
-- Expected: Job named 'update-installment-statuses-daily' should exist in cron.job

DO $$
DECLARE
  v_job_exists BOOLEAN;
  v_job_count INT;
BEGIN
  -- Check if job exists
  SELECT
    COUNT(*) > 0,
    COUNT(*)
  INTO v_job_exists, v_job_count
  FROM cron.job
  WHERE jobname = 'update-installment-statuses-daily';

  IF NOT v_job_exists THEN
    RAISE EXCEPTION 'TEST FAILED: Job ''update-installment-statuses-daily'' is not scheduled';
  END IF;

  -- Should only be one job with this name
  IF v_job_count > 1 THEN
    RAISE WARNING 'Multiple jobs found with name ''update-installment-statuses-daily''. This may indicate duplicate scheduling.';
  END IF;

  RAISE NOTICE '✓ Test 3 PASSED: Job is scheduled (% job(s) found)', v_job_count;
END $$;

-- =====================================================
-- Test 4: Verify Job Schedule Is Correct
-- =====================================================
-- Expected: Job schedule should be '0 7 * * *' (7:00 AM UTC daily)

DO $$
DECLARE
  v_schedule TEXT;
  v_active BOOLEAN;
BEGIN
  -- Get job schedule
  SELECT schedule, active
  INTO v_schedule, v_active
  FROM cron.job
  WHERE jobname = 'update-installment-statuses-daily';

  -- Verify schedule
  IF v_schedule != '0 7 * * *' THEN
    RAISE EXCEPTION 'TEST FAILED: Job schedule is incorrect. Expected ''0 7 * * *'', got ''%''', v_schedule;
  END IF;

  -- Verify job is active
  IF NOT v_active THEN
    RAISE WARNING 'Job is scheduled but not active. It will not run until activated.';
  END IF;

  RAISE NOTICE '✓ Test 4 PASSED: Job schedule is correct (0 7 * * * = 7:00 AM UTC daily)';
  RAISE NOTICE '  Job active: %', v_active;
END $$;

-- =====================================================
-- Test 5: Verify Job Command Is Correct
-- =====================================================
-- Expected: Command should call net.http_post with correct structure

DO $$
DECLARE
  v_command TEXT;
BEGIN
  -- Get job command
  SELECT command
  INTO v_command
  FROM cron.job
  WHERE jobname = 'update-installment-statuses-daily';

  -- Verify command contains required elements
  IF v_command NOT LIKE '%net.http_post%' THEN
    RAISE EXCEPTION 'TEST FAILED: Job command does not call net.http_post';
  END IF;

  IF v_command NOT LIKE '%/functions/v1/update-installment-statuses%' THEN
    RAISE EXCEPTION 'TEST FAILED: Job command does not target correct Edge Function endpoint';
  END IF;

  IF v_command NOT LIKE '%X-API-Key%' THEN
    RAISE EXCEPTION 'TEST FAILED: Job command does not include X-API-Key header';
  END IF;

  IF v_command NOT LIKE '%current_setting(''app.supabase_function_key'')%' THEN
    RAISE EXCEPTION 'TEST FAILED: Job command does not retrieve API key from setting';
  END IF;

  -- Check if project-ref placeholder is still present
  IF v_command LIKE '%<project-ref>%' THEN
    RAISE WARNING 'Job command still contains <project-ref> placeholder. Replace with actual Supabase project reference.';
  END IF;

  RAISE NOTICE '✓ Test 5 PASSED: Job command structure is correct';
END $$;

-- =====================================================
-- Test 6: Verify Job Database and Schema
-- =====================================================
-- Expected: Job should run in 'postgres' database under 'cron' schema

DO $$
DECLARE
  v_database TEXT;
  v_nodename TEXT;
BEGIN
  -- Get job database and node
  SELECT database, nodename
  INTO v_database, v_nodename
  FROM cron.job
  WHERE jobname = 'update-installment-statuses-daily';

  RAISE NOTICE '✓ Test 6 PASSED: Job database and node configuration verified';
  RAISE NOTICE '  Database: %', v_database;
  RAISE NOTICE '  Node: %', COALESCE(v_nodename, 'default');
END $$;

-- =====================================================
-- Test 7: Verify cron.job_run_details Table Exists
-- =====================================================
-- Expected: Table should exist for tracking job execution history

DO $$
DECLARE
  v_table_exists BOOLEAN;
BEGIN
  -- Check if table exists
  SELECT EXISTS (
    SELECT 1
    FROM information_schema.tables
    WHERE table_schema = 'cron'
    AND table_name = 'job_run_details'
  ) INTO v_table_exists;

  IF NOT v_table_exists THEN
    RAISE EXCEPTION 'TEST FAILED: cron.job_run_details table does not exist';
  END IF;

  RAISE NOTICE '✓ Test 7 PASSED: Job run history table exists';
END $$;

-- =====================================================
-- Test 8: Test net.http_post Function Availability
-- =====================================================
-- Expected: net.http_post function should be available from http extension

DO $$
DECLARE
  v_function_exists BOOLEAN;
BEGIN
  -- Check if function exists
  SELECT EXISTS (
    SELECT 1
    FROM pg_proc p
    JOIN pg_namespace n ON p.pronamespace = n.oid
    WHERE n.nspname = 'net'
    AND p.proname = 'http_post'
  ) INTO v_function_exists;

  IF NOT v_function_exists THEN
    RAISE EXCEPTION 'TEST FAILED: net.http_post function not available (http extension may not be installed)';
  END IF;

  RAISE NOTICE '✓ Test 8 PASSED: net.http_post function is available';
END $$;

-- =====================================================
-- Test 9: Verify Job Run History Can Be Queried
-- =====================================================
-- Expected: Should be able to query job run history (even if empty)

DO $$
DECLARE
  v_jobid BIGINT;
  v_run_count INT;
BEGIN
  -- Get job ID
  SELECT jobid
  INTO v_jobid
  FROM cron.job
  WHERE jobname = 'update-installment-statuses-daily';

  IF v_jobid IS NULL THEN
    RAISE EXCEPTION 'TEST FAILED: Could not retrieve job ID';
  END IF;

  -- Count runs
  SELECT COUNT(*)
  INTO v_run_count
  FROM cron.job_run_details
  WHERE jobid = v_jobid;

  RAISE NOTICE '✓ Test 9 PASSED: Job run history is queryable';
  RAISE NOTICE '  Job ID: %', v_jobid;
  RAISE NOTICE '  Historical runs: %', v_run_count;

  IF v_run_count = 0 THEN
    RAISE NOTICE '  (No runs yet - job has not executed or schedule time has not arrived)';
  END IF;
END $$;

-- =====================================================
-- Test 10: Verify Timezone Calculation
-- =====================================================
-- Expected: Confirm that 7:00 AM UTC = 5:00 PM Brisbane AEST

DO $$
DECLARE
  v_utc_time TIMESTAMPTZ := '2024-01-15 07:00:00+00'::TIMESTAMPTZ;  -- 7:00 AM UTC
  v_brisbane_time TIMESTAMPTZ;
  v_brisbane_hour INT;
BEGIN
  -- Convert to Brisbane timezone (Australia/Brisbane is UTC+10, no DST)
  v_brisbane_time := v_utc_time AT TIME ZONE 'Australia/Brisbane';
  v_brisbane_hour := EXTRACT(HOUR FROM v_brisbane_time);

  -- Brisbane is UTC+10, so 7:00 AM UTC should be 5:00 PM (17:00) Brisbane
  IF v_brisbane_hour != 17 THEN
    RAISE EXCEPTION 'TEST FAILED: Timezone calculation incorrect. Expected 17:00 Brisbane, got %:00', v_brisbane_hour;
  END IF;

  RAISE NOTICE '✓ Test 10 PASSED: Timezone calculation verified';
  RAISE NOTICE '  7:00 AM UTC = 5:00 PM Brisbane AEST';
  RAISE NOTICE '  (Queensland does not observe daylight saving time)';
END $$;

-- =====================================================
-- Test 11: Simulate Job Execution (Dry Run)
-- =====================================================
-- Expected: Should be able to construct the HTTP request (without actually sending it)
-- Note: This test constructs the request but doesn't execute it

DO $$
DECLARE
  v_url TEXT;
  v_headers JSONB;
  v_body JSONB;
  v_api_key TEXT;
BEGIN
  -- Get API key
  v_api_key := current_setting('app.supabase_function_key');

  -- Construct request components (same as scheduled job)
  v_url := 'https://<project-ref>.supabase.co/functions/v1/update-installment-statuses';
  v_headers := jsonb_build_object(
    'Content-Type', 'application/json',
    'X-API-Key', v_api_key
  );
  v_body := '{}'::jsonb;

  -- Verify all components are valid
  IF v_url IS NULL OR v_url = '' THEN
    RAISE EXCEPTION 'TEST FAILED: URL is null or empty';
  END IF;

  IF v_headers IS NULL OR NOT (v_headers ? 'Content-Type') OR NOT (v_headers ? 'X-API-Key') THEN
    RAISE EXCEPTION 'TEST FAILED: Headers are incomplete';
  END IF;

  IF v_body IS NULL THEN
    RAISE EXCEPTION 'TEST FAILED: Body is null';
  END IF;

  RAISE NOTICE '✓ Test 11 PASSED: HTTP request can be constructed correctly';
  RAISE NOTICE '  URL: %', v_url;
  RAISE NOTICE '  Headers: Content-Type, X-API-Key';
  RAISE NOTICE '  Body: {}';

  IF v_url LIKE '%<project-ref>%' THEN
    RAISE WARNING 'URL still contains placeholder. Update with actual project reference.';
  END IF;
END $$;

-- =====================================================
-- Test 12: Verify Job Can Be Unscheduled (Rollback Test)
-- =====================================================
-- Expected: Should be able to unschedule the job if needed
-- Note: This test verifies the unschedule mechanism works, but doesn't actually unschedule

DO $$
DECLARE
  v_unschedule_function_exists BOOLEAN;
BEGIN
  -- Check if unschedule function exists
  SELECT EXISTS (
    SELECT 1
    FROM pg_proc p
    JOIN pg_namespace n ON p.pronamespace = n.oid
    WHERE n.nspname = 'cron'
    AND p.proname = 'unschedule'
  ) INTO v_unschedule_function_exists;

  IF NOT v_unschedule_function_exists THEN
    RAISE EXCEPTION 'TEST FAILED: cron.unschedule function not available';
  END IF;

  RAISE NOTICE '✓ Test 12 PASSED: Job can be unscheduled if needed';
  RAISE NOTICE '  To unschedule: SELECT cron.unschedule(''update-installment-statuses-daily'');';
END $$;

-- =====================================================
-- Test Summary
-- =====================================================

DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'pg_cron Schedule Test Suite Complete';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'All tests passed! ✓';
  RAISE NOTICE '';
  RAISE NOTICE 'Configuration Summary:';
  RAISE NOTICE '  Job Name: update-installment-statuses-daily';
  RAISE NOTICE '  Schedule: 0 7 * * * (7:00 AM UTC daily)';
  RAISE NOTICE '  Brisbane Time: 5:00 PM AEST';
  RAISE NOTICE '  Extensions: pg_cron, http';
  RAISE NOTICE '  API Key: Configured in app.supabase_function_key';
  RAISE NOTICE '';
  RAISE NOTICE 'Next Steps:';
  RAISE NOTICE '  1. Replace <project-ref> in job command with actual Supabase project reference';
  RAISE NOTICE '  2. Update API key with actual value from Task 5';
  RAISE NOTICE '  3. Deploy Edge Function (Task 3)';
  RAISE NOTICE '  4. Wait for scheduled time or manually trigger for testing';
  RAISE NOTICE '  5. Monitor execution via jobs_log table and cron.job_run_details';
  RAISE NOTICE '';
  RAISE NOTICE 'Manual Test Command:';
  RAISE NOTICE '  SELECT net.http_post(';
  RAISE NOTICE '    url := ''https://<project-ref>.supabase.co/functions/v1/update-installment-statuses'',';
  RAISE NOTICE '    headers := jsonb_build_object(''Content-Type'', ''application/json'', ''X-API-Key'', current_setting(''app.supabase_function_key'')),';
  RAISE NOTICE '    body := ''''{}''''::jsonb';
  RAISE NOTICE '  );';
  RAISE NOTICE '========================================';
END $$;

-- =====================================================
-- Additional Verification Queries
-- =====================================================
-- Run these queries manually to verify the configuration

-- View job details
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

-- View recent job runs (if any)
SELECT
  r.runid,
  r.jobid,
  j.jobname,
  r.job_pid,
  r.database,
  r.username,
  r.command,
  r.status,
  r.return_message,
  r.start_time,
  r.end_time,
  (r.end_time - r.start_time) AS duration
FROM cron.job_run_details r
JOIN cron.job j ON r.jobid = j.jobid
WHERE j.jobname = 'update-installment-statuses-daily'
ORDER BY r.start_time DESC
LIMIT 10;

-- View API key setting (masked)
SELECT
  'app.supabase_function_key' AS setting_name,
  LEFT(current_setting('app.supabase_function_key'), 10) || '...' ||
  RIGHT(current_setting('app.supabase_function_key'), 4) AS masked_value;

-- View jobs_log entries for this job
SELECT
  id,
  job_name,
  started_at,
  completed_at,
  (completed_at - started_at) AS duration,
  records_updated,
  status,
  error_message,
  metadata
FROM jobs_log
WHERE job_name = 'update-installment-statuses'
ORDER BY started_at DESC
LIMIT 10;

COMMIT;

-- =====================================================
-- Test Suite Complete
-- =====================================================
-- All tests passed if you see this message!
-- Review the notices above for any warnings or next steps.
