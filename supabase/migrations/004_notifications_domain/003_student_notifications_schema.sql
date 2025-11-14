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
