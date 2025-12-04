-- Migration 005: Extend payment_plans table for flexible installment structures
-- Epic 4: Payment Management & Tracking
-- Story 4.2: Flexible Installment Structure
-- Task 2: Database Schema - Payment Plans Extensions

-- ============================================================
-- PREREQUISITES
-- ============================================================
-- This migration requires:
-- - payment_plans table (from 003_payments_domain/001_payment_plans_schema.sql)
--
-- This migration extends the payment_plans table with:
-- - Initial payment tracking (separate from installments)
-- - Non-commissionable fees (materials, admin, other)
-- - Dual timeline configuration (college vs student due dates)
-- - Installment configuration (number, frequency)
-- - GST handling preferences

BEGIN;

-- ============================================================
-- STEP 1: Add Initial Payment Tracking Columns
-- ============================================================
-- Tracks upfront payment separate from regular installments

ALTER TABLE payment_plans
  ADD COLUMN initial_payment_amount DECIMAL(12,2),
  ADD COLUMN initial_payment_due_date DATE,
  ADD COLUMN initial_payment_paid BOOLEAN DEFAULT false;

-- ============================================================
-- STEP 2: Add Non-Commissionable Fee Columns
-- ============================================================
-- These fees are excluded from commission calculation

ALTER TABLE payment_plans
  ADD COLUMN materials_cost DECIMAL(12,2) DEFAULT 0 NOT NULL,
  ADD COLUMN admin_fees DECIMAL(12,2) DEFAULT 0 NOT NULL,
  ADD COLUMN other_fees DECIMAL(12,2) DEFAULT 0 NOT NULL;

-- ============================================================
-- STEP 3: Add Dual Timeline Configuration Columns
-- ============================================================
-- Enables cash flow management: students pay before agency pays college

ALTER TABLE payment_plans
  ADD COLUMN first_college_due_date DATE,
  ADD COLUMN student_lead_time_days INTEGER;

-- ============================================================
-- STEP 4: Add GST Configuration Column
-- ============================================================
-- Indicates whether amounts already include GST (affects commission calculation)

ALTER TABLE payment_plans
  ADD COLUMN gst_inclusive BOOLEAN DEFAULT true NOT NULL;

-- ============================================================
-- STEP 5: Add Installment Configuration Columns
-- ============================================================
-- Defines the installment structure

ALTER TABLE payment_plans
  ADD COLUMN number_of_installments INTEGER,
  ADD COLUMN payment_frequency TEXT;

-- ============================================================
-- STEP 6: Add CHECK Constraints for Data Validation
-- ============================================================

-- Ensure initial payment amount is non-negative (if provided)
ALTER TABLE payment_plans
  ADD CONSTRAINT chk_initial_payment_amount_non_negative
  CHECK (initial_payment_amount IS NULL OR initial_payment_amount >= 0);

-- Ensure non-commissionable fees are non-negative
ALTER TABLE payment_plans
  ADD CONSTRAINT chk_materials_cost_non_negative
  CHECK (materials_cost >= 0);

ALTER TABLE payment_plans
  ADD CONSTRAINT chk_admin_fees_non_negative
  CHECK (admin_fees >= 0);

ALTER TABLE payment_plans
  ADD CONSTRAINT chk_other_fees_non_negative
  CHECK (other_fees >= 0);

-- Ensure student lead time is non-negative (if provided)
ALTER TABLE payment_plans
  ADD CONSTRAINT chk_student_lead_time_non_negative
  CHECK (student_lead_time_days IS NULL OR student_lead_time_days >= 0);

-- Ensure number of installments is positive (if provided)
ALTER TABLE payment_plans
  ADD CONSTRAINT chk_number_of_installments_positive
  CHECK (number_of_installments IS NULL OR number_of_installments > 0);

-- Ensure payment frequency is valid
ALTER TABLE payment_plans
  ADD CONSTRAINT chk_payment_frequency_valid
  CHECK (payment_frequency IS NULL OR payment_frequency IN ('monthly', 'quarterly', 'custom'));

-- ============================================================
-- STEP 7: Update Existing Payment Plans with Default Values
-- ============================================================
-- Ensures backward compatibility for existing records

UPDATE payment_plans
SET
  materials_cost = COALESCE(materials_cost, 0),
  admin_fees = COALESCE(admin_fees, 0),
  other_fees = COALESCE(other_fees, 0),
  gst_inclusive = COALESCE(gst_inclusive, true)
WHERE
  materials_cost IS NULL
  OR admin_fees IS NULL
  OR other_fees IS NULL
  OR gst_inclusive IS NULL;

-- ============================================================
-- STEP 8: Add Column Comments for Documentation
-- ============================================================

-- Initial Payment Tracking
COMMENT ON COLUMN payment_plans.initial_payment_amount IS
  'Amount paid upfront (separate from regular installments). Optional field for plans with an initial deposit or down payment.';

COMMENT ON COLUMN payment_plans.initial_payment_due_date IS
  'Due date for the initial payment. Used when initial_payment_amount is specified.';

COMMENT ON COLUMN payment_plans.initial_payment_paid IS
  'Indicates whether the initial payment has been received. Defaults to false.';

-- Non-Commissionable Fees
COMMENT ON COLUMN payment_plans.materials_cost IS
  'Cost of course materials, books, and supplies. Excluded from commission calculation. Defaults to 0.';

COMMENT ON COLUMN payment_plans.admin_fees IS
  'Administrative or enrollment fees charged separately. Excluded from commission calculation. Defaults to 0.';

COMMENT ON COLUMN payment_plans.other_fees IS
  'Miscellaneous fees not included in other categories. Excluded from commission calculation. Defaults to 0.';

-- Timeline Configuration
COMMENT ON COLUMN payment_plans.first_college_due_date IS
  'First date when the agency must pay the college/institution. Used to calculate student payment deadlines based on lead time.';

COMMENT ON COLUMN payment_plans.student_lead_time_days IS
  'Buffer days before college due date for student payment collection. Formula: student_due_date = college_due_date - lead_time_days. Enables cash flow management.';

-- GST Configuration
COMMENT ON COLUMN payment_plans.gst_inclusive IS
  'Indicates whether amounts (total_amount, fees) already include GST/sales tax. If false, commission is calculated on GST-exclusive base. Defaults to true.';

-- Installment Configuration
COMMENT ON COLUMN payment_plans.number_of_installments IS
  'Number of regular installment payments (excluding initial payment if applicable). Used for automatic installment generation.';

COMMENT ON COLUMN payment_plans.payment_frequency IS
  'Frequency of installment payments. Values: ''monthly'' (every 1 month), ''quarterly'' (every 3 months), ''custom'' (manually configured dates).';

-- ============================================================
-- STEP 9: Add Composite Index for Common Query Patterns
-- ============================================================
-- Improves performance for queries filtering by status and timeline

CREATE INDEX idx_payment_plans_timeline ON payment_plans(agency_id, first_college_due_date)
  WHERE first_college_due_date IS NOT NULL;

COMMENT ON INDEX idx_payment_plans_timeline IS
  'Optimizes queries filtering by agency and college due date for cash flow and payment scheduling reports';

COMMIT;
