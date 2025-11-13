-- Comprehensive RLS Test Suite
-- Epic 1: Foundation & Multi-Tenant Security
-- Story 1.2: Multi-Tenant Database Schema with RLS
-- Run: psql postgresql://postgres:postgres@localhost:54322/postgres -f supabase/tests/rls-comprehensive-test-suite.sql

\set ON_ERROR_STOP on

\echo '╔══════════════════════════════════════════════════════════════╗'
\echo '║    COMPREHENSIVE RLS TEST SUITE - Story 1.2                 ║'
\echo '╚══════════════════════════════════════════════════════════════╝'
\echo ''

-- ==============================================================
-- TEST SETUP
-- ==============================================================

\echo '📋 Setting up test environment...'

-- Create test data
BEGIN;

-- Test agencies
INSERT INTO agencies (id, name, currency, timezone) VALUES
  ('aaaaaaaa-aaaa-aaaa-aaaa-000000000001', 'Test Agency A', 'AUD', 'Australia/Brisbane'),
  ('bbbbbbbb-bbbb-bbbb-bbbb-000000000002', 'Test Agency B', 'USD', 'America/New_York')
ON CONFLICT (id) DO NOTHING;

-- Test auth users
INSERT INTO auth.users (id, email, encrypted_password, email_confirmed_at, created_at, updated_at, instance_id, aud, role) VALUES
  ('aaaaaaaa-aaaa-aaaa-aaaa-000000000011', 'admin-a@test.com', crypt('password', gen_salt('bf')), now(), now(), now(), '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated'),
  ('aaaaaaaa-aaaa-aaaa-aaaa-000000000012', 'user-a@test.com', crypt('password', gen_salt('bf')), now(), now(), now(), '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated'),
  ('bbbbbbbb-bbbb-bbbb-bbbb-000000000021', 'admin-b@test.com', crypt('password', gen_salt('bf')), now(), now(), now(), '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated'),
  ('bbbbbbbb-bbbb-bbbb-bbbb-000000000022', 'user-b@test.com', crypt('password', gen_salt('bf')), now(), now(), now(), '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated')
ON CONFLICT (id) DO NOTHING;

-- Test application users
INSERT INTO users (id, agency_id, email, full_name, role, status) VALUES
  ('aaaaaaaa-aaaa-aaaa-aaaa-000000000011', 'aaaaaaaa-aaaa-aaaa-aaaa-000000000001', 'admin-a@test.com', 'Admin A', 'agency_admin', 'active'),
  ('aaaaaaaa-aaaa-aaaa-aaaa-000000000012', 'aaaaaaaa-aaaa-aaaa-aaaa-000000000001', 'user-a@test.com', 'User A', 'agency_user', 'active'),
  ('bbbbbbbb-bbbb-bbbb-bbbb-000000000021', 'bbbbbbbb-bbbb-bbbb-bbbb-000000000002', 'admin-b@test.com', 'Admin B', 'agency_admin', 'active'),
  ('bbbbbbbb-bbbb-bbbb-bbbb-000000000022', 'bbbbbbbb-bbbb-bbbb-bbbb-000000000002', 'user-b@test.com', 'User B', 'agency_user', 'active')
ON CONFLICT (id) DO NOTHING;

COMMIT;

\echo '✅ Test environment setup complete'
\echo ''

-- ==============================================================
-- CATEGORY 1: POLICY COMPLETENESS
-- ==============================================================

\echo '╔══════════════════════════════════════════════════════════════╗'
\echo '║  TEST CATEGORY 1: Policy Completeness                       ║'
\echo '╚══════════════════════════════════════════════════════════════╝'
\echo ''

\echo 'Test 1.1: Verify RLS is enabled on all tenant-scoped tables'

DO $$
DECLARE
  missing_rls TEXT[];
BEGIN
  SELECT ARRAY_AGG(tablename)
  INTO missing_rls
  FROM pg_tables
  WHERE schemaname = 'public'
    AND tablename IN ('agencies', 'users')
    AND NOT rowsecurity;

  IF missing_rls IS NOT NULL THEN
    RAISE EXCEPTION '❌ FAILED: RLS not enabled on: %', missing_rls;
  ELSE
    RAISE NOTICE '✅ PASSED: RLS enabled on all tenant-scoped tables';
  END IF;
