-- Migration 004: Schedule pg_cron job for due soon student notifications
-- Epic 5: Intelligent Status Automation & Notifications
-- Story 5.2: Due Soon Notification Flags - Task 3

-- =====================================================
-- pg_cron Schedule for Due Soon Notifications
-- =====================================================

-- Schedule daily job at 7:00 PM UTC (5:00 AM Brisbane next day)
-- This timing ensures:
-- - Job runs at 5:00 AM Brisbane time (day before due date)
-- - Sends notifications 36 hours before 5:00 PM cutoff on due date
-- - Example: For payment due Jan 15 at 5 PM, notification sent Jan 14 at 5 AM

-- First, unschedule if exists to ensure idempotency
SELECT cron.unschedule('send-due-soon-notifications')
WHERE EXISTS (
  SELECT 1 FROM cron.job WHERE jobname = 'send-due-soon-notifications'
);

-- Then schedule the job
-- IMPORTANT: Replace <project-ref> with actual Supabase project reference
-- Find at: Supabase Dashboard > Settings > API > Project URL

-- Note: This job will be enabled after Edge Function deployment
-- Uncomment and update <project-ref> during deployment:
/*
SELECT cron.schedule(
  'send-due-soon-notifications',
  '0 19 * * *',  -- 7:00 PM UTC daily (5:00 AM Brisbane next day)
  $$
  SELECT net.http_post(
    url := 'https://<project-ref>.supabase.co/functions/v1/send-due-soon-notifications',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'X-API-Key', current_setting('app.supabase_function_key')
    ),
    body := '{}'::jsonb
  ) AS request_id;
  $$
);
*/

-- =====================================================
-- END OF MIGRATION
-- =====================================================

-- Verification queries (commented out, run manually after migration):

-- Check pg_cron job
-- SELECT * FROM cron.job WHERE jobname = 'send-due-soon-notifications';

-- Manually trigger the Edge Function for testing (replace <project-ref>):
-- SELECT net.http_post(
--   url := 'https://<project-ref>.supabase.co/functions/v1/send-due-soon-notifications',
--   headers := jsonb_build_object(
--     'Content-Type', 'application/json',
--     'X-API-Key', current_setting('app.supabase_function_key')
--   ),
--   body := '{}'::jsonb
-- );
