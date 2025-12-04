-- =====================================================
-- ADD AUTH RECORD TO EXISTING PUBLIC USER
-- Run this to add authentication capability to an existing user
-- =====================================================

-- IMPORTANT: First run check-existing-users.sql to find a user
-- Then update the user_email variable below with the actual email

DO $$
DECLARE
  user_email TEXT := 'UPDATE_THIS@example.com';  -- <-- CHANGE THIS to actual user email
  user_record RECORD;
  new_password TEXT := 'password';  -- Default password for all users
BEGIN
  -- Get the user details
  SELECT
    u.id,
    u.email,
    u.full_name,
    u.agency_id,
    u.role,
    u.status
  INTO user_record
  FROM public.users u
  WHERE u.email = user_email;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'User with email % not found in public.users', user_email;
  END IF;

  IF user_record.status != 'active' THEN
    RAISE WARNING 'User % is not active (status: %)', user_email, user_record.status;
  END IF;

  -- Check if auth record already exists
  IF EXISTS (SELECT 1 FROM auth.users WHERE id = user_record.id) THEN
    RAISE NOTICE 'Auth record already exists for user %, deleting and recreating...', user_email;
    DELETE FROM auth.identities WHERE user_id = user_record.id;
    DELETE FROM auth.users WHERE id = user_record.id;
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
    -- Password: 'password' (bcrypt hash)
    '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy',
    NOW(),
    jsonb_build_object(
      'provider', 'email',
      'providers', ARRAY['email']::text[],
      'agency_id', user_record.agency_id::text,
      'role', user_record.role
    ),
    jsonb_build_object(
      'full_name', user_record.full_name,
      'agency_id', user_record.agency_id::text,
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

  RAISE NOTICE 'Successfully created auth record for user: %', user_email;
  RAISE NOTICE 'Login credentials:';
  RAISE NOTICE '  Email: %', user_email;
  RAISE NOTICE '  Password: %', new_password;
END $$;

-- Verify the auth record was created
SELECT
  pu.email,
  pu.full_name,
  pu.role,
  au.email_confirmed_at,
  CASE
    WHEN au.id IS NOT NULL THEN '✅ Auth record created'
    ELSE '❌ Auth record NOT created'
  END as status
FROM public.users pu
LEFT JOIN auth.users au ON pu.id = au.id
WHERE pu.email = 'UPDATE_THIS@example.com';  -- <-- CHANGE THIS to match the email above