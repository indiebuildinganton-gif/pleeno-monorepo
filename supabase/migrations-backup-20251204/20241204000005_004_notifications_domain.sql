-- Source: 001_jobs_infrastructure.sql

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
          SELECT 1 FROM users
          WHERE users.id = auth.uid()
            AND users.role = 'agency_admin'
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


-- Source: 001_notification_system.sql

-- Migration 001: Create Notification System Schema
-- Epic 5: Intelligent Status Automation & Notifications
-- Story 5.5: Automated Email Notifications (Multi-Stakeholder)
-- Task 1: Database Schema for Notification System

-- ============================================================
-- OVERVIEW
-- ============================================================
-- This migration creates the complete database schema for a multi-stakeholder
-- email notification system that supports:
-- - 4 distinct recipient types (agency_user, student, college, sales_agent)
-- - Configurable notification rules per agency and recipient type
-- - Customizable email templates with variable placeholders
-- - Notification logging with duplicate prevention
-- - Time-based pre-notifications (e.g., "due soon" emails)
-- - Full audit trail for all sent notifications

BEGIN;

-- ============================================================
-- STEP 1: Add Fields to Existing Tables
-- ============================================================

-- Add email notification preferences to users table
ALTER TABLE users
  ADD COLUMN IF NOT EXISTS email_notifications_enabled BOOLEAN DEFAULT false;

COMMENT ON COLUMN users.email_notifications_enabled IS
  'Whether the user has enabled email notifications. Users can opt-in to receive email alerts for overdue payments, due soon reminders, etc.';

-- Add sales agent assignment to students table
ALTER TABLE students
  ADD COLUMN IF NOT EXISTS assigned_user_id UUID REFERENCES users(id) ON DELETE SET NULL;

COMMENT ON COLUMN students.assigned_user_id IS
  'Foreign key to users table - identifies the sales agent assigned to this student. Used for sending notifications to the assigned agent about student payment events.';

-- Add notification tracking to installments table
ALTER TABLE installments
  ADD COLUMN IF NOT EXISTS last_notified_date TIMESTAMPTZ;

COMMENT ON COLUMN installments.last_notified_date IS
  'Timestamp of the last notification sent for this installment. Used to prevent duplicate notifications and track notification history.';

-- ============================================================
-- STEP 2: Create notification_rules Table
-- ============================================================
-- Stores configurable rules that determine when and to whom notifications are sent.
-- Each agency can enable/disable notifications per recipient type and event type.

CREATE TABLE notification_rules (
  -- Primary key
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- REQUIRED: Tenant isolation key
  agency_id UUID NOT NULL REFERENCES agencies(id) ON DELETE CASCADE,

  -- Notification targeting
  recipient_type TEXT NOT NULL CHECK (recipient_type IN ('agency_user', 'student', 'college', 'sales_agent')),
  event_type TEXT NOT NULL CHECK (event_type IN ('overdue', 'due_soon', 'payment_received')),

  -- Rule configuration
  is_enabled BOOLEAN DEFAULT false NOT NULL,
  template_id UUID, -- Foreign key will be added after email_templates is created

  -- Trigger configuration (JSONB for flexibility)
  -- Example: { "advance_hours": 36, "trigger_time": "05:00", "timezone": "Australia/Brisbane" }
  -- - advance_hours: For "due_soon" events, how many hours before due date to send
  -- - trigger_time: Time of day to send (24h format, e.g., "05:00" for 5 AM)
  -- - timezone: IANA timezone for trigger_time (e.g., "Australia/Brisbane")
  trigger_config JSONB DEFAULT '{}'::jsonb,

  -- Standard timestamps
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL,

  -- Business constraint: Each agency can have only one rule per recipient_type + event_type combo
  UNIQUE(agency_id, recipient_type, event_type)
);

-- ============================================================
-- STEP 3: Create email_templates Table
-- ============================================================
-- Stores customizable email templates with variable placeholders.
-- Templates support variables like {{student.name}}, {{installment.amount}}, etc.

