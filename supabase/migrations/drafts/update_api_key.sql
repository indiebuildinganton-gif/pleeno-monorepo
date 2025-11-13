-- =====================================================
-- Task 5: Update API Key for Edge Function
-- Story 5-1: Automated Status Detection Job
-- =====================================================
-- Purpose: Update the API key used for authenticating pg_cron requests
--          to the update-installment-statuses Edge Function
-- Author: System
-- Date: 2025-11-13
-- =====================================================

-- IMPORTANT: This script should be run AFTER:
-- 1. Generating a secure API key (see api_key_setup_guide.md)
-- 2. Setting the key in Supabase secrets vault as SUPABASE_FUNCTION_KEY
-- 3. Deploying the Edge Function with the new secret

-- =====================================================
-- SECTION 1: Update the API Key Setting
-- =====================================================

-- Replace 'YOUR_GENERATED_API_KEY_HERE' with the actual API key
-- The same key should be set in Supabase secrets vault

-- Example key format (64-character hexadecimal from openssl rand -hex 32):
-- 5ba550fafbf9fba13e32225e87ace745340eef8028462a919c2d1372de98efba

-- Example key format (UUID v4 from uuidgen):
-- a1b2c3d4-e5f6-7890-1234-567890abcdef

ALTER DATABASE postgres SET app.supabase_function_key = 'YOUR_GENERATED_API_KEY_HERE';

-- =====================================================
-- SECTION 2: Verify the Setting
-- =====================================================

-- Check that the setting was applied (will show the actual key)
SELECT current_setting('app.supabase_function_key') AS api_key_configured;

-- For security, only check if key is set (without revealing value)
SELECT
  CASE
    WHEN current_setting('app.supabase_function_key', true) IS NOT NULL
      AND current_setting('app.supabase_function_key', true) != 'placeholder-api-key-to-be-configured-in-task-5'
    THEN 'API key is configured'
    ELSE 'API key needs to be set'
  END AS key_status;

-- =====================================================
-- SECTION 3: Test API Key Authentication
-- =====================================================

-- Test 1: Verify the key can be retrieved by pg_cron
-- This simulates what pg_cron will do when the scheduled job runs
DO $$
DECLARE
  v_api_key text;
BEGIN
  v_api_key := current_setting('app.supabase_function_key');

  IF v_api_key IS NULL OR v_api_key = '' THEN
    RAISE EXCEPTION 'API key is not configured!';
  END IF;

  IF v_api_key = 'placeholder-api-key-to-be-configured-in-task-5' THEN
    RAISE WARNING 'API key is still set to placeholder. Update with actual key.';
  ELSE
    RAISE NOTICE 'API key is configured (length: % characters)', length(v_api_key);
  END IF;
END $$;

-- =====================================================
-- SECTION 4: Manual Edge Function Test
-- =====================================================

-- Test the Edge Function endpoint with the configured API key
-- IMPORTANT: Replace 'your-project-ref' with your actual Supabase project reference
-- This should return a successful response if everything is configured correctly

-- Uncomment and run this after updating the project URL:
/*
SELECT net.http_post(
  url := 'https://your-project-ref.supabase.co/functions/v1/update-installment-statuses',
  headers := jsonb_build_object(
    'Content-Type', 'application/json',
    'X-API-Key', current_setting('app.supabase_function_key')
  ),
  body := '{}'::jsonb
) AS request_result;
*/

-- Expected successful response:
-- {
--   "status": 200,
--   "content": "{\"success\":true,\"recordsUpdated\":N,\"agencies\":[...]}"
-- }

