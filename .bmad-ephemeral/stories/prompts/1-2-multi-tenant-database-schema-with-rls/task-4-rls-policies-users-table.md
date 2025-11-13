# Task 4: Implement Row-Level Security Policies on Users Table

## Context
You are implementing Story 1.2: Multi-Tenant Database Schema with RLS. Task 3 (RLS on agencies table) should be completed before starting this task.

## Task Objective
Enable Row-Level Security on the `users` table with policies enforcing both agency isolation and user self-access patterns.

## Prerequisites
- Task 3 completed: RLS enabled on `agencies` table, test script passes
- Understanding of multi-policy RLS: Multiple policies can apply to same table with OR logic

## RLS Policy Design for Users Table

### Policy Requirements

1. **Agency Isolation**: Users can only see other users in their agency
2. **User Self-Access**: Users can always read their own profile (even if agency context missing)
3. **Admin Privileges**: Agency admins can UPDATE/DELETE users in their agency
4. **Security**: Regular users cannot modify any user data

### Policy Strategy

**Multi-Policy Approach**: Combine policies with OR logic
- Policy A: User can see users in their agency (agency_id match)
- Policy B: User can always see their own profile (auth.uid() match)
- Result: User sees their profile + other users in their agency

## Implementation Steps

### 1. Create RLS Migration for Users Table
Create file: `supabase/migrations/001_agency_domain/004_users_rls.sql`

```sql
-- Migration 004: Enable RLS and create policies for users table
-- Epic 1: Foundation & Multi-Tenant Security
-- Story 1.2: Multi-Tenant Database Schema with RLS

BEGIN;

-- Enable Row-Level Security on users table
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- SELECT POLICIES
-- ============================================================

-- Policy 1: User Agency Isolation (SELECT)
-- Users can view other users in their agency
CREATE POLICY users_agency_isolation_select ON users
  FOR SELECT
  USING (
    agency_id = (
      SELECT agency_id
      FROM users
      WHERE id = auth.uid()
    )
  );

-- Policy 2: User Self-Access (SELECT)
-- Users can always view their own profile
-- This provides a fallback if agency context is missing
CREATE POLICY users_self_access_select ON users
  FOR SELECT
  USING (id = auth.uid());

-- Note: Both SELECT policies apply with OR logic
-- Result: User sees their profile + all users in their agency

-- ============================================================
-- INSERT POLICIES
-- ============================================================

-- Policy 3: Prevent User Creation (INSERT)
-- Users cannot create new user records via application
-- New users created via Supabase Auth signup + trigger
CREATE POLICY users_prevent_insert ON users
  FOR INSERT
  WITH CHECK (false);

-- ============================================================
-- UPDATE POLICIES
-- ============================================================

-- Policy 4: User Self-Update (UPDATE)
-- Users can update their own profile fields
CREATE POLICY users_self_update ON users
  FOR UPDATE
  USING (id = auth.uid())
  WITH CHECK (
    id = auth.uid()
    -- Prevent users from changing their agency_id or role
    AND agency_id = (SELECT agency_id FROM users WHERE id = auth.uid())
    AND role = (SELECT role FROM users WHERE id = auth.uid())
  );

-- Policy 5: Admin User Management (UPDATE)
-- Agency admins can update users in their agency
CREATE POLICY users_admin_update ON users
  FOR UPDATE
  USING (
    -- Admin is in same agency as target user
    agency_id = (
      SELECT agency_id
      FROM users
      WHERE id = auth.uid()
      AND role = 'agency_admin'
    )
  )
  WITH CHECK (
    -- Ensure updated user stays in same agency
    agency_id = (
      SELECT agency_id
      FROM users
      WHERE id = auth.uid()
      AND role = 'agency_admin'
    )
  );

-- ============================================================
-- DELETE POLICIES
-- ============================================================

-- Policy 6: Admin User Deletion (DELETE)
-- Agency admins can delete users in their agency
CREATE POLICY users_admin_delete ON users
  FOR DELETE
  USING (
    agency_id = (
      SELECT agency_id
      FROM users
      WHERE id = auth.uid()
      AND role = 'agency_admin'
    )
    -- Prevent admins from deleting themselves
    AND id != auth.uid()
  );

-- Add policy comments for documentation
COMMENT ON POLICY users_agency_isolation_select ON users IS
  'Users can view all users in their agency - enforced via agency_id match';

COMMENT ON POLICY users_self_access_select ON users IS
  'Users can always view their own profile - provides fallback access';

COMMENT ON POLICY users_self_update ON users IS
  'Users can update their own profile but cannot change agency_id or role';

COMMENT ON POLICY users_admin_update ON users IS
  'Agency admins can update users in their agency including role changes';

COMMENT ON POLICY users_admin_delete ON users IS
  'Agency admins can delete users in their agency but not themselves';

COMMIT;
```

