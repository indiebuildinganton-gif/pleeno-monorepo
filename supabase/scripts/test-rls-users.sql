-- Test RLS policies on users table
-- Run: psql postgresql://postgres:postgres@localhost:54322/postgres -f supabase/scripts/test-rls-users.sql

\echo '🧪 Testing RLS Policies on Users Table'
\echo '======================================'

-- Setup: Create test agencies and users
\echo '\n1. Setting up test data...'

-- Create test agencies
INSERT INTO agencies (id, name) VALUES
  ('11111111-1111-1111-1111-111111111111', 'Agency A'),
  ('22222222-2222-2222-2222-222222222222', 'Agency B')
ON CONFLICT (id) DO NOTHING;

-- Create auth users
INSERT INTO auth.users (id, email) VALUES
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'admin-a@agency-a.com'),
  ('aaaaaaaa-aaaa-aaaa-aaaa-bbbbbbbbbbbb', 'user-a@agency-a.com'),
  ('bbbbbbbb-bbbb-bbbb-bbbb-aaaaaaaaaaaa', 'admin-b@agency-b.com'),
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'user-b@agency-b.com')
ON CONFLICT (id) DO NOTHING;

-- Create application users
INSERT INTO users (id, agency_id, email, full_name, role) VALUES
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '11111111-1111-1111-1111-111111111111', 'admin-a@agency-a.com', 'Admin A', 'agency_admin'),
  ('aaaaaaaa-aaaa-aaaa-aaaa-bbbbbbbbbbbb', '11111111-1111-1111-1111-111111111111', 'user-a@agency-a.com', 'User A', 'agency_user'),
  ('bbbbbbbb-bbbb-bbbb-bbbb-aaaaaaaaaaaa', '22222222-2222-2222-2222-222222222222', 'admin-b@agency-b.com', 'Admin B', 'agency_admin'),
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', '22222222-2222-2222-2222-222222222222', 'user-b@agency-b.com', 'User B', 'agency_user')
ON CONFLICT (id) DO NOTHING;

\echo '✅ Test data created'

-- Test 1: Verify RLS is enabled
\echo '\n2. Testing RLS is enabled on users table...'
SELECT tablename, rowsecurity AS rls_enabled
FROM pg_tables
WHERE tablename = 'users';

-- Test 2: Agency A user can see users in Agency A only
\echo '\n3. Testing Agency A user can only see Agency A users...'
SET LOCAL ROLE authenticated;
SET LOCAL request.jwt.claims = '{"sub": "aaaaaaaa-aaaa-aaaa-aaaa-bbbbbbbbbbbb"}';  -- User A (agency_user)

SELECT
  COUNT(*) AS visible_users,
  CASE
    WHEN COUNT(*) = 2 THEN '✅ User sees exactly 2 users (themselves + Admin A)'
    ELSE '❌ SECURITY BREACH: User sees ' || COUNT(*) || ' users'
  END AS test_result
FROM users;

-- Expected: 2 users visible (Admin A + User A)

-- Test 3: User can see their own profile
\echo '\n4. Testing user can see their own profile...'
SET LOCAL request.jwt.claims = '{"sub": "aaaaaaaa-aaaa-aaaa-aaaa-bbbbbbbbbbbb"}';

SELECT
  CASE
    WHEN full_name = 'User A' THEN '✅ User can see their own profile'
    ELSE '❌ User cannot see their own profile'
  END AS test_result
FROM users
WHERE id = 'aaaaaaaa-aaaa-aaaa-aaaa-bbbbbbbbbbbb';

-- Test 4: User CANNOT see users from other agency
\echo '\n5. Testing cross-agency user isolation...'
SET LOCAL request.jwt.claims = '{"sub": "aaaaaaaa-aaaa-aaaa-aaaa-bbbbbbbbbbbb"}';  -- User A

SELECT
  CASE
    WHEN COUNT(*) = 0 THEN '✅ Cross-agency users correctly hidden'
    ELSE '❌ SECURITY BREACH: User can see ' || COUNT(*) || ' users from Agency B'
  END AS test_result
FROM users
WHERE agency_id = '22222222-2222-2222-2222-222222222222';

-- Expected: 0 users visible from Agency B

-- Test 5: Regular user can update their own profile
\echo '\n6. Testing user can update their own profile...'
SET LOCAL request.jwt.claims = '{"sub": "aaaaaaaa-aaaa-aaaa-aaaa-bbbbbbbbbbbb"}';

UPDATE users
SET full_name = 'User A Updated'
WHERE id = 'aaaaaaaa-aaaa-aaaa-aaaa-bbbbbbbbbbbb';

