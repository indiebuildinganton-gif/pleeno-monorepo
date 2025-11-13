-- =====================================================
-- Migration: Jobs Infrastructure for Status Automation
-- Epic: 5 - Intelligent Status Automation
-- Story: 5.1 - Automated Status Detection Job
-- =====================================================

-- This migration sets up the infrastructure for automated
-- background jobs, starting with the status update job that
-- marks overdue installments daily at 7:00 AM UTC.

-- =====================================================
-- SECTION 1: Extensions
-- =====================================================

-- Enable pg_cron for job scheduling
CREATE EXTENSION IF NOT EXISTS pg_cron;
COMMENT ON EXTENSION pg_cron IS 'PostgreSQL-native job scheduler for automated tasks';

-- Enable http extension for making HTTP requests to Edge Functions
CREATE EXTENSION IF NOT EXISTS http;
COMMENT ON EXTENSION http IS 'Allows PostgreSQL to make HTTP requests via net.http_post()';

-- =====================================================
-- SECTION 2: Jobs Log Table
-- =====================================================

-- Table to track all job executions
CREATE TABLE IF NOT EXISTS jobs_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_name TEXT NOT NULL,
  started_at TIMESTAMPTZ NOT NULL,
  completed_at TIMESTAMPTZ,
  records_updated INT DEFAULT 0,
  status TEXT NOT NULL CHECK (status IN ('running', 'success', 'failed')),
  error_message TEXT,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Add comments
COMMENT ON TABLE jobs_log IS 'Tracks execution of automated jobs (status updates, notifications, etc.)';
COMMENT ON COLUMN jobs_log.job_name IS 'Name of the job (e.g., update-installment-statuses)';
COMMENT ON COLUMN jobs_log.metadata IS 'Job-specific results, e.g., agency-level update counts';

-- Create indexes for efficient querying
CREATE INDEX IF NOT EXISTS idx_jobs_log_job_name ON jobs_log(job_name, started_at DESC);
CREATE INDEX IF NOT EXISTS idx_jobs_log_status ON jobs_log(status) WHERE status = 'failed';

-- Enable RLS
ALTER TABLE jobs_log ENABLE ROW LEVEL SECURITY;

-- RLS Policies: Admin-only access
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'jobs_log' AND policyname = 'Admin users can view all job logs'
  ) THEN
    CREATE POLICY "Admin users can view all job logs"
      ON jobs_log
      FOR SELECT
      TO authenticated
      USING (
        EXISTS (
          SELECT 1 FROM user_roles
          WHERE user_roles.user_id = auth.uid()
            AND user_roles.role = 'admin'
        )
      );
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'jobs_log' AND policyname = 'Service role can insert job logs'
  ) THEN
    CREATE POLICY "Service role can insert job logs"
      ON jobs_log
      FOR INSERT
      TO service_role
      WITH CHECK (true);
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'jobs_log' AND policyname = 'Service role can update job logs'
  ) THEN
    CREATE POLICY "Service role can update job logs"
      ON jobs_log
      FOR UPDATE
      TO service_role
      USING (true);
  END IF;
END $$;

-- =====================================================
-- SECTION 3: Agency Configuration Fields
-- =====================================================

-- Add timezone and cutoff time fields to agencies table
ALTER TABLE agencies
ADD COLUMN IF NOT EXISTS timezone TEXT NOT NULL DEFAULT 'Australia/Brisbane',
ADD COLUMN IF NOT EXISTS overdue_cutoff_time TIME NOT NULL DEFAULT '17:00:00',
ADD COLUMN IF NOT EXISTS due_soon_threshold_days INT NOT NULL DEFAULT 4;

-- Add constraints (drop first if they exist to ensure idempotency)
DO $$
BEGIN
  -- Drop existing constraints if they exist
  ALTER TABLE agencies DROP CONSTRAINT IF EXISTS agencies_timezone_check;
  ALTER TABLE agencies DROP CONSTRAINT IF EXISTS agencies_cutoff_time_check;
  ALTER TABLE agencies DROP CONSTRAINT IF EXISTS agencies_due_soon_days_check;

  -- Add constraints
  ALTER TABLE agencies
  ADD CONSTRAINT agencies_timezone_check
  CHECK (timezone IN (
    'Australia/Brisbane', 'Australia/Sydney', 'Australia/Melbourne',
    'Australia/Perth', 'Australia/Adelaide', 'America/Los_Angeles',
    'America/New_York', 'America/Chicago', 'Europe/London',
    'Europe/Paris', 'Asia/Tokyo', 'Asia/Singapore',
    'Pacific/Auckland', 'UTC'
  ));

  ALTER TABLE agencies
  ADD CONSTRAINT agencies_cutoff_time_check
  CHECK (overdue_cutoff_time BETWEEN '00:00:00' AND '23:59:59');

  ALTER TABLE agencies
  ADD CONSTRAINT agencies_due_soon_days_check
  CHECK (due_soon_threshold_days BETWEEN 1 AND 30);
END $$;

-- Add comments
COMMENT ON COLUMN agencies.timezone IS 'IANA timezone name for agency location';
COMMENT ON COLUMN agencies.overdue_cutoff_time IS 'Time of day when pending installments become overdue (default 5:00 PM)';
COMMENT ON COLUMN agencies.due_soon_threshold_days IS 'Days before due date to flag as "due soon"';

-- =====================================================
-- SECTION 4: Status Update Function
-- =====================================================

