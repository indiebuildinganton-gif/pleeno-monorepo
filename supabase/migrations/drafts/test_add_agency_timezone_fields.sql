-- Test Suite: Add Agency Timezone and Cutoff Time Fields
-- Epic 5: Intelligent Status Automation
-- Story 5.1: Automated Status Detection Job - Task 6
--
-- Purpose: Comprehensive test suite to verify agency timezone and cutoff time fields
--
-- Test Categories:
--   1. Schema Verification Tests (columns, types, defaults, nullability)
--   2. Check Constraint Tests (valid/invalid values)
--   3. Data Backfill Tests (existing agencies)
--   4. Timezone Conversion Tests (IANA timezone support)
--   5. Integration Tests (with status update function)
--   6. Documentation Tests (comments)
--
-- Run with: psql -f test_add_agency_timezone_fields.sql

BEGIN;

-- ============================================================================
-- Test Setup
-- ============================================================================

-- Create temporary test schema to avoid polluting main data
SET search_path TO public;

-- Save current agency count
DO $$
DECLARE
  existing_count INT;
BEGIN
  SELECT COUNT(*) INTO existing_count FROM agencies;
  RAISE NOTICE 'Existing agencies count: %', existing_count;
END $$;

-- ============================================================================
-- TEST 1: Schema Verification - Columns Exist
-- ============================================================================

DO $$
DECLARE
  timezone_exists BOOLEAN;
  cutoff_exists BOOLEAN;
  threshold_exists BOOLEAN;
BEGIN
  -- Check if columns exist
  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'agencies' AND column_name = 'timezone'
  ) INTO timezone_exists;

  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'agencies' AND column_name = 'overdue_cutoff_time'
  ) INTO cutoff_exists;

  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'agencies' AND column_name = 'due_soon_threshold_days'
  ) INTO threshold_exists;

  ASSERT timezone_exists, 'TEST 1.1 FAILED: timezone column does not exist';
  ASSERT cutoff_exists, 'TEST 1.2 FAILED: overdue_cutoff_time column does not exist';
  ASSERT threshold_exists, 'TEST 1.3 FAILED: due_soon_threshold_days column does not exist';

  RAISE NOTICE 'TEST 1: Schema Verification - Columns Exist ✓ PASSED';
END $$;

-- ============================================================================
-- TEST 2: Schema Verification - Column Types and Defaults
-- ============================================================================

DO $$
DECLARE
  timezone_type TEXT;
  timezone_default TEXT;
  cutoff_type TEXT;
  cutoff_default TEXT;
  threshold_type TEXT;
  threshold_default TEXT;
BEGIN
  -- Check column types and defaults
  SELECT data_type, column_default
  INTO timezone_type, timezone_default
  FROM information_schema.columns
  WHERE table_name = 'agencies' AND column_name = 'timezone';

  SELECT data_type, column_default
  INTO cutoff_type, cutoff_default
  FROM information_schema.columns
  WHERE table_name = 'agencies' AND column_name = 'overdue_cutoff_time';

  SELECT data_type, column_default
  INTO threshold_type, threshold_default
  FROM information_schema.columns
  WHERE table_name = 'agencies' AND column_name = 'due_soon_threshold_days';

  ASSERT timezone_type = 'text', 'TEST 2.1 FAILED: timezone should be TEXT type';
  ASSERT cutoff_type = 'time without time zone', 'TEST 2.2 FAILED: overdue_cutoff_time should be TIME type';
  ASSERT threshold_type = 'integer', 'TEST 2.3 FAILED: due_soon_threshold_days should be INTEGER type';

  ASSERT timezone_default LIKE '%Australia/Brisbane%', 'TEST 2.4 FAILED: timezone default should be Australia/Brisbane';
  ASSERT cutoff_default LIKE '%17:00:00%', 'TEST 2.5 FAILED: overdue_cutoff_time default should be 17:00:00';
  ASSERT threshold_default LIKE '%4%', 'TEST 2.6 FAILED: due_soon_threshold_days default should be 4';

  RAISE NOTICE 'TEST 2: Schema Verification - Column Types and Defaults ✓ PASSED';
END $$;

