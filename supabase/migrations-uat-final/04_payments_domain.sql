-- ======================================
-- Migration 4: Payments Domain - Payment Plans and Installments
-- ======================================

BEGIN;

-- Combining payments domain migrations...

-- Source: 001_payment_plans_schema.sql

-- Migration 001: Create payment_plans table with RLS
-- Epic 4: Payment Management & Tracking
-- Story 4.1: Payment Plan Creation
-- Task 1: Database Schema Implementation

-- ============================================================
-- PREREQUISITES
-- ============================================================
-- This migration requires:
-- - agencies table (from 001_agency_domain/001_agencies_schema.sql)
-- - enrollments table (from Story 3.3 - must exist before running this migration)
-- - update_updated_at_column() function (from 001_agency_domain/001_agencies_schema.sql)

BEGIN;

-- ============================================================
-- STEP 1: Create Enum Type for Payment Plan Status
-- ============================================================

CREATE TYPE payment_plan_status AS ENUM ('active', 'completed', 'cancelled');

COMMENT ON TYPE payment_plan_status IS
  'Status values for payment plans: active (plan is current), completed (all payments received), cancelled (plan terminated)';

-- ============================================================
-- STEP 2: Create payment_plans Table
-- ============================================================

CREATE TABLE payment_plans (
  -- Primary key
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Foreign keys
  enrollment_id UUID NOT NULL REFERENCES enrollments(id) ON DELETE CASCADE,
  agency_id UUID NOT NULL REFERENCES agencies(id) ON DELETE CASCADE,

  -- Financial details
  total_amount DECIMAL(12,2) NOT NULL CHECK (total_amount >= 0),
  currency TEXT NOT NULL DEFAULT 'AUD',
  commission_rate_percent DECIMAL(5,2) NOT NULL CHECK (commission_rate_percent >= 0 AND commission_rate_percent <= 100),
  expected_commission DECIMAL(12,2),

  -- Timeline
  start_date DATE NOT NULL,

  -- Status and metadata
  status payment_plan_status DEFAULT 'active' NOT NULL,
  notes TEXT,
  reference_number TEXT,

  -- Standard timestamps
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- ============================================================
-- STEP 3: Create Trigger for Automatic Commission Calculation
-- ============================================================

-- Trigger function to calculate expected_commission
CREATE OR REPLACE FUNCTION calculate_payment_plan_commission()
RETURNS TRIGGER AS $$
BEGIN
  -- Calculate expected commission: total_amount * (commission_rate_percent / 100)
  NEW.expected_commission := ROUND(NEW.total_amount * (NEW.commission_rate_percent / 100), 2);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION calculate_payment_plan_commission() IS
  'Automatically calculates expected_commission based on total_amount and commission_rate_percent';

-- Trigger on INSERT and UPDATE
CREATE TRIGGER calculate_commission_on_insert_update
  BEFORE INSERT OR UPDATE OF total_amount, commission_rate_percent ON payment_plans
  FOR EACH ROW
  EXECUTE FUNCTION calculate_payment_plan_commission();

COMMENT ON TRIGGER calculate_commission_on_insert_update ON payment_plans IS
  'Recalculates expected_commission whenever total_amount or commission_rate_percent changes';

-- ============================================================
-- STEP 4: Create Trigger for Default Currency from Agency
-- ============================================================

-- Trigger function to set default currency from agency
CREATE OR REPLACE FUNCTION set_payment_plan_default_currency()
RETURNS TRIGGER AS $$
BEGIN
  -- If currency is not explicitly set or is the default 'AUD', get it from the agency
  IF NEW.currency = 'AUD' OR NEW.currency IS NULL THEN
    SELECT currency INTO NEW.currency
    FROM agencies
    WHERE id = NEW.agency_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION set_payment_plan_default_currency() IS
  'Sets currency from agency configuration if not explicitly provided';

-- Trigger to set default currency on INSERT
CREATE TRIGGER set_default_currency_on_insert
  BEFORE INSERT ON payment_plans
  FOR EACH ROW
  EXECUTE FUNCTION set_payment_plan_default_currency();

COMMENT ON TRIGGER set_default_currency_on_insert ON payment_plans IS
  'Inherits currency from agency table on payment plan creation';

-- ============================================================
-- STEP 5: Add Standard Updated_at Trigger
-- ============================================================

-- Automatically update updated_at timestamp
CREATE TRIGGER update_payment_plans_updated_at
  BEFORE UPDATE ON payment_plans
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================================
-- STEP 6: Create Performance Indexes
-- ============================================================

-- CRITICAL: Composite index on agency_id and status for filtered queries
CREATE INDEX idx_payment_plans_agency_status ON payment_plans(agency_id, status);

-- Index on enrollment_id for join performance
CREATE INDEX idx_payment_plans_enrollment_id ON payment_plans(enrollment_id);

-- Index on reference_number for lookups
CREATE INDEX idx_payment_plans_reference_number ON payment_plans(reference_number)
  WHERE reference_number IS NOT NULL;

-- Index on start_date for date range queries
CREATE INDEX idx_payment_plans_start_date ON payment_plans(agency_id, start_date);

-- ============================================================
-- STEP 7: Enable Row Level Security
-- ============================================================

ALTER TABLE payment_plans ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- STEP 8: Create RLS Policies for Agency Isolation
-- ============================================================

-- SELECT Policy: Users can only view payment plans for their agency
CREATE POLICY payment_plans_agency_isolation_select ON payment_plans
  FOR SELECT
  USING (
    agency_id = (
      SELECT agency_id
      FROM users
      WHERE id = auth.uid()
    )
  );

COMMENT ON POLICY payment_plans_agency_isolation_select ON payment_plans IS
  'Agency isolation: Users can only SELECT payment plans belonging to their agency';

-- INSERT Policy: Users can only create payment plans for their agency
CREATE POLICY payment_plans_agency_isolation_insert ON payment_plans
  FOR INSERT
  WITH CHECK (
    agency_id = (
      SELECT agency_id
      FROM users
      WHERE id = auth.uid()
    )
  );

COMMENT ON POLICY payment_plans_agency_isolation_insert ON payment_plans IS
  'Agency isolation: Users can only INSERT payment plans for their agency';

-- UPDATE Policy: Users can only update payment plans for their agency
CREATE POLICY payment_plans_agency_isolation_update ON payment_plans
  FOR UPDATE
  USING (
    agency_id = (
      SELECT agency_id
      FROM users
      WHERE id = auth.uid()
    )
  )
  WITH CHECK (
    agency_id = (
      SELECT agency_id
      FROM users
      WHERE id = auth.uid()
    )
  );

COMMENT ON POLICY payment_plans_agency_isolation_update ON payment_plans IS
  'Agency isolation: Users can only UPDATE payment plans belonging to their agency';

-- DELETE Policy: Users can only delete payment plans for their agency
CREATE POLICY payment_plans_agency_isolation_delete ON payment_plans
  FOR DELETE
  USING (
    agency_id = (
      SELECT agency_id
      FROM users
      WHERE id = auth.uid()
    )
  );

COMMENT ON POLICY payment_plans_agency_isolation_delete ON payment_plans IS
  'Agency isolation: Users can only DELETE payment plans belonging to their agency';

-- ============================================================
-- STEP 9: Add Table and Column Documentation
-- ============================================================

COMMENT ON TABLE payment_plans IS
  'Payment plans track the financial arrangements for student enrollments including total amount, commission rates, and payment schedules. Multi-tenant isolation enforced via RLS policies on agency_id.';

COMMENT ON COLUMN payment_plans.id IS
  'Primary key - unique identifier for the payment plan';

COMMENT ON COLUMN payment_plans.enrollment_id IS
  'Foreign key to enrollments table - links payment plan to student enrollment. ON DELETE RESTRICT prevents deletion if enrollments exist.';

COMMENT ON COLUMN payment_plans.agency_id IS
  'Foreign key to agencies table - enforces tenant isolation via RLS policies. ON DELETE CASCADE removes payment plans when agency is deleted.';

COMMENT ON COLUMN payment_plans.total_amount IS
  'Total course/program value in the specified currency. Must be >= 0.';

COMMENT ON COLUMN payment_plans.currency IS
  'ISO 4217 currency code (e.g., AUD, USD, EUR). Defaults to agency currency if not specified.';

COMMENT ON COLUMN payment_plans.commission_rate_percent IS
  'Commission rate as a percentage (0-100). Supports up to 2 decimal places (e.g., 15.50 for 15.5%).';

COMMENT ON COLUMN payment_plans.expected_commission IS
  'Calculated commission amount: total_amount * (commission_rate_percent / 100). Automatically calculated by trigger.';

COMMENT ON COLUMN payment_plans.start_date IS
  'Payment plan start date (typically course/program start date)';

COMMENT ON COLUMN payment_plans.status IS
  'Payment plan status: active (current), completed (all payments received), cancelled (plan terminated)';

COMMENT ON COLUMN payment_plans.notes IS
  'Optional notes about the payment plan';

COMMENT ON COLUMN payment_plans.reference_number IS
  'Optional external reference number for tracking';

COMMENT ON COLUMN payment_plans.created_at IS
  'Timestamp when payment plan was created (UTC)';

COMMENT ON COLUMN payment_plans.updated_at IS
  'Timestamp when payment plan was last updated (UTC). Automatically updated by trigger.';

COMMIT;


-- Source: 002_payment_plans_triggers.sql

-- Migration 002: Commission Calculation Function
-- Epic 4: Payment Management & Tracking
-- Story 4.1: Payment Plan Creation
-- Task 2: Commission Calculation Function

-- ============================================================
-- STANDALONE COMMISSION CALCULATION FUNCTION
-- ============================================================
-- This function can be called directly from application code
-- or used in queries for commission preview calculations.
-- The payment_plans table already has a trigger that automatically
-- updates the expected_commission column, but this function allows
-- for standalone calculations without inserting/updating rows.

CREATE OR REPLACE FUNCTION calculate_expected_commission(
  total_amount DECIMAL,
  commission_rate_percent DECIMAL
) RETURNS DECIMAL AS $$
BEGIN
  -- Handle NULL values by returning 0
  IF total_amount IS NULL OR commission_rate_percent IS NULL THEN
    RETURN 0;
  END IF;

  -- Handle negative values
  IF total_amount < 0 OR commission_rate_percent < 0 THEN
    RETURN 0;
  END IF;

  -- Calculate and return commission rounded to 2 decimal places
  -- Formula: expected_commission = total_amount * (commission_rate_percent / 100)
  RETURN ROUND(total_amount * (commission_rate_percent / 100), 2);
END;
$$ LANGUAGE plpgsql IMMUTABLE;

COMMENT ON FUNCTION calculate_expected_commission(DECIMAL, DECIMAL) IS
  'Calculates expected commission from total amount and commission rate percentage. Returns result rounded to 2 decimal places. Handles NULL and negative values by returning 0. Can be used for preview calculations or in queries.';


-- Source: 003_audit_logs_metadata.sql

-- Migration 003: Add metadata column to audit_logs table
-- Epic 4: Payments Domain
-- Story 4.1: Payment Plan Creation
-- Task 09: Audit Logging
--
-- This migration adds a metadata column to the audit_logs table to support
-- additional context such as commission calculation parameters and enrollment details.
--
-- The metadata column stores supplementary information that helps with:
-- - Transparency: Commission calculation formulas and parameters
-- - Context: Enrollment details (student, college, program)
-- - Compliance: Additional audit trail information
-- - Troubleshooting: Extra context for debugging issues

BEGIN;

-- ============================================================================
-- Add metadata column to audit_logs table
-- ============================================================================

-- Add metadata column if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'audit_logs'
    AND column_name = 'metadata'
  ) THEN
    ALTER TABLE audit_logs ADD COLUMN metadata JSONB;
  END IF;