-- Expected auth failure response (if keys don't match):
-- {
--   "status": 401,
--   "content": "{\"error\":\"Unauthorized\"}"
-- }

-- =====================================================
-- SECTION 5: Verify pg_cron Job Configuration
-- =====================================================

-- Check that the pg_cron job is configured to use the API key
SELECT
  jobid,
  jobname,
  schedule,
  active,
  -- Check if command includes the API key reference
  CASE
    WHEN command LIKE '%current_setting(''app.supabase_function_key'')%'
    THEN 'API key is referenced in job command'
    ELSE 'WARNING: API key not found in job command'
  END AS key_usage
FROM cron.job
WHERE jobname = 'update-installment-statuses-daily';

-- =====================================================
-- SECTION 6: Security Verification
-- =====================================================

-- Verify that regular users cannot access the API key setting
-- This should be run as a non-superuser role to test RLS

-- Test: Try to read the setting as service_role (should work)
-- SELECT current_setting('app.supabase_function_key');

-- Test: Try to read the setting as anon (should fail or return NULL)
-- SET ROLE anon;
-- SELECT current_setting('app.supabase_function_key', true);
-- RESET ROLE;

-- =====================================================
-- SECTION 7: Key Rotation Support
-- =====================================================

-- When rotating the API key, follow this sequence:
-- 1. Generate new API key
-- 2. Update Supabase secrets: supabase secrets set SUPABASE_FUNCTION_KEY="<new-key>"
-- 3. Redeploy Edge Function: supabase functions deploy update-installment-statuses
-- 4. Update database setting (run the ALTER DATABASE command above with new key)
-- 5. Test the endpoint manually
-- 6. Verify next scheduled pg_cron run succeeds

-- View recent job runs to verify successful execution after key update:
SELECT
  start_time,
  end_time,
  status,
  return_message,
  (end_time - start_time) AS duration
FROM cron.job_run_details
WHERE jobid = (SELECT jobid FROM cron.job WHERE jobname = 'update-installment-statuses-daily')
ORDER BY start_time DESC
LIMIT 5;

-- Check jobs_log for detailed execution results:
SELECT
  started_at,
  completed_at,
  status,
  records_updated,
  error_message,
  metadata
FROM jobs_log
WHERE job_name = 'update-installment-statuses'
ORDER BY started_at DESC
LIMIT 5;

-- =====================================================
-- DEPLOYMENT CHECKLIST
-- =====================================================

-- Before running this script in production:
-- [ ] Generate secure API key using one of these methods:
--     - openssl rand -hex 32
--     - uuidgen | tr '[:upper:]' '[:lower:]'
--     - node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
--
-- [ ] Store API key in Supabase secrets vault:
--     supabase secrets set SUPABASE_FUNCTION_KEY="<your-key>"
--
-- [ ] Deploy Edge Function to pick up the secret:
--     supabase functions deploy update-installment-statuses
--
-- [ ] Replace 'YOUR_GENERATED_API_KEY_HERE' in this script with actual key
--
-- [ ] Run this script to update the database setting
--
-- [ ] Test the endpoint manually using curl or the SQL test above
--
-- [ ] Verify pg_cron job runs successfully at next scheduled time
--
-- [ ] Check jobs_log table for successful execution
--
-- [ ] Document the key in secure key management system (not version control!)
--
-- [ ] Schedule next key rotation (recommended: 90 days from now)

-- =====================================================
-- SECURITY WARNINGS
-- =====================================================

-- WARNING: This script contains the actual API key value
-- DO NOT commit this script to version control after updating the key
-- Keep this script in a secure location accessible only to administrators

-- The API key in this script should match exactly:
-- 1. The SUPABASE_FUNCTION_KEY secret in Supabase secrets vault
-- 2. The app.supabase_function_key database setting

-- If keys don't match, authentication will fail:
-- - Edge Function reads from SUPABASE_FUNCTION_KEY (secrets vault)
-- - pg_cron reads from app.supabase_function_key (database setting)
-- - Both must be identical for authentication to succeed

-- =====================================================
-- TROUBLESHOOTING
-- =====================================================

-- Issue: pg_cron job fails with "Unauthorized" error
-- Solution: Verify keys match between secrets vault and database setting
--
-- Issue: current_setting() returns NULL
-- Solution: Run ALTER DATABASE command and reconnect to database
--
-- Issue: Edge Function still uses old key after rotation
-- Solution: Redeploy Edge Function after updating secrets vault
--
-- Issue: Cannot read the setting
-- Solution: Check you're connected to the correct database (should be 'postgres')

-- =====================================================
-- EXAMPLE: Production Deployment
-- =====================================================

-- Step 1: Generate key locally
-- $ openssl rand -hex 32
-- Output: 5ba550fafbf9fba13e32225e87ace745340eef8028462a919c2d1372de98efba

-- Step 2: Set in Supabase secrets
-- $ supabase secrets set SUPABASE_FUNCTION_KEY="5ba550fafbf9fba13e32225e87ace745340eef8028462a919c2d1372de98efba"

-- Step 3: Deploy Edge Function
-- $ supabase functions deploy update-installment-statuses

-- Step 4: Update database setting
-- ALTER DATABASE postgres SET app.supabase_function_key = '5ba550fafbf9fba13e32225e87ace745340eef8028462a919c2d1372de98efba';

-- Step 5: Test manually
-- SELECT net.http_post(
--   url := 'https://abcdefghijklmnop.supabase.co/functions/v1/update-installment-statuses',
--   headers := jsonb_build_object(
--     'Content-Type', 'application/json',
--     'X-API-Key', current_setting('app.supabase_function_key')
--   ),
--   body := '{}'::jsonb
-- );

-- =====================================================
-- END OF SCRIPT
-- =====================================================
