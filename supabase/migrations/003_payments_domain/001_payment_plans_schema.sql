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
