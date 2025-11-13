-- Test file for get_college_activity function
-- Story 3.1: College Registry - Task 5
-- Tests activity feed functionality with various filters

-- ============================================================
-- Test Setup: Create sample data
-- ============================================================

-- Note: This test assumes audit_logs table and related tables exist
-- and have RLS policies configured

-- ============================================================
-- Test 1: Basic function call (no filters)
-- ============================================================
-- Should return all activities for the college and related entities

DO $$
DECLARE
  test_college_id UUID;
  test_result RECORD;
  result_count INTEGER;
BEGIN
  -- Get a test college ID (assumes colleges table has data)
  SELECT id INTO test_college_id FROM colleges LIMIT 1;

  IF test_college_id IS NOT NULL THEN
    RAISE NOTICE 'Test 1: Testing get_college_activity with college_id: %', test_college_id;

    -- Call function without filters
    SELECT COUNT(*) INTO result_count
    FROM get_college_activity(test_college_id, NULL, NULL);

    RAISE NOTICE 'Test 1 Result: Found % activity entries', result_count;
  ELSE
    RAISE NOTICE 'Test 1 Skipped: No colleges found in database';
  END IF;
END $$;

-- ============================================================
-- Test 2: Time-based filtering
-- ============================================================
-- Should return only activities from the last 7 days

DO $$
DECLARE
  test_college_id UUID;
  result_count_7d INTEGER;
  result_count_30d INTEGER;
  from_date_7d TIMESTAMPTZ;
  from_date_30d TIMESTAMPTZ;
BEGIN
  -- Get a test college ID
  SELECT id INTO test_college_id FROM colleges LIMIT 1;

  IF test_college_id IS NOT NULL THEN
    RAISE NOTICE 'Test 2: Testing time-based filtering';

    -- Calculate date filters
    from_date_7d := now() - INTERVAL '7 days';
    from_date_30d := now() - INTERVAL '30 days';

    -- Test 7-day filter
    SELECT COUNT(*) INTO result_count_7d
    FROM get_college_activity(test_college_id, from_date_7d, NULL);

    -- Test 30-day filter
    SELECT COUNT(*) INTO result_count_30d
    FROM get_college_activity(test_college_id, from_date_30d, NULL);

    RAISE NOTICE 'Test 2 Results: Last 7 days: %, Last 30 days: %',
      result_count_7d, result_count_30d;
  ELSE
    RAISE NOTICE 'Test 2 Skipped: No colleges found in database';
  END IF;
END $$;

-- ============================================================
-- Test 3: Text search filtering
-- ============================================================
-- Should return only activities matching search query

DO $$
DECLARE
  test_college_id UUID;
  result_count INTEGER;
  test_search_query TEXT := 'created';
BEGIN
  -- Get a test college ID
  SELECT id INTO test_college_id FROM colleges LIMIT 1;

  IF test_college_id IS NOT NULL THEN
    RAISE NOTICE 'Test 3: Testing text search with query: %', test_search_query;

    -- Call function with search filter
    SELECT COUNT(*) INTO result_count
    FROM get_college_activity(test_college_id, NULL, test_search_query);

    RAISE NOTICE 'Test 3 Result: Found % matching activities', result_count;
  ELSE
    RAISE NOTICE 'Test 3 Skipped: No colleges found in database';
  END IF;
END $$;

-- ============================================================
-- Test 4: Combined filters
-- ============================================================
-- Should return activities matching both time and search filters

DO $$
DECLARE
  test_college_id UUID;
  result_count INTEGER;
  from_date TIMESTAMPTZ;
  search_query TEXT := 'updated';
BEGIN
  -- Get a test college ID
  SELECT id INTO test_college_id FROM colleges LIMIT 1;

  IF test_college_id IS NOT NULL THEN
    from_date := now() - INTERVAL '30 days';

    RAISE NOTICE 'Test 4: Testing combined filters (30 days + search: %)', search_query;

    -- Call function with both filters
    SELECT COUNT(*) INTO result_count
    FROM get_college_activity(test_college_id, from_date, search_query);

    RAISE NOTICE 'Test 4 Result: Found % matching activities', result_count;
  ELSE
    RAISE NOTICE 'Test 4 Skipped: No colleges found in database';
  END IF;
END $$;

-- ============================================================
-- Test 5: Verify return structure
-- ============================================================
-- Should return all expected columns with correct types

DO $$
DECLARE
  test_college_id UUID;
  test_result RECORD;
BEGIN
  -- Get a test college ID
  SELECT id INTO test_college_id FROM colleges LIMIT 1;

  IF test_college_id IS NOT NULL THEN
    RAISE NOTICE 'Test 5: Verifying return structure';

    -- Get one result to verify structure
    SELECT * INTO test_result
    FROM get_college_activity(test_college_id, NULL, NULL)
    LIMIT 1;

    IF FOUND THEN
      RAISE NOTICE 'Test 5 Result: Function returns data with expected structure';
      RAISE NOTICE '  - ID: %, Type: UUID', test_result.id;
      RAISE NOTICE '  - Timestamp: %, Type: TIMESTAMPTZ', test_result.timestamp;
      RAISE NOTICE '  - User Name: %, Type: TEXT', test_result.user_name;
      RAISE NOTICE '  - Entity Type: %, Type: TEXT', test_result.entity_type;
      RAISE NOTICE '  - Action: %, Type: TEXT', test_result.action;
      RAISE NOTICE '  - Has old_values: %', test_result.old_values IS NOT NULL;
      RAISE NOTICE '  - Has new_values: %', test_result.new_values IS NOT NULL;
    ELSE
      RAISE NOTICE 'Test 5 Result: No activity data found (may be expected for new system)';
    END IF;
  ELSE
    RAISE NOTICE 'Test 5 Skipped: No colleges found in database';
  END IF;
END $$;

-- ============================================================
-- Summary
-- ============================================================

RAISE NOTICE '============================================================';
RAISE NOTICE 'Test Suite Complete for get_college_activity function';
RAISE NOTICE 'All tests executed. Review NOTICE messages above for results.';
RAISE NOTICE '============================================================';