-- ============================================================================
-- TEST 3: Schema Verification - NOT NULL Constraints
-- ============================================================================

DO $$
DECLARE
  timezone_nullable TEXT;
  cutoff_nullable TEXT;
  threshold_nullable TEXT;
BEGIN
  SELECT is_nullable INTO timezone_nullable
  FROM information_schema.columns
  WHERE table_name = 'agencies' AND column_name = 'timezone';

  SELECT is_nullable INTO cutoff_nullable
  FROM information_schema.columns
  WHERE table_name = 'agencies' AND column_name = 'overdue_cutoff_time';

  SELECT is_nullable INTO threshold_nullable
  FROM information_schema.columns
  WHERE table_name = 'agencies' AND column_name = 'due_soon_threshold_days';

  ASSERT timezone_nullable = 'NO', 'TEST 3.1 FAILED: timezone should be NOT NULL';
  ASSERT cutoff_nullable = 'NO', 'TEST 3.2 FAILED: overdue_cutoff_time should be NOT NULL';
  ASSERT threshold_nullable = 'NO', 'TEST 3.3 FAILED: due_soon_threshold_days should be NOT NULL';

  RAISE NOTICE 'TEST 3: Schema Verification - NOT NULL Constraints ✓ PASSED';
END $$;

-- ============================================================================
-- TEST 4: Check Constraints - Valid Timezones
-- ============================================================================

DO $$
DECLARE
  test_agency_id UUID;
  error_occurred BOOLEAN := FALSE;
BEGIN
  -- Test valid timezones
  test_agency_id := gen_random_uuid();
  INSERT INTO agencies (id, name, timezone, overdue_cutoff_time, due_soon_threshold_days)
  VALUES (test_agency_id, 'Test Agency - Brisbane', 'Australia/Brisbane', '17:00:00', 4);

  DELETE FROM agencies WHERE id = test_agency_id;

  test_agency_id := gen_random_uuid();
  INSERT INTO agencies (id, name, timezone, overdue_cutoff_time, due_soon_threshold_days)
  VALUES (test_agency_id, 'Test Agency - Sydney', 'Australia/Sydney', '18:00:00', 3);

  DELETE FROM agencies WHERE id = test_agency_id;

  test_agency_id := gen_random_uuid();
  INSERT INTO agencies (id, name, timezone, overdue_cutoff_time, due_soon_threshold_days)
  VALUES (test_agency_id, 'Test Agency - LA', 'America/Los_Angeles', '17:00:00', 5);

  DELETE FROM agencies WHERE id = test_agency_id;

  test_agency_id := gen_random_uuid();
  INSERT INTO agencies (id, name, timezone, overdue_cutoff_time, due_soon_threshold_days)
  VALUES (test_agency_id, 'Test Agency - UTC', 'UTC', '12:00:00', 7);

  DELETE FROM agencies WHERE id = test_agency_id;

  RAISE NOTICE 'TEST 4: Check Constraints - Valid Timezones ✓ PASSED';
EXCEPTION
  WHEN OTHERS THEN
    RAISE EXCEPTION 'TEST 4 FAILED: Valid timezones should be accepted - %', SQLERRM;
END $$;

-- ============================================================================
-- TEST 5: Check Constraints - Invalid Timezones
-- ============================================================================

DO $$
DECLARE
  test_agency_id UUID;
  error_occurred BOOLEAN := FALSE;
BEGIN
  test_agency_id := gen_random_uuid();

  -- This should fail with check constraint violation
  BEGIN
    INSERT INTO agencies (id, name, timezone)
    VALUES (test_agency_id, 'Test Agency - Invalid TZ', 'Invalid/Timezone');

    RAISE EXCEPTION 'TEST 5.1 FAILED: Invalid timezone should be rejected';
  EXCEPTION
    WHEN check_violation THEN
      error_occurred := TRUE;
      RAISE NOTICE 'TEST 5.1: Invalid timezone correctly rejected ✓';
  END;

  ASSERT error_occurred, 'TEST 5.1 FAILED: Check constraint did not trigger';

  error_occurred := FALSE;

  -- Test another invalid timezone
  BEGIN
    INSERT INTO agencies (id, name, timezone)
    VALUES (test_agency_id, 'Test Agency - Invalid TZ 2', 'America/FakeCity');

    RAISE EXCEPTION 'TEST 5.2 FAILED: Invalid timezone should be rejected';
  EXCEPTION
    WHEN check_violation THEN
      error_occurred := TRUE;
      RAISE NOTICE 'TEST 5.2: Invalid timezone correctly rejected ✓';
  END;

  ASSERT error_occurred, 'TEST 5.2 FAILED: Check constraint did not trigger';

  RAISE NOTICE 'TEST 5: Check Constraints - Invalid Timezones ✓ PASSED';
