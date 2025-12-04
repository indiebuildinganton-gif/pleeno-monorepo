-- =====================================================
-- CHECK EXISTING USERS IN UAT DATABASE
-- Run this FIRST to see what users already exist
-- =====================================================

-- 1. Check all users in public.users
SELECT
  '=== PUBLIC.USERS TABLE ===' as section;

SELECT
  id,
  email,
  full_name,
  agency_id,
  role,
  status,
  created_at
FROM public.users
ORDER BY created_at DESC
LIMIT 20;

-- 2. Check if any of these users have auth records
SELECT
  '=== USERS WITH AUTH RECORDS ===' as section;

SELECT
  pu.email as public_email,
  pu.role as public_role,
  au.email as auth_email,
  au.email_confirmed_at,
  CASE
    WHEN au.id IS NOT NULL THEN '✅ Has auth record'
    ELSE '❌ NO auth record'
  END as auth_status
FROM public.users pu
LEFT JOIN auth.users au ON pu.id = au.id
ORDER BY pu.created_at DESC;

-- 3. Check agencies
SELECT
  '=== AGENCIES ===' as section;

SELECT
  id,
  name,
  created_at
FROM public.agencies
ORDER BY created_at DESC;

-- 4. Find a good candidate user to add auth for
SELECT
  '=== RECOMMENDED USER TO ADD AUTH FOR ===' as section;

SELECT
  pu.id,
  pu.email,
  pu.full_name,
  pu.role,
  pu.agency_id,
  a.name as agency_name
FROM public.users pu
LEFT JOIN public.agencies a ON pu.agency_id = a.id
LEFT JOIN auth.users au ON pu.id = au.id
WHERE au.id IS NULL  -- Only users without auth records
  AND pu.status = 'active'  -- Only active users
  AND pu.role IN ('agency_admin', 'agency_user', 'college_admin')  -- Users with admin roles
ORDER BY
  CASE pu.role
    WHEN 'agency_admin' THEN 1
    WHEN 'college_admin' THEN 2
    ELSE 3
  END,
  pu.created_at ASC
LIMIT 5;

-- 5. Summary
SELECT
  '=== SUMMARY ===' as section;

SELECT
  (SELECT COUNT(*) FROM public.users) as total_public_users,
  (SELECT COUNT(*) FROM auth.users) as total_auth_users,
  (SELECT COUNT(*) FROM public.agencies) as total_agencies,
  (SELECT COUNT(*) FROM public.users WHERE status = 'active') as active_users,
  (SELECT COUNT(*)
   FROM public.users pu
   LEFT JOIN auth.users au ON pu.id = au.id
   WHERE au.id IS NULL) as users_without_auth;