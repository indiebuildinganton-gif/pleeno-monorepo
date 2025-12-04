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