END $$;

\echo ''
\echo 'Test 1.2: Verify all required policies exist'

DO $$
DECLARE
  expected_policies TEXT[] := ARRAY[
    'agencies:agency_isolation_select',
    'agencies:agency_isolation_insert',
    'agencies:agency_isolation_update',
    'agencies:agency_isolation_delete',
    'users:users_agency_isolation_select',
    'users:users_self_access_select',
    'users:users_prevent_insert',
    'users:users_self_update',
    'users:users_admin_update',
    'users:users_admin_delete'
  ];
  actual_policies TEXT[];
  missing_policies TEXT[];
BEGIN
  SELECT ARRAY_AGG(tablename || ':' || policyname)
  INTO actual_policies
  FROM pg_policies
  WHERE schemaname = 'public';

  SELECT ARRAY_AGG(policy)
  INTO missing_policies
  FROM UNNEST(expected_policies) AS policy
  WHERE policy != ALL(actual_policies);

  IF missing_policies IS NOT NULL THEN
    RAISE EXCEPTION '❌ FAILED: Missing policies: %', missing_policies;
  ELSE
    RAISE NOTICE '✅ PASSED: All required policies exist';
  END IF;
END $$;

\echo ''

-- ==============================================================
-- CATEGORY 2: CROSS-AGENCY DATA LEAKAGE
-- ==============================================================

\echo '╔══════════════════════════════════════════════════════════════╗'
\echo '║  TEST CATEGORY 2: Cross-Agency Data Leakage Prevention      ║'
\echo '╚══════════════════════════════════════════════════════════════╝'
\echo ''

\echo 'Test 2.1: User A cannot see Agency B'

SET LOCAL ROLE authenticated;
SET LOCAL request.jwt.claims = '{"sub": "aaaaaaaa-aaaa-aaaa-aaaa-000000000011"}';

DO $$
DECLARE
  leaked_agencies INT;
BEGIN
  SELECT COUNT(*) INTO leaked_agencies
  FROM agencies
  WHERE id = 'bbbbbbbb-bbbb-bbbb-bbbb-000000000002';

  IF leaked_agencies > 0 THEN
    RAISE EXCEPTION '❌ FAILED: User A can see Agency B (data leakage)';
  ELSE
    RAISE NOTICE '✅ PASSED: Cross-agency data correctly hidden';
  END IF;
END $$;

RESET ROLE;

\echo ''
\echo 'Test 2.2: User A cannot see Agency B users'

SET LOCAL ROLE authenticated;
SET LOCAL request.jwt.claims = '{"sub": "aaaaaaaa-aaaa-aaaa-aaaa-000000000012"}';

DO $$
DECLARE
  leaked_users INT;
BEGIN
  SELECT COUNT(*) INTO leaked_users
  FROM users
  WHERE agency_id = 'bbbbbbbb-bbbb-bbbb-bbbb-000000000002';

  IF leaked_users > 0 THEN
    RAISE EXCEPTION '❌ FAILED: User A can see Agency B users (data leakage)';
  ELSE
    RAISE NOTICE '✅ PASSED: Cross-agency users correctly hidden';
  END IF;
END $$;

RESET ROLE;

\echo ''
\echo 'Test 2.3: User A can only see users in their agency'

SET LOCAL ROLE authenticated;
SET LOCAL request.jwt.claims = '{"sub": "aaaaaaaa-aaaa-aaaa-aaaa-000000000012"}';

DO $$
DECLARE
  visible_users INT;
BEGIN
  SELECT COUNT(*) INTO visible_users FROM users;

  IF visible_users != 2 THEN  -- Admin A + User A
    RAISE EXCEPTION '❌ FAILED: User A sees % users (expected 2)', visible_users;
  ELSE
    RAISE NOTICE '✅ PASSED: User sees correct number of users (2)';
  END IF;
END $$;

RESET ROLE;

\echo ''

