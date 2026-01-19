-- ============================================================
-- Migration: Add SMS Notification Support
-- Description: Extends student_notifications table to support SMS channel
-- Created: 2026-01-19
-- ============================================================

-- STEP 1: Add new columns for SMS support
-- ============================================================

-- Add channel column to distinguish between email and SMS
ALTER TABLE student_notifications
ADD COLUMN channel TEXT NOT NULL DEFAULT 'email'
CHECK (channel IN ('email', 'sms'));

-- Add recipient contact information for tracking
ALTER TABLE student_notifications
ADD COLUMN recipient_email TEXT,
ADD COLUMN recipient_phone TEXT;

-- Add provider information for delivery tracking
ALTER TABLE student_notifications
ADD COLUMN provider_name TEXT CHECK (provider_name IN ('resend', 'twilio')),
ADD COLUMN provider_message_id TEXT;

-- ============================================================
-- STEP 2: Drop old unique constraint and create new one
-- ============================================================

-- Drop the old unique constraint that only considered installment_id and notification_type
ALTER TABLE student_notifications
DROP CONSTRAINT IF EXISTS student_notifications_installment_id_notification_type_key;

-- Create new unique constraint that includes channel
-- This allows one email AND one SMS per installment/notification_type combination
ALTER TABLE student_notifications
ADD CONSTRAINT student_notifications_installment_notification_channel_unique
UNIQUE(installment_id, notification_type, channel);

-- ============================================================
-- STEP 3: Create indexes for performance
-- ============================================================

-- Index for querying SMS notifications
CREATE INDEX IF NOT EXISTS idx_student_notifications_channel
ON student_notifications(channel);

-- Composite index for checking recent sends by student and channel
CREATE INDEX IF NOT EXISTS idx_student_notifications_student_channel_sent
ON student_notifications(student_id, channel, sent_at DESC);

-- Index for provider tracking
CREATE INDEX IF NOT EXISTS idx_student_notifications_provider
ON student_notifications(provider_name, provider_message_id)
WHERE provider_message_id IS NOT NULL;

-- ============================================================
-- STEP 4: Add comments for documentation
-- ============================================================

COMMENT ON COLUMN student_notifications.channel IS 'Communication channel: email or sms';
COMMENT ON COLUMN student_notifications.recipient_email IS 'Email address where notification was sent (for audit trail)';
COMMENT ON COLUMN student_notifications.recipient_phone IS 'Phone number where SMS was sent (for audit trail)';
COMMENT ON COLUMN student_notifications.provider_name IS 'Service provider used: resend for email, twilio for SMS';
COMMENT ON COLUMN student_notifications.provider_message_id IS 'Provider-specific message ID for delivery tracking';
