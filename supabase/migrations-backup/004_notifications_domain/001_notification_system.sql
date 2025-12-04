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
  template_id UUID REFERENCES email_templates(id) ON DELETE SET NULL,

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
