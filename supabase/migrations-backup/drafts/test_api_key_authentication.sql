-- =====================================================
-- API Key Authentication Test Suite
-- Story 5-1, Task 5: Implement API Key Authentication
-- =====================================================
-- Purpose: Validate API key authentication configuration and functionality
--          for the update-installment-statuses Edge Function
-- Author: System
-- Date: 2025-11-13
-- =====================================================

-- =====================================================
-- TEST SETUP
-- =====================================================

DO $$
BEGIN
  RAISE NOTICE '========================================';
  RAISE NOTICE 'API Key Authentication Test Suite';
  RAISE NOTICE 'Story 5-1, Task 5';
  RAISE NOTICE 'Started: %', NOW();
  RAISE NOTICE '========================================';
END $$;

-- =====================================================
-- TEST 1: Verify Database Setting Exists
-- =====================================================

DO $$
DECLARE
  v_api_key TEXT;
  v_test_result TEXT;
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE 'TEST 1: Verify Database Setting Exists';
  RAISE NOTICE '----------------------------------------';

  BEGIN
    -- Attempt to retrieve the API key setting
    v_api_key := current_setting('app.supabase_function_key', true);

    IF v_api_key IS NULL THEN
      v_test_result := '❌ FAILED - Database setting not configured';
      RAISE NOTICE '%', v_test_result;
      RAISE NOTICE 'Run: ALTER DATABASE postgres SET app.supabase_function_key = ''<your-api-key>'';';
    ELSIF LENGTH(v_api_key) < 32 THEN
      v_test_result := '⚠️  WARNING - API key is too short (< 32 characters)';
      RAISE NOTICE '%', v_test_result;
      RAISE NOTICE 'Current length: % characters', LENGTH(v_api_key);
      RAISE NOTICE 'Recommended: 64 characters (256 bits entropy)';
    ELSE
      v_test_result := '✅ PASSED - Database setting configured';
      RAISE NOTICE '%', v_test_result;
      RAISE NOTICE 'API key length: % characters', LENGTH(v_api_key);
      RAISE NOTICE 'API key preview: %...%', LEFT(v_api_key, 8), RIGHT(v_api_key, 8);
    END IF;

  EXCEPTION
    WHEN OTHERS THEN
      v_test_result := '❌ FAILED - Error retrieving database setting';
      RAISE NOTICE '%', v_test_result;
      RAISE NOTICE 'Error: %', SQLERRM;
  END;
END $$;

-- =====================================================
-- TEST 2: Verify API Key Format and Strength
-- =====================================================

DO $$
DECLARE
  v_api_key TEXT;
  v_is_uuid BOOLEAN;
  v_is_hex BOOLEAN;
  v_entropy_bits INTEGER;
  v_test_result TEXT;
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE 'TEST 2: Verify API Key Format and Strength';
  RAISE NOTICE '----------------------------------------';

  v_api_key := current_setting('app.supabase_function_key', true);

  IF v_api_key IS NULL THEN
    RAISE NOTICE '⏭️  SKIPPED - No API key configured';
    RETURN;
  END IF;

  -- Check if it's a valid UUID format
  v_is_uuid := v_api_key ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$';

  -- Check if it's a valid hexadecimal string (no dashes)
  v_is_hex := v_api_key ~ '^[0-9a-f]+$';

  -- Calculate entropy in bits (each hex character = 4 bits)
  IF v_is_hex THEN
    v_entropy_bits := LENGTH(v_api_key) * 4;
  ELSIF v_is_uuid THEN
    v_entropy_bits := 128;  -- UUID provides 128 bits
  ELSE
    v_entropy_bits := 0;
  END IF;

  IF v_is_uuid THEN
    RAISE NOTICE '✅ PASSED - API key is valid UUID format';
    RAISE NOTICE 'Format: UUID v4';
    RAISE NOTICE 'Entropy: % bits', v_entropy_bits;
  ELSIF v_is_hex THEN
    RAISE NOTICE '✅ PASSED - API key is valid hexadecimal format';
    RAISE NOTICE 'Format: Hexadecimal string';
    RAISE NOTICE 'Length: % characters', LENGTH(v_api_key);
    RAISE NOTICE 'Entropy: % bits', v_entropy_bits;

    IF v_entropy_bits < 128 THEN
      RAISE NOTICE '⚠️  WARNING - Entropy below recommended minimum (128 bits)';
      RAISE NOTICE 'Recommended: At least 32 hex characters (128 bits)';
    END IF;
  ELSE
    RAISE NOTICE '❌ FAILED - API key format not recognized';
    RAISE NOTICE 'Expected: UUID v4 or hexadecimal string';
    RAISE NOTICE 'Actual format: Unknown/invalid';
  END IF;

  -- Check for common weak patterns
  IF v_api_key LIKE '%placeholder%' OR
     v_api_key LIKE '%your-api-key%' OR
     v_api_key LIKE '%test%' OR
     v_api_key = 'your-api-key-here' THEN
    RAISE NOTICE '❌ CRITICAL - Placeholder or weak API key detected!';
    RAISE NOTICE 'Action required: Generate and configure a secure API key';
  END IF;
