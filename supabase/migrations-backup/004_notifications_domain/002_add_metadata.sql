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