END $$;

-- Add comment explaining the purpose of the metadata column
COMMENT ON COLUMN audit_logs.metadata IS 'Additional context for the audit entry (e.g., commission calculations, enrollment details, system information)';

-- ============================================================================
-- Create index for metadata queries (optional but recommended)
-- ============================================================================

-- Create GIN index on metadata column for efficient JSONB queries
-- This allows fast lookups like: WHERE metadata @> '{"commission_calculation": {}}'
CREATE INDEX IF NOT EXISTS idx_audit_logs_metadata
  ON audit_logs USING GIN (metadata);

COMMENT ON INDEX idx_audit_logs_metadata IS 'GIN index for efficient JSONB queries on audit log metadata';

-- ============================================================================
-- Example metadata structures for documentation
-- ============================================================================

COMMENT ON TABLE audit_logs IS 'Immutable audit trail for all entity changes across the system

Example metadata structures:

1. Payment Plan Creation:
{
  "commission_calculation": {
    "formula": "total_amount * (commission_rate_percent / 100)",
    "total_amount": 10000,
    "commission_rate_percent": 15,
    "expected_commission": 1500
  },
  "enrollment": {
    "enrollment_id": "uuid",
    "student_name": "John Doe",
    "college_name": "University of Sydney",
    "branch_city": "Sydney",
    "program_name": "Master of Business Administration"
  }
}

