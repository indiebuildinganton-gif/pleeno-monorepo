-- =====================================================
-- Task 4: Configure pg_cron Schedule
-- Story 5-1: Automated Status Detection Job
-- =====================================================
-- Purpose: Set up pg_cron extension to automatically invoke the
--          update-installment-statuses Edge Function daily at 7:00 AM UTC
-- Author: System
-- Date: 2025-11-13
-- =====================================================

-- =====================================================
-- SECTION 1: Enable Required Extensions
-- =====================================================

-- Enable pg_cron extension for job scheduling
-- Note: In Supabase, pg_cron is pre-installed but may need to be enabled
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Enable http extension for making HTTP requests from PostgreSQL
-- This provides the net.http_post() function used to call Edge Functions
CREATE EXTENSION IF NOT EXISTS http;

-- =====================================================
-- SECTION 2: Configure API Key Storage
-- =====================================================

-- Store the Supabase Function API key as a custom PostgreSQL setting
-- This allows secure storage and retrieval of the API key
-- IMPORTANT: Replace 'your-api-key-here' with actual key value in production
-- The actual key will be set in Task 5 (Implement API Key Authentication)

-- Note: This uses ALTER DATABASE which sets a default for all sessions
-- In production, you would run:
-- ALTER DATABASE postgres SET app.supabase_function_key = '<actual-key>';

-- For local development/testing, we set a placeholder:
ALTER DATABASE postgres SET app.supabase_function_key = 'placeholder-api-key-to-be-configured-in-task-5';

-- To reload the configuration without restarting:
-- SELECT pg_reload_conf();

-- =====================================================
-- SECTION 3: Schedule the Cron Job
-- =====================================================

-- Schedule daily job at 7:00 AM UTC (5:00 PM Brisbane AEST / 6:00 PM AEDT)
-- Cron Expression: '0 7 * * *'
--   - Minute: 0 (at the start of the hour)
--   - Hour: 7 (7:00 AM UTC)
--   - Day of Month: * (every day)
--   - Month: * (every month)
--   - Day of Week: * (every day of week)

-- IMPORTANT: Replace <project-ref> with your actual Supabase project reference
-- Format: https://<project-ref>.supabase.co/functions/v1/update-installment-statuses
-- Find your project reference in: Supabase Dashboard > Settings > API

-- For production deployment, update the URL below:
-- Example: https://abcdefghijklmnop.supabase.co/functions/v1/update-installment-statuses

DO $$
DECLARE
  v_job_id bigint;
  v_project_url text;
BEGIN
  -- Set the Edge Function URL
  -- In production, this should be the actual Supabase project URL
  -- For local development, this is a placeholder
  v_project_url := 'https://your-project-ref.supabase.co/functions/v1/update-installment-statuses';

  -- Check if job already exists
  SELECT jobid INTO v_job_id
  FROM cron.job
  WHERE jobname = 'update-installment-statuses-daily';

  -- If job exists, unschedule it first to avoid duplicates
  IF v_job_id IS NOT NULL THEN
    PERFORM cron.unschedule('update-installment-statuses-daily');
    RAISE NOTICE 'Unscheduled existing job with ID: %', v_job_id;
  END IF;

  -- Schedule the new job
  SELECT cron.schedule(
    'update-installment-statuses-daily',  -- Job name
    '0 7 * * *',                          -- Cron expression: 7:00 AM UTC daily
    $$
    SELECT net.http_post(
      url := 'https://your-project-ref.supabase.co/functions/v1/update-installment-statuses',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'X-API-Key', current_setting('app.supabase_function_key')
      ),
      body := '{}'::jsonb
    ) AS request_id;
    $$
  ) INTO v_job_id;

  RAISE NOTICE 'Scheduled new job with ID: %', v_job_id;
END $$;

-- =====================================================
-- SECTION 4: Verify Installation
-- =====================================================

-- Query to verify the job was scheduled correctly
SELECT
  jobid,
  jobname,
  schedule,
  active,
  command
FROM cron.job
WHERE jobname = 'update-installment-statuses-daily';

