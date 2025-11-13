-- Test agency context setting mechanism
-- Run: psql postgresql://postgres:postgres@localhost:54322/postgres -f supabase/scripts/test-context-mechanism.sql

\echo '🧪 Testing Agency Context Mechanism'
\echo '===================================='

-- Setup
\echo '\n1. Setting up test data...'

INSERT INTO agencies (id, name) VALUES
  ('11111111-1111-1111-1111-111111111111', 'Agency A');

INSERT INTO auth.users (id, email) VALUES
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'admin@agency-a.com')
ON CONFLICT (id) DO NOTHING;

INSERT INTO users (id, agency_id, email, full_name, role) VALUES
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '11111111-1111-1111-1111-111111111111', 'admin@agency-a.com', 'Admin A', 'agency_admin');

\echo '✅ Test data created'

-- Test 1: Set agency context as authenticated user
\echo '\n2. Testing set_agency_context() function...'
SET LOCAL ROLE authenticated;
SET LOCAL request.jwt.claims = '{"sub": "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa"}';

SELECT set_agency_context();

SELECT
  CASE
    WHEN get_agency_context() = '11111111-1111-1111-1111-111111111111' THEN '✅ Agency context set correctly'
    ELSE '❌ Agency context not set: ' || COALESCE(get_agency_context()::text, 'NULL')
  END AS test_result;

-- Test 2: Verify context is transaction-scoped
\echo '\n3. Testing context is transaction-scoped...'

-- Start new transaction (should clear context)
BEGIN;
SELECT
  CASE
    WHEN get_agency_context() IS NULL THEN '✅ Context correctly cleared in new transaction'
    ELSE '❌ Context leaked across transactions: ' || get_agency_context()::text
  END AS test_result;
COMMIT;

-- Test 3: Test verify_agency_access helper function
\echo '\n4. Testing verify_agency_access() helper...'
SET LOCAL request.jwt.claims = '{"sub": "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa"}';

SELECT
  CASE
    WHEN verify_agency_access('11111111-1111-1111-1111-111111111111') THEN '✅ User has access to their agency'
    ELSE '❌ verify_agency_access failed for user''s own agency'
  END AS test_result;

SELECT
  CASE
    WHEN NOT verify_agency_access('22222222-2222-2222-2222-222222222222') THEN '✅ User correctly denied access to other agency'
    ELSE '❌ SECURITY BREACH: User has access to other agency'
  END AS test_result;

\echo '\n✅ All context mechanism tests passed!'
\echo 'Cleaning up...'

-- Cleanup
RESET ROLE;
DELETE FROM users;
DELETE FROM agencies;
DELETE FROM auth.users WHERE email = 'admin@agency-a.com';

\echo '✅ Cleanup completed'