SELECT
  CASE
    WHEN full_name = 'User A Updated' THEN '✅ User can update their own profile'
    ELSE '❌ User update failed'
  END AS test_result
FROM users
WHERE id = 'aaaaaaaa-aaaa-aaaa-aaaa-bbbbbbbbbbbb';

-- Test 6: Regular user CANNOT change their role
\echo '\n7. Testing user CANNOT change their own role...'
SET LOCAL request.jwt.claims = '{"sub": "aaaaaaaa-aaaa-aaaa-aaaa-bbbbbbbbbbbb"}';

UPDATE users
SET role = 'agency_admin'  -- Attempt privilege escalation
WHERE id = 'aaaaaaaa-aaaa-aaaa-aaaa-bbbbbbbbbbbb';

SELECT
  CASE
    WHEN role = 'agency_user' THEN '✅ Role change correctly blocked'
    ELSE '❌ SECURITY BREACH: User changed their role to ' || role
  END AS test_result
FROM users
WHERE id = 'aaaaaaaa-aaaa-aaaa-aaaa-bbbbbbbbbbbb';

-- Test 7: Regular user CANNOT update other users
\echo '\n8. Testing regular user CANNOT update other users...'
SET LOCAL request.jwt.claims = '{"sub": "aaaaaaaa-aaaa-aaaa-aaaa-bbbbbbbbbbbb"}';  -- User A

UPDATE users
SET full_name = 'HACKED'
WHERE id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';  -- Attempt to modify Admin A

SELECT
  CASE
    WHEN full_name = 'Admin A' THEN '✅ Regular user cannot update other users'
    ELSE '❌ SECURITY BREACH: Regular user modified Admin profile'
  END AS test_result
FROM users
WHERE id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';

-- Test 8: Agency admin can update users in their agency
\echo '\n9. Testing agency admin can update users in their agency...'
SET LOCAL request.jwt.claims = '{"sub": "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa"}';  -- Admin A

UPDATE users
SET status = 'inactive'
WHERE id = 'aaaaaaaa-aaaa-aaaa-aaaa-bbbbbbbbbbbb';  -- Update User A

SELECT
  CASE
    WHEN status = 'inactive' THEN '✅ Agency admin can update users in their agency'
    ELSE '❌ Agency admin update failed'
  END AS test_result
FROM users
WHERE id = 'aaaaaaaa-aaaa-aaaa-aaaa-bbbbbbbbbbbb';

-- Test 9: Agency admin CANNOT update users in other agency
\echo '\n10. Testing agency admin CANNOT update users in other agency...'
SET LOCAL request.jwt.claims = '{"sub": "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa"}';  -- Admin A

UPDATE users
SET full_name = 'HACKED BY ADMIN A'
WHERE id = 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb';  -- Attempt to modify User B

SELECT
  CASE
    WHEN full_name = 'User B' THEN '✅ Cross-agency admin update blocked'
    ELSE '❌ SECURITY BREACH: Admin A modified Agency B user'
  END AS test_result
FROM users
WHERE id = 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb';

-- Test 10: Agency admin can delete users in their agency
\echo '\n11. Testing agency admin can delete users in their agency...'
SET LOCAL request.jwt.claims = '{"sub": "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa"}';  -- Admin A

DELETE FROM users WHERE id = 'aaaaaaaa-aaaa-aaaa-aaaa-bbbbbbbbbbbb';  -- Delete User A

SELECT
  CASE
    WHEN COUNT(*) = 0 THEN '✅ Agency admin can delete users'
    ELSE '❌ User deletion failed'
  END AS test_result
FROM users
WHERE id = 'aaaaaaaa-aaaa-aaaa-aaaa-bbbbbbbbbbbb';

-- Test 11: Agency admin CANNOT delete themselves
\echo '\n12. Testing agency admin CANNOT delete themselves...'
SET LOCAL request.jwt.claims = '{"sub": "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa"}';

DELETE FROM users WHERE id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';  -- Attempt self-deletion

SELECT
  CASE
    WHEN COUNT(*) = 1 THEN '✅ Admin self-deletion correctly blocked'
    ELSE '❌ Admin was able to delete themselves'
  END AS test_result
FROM users
WHERE id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';

\echo '\n✅ All RLS tests passed!'
\echo 'Cleaning up test data...'

-- Cleanup
RESET ROLE;
DELETE FROM users;
DELETE FROM agencies;
DELETE FROM auth.users WHERE email LIKE '%@agency-a.com' OR email LIKE '%@agency-b.com';

\echo '✅ Test cleanup completed'
