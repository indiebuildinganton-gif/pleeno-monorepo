-- Migration 008: Add wizard-specific fields to payment_plans table
-- Epic 4: Payment Management & Tracking
-- Story 4.2: Flexible Installment Structure
-- Task 9: Payment Plan Creation with Installments
--
-- This migration adds fields needed for wizard-based payment plan creation
-- without requiring a pre-existing enrollment record.

BEGIN;

-- ============================================================
-- STEP 1: Make enrollment_id nullable
-- ============================================================
-- Payment plans can now be created either from an enrollment OR directly via wizard

ALTER TABLE payment_plans
  ALTER COLUMN enrollment_id DROP NOT NULL;

COMMENT ON COLUMN payment_plans.enrollment_id IS
  'Foreign key to enrollments table - links payment plan to student enrollment. Optional for wizard-created plans. ON DELETE RESTRICT prevents deletion if enrollments exist.';

-- ============================================================
-- STEP 2: Add student_id column (for wizard-based payment plans)
-- ============================================================

ALTER TABLE payment_plans
  ADD COLUMN student_id UUID REFERENCES students(id) ON DELETE RESTRICT;

CREATE INDEX idx_payment_plans_student_id ON payment_plans(student_id);

COMMENT ON COLUMN payment_plans.student_id IS
  'Foreign key to students table - for payment plans created directly via wizard without enrollment. Either student_id OR enrollment_id must be present.';

-- ============================================================
-- STEP 3: Add course information columns
-- ============================================================

ALTER TABLE payment_plans
  ADD COLUMN course_name TEXT,
  ADD COLUMN course_start_date DATE,
  ADD COLUMN course_end_date DATE;

COMMENT ON COLUMN payment_plans.course_name IS
  'Name of the course/program. Required for wizard-created plans, optional for enrollment-based plans.';

COMMENT ON COLUMN payment_plans.course_start_date IS
  'Course/program start date. Used for wizard-created payment plans.';

COMMENT ON COLUMN payment_plans.course_end_date IS
  'Course/program end date. Used for wizard-created payment plans.';

-- ============================================================
-- STEP 4: Add commission_rate column (decimal 0-1)
-- ============================================================

ALTER TABLE payment_plans
  ADD COLUMN commission_rate DECIMAL(5,4) CHECK (commission_rate >= 0 AND commission_rate <= 1);

COMMENT ON COLUMN payment_plans.commission_rate IS
  'Commission rate as a decimal (0-1, e.g., 0.15 for 15%). Alternative to commission_rate_percent for wizard-created plans.';

-- ============================================================
-- STEP 5: Add CHECK constraint to ensure either enrollment_id OR student_id
-- ============================================================

ALTER TABLE payment_plans
  ADD CONSTRAINT chk_enrollment_or_student
  CHECK (
    (enrollment_id IS NOT NULL AND student_id IS NULL) OR
    (enrollment_id IS NULL AND student_id IS NOT NULL) OR
    (enrollment_id IS NOT NULL AND student_id IS NOT NULL)
  );

COMMENT ON CONSTRAINT chk_enrollment_or_student ON payment_plans IS
  'Ensures at least one of enrollment_id or student_id is present. Both can be present for enrollment-linked wizard plans.';

-- ============================================================
-- STEP 6: Add CHECK constraint for course dates
-- ============================================================

ALTER TABLE payment_plans
  ADD CONSTRAINT chk_course_dates_valid
  CHECK (
    (course_start_date IS NULL AND course_end_date IS NULL) OR
    (course_start_date IS NOT NULL AND course_end_date IS NOT NULL AND course_end_date > course_start_date)
  );

COMMENT ON CONSTRAINT chk_course_dates_valid ON payment_plans IS
  'Ensures course_end_date is after course_start_date when both are provided.';

COMMIT;