2. Other entities can add their own metadata structures as needed
';

COMMIT;


-- Source: 004_installments_schema.sql

-- Migration 004: Create installments table with RLS
-- Epic 4: Payment Management & Tracking
-- Story 4.2: Flexible Installment Structure
-- Task 1: Database Schema - Installments Table

-- ============================================================
-- PREREQUISITES
-- ============================================================
-- This migration requires:
-- - agencies table (from 001_agency_domain/001_agencies_schema.sql)
-- - payment_plans table (from 003_payments_domain/001_payment_plans_schema.sql)
-- - update_updated_at_column() function (from 001_agency_domain/001_agencies_schema.sql)

BEGIN;

-- ============================================================
-- STEP 1: Create Enum Type for Installment Status
-- ============================================================

CREATE TYPE installment_status AS ENUM ('draft', 'pending', 'paid', 'overdue', 'cancelled');

COMMENT ON TYPE installment_status IS
  'Status values for installments: draft (not yet active), pending (awaiting payment), paid (payment received), overdue (past due date), cancelled (installment cancelled)';

-- ============================================================
-- STEP 2: Create installments Table
-- ============================================================

CREATE TABLE installments (
  -- Primary key
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Foreign keys
  payment_plan_id UUID NOT NULL REFERENCES payment_plans(id) ON DELETE CASCADE,
  agency_id UUID NOT NULL REFERENCES agencies(id) ON DELETE CASCADE,

  -- Installment identification
  installment_number INTEGER NOT NULL CHECK (installment_number >= 0),
  is_initial_payment BOOLEAN NOT NULL DEFAULT false,

  -- Financial details
  amount DECIMAL(12,2) NOT NULL CHECK (amount > 0),
  generates_commission BOOLEAN NOT NULL DEFAULT true,

  -- Timeline - dual timeline pattern
  student_due_date DATE,
  college_due_date DATE,

  -- Status tracking
  status installment_status DEFAULT 'draft' NOT NULL,

  -- Payment tracking
  paid_date DATE,
  paid_amount DECIMAL(12,2) CHECK (paid_amount >= 0),

  -- Standard timestamps
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL,

  -- Business logic constraints
  CONSTRAINT valid_paid_amount CHECK (
    (status = 'paid' AND paid_amount IS NOT NULL AND paid_date IS NOT NULL) OR
    (status != 'paid' AND (paid_amount IS NULL OR paid_amount = 0))
  )
);

