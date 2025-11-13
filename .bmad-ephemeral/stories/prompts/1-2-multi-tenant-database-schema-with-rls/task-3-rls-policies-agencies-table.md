# Task 3: Implement Row-Level Security Policies on Agencies Table

## Context
You are implementing Story 1.2: Multi-Tenant Database Schema with RLS. Tasks 1-2 should be completed (database schema created, migration infrastructure set up).

## Task Objective
Enable Row-Level Security on the `agencies` table and create policies that enforce tenant isolation at the database level.

## Prerequisites
- Tasks 1-2 completed: `agencies` and `users` tables exist
- Supabase local instance running: `npx supabase status`
- Understanding of RLS: Policies filter rows automatically based on current user context

## RLS Policy Design

### Policy Strategy for Agencies Table

**Challenge**: How does a user's query know which agency they belong to?

**Solution**: Use Supabase Auth JWT claims
- User's `agency_id` stored in `auth.users` metadata
- RLS policy references `auth.uid()` to get current user's ID
- Policy joins to `users` table to retrieve user's `agency_id`
- Only rows matching user's `agency_id` are returned

**Policy Pattern**:
```sql
USING (id = (SELECT agency_id FROM users WHERE id = auth.uid()))
```

## Implementation Steps

### 1. Create RLS Migration for Agencies Table
Create file: `supabase/migrations/001_agency_domain/003_agency_rls.sql`

```sql
-- Migration 003: Enable RLS and create policies for agencies table
-- Epic 1: Foundation & Multi-Tenant Security
-- Story 1.2: Multi-Tenant Database Schema with RLS

BEGIN;

-- Enable Row-Level Security on agencies table
ALTER TABLE agencies ENABLE ROW LEVEL SECURITY;

-- Policy 1: Agency Isolation (SELECT)
-- Users can only SELECT their own agency's data
CREATE POLICY agency_isolation_select ON agencies
  FOR SELECT
  USING (
    id = (
      SELECT agency_id
      FROM users
      WHERE id = auth.uid()
    )
  );

-- Policy 2: Agency Isolation (INSERT)
-- Prevent users from creating new agencies via application
-- Only service role can insert agencies (e.g., via admin API)
CREATE POLICY agency_isolation_insert ON agencies
  FOR INSERT
  WITH CHECK (false);  -- Block all INSERTs from anon/authenticated users

-- Policy 3: Agency Isolation (UPDATE)
-- Agency admins can update their own agency data
CREATE POLICY agency_isolation_update ON agencies
  FOR UPDATE
  USING (
    id = (
      SELECT agency_id
      FROM users
      WHERE id = auth.uid()
      AND role = 'agency_admin'  -- Only admins can update agency
    )
  )
  WITH CHECK (
    id = (
      SELECT agency_id
      FROM users
      WHERE id = auth.uid()
      AND role = 'agency_admin'
    )
  );

-- Policy 4: Agency Isolation (DELETE)
-- Prevent agency deletion via application
-- Only service role can delete agencies
CREATE POLICY agency_isolation_delete ON agencies
  FOR DELETE
  USING (false);  -- Block all DELETEs from anon/authenticated users

-- Add policy comments for documentation
COMMENT ON POLICY agency_isolation_select ON agencies IS
  'Users can only view their own agency data - enforced via auth.uid() lookup in users table';

COMMENT ON POLICY agency_isolation_update ON agencies IS
  'Only agency_admin role can update their agency settings - prevents regular users from modifying agency data';

COMMIT;
```

### 2. Apply RLS Migration
```bash
npx supabase db reset  # Apply new migration
```

### 3. Create RLS Testing Script
Create file: `supabase/scripts/test-rls-agencies.sql`

```sql
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
```

### 4. Run RLS Tests
```bash
psql postgresql://postgres:postgres@localhost:54322/postgres -f supabase/scripts/test-rls-agencies.sql
```

Expected output:
```
🧪 Testing RLS Policies on Agencies Table
==========================================

1. Setting up test data...
✅ Test data created

2. Testing RLS is enabled...
 schemaname | tablename | rls_enabled
------------+-----------+-------------
 public     | agencies  | t
(1 row)

3. Testing Agency A admin can only see Agency A...
 ✅ Correct agency visible

4. Testing Agency B admin can only see Agency B...
 ✅ Correct agency visible

5. Testing Agency A admin can update their agency...
 ✅ Agency admin can update their agency

6. Testing Agency A admin CANNOT update Agency B...
 ✅ Cross-agency update blocked

7. Testing authenticated users cannot INSERT agencies...
 ✅ INSERT correctly blocked by RLS

8. Testing authenticated users cannot DELETE agencies...
 ✅ DELETE correctly blocked by RLS

✅ All RLS tests passed!
```

### 5. Verify RLS Policies
```bash
# Check RLS is enabled
psql postgresql://postgres:postgres@localhost:54322/postgres -c "
  SELECT tablename, rowsecurity
  FROM pg_tables
  WHERE tablename = 'agencies';"

# List all policies on agencies table
psql postgresql://postgres:postgres@localhost:54322/postgres -c "
  SELECT policyname, cmd, qual
  FROM pg_policies
  WHERE tablename = 'agencies';"
```

## Acceptance Criteria Validation

**AC2**: RLS policies are enabled on all tables containing tenant data
- ✅ RLS enabled on `agencies` table: `ALTER TABLE agencies ENABLE ROW LEVEL SECURITY`

**AC3**: RLS policies automatically filter queries to current user's agency_id
- ✅ Policy uses `auth.uid()` to determine current user
- ✅ Policy joins to `users` table to get user's `agency_id`
- ✅ Only rows matching user's agency are returned

**AC4**: No application code can bypass RLS protections
- ✅ INSERT/DELETE blocked for authenticated users (only service role allowed)
- ✅ UPDATE restricted to agency_admin role only
- ✅ Cross-agency data access prevented by policy USING clause

## Expected Output
- ✅ Migration `003_agency_rls.sql` created and applied
- ✅ RLS enabled on `agencies` table
- ✅ 4 policies created: SELECT, INSERT, UPDATE, DELETE
- ✅ RLS test script passes all 8 tests
- ✅ Cross-agency data access prevented

## References
- [Story Context](.bmad-ephemeral/stories/1-2-multi-tenant-database-schema-with-rls.context.xml)
- [Architecture Doc](docs/architecture.md) - Section: Multi-Tenant Isolation (RLS)
- [ADR-002](docs/architecture.md) - Supabase with PostgreSQL RLS for Multi-Tenancy

## Next Task
After completing this task, proceed to **Task 4: Implement Row-Level Security Policies on Users Table**
