-- =====================================================
-- CREATE AUTH USER FOR UAT ENVIRONMENT
-- Run this in Supabase SQL Editor for project ccmciliwfdtdspdlkuos
-- =====================================================

-- First, let's check what users exist in public.users
SELECT
  id,
  email,
  full_name,
  agency_id,
  role,
  status
FROM public.users
LIMIT 10;

-- Check if any auth.users exist
SELECT COUNT(*) as auth_user_count FROM auth.users;

-- Check if admin@test.local exists in public.users
SELECT * FROM public.users WHERE email = 'admin@test.local';

-- =====================================================
-- CREATE AUTH USER
-- =====================================================

-- Option 1: Create a new admin user (if it doesn't exist)
-- This will create both auth.users and public.users records

DO $$
DECLARE
  user_id UUID := '10000000-0000-0000-0000-000000000001';
  agency_id UUID := '20000000-0000-0000-0000-000000000001';
BEGIN
  -- Check if agency exists, create if not
  INSERT INTO public.agencies (id, name, created_at, updated_at)
  VALUES (
    agency_id,
    'Demo Agency',
    NOW(),
    NOW()
  ) ON CONFLICT (id) DO NOTHING;

  -- Delete any existing records to avoid conflicts
  DELETE FROM public.users WHERE email = 'admin@test.local';
  DELETE FROM auth.identities WHERE user_id = user_id;
  DELETE FROM auth.users WHERE email = 'admin@test.local';
  DELETE FROM auth.users WHERE id = user_id;

  -- Create auth.users record
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
    updated_at,
    confirmation_token,
    email_change,
    email_change_token_new,
    recovery_token
  ) VALUES (
    '00000000-0000-0000-0000-000000000000',
    user_id,
    'authenticated',
    'authenticated',
    'admin@test.local',
    -- Password: 'password' (bcrypt hash)
    '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy',
    NOW(),
    jsonb_build_object(
      'provider', 'email',
      'providers', ARRAY['email']::text[],
      'agency_id', agency_id::text,
      'role', 'agency_admin'
    ),
    jsonb_build_object(
      'full_name', 'Admin User',
      'agency_id', agency_id::text,
      'role', 'agency_admin'
    ),
    NOW(),
    NOW(),
    '',
    '',
    '',
    ''
  );

  -- Create auth.identities record
  INSERT INTO auth.identities (
    provider_id,
    user_id,
    identity_data,
    provider,
    last_sign_in_at,
    created_at,
    updated_at,
    id
  ) VALUES (
    user_id::text,
    user_id,
    jsonb_build_object(
      'sub', user_id::text,
      'email', 'admin@test.local',
      'email_verified', true,
      'provider', 'email'
    ),
    'email',
    NOW(),
    NOW(),
    NOW(),
    gen_random_uuid()
  );

  -- Create or update public.users record
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
    user_id,
    'admin@test.local',
    'Admin User',
    agency_id,
    'agency_admin',
    'active',
    NOW(),
    NOW()
  ) ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    full_name = EXCLUDED.full_name,
    agency_id = EXCLUDED.agency_id,
    role = EXCLUDED.role,
    status = EXCLUDED.status,
    updated_at = NOW();

  RAISE NOTICE 'User admin@test.local created successfully';
END $$;

-- =====================================================
-- VERIFICATION
-- =====================================================

-- Verify the user was created
SELECT
  'Auth User' as table_name,
  id,
  email,
  email_confirmed_at,
  created_at
FROM auth.users
WHERE email = 'admin@test.local'

UNION ALL

SELECT
  'Public User' as table_name,
  id,
  email,
  NULL as email_confirmed_at,
  created_at
FROM public.users
WHERE email = 'admin@test.local'

UNION ALL

SELECT
  'Identity' as table_name,
  user_id as id,
  (identity_data->>'email')::text as email,
  NULL as email_confirmed_at,
  created_at
FROM auth.identities
WHERE user_id = '10000000-0000-0000-0000-000000000001';

-- Final check
SELECT
  CASE
    WHEN EXISTS (SELECT 1 FROM auth.users WHERE email = 'admin@test.local')
    THEN '✅ Auth user created'
    ELSE '❌ Auth user NOT created'
  END as auth_status,
  CASE
    WHEN EXISTS (SELECT 1 FROM public.users WHERE email = 'admin@test.local')
    THEN '✅ Public user exists'
    ELSE '❌ Public user NOT found'
  END as public_status,
  CASE
    WHEN EXISTS (SELECT 1 FROM auth.identities WHERE user_id = '10000000-0000-0000-0000-000000000001')
    THEN '✅ Identity created'
    ELSE '❌ Identity NOT created'
  END as identity_status;

-- =====================================================
-- LOGIN CREDENTIALS
-- =====================================================
-- Email: admin@test.local
-- Password: password
-- =====================================================