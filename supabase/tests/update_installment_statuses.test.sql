-- =====================================================================
-- Test Suite: update_installment_statuses()
-- Purpose: Comprehensive testing of automated status detection function
-- =====================================================================

-- =====================================================================
-- SETUP: Create Test Data
-- =====================================================================

BEGIN;

-- Clean up any existing test data
DELETE FROM installments WHERE payment_plan_id IN (
  SELECT id FROM payment_plans WHERE agency_id IN (
    SELECT id FROM agencies WHERE name LIKE 'Test Agency%'
  )
);
DELETE FROM payment_plans WHERE agency_id IN (
  SELECT id FROM agencies WHERE name LIKE 'Test Agency%'
);
DELETE FROM agencies WHERE name LIKE 'Test Agency%';

-- Create test agencies with different timezones
INSERT INTO agencies (id, name, timezone, overdue_cutoff_time, created_at)
VALUES
  (
    'a1111111-1111-1111-1111-111111111111',
    'Test Agency Brisbane',
    'Australia/Brisbane',
    '17:00',
    now()
  ),
  (
    'a2222222-2222-2222-2222-222222222222',
    'Test Agency LA',
    'America/Los_Angeles',
    '17:00',
    now()
  ),
  (
    'a3333333-3333-3333-3333-333333333333',
    'Test Agency Tokyo',
    'Asia/Tokyo',
    '17:00',
    now()
  );

-- Create test payment plans
INSERT INTO payment_plans (id, agency_id, status, expected_commission, created_at)
VALUES
  -- Active plans (should be processed)
  (
    'p1111111-1111-1111-1111-111111111111',
    'a1111111-1111-1111-1111-111111111111',
    'active',
    1000.00,
    now()
  ),
  (
    'p2222222-2222-2222-2222-222222222222',
    'a2222222-2222-2222-2222-222222222222',
    'active',
    2000.00,
    now()
  ),
  (
    'p3333333-3333-3333-3333-333333333333',
    'a3333333-3333-3333-3333-333333333333',
    'active',
    1500.00,
    now()
  ),
  -- Inactive plan (should NOT be processed)
  (
    'p4444444-4444-4444-4444-444444444444',
    'a1111111-1111-1111-1111-111111111111',
    'cancelled',
    500.00,
    now()
  );

-- Create test installments with various due date scenarios
INSERT INTO installments (id, payment_plan_id, status, student_due_date, amount, created_at)
VALUES
  -- ===== TEST CASE 1: Due yesterday (should become overdue) =====
  (
    'i1111111-1111-1111-1111-111111111111',
    'p1111111-1111-1111-1111-111111111111',
    'pending',
    CURRENT_DATE - INTERVAL '1 day',
    100.00,
    now()
  ),
  -- ===== TEST CASE 2: Due 7 days ago (should become overdue) =====
  (
    'i2222222-2222-2222-2222-222222222222',
    'p1111111-1111-1111-1111-111111111111',
    'pending',
    CURRENT_DATE - INTERVAL '7 days',
    100.00,
    now()
  ),
  -- ===== TEST CASE 3: Due today (depends on current time vs cutoff) =====
  (
    'i3333333-3333-3333-3333-333333333333',
    'p1111111-1111-1111-1111-111111111111',
    'pending',
    CURRENT_DATE,
    100.00,
    now()
  ),
  -- ===== TEST CASE 4: Due tomorrow (should remain pending) =====
  (
    'i4444444-4444-4444-4444-444444444444',
    'p1111111-1111-1111-1111-111111111111',
    'pending',
    CURRENT_DATE + INTERVAL '1 day',
    100.00,
    now()
  ),
  -- ===== TEST CASE 5: Due next week (should remain pending) =====
  (
    'i5555555-5555-5555-5555-555555555555',
    'p1111111-1111-1111-1111-111111111111',
    'pending',
    CURRENT_DATE + INTERVAL '7 days',
    100.00,
    now()
  ),
  -- ===== TEST CASE 6: Already overdue (should remain overdue) =====
  (
    'i6666666-6666-6666-6666-666666666666',
    'p1111111-1111-1111-1111-111111111111',
    'overdue',
    CURRENT_DATE - INTERVAL '3 days',
    100.00,
    now()
  ),
  -- ===== TEST CASE 7: Already paid (should remain paid) =====
  (
    'i7777777-7777-7777-7777-777777777777',
    'p1111111-1111-1111-1111-111111111111',
    'paid',
    CURRENT_DATE - INTERVAL '5 days',
    100.00,
    now()
  ),
  -- ===== TEST CASE 8: Multi-agency - LA agency (different timezone) =====
  (
    'i8888888-8888-8888-8888-888888888888',
    'p2222222-2222-2222-2222-222222222222',
    'pending',
    CURRENT_DATE - INTERVAL '2 days',
    100.00,
    now()
  ),
  -- ===== TEST CASE 9: Multi-agency - Tokyo agency (different timezone) =====
  (
    'i9999999-9999-9999-9999-999999999999',
    'p3333333-3333-3333-3333-333333333333',
    'pending',
    CURRENT_DATE - INTERVAL '1 day',
    100.00,
    now()
  ),
  -- ===== TEST CASE 10: Cancelled plan (should NOT be updated) =====
  (
    'iaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
    'p4444444-4444-4444-4444-444444444444',
    'pending',
    CURRENT_DATE - INTERVAL '10 days',
    100.00,
    now()
  );

