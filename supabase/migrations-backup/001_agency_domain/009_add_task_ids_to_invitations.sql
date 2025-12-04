-- Migration 009: Add task_ids to invitations table
-- Epic 2: Agency & User Management
-- Story 2.2: User Invitation and Task Assignment System
-- Task 11: Display pending invitations in user management

-- Add task_ids column to store assigned task IDs with invitation
-- This allows us to:
-- 1. Display assigned tasks in pending invitations list
-- 2. Resend invitation emails with the same task assignments
-- 3. Maintain consistency between original invitation and resent invitations

BEGIN;

-- Add task_ids column as JSONB to store array of task UUIDs
ALTER TABLE invitations
ADD COLUMN task_ids JSONB DEFAULT '[]'::jsonb;

-- Add comment explaining the column
COMMENT ON COLUMN invitations.task_ids IS 'JSON array of task UUIDs assigned in this invitation. Used to display assigned tasks and resend invitations with same tasks.';

-- Add index for querying invitations by task_ids (GIN index for JSONB)
CREATE INDEX idx_invitations_task_ids ON invitations USING gin(task_ids);

COMMIT;