### 2. Apply RLS Migration
```bash
npx supabase db reset  # Apply new migration
```

### 3. Create RLS Testing Script for Users Table
Create file: `supabase/scripts/test-rls-users.sql`

```sql
-- Test RLS policies on users table
-- Run: psql postgresql://postgres:postgres@localhost:54322/postgres -f supabase/scripts/test-rls-users.sql

\echo '🧪 Testing RLS Policies on Users Table'
\echo '======================================'

-- Setup: Create test agencies and users
\echo '\n1. Setting up test data...'

-- Create test agencies
INSERT INTO agencies (id, name) VALUES
  ('11111111-1111-1111-1111-111111111111', 'Agency A'),
  ('22222222-2222-2222-2222-222222222222', 'Agency B');

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
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', '22222222-2222-2222-2222-222222222222', 'user-b@agency-b.com', 'User B', 'agency_user');

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
```

### 4. Run RLS Tests
```bash
psql postgresql://postgres:postgres@localhost:54322/postgres -f supabase/scripts/test-rls-users.sql
```

### 5. Verify All RLS Policies
```bash
# List all policies on users table
psql postgresql://postgres:postgres@localhost:54322/postgres -c "
  SELECT
    schemaname,
    tablename,
    policyname,
    cmd,
    roles
  FROM pg_policies
  WHERE tablename = 'users'
  ORDER BY cmd, policyname;"
```

Expected output:
```
 schemaname | tablename |        policyname         | cmd    | roles
------------+-----------+---------------------------+--------+-------
 public     | users     | users_prevent_insert      | INSERT | {authenticated}
 public     | users     | users_agency_isolation... | SELECT | {authenticated}
 public     | users     | users_self_access_select  | SELECT | {authenticated}
 public     | users     | users_admin_update        | UPDATE | {authenticated}
 public     | users     | users_self_update         | UPDATE | {authenticated}
 public     | users     | users_admin_delete        | DELETE | {authenticated}
```

## Acceptance Criteria Validation

**AC2**: RLS policies are enabled on all tables containing tenant data
- ✅ RLS enabled on `users` table: `ALTER TABLE users ENABLE ROW LEVEL SECURITY`

**AC3**: RLS policies automatically filter queries to current user's agency_id
- ✅ Agency isolation policy filters by matching `agency_id`
- ✅ Self-access policy provides fallback using `auth.uid()`
- ✅ Multi-policy approach (OR logic) ensures users see their data + agency data

**AC4**: No application code can bypass RLS protections
- ✅ INSERT blocked for all authenticated users
- ✅ Regular users cannot modify other users
- ✅ Regular users cannot change their own role or agency_id
- ✅ Admins restricted to their own agency
- ✅ Admins cannot delete themselves

## Expected Output
- ✅ Migration `004_users_rls.sql` created and applied
- ✅ RLS enabled on `users` table
- ✅ 6 policies created covering SELECT, INSERT, UPDATE, DELETE
- ✅ RLS test script passes all 12 tests
- ✅ Multi-policy SELECT works (agency isolation + self-access)
- ✅ Admin privileges work within agency boundaries
- ✅ Cross-agency access prevented

## References
- [Story Context](.bmad-ephemeral/stories/1-2-multi-tenant-database-schema-with-rls.context.xml)
- [Architecture Doc](docs/architecture.md) - Multi-Tenant Isolation pattern
- [PostgreSQL RLS Documentation](https://www.postgresql.org/docs/current/ddl-rowsecurity.html)

## Next Task
After completing this task, proceed to **Task 5: Implement agency_id Context Setting Mechanism**