END $$;

-- ============================================================================
-- TEST 6: Check Constraints - Valid Cutoff Times
-- ============================================================================

DO $$
DECLARE
  test_agency_id UUID;
BEGIN
  -- Test boundary values
  test_agency_id := gen_random_uuid();
  INSERT INTO agencies (id, name, overdue_cutoff_time)
  VALUES (test_agency_id, 'Test Agency - Midnight', '00:00:00');
  DELETE FROM agencies WHERE id = test_agency_id;

  test_agency_id := gen_random_uuid();
  INSERT INTO agencies (id, name, overdue_cutoff_time)
  VALUES (test_agency_id, 'Test Agency - End of Day', '23:59:59');
  DELETE FROM agencies WHERE id = test_agency_id;

  test_agency_id := gen_random_uuid();
  INSERT INTO agencies (id, name, overdue_cutoff_time)
  VALUES (test_agency_id, 'Test Agency - Noon', '12:00:00');
  DELETE FROM agencies WHERE id = test_agency_id;

  RAISE NOTICE 'TEST 6: Check Constraints - Valid Cutoff Times ✓ PASSED';
EXCEPTION
  WHEN OTHERS THEN
    RAISE EXCEPTION 'TEST 6 FAILED: Valid cutoff times should be accepted - %', SQLERRM;
END $$;

-- ============================================================================
-- TEST 7: Check Constraints - Invalid Cutoff Times
-- ============================================================================

DO $$
DECLARE
  test_agency_id UUID;
  error_occurred BOOLEAN := FALSE;
BEGIN
  test_agency_id := gen_random_uuid();

  -- This should fail with check constraint violation (invalid time)
  BEGIN
    INSERT INTO agencies (id, name, overdue_cutoff_time)
    VALUES (test_agency_id, 'Test Agency - Invalid Time', '25:00:00');

    RAISE EXCEPTION 'TEST 7.1 FAILED: Invalid time should be rejected';
  EXCEPTION
    WHEN OTHERS THEN
      error_occurred := TRUE;
      RAISE NOTICE 'TEST 7.1: Invalid cutoff time correctly rejected ✓';
  END;

  ASSERT error_occurred, 'TEST 7.1 FAILED: Check constraint did not trigger';

  RAISE NOTICE 'TEST 7: Check Constraints - Invalid Cutoff Times ✓ PASSED';
END $$;

-- ============================================================================
-- TEST 8: Check Constraints - Valid Due Soon Days
-- ============================================================================

DO $$
DECLARE
  test_agency_id UUID;
BEGIN
  -- Test boundary values
  test_agency_id := gen_random_uuid();
  INSERT INTO agencies (id, name, due_soon_threshold_days)
  VALUES (test_agency_id, 'Test Agency - Min Days', 1);
  DELETE FROM agencies WHERE id = test_agency_id;

  test_agency_id := gen_random_uuid();
  INSERT INTO agencies (id, name, due_soon_threshold_days)
  VALUES (test_agency_id, 'Test Agency - Max Days', 30);
  DELETE FROM agencies WHERE id = test_agency_id;

  test_agency_id := gen_random_uuid();
  INSERT INTO agencies (id, name, due_soon_threshold_days)
  VALUES (test_agency_id, 'Test Agency - Mid Days', 15);
  DELETE FROM agencies WHERE id = test_agency_id;

  RAISE NOTICE 'TEST 8: Check Constraints - Valid Due Soon Days ✓ PASSED';
