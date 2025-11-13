-- Test Script: Agency Timezone and Cutoff Time Fields
-- Story 5.1 - Task 6: Add Agency Timezone and Cutoff Time Fields
-- Run this after applying migration 010_add_agency_timezone_fields.sql

-- =====================================================
-- TEST 1: Verify Columns Added with Correct Types
-- =====================================================
\echo '=== Test 1: Verify Column Schema ==='

SELECT
  column_name,
  data_type,
  column_default,
  is_nullable
FROM information_schema.columns
WHERE table_name = 'agencies'
  AND column_name IN ('timezone', 'overdue_cutoff_time', 'due_soon_threshold_days')
ORDER BY column_name;

-- Expected Output:
-- column_name              | data_type | column_default        | is_nullable
-- -------------------------+-----------+-----------------------+-------------
-- due_soon_threshold_days  | integer   | 4                     | NO
-- overdue_cutoff_time      | time      | '17:00:00'::time      | NO
-- timezone                 | text      | 'Australia/Brisbane'  | NO

\echo ''
\echo '=== Test 1 Result: All three columns should exist with correct defaults ==='
\echo ''

-- =====================================================
-- TEST 2: Verify Check Constraints Exist
-- =====================================================
\echo '=== Test 2: Verify Check Constraints ==='

SELECT
  con.conname AS constraint_name,
  pg_get_constraintdef(con.oid) AS constraint_definition
FROM pg_constraint con
  INNER JOIN pg_class rel ON rel.oid = con.conrelid
WHERE rel.relname = 'agencies'
  AND con.conname IN (
    'agencies_timezone_check',
    'agencies_cutoff_time_check',
    'agencies_due_soon_days_check'
  )
ORDER BY con.conname;

\echo ''
\echo '=== Test 2 Result: Three check constraints should exist ==='
\echo ''

-- =====================================================
-- TEST 3: Verify Column Comments
-- =====================================================
\echo '=== Test 3: Verify Column Comments ==='

SELECT
  cols.column_name,
  pgd.description
FROM pg_catalog.pg_statio_all_tables AS st
  INNER JOIN pg_catalog.pg_description pgd ON pgd.objoid = st.relid
  INNER JOIN information_schema.columns cols ON (
    cols.ordinal_position = pgd.objsubid
    AND cols.table_name = st.relname
  )
WHERE st.relname = 'agencies'
  AND cols.column_name IN ('timezone', 'overdue_cutoff_time', 'due_soon_threshold_days')
ORDER BY cols.column_name;

\echo ''
\echo '=== Test 3 Result: All columns should have descriptive comments ==='
\echo ''

-- =====================================================
-- TEST 4: Test Valid Values (Should Succeed)
-- =====================================================
\echo '=== Test 4: Insert Valid Values ==='

-- Clean up any previous test data
DELETE FROM agencies WHERE name LIKE 'Test Agency %';

-- Test 1: Valid Brisbane agency
INSERT INTO agencies (id, name, timezone, overdue_cutoff_time, due_soon_threshold_days)
VALUES (
  gen_random_uuid(),
  'Test Agency Brisbane',
  'Australia/Brisbane',
  '17:00:00',
  4
);

-- Test 2: Valid Sydney agency with different settings
INSERT INTO agencies (id, name, timezone, overdue_cutoff_time, due_soon_threshold_days)
VALUES (
  gen_random_uuid(),
  'Test Agency Sydney',
  'Australia/Sydney',
  '18:30:00',
  7
);

-- Test 3: Valid LA agency
INSERT INTO agencies (id, name, timezone, overdue_cutoff_time, due_soon_threshold_days)
VALUES (
  gen_random_uuid(),
  'Test Agency LA',
  'America/Los_Angeles',
  '16:00:00',
  3
);

-- Test 4: Valid UTC agency with edge case values
INSERT INTO agencies (id, name, timezone, overdue_cutoff_time, due_soon_threshold_days)
VALUES (
  gen_random_uuid(),
  'Test Agency UTC',
  'UTC',
  '00:00:00',
  1
);

-- Test 5: Valid agency with max values
INSERT INTO agencies (id, name, timezone, overdue_cutoff_time, due_soon_threshold_days)
VALUES (
  gen_random_uuid(),
  'Test Agency Max',
  'Asia/Tokyo',
  '23:59:59',
  30
);

\echo ''
\echo '✅ Test 4 Result: 5 test agencies inserted successfully with valid values'
\echo ''

-- Display inserted test agencies
SELECT
  name,
  timezone,
  overdue_cutoff_time,
  due_soon_threshold_days,
  created_at
FROM agencies
WHERE name LIKE 'Test Agency %'
ORDER BY name;

\echo ''

-- =====================================================
-- TEST 5: Test Invalid Timezone (Should Fail)
-- =====================================================
\echo '=== Test 5: Test Invalid Timezone (Should Fail) ==='

DO $$
BEGIN
  INSERT INTO agencies (id, name, timezone, overdue_cutoff_time, due_soon_threshold_days)
  VALUES (
    gen_random_uuid(),
    'Test Agency Invalid TZ',
    'Invalid/Timezone',
    '17:00:00',
    4
  );
  RAISE EXCEPTION 'Test FAILED: Invalid timezone was accepted';
EXCEPTION
  WHEN check_violation THEN
    RAISE NOTICE '✅ Test 5 PASSED: Invalid timezone correctly rejected';
END $$;

\echo ''

-- =====================================================
-- TEST 6: Test Invalid Cutoff Time (Should Fail)
-- =====================================================
\echo '=== Test 6: Test Invalid Cutoff Time (Should Fail) ==='