-- ============================================================
-- STEP 3: Add Standard Updated_at Trigger
-- ============================================================

-- Automatically update updated_at timestamp
CREATE TRIGGER update_installments_updated_at
  BEFORE UPDATE ON installments
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================================
-- STEP 4: Create Performance Indexes
-- ============================================================

-- CRITICAL: Composite index on payment_plan_id and installment_number for efficient queries
CREATE INDEX idx_installments_plan_number ON installments(payment_plan_id, installment_number);

-- Index on agency_id and status for dashboard queries
CREATE INDEX idx_installments_agency_status ON installments(agency_id, status);

-- Index on payment_plan_id for join performance
CREATE INDEX idx_installments_payment_plan_id ON installments(payment_plan_id);

-- Index on due dates for overdue detection queries
CREATE INDEX idx_installments_student_due_date ON installments(student_due_date)
  WHERE status IN ('pending', 'overdue');

CREATE INDEX idx_installments_college_due_date ON installments(college_due_date)
  WHERE status IN ('pending', 'overdue');

-- ============================================================
-- STEP 5: Enable Row Level Security
-- ============================================================

ALTER TABLE installments ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- STEP 6: Create RLS Policies for Agency Isolation
-- ============================================================

-- SELECT Policy: Users can only view installments for their agency
CREATE POLICY installments_agency_isolation_select ON installments
  FOR SELECT
  USING (
    agency_id = (
      SELECT agency_id
      FROM users
      WHERE id = auth.uid()
    )
  );

COMMENT ON POLICY installments_agency_isolation_select ON installments IS
  'Agency isolation: Users can only SELECT installments belonging to their agency';

