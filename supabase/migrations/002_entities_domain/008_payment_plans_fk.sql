-- Migration 008: Add enrollment_id foreign key to payment_plans table
-- Epic 3: Core Entity Management
-- Story 3.3: Student-College Enrollment Linking
--
-- This migration links payment plans to enrollments, establishing a 1:1 relationship
-- where each payment plan is associated with a single enrollment record.

BEGIN;

-- ============================================================
-- STEP 1: Add enrollment_id Column
-- ============================================================

-- Add enrollment_id as a foreign key to the enrollments table
-- NOT NULL constraint ensures every payment plan is linked to an enrollment
ALTER TABLE payment_plans
  ADD COLUMN enrollment_id UUID NOT NULL REFERENCES enrollments(id) ON DELETE CASCADE;

-- ============================================================
-- STEP 2: Create Index for Performance
-- ============================================================

-- Index on enrollment_id for efficient lookups
-- (e.g., finding all payment plans for a given enrollment)
CREATE INDEX idx_payment_plans_enrollment_id ON payment_plans(enrollment_id);

-- ============================================================
-- STEP 3: Add Optional Unique Constraint
-- ============================================================

-- OPTIONAL: Uncomment the following line if you want to enforce a strict 1:1 relationship
-- (i.e., each enrollment can have at most one payment plan)
--
-- ALTER TABLE payment_plans
--   ADD CONSTRAINT unique_enrollment_payment_plan UNIQUE (enrollment_id);
--
-- NOTE: Based on Story 3.3 AC3, a student can have "multiple payment plans for the same
-- college/branch (e.g., different courses)", which suggests multiple payment plans per
-- enrollment might be needed. However, if the design intent is one payment plan per
-- enrollment (with multiple installments within that plan), then uncomment the above constraint.

-- ============================================================
-- STEP 4: Add Documentation
-- ============================================================

COMMENT ON COLUMN payment_plans.enrollment_id IS
  'Foreign key to enrollments table - links this payment plan to a specific student-branch-program enrollment. Each payment plan must be associated with an enrollment record.';

COMMIT;
