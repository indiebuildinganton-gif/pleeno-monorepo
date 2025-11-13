-- =====================================================
-- Task 4: Configure pg_cron Schedule
-- Story: 5-1 Automated Status Detection Job
-- =====================================================
-- Description:
--   Configures pg_cron to invoke the update-installment-statuses Edge Function
--   daily at 7:00 AM UTC (5:00 PM Brisbane AEST/6:00 PM AEDT)
--
-- Dependencies:
--   - Task 1: update_installment_statuses() function must exist
--   - Task 2: jobs_log table must exist
--   - Task 3: Edge Function must be deployed
--   - Task 5: API key must be configured (can use placeholder for now)
--
-- Usage:
--   1. Replace <project-ref> with your actual Supabase project reference
--      (Found in Supabase Dashboard > Settings > API)
--   2. Replace 'your-api-key-here' with actual API key from Task 5
--   3. Execute this migration via: supabase db push
-- =====================================================

-- Enable required extensions
-- pg_cron: PostgreSQL-native job scheduling
-- http: Make HTTP requests from PostgreSQL
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS http;

-- =====================================================
-- API Key Configuration
-- =====================================================
-- Store API key as custom PostgreSQL setting
-- This allows secure retrieval via current_setting() in SQL
-- The API key will be replaced with actual value in Task 5

-- Note: This requires superuser privileges
-- In Supabase, you can set this via the Dashboard or CLI:
-- ALTER DATABASE postgres SET app.supabase_function_key = 'actual-key-value';

-- ⚠️  IMPORTANT: Before running this migration in production:
--    1. Follow the API Key Setup Guide: supabase/migrations/drafts/api_key_setup_guide.md
--    2. Generate a secure API key using: openssl rand -hex 32
--    3. Store the key in Supabase secrets vault: supabase secrets set SUPABASE_FUNCTION_KEY="<key>"
--    4. Update the ALTER DATABASE command below with your actual API key
--    5. Never commit the actual API key to version control!

-- For now, using a placeholder value
-- WARNING: Replace with actual API key before deploying to production
ALTER DATABASE postgres SET app.supabase_function_key = 'your-api-key-here';

-- For complete setup instructions, see:
-- - API Key Setup Guide: supabase/migrations/drafts/api_key_setup_guide.md
-- - API Key Rotation Guide: supabase/migrations/drafts/api_key_rotation_guide.md
-- - Authentication Tests: supabase/migrations/drafts/test_api_key_authentication.sql

-- Verify the setting is stored
COMMENT ON EXTENSION pg_cron IS 'Job scheduling extension - API key stored in app.supabase_function_key';

-- =====================================================
-- Schedule Daily Job
-- =====================================================
-- Cron expression: 0 7 * * *
--   - Minute: 0 (at the start of the hour)
--   - Hour: 7 (7:00 AM UTC)
--   - Day of month: * (every day)
--   - Month: * (every month)
--   - Day of week: * (every day of week)
--
-- Result: Runs every day at 7:00 AM UTC
--   = 5:00 PM Brisbane AEST (Australian Eastern Standard Time, UTC+10)
--   = 6:00 PM Brisbane AEDT (Australian Eastern Daylight Time, UTC+11)

-- First, unschedule any existing job with the same name (idempotent)
SELECT cron.unschedule('update-installment-statuses-daily')
WHERE EXISTS (
  SELECT 1 FROM cron.job WHERE jobname = 'update-installment-statuses-daily'
);

-- Schedule the job
SELECT cron.schedule(
  'update-installment-statuses-daily',  -- Job name (must be unique)
  '0 7 * * *',                          -- Cron expression: daily at 7:00 AM UTC
  $$
  -- This SQL block will be executed by pg_cron at the scheduled time
  SELECT net.http_post(
    url := 'https://<project-ref>.supabase.co/functions/v1/update-installment-statuses',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'X-API-Key', current_setting('app.supabase_function_key')
    ),
    body := '{}'::jsonb
  ) AS request_id;
  $$
);

-- =====================================================
-- Verification Queries
-- =====================================================
-- These queries help verify the job is properly configured

-- View the scheduled job
-- Expected result: 1 row with jobname, schedule '0 7 * * *', and command
DO $$
BEGIN
  RAISE NOTICE 'Scheduled job details:';
  RAISE NOTICE 'Run this query to verify:';
  RAISE NOTICE 'SELECT jobid, jobname, schedule, active, nodename FROM cron.job WHERE jobname = ''update-installment-statuses-daily'';';
END $$;

-- =====================================================
-- Comments and Documentation
-- =====================================================
COMMENT ON EXTENSION http IS 'HTTP client extension - used by pg_cron to invoke Edge Function';

