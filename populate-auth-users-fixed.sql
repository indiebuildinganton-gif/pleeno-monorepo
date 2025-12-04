-- =====================================================
-- POPULATE EMPTY AUTH.USERS TABLE (FIXED VERSION)
-- Handles the foreign key constraint properly
-- Run this in Supabase SQL Editor
-- =====================================================

-- First, verify the auth schema is empty
SELECT
  'Current auth.users count: ' || COUNT(*) as status
FROM auth.users;

-- Check what users exist in public.users
SELECT
  'Current public.users count: ' || COUNT(*) as status
FROM public.users;

-- Show first 10 public users that need auth records
SELECT
  id,
  email,
  full_name,
  role,
  agency_id
FROM public.users
WHERE email IS NOT NULL
ORDER BY
  CASE role
    WHEN 'agency_admin' THEN 1
    WHEN 'college_admin' THEN 2
    ELSE 3
  END,
  created_at
LIMIT 10;

-- =====================================================
-- CREATE AUTH RECORDS FOR EXISTING USERS
-- =====================================================

-- This will create auth records for ALL active users in public.users
DO $$
DECLARE
  user_record RECORD;
  created_count INTEGER := 0;
  skipped_count INTEGER := 0;
BEGIN
  -- Loop through all active users in public.users
  FOR user_record IN
    SELECT
      id,
      email,
      full_name,
      agency_id,
      role
    FROM public.users
    WHERE status = 'active'
      AND email IS NOT NULL
      AND email != ''
    ORDER BY created_at
  LOOP
    BEGIN
      -- Check if auth record already exists
      IF EXISTS (SELECT 1 FROM auth.users WHERE id = user_record.id) THEN
        skipped_count := skipped_count + 1;
        RAISE NOTICE 'Skipping % - auth record already exists', user_record.email;
        CONTINUE;
      END IF;

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
        user_record.id,
        'authenticated',
        'authenticated',
        user_record.email,
        -- Password for all users: 'password'
        '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy',
        NOW(), -- Email confirmed
        jsonb_build_object(
          'provider', 'email',
          'providers', ARRAY['email']::text[],
          'agency_id', COALESCE(user_record.agency_id::text, ''),
          'role', user_record.role
        ),
        jsonb_build_object(
          'full_name', COALESCE(user_record.full_name, ''),
          'agency_id', COALESCE(user_record.agency_id::text, ''),
          'role', user_record.role
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
        user_record.id::text,
        user_record.id,
        jsonb_build_object(
          'sub', user_record.id::text,
          'email', user_record.email,
          'email_verified', true,
          'provider', 'email'
        ),
        'email',
        NOW(),
        NOW(),
        NOW(),
        gen_random_uuid()
      );

      created_count := created_count + 1;
      RAISE NOTICE 'Created auth record for: % (%)', user_record.email, user_record.role;

    EXCEPTION WHEN OTHERS THEN
      RAISE WARNING 'Failed to create auth for %: %', user_record.email, SQLERRM;
    END;
  END LOOP;

  RAISE NOTICE '';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'SUMMARY:';
  RAISE NOTICE '  Created: % auth records', created_count;
  RAISE NOTICE '  Skipped: % existing records', skipped_count;
  RAISE NOTICE '========================================';
  RAISE NOTICE '';
  RAISE NOTICE 'All users can now login with password: password';
END $$;

-- =====================================================
-- CREATE admin@test.local FOR TESTING (FIXED)
-- =====================================================

-- Create test admin user with proper order (auth first, then public)
DO $$
DECLARE
  test_user_id UUID := '10000000-0000-0000-0000-000000000001';
  test_agency_id UUID;
BEGIN
  -- Get the first agency ID or create one
  SELECT id INTO test_agency_id FROM public.agencies LIMIT 1;

  IF test_agency_id IS NULL THEN
    test_agency_id := '20000000-0000-0000-0000-000000000001';
    INSERT INTO public.agencies (id, name, created_at, updated_at)
    VALUES (test_agency_id, 'Test Agency', NOW(), NOW())
    ON CONFLICT (id) DO NOTHING;
  END IF;

  -- Clean up any existing test user (in reverse order due to FK)
  DELETE FROM public.users WHERE id = test_user_id;
  DELETE FROM auth.identities WHERE user_id = test_user_id;
  DELETE FROM auth.users WHERE id = test_user_id;

  -- FIRST: Create auth.users record (parent table)
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
    test_user_id,
    'authenticated',
    'authenticated',
    'admin@test.local',
    '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', -- password
    NOW(),
    jsonb_build_object(
      'provider', 'email',
      'providers', ARRAY['email']::text[],
      'agency_id', test_agency_id::text,
      'role', 'agency_admin'
    ),
    jsonb_build_object(
      'full_name', 'Test Admin',
      'agency_id', test_agency_id::text,
      'role', 'agency_admin'
    ),
    NOW(),
    NOW(),
    '',
    '',
    '',
    ''
  );

  -- SECOND: Create auth.identities record
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
    test_user_id::text,
    test_user_id,
    jsonb_build_object(
      'sub', test_user_id::text,
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

  -- THIRD: Create or update public.users record (child table)
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
    test_user_id,
    'admin@test.local',
    'Test Admin',
    test_agency_id,
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

  RAISE NOTICE '';
  RAISE NOTICE '✅ Test admin user created:';
  RAISE NOTICE '   Email: admin@test.local';
  RAISE NOTICE '   Password: password';

EXCEPTION WHEN OTHERS THEN
  RAISE WARNING 'Failed to create test user: %', SQLERRM;
  RAISE WARNING 'You may need to create it manually';
END $$;

-- =====================================================
-- FINAL VERIFICATION
-- =====================================================

-- Count auth records
SELECT
  'Final auth.users count: ' || COUNT(*) as status
FROM auth.users;

-- Show some users that can now login
SELECT
  au.email,
  pu.role,
  pu.full_name,
  '✅ Can login with password: password' as status
FROM auth.users au
JOIN public.users pu ON au.id = pu.id
ORDER BY
  CASE pu.role
    WHEN 'agency_admin' THEN 1
    WHEN 'college_admin' THEN 2
    ELSE 3
  END
LIMIT 10;

-- Check if test user was created
SELECT
  'TEST USER CHECK:' as section,
  CASE
    WHEN EXISTS (SELECT 1 FROM auth.users WHERE email = 'admin@test.local')
    THEN '✅ admin@test.local created - Password: password'
    ELSE '❌ admin@test.local NOT created'
  END as status;