END $$;

-- =====================================================
-- TEST 3: Verify pg_cron Extension is Enabled
-- =====================================================

DO $$
DECLARE
  v_extension_exists BOOLEAN;
  v_test_result TEXT;
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE 'TEST 3: Verify pg_cron Extension is Enabled';
  RAISE NOTICE '----------------------------------------';

  SELECT EXISTS (
    SELECT 1 FROM pg_extension WHERE extname = 'pg_cron'
  ) INTO v_extension_exists;

  IF v_extension_exists THEN
    v_test_result := '✅ PASSED - pg_cron extension enabled';
    RAISE NOTICE '%', v_test_result;
  ELSE
    v_test_result := '❌ FAILED - pg_cron extension not enabled';
    RAISE NOTICE '%', v_test_result;
    RAISE NOTICE 'Run: CREATE EXTENSION IF NOT EXISTS pg_cron;';
  END IF;
END $$;

-- =====================================================
-- TEST 4: Verify HTTP Extension is Enabled
-- =====================================================

DO $$
DECLARE
  v_extension_exists BOOLEAN;
  v_test_result TEXT;
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE 'TEST 4: Verify HTTP Extension is Enabled';
  RAISE NOTICE '----------------------------------------';

  SELECT EXISTS (
    SELECT 1 FROM pg_extension WHERE extname = 'http'
  ) INTO v_extension_exists;

  IF v_extension_exists THEN
    v_test_result := '✅ PASSED - http extension enabled';
    RAISE NOTICE '%', v_test_result;
    RAISE NOTICE 'net.http_post() function available for pg_cron';
  ELSE
    v_test_result := '❌ FAILED - http extension not enabled';
    RAISE NOTICE '%', v_test_result;
    RAISE NOTICE 'Run: CREATE EXTENSION IF NOT EXISTS http;';
  END IF;
END $$;

-- =====================================================
-- TEST 5: Verify Scheduled Job Exists
-- =====================================================

DO $$
DECLARE
  v_job_exists BOOLEAN;
  v_job_active BOOLEAN;
  v_job_schedule TEXT;
  v_test_result TEXT;
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE 'TEST 5: Verify Scheduled Job Exists';
  RAISE NOTICE '----------------------------------------';

  SELECT
    COUNT(*) > 0,
    BOOL_OR(active),
    MAX(schedule)
  INTO v_job_exists, v_job_active, v_job_schedule
  FROM cron.job
  WHERE jobname = 'update-installment-statuses-daily';

  IF v_job_exists THEN
    v_test_result := '✅ PASSED - Scheduled job exists';
    RAISE NOTICE '%', v_test_result;
    RAISE NOTICE 'Job name: update-installment-statuses-daily';
    RAISE NOTICE 'Schedule: %', v_job_schedule;
    RAISE NOTICE 'Active: %', v_job_active;

    IF NOT v_job_active THEN
      RAISE NOTICE '⚠️  WARNING - Job is not active';
    END IF;
  ELSE
    v_test_result := '❌ FAILED - Scheduled job not found';
    RAISE NOTICE '%', v_test_result;
    RAISE NOTICE 'Expected job name: update-installment-statuses-daily';
    RAISE NOTICE 'Run the pg_cron configuration script to create the job';
  END IF;
END $$;

-- =====================================================
-- TEST 6: Verify Job Uses API Key
-- =====================================================

DO $$
DECLARE
  v_job_command TEXT;
  v_uses_api_key BOOLEAN;
  v_test_result TEXT;
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE 'TEST 6: Verify Job Uses API Key';
  RAISE NOTICE '----------------------------------------';

  SELECT command INTO v_job_command
  FROM cron.job
  WHERE jobname = 'update-installment-statuses-daily';

  IF v_job_command IS NULL THEN
    RAISE NOTICE '⏭️  SKIPPED - Job not found';
    RETURN;
  END IF;

  -- Check if job command includes API key retrieval
  v_uses_api_key := v_job_command LIKE '%current_setting%app.supabase_function_key%';

  IF v_uses_api_key THEN
    v_test_result := '✅ PASSED - Job uses API key authentication';
    RAISE NOTICE '%', v_test_result;
    RAISE NOTICE 'Job retrieves API key via: current_setting(''app.supabase_function_key'')';
  ELSE
    v_test_result := '❌ FAILED - Job does not use API key authentication';
    RAISE NOTICE '%', v_test_result;
    RAISE NOTICE 'Job command should include: current_setting(''app.supabase_function_key'')';
  END IF;