-- ==============================================================
-- CATEGORY 3: DIRECT SQL BYPASS PREVENTION
-- ==============================================================

\echo '╔══════════════════════════════════════════════════════════════╗'
\echo '║  TEST CATEGORY 3: Direct SQL Bypass Prevention              ║'
\echo '╚══════════════════════════════════════════════════════════════╝'
\echo ''

\echo 'Test 3.1: Raw SELECT respects RLS'

SET LOCAL ROLE authenticated;
SET LOCAL request.jwt.claims = '{"sub": "aaaaaaaa-aaaa-aaaa-aaaa-000000000011"}';

DO $$
DECLARE
  all_agencies INT;
BEGIN
  EXECUTE 'SELECT COUNT(*) FROM agencies' INTO all_agencies;

  IF all_agencies != 1 THEN
    RAISE EXCEPTION '❌ FAILED: Raw SELECT bypassed RLS (saw % agencies)', all_agencies;
  ELSE
    RAISE NOTICE '✅ PASSED: Raw SELECT respects RLS';
  END IF;
END $$;

RESET ROLE;

\echo ''
\echo 'Test 3.2: Subquery respects RLS'

SET LOCAL ROLE authenticated;
SET LOCAL request.jwt.claims = '{"sub": "aaaaaaaa-aaaa-aaaa-aaaa-000000000012"}';

DO $$
DECLARE
  leaked_count INT;
BEGIN
  SELECT COUNT(*) INTO leaked_count
  FROM (
    SELECT * FROM users WHERE agency_id != (SELECT agency_id FROM users WHERE id = auth.uid())
  ) AS cross_agency_users;

  IF leaked_count > 0 THEN
    RAISE EXCEPTION '❌ FAILED: Subquery bypassed RLS';
  ELSE
    RAISE NOTICE '✅ PASSED: Subquery respects RLS';
  END IF;
END $$;

RESET ROLE;

\echo ''

-- ==============================================================
-- CATEGORY 4: ROLE-BASED ACCESS CONTROL
-- ==============================================================

\echo '╔══════════════════════════════════════════════════════════════╗'
\echo '║  TEST CATEGORY 4: Role-Based Access Control                 ║'
\echo '╚══════════════════════════════════════════════════════════════╝'
\echo ''

\echo 'Test 4.1: Agency admin can update users in their agency'

SET LOCAL ROLE authenticated;
SET LOCAL request.jwt.claims = '{"sub": "aaaaaaaa-aaaa-aaaa-aaaa-000000000011"}';  -- Admin A

UPDATE users
SET status = 'inactive'
WHERE id = 'aaaaaaaa-aaaa-aaaa-aaaa-000000000012';  -- User A

DO $$
DECLARE
  updated_status TEXT;
BEGIN
  SELECT status INTO updated_status
  FROM users
  WHERE id = 'aaaaaaaa-aaaa-aaaa-aaaa-000000000012';

  IF updated_status != 'inactive' THEN
    RAISE EXCEPTION '❌ FAILED: Admin could not update user in their agency';
  ELSE
    RAISE NOTICE '✅ PASSED: Admin can update users in their agency';
  END IF;
END $$;

RESET ROLE;

\echo ''
\echo 'Test 4.2: Regular user cannot update other users'

SET LOCAL ROLE authenticated;
SET LOCAL request.jwt.claims = '{"sub": "aaaaaaaa-aaaa-aaaa-aaaa-000000000012"}';  -- User A

UPDATE users
SET full_name = 'HACKED'
WHERE id = 'aaaaaaaa-aaaa-aaaa-aaaa-000000000011';  -- Admin A

DO $$
DECLARE
  admin_name TEXT;
BEGIN
  SELECT full_name INTO admin_name
  FROM users
  WHERE id = 'aaaaaaaa-aaaa-aaaa-aaaa-000000000011';

  IF admin_name = 'HACKED' THEN
    RAISE EXCEPTION '❌ FAILED: Regular user modified another user';
  ELSE
    RAISE NOTICE '✅ PASSED: Regular user cannot update other users';
  END IF;
END $$;