-- Expected output:
-- jobid | jobname                            | schedule   | active | command
-- ------|------------------------------------|------------|--------|------------------
-- <id>  | update-installment-statuses-daily  | 0 7 * * *  | t      | SELECT net.http_post(...)

-- =====================================================
-- SECTION 5: Usage Documentation
-- =====================================================

-- View all scheduled jobs:
-- SELECT * FROM cron.job;

-- View job run history (last 10 runs):
-- SELECT * FROM cron.job_run_details
-- WHERE jobid = (SELECT jobid FROM cron.job WHERE jobname = 'update-installment-statuses-daily')
-- ORDER BY start_time DESC
-- LIMIT 10;

-- Manually trigger the job for testing (without waiting for schedule):
-- SELECT net.http_post(
--   url := 'https://your-project-ref.supabase.co/functions/v1/update-installment-statuses',
--   headers := jsonb_build_object(
--     'Content-Type', 'application/json',
--     'X-API-Key', current_setting('app.supabase_function_key')
--   ),
--   body := '{}'::jsonb
-- );

-- Unschedule the job (if needed):
-- SELECT cron.unschedule('update-installment-statuses-daily');

-- Update the API key (after Task 5):
-- ALTER DATABASE postgres SET app.supabase_function_key = '<new-api-key>';
-- SELECT pg_reload_conf();

-- Check current API key setting (without revealing the value):
-- SELECT current_setting('app.supabase_function_key', true) IS NOT NULL as key_configured;

-- =====================================================
-- SECTION 6: Troubleshooting
-- =====================================================

-- If the job doesn't run:
-- 1. Check if the job is active:
--    SELECT jobid, jobname, active FROM cron.job WHERE jobname = 'update-installment-statuses-daily';
--
-- 2. Check recent run history for errors:
--    SELECT start_time, end_time, status, return_message
--    FROM cron.job_run_details
--    WHERE jobid = (SELECT jobid FROM cron.job WHERE jobname = 'update-installment-statuses-daily')
--    ORDER BY start_time DESC LIMIT 5;
--
-- 3. Verify the Edge Function is deployed:
--    Use: supabase functions list
--
-- 4. Test the Edge Function manually:
--    Use curl or the manual trigger SQL above
--
-- 5. Verify API key is configured:
--    SELECT current_setting('app.supabase_function_key', true) IS NOT NULL;

-- =====================================================
-- NOTES FOR PRODUCTION DEPLOYMENT
-- =====================================================

-- Before deploying to production:
-- 1. Replace 'your-project-ref' with actual Supabase project reference in TWO places:
--    - In the DO block (v_project_url variable)
--    - In the cron.schedule command
--
-- 2. Update the API key placeholder after Task 5 is complete:
--    ALTER DATABASE postgres SET app.supabase_function_key = '<actual-key>';
--
-- 3. Verify the timezone:
--    - 7:00 AM UTC = 5:00 PM Brisbane (AEST, UTC+10)
--    - 7:00 AM UTC = 6:00 PM Brisbane (AEDT, UTC+11, during daylight saving)
--
-- 4. Consider alternative scheduling times if needed:
--    - For 8:00 AM Brisbane (next day): '0 22 * * *' (10:00 PM UTC)
--    - For midnight UTC: '0 0 * * *'
--
-- 5. Monitor the jobs_log table for execution results:
--    SELECT * FROM jobs_log WHERE job_name = 'update-installment-statuses' ORDER BY started_at DESC;

-- =====================================================
-- SECURITY CONSIDERATIONS
-- =====================================================

-- 1. API Key Storage:
--    - Stored as PostgreSQL custom setting
--    - Only accessible to database owner/superuser
--    - Not exposed in pg_cron job listings
--    - Retrieved dynamically via current_setting()
--
-- 2. Network Access:
--    - pg_cron runs inside the database
--    - Requires network access to Edge Function endpoint
--    - Supabase allows internal communication by default
--
-- 3. Execution Context:
--    - pg_cron jobs run as the postgres superuser
--    - Use SECURITY DEFINER functions with caution
--    - Edge Function authenticates via API key

-- =====================================================
-- END OF MIGRATION
-- =====================================================