END $$;

-- =====================================================
-- TEST 7: Verify Jobs Log Table Exists
-- =====================================================

DO $$
DECLARE
  v_table_exists BOOLEAN;
  v_test_result TEXT;
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE 'TEST 7: Verify Jobs Log Table Exists';
  RAISE NOTICE '----------------------------------------';

  SELECT EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public'
      AND table_name = 'jobs_log'
  ) INTO v_table_exists;

  IF v_table_exists THEN
    v_test_result := '✅ PASSED - jobs_log table exists';
    RAISE NOTICE '%', v_test_result;
  ELSE
    v_test_result := '❌ FAILED - jobs_log table not found';
    RAISE NOTICE '%', v_test_result;
    RAISE NOTICE 'Run Task 2 migration to create the table';
  END IF;
END $$;

-- =====================================================
-- TEST 8: Verify Edge Function Endpoint Configuration
-- =====================================================

DO $$
DECLARE
  v_job_command TEXT;
  v_has_endpoint BOOLEAN;
  v_has_placeholder BOOLEAN;
  v_test_result TEXT;
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE 'TEST 8: Verify Edge Function Endpoint Configuration';
  RAISE NOTICE '----------------------------------------';

  SELECT command INTO v_job_command
  FROM cron.job
  WHERE jobname = 'update-installment-statuses-daily';

  IF v_job_command IS NULL THEN
    RAISE NOTICE '⏭️  SKIPPED - Job not found';
    RETURN;
  END IF;

  -- Check if job has Edge Function endpoint
  v_has_endpoint := v_job_command LIKE '%/functions/v1/update-installment-statuses%';

  -- Check if endpoint still has placeholder
  v_has_placeholder := v_job_command LIKE '%<project-ref>%' OR
                       v_job_command LIKE '%your-project-ref%';

  IF v_has_endpoint AND NOT v_has_placeholder THEN
    v_test_result := '✅ PASSED - Edge Function endpoint configured';
    RAISE NOTICE '%', v_test_result;
  ELSIF v_has_endpoint AND v_has_placeholder THEN
    v_test_result := '⚠️  WARNING - Edge Function endpoint has placeholder';
    RAISE NOTICE '%', v_test_result;
    RAISE NOTICE 'Action required: Replace <project-ref> with actual Supabase project reference';
  ELSE
    v_test_result := '❌ FAILED - Edge Function endpoint not found in job command';
    RAISE NOTICE '%', v_test_result;
  END IF;
END $$;

-- =====================================================
-- TEST 9: Test API Key Retrieval in SQL Context
-- =====================================================

DO $$
DECLARE
  v_api_key TEXT;
  v_headers JSONB;
  v_test_result TEXT;
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE 'TEST 9: Test API Key Retrieval in SQL Context';
  RAISE NOTICE '----------------------------------------';

  BEGIN
    -- Simulate how pg_cron retrieves the API key
    v_api_key := current_setting('app.supabase_function_key');

    -- Build headers object (like pg_cron does)
    v_headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'X-API-Key', v_api_key
    );

    v_test_result := '✅ PASSED - API key retrieval works in SQL context';
    RAISE NOTICE '%', v_test_result;
    RAISE NOTICE 'Headers object: %', v_headers;
    RAISE NOTICE 'X-API-Key header length: % characters', LENGTH(v_api_key);

  EXCEPTION
    WHEN OTHERS THEN
      v_test_result := '❌ FAILED - API key retrieval error';
      RAISE NOTICE '%', v_test_result;
      RAISE NOTICE 'Error: %', SQLERRM;
  END;
END $$;

-- =====================================================
-- TEST 10: Verify update_installment_statuses Function Exists
-- =====================================================

