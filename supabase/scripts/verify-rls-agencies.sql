-- Verify RLS policies on agencies table
-- Run: psql postgresql://postgres:postgres@localhost:54322/postgres -f supabase/scripts/verify-rls-agencies.sql

\echo '🔍 Verifying RLS Policies on Agencies Table'
\echo '============================================='

-- Check 1: Verify RLS is enabled
\echo '\n1. Checking if RLS is enabled...'
SELECT
  schemaname,
  tablename,
  rowsecurity AS rls_enabled,
  CASE
    WHEN rowsecurity = true THEN '✅ RLS is enabled'
    ELSE '❌ RLS is NOT enabled'
  END AS status
FROM pg_tables
WHERE tablename = 'agencies';

-- Check 2: List all policies on agencies table
\echo '\n2. Listing all RLS policies on agencies table...'
SELECT
  policyname,
  cmd AS operation,
  permissive,
  roles,
  qual AS using_clause,
  with_check
FROM pg_policies
WHERE tablename = 'agencies'
ORDER BY policyname;

-- Check 3: Verify expected policies exist
\echo '\n3. Verifying expected policies exist...'
WITH expected_policies AS (
  SELECT UNNEST(ARRAY[
    'agency_isolation_select',
    'agency_isolation_insert',
    'agency_isolation_update',
    'agency_isolation_delete'
  ]) AS policy_name
),
existing_policies AS (
  SELECT policyname
  FROM pg_policies
  WHERE tablename = 'agencies'
)
SELECT
  ep.policy_name,
  CASE
    WHEN ex.policyname IS NOT NULL THEN '✅ Exists'
    ELSE '❌ Missing'
  END AS status
FROM expected_policies ep
LEFT JOIN existing_policies ex ON ep.policy_name = ex.policyname
ORDER BY ep.policy_name;

-- Check 4: Verify policy definitions
\echo '\n4. Checking SELECT policy (should use auth.uid())...'
SELECT
  policyname,
  CASE
    WHEN qual::text LIKE '%auth.uid()%' THEN '✅ Uses auth.uid()'
    ELSE '❌ Does not use auth.uid()'
  END AS uses_auth_check,
  CASE
    WHEN qual::text LIKE '%users%' THEN '✅ References users table'
    ELSE '❌ Does not reference users table'
  END AS references_users
FROM pg_policies
WHERE tablename = 'agencies' AND policyname = 'agency_isolation_select';

\echo '\n5. Checking UPDATE policy (should check agency_admin role)...'
SELECT
  policyname,
  CASE
    WHEN qual::text LIKE '%agency_admin%' THEN '✅ Checks agency_admin role'
    ELSE '❌ Does not check agency_admin role'
  END AS role_check,
  CASE
    WHEN qual::text LIKE '%auth.uid()%' THEN '✅ Uses auth.uid()'
    ELSE '❌ Does not use auth.uid()'
  END AS uses_auth_check
FROM pg_policies
WHERE tablename = 'agencies' AND policyname = 'agency_isolation_update';

\echo '\n6. Checking INSERT policy (should block all)...'
SELECT
  policyname,
  CASE
    WHEN with_check::text = 'false' THEN '✅ Blocks all INSERTs'
    ELSE '❌ Does not block all INSERTs'
  END AS blocks_insert
FROM pg_policies
WHERE tablename = 'agencies' AND policyname = 'agency_isolation_insert';

\echo '\n7. Checking DELETE policy (should block all)...'
SELECT
  policyname,
  CASE
    WHEN qual::text = 'false' THEN '✅ Blocks all DELETEs'
    ELSE '❌ Does not block all DELETEs'
  END AS blocks_delete
FROM pg_policies
WHERE tablename = 'agencies' AND policyname = 'agency_isolation_delete';

-- Check 5: Verify indexes exist for RLS performance
\echo '\n8. Checking performance indexes on users table (required for RLS)...'
SELECT
  indexname,
  indexdef,
  CASE
    WHEN indexname LIKE '%agency_id%' THEN '✅ Required for RLS performance'
    ELSE '⚠️  Not directly related to RLS'
  END AS rls_relevance
FROM pg_indexes
WHERE tablename = 'users' AND indexdef LIKE '%agency_id%';

\echo '\n✅ RLS verification completed!'
\echo '\nNOTE: To test RLS functionality, run: psql postgresql://postgres:postgres@localhost:54322/postgres -f supabase/scripts/test-rls-agencies.sql'
