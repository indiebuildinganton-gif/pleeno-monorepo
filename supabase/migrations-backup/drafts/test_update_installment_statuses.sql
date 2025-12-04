-- =====================================================================
-- Test Script: update_installment_statuses()
-- Purpose: Validate the automated status detection function
-- =====================================================================

-- =====================================================================
-- SETUP: Create Test Data
-- =====================================================================

-- Note: This script assumes the following tables exist:
-- - agencies (with columns: id, name, timezone, overdue_cutoff_time)
-- - payment_plans (with columns: id, agency_id, status)
-- - installments (with columns: id, payment_plan_id, status, student_due_date, updated_at)

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
  );

-- Create test payment plans
INSERT INTO payment_plans (id, agency_id, status, created_at)
VALUES
  -- Active plans (should be processed)
  (
    'p1111111-1111-1111-1111-111111111111',
    'a1111111-1111-1111-1111-111111111111',
    'active',
    now()
  ),
  (
    'p2222222-2222-2222-2222-222222222222',
    'a2222222-2222-2222-2222-222222222222',
    'active',
    now()
  ),
  -- Inactive plan (should NOT be processed)
  (
    'p3333333-3333-3333-3333-333333333333',
    'a1111111-1111-1111-1111-111111111111',
    'cancelled',
    now()
  );

-- Create test installments with various due date scenarios
INSERT INTO installments (id, payment_plan_id, status, student_due_date, amount, created_at)
VALUES
  -- Scenario 1: Due yesterday (should become overdue)
  (
    'i1111111-1111-1111-1111-111111111111',
    'p1111111-1111-1111-1111-111111111111',
    'pending',
    CURRENT_DATE - INTERVAL '1 day',
    100.00,
    now()
  ),
  -- Scenario 2: Due 7 days ago (should become overdue)
  (
    'i2222222-2222-2222-2222-222222222222',
    'p1111111-1111-1111-1111-111111111111',
    'pending',
    CURRENT_DATE - INTERVAL '7 days',
    100.00,
    now()
  ),
  -- Scenario 3: Due today (will depend on current time vs cutoff time)
  (
    'i3333333-3333-3333-3333-333333333333',
    'p1111111-1111-1111-1111-111111111111',
    'pending',
    CURRENT_DATE,
    100.00,
    now()
  ),
  -- Scenario 4: Due tomorrow (should remain pending)
  (
    'i4444444-4444-4444-4444-444444444444',
    'p1111111-1111-1111-1111-111111111111',
    'pending',
    CURRENT_DATE + INTERVAL '1 day',
    100.00,
    now()
  ),
  -- Scenario 5: Due next week (should remain pending)
  (
    'i5555555-5555-5555-5555-555555555555',
    'p1111111-1111-1111-1111-111111111111',
    'pending',
    CURRENT_DATE + INTERVAL '7 days',
    100.00,
    now()
  ),
  -- Scenario 6: Already overdue (should remain overdue)
  (
    'i6666666-6666-6666-6666-666666666666',
    'p1111111-1111-1111-1111-111111111111',
    'overdue',
    CURRENT_DATE - INTERVAL '3 days',
    100.00,
    now()
  ),
  -- Scenario 7: Already paid (should remain paid)
  (
    'i7777777-7777-7777-7777-777777777777',
    'p1111111-1111-1111-1111-111111111111',
    'paid',
    CURRENT_DATE - INTERVAL '5 days',
    100.00,
    now()
  ),
  -- Scenario 8: Pending installment for LA agency (different timezone)
  (
    'i8888888-8888-8888-8888-888888888888',
    'p2222222-2222-2222-2222-222222222222',
    'pending',
    CURRENT_DATE - INTERVAL '2 days',
    100.00,
    now()
  ),
  -- Scenario 9: Pending installment for cancelled plan (should NOT be updated)
  (
    'i9999999-9999-9999-9999-999999999999',
    'p3333333-3333-3333-3333-333333333333',
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
\echo 'PRE-TEST STATE'
\echo '====================================================================='

SELECT
  a.name AS agency_name,
  a.timezone,
  pp.status AS plan_status,
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
\echo 'RUNNING: update_installment_statuses()'
\echo '====================================================================='

SELECT * FROM update_installment_statuses();

-- =====================================================================
-- POST-TEST: Display results
-- =====================================================================

\echo ''
\echo '====================================================================='
\echo 'POST-TEST STATE'
\echo '====================================================================='

SELECT
  a.name AS agency_name,
  a.timezone,
  pp.status AS plan_status,
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
-- VALIDATION: Check expected results
-- =====================================================================

\echo ''
\echo '====================================================================='
\echo 'VALIDATION CHECKS'
\echo '====================================================================='

-- Check 1: Installments that should be overdue
\echo ''
\echo 'Check 1: Past due installments for active plans should be overdue'
SELECT
  COUNT(*) AS should_be_overdue,
  SUM(CASE WHEN i.status = 'overdue' THEN 1 ELSE 0 END) AS actually_overdue
FROM installments i
JOIN payment_plans pp ON i.payment_plan_id = pp.id
WHERE pp.agency_id IN (
    SELECT id FROM agencies WHERE name LIKE 'Test Agency%'
  )
  AND pp.status = 'active'
  AND i.student_due_date < CURRENT_DATE
  AND i.status IN ('pending', 'overdue');

-- Check 2: Future due dates should remain pending
\echo ''
\echo 'Check 2: Future due dates should remain pending'
SELECT
  COUNT(*) AS future_due_count,
  SUM(CASE WHEN i.status = 'pending' THEN 1 ELSE 0 END) AS still_pending
FROM installments i
JOIN payment_plans pp ON i.payment_plan_id = pp.id
WHERE pp.agency_id IN (
    SELECT id FROM agencies WHERE name LIKE 'Test Agency%'
  )
  AND pp.status = 'active'
  AND i.student_due_date > CURRENT_DATE
  AND i.status = 'pending';

-- Check 3: Inactive plans should not be updated
\echo ''
\echo 'Check 3: Installments for cancelled plans should remain pending'
SELECT
  COUNT(*) AS cancelled_plan_installments,
  i.status
FROM installments i
JOIN payment_plans pp ON i.payment_plan_id = pp.id
WHERE pp.status = 'cancelled'
  AND i.student_due_date < CURRENT_DATE
GROUP BY i.status;

-- Check 4: Already paid/completed should remain unchanged
\echo ''
\echo 'Check 4: Already paid installments should remain paid'
SELECT
  COUNT(*) AS paid_count,
  SUM(CASE WHEN i.status = 'paid' THEN 1 ELSE 0 END) AS still_paid
FROM installments i
JOIN payment_plans pp ON i.payment_plan_id = pp.id
WHERE pp.agency_id IN (
    SELECT id FROM agencies WHERE name LIKE 'Test Agency%'
  )
  AND i.status = 'paid';

-- =====================================================================
-- CLEANUP: Remove test data (optional)
-- =====================================================================

\echo ''
\echo '====================================================================='
\echo 'CLEANUP (Uncomment to execute)'
\echo '====================================================================='

-- Uncomment the following lines to clean up test data:
/*
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
*/

-- =====================================================================
-- USAGE:
-- Run this script using psql:
--   psql -h localhost -U postgres -d your_database -f test_update_installment_statuses.sql
--
-- Or via Supabase CLI:
--   supabase db reset  # Reset local database
--   psql $DATABASE_URL -f test_update_installment_statuses.sql
-- =====================================================================
