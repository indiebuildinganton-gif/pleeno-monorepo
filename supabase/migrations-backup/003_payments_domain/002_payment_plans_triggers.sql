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