DO $$
DECLARE
  v_function_exists BOOLEAN;
  v_test_result TEXT;
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE 'TEST 10: Verify update_installment_statuses Function Exists';
  RAISE NOTICE '----------------------------------------';

  SELECT EXISTS (
    SELECT 1 FROM pg_proc p
    JOIN pg_namespace n ON p.pronamespace = n.oid
    WHERE n.nspname = 'public'
      AND p.proname = 'update_installment_statuses'
  ) INTO v_function_exists;

  IF v_function_exists THEN
    v_test_result := '✅ PASSED - update_installment_statuses() function exists';
    RAISE NOTICE '%', v_test_result;
  ELSE
    v_test_result := '❌ FAILED - update_installment_statuses() function not found';
    RAISE NOTICE '%', v_test_result;
    RAISE NOTICE 'Run Task 1 migration to create the function';
  END IF;
END $$;

-- =====================================================
-- TEST 11: Security - Verify Non-Superuser Cannot Read API Key
-- =====================================================

DO $$
DECLARE
  v_is_superuser BOOLEAN;
  v_can_read_key BOOLEAN;
  v_test_result TEXT;
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE 'TEST 11: Security - API Key Access Control';
  RAISE NOTICE '----------------------------------------';

  -- Check if current user is superuser
  SELECT usesuper INTO v_is_superuser
  FROM pg_user
  WHERE usename = current_user;

  IF v_is_superuser THEN
    v_test_result := 'ℹ️  INFO - Running as superuser';
    RAISE NOTICE '%', v_test_result;
    RAISE NOTICE 'Superusers can read database settings (expected behavior)';
    RAISE NOTICE 'Non-superuser access control cannot be tested in this session';
  ELSE
    -- Non-superuser: attempt to read the key
    BEGIN
      PERFORM current_setting('app.supabase_function_key');
      v_can_read_key := TRUE;
    EXCEPTION
      WHEN OTHERS THEN
        v_can_read_key := FALSE;
    END;

    IF v_can_read_key THEN
      v_test_result := '⚠️  WARNING - Non-superuser can read API key';
      RAISE NOTICE '%', v_test_result;
      RAISE NOTICE 'This may be expected if user has been granted specific privileges';
    ELSE
      v_test_result := '✅ PASSED - Non-superuser cannot read API key';
      RAISE NOTICE '%', v_test_result;
      RAISE NOTICE 'API key is protected from unauthorized access';
    END IF;
  END IF;
END $$;

-- =====================================================
-- TEST 12: Integration - Check Recent Job Executions
-- =====================================================

DO $$
DECLARE
  v_recent_executions INTEGER;
  v_recent_successes INTEGER;
  v_recent_failures INTEGER;
  v_last_execution TIMESTAMPTZ;
  v_test_result TEXT;
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE 'TEST 12: Integration - Check Recent Job Executions';
  RAISE NOTICE '----------------------------------------';

  SELECT
    COUNT(*),
    SUM(CASE WHEN status = 'success' THEN 1 ELSE 0 END),
    SUM(CASE WHEN status = 'failed' THEN 1 ELSE 0 END),
    MAX(started_at)
  INTO v_recent_executions, v_recent_successes, v_recent_failures, v_last_execution
  FROM jobs_log
  WHERE job_name = 'update-installment-statuses'
    AND started_at > NOW() - INTERVAL '7 days';

  IF v_recent_executions > 0 THEN
    v_test_result := 'ℹ️  INFO - Job execution history found';
    RAISE NOTICE '%', v_test_result;
    RAISE NOTICE 'Executions (last 7 days): %', v_recent_executions;
    RAISE NOTICE 'Successful: %', v_recent_successes;
    RAISE NOTICE 'Failed: %', v_recent_failures;
    RAISE NOTICE 'Last execution: %', v_last_execution;

    IF v_recent_failures > 0 THEN
      RAISE NOTICE '⚠️  WARNING - Failed executions detected';
      RAISE NOTICE 'Check error_message column in jobs_log for details';
    END IF;
  ELSE
    v_test_result := 'ℹ️  INFO - No recent job executions';
    RAISE NOTICE '%', v_test_result;
    RAISE NOTICE 'This is normal if the job hasn''t run yet or was just configured';
  END IF;
END $$;

-- =====================================================
-- MANUAL TEST: Test Edge Function Authentication (cURL)
-- =====================================================

DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'MANUAL TESTS REQUIRED';
  RAISE NOTICE '========================================';
  RAISE NOTICE '';
  RAISE NOTICE 'The following tests must be performed manually using cURL:';
  RAISE NOTICE '';
  RAISE NOTICE '1. Test valid API key (should return 200 OK):';
  RAISE NOTICE '   curl -X POST "https://<project-ref>.supabase.co/functions/v1/update-installment-statuses" \';
  RAISE NOTICE '     -H "Content-Type: application/json" \';
  RAISE NOTICE '     -H "X-API-Key: <your-api-key>" \';
  RAISE NOTICE '     -w "\nHTTP Status: %%{http_code}\n"';
  RAISE NOTICE '';
  RAISE NOTICE '2. Test invalid API key (should return 401 Unauthorized):';
  RAISE NOTICE '   curl -X POST "https://<project-ref>.supabase.co/functions/v1/update-installment-statuses" \';
  RAISE NOTICE '     -H "Content-Type: application/json" \';
  RAISE NOTICE '     -H "X-API-Key: wrong-key-12345" \';
  RAISE NOTICE '     -w "\nHTTP Status: %%{http_code}\n"';
  RAISE NOTICE '';
  RAISE NOTICE '3. Test missing API key (should return 401 Unauthorized):';
  RAISE NOTICE '   curl -X POST "https://<project-ref>.supabase.co/functions/v1/update-installment-statuses" \';
  RAISE NOTICE '     -H "Content-Type: application/json" \';
  RAISE NOTICE '     -w "\nHTTP Status: %%{http_code}\n"';
  RAISE NOTICE '';
  RAISE NOTICE '4. Verify Supabase secret is set:';
  RAISE NOTICE '   supabase secrets list';
  RAISE NOTICE '';
  RAISE NOTICE '5. Verify Edge Function is deployed:';
  RAISE NOTICE '   supabase functions list';
  RAISE NOTICE '';
  RAISE NOTICE '========================================';
END $$;

-- =====================================================
-- TEST SUMMARY
-- =====================================================

DO $$
DECLARE
  v_api_key TEXT;
  v_all_tests_passed BOOLEAN := TRUE;
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'TEST SUITE SUMMARY';
  RAISE NOTICE '========================================';

  -- Check critical requirements
  v_api_key := current_setting('app.supabase_function_key', true);

  IF v_api_key IS NULL OR
     v_api_key LIKE '%placeholder%' OR
     v_api_key LIKE '%your-api-key%' THEN
    v_all_tests_passed := FALSE;
    RAISE NOTICE '❌ CRITICAL: API key not properly configured';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'pg_cron') THEN
    v_all_tests_passed := FALSE;
    RAISE NOTICE '❌ CRITICAL: pg_cron extension not enabled';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'update-installment-statuses-daily') THEN
    v_all_tests_passed := FALSE;
    RAISE NOTICE '❌ CRITICAL: Scheduled job not configured';
  END IF;

  RAISE NOTICE '';
  IF v_all_tests_passed THEN
    RAISE NOTICE '✅ All critical tests passed';
    RAISE NOTICE 'API key authentication is properly configured';
    RAISE NOTICE '';
    RAISE NOTICE 'Next steps:';
    RAISE NOTICE '1. Complete manual cURL tests (see above)';
    RAISE NOTICE '2. Verify Edge Function deployment';
    RAISE NOTICE '3. Monitor jobs_log for successful executions';
  ELSE
    RAISE NOTICE '❌ Some critical tests failed';
    RAISE NOTICE 'Review test output above for specific issues';
    RAISE NOTICE 'Refer to api_key_setup_guide.md for configuration steps';
  END IF;

  RAISE NOTICE '';
  RAISE NOTICE 'Completed: %', NOW();
  RAISE NOTICE '========================================';
END $$;

-- =====================================================
-- UTILITY QUERIES FOR TROUBLESHOOTING
-- =====================================================

-- Uncomment these queries to run them individually for troubleshooting:

-- View current API key (be careful - exposes the key!)
-- SELECT current_setting('app.supabase_function_key');

-- View API key length without exposing value
-- SELECT LENGTH(current_setting('app.supabase_function_key', true)) as key_length;

-- View API key preview (first/last 8 chars)
-- SELECT
--   LEFT(current_setting('app.supabase_function_key'), 8) || '...' ||
--   RIGHT(current_setting('app.supabase_function_key'), 8) as key_preview;

-- View scheduled job details
-- SELECT jobid, jobname, schedule, active, command
-- FROM cron.job
-- WHERE jobname = 'update-installment-statuses-daily';

-- View recent job executions
-- SELECT * FROM jobs_log
-- WHERE job_name = 'update-installment-statuses'
-- ORDER BY started_at DESC
-- LIMIT 10;

-- View pg_cron run history
-- SELECT * FROM cron.job_run_details
-- WHERE jobid = (SELECT jobid FROM cron.job WHERE jobname = 'update-installment-statuses-daily')
-- ORDER BY start_time DESC
-- LIMIT 10;

-- =====================================================
-- END OF TEST SUITE
-- =====================================================