CREATE OR REPLACE FUNCTION update_installment_statuses()
RETURNS TABLE(
  agency_id UUID,
  updated_count INT,
  transitions JSONB
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  agency_record RECORD;
  current_time_in_zone TIMESTAMPTZ;
  updated_count INT;
BEGIN
  -- Loop through each agency to handle different timezones
  -- Each agency has its own timezone and cutoff time settings
  FOR agency_record IN
    SELECT id, timezone, overdue_cutoff_time
    FROM agencies
  LOOP
    -- Convert UTC time to agency's local timezone
    -- Example: If UTC is 7:00 AM and agency timezone is Australia/Brisbane,
    -- this gives us 5:00 PM Brisbane time (AEST is UTC+10)
    current_time_in_zone := (now() AT TIME ZONE agency_record.timezone);

    -- Update installments to 'overdue' based on two conditions:
    --
    -- 1. Due date is in the past (student_due_date < CURRENT_DATE)
    --    Example: If today is Jan 15 and due date is Jan 14, mark overdue
    --
    -- 2. Due date is today AND current agency local time > cutoff time
    --    Example: If today is Jan 15, due date is Jan 15, and:
    --    - Agency timezone: Australia/Brisbane
    --    - Cutoff time: 17:00 (5:00 PM)
    --    - Current Brisbane time: 18:00 (6:00 PM)
    --    Then mark overdue (student had until 5 PM to pay)
    --
    -- This ensures installments become overdue at the agency's business day end,
    -- not at midnight UTC, which provides a more user-friendly experience.
    WITH updated AS (
      UPDATE installments i
      SET status = 'overdue'
      FROM payment_plans pp
      WHERE i.payment_plan_id = pp.id
        AND pp.agency_id = agency_record.id
        AND pp.status = 'active'          -- Only active payment plans
        AND i.status = 'pending'           -- Only pending installments
        AND (
          -- Condition 1: Due date is in the past
          i.student_due_date < CURRENT_DATE
          OR (
            -- Condition 2: Due date is today AND past cutoff time
            i.student_due_date = CURRENT_DATE
            AND current_time_in_zone::TIME > agency_record.overdue_cutoff_time
          )
        )
      RETURNING i.id
    )
    SELECT count(*) INTO updated_count FROM updated;

    -- Return results for this agency showing how many were updated
    -- The transitions JSONB allows for future expansion to track
    -- other state transitions (pending → due_soon, etc.)
    RETURN QUERY SELECT
      agency_record.id,
      updated_count,
      jsonb_build_object('pending_to_overdue', updated_count);
  END LOOP;
END;
$$;

COMMENT ON FUNCTION update_installment_statuses IS 'Updates installment statuses to overdue based on due dates and agency timezones';

-- =====================================================
-- SECTION 5: Alert Trigger
-- =====================================================

-- Function to send real-time notification when a job fails
-- This allows external monitoring systems to listen for job failures
-- via PostgreSQL's LISTEN/NOTIFY mechanism
CREATE OR REPLACE FUNCTION notify_job_failure()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  -- Only notify for failed status update jobs
  -- Future: Can extend to notify for other job types or conditions
  IF NEW.status = 'failed' AND NEW.job_name = 'update-installment-statuses' THEN
    -- Send notification via pg_notify channel
    -- External systems can subscribe to 'job_failure' channel using:
    --   LISTEN job_failure;
    -- Then handle the notification in application code
    PERFORM pg_notify(
      'job_failure',
      json_build_object(
        'job_name', NEW.job_name,
        'started_at', NEW.started_at,
        'error_message', NEW.error_message
      )::text
    );
  END IF;
  RETURN NEW;
END;
$$;

COMMENT ON FUNCTION notify_job_failure IS 'Sends pg_notify alert when status update job fails for real-time monitoring';

-- Create trigger (drop first if exists for idempotency)
DROP TRIGGER IF EXISTS trigger_notify_job_failure ON jobs_log;
CREATE TRIGGER trigger_notify_job_failure
AFTER INSERT OR UPDATE ON jobs_log
FOR EACH ROW
EXECUTE FUNCTION notify_job_failure();

-- =====================================================
-- SECTION 6: API Key Configuration
-- =====================================================

-- Store API key as PostgreSQL custom setting
-- IMPORTANT: Replace 'your-api-key-here' with actual generated key
-- See Task 5 for API key generation instructions
-- Note: Use ALTER DATABASE statement with caution in production
-- Consider using Supabase Dashboard > Project Settings > Database > Custom Postgres Config

-- Uncomment and set the actual API key during deployment:
-- ALTER DATABASE postgres SET app.supabase_function_key = 'your-api-key-here';

-- =====================================================
-- SECTION 7: pg_cron Schedule
-- =====================================================

-- Schedule daily job at 7:00 AM UTC (5:00 PM Brisbane time)
-- IMPORTANT: Replace <project-ref> with actual Supabase project reference
-- Find at: Supabase Dashboard > Settings > API > Project URL

-- First, unschedule if exists to ensure idempotency
SELECT cron.unschedule('update-installment-statuses-daily')
WHERE EXISTS (
  SELECT 1 FROM cron.job WHERE jobname = 'update-installment-statuses-daily'
);

-- Then schedule the job
-- Uncomment and update <project-ref> during deployment:
/*
SELECT cron.schedule(
  'update-installment-statuses-daily',
  '0 7 * * *',  -- 7:00 AM UTC daily
  $$
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
*/

-- =====================================================
-- END OF MIGRATION
-- =====================================================

-- Verification queries (commented out, run manually after migration):

-- Check extensions
-- SELECT * FROM pg_extension WHERE extname IN ('pg_cron', 'http');

-- Check jobs_log table
-- SELECT * FROM jobs_log ORDER BY started_at DESC LIMIT 5;

-- Check agency fields
-- SELECT id, name, timezone, overdue_cutoff_time FROM agencies LIMIT 5;

-- Check pg_cron job
-- SELECT * FROM cron.job WHERE jobname = 'update-installment-statuses-daily';

-- Test function manually
-- SELECT * FROM update_installment_statuses();