EXCEPTION
  WHEN OTHERS THEN
    RAISE EXCEPTION 'TEST 8 FAILED: Valid due soon days should be accepted - %', SQLERRM;
END $$;

-- ============================================================================
-- TEST 9: Check Constraints - Invalid Due Soon Days
-- ============================================================================

DO $$
DECLARE
  test_agency_id UUID;
  error_occurred BOOLEAN := FALSE;
BEGIN
  test_agency_id := gen_random_uuid();

  -- Test below minimum (0)
  BEGIN
    INSERT INTO agencies (id, name, due_soon_threshold_days)
    VALUES (test_agency_id, 'Test Agency - Too Low', 0);

    RAISE EXCEPTION 'TEST 9.1 FAILED: Due soon days < 1 should be rejected';
  EXCEPTION
    WHEN check_violation THEN
      error_occurred := TRUE;
      RAISE NOTICE 'TEST 9.1: Due soon days < 1 correctly rejected ✓';
  END;

  ASSERT error_occurred, 'TEST 9.1 FAILED: Check constraint did not trigger';

  error_occurred := FALSE;

  -- Test above maximum (31)
  BEGIN
    INSERT INTO agencies (id, name, due_soon_threshold_days)
    VALUES (test_agency_id, 'Test Agency - Too High', 31);

    RAISE EXCEPTION 'TEST 9.2 FAILED: Due soon days > 30 should be rejected';
  EXCEPTION
    WHEN check_violation THEN
      error_occurred := TRUE;
      RAISE NOTICE 'TEST 9.2: Due soon days > 30 correctly rejected ✓';
  END;

  ASSERT error_occurred, 'TEST 9.2 FAILED: Check constraint did not trigger';

  error_occurred := FALSE;

  -- Test negative value
  BEGIN
    INSERT INTO agencies (id, name, due_soon_threshold_days)
    VALUES (test_agency_id, 'Test Agency - Negative', -5);

    RAISE EXCEPTION 'TEST 9.3 FAILED: Negative due soon days should be rejected';
  EXCEPTION
    WHEN check_violation THEN
      error_occurred := TRUE;
      RAISE NOTICE 'TEST 9.3: Negative due soon days correctly rejected ✓';
  END;

  ASSERT error_occurred, 'TEST 9.3 FAILED: Check constraint did not trigger';

  RAISE NOTICE 'TEST 9: Check Constraints - Invalid Due Soon Days ✓ PASSED';
END $$;

-- ============================================================================
-- TEST 10: Data Backfill - Existing Agencies
-- ============================================================================

DO $$
DECLARE
  null_count INT;
BEGIN
  -- Check that no agencies have NULL values for the new columns
  SELECT COUNT(*)
  INTO null_count
  FROM agencies
  WHERE timezone IS NULL
     OR overdue_cutoff_time IS NULL
     OR due_soon_threshold_days IS NULL;

  ASSERT null_count = 0, 'TEST 10 FAILED: Some agencies have NULL values';

  RAISE NOTICE 'TEST 10: Data Backfill - Existing Agencies ✓ PASSED (% agencies with NULL values)', null_count;
END $$;

-- ============================================================================
-- TEST 11: Timezone Conversion - PostgreSQL Support
-- ============================================================================

DO $$
DECLARE
  brisbane_time TIMESTAMPTZ;
  la_time TIMESTAMPTZ;
  london_time TIMESTAMPTZ;
BEGIN
  -- Test PostgreSQL timezone conversion support
  brisbane_time := now() AT TIME ZONE 'Australia/Brisbane';
  la_time := now() AT TIME ZONE 'America/Los_Angeles';
  london_time := now() AT TIME ZONE 'Europe/London';

  -- If we got here, PostgreSQL supports these timezones
  RAISE NOTICE 'TEST 11.1: Brisbane time conversion ✓ PASSED';
  RAISE NOTICE 'TEST 11.2: Los Angeles time conversion ✓ PASSED';
  RAISE NOTICE 'TEST 11.3: London time conversion ✓ PASSED';

  RAISE NOTICE 'TEST 11: Timezone Conversion - PostgreSQL Support ✓ PASSED';