COMMIT;

-- =====================================================================
-- PRE-TEST: Display initial state
-- =====================================================================

\echo '====================================================================='
\echo 'PRE-TEST STATE: Installments Before Status Update'
\echo '====================================================================='

SELECT
  a.name AS agency_name,
  a.timezone,
  pp.status AS plan_status,
  i.id AS installment_id,
  i.status AS installment_status,
  i.student_due_date,
  CASE
    WHEN i.student_due_date < CURRENT_DATE THEN 'Past due'
    WHEN i.student_due_date = CURRENT_DATE THEN 'Due today'
    WHEN i.student_due_date > CURRENT_DATE THEN 'Future due'
  END AS due_status
FROM installments i
JOIN payment_plans pp ON i.payment_plan_id = pp.id
JOIN agencies a ON pp.agency_id = a.id
WHERE a.name LIKE 'Test Agency%'
ORDER BY a.name, i.student_due_date;

-- =====================================================================
-- EXECUTE: Run the function
-- =====================================================================

\echo ''
\echo '====================================================================='
\echo 'EXECUTING: update_installment_statuses()'
\echo '====================================================================='

SELECT
  agency_id,
  updated_count,
  transitions
FROM update_installment_statuses();

-- =====================================================================
-- POST-TEST: Display results
-- =====================================================================

\echo ''
\echo '====================================================================='
\echo 'POST-TEST STATE: Installments After Status Update'
\echo '====================================================================='

SELECT
  a.name AS agency_name,
  a.timezone,
  pp.status AS plan_status,
  i.id AS installment_id,
  i.status AS installment_status,
  i.student_due_date,
  CASE
    WHEN i.student_due_date < CURRENT_DATE THEN 'Past due'
    WHEN i.student_due_date = CURRENT_DATE THEN 'Due today'
    WHEN i.student_due_date > CURRENT_DATE THEN 'Future due'
  END AS due_status
FROM installments i
JOIN payment_plans pp ON i.payment_plan_id = pp.id
JOIN agencies a ON pp.agency_id = a.id
WHERE a.name LIKE 'Test Agency%'
ORDER BY a.name, i.student_due_date;

-- =====================================================================
-- VALIDATION: Assert expected results
-- =====================================================================

\echo ''
\echo '====================================================================='
\echo 'VALIDATION CHECKS'
\echo '====================================================================='

-- Check 1: Past due installments for active plans should be overdue
\echo ''
\echo '✓ CHECK 1: Past due installments for active plans → overdue'
DO $$
DECLARE
  past_due_count INT;
  overdue_count INT;
BEGIN
  SELECT
    COUNT(*),
    SUM(CASE WHEN i.status = 'overdue' THEN 1 ELSE 0 END)
  INTO past_due_count, overdue_count
  FROM installments i
  JOIN payment_plans pp ON i.payment_plan_id = pp.id
  WHERE pp.agency_id IN (
      SELECT id FROM agencies WHERE name LIKE 'Test Agency%'
    )
    AND pp.status = 'active'
    AND i.student_due_date < CURRENT_DATE
    AND i.id IN ('i1111111-1111-1111-1111-111111111111', 'i2222222-2222-2222-2222-222222222222',
                 'i8888888-8888-8888-8888-888888888888', 'i9999999-9999-9999-9999-999999999999');

  IF past_due_count = overdue_count THEN
    RAISE NOTICE '  ✅ PASS: All % past due installments are now overdue', past_due_count;
  ELSE
    RAISE EXCEPTION '  ❌ FAIL: Expected % overdue, but got %', past_due_count, overdue_count;
  END IF;
END $$;

-- Check 2: Future due dates should remain pending
\echo ''
\echo '✓ CHECK 2: Future due dates → remain pending'
DO $$
DECLARE
  future_count INT;
  still_pending INT;