-- INSERT Policy: Users can only create installments for their agency
CREATE POLICY installments_agency_isolation_insert ON installments
  FOR INSERT
  WITH CHECK (
    agency_id = (
      SELECT agency_id
      FROM users
      WHERE id = auth.uid()
    )
  );

COMMENT ON POLICY installments_agency_isolation_insert ON installments IS
  'Agency isolation: Users can only INSERT installments for their agency';

-- UPDATE Policy: Users can only update installments for their agency
CREATE POLICY installments_agency_isolation_update ON installments
  FOR UPDATE
  USING (
    agency_id = (
      SELECT agency_id
      FROM users
      WHERE id = auth.uid()
    )
  )
  WITH CHECK (
    agency_id = (
      SELECT agency_id
      FROM users
      WHERE id = auth.uid()
    )
  );

COMMENT ON POLICY installments_agency_isolation_update ON installments IS
  'Agency isolation: Users can only UPDATE installments belonging to their agency';

-- DELETE Policy: Users can only delete installments for their agency
CREATE POLICY installments_agency_isolation_delete ON installments
  FOR DELETE
  USING (
    agency_id = (
      SELECT agency_id
      FROM users
      WHERE id = auth.uid()
    )
  );

COMMENT ON POLICY installments_agency_isolation_delete ON installments IS
  'Agency isolation: Users can only DELETE installments belonging to their agency';

-- ============================================================
-- STEP 7: Add Table and Column Documentation
-- ============================================================

COMMENT ON TABLE installments IS
  'Installments represent individual payment schedule items within a payment plan. Each payment plan has multiple installments including an optional initial payment (installment_number = 0) and regular installments (1..N). Multi-tenant isolation enforced via RLS policies on agency_id.';

COMMENT ON COLUMN installments.id IS
  'Primary key - unique identifier for the installment';

COMMENT ON COLUMN installments.payment_plan_id IS
  'Foreign key to payment_plans table - links installment to parent payment plan. ON DELETE CASCADE removes installments when payment plan is deleted.';

COMMENT ON COLUMN installments.agency_id IS
  'Foreign key to agencies table - enforces tenant isolation via RLS policies. ON DELETE CASCADE removes installments when agency is deleted.';

COMMENT ON COLUMN installments.installment_number IS
  'Sequence number for installment: 0 = initial payment, 1..N = regular installments. Must be >= 0.';

COMMENT ON COLUMN installments.is_initial_payment IS
  'Flag to identify initial payment (installment_number = 0). Used to distinguish initial payment from regular installments.';

COMMENT ON COLUMN installments.amount IS
  'Payment amount for this installment in the payment plan currency. Must be > 0.';

COMMENT ON COLUMN installments.generates_commission IS
  'Whether this installment generates commission for the agency. Typically false for initial payments, true for regular installments.';

COMMENT ON COLUMN installments.student_due_date IS
  'Date when student must pay the agency. Part of dual timeline pattern (student pays before agency pays college).';

COMMENT ON COLUMN installments.college_due_date IS
  'Date when agency must pay the college. Part of dual timeline pattern. Formula: student_due_date = college_due_date - student_lead_time_days.';

COMMENT ON COLUMN installments.status IS
  'Installment status: draft (not active), pending (awaiting payment), paid (payment received), overdue (past due date), cancelled (terminated)';

COMMENT ON COLUMN installments.paid_date IS
  'Date when payment was received. Required when status = paid, must be null otherwise.';

COMMENT ON COLUMN installments.paid_amount IS
  'Actual amount paid. Required when status = paid, should be null or 0 otherwise. Supports partial payments tracking.';

COMMENT ON COLUMN installments.created_at IS
  'Timestamp when installment was created (UTC)';

COMMENT ON COLUMN installments.updated_at IS
  'Timestamp when installment was last updated (UTC). Automatically updated by trigger.';

COMMIT;


-- Source: 005_payment_plans_extensions.sql

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


-- Source: 006_commission_calculation_functions.sql

-- Migration 006: Commission Calculation Functions
-- Epic 4: Payment Management & Tracking
-- Story 4.2: Flexible Installment Structure
-- Task 3: Commission Calculation Functions

