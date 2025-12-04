-- Migration 008: Seed master tasks list with common agency tasks
-- Epic 2: Agency & User Management
-- Story 2.2: User Invitation and Task Assignment System
-- Acceptance Criteria: AC 5
-- Task 03: Seed master tasks list with common agency tasks

BEGIN;

-- ============================================================
-- STEP 1: Insert Master Tasks
-- ============================================================

-- Insert common agency tasks that can be assigned to users
-- These tasks represent typical responsibilities in education agencies
INSERT INTO master_tasks (task_name, task_code, description) VALUES
  ('Data Entry', 'DATA_ENTRY', 'Enter student and payment plan information into the system'),
  ('Document Verification', 'DOC_VERIFY', 'Verify student documents and offer letters for accuracy and completeness'),
  ('Payment Processing', 'PAYMENT_PROC', 'Record and track payment installments, update payment status'),
  ('Student Communication', 'STUDENT_COMM', 'Communicate with students about payments, deadlines, and status updates'),
  ('College Liaison', 'COLLEGE_LIAISON', 'Coordinate with college partners on student placements and documentation'),
  ('Reporting', 'REPORTING', 'Generate and export reports for agency management and analysis')
ON CONFLICT (task_code) DO NOTHING;  -- Idempotent: skip if tasks already exist

-- ============================================================
-- STEP 2: Verify Seed Data
-- ============================================================

-- Ensure all 6 tasks were inserted
DO $$
DECLARE
  task_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO task_count FROM master_tasks;

  IF task_count < 6 THEN
    RAISE WARNING 'Expected 6 master tasks but found only %. Some tasks may not have been inserted.', task_count;
  ELSE
    RAISE NOTICE 'Successfully seeded % master tasks', task_count;
  END IF;
END $$;

COMMIT;
