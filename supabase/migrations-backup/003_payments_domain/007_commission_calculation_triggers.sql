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