-- ============================================================
-- PREREQUISITES
-- ============================================================
-- This migration requires:
-- - payment_plans table (from 003_payments_domain/001_payment_plans_schema.sql)
-- - payment_plans extensions (from 003_payments_domain/005_payment_plans_extensions.sql)
--
-- This migration creates:
-- - calculate_commissionable_value() function
-- - calculate_expected_commission() function (enhanced version with GST handling)

BEGIN;

-- ============================================================
-- STEP 1: Create Function to Calculate Commissionable Value
-- ============================================================
-- Calculates the portion of total course value that is eligible for commission
-- by subtracting non-commissionable fees (materials, admin, other).
--
-- Formula: Commissionable Value = Total Course Value - Materials Cost - Admin Fees - Other Fees
--
-- Example:
-- Total Course Value: $10,000
-- Materials Cost: $500
-- Admin Fees: $200
-- Other Fees: $100
-- Result: $10,000 - $500 - $200 - $100 = $9,200

CREATE OR REPLACE FUNCTION calculate_commissionable_value(
  total_course_value DECIMAL(12,2),
  materials_cost DECIMAL(12,2) DEFAULT 0,
  admin_fees DECIMAL(12,2) DEFAULT 0,
  other_fees DECIMAL(12,2) DEFAULT 0
)
RETURNS DECIMAL(12,2)
LANGUAGE plpgsql
IMMUTABLE
AS $$
BEGIN
  -- Treat NULL values as 0 for fees
  materials_cost := COALESCE(materials_cost, 0);
  admin_fees := COALESCE(admin_fees, 0);
  other_fees := COALESCE(other_fees, 0);

  -- Calculate commissionable value by subtracting all non-commissionable fees
  -- Ensure result is not negative
  RETURN GREATEST(
    total_course_value - materials_cost - admin_fees - other_fees,
    0
  );
END;
$$;

COMMENT ON FUNCTION calculate_commissionable_value(DECIMAL, DECIMAL, DECIMAL, DECIMAL) IS
  'Calculates commission-eligible value by subtracting non-commissionable fees (materials, admin, other) from total course value. NULL fee values are treated as 0. Returns 0 if result would be negative.';

-- ============================================================
-- STEP 2: Create Function to Calculate Expected Commission (Enhanced)
-- ============================================================
-- Calculates expected commission with GST handling support.
-- Replaces the simpler version from Story 4.1.
--
-- Formula:
-- If GST Inclusive:
--   base = commissionable_value
-- If GST Exclusive:
--   base = commissionable_value / 1.10  (removes 10% GST)
-- Expected Commission = base × commission_rate
--
-- Example 1: GST Inclusive
-- Commissionable Value: $9,200
-- Commission Rate: 0.15 (15%)
-- GST Inclusive: true
-- Result: $9,200 × 0.15 = $1,380.00
--
-- Example 2: GST Exclusive
-- Commissionable Value: $9,200
-- Commission Rate: 0.15 (15%)
-- GST Inclusive: false
-- Result: ($9,200 / 1.10) × 0.15 = $8,363.64 × 0.15 = $1,254.55

CREATE OR REPLACE FUNCTION calculate_expected_commission(
  commissionable_value DECIMAL(12,2),
  commission_rate DECIMAL(5,4),
  gst_inclusive BOOLEAN DEFAULT true
)
RETURNS DECIMAL(12,2)
LANGUAGE plpgsql
IMMUTABLE
AS $$
DECLARE
  base DECIMAL(12,2);
BEGIN
  -- Handle NULL or negative values
  IF commissionable_value IS NULL OR commissionable_value < 0 THEN
    RETURN 0;
  END IF;

  IF commission_rate IS NULL OR commission_rate < 0 THEN
    RETURN 0;
  END IF;

  -- Calculate base amount (with GST handling if needed)
  IF gst_inclusive THEN
    -- GST is already included, use full amount
    base := commissionable_value;
  ELSE
    -- GST is exclusive, remove 10% GST (divide by 1.10)
    base := commissionable_value / 1.10;
  END IF;

  -- Calculate commission and round to 2 decimal places
  RETURN ROUND(base * commission_rate, 2);
END;
$$;

COMMENT ON FUNCTION calculate_expected_commission(DECIMAL, DECIMAL, BOOLEAN) IS
  'Calculates expected commission with GST handling. When gst_inclusive=false, divides commissionable_value by 1.10 to remove 10% GST before calculating commission. Returns 0 for NULL or negative inputs.';

-- ============================================================
-- STEP 3: Add Commissionable Value Column to Payment Plans
-- ============================================================
-- This column will be auto-calculated by triggers (in next migration)

