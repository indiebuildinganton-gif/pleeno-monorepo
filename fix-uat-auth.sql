-- Comprehensive fix for UAT auth
-- Run this entire script in Supabase SQL Editor

-- Step 1: Clean up any existing records
DELETE FROM public.users WHERE email = 'admin@test.local';
DELETE FROM auth.identities WHERE user_id = '10000000-0000-0000-0000-000000000001';
DELETE FROM auth.users WHERE email = 'admin@test.local';
DELETE FROM auth.users WHERE id = '10000000-0000-0000-0000-000000000001';

-- Step 2: Create agency
INSERT INTO public.agencies (id, name, created_at, updated_at)
VALUES (
  '20000000-0000-0000-0000-000000000001',
  'Demo Agency',
  NOW(),
  NOW()
) ON CONFLICT (id) DO NOTHING;

-- Step 3: Create auth user with correct structure
INSERT INTO auth.users (
  instance_id,
  id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  raw_app_meta_data,
  raw_user_meta_data,
  created_at,
  updated_at
) VALUES (
  '00000000-0000-0000-0000-000000000000',
  '10000000-0000-0000-0000-000000000001',
  'authenticated',
  'authenticated',
  'admin@test.local',
  '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', -- password: 'password'
  NOW(),
  jsonb_build_object(
    'provider', 'email',
    'providers', ARRAY['email']::text[],
    'agency_id', '20000000-0000-0000-0000-000000000001',
    'role', 'agency_admin'
  ),
  jsonb_build_object(
    'full_name', 'Admin User',
    'agency_id', '20000000-0000-0000-0000-000000000001',
    'role', 'agency_admin'
  ),
  NOW(),
  NOW()
);

-- Step 4: Create identity record
INSERT INTO auth.identities (
  provider_id,
  user_id,
  identity_data,
  provider,
  last_sign_in_at,
  created_at,
  updated_at
) VALUES (
  '10000000-0000-0000-0000-000000000001',
  '10000000-0000-0000-0000-000000000001',
  jsonb_build_object(
    'sub', '10000000-0000-0000-0000-000000000001',
    'email', 'admin@test.local',
    'email_verified', true
  ),
  'email',
  NOW(),
  NOW(),
  NOW()
);

-- Step 5: Create public user record
INSERT INTO public.users (
  id,
  email,
  full_name,
  agency_id,
  role,
  status,
  created_at,
  updated_at
) VALUES (
  '10000000-0000-0000-0000-000000000001',
  'admin@test.local',
  'Admin User',
  '20000000-0000-0000-0000-000000000001',
  'agency_admin',
  'active',
  NOW(),
  NOW()
);

-- Step 6: Verify everything was created
SELECT 'Verification Results:' as info;
SELECT
  CASE
    WHEN EXISTS (SELECT 1 FROM auth.users WHERE email = 'admin@test.local')
    THEN '✅ Auth user created'
    ELSE '❌ Auth user NOT created'
  END as auth_user_status,
  CASE
    WHEN EXISTS (SELECT 1 FROM public.users WHERE email = 'admin@test.local')
    THEN '✅ Public user created'
    ELSE '❌ Public user NOT created'
  END as public_user_status,
  CASE
    WHEN EXISTS (SELECT 1 FROM auth.identities WHERE user_id = '10000000-0000-0000-0000-000000000001')
    THEN '✅ Identity created'
    ELSE '❌ Identity NOT created'
  END as identity_status;