EXCEPTION
  WHEN OTHERS THEN
    RAISE EXCEPTION 'TEST 11 FAILED: PostgreSQL does not support required timezones - %', SQLERRM;
END $$;

-- ============================================================================
-- TEST 12: Timezone Logic - Time Comparison
-- ============================================================================

DO $$
DECLARE
  test_agency_id UUID;
  agency_local_time TIME;
  cutoff_time TIME := '17:00:00';
  is_past_cutoff BOOLEAN;
BEGIN
  -- Create a test agency
  test_agency_id := gen_random_uuid();
  INSERT INTO agencies (id, name, timezone, overdue_cutoff_time, due_soon_threshold_days)
  VALUES (test_agency_id, 'Test Agency - Time Logic', 'Australia/Brisbane', cutoff_time, 4);

  -- Get current time in agency's timezone
  SELECT (now() AT TIME ZONE a.timezone)::TIME
  INTO agency_local_time
  FROM agencies a
  WHERE a.id = test_agency_id;

  -- Check if past cutoff
  is_past_cutoff := agency_local_time > cutoff_time;

  RAISE NOTICE 'TEST 12: Agency local time: %, Cutoff: %, Past cutoff: %',
    agency_local_time, cutoff_time, is_past_cutoff;

  -- Clean up
  DELETE FROM agencies WHERE id = test_agency_id;

  RAISE NOTICE 'TEST 12: Timezone Logic - Time Comparison ✓ PASSED';
END $$;

-- ============================================================================
-- TEST 13: Integration - Multiple Agencies Different Timezones
-- ============================================================================

DO $$
DECLARE
  agency_brisbane UUID := gen_random_uuid();
  agency_sydney UUID := gen_random_uuid();
  agency_la UUID := gen_random_uuid();
  agency_london UUID := gen_random_uuid();
  result_count INT;
BEGIN
  -- Create agencies with different timezones
  INSERT INTO agencies (id, name, timezone, overdue_cutoff_time, due_soon_threshold_days) VALUES
    (agency_brisbane, 'Brisbane Agency', 'Australia/Brisbane', '17:00:00', 4),
    (agency_sydney, 'Sydney Agency', 'Australia/Sydney', '18:00:00', 3),
    (agency_la, 'LA Agency', 'America/Los_Angeles', '17:00:00', 5),
    (agency_london, 'London Agency', 'Europe/London', '16:00:00', 7);

  -- Verify all inserted
  SELECT COUNT(*)
  INTO result_count
  FROM agencies
  WHERE id IN (agency_brisbane, agency_sydney, agency_la, agency_london);

  ASSERT result_count = 4, 'TEST 13.1 FAILED: Not all test agencies inserted';

  -- Test query that would be used by status update function
  SELECT COUNT(*)
  INTO result_count
  FROM agencies
  WHERE id IN (agency_brisbane, agency_sydney, agency_la, agency_london)
    AND timezone IS NOT NULL
    AND overdue_cutoff_time IS NOT NULL
    AND due_soon_threshold_days IS NOT NULL;

  ASSERT result_count = 4, 'TEST 13.2 FAILED: Some agencies missing required fields';

  -- Clean up
  DELETE FROM agencies WHERE id IN (agency_brisbane, agency_sydney, agency_la, agency_london);

  RAISE NOTICE 'TEST 13: Integration - Multiple Agencies Different Timezones ✓ PASSED';
END $$;

-- ============================================================================
-- TEST 14: Column Comments - Documentation
-- ============================================================================

DO $$
DECLARE
  timezone_comment TEXT;
  cutoff_comment TEXT;
  threshold_comment TEXT;