ALTER TABLE payment_plans
  ADD COLUMN commissionable_value DECIMAL(12,2);

COMMENT ON COLUMN payment_plans.commissionable_value IS
  'Commission-eligible value: total_amount minus non-commissionable fees (materials_cost, admin_fees, other_fees). Automatically calculated by trigger.';

-- ============================================================
-- STEP 4: Backfill Commissionable Value for Existing Records
-- ============================================================
-- Calculate commissionable_value for any existing payment plans

UPDATE payment_plans
SET commissionable_value = calculate_commissionable_value(
  total_amount,
  materials_cost,
  admin_fees,
  other_fees
);

COMMIT;


-- Source: 007_commission_calculation_triggers.sql

-- Migration 007: Commission Calculation Triggers
-- Epic 4: Payment Management & Tracking
-- Story 4.2: Flexible Installment Structure
-- Task 3: Commission Calculation Functions - Triggers

-- ============================================================
-- PREREQUISITES
-- ============================================================
-- This migration requires:
-- - payment_plans table (from 003_payments_domain/001_payment_plans_schema.sql)
-- - calculate_commissionable_value() function (from 003_payments_domain/006_commission_calculation_functions.sql)
-- - calculate_expected_commission() function (from 003_payments_domain/006_commission_calculation_functions.sql)
--
-- This migration:
-- - Replaces the existing calculate_payment_plan_commission() trigger function with enhanced version
-- - Auto-calculates commissionable_value and expected_commission on INSERT/UPDATE
-- - Handles GST inclusive/exclusive scenarios

BEGIN;

-- ============================================================
-- STEP 1: Drop Existing Trigger (from Story 4.1)
-- ============================================================
-- Remove the old trigger that only calculated expected_commission
-- We'll replace it with an enhanced version that calculates both
-- commissionable_value and expected_commission with GST handling

DROP TRIGGER IF EXISTS calculate_commission_on_insert_update ON payment_plans;

-- ============================================================
-- STEP 2: Create Enhanced Trigger Function
-- ============================================================
-- This function automatically calculates:
-- 1. commissionable_value (total minus non-commissionable fees)
-- 2. expected_commission (with GST handling)
--
-- It fires BEFORE INSERT OR UPDATE on payment_plans

CREATE OR REPLACE FUNCTION update_payment_plan_commissions()
RETURNS TRIGGER AS $$
DECLARE
  calculated_commissionable_value DECIMAL(12,2);
  rate_as_decimal DECIMAL(5,4);
BEGIN
  -- Calculate commissionable value (total_amount minus non-commissionable fees)
  calculated_commissionable_value := calculate_commissionable_value(
    NEW.total_amount,
    NEW.materials_cost,
    NEW.admin_fees,
    NEW.other_fees
  );

  -- Set commissionable_value on the NEW record
  NEW.commissionable_value := calculated_commissionable_value;

  -- Convert commission_rate_percent (e.g., 15.00) to decimal rate (e.g., 0.15)
  rate_as_decimal := NEW.commission_rate_percent / 100;

  -- Calculate expected commission with GST handling
  NEW.expected_commission := calculate_expected_commission(
    calculated_commissionable_value,
    rate_as_decimal,
    NEW.gst_inclusive
  );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION update_payment_plan_commissions() IS
  'Automatically calculates commissionable_value and expected_commission based on total_amount, fees, commission_rate_percent, and gst_inclusive. Fires BEFORE INSERT OR UPDATE on payment_plans.';

-- ============================================================
-- STEP 3: Create Trigger on payment_plans Table
-- ============================================================
-- Trigger fires BEFORE INSERT OR UPDATE on any of the fields that affect commission
-- This ensures commissionable_value and expected_commission are always up-to-date

CREATE TRIGGER calculate_commissions_on_change
  BEFORE INSERT OR UPDATE OF
    total_amount,
    materials_cost,
    admin_fees,
    other_fees,
    commission_rate_percent,
    gst_inclusive
  ON payment_plans
  FOR EACH ROW
  EXECUTE FUNCTION update_payment_plan_commissions();

COMMENT ON TRIGGER calculate_commissions_on_change ON payment_plans IS
  'Recalculates commissionable_value and expected_commission whenever total_amount, fees, commission_rate_percent, or gst_inclusive changes. Replaces the simpler trigger from Story 4.1.';