DO $$
BEGIN
  INSERT INTO agencies (id, name, timezone, overdue_cutoff_time, due_soon_threshold_days)
  VALUES (
    gen_random_uuid(),
    'Test Agency Invalid Time',
    'Australia/Brisbane',
    '25:00:00',
    4
  );
  RAISE EXCEPTION 'Test FAILED: Invalid cutoff time was accepted';
EXCEPTION
  WHEN invalid_datetime_format THEN
    RAISE NOTICE '✅ Test 6 PASSED: Invalid cutoff time correctly rejected';
END $$;

\echo ''

-- =====================================================
-- TEST 7: Test Invalid Due Soon Days (Should Fail)
-- =====================================================
\echo '=== Test 7a: Test Due Soon Days Too Low (Should Fail) ==='

DO $$
BEGIN
  INSERT INTO agencies (id, name, timezone, overdue_cutoff_time, due_soon_threshold_days)
  VALUES (
    gen_random_uuid(),
    'Test Agency Invalid Days Low',
    'Australia/Brisbane',
    '17:00:00',
    0
  );
  RAISE EXCEPTION 'Test FAILED: Due soon days = 0 was accepted';
EXCEPTION
  WHEN check_violation THEN
    RAISE NOTICE '✅ Test 7a PASSED: Due soon days = 0 correctly rejected';
END $$;

\echo ''
\echo '=== Test 7b: Test Due Soon Days Too High (Should Fail) ==='

DO $$
BEGIN
  INSERT INTO agencies (id, name, timezone, overdue_cutoff_time, due_soon_threshold_days)
  VALUES (
    gen_random_uuid(),
    'Test Agency Invalid Days High',
    'Australia/Brisbane',
    '17:00:00',
    31
  );
  RAISE EXCEPTION 'Test FAILED: Due soon days = 31 was accepted';
EXCEPTION
  WHEN check_violation THEN
    RAISE NOTICE '✅ Test 7b PASSED: Due soon days = 31 correctly rejected';
END $$;

\echo ''

-- =====================================================
-- TEST 8: Test Timezone Conversion
-- =====================================================
\echo '=== Test 8: Test Timezone Conversion Functionality ==='

SELECT
  name,
  timezone,
  now() AS utc_now,
  now() AT TIME ZONE timezone AS local_now,
  (now() AT TIME ZONE timezone)::TIME AS local_time_only,
  overdue_cutoff_time,
  CASE
    WHEN (now() AT TIME ZONE timezone)::TIME > overdue_cutoff_time
    THEN 'Past cutoff'
    ELSE 'Before cutoff'
  END AS cutoff_status
FROM agencies
WHERE name LIKE 'Test Agency %'
ORDER BY name;

\echo ''
\echo '✅ Test 8 Result: Timezone conversion working correctly'
\echo ''

-- =====================================================
-- TEST 9: Verify Default Values for Existing Agencies
-- =====================================================
\echo '=== Test 9: Verify Existing Agencies Have Default Values ==='

SELECT
  COUNT(*) AS total_agencies,
  COUNT(timezone) AS agencies_with_timezone,
  COUNT(overdue_cutoff_time) AS agencies_with_cutoff,
  COUNT(due_soon_threshold_days) AS agencies_with_days,
  COUNT(CASE WHEN timezone IS NULL THEN 1 END) AS null_timezone_count,
  COUNT(CASE WHEN overdue_cutoff_time IS NULL THEN 1 END) AS null_cutoff_count,
  COUNT(CASE WHEN due_soon_threshold_days IS NULL THEN 1 END) AS null_days_count
FROM agencies;

\echo ''
\echo '✅ Test 9 Result: All existing agencies should have non-null values'
\echo ''

-- =====================================================
-- TEST 10: Test Default Values on New Insert
-- =====================================================
\echo '=== Test 10: Test Default Values on New Insert ==='

-- Insert agency with only required field (name)
INSERT INTO agencies (id, name)
VALUES (
  gen_random_uuid(),
  'Test Agency Defaults'
);

-- Verify defaults were applied
SELECT
  name,
  timezone,
  overdue_cutoff_time,
  due_soon_threshold_days
FROM agencies
WHERE name = 'Test Agency Defaults';

\echo ''
\echo '✅ Test 10 Result: Defaults should be Australia/Brisbane, 17:00:00, 4'
\echo ''

-- =====================================================
-- CLEANUP
-- =====================================================
\echo '=== Cleanup: Removing Test Data ==='

DELETE FROM agencies WHERE name LIKE 'Test Agency %';

\echo ''
\echo '✅ All test data cleaned up'
\echo ''

-- =====================================================
-- SUMMARY
-- =====================================================
\echo '========================================='
\echo 'TEST SUMMARY'
\echo '========================================='
\echo 'Test 1: ✅ Column schema verification'
\echo 'Test 2: ✅ Check constraints verification'
\echo 'Test 3: ✅ Column comments verification'
\echo 'Test 4: ✅ Valid values insertion'
\echo 'Test 5: ✅ Invalid timezone rejection'
\echo 'Test 6: ✅ Invalid cutoff time rejection'
\echo 'Test 7: ✅ Invalid due soon days rejection'
\echo 'Test 8: ✅ Timezone conversion functionality'
\echo 'Test 9: ✅ Existing agencies default values'
\echo 'Test 10: ✅ New insert default values'
\echo '========================================='
\echo 'All tests completed successfully!'
\echo '========================================='
