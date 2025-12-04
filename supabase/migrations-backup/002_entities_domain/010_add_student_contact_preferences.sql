-- Migration 010: Add student contact preferences for notifications
-- Epic 5: Intelligent Status Automation & Notifications
-- Story 5.2: Due Soon Notification Flags - Task 3

BEGIN;

-- ============================================================
-- STEP 1: Add contact_preference column
-- ============================================================

ALTER TABLE students ADD COLUMN contact_preference TEXT
  CHECK (contact_preference IN ('email', 'sms', 'both')) DEFAULT 'email';

-- ============================================================
-- STEP 2: Add index for notification queries
-- ============================================================

-- Index for filtering students by contact preference
CREATE INDEX idx_students_contact_preference ON students(agency_id, contact_preference)
  WHERE contact_preference IS NOT NULL;

-- ============================================================
-- STEP 3: Add Documentation
-- ============================================================

COMMENT ON COLUMN students.contact_preference IS
  'Student preferred contact method for notifications: email, sms, or both. Defaults to email.';

COMMIT;