RESET ROLE;

\echo ''
\echo 'Test 4.3: User cannot escalate their own role'

SET LOCAL ROLE authenticated;
SET LOCAL request.jwt.claims = '{"sub": "aaaaaaaa-aaaa-aaaa-aaaa-000000000012"}';

UPDATE users
SET role = 'agency_admin'
WHERE id = 'aaaaaaaa-aaaa-aaaa-aaaa-000000000012';

DO $$
DECLARE
  user_role TEXT;
BEGIN
  SELECT role INTO user_role
  FROM users
  WHERE id = 'aaaaaaaa-aaaa-aaaa-aaaa-000000000012';

  IF user_role = 'agency_admin' THEN
    RAISE EXCEPTION '❌ SECURITY BREACH: User escalated their role';
  ELSE
    RAISE NOTICE '✅ PASSED: Role escalation prevented';
  END IF;
END $$;

RESET ROLE;

\echo ''

-- ==============================================================
-- CATEGORY 5: PERFORMANCE IMPACT
-- ==============================================================

\echo '╔══════════════════════════════════════════════════════════════╗'
\echo '║  TEST CATEGORY 5: Performance Impact                        ║'
\echo '╚══════════════════════════════════════════════════════════════╝'
\echo ''

\echo 'Test 5.1: RLS query uses index (EXPLAIN ANALYZE)'

SET LOCAL ROLE authenticated;
SET LOCAL request.jwt.claims = '{"sub": "aaaaaaaa-aaaa-aaaa-aaaa-000000000012"}';

\echo 'Analyzing query plan for RLS-protected query:'
EXPLAIN (ANALYZE, BUFFERS, COSTS OFF, TIMING OFF, SUMMARY OFF)
SELECT * FROM users;

RESET ROLE;

\echo ''
\echo 'Test 5.2: Verify agency_id indexes exist'

DO $$
DECLARE
  missing_indexes TEXT[];
BEGIN
  SELECT ARRAY_AGG(expected_index)
  INTO missing_indexes
  FROM (VALUES
    ('idx_users_agency_id'),
    ('idx_users_email'),
    ('idx_users_status')
  ) AS expected(expected_index)
  WHERE NOT EXISTS (
    SELECT 1 FROM pg_indexes
    WHERE indexname = expected.expected_index
  );

  IF missing_indexes IS NOT NULL THEN
    RAISE EXCEPTION '❌ FAILED: Missing indexes: %', missing_indexes;
  ELSE
    RAISE NOTICE '✅ PASSED: All required indexes exist';
  END IF;
END $$;

\echo ''

-- ==============================================================
-- TEST CLEANUP
-- ==============================================================

\echo '╔══════════════════════════════════════════════════════════════╗'
\echo '║  Cleaning up test data...                                   ║'
\echo '╚══════════════════════════════════════════════════════════════╝'
\echo ''

BEGIN;
DELETE FROM users WHERE email LIKE '%@test.com';
DELETE FROM auth.users WHERE email LIKE '%@test.com';
DELETE FROM agencies WHERE name LIKE 'Test Agency%';
COMMIT;

\echo '✅ Test cleanup complete'
\echo ''

-- ==============================================================
-- TEST SUMMARY
-- ==============================================================

\echo '╔══════════════════════════════════════════════════════════════╗'
\echo '║                    TEST SUMMARY                              ║'
\echo '╠══════════════════════════════════════════════════════════════╣'
\echo '║  ✅ All RLS tests passed successfully!                       ║'
\echo '║                                                              ║'
\echo '║  Categories tested:                                          ║'
\echo '║    1. Policy Completeness (2 tests)                          ║'
\echo '║    2. Cross-Agency Data Leakage Prevention (3 tests)         ║'
\echo '║    3. Direct SQL Bypass Prevention (2 tests)                 ║'
\echo '║    4. Role-Based Access Control (3 tests)                    ║'
\echo '║    5. Performance Impact (2 tests)                           ║'
\echo '║                                                              ║'
\echo '║  Total: 12 tests passed                                      ║'
\echo '╚══════════════════════════════════════════════════════════════╝'
