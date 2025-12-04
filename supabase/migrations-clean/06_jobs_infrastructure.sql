-- Migration 06: Jobs Infrastructure
-- Creates jobs_log table and related functions
-- This is extracted from the notifications migration

BEGIN;

-- Create jobs_log table
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

-- Add indexes
CREATE INDEX IF NOT EXISTS idx_jobs_log_job_name ON jobs_log(job_name, started_at DESC);
CREATE INDEX IF NOT EXISTS idx_jobs_log_status ON jobs_log(status) WHERE status = 'failed';

-- Enable RLS
ALTER TABLE jobs_log ENABLE ROW LEVEL SECURITY;

-- Add agency configuration fields
ALTER TABLE agencies
ADD COLUMN IF NOT EXISTS timezone TEXT NOT NULL DEFAULT 'Australia/Brisbane',
ADD COLUMN IF NOT EXISTS overdue_cutoff_time TIME NOT NULL DEFAULT '17:00:00',
ADD COLUMN IF NOT EXISTS due_soon_threshold_days INT NOT NULL DEFAULT 4;

-- Add constraints
ALTER TABLE agencies DROP CONSTRAINT IF EXISTS agencies_timezone_check;
ALTER TABLE agencies
ADD CONSTRAINT agencies_timezone_check
CHECK (timezone IN (
  'Australia/Brisbane', 'Australia/Sydney', 'Australia/Melbourne',
  'Australia/Perth', 'Australia/Adelaide', 'America/Los_Angeles',
  'America/New_York', 'America/Chicago', 'Europe/London',
  'Europe/Paris', 'Asia/Tokyo', 'Asia/Singapore',
  'Pacific/Auckland', 'UTC'
));

-- Status update function
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
  FOR agency_record IN
    SELECT id, timezone, overdue_cutoff_time
    FROM agencies
  LOOP
    current_time_in_zone := (now() AT TIME ZONE agency_record.timezone);

    WITH updated AS (
      UPDATE installments i
      SET status = 'overdue'
      FROM payment_plans pp
      WHERE i.payment_plan_id = pp.id
        AND pp.agency_id = agency_record.id
        AND pp.status = 'active'
        AND i.status = 'pending'
        AND (
          i.student_due_date < CURRENT_DATE
          OR (
            i.student_due_date = CURRENT_DATE
            AND current_time_in_zone::TIME > agency_record.overdue_cutoff_time
          )
        )
      RETURNING i.id
    )
    SELECT count(*) INTO updated_count FROM updated;

    RETURN QUERY SELECT
      agency_record.id,
      updated_count,
      jsonb_build_object('pending_to_overdue', updated_count);
  END LOOP;
END;
$$;

COMMIT;
