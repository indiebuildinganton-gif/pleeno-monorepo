-- =====================================================
-- DIAGNOSE AUTH SCHEMA ISSUES
-- Run this in Supabase SQL Editor
-- =====================================================

-- 1. Check if auth schema exists
SELECT
  '=== SCHEMA CHECK ===' as section;

SELECT
  schema_name,
  CASE
    WHEN schema_name = 'auth' THEN '✅ Auth schema exists'
    WHEN schema_name = 'public' THEN '✅ Public schema exists'
    ELSE '📦 ' || schema_name || ' schema'
  END as status
FROM information_schema.schemata
WHERE schema_name IN ('auth', 'public', 'storage', 'extensions')
ORDER BY schema_name;

-- 2. Check tables in auth schema (if it exists)
SELECT
  '=== AUTH SCHEMA TABLES ===' as section;

SELECT
  table_schema,
  table_name,
  CASE
    WHEN table_name = 'users' THEN '🔑 Users table (critical)'
    WHEN table_name = 'identities' THEN '🆔 Identities table'
    WHEN table_name = 'sessions' THEN '🔐 Sessions table'
    ELSE '📋 ' || table_name
  END as description
FROM information_schema.tables
WHERE table_schema = 'auth'
ORDER BY table_name;

-- 3. If no auth tables, check if we can see system schemas
SELECT
  '=== ALL SCHEMAS ===' as section;

SELECT
  nspname as schema_name,
  CASE
    WHEN nspname LIKE 'pg_%' THEN 'System schema'
    WHEN nspname = 'information_schema' THEN 'System schema'
    WHEN nspname = 'auth' THEN '⚠️ AUTH SCHEMA'
    WHEN nspname = 'public' THEN 'Public schema'
    ELSE 'Other: ' || nspname
  END as type
FROM pg_namespace
WHERE nspname NOT LIKE 'pg_toast%'
ORDER BY nspname;

-- 4. Check current user privileges
SELECT
  '=== USER PRIVILEGES ===' as section;

SELECT
  current_user as username,
  current_database() as database,
  has_database_privilege(current_user, current_database(), 'CREATE') as can_create,
  has_schema_privilege(current_user, 'public', 'CREATE') as can_create_in_public,
  has_schema_privilege(current_user, 'auth', 'USAGE') as can_use_auth;

-- 5. Check if Supabase Auth is enabled
SELECT
  '=== SUPABASE EXTENSIONS ===' as section;

SELECT
  extname as extension_name,
  extversion as version
FROM pg_extension
WHERE extname IN ('uuid-ossp', 'pgcrypto', 'pgjwt', 'pg_net')
ORDER BY extname;

-- 6. Final diagnosis
SELECT
  '=== DIAGNOSIS ===' as section;

SELECT
  CASE
    WHEN NOT EXISTS (SELECT 1 FROM information_schema.schemata WHERE schema_name = 'auth')
    THEN '❌ CRITICAL: Auth schema does not exist - Authentication is not set up!'
    WHEN NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'auth' AND table_name = 'users')
    THEN '❌ CRITICAL: Auth schema exists but users table is missing!'
    WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'auth' AND table_name = 'users')
    THEN '✅ Auth schema and users table exist'
    ELSE '⚠️ Unknown state'
  END as auth_status,

  CASE
    WHEN EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'uuid-ossp')
    THEN '✅ UUID extension installed'
    ELSE '❌ UUID extension missing'
  END as uuid_status,

  (SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public') as public_tables_count,
  (SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'auth') as auth_tables_count;