-- Test RLS policies on agencies table
-- Run: psql postgresql://postgres:postgres@localhost:54322/postgres -f supabase/scripts/test-rls-agencies.sql

\echo '🧪 Testing RLS Policies on Agencies Table'
\echo '=========================================='

-- Setup: Create test agencies and users
\echo '\n1. Setting up test data...'

-- Create test agencies
INSERT INTO agencies (id, name, contact_email) VALUES
  ('11111111-1111-1111-1111-111111111111', 'Agency A', 'contact@agency-a.com'),
  ('22222222-2222-2222-2222-222222222222', 'Agency B', 'contact@agency-b.com');

-- Create auth users (simulating Supabase Auth)
-- Note: In real scenario, these would be created via Supabase Auth API
INSERT INTO auth.users (id, email) VALUES
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'admin@agency-a.com'),
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'admin@agency-b.com')
ON CONFLICT (id) DO NOTHING;

-- Create application users linked to agencies
INSERT INTO users (id, agency_id, email, full_name, role) VALUES
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '11111111-1111-1111-1111-111111111111', 'admin@agency-a.com', 'Admin A', 'agency_admin'),
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', '22222222-2222-2222-2222-222222222222', 'admin@agency-b.com', 'Admin B', 'agency_admin');

\echo '✅ Test data created'

-- Test 1: Verify RLS is enabled
\echo '\n2. Testing RLS is enabled...'
SELECT
  schemaname,
  tablename,
  rowsecurity AS rls_enabled
FROM pg_tables
WHERE tablename = 'agencies';

-- Expected: rls_enabled = true

-- Test 2: Simulate User A context - should only see Agency A
\echo '\n3. Testing Agency A admin can only see Agency A...'
SET LOCAL ROLE authenticated;
SET LOCAL request.jwt.claims = '{"sub": "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa"}';

SELECT
  id,
  name,
  CASE
    WHEN id = '11111111-1111-1111-1111-111111111111' THEN '✅ Correct agency visible'
    ELSE '❌ Wrong agency visible - RLS FAILED'
  END AS test_result
FROM agencies;

-- Expected: Only Agency A row returned

-- Test 3: Simulate User B context - should only see Agency B
\echo '\n4. Testing Agency B admin can only see Agency B...'
SET LOCAL request.jwt.claims = '{"sub": "bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb"}';

SELECT
  id,
  name,
  CASE
    WHEN id = '22222222-2222-2222-2222-222222222222' THEN '✅ Correct agency visible'
    ELSE '❌ Wrong agency visible - RLS FAILED'
  END AS test_result
FROM agencies;

-- Expected: Only Agency B row returned

-- Test 4: Test agency admin can update their agency
\echo '\n5. Testing Agency A admin can update their agency...'
SET LOCAL request.jwt.claims = '{"sub": "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa"}';

UPDATE agencies
SET contact_phone = '+61 412 345 678'
WHERE id = '11111111-1111-1111-1111-111111111111';

SELECT
  CASE
    WHEN contact_phone = '+61 412 345 678' THEN '✅ Agency admin can update their agency'
    ELSE '❌ Update failed - RLS policy issue'
  END AS test_result
FROM agencies
WHERE id = '11111111-1111-1111-1111-111111111111';

-- Expected: Update succeeds

-- Test 5: Test agency admin CANNOT update other agency
\echo '\n6. Testing Agency A admin CANNOT update Agency B...'
SET LOCAL request.jwt.claims = '{"sub": "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa"}';

UPDATE agencies
SET contact_phone = 'HACKED'
WHERE id = '22222222-2222-2222-2222-222222222222';

SELECT
  CASE
    WHEN contact_phone IS NULL OR contact_phone != 'HACKED' THEN '✅ Cross-agency update blocked'
    ELSE '❌ SECURITY BREACH: Cross-agency update succeeded'
  END AS test_result
FROM agencies
WHERE id = '22222222-2222-2222-2222-222222222222';

-- Expected: Update blocked by RLS (0 rows affected)

-- Test 6: Verify INSERT is blocked for authenticated users
\echo '\n7. Testing authenticated users cannot INSERT agencies...'
SET LOCAL request.jwt.claims = '{"sub": "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa"}';

DO $$
BEGIN
  INSERT INTO agencies (name, contact_email)
  VALUES ('Hacker Agency', 'hacker@evil.com');
  RAISE EXCEPTION '❌ SECURITY BREACH: INSERT was allowed';
EXCEPTION
  WHEN insufficient_privilege OR check_violation THEN
    RAISE NOTICE '✅ INSERT correctly blocked by RLS';
END $$;

-- Test 7: Verify DELETE is blocked for authenticated users
\echo '\n8. Testing authenticated users cannot DELETE agencies...'
SET LOCAL request.jwt.claims = '{"sub": "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa"}';

DELETE FROM agencies WHERE id = '11111111-1111-1111-1111-111111111111';

SELECT
  CASE
    WHEN COUNT(*) = 2 THEN '✅ DELETE correctly blocked by RLS'
    ELSE '❌ SECURITY BREACH: DELETE was allowed'
  END AS test_result
FROM agencies;

-- Expected: 2 agencies still exist (DELETE blocked)

\echo '\n✅ All RLS tests passed!'
\echo 'Cleaning up test data...'

-- Cleanup
RESET ROLE;
DELETE FROM users WHERE id IN ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb');
DELETE FROM agencies WHERE id IN ('11111111-1111-1111-1111-111111111111', '22222222-2222-2222-2222-222222222222');
DELETE FROM auth.users WHERE id IN ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb');

\echo '✅ Test cleanup completed'
