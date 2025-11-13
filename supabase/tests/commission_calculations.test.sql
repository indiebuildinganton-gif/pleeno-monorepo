-- Test Suite: Commission Calculation Functions
-- Epic 4: Payment Management & Tracking
-- Story 4.2: Flexible Installment Structure
-- Task 3: Commission Calculation Functions

BEGIN;

-- ============================================================
-- Test calculate_commissionable_value()
-- ============================================================

-- Test 1: Basic calculation with all fees
SELECT 'Test 1: Basic calculation with all fees' AS test_name;
SELECT calculate_commissionable_value(10000, 500, 200, 100) = 9200 AS test_result;
-- Expected: true (10000 - 500 - 200 - 100 = 9200)

-- Test 2: No fees (all defaults to 0)
SELECT 'Test 2: No fees' AS test_name;
SELECT calculate_commissionable_value(10000, 0, 0, 0) = 10000 AS test_result;
-- Expected: true

-- Test 3: NULL fee values should be treated as 0
SELECT 'Test 3: NULL fee values treated as 0' AS test_name;
SELECT calculate_commissionable_value(10000, NULL, NULL, NULL) = 10000 AS test_result;
-- Expected: true

-- Test 4: Fees exceed total (should return 0)
SELECT 'Test 4: Fees exceed total' AS test_name;
SELECT calculate_commissionable_value(1000, 500, 400, 300) = 0 AS test_result;
-- Expected: true (result should not be negative)

-- Test 5: Only materials cost
SELECT 'Test 5: Only materials cost' AS test_name;
SELECT calculate_commissionable_value(5000, 500, 0, 0) = 4500 AS test_result;
-- Expected: true

-- Test 6: Decimal precision
SELECT 'Test 6: Decimal precision' AS test_name;
SELECT calculate_commissionable_value(10000.50, 100.33, 50.22, 25.11) = 9824.84 AS test_result;
-- Expected: true

-- ============================================================
-- Test calculate_expected_commission() - GST Handling
-- ============================================================

-- Test 7: GST Inclusive (default)
SELECT 'Test 7: Commission with GST inclusive' AS test_name;
SELECT calculate_expected_commission(9200, 0.15, true) = 1380.00 AS test_result;
-- Expected: true (9200 × 0.15 = 1380)

-- Test 8: GST Exclusive (removes 10% GST)
SELECT 'Test 8: Commission with GST exclusive' AS test_name;
SELECT calculate_expected_commission(9200, 0.15, false) = 1254.55 AS test_result;
-- Expected: true ((9200 / 1.10) × 0.15 = 1254.55)

-- Test 9: Zero commission rate
SELECT 'Test 9: Zero commission rate' AS test_name;
SELECT calculate_expected_commission(10000, 0, true) = 0 AS test_result;
-- Expected: true

-- Test 10: Zero commissionable value
SELECT 'Test 10: Zero commissionable value' AS test_name;
SELECT calculate_expected_commission(0, 0.15, true) = 0 AS test_result;
-- Expected: true

-- Test 11: NULL handling
SELECT 'Test 11: NULL commissionable value' AS test_name;
SELECT calculate_expected_commission(NULL, 0.15, true) = 0 AS test_result;
-- Expected: true

-- Test 12: Negative value handling
SELECT 'Test 12: Negative commissionable value' AS test_name;
SELECT calculate_expected_commission(-1000, 0.15, true) = 0 AS test_result;
-- Expected: true

-- Test 13: High precision decimal
SELECT 'Test 13: High precision decimal' AS test_name;
SELECT calculate_expected_commission(12345.67, 0.1345, true) = 1660.49 AS test_result;
-- Expected: true

-- Test 14: GST exclusive high precision
SELECT 'Test 14: GST exclusive high precision' AS test_name;
SELECT calculate_expected_commission(12345.67, 0.1345, false) = 1509.54 AS test_result;
-- Expected: true ((12345.67 / 1.10) × 0.1345 = 1509.54)

-- ============================================================
-- Integration Test: Full Workflow (GST Inclusive)
-- ============================================================

SELECT 'Integration Test 1: Full workflow (GST inclusive)' AS test_name;
WITH test_data AS (
  SELECT
    10000 AS total_course_value,
    500 AS materials_cost,
    200 AS admin_fees,
    100 AS other_fees,
    0.15 AS commission_rate
),
calculations AS (
  SELECT
    calculate_commissionable_value(
      total_course_value,
      materials_cost,
      admin_fees,
      other_fees
    ) AS commissionable_value,
    commission_rate
  FROM test_data
)
SELECT
  commissionable_value = 9200 AS commissionable_value_correct,
  calculate_expected_commission(commissionable_value, commission_rate, true) = 1380.00 AS expected_commission_correct
FROM calculations;
-- Expected: both true

-- ============================================================
-- Integration Test: Full Workflow (GST Exclusive)
-- ============================================================

SELECT 'Integration Test 2: Full workflow (GST exclusive)' AS test_name;
WITH test_data AS (
  SELECT
    10000 AS total_course_value,
    500 AS materials_cost,
    200 AS admin_fees,
    100 AS other_fees,
    0.15 AS commission_rate
),
calculations AS (
  SELECT
    calculate_commissionable_value(
      total_course_value,
      materials_cost,
      admin_fees,
      other_fees
    ) AS commissionable_value,
    commission_rate
  FROM test_data
)
SELECT
  commissionable_value = 9200 AS commissionable_value_correct,
  calculate_expected_commission(commissionable_value, commission_rate, false) = 1254.55 AS expected_commission_correct
FROM calculations;
-- Expected: both true

-- ============================================================
-- Test Trigger: update_payment_plan_commissions()
-- ============================================================
-- This test creates a temporary payment plan to verify trigger functionality
-- Note: This assumes the payment_plans table and trigger exist

SELECT 'Trigger Test: Auto-calculation on INSERT' AS test_name;

-- Clean up any test data first
DELETE FROM payment_plans WHERE reference_number = 'TEST-COMMISSION-001';

-- Create a test enrollment and payment plan
-- Note: This requires valid agency_id and enrollment_id
-- We'll use a placeholder test that can be manually verified

-- Display message about trigger test
SELECT 'Trigger test requires manual verification with valid agency_id and enrollment_id' AS note;

ROLLBACK;