-- ============================================================
-- STEP 4: Drop Old Trigger Function (from Story 4.1)
-- ============================================================
-- Clean up the old function that is no longer used

DROP FUNCTION IF EXISTS calculate_payment_plan_commission();

-- ============================================================
-- STEP 5: Recalculate All Existing Records
-- ============================================================
-- Update all existing payment plans to use the new calculation logic
-- This ensures consistency across all records

UPDATE payment_plans
SET
  commissionable_value = calculate_commissionable_value(
    total_amount,
    materials_cost,
    admin_fees,
    other_fees
  ),
  expected_commission = calculate_expected_commission(
    calculate_commissionable_value(total_amount, materials_cost, admin_fees, other_fees),
    commission_rate_percent / 100,
    gst_inclusive
  );

COMMIT;


-- Source: 008_payment_plans_wizard_fields.sql

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


-- Source: 009_manual_payment_recording_schema.sql

-- Migration 009: Add columns for manual payment recording
-- Epic 4: Payment Management & Tracking
-- Story 4.4: Manual Payment Recording
-- Task 1: Database Schema Extensions

-- ============================================================
-- PREREQUISITES
-- ============================================================
-- This migration requires:
-- - installments table (from 003_payments_domain/004_installments_schema.sql)
-- - payment_plans table (from 003_payments_domain/001_payment_plans_schema.sql)
--
-- This migration adds:
-- - payment_notes column to installments table (for recording payment notes)
-- - earned_commission column to payment_plans table (for tracking actual earned commission)
-- - partial payment status support

BEGIN;

-- ============================================================
-- STEP 1: Add payment_notes Column to Installments Table
-- ============================================================
-- Stores optional notes when recording a payment
-- Max 500 characters as per AC3

ALTER TABLE installments
  ADD COLUMN payment_notes TEXT;

-- Add constraint for max 500 characters
ALTER TABLE installments
  ADD CONSTRAINT chk_payment_notes_max_length
  CHECK (payment_notes IS NULL OR length(payment_notes) <= 500);

COMMENT ON COLUMN installments.payment_notes IS
  'Optional notes recorded when payment is received. Max 500 characters. Visible in payment history.';

-- ============================================================
-- STEP 2: Add earned_commission Column to Payment Plans Table
-- ============================================================
-- Tracks actual commission earned based on paid installments
-- Formula: (SUM(paid_amount WHERE status='paid') / total_amount) * expected_commission

ALTER TABLE payment_plans
  ADD COLUMN earned_commission DECIMAL(12,2) DEFAULT 0 NOT NULL;

-- Add constraint to ensure earned_commission is non-negative
ALTER TABLE payment_plans
  ADD CONSTRAINT chk_earned_commission_non_negative
  CHECK (earned_commission >= 0);

COMMENT ON COLUMN payment_plans.earned_commission IS
  'Actual commission earned based on paid installments. Formula: (SUM(paid_amount WHERE status=paid) / total_amount) * expected_commission. Updated after each payment recording. Defaults to 0.';

-- ============================================================
-- STEP 3: Update Installment Status Enum for Partial Payments
-- ============================================================
-- Add 'partial' status to support partial payment tracking (AC2)
-- A partial payment is when paid_amount < installment.amount

ALTER TYPE installment_status ADD VALUE IF NOT EXISTS 'partial' AFTER 'paid';

COMMENT ON TYPE installment_status IS
  'Status values for installments: draft (not yet active), pending (awaiting payment), partial (partial payment received), paid (full payment received), overdue (past due date), cancelled (installment cancelled)';

-- ============================================================
-- STEP 4: Backfill earned_commission for Existing Payment Plans
-- ============================================================
-- Calculate earned_commission for any existing payment plans based on paid installments

UPDATE payment_plans pp
SET earned_commission = (
  SELECT COALESCE(
    CASE
      WHEN pp.total_amount > 0 THEN
        (SUM(i.paid_amount) / pp.total_amount) * pp.expected_commission
      ELSE 0
    END,
    0
  )
  FROM installments i
  WHERE i.payment_plan_id = pp.id
    AND i.status = 'paid'
    AND i.paid_amount IS NOT NULL
);

-- Handle payment plans with no installments
UPDATE payment_plans
SET earned_commission = 0
WHERE earned_commission IS NULL;

COMMIT;


COMMIT;
