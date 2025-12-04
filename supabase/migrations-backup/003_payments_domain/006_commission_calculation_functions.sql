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