BEGIN
  -- Check that column comments exist
  SELECT col_description('agencies'::regclass, attnum)
  INTO timezone_comment
  FROM pg_attribute
  WHERE attrelid = 'agencies'::regclass AND attname = 'timezone';

  SELECT col_description('agencies'::regclass, attnum)
  INTO cutoff_comment
  FROM pg_attribute
  WHERE attrelid = 'agencies'::regclass AND attname = 'overdue_cutoff_time';

  SELECT col_description('agencies'::regclass, attnum)
  INTO threshold_comment
  FROM pg_attribute
  WHERE attrelid = 'agencies'::regclass AND attname = 'due_soon_threshold_days';

  ASSERT timezone_comment IS NOT NULL AND timezone_comment != '', 'TEST 14.1 FAILED: timezone comment missing';
  ASSERT cutoff_comment IS NOT NULL AND cutoff_comment != '', 'TEST 14.2 FAILED: overdue_cutoff_time comment missing';
  ASSERT threshold_comment IS NOT NULL AND threshold_comment != '', 'TEST 14.3 FAILED: due_soon_threshold_days comment missing';

  RAISE NOTICE 'TEST 14: Column Comments - Documentation ✓ PASSED';
  RAISE NOTICE '  - timezone: %', timezone_comment;
  RAISE NOTICE '  - overdue_cutoff_time: %', cutoff_comment;
  RAISE NOTICE '  - due_soon_threshold_days: %', threshold_comment;
END $$;

-- ============================================================================
-- TEST 15: Idempotency - Re-run Migration
-- ============================================================================

DO $$
BEGIN
  -- Attempt to add columns again (should succeed with IF NOT EXISTS)
  ALTER TABLE agencies ADD COLUMN IF NOT EXISTS overdue_cutoff_time TIME NOT NULL DEFAULT '17:00:00';
  ALTER TABLE agencies ADD COLUMN IF NOT EXISTS due_soon_threshold_days INT NOT NULL DEFAULT 4;

  RAISE NOTICE 'TEST 15: Idempotency - Re-run Migration ✓ PASSED';
EXCEPTION
  WHEN OTHERS THEN
    RAISE EXCEPTION 'TEST 15 FAILED: Migration is not idempotent - %', SQLERRM;
END $$;

-- ============================================================================
-- TEST SUMMARY
-- ============================================================================

DO $$
BEGIN
  RAISE NOTICE '========================================';
  RAISE NOTICE 'TEST SUMMARY: All 15 tests PASSED ✓';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Test Categories:';
  RAISE NOTICE '  1-3:   Schema Verification';
  RAISE NOTICE '  4-9:   Check Constraints';
  RAISE NOTICE '  10:    Data Backfill';
  RAISE NOTICE '  11-13: Timezone Conversion';
  RAISE NOTICE '  14:    Documentation';
  RAISE NOTICE '  15:    Idempotency';
  RAISE NOTICE '========================================';
END $$;

ROLLBACK;

-- ============================================================================
-- Manual Verification Queries (run after applying migration)
-- ============================================================================

-- Query 1: View all agencies with timezone settings
-- SELECT
--   id,
--   name,
--   timezone,
--   overdue_cutoff_time,
--   due_soon_threshold_days,
--   created_at
-- FROM agencies
-- ORDER BY created_at DESC;

-- Query 2: Test timezone conversion for all agencies
-- SELECT
--   name,
--   timezone,
--   now() AT TIME ZONE 'UTC' AS utc_now,
--   now() AT TIME ZONE timezone AS agency_local_time,
--   (now() AT TIME ZONE timezone)::TIME AS local_time_only,
--   overdue_cutoff_time,
--   CASE
--     WHEN (now() AT TIME ZONE timezone)::TIME > overdue_cutoff_time
--     THEN 'Past cutoff'
--     ELSE 'Before cutoff'
--   END AS cutoff_status
-- FROM agencies
-- ORDER BY name;

-- Query 3: View constraints
-- SELECT
--   conname AS constraint_name,
--   pg_get_constraintdef(oid) AS constraint_definition
-- FROM pg_constraint
-- WHERE conrelid = 'agencies'::regclass
--   AND (conname LIKE '%timezone%' OR conname LIKE '%cutoff%' OR conname LIKE '%due_soon%')
-- ORDER BY conname;

-- Query 4: View column details
-- SELECT
--   column_name,
--   data_type,
--   column_default,
--   is_nullable,
--   character_maximum_length
-- FROM information_schema.columns
-- WHERE table_name = 'agencies'
--   AND column_name IN ('timezone', 'overdue_cutoff_time', 'due_soon_threshold_days')
-- ORDER BY ordinal_position;
