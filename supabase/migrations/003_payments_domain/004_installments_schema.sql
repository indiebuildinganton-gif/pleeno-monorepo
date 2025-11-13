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