BEGIN
  SELECT
    COUNT(*),
    SUM(CASE WHEN i.status = 'pending' THEN 1 ELSE 0 END)
  INTO future_count, still_pending
  FROM installments i
  JOIN payment_plans pp ON i.payment_plan_id = pp.id
  WHERE pp.agency_id IN (
      SELECT id FROM agencies WHERE name LIKE 'Test Agency%'
    )
    AND pp.status = 'active'
    AND i.student_due_date > CURRENT_DATE;

  IF future_count = still_pending THEN
    RAISE NOTICE '  ✅ PASS: All % future due installments remain pending', future_count;
  ELSE
    RAISE EXCEPTION '  ❌ FAIL: Expected % pending, but got %', future_count, still_pending;
  END IF;
END $$;

-- Check 3: Inactive plans should not be updated
\echo ''
\echo '✓ CHECK 3: Installments for cancelled plans → remain pending'
DO $$
DECLARE
  cancelled_plan_status TEXT;
BEGIN
  SELECT i.status INTO cancelled_plan_status
  FROM installments i
  JOIN payment_plans pp ON i.payment_plan_id = pp.id
  WHERE pp.status = 'cancelled'
    AND i.id = 'iaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';

  IF cancelled_plan_status = 'pending' THEN
    RAISE NOTICE '  ✅ PASS: Cancelled plan installment remains pending';
  ELSE
    RAISE EXCEPTION '  ❌ FAIL: Cancelled plan installment status changed to %', cancelled_plan_status;
  END IF;
END $$;

-- Check 4: Already paid installments should remain paid
\echo ''
\echo '✓ CHECK 4: Already paid installments → remain paid'
DO $$
DECLARE
  paid_status TEXT;
BEGIN
  SELECT status INTO paid_status
  FROM installments
  WHERE id = 'i7777777-7777-7777-7777-777777777777';

  IF paid_status = 'paid' THEN
    RAISE NOTICE '  ✅ PASS: Paid installment remains paid';
  ELSE
    RAISE EXCEPTION '  ❌ FAIL: Paid installment status changed to %', paid_status;
  END IF;
END $$;

-- Check 5: Already overdue installments should remain overdue
\echo ''
\echo '✓ CHECK 5: Already overdue installments → remain overdue'
DO $$
DECLARE
  overdue_status TEXT;
BEGIN
  SELECT status INTO overdue_status
  FROM installments
  WHERE id = 'i6666666-6666-6666-6666-666666666666';

  IF overdue_status = 'overdue' THEN
    RAISE NOTICE '  ✅ PASS: Overdue installment remains overdue';
  ELSE
    RAISE EXCEPTION '  ❌ FAIL: Overdue installment status changed to %', overdue_status;
  END IF;
END $$;

-- Check 6: Multi-agency timezone test
\echo ''
\echo '✓ CHECK 6: Multi-agency timezone handling'
DO $$
DECLARE
  agencies_processed INT;
BEGIN
  SELECT COUNT(DISTINCT pp.agency_id) INTO agencies_processed
  FROM installments i
  JOIN payment_plans pp ON i.payment_plan_id = pp.id
  WHERE i.status = 'overdue'
    AND i.student_due_date < CURRENT_DATE
    AND pp.agency_id IN (
      SELECT id FROM agencies WHERE name LIKE 'Test Agency%'
    );

  IF agencies_processed >= 2 THEN
    RAISE NOTICE '  ✅ PASS: Multiple agencies (%) processed with different timezones', agencies_processed;
  ELSE
    RAISE EXCEPTION '  ❌ FAIL: Expected multiple agencies, but only % processed', agencies_processed;
  END IF;
END $$;

\echo ''
\echo '====================================================================='
\echo '✅ ALL TESTS PASSED'
\echo '====================================================================='

-- =====================================================================
-- CLEANUP: Remove test data
-- =====================================================================

\echo ''
\echo 'Cleaning up test data...'

BEGIN;

DELETE FROM installments WHERE payment_plan_id IN (
  SELECT id FROM payment_plans WHERE agency_id IN (
    SELECT id FROM agencies WHERE name LIKE 'Test Agency%'
  )
);
DELETE FROM payment_plans WHERE agency_id IN (
  SELECT id FROM agencies WHERE name LIKE 'Test Agency%'
);
DELETE FROM agencies WHERE name LIKE 'Test Agency%';

COMMIT;

\echo 'Test data cleaned up successfully'
\echo ''

-- =====================================================================
-- USAGE:
-- Run this script using psql:
--   psql -h localhost -U postgres -d your_database -f supabase/tests/update_installment_statuses.test.sql
--
-- Or via Supabase CLI:
--   supabase start
--   psql postgresql://postgres:postgres@localhost:54322/postgres -f supabase/tests/update_installment_statuses.test.sql
-- =====================================================================