-- Add comment to the job (note: pg_cron doesn't support direct comments on jobs)
-- Documentation is provided in this migration file and in the story documentation

-- =====================================================
-- Testing and Management Commands
-- =====================================================
-- The following commands are for reference and should be run manually as needed

-- 1. View all scheduled jobs:
--    SELECT * FROM cron.job;

-- 2. View job run history:
--    SELECT * FROM cron.job_run_details
--    WHERE jobid = (SELECT jobid FROM cron.job WHERE jobname = 'update-installment-statuses-daily')
--    ORDER BY start_time DESC
--    LIMIT 10;

-- 3. Manually trigger the job (for testing):
--    SELECT net.http_post(
--      url := 'https://<project-ref>.supabase.co/functions/v1/update-installment-statuses',
--      headers := jsonb_build_object(
--        'Content-Type', 'application/json',
--        'X-API-Key', current_setting('app.supabase_function_key')
--      ),
--      body := '{}'::jsonb
--    ) AS request_id;

-- 4. Check the API key setting:
--    SELECT current_setting('app.supabase_function_key');

-- 5. Unschedule the job (if needed):
--    SELECT cron.unschedule('update-installment-statuses-daily');

-- 6. View job execution logs (check Edge Function logs and jobs_log table):
--    SELECT * FROM jobs_log
--    WHERE job_name = 'update-installment-statuses'
--    ORDER BY started_at DESC
--    LIMIT 10;

-- =====================================================
-- Troubleshooting
-- =====================================================
-- If the job is not running:
--   1. Verify the job is scheduled: SELECT * FROM cron.job
--   2. Check job run history: SELECT * FROM cron.job_run_details ORDER BY start_time DESC
--   3. Test manual execution with the same SQL
--   4. Verify API key: SELECT current_setting('app.supabase_function_key')
--   5. Check Edge Function is deployed: supabase functions list
--   6. Review Edge Function logs in Supabase Dashboard
--
-- If HTTP request fails:
--   1. Verify project-ref is correct in the URL
--   2. Test Edge Function directly with curl
--   3. Check API key matches between pg_cron and Edge Function
--   4. Review network connectivity from PostgreSQL to Edge Function endpoint
--
-- If job runs but no installments are updated:
--   1. Check jobs_log table for error messages
--   2. Verify update_installment_statuses() function exists and works
--   3. Test the database function manually: SELECT * FROM update_installment_statuses()
--   4. Ensure there are installments that meet the criteria (status='pending', due_date < current_date)

-- =====================================================
-- Security Considerations
-- =====================================================
-- 1. API Key Storage:
--    - Stored as PostgreSQL custom setting (app.supabase_function_key)
--    - Only accessible to database owner/superuser
--    - Retrieved dynamically via current_setting()
--    - Not exposed in pg_cron job listing
--
-- 2. Network Access:
--    - pg_cron runs inside database with superuser privileges
--    - Requires network access to Edge Function endpoint
--    - Supabase allows internal communication between services
--
-- 3. Edge Function Security:
--    - Protected by API key authentication (X-API-Key header)
--    - Uses service role key to bypass RLS for system operations
--    - Validates API key before processing any requests

-- =====================================================
-- Performance Considerations
-- =====================================================
-- 1. Job Schedule:
--    - Runs once daily at 7:00 AM UTC
--    - Low frequency = minimal database load
--    - Chosen time avoids peak business hours
--
-- 2. Database Function:
--    - Processes installments by agency (not individual installments)
--    - Single UPDATE statement per agency
--    - Efficient JSONB operations for transition tracking
--
-- 3. Recommended Indexes:
--    - See update_installment_statuses.sql for index recommendations
--    - Ensure indexes on: installments(payment_plan_id, status, student_due_date)
--    - Ensure indexes on: payment_plans(id, status)

-- =====================================================
-- Timezone Reference
-- =====================================================
-- UTC to Brisbane Conversion:
-- - Brisbane AEST (Standard Time): UTC+10 (no daylight saving)
--   7:00 AM UTC = 5:00 PM Brisbane AEST
--
-- Note: Queensland (Brisbane) does NOT observe daylight saving time
-- Therefore, the conversion is consistent year-round: UTC+10
--
-- Other Australian states:
-- - AEDT (NSW, VIC, TAS, ACT): UTC+11 during daylight saving
-- - ACST (SA): UTC+9.5 standard, UTC+10.5 daylight saving
-- - AWST (WA): UTC+8 (no daylight saving)
--
-- Agencies in different states will have different local times
-- when the job runs, but all will use their configured timezone
-- and cutoff time for determining overdue status.

-- =====================================================
-- Migration Complete
-- =====================================================
DO $$
BEGIN
  RAISE NOTICE '========================================';
  RAISE NOTICE 'pg_cron Schedule Configuration Complete';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Job Name: update-installment-statuses-daily';
  RAISE NOTICE 'Schedule: 0 7 * * * (7:00 AM UTC daily)';
  RAISE NOTICE 'Brisbane Time: 5:00 PM AEST';
  RAISE NOTICE '';
  RAISE NOTICE 'IMPORTANT: Replace <project-ref> with actual Supabase project reference';
  RAISE NOTICE 'IMPORTANT: Replace API key with actual value from Task 5';
  RAISE NOTICE '';
  RAISE NOTICE 'To verify job is scheduled, run:';
  RAISE NOTICE 'SELECT jobid, jobname, schedule, active FROM cron.job WHERE jobname = ''update-installment-statuses-daily'';';
  RAISE NOTICE '';
  RAISE NOTICE 'To manually test the job, run:';
  RAISE NOTICE 'SELECT net.http_post(...) -- see Testing section above';
  RAISE NOTICE '========================================';
END $$;
