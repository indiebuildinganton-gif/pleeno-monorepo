-- Migration 003: Add 'report' entity type and 'exported' action to activity_log
-- Epic: 7 - Enhanced Reporting Module
-- Story: 7.3 - PDF Export Functionality
-- Task: 8 - Add Export Tracking

BEGIN;

-- ============================================================
-- STEP 1: Drop existing constraints
-- ============================================================

ALTER TABLE activity_log DROP CONSTRAINT IF EXISTS valid_entity_type;
ALTER TABLE activity_log DROP CONSTRAINT IF EXISTS valid_action;

-- ============================================================
-- STEP 2: Add updated constraints with 'report' and 'exported'
-- ============================================================

-- Add 'report' to valid entity types
ALTER TABLE activity_log ADD CONSTRAINT valid_entity_type CHECK (
  entity_type IN ('payment', 'payment_plan', 'student', 'enrollment', 'installment', 'report')
);

-- Add 'exported' to valid actions
ALTER TABLE activity_log ADD CONSTRAINT valid_action CHECK (
  action IN ('created', 'recorded', 'updated', 'marked_overdue', 'deleted', 'exported')
);

-- ============================================================
-- STEP 3: Add documentation
-- ============================================================

COMMENT ON CONSTRAINT valid_entity_type ON activity_log IS
  'Valid entity types: payment, payment_plan, student, enrollment, installment, report';

COMMENT ON CONSTRAINT valid_action ON activity_log IS
  'Valid actions: created, recorded, updated, marked_overdue, deleted, exported';

COMMIT;