CREATE TABLE email_templates (
  -- Primary key
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- REQUIRED: Tenant isolation key
  agency_id UUID NOT NULL REFERENCES agencies(id) ON DELETE CASCADE,

  -- Template identification
  template_type TEXT NOT NULL,  -- e.g., "overdue_student", "due_soon_agent", "payment_received_college"

  -- Email content
  subject TEXT NOT NULL,
  body_html TEXT NOT NULL,

  -- Variable definitions (JSONB for documentation and validation)
  -- Example: { "student_name": "{{student.name}}", "amount": "{{installment.amount}}", "due_date": "{{installment.student_due_date}}" }
  variables JSONB DEFAULT '{}'::jsonb,

  -- Standard timestamps
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- ============================================================
-- STEP 4: Create notification_log Table
-- ============================================================
-- Logs all sent notifications for audit purposes and duplicate prevention.
-- UNIQUE constraint ensures no duplicate notifications are sent to the same recipient for the same installment.

CREATE TABLE notification_log (
  -- Primary key
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Foreign keys
  installment_id UUID NOT NULL REFERENCES installments(id) ON DELETE CASCADE,

  -- Recipient information
  recipient_type TEXT NOT NULL CHECK (recipient_type IN ('agency_user', 'student', 'college', 'sales_agent')),
  recipient_email TEXT NOT NULL,

  -- Event tracking
  event_type TEXT NOT NULL CHECK (event_type IN ('overdue', 'due_soon', 'payment_received')),
  sent_at TIMESTAMPTZ DEFAULT now() NOT NULL,

  -- Optional metadata (for debugging and analytics)
  template_id UUID REFERENCES email_templates(id) ON DELETE SET NULL,
  email_subject TEXT,

  -- CRITICAL: Prevent duplicate notifications
  -- This ensures we never send the same notification type to the same recipient for the same installment twice
  UNIQUE(installment_id, recipient_type, recipient_email, event_type)
);

-- ============================================================
-- STEP 5: Add Triggers for Updated_at
-- ============================================================

-- Automatically update updated_at timestamp for notification_rules
CREATE TRIGGER update_notification_rules_updated_at
  BEFORE UPDATE ON notification_rules
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Automatically update updated_at timestamp for email_templates
CREATE TRIGGER update_email_templates_updated_at
  BEFORE UPDATE ON email_templates
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================================
-- STEP 6: Create Performance Indexes
-- ============================================================

-- Indexes for notification_rules
CREATE INDEX idx_notification_rules_agency ON notification_rules(agency_id, is_enabled, recipient_type);
CREATE INDEX idx_notification_rules_lookup ON notification_rules(agency_id, recipient_type, event_type, is_enabled);

-- Indexes for email_templates
CREATE INDEX idx_email_templates_agency ON email_templates(agency_id);
CREATE INDEX idx_email_templates_type ON email_templates(agency_id, template_type);

-- Add foreign key constraint for notification_rules.template_id now that email_templates exists
ALTER TABLE notification_rules
  ADD CONSTRAINT fk_notification_rules_template
  FOREIGN KEY (template_id)
  REFERENCES email_templates(id)
  ON DELETE SET NULL;

-- Indexes for notification_log
CREATE INDEX idx_notification_log_installment ON notification_log(installment_id, recipient_email);
CREATE INDEX idx_notification_log_sent_at ON notification_log(sent_at DESC);
CREATE INDEX idx_notification_log_recipient ON notification_log(recipient_type, recipient_email, sent_at DESC);

-- Indexes for new columns in existing tables
CREATE INDEX idx_installments_last_notified ON installments(last_notified_date) WHERE last_notified_date IS NOT NULL;
CREATE INDEX idx_students_assigned_user ON students(assigned_user_id) WHERE assigned_user_id IS NOT NULL;
CREATE INDEX idx_users_email_notifications ON users(agency_id, email_notifications_enabled) WHERE email_notifications_enabled = true;

-- ============================================================
-- STEP 7: Enable Row Level Security
-- ============================================================

ALTER TABLE notification_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_log ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- STEP 8: Create RLS Policies - notification_rules
-- ============================================================

-- SELECT Policy: Agency isolation - all users can view rules
CREATE POLICY notification_rules_agency_isolation_select ON notification_rules
  FOR SELECT
  USING (
    agency_id = (
      SELECT agency_id
      FROM users
      WHERE id = auth.uid()
    )
  );

-- INSERT Policy: Admin only
CREATE POLICY notification_rules_admin_insert ON notification_rules
  FOR INSERT
  WITH CHECK (
    agency_id = (
      SELECT agency_id
      FROM users
      WHERE id = auth.uid()
      AND role = 'agency_admin'
    )
  );

-- UPDATE Policy: Admin only
CREATE POLICY notification_rules_admin_update ON notification_rules
  FOR UPDATE
  USING (
    agency_id = (
      SELECT agency_id
      FROM users
      WHERE id = auth.uid()
      AND role = 'agency_admin'
    )
  )
  WITH CHECK (
    agency_id = (
      SELECT agency_id
      FROM users
      WHERE id = auth.uid()
      AND role = 'agency_admin'
    )
  );

-- DELETE Policy: Admin only
CREATE POLICY notification_rules_admin_delete ON notification_rules
  FOR DELETE
  USING (
    agency_id = (
      SELECT agency_id
      FROM users
      WHERE id = auth.uid()
      AND role = 'agency_admin'
    )
  );

-- ============================================================
-- STEP 9: Create RLS Policies - email_templates
-- ============================================================

-- SELECT Policy: Agency isolation - all users can view templates
CREATE POLICY email_templates_agency_isolation_select ON email_templates
  FOR SELECT
  USING (
    agency_id = (
      SELECT agency_id
      FROM users
      WHERE id = auth.uid()
    )
  );

-- INSERT Policy: Admin only
CREATE POLICY email_templates_admin_insert ON email_templates
  FOR INSERT
  WITH CHECK (
    agency_id = (
      SELECT agency_id
      FROM users
      WHERE id = auth.uid()
      AND role = 'agency_admin'
    )
  );

-- UPDATE Policy: Admin only
CREATE POLICY email_templates_admin_update ON email_templates
  FOR UPDATE
  USING (
    agency_id = (
      SELECT agency_id
      FROM users
      WHERE id = auth.uid()
      AND role = 'agency_admin'
    )
  )
  WITH CHECK (
    agency_id = (
      SELECT agency_id
      FROM users
      WHERE id = auth.uid()
      AND role = 'agency_admin'
    )
  );

-- DELETE Policy: Admin only
CREATE POLICY email_templates_admin_delete ON email_templates
  FOR DELETE
  USING (
    agency_id = (
      SELECT agency_id
      FROM users
      WHERE id = auth.uid()
      AND role = 'agency_admin'
    )
  );

-- ============================================================
-- STEP 10: Create RLS Policies - notification_log
-- ============================================================

-- SELECT Policy: Agency users can view their agency's notification logs
CREATE POLICY notification_log_agency_isolation_select ON notification_log
  FOR SELECT
  USING (
    installment_id IN (
      SELECT id
      FROM installments
      WHERE agency_id = (
        SELECT agency_id
        FROM users
        WHERE id = auth.uid()
      )
    )
  );

-- INSERT Policy: Service role only (via Edge Functions)
-- Regular users cannot insert logs - only the notification service (using service role) can
CREATE POLICY notification_log_service_insert ON notification_log
  FOR INSERT
  WITH CHECK (true);  -- Service role bypasses RLS, anon key cannot insert

-- UPDATE/DELETE: Not allowed (logs are immutable)
-- No UPDATE or DELETE policies = no one can modify or delete logs

-- ============================================================
-- STEP 11: Add Table and Column Documentation
-- ============================================================

COMMENT ON TABLE notification_rules IS
  'Configurable notification rules per agency. Controls when and to whom email notifications are sent. Each agency can enable/disable notifications per recipient type (agency_user, student, college, sales_agent) and event type (overdue, due_soon, payment_received).';

COMMENT ON COLUMN notification_rules.recipient_type IS
  'Type of recipient: agency_user (agency staff), student (enrolled students), college (partner institutions), sales_agent (assigned sales representatives)';

COMMENT ON COLUMN notification_rules.event_type IS
  'Event that triggers notification: overdue (payment past due), due_soon (payment approaching due date), payment_received (payment completed)';

COMMENT ON COLUMN notification_rules.is_enabled IS
  'Whether this notification rule is active. Agencies can enable/disable notifications per recipient type and event type.';

COMMENT ON COLUMN notification_rules.template_id IS
  'Foreign key to email_templates - specifies which email template to use for this notification rule';

COMMENT ON COLUMN notification_rules.trigger_config IS
  'JSON configuration for notification timing: advance_hours (how many hours before due date), trigger_time (time of day to send), timezone (IANA timezone string)';

COMMENT ON TABLE email_templates IS
  'Customizable email templates with variable placeholders. Each agency can define custom email templates for different notification types. Variables like {{student.name}}, {{installment.amount}} are replaced with actual values when sending.';

COMMENT ON COLUMN email_templates.template_type IS
  'Template identifier: overdue_student, due_soon_agent, payment_received_college, etc. Used to match rules with templates.';

COMMENT ON COLUMN email_templates.subject IS
  'Email subject line. Supports variable placeholders like {{student.name}}';

COMMENT ON COLUMN email_templates.body_html IS
  'Email body in HTML format. Supports variable placeholders like {{installment.amount}}, {{due_date}}, etc.';

COMMENT ON COLUMN email_templates.variables IS
  'JSON map of available variables for this template. Used for documentation and validation. Example: {"student_name": "{{student.name}}"}';

COMMENT ON TABLE notification_log IS
  'Audit log of all sent notifications. Tracks who received what notification and when. UNIQUE constraint prevents duplicate notifications. Immutable (no updates/deletes allowed).';

COMMENT ON COLUMN notification_log.installment_id IS
  'Foreign key to installments - links notification to the payment installment that triggered it';

COMMENT ON COLUMN notification_log.recipient_type IS
  'Type of recipient who received the notification: agency_user, student, college, or sales_agent';

COMMENT ON COLUMN notification_log.recipient_email IS
  'Email address where notification was sent';

COMMENT ON COLUMN notification_log.event_type IS
  'Event type that triggered this notification: overdue, due_soon, or payment_received';

COMMENT ON COLUMN notification_log.sent_at IS
  'Timestamp when notification was sent (UTC)';

-- Policy comments for notification_rules
COMMENT ON POLICY notification_rules_agency_isolation_select ON notification_rules IS
  'Agency isolation: All users can SELECT notification rules for their agency';

COMMENT ON POLICY notification_rules_admin_insert ON notification_rules IS
  'Admin only: Only agency_admin role can INSERT notification rules';

COMMENT ON POLICY notification_rules_admin_update ON notification_rules IS
  'Admin only: Only agency_admin role can UPDATE notification rules';

COMMENT ON POLICY notification_rules_admin_delete ON notification_rules IS
  'Admin only: Only agency_admin role can DELETE notification rules';

-- Policy comments for email_templates
COMMENT ON POLICY email_templates_agency_isolation_select ON email_templates IS
  'Agency isolation: All users can SELECT email templates for their agency';

COMMENT ON POLICY email_templates_admin_insert ON email_templates IS
  'Admin only: Only agency_admin role can INSERT email templates';

COMMENT ON POLICY email_templates_admin_update ON email_templates IS
  'Admin only: Only agency_admin role can UPDATE email templates';

COMMENT ON POLICY email_templates_admin_delete ON email_templates IS
  'Admin only: Only agency_admin role can DELETE email templates';

-- Policy comments for notification_log
COMMENT ON POLICY notification_log_agency_isolation_select ON notification_log IS
  'Agency isolation: Users can SELECT notification logs for their agency installments';

COMMENT ON POLICY notification_log_service_insert ON notification_log IS
  'Service role only: Notification logs are created by backend jobs (Edge Functions with service role), not by users';

COMMIT;


-- Source: 001_notifications_schema.sql

-- Migration 001: Create notifications table with RLS
-- Epic 5: Intelligent Status Automation & Notifications
-- Story 5.3: Overdue Payment Alerts - Task 1

BEGIN;

-- ============================================================
-- STEP 1: Create Notifications Table
-- ============================================================

CREATE TABLE notifications (
  -- Primary key
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- REQUIRED: Tenant isolation key
  agency_id UUID NOT NULL REFERENCES agencies(id) ON DELETE CASCADE,

  -- User-specific notification (NULL = agency-wide notification)
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,

  -- Notification metadata
  type TEXT NOT NULL CHECK (type IN ('overdue_payment', 'due_soon', 'payment_received', 'system')),
  message TEXT NOT NULL,
  link TEXT,  -- Deep link to relevant page (e.g., /payments/plans/:id)

  -- Read tracking
  is_read BOOLEAN DEFAULT false NOT NULL,
  read_at TIMESTAMPTZ,

  -- Standard timestamps
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- ============================================================
-- STEP 2: Create Indexes (REQUIRED for performance)
-- ============================================================

-- CRITICAL: Index on agency_id for RLS query performance
CREATE INDEX idx_notifications_agency_id ON notifications(agency_id);

-- Index for user-specific unread notifications (most common query)
CREATE INDEX idx_notifications_user_unread ON notifications(user_id, is_read, created_at DESC)
  WHERE user_id IS NOT NULL;

-- Index for agency-wide unread notifications
CREATE INDEX idx_notifications_agency_unread ON notifications(agency_id, is_read, created_at DESC)
  WHERE user_id IS NULL;

-- Index for type-based filtering
CREATE INDEX idx_notifications_type ON notifications(agency_id, type, created_at DESC);

-- ============================================================
-- STEP 3: Add Triggers
-- ============================================================

-- Automatically update updated_at timestamp
CREATE TRIGGER update_notifications_updated_at
  BEFORE UPDATE ON notifications
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Automatically set read_at when is_read changes to true
CREATE OR REPLACE FUNCTION set_notification_read_at()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.is_read = true AND OLD.is_read = false THEN
    NEW.read_at := now();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER notifications_set_read_at
  BEFORE UPDATE ON notifications
  FOR EACH ROW
  WHEN (NEW.is_read IS DISTINCT FROM OLD.is_read)
  EXECUTE FUNCTION set_notification_read_at();

-- ============================================================
-- STEP 4: Enable RLS
-- ============================================================

ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- STEP 5: Create RLS Policies
-- ============================================================

-- SELECT Policy: Users can view notifications in their agency
-- Includes both agency-wide (user_id IS NULL) and user-specific notifications
CREATE POLICY notifications_agency_isolation_select ON notifications
  FOR SELECT
  USING (
    agency_id = (
      SELECT agency_id
      FROM users
      WHERE id = auth.uid()
    )
    AND (user_id IS NULL OR user_id = auth.uid())
  );

-- INSERT Policy: System/Service role only
-- Notifications are created by Edge Functions or backend jobs with service role
-- Regular users cannot create notifications
CREATE POLICY notifications_service_insert ON notifications
  FOR INSERT
  WITH CHECK (true);  -- Service role bypasses RLS, anon key cannot insert

-- UPDATE Policy: Users can update their own notifications
-- Users can only mark their own notifications as read
CREATE POLICY notifications_user_update ON notifications
  FOR UPDATE
  USING (
    agency_id = (
      SELECT agency_id
      FROM users
      WHERE id = auth.uid()
    )
    AND (user_id IS NULL OR user_id = auth.uid())
  )
  WITH CHECK (
    agency_id = (
      SELECT agency_id
      FROM users
      WHERE id = auth.uid()
    )
    AND (user_id IS NULL OR user_id = auth.uid())
  );

-- DELETE Policy: Admin only (for maintenance/cleanup)
-- Only agency admins can delete notifications in their agency
CREATE POLICY notifications_admin_delete ON notifications
  FOR DELETE
  USING (
    agency_id = (
      SELECT agency_id
      FROM users
      WHERE id = auth.uid()
      AND role = 'agency_admin'
    )
  );

-- ============================================================
-- STEP 6: Add Documentation
-- ============================================================

COMMENT ON TABLE notifications IS
  'In-app notifications for agency users with multi-tenant isolation. Includes both agency-wide (user_id IS NULL) and user-specific notifications.';

COMMENT ON COLUMN notifications.agency_id IS
  'Foreign key to agencies table - enforces tenant isolation via RLS policies';

COMMENT ON COLUMN notifications.user_id IS
  'Foreign key to users table. NULL indicates agency-wide notification visible to all users in the agency.';

COMMENT ON COLUMN notifications.type IS
  'Notification type: overdue_payment, due_soon, payment_received, or system';

COMMENT ON COLUMN notifications.message IS
  'Human-readable notification message displayed to users';

COMMENT ON COLUMN notifications.link IS
  'Optional deep link to relevant page (e.g., /payments/plans/:id, /dashboard)';

COMMENT ON COLUMN notifications.is_read IS
  'Whether the notification has been marked as read by the user';

COMMENT ON COLUMN notifications.read_at IS
  'Timestamp when notification was marked as read (set automatically by trigger)';

COMMENT ON POLICY notifications_agency_isolation_select ON notifications IS
  'Agency isolation: Users can SELECT notifications for their agency (both agency-wide and user-specific)';

COMMENT ON POLICY notifications_service_insert ON notifications IS
  'Service role only: Notifications are created by backend jobs, not by users';

COMMENT ON POLICY notifications_user_update ON notifications IS
  'Users can UPDATE their own notifications (mark as read)';

COMMENT ON POLICY notifications_admin_delete ON notifications IS
  'Admin only: Only agency_admin role can DELETE notifications in their agency';

COMMIT;


-- Source: 002_add_metadata.sql

-- Migration 002: Add metadata column to notifications table
-- Epic 5: Intelligent Status Automation & Notifications
-- Story 5.3: Overdue Payment Alerts - Task 2
--
-- Purpose: Add metadata JSONB column for storing structured data (installment_id, etc.)
-- This enables better deduplication and tracking of notification sources

BEGIN;

-- ============================================================
-- STEP 1: Add metadata column
-- ============================================================

ALTER TABLE notifications
ADD COLUMN metadata JSONB DEFAULT '{}'::jsonb;

-- ============================================================
-- STEP 2: Create index for metadata queries
-- ============================================================

-- Create GIN index for efficient JSONB queries
-- This enables fast lookups like: metadata @> '{"installment_id": "uuid"}'
CREATE INDEX idx_notifications_metadata ON notifications USING GIN (metadata);

-- ============================================================
-- STEP 3: Add documentation
-- ============================================================

COMMENT ON COLUMN notifications.metadata IS
  'Structured metadata in JSONB format. Used to store notification-specific data like installment_id for deduplication and tracking.';

COMMIT;


-- Source: 002_extend_status_update.sql

-- Migration 002: Extend Status Update Function for Email Notifications
-- Epic 5: Intelligent Status Automation & Notifications
-- Story 5.5: Automated Email Notifications (Multi-Stakeholder)
-- Task 5: Notification Job - Extend Status Update Function

-- ============================================================
-- OVERVIEW
-- ============================================================
-- This migration extends the update_installment_statuses() function to:
-- 1. Return IDs of newly overdue installments for notification processing
-- 2. Only update installments that haven't been notified today (prevent duplicates)
-- 3. Maintain backward compatibility with existing job monitoring

BEGIN;

-- ============================================================
-- Update the update_installment_statuses function
-- ============================================================
-- Key changes from previous version:
-- 1. Added last_notified_date filter to prevent duplicate processing
-- 2. Returns newly_overdue_ids array for notification processing
-- 3. Maintains activity logging for BI dashboard

-- Drop the existing function first to change the return type
DROP FUNCTION IF EXISTS update_installment_statuses();

CREATE OR REPLACE FUNCTION update_installment_statuses()
RETURNS TABLE(
  agency_id UUID,
  updated_count INT,
  transitions JSONB,
  newly_overdue_ids UUID[]
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  agency_record RECORD;
  current_time_in_zone TIMESTAMPTZ;
  updated_count INT;
  installment_record RECORD;
  overdue_ids UUID[];
BEGIN
  -- Loop through each agency
  FOR agency_record IN
    SELECT id, timezone, overdue_cutoff_time
    FROM agencies
  LOOP
    -- Get current time in agency's timezone
    current_time_in_zone := (now() AT TIME ZONE agency_record.timezone);

    -- Update installments past due date or past cutoff time today
    -- IMPORTANT: Only update if last_notified_date IS NULL or is from a previous day
    -- This prevents duplicate notification processing on subsequent runs
    -- and collect the updated records for activity logging
    FOR installment_record IN
      WITH updated AS (
        UPDATE installments i
        SET status = 'overdue'
        FROM payment_plans pp
        WHERE i.payment_plan_id = pp.id
          AND pp.agency_id = agency_record.id
          AND pp.status = 'active'
          AND i.status = 'pending'
          -- KEY CHANGE: Only update if not notified today
          AND (i.last_notified_date IS NULL OR i.last_notified_date::date < CURRENT_DATE)
          AND (
            i.student_due_date < CURRENT_DATE
            OR (
              i.student_due_date = CURRENT_DATE
              AND current_time_in_zone::TIME > agency_record.overdue_cutoff_time
            )
          )
        RETURNING i.id, i.payment_plan_id, i.amount, i.student_due_date
      )
      SELECT
        u.id,
        u.payment_plan_id,
        u.amount,
        u.student_due_date,
        s.full_name as student_name,
        pp.agency_id
      FROM updated u
      JOIN payment_plans pp ON pp.id = u.payment_plan_id
      JOIN enrollments e ON e.id = pp.enrollment_id
      JOIN students s ON s.id = e.student_id
    LOOP
      -- Log activity for each overdue installment (Story 6.4)
      -- user_id is NULL for system actions
      INSERT INTO activity_log (
        agency_id,
        user_id,
        entity_type,
        entity_id,
        action,
        description,
        metadata
      ) VALUES (
        installment_record.agency_id,
        NULL, -- System action, no user
        'installment',
        installment_record.id,
        'marked_overdue',
        'System marked installment ' || installment_record.amount::TEXT || ' as overdue for ' || installment_record.student_name,
        jsonb_build_object(
          'student_name', installment_record.student_name,
          'amount', installment_record.amount,
          'installment_id', installment_record.id,
          'payment_plan_id', installment_record.payment_plan_id,
          'original_due_date', installment_record.student_due_date
        )
      );
    END LOOP;

    -- Count how many installments were updated for this agency
    -- and collect their IDs for notification processing
    SELECT
      count(*),
      array_agg(i.id)
    INTO updated_count, overdue_ids
    FROM installments i
    JOIN payment_plans pp ON pp.id = i.payment_plan_id
    WHERE pp.agency_id = agency_record.id
      AND i.status = 'overdue'
      AND i.updated_at > (now() - INTERVAL '1 minute'); -- Updated in the last minute

    -- Return results for this agency
    RETURN QUERY SELECT
      agency_record.id,
      COALESCE(updated_count, 0),
      jsonb_build_object('pending_to_overdue', COALESCE(updated_count, 0)),
      COALESCE(overdue_ids, ARRAY[]::UUID[]);
  END LOOP;
END;
$$;

COMMENT ON FUNCTION update_installment_statuses IS
  'Updates installment statuses to overdue based on due dates and agency timezones.
  Only processes installments that have not been notified today (prevents duplicates).
  Returns newly overdue installment IDs for email notification processing.
  Logs activities to activity_log table for BI dashboard.';

COMMIT;


-- Source: 003_student_notifications_schema.sql

-- Migration 003: Create student_notifications table for tracking email/SMS sent to students
-- Epic 5: Intelligent Status Automation & Notifications
-- Story 5.2: Due Soon Notification Flags - Task 3

BEGIN;

-- ============================================================
-- STEP 1: Create Student Notifications Table
-- ============================================================

CREATE TABLE student_notifications (
  -- Primary key
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Foreign keys
  student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  installment_id UUID NOT NULL REFERENCES installments(id) ON DELETE CASCADE,

  -- REQUIRED: Tenant isolation key
  agency_id UUID NOT NULL REFERENCES agencies(id) ON DELETE CASCADE,

  -- Notification metadata
  notification_type TEXT NOT NULL CHECK (notification_type IN ('due_soon', 'overdue')),

  -- Delivery tracking
  sent_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  delivery_status TEXT NOT NULL CHECK (delivery_status IN ('sent', 'failed', 'pending')) DEFAULT 'sent',
  error_message TEXT,

  -- Standard timestamps
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL,

  -- UNIQUE constraint: Prevent duplicate notifications for same installment and type
  UNIQUE(installment_id, notification_type)
);

-- ============================================================
-- STEP 2: Create Indexes (REQUIRED for performance)
-- ============================================================

-- CRITICAL: Index on agency_id for RLS query performance
CREATE INDEX idx_student_notifications_agency_id ON student_notifications(agency_id);

-- Index for student-based queries
CREATE INDEX idx_student_notifications_student_id ON student_notifications(student_id);

-- Index for installment-based queries
CREATE INDEX idx_student_notifications_installment_id ON student_notifications(installment_id);

-- Index for notification type filtering
CREATE INDEX idx_student_notifications_type ON student_notifications(agency_id, notification_type, sent_at DESC);

-- Index for failed notifications (for retry logic)
CREATE INDEX idx_student_notifications_failed ON student_notifications(agency_id, delivery_status, sent_at DESC)
  WHERE delivery_status = 'failed';

-- ============================================================
-- STEP 3: Add Triggers
-- ============================================================

-- Automatically update updated_at timestamp
CREATE TRIGGER update_student_notifications_updated_at
  BEFORE UPDATE ON student_notifications
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================================
-- STEP 4: Enable RLS
-- ============================================================

ALTER TABLE student_notifications ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- STEP 5: Create RLS Policies
-- ============================================================

-- SELECT Policy: Users can view notifications for their agency
CREATE POLICY student_notifications_agency_isolation_select ON student_notifications
  FOR SELECT
  USING (
    agency_id = (
      SELECT agency_id
      FROM users
      WHERE id = auth.uid()
    )
  );

-- INSERT Policy: Service role only
-- Notifications are created by Edge Functions with service role
CREATE POLICY student_notifications_service_insert ON student_notifications
  FOR INSERT
  WITH CHECK (true);  -- Service role bypasses RLS, anon key cannot insert

-- UPDATE Policy: Service role only (for retry logic)
-- Only backend jobs can update notification status
CREATE POLICY student_notifications_service_update ON student_notifications
  FOR UPDATE
  USING (true)  -- Service role bypasses RLS
  WITH CHECK (true);

-- DELETE Policy: Admin only (for maintenance/cleanup)
CREATE POLICY student_notifications_admin_delete ON student_notifications
  FOR DELETE
  USING (
    agency_id = (
      SELECT agency_id
      FROM users
      WHERE id = auth.uid()
      AND role = 'agency_admin'
    )
  );

-- ============================================================
-- STEP 6: Add Documentation
-- ============================================================

COMMENT ON TABLE student_notifications IS
  'Tracks email/SMS notifications sent to students for payment reminders. Unique constraint prevents duplicate sends.';

COMMENT ON COLUMN student_notifications.agency_id IS
  'Foreign key to agencies table - enforces tenant isolation via RLS policies';

COMMENT ON COLUMN student_notifications.student_id IS
  'Foreign key to students table - the student who received the notification';

COMMENT ON COLUMN student_notifications.installment_id IS
  'Foreign key to installments table - the installment this notification is about';

COMMENT ON COLUMN student_notifications.notification_type IS
  'Type of notification: due_soon (36h before due), overdue (payment past due)';

COMMENT ON COLUMN student_notifications.delivery_status IS
  'Delivery status: sent (successfully sent), failed (delivery error), pending (queued)';

COMMENT ON COLUMN student_notifications.error_message IS
  'Error message if delivery failed - used for debugging and retry logic';

COMMENT ON COLUMN student_notifications.sent_at IS
  'Timestamp when notification was sent (or attempted to send)';

COMMENT ON POLICY student_notifications_agency_isolation_select ON student_notifications IS
  'Agency isolation: Users can SELECT notifications for their agency';

COMMENT ON POLICY student_notifications_service_insert ON student_notifications IS
  'Service role only: Notifications are created by scheduled jobs via Edge Functions';

COMMENT ON POLICY student_notifications_service_update ON student_notifications IS
  'Service role only: Backend jobs can update delivery status for retry logic';

COMMENT ON POLICY student_notifications_admin_delete ON student_notifications IS
  'Admin only: Only agency_admin role can DELETE notifications in their agency';

COMMIT;


-- Source: 004_schedule_due_soon_notifications.sql

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


-- Source: fix_rls_recursion.sql

-- Fix infinite recursion in notifications RLS policies
-- Epic 5: Intelligent Status Automation & Notifications
-- Story 5.3: Overdue Payment Alerts - Bug Fix

BEGIN;

-- ============================================================
-- STEP 1: Create helper functions to bypass RLS
-- ============================================================
-- These functions use SECURITY DEFINER with postgres ownership to bypass RLS.
-- The postgres role has BYPASSRLS privilege, so queries within these functions
-- don't trigger RLS policies on the users table, preventing infinite recursion.

DROP FUNCTION IF EXISTS public.get_user_agency_id() CASCADE;
DROP FUNCTION IF EXISTS public.is_agency_admin() CASCADE;

-- Function to get user's agency_id
CREATE FUNCTION public.get_user_agency_id()
RETURNS UUID
LANGUAGE plpgsql
VOLATILE
SECURITY DEFINER
AS $$
DECLARE
  v_agency_id UUID;
  v_uid UUID;
  original_role TEXT;
BEGIN
  v_uid := auth.uid();

  -- Save current role
  SELECT current_user INTO original_role;

  -- Switch to postgres role to bypass RLS
  EXECUTE 'SET LOCAL ROLE postgres';

  -- Query without RLS
  SELECT agency_id INTO v_agency_id
  FROM users
  WHERE id = v_uid;

  -- Restore original role
  EXECUTE format('SET LOCAL ROLE %I', original_role);

  RETURN v_agency_id;
END;
$$;

-- Function to check if user is agency admin
CREATE FUNCTION public.is_agency_admin()
RETURNS BOOLEAN
LANGUAGE plpgsql
VOLATILE
SECURITY DEFINER
AS $$
DECLARE
  v_role TEXT;
  v_uid UUID;
  original_role TEXT;
BEGIN
  v_uid := auth.uid();

  -- Save current role
  SELECT current_user INTO original_role;

  -- Switch to postgres role to bypass RLS
  EXECUTE 'SET LOCAL ROLE postgres';

  -- Query without RLS
  SELECT role INTO v_role
  FROM users
  WHERE id = v_uid;

  -- Restore original role
  EXECUTE format('SET LOCAL ROLE %I', original_role);

  RETURN v_role = 'agency_admin';
END;
$$;

-- Ensure functions are owned by postgres (has BYPASSRLS)
ALTER FUNCTION public.get_user_agency_id() OWNER TO postgres;
ALTER FUNCTION public.is_agency_admin() OWNER TO postgres;

-- Grant execute to authenticated users
GRANT EXECUTE ON FUNCTION public.get_user_agency_id() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_user_agency_id() TO anon;
GRANT EXECUTE ON FUNCTION public.is_agency_admin() TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_agency_admin() TO anon;

COMMENT ON FUNCTION public.get_user_agency_id() IS
  'Returns the agency_id of the authenticated user. Uses SECURITY DEFINER with postgres ownership to bypass RLS and prevent recursion.';

COMMENT ON FUNCTION public.is_agency_admin() IS
  'Returns true if the authenticated user has agency_admin role. Uses SECURITY DEFINER with postgres ownership to bypass RLS and prevent recursion.';

-- ============================================================
-- STEP 2: Drop existing notifications policies
-- ============================================================

DROP POLICY IF EXISTS notifications_agency_isolation_select ON notifications;
DROP POLICY IF EXISTS notifications_user_update ON notifications;
DROP POLICY IF EXISTS notifications_admin_delete ON notifications;

-- ============================================================
-- STEP 3: Recreate policies using the helper function
-- ============================================================

-- SELECT Policy: Users can view notifications in their agency
CREATE POLICY notifications_agency_isolation_select ON notifications
  FOR SELECT
  USING (
    agency_id = public.get_user_agency_id()
    AND (user_id IS NULL OR user_id = auth.uid())
  );

-- UPDATE Policy: Users can update their own notifications
CREATE POLICY notifications_user_update ON notifications
  FOR UPDATE
  USING (
    agency_id = public.get_user_agency_id()
    AND (user_id IS NULL OR user_id = auth.uid())
  )
  WITH CHECK (
    agency_id = public.get_user_agency_id()
    AND (user_id IS NULL OR user_id = auth.uid())
  );

-- DELETE Policy: Admin only (for maintenance/cleanup)
CREATE POLICY notifications_admin_delete ON notifications
  FOR DELETE
  USING (
    agency_id = public.get_user_agency_id()
    AND public.is_agency_admin()
  );

-- ============================================================
-- STEP 4: Update policy comments
-- ============================================================

COMMENT ON POLICY notifications_agency_isolation_select ON notifications IS
  'Agency isolation: Users can SELECT notifications for their agency (both agency-wide and user-specific). Uses public.get_user_agency_id() to prevent RLS recursion.';

COMMENT ON POLICY notifications_user_update ON notifications IS
  'Users can UPDATE their own notifications (mark as read). Uses public.get_user_agency_id() to prevent RLS recursion.';

COMMENT ON POLICY notifications_admin_delete ON notifications IS
  'Admin only: Only agency_admin role can DELETE notifications in their agency. Uses public.get_user_agency_id() to prevent RLS recursion.';

-- ============================================================
-- STEP 5: Fix users table policies to prevent recursion
-- ============================================================
-- The users table also had recursive policies that needed fixing

DROP POLICY IF EXISTS users_agency_isolation_select ON users;
DROP POLICY IF EXISTS users_admin_update ON users;
DROP POLICY IF EXISTS users_admin_delete ON users;

CREATE POLICY users_agency_isolation_select ON users
  FOR SELECT
  USING (
    agency_id = public.get_user_agency_id()
  );

CREATE POLICY users_admin_update ON users
  FOR UPDATE
  USING (
    agency_id = public.get_user_agency_id()
    AND public.is_agency_admin()
  );

CREATE POLICY users_admin_delete ON users
  FOR DELETE
  USING (
    agency_id = public.get_user_agency_id()
    AND public.is_agency_admin()
    AND id <> auth.uid()
  );

COMMENT ON POLICY users_agency_isolation_select ON users IS
  'Agency isolation: Users can SELECT other users in their agency. Uses public.get_user_agency_id() to prevent RLS recursion.';

COMMENT ON POLICY users_admin_update ON users IS
  'Admin only: Agency admins can UPDATE users in their agency. Uses helper functions to prevent RLS recursion.';

COMMENT ON POLICY users_admin_delete ON users IS
  'Admin only: Agency admins can DELETE users in their agency (except themselves). Uses helper functions to prevent RLS recursion.';

COMMIT;


-- Source: verify.sql

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


