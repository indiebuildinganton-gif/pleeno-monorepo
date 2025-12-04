-- =====================================================
-- UAT Authentication Verification Script
-- Run this in Supabase SQL Editor to diagnose auth issues
-- =====================================================

-- 1. Check if auth.users record exists
SELECT
  '=== AUTH.USERS TABLE ===' as section,
  COUNT(*) as total_auth_users
FROM auth.users;

SELECT
  id,
  email,
  role,
  email_confirmed_at,
  created_at,
  updated_at,
  raw_app_meta_data,
  raw_user_meta_data
FROM auth.users
WHERE email = 'admin@test.local';

-- 2. Check if identity record exists
SELECT
  '=== AUTH.IDENTITIES TABLE ===' as section,
  COUNT(*) as total_identities
FROM auth.identities;

SELECT
  user_id,
  provider,
  provider_id,
  identity_data,
  last_sign_in_at,
  created_at
FROM auth.identities
WHERE user_id = '10000000-0000-0000-0000-000000000001';

-- 3. Check public.users record
SELECT
  '=== PUBLIC.USERS TABLE ===' as section,
  COUNT(*) as total_public_users
FROM public.users;

SELECT
  id,
  email,
  full_name,
  agency_id,
  role,
  status,
  created_at
FROM public.users
WHERE email = 'admin@test.local';

-- 4. Check agency exists
SELECT
  '=== AGENCIES TABLE ===' as section,
  COUNT(*) as total_agencies
FROM public.agencies;

SELECT
  id,
  name,
  created_at
FROM public.agencies
WHERE id = '20000000-0000-0000-0000-000000000001';

-- 5. Cross-check: Auth users without public users
SELECT
  '=== ORPHANED AUTH USERS ===' as section;

SELECT
  au.id,
  au.email,
  au.created_at
FROM auth.users au
LEFT JOIN public.users pu ON au.id = pu.id
WHERE pu.id IS NULL;

-- 6. Cross-check: Public users without auth users
SELECT
  '=== ORPHANED PUBLIC USERS ===' as section;

SELECT
  pu.id,
  pu.email,
  pu.created_at
FROM public.users pu
LEFT JOIN auth.users au ON pu.id = au.id
WHERE au.id IS NULL;

-- 7. Check for duplicate emails
SELECT
  '=== DUPLICATE EMAILS IN AUTH.USERS ===' as section;

SELECT
  email,
  COUNT(*) as count
FROM auth.users
GROUP BY email
HAVING COUNT(*) > 1;

-- 8. Check auth configuration
SELECT
  '=== AUTH CONFIGURATION ===' as section;

-- Get auth settings (this might require superuser access)
-- If this fails, it's OK - just informational
SELECT
  CASE
    WHEN EXISTS (SELECT 1 FROM auth.users WHERE email = 'admin@test.local')
    THEN 'YES'
    ELSE 'NO'
  END as "Auth user exists?",
  CASE
    WHEN EXISTS (SELECT 1 FROM public.users WHERE email = 'admin@test.local')
    THEN 'YES'
    ELSE 'NO'
  END as "Public user exists?",
  CASE
    WHEN EXISTS (SELECT 1 FROM auth.identities WHERE user_id = '10000000-0000-0000-0000-000000000001')
    THEN 'YES'
    ELSE 'NO'
  END as "Identity exists?",
  CASE
    WHEN EXISTS (SELECT 1 FROM public.agencies WHERE id = '20000000-0000-0000-0000-000000000001')
    THEN 'YES'
    ELSE 'NO'
  END as "Agency exists?";

-- 9. Test password hash
SELECT
  '=== PASSWORD VERIFICATION ===' as section;

SELECT
  id,
  email,
  CASE
    WHEN encrypted_password = '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy'
    THEN 'Password hash MATCHES expected'
    ELSE 'Password hash DOES NOT match'
  END as password_check,
  LENGTH(encrypted_password) as password_length
FROM auth.users
WHERE email = 'admin@test.local';

-- 10. Check RLS policies
SELECT
  '=== RLS POLICIES ===' as section;

SELECT
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE schemaname IN ('public', 'auth')
  AND tablename IN ('users', 'agencies')
ORDER BY schemaname, tablename, policyname;

-- 11. Summary
SELECT
  '=== AUTHENTICATION DIAGNOSIS ===' as section;

WITH auth_check AS (
  SELECT
    EXISTS (SELECT 1 FROM auth.users WHERE email = 'admin@test.local') as auth_exists,
    EXISTS (SELECT 1 FROM public.users WHERE email = 'admin@test.local') as public_exists,
    EXISTS (SELECT 1 FROM auth.identities WHERE user_id = '10000000-0000-0000-0000-000000000001') as identity_exists,
    EXISTS (SELECT 1 FROM public.agencies WHERE id = '20000000-0000-0000-0000-000000000001') as agency_exists,
    (SELECT email_confirmed_at IS NOT NULL FROM auth.users WHERE email = 'admin@test.local' LIMIT 1) as email_confirmed
)
SELECT
  CASE
    WHEN NOT auth_exists THEN '❌ CRITICAL: auth.users record missing - user cannot authenticate'
    WHEN NOT public_exists THEN '❌ CRITICAL: public.users record missing - user profile incomplete'
    WHEN NOT identity_exists THEN '⚠️ WARNING: auth.identities record missing - might affect authentication'
    WHEN NOT agency_exists THEN '⚠️ WARNING: agency record missing - might cause foreign key issues'
    WHEN NOT email_confirmed THEN '❌ CRITICAL: Email not confirmed - authentication will fail'
    ELSE '✅ All required records exist - authentication should work'
  END as diagnosis,
  auth_exists,
  public_exists,
  identity_exists,
  agency_exists,
  email_confirmed
FROM auth_check;