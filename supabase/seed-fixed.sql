-- =====================================================
-- FIXED SEED FILE - Uses Supabase's crypt() function
-- This version will work correctly with Supabase Auth
-- =====================================================

-- Clear existing data
TRUNCATE public.activity_log CASCADE;
TRUNCATE public.enrollments CASCADE;
TRUNCATE public.installments CASCADE;
TRUNCATE public.students CASCADE;
TRUNCATE public.branches CASCADE;
TRUNCATE public.colleges CASCADE;
TRUNCATE public.users CASCADE;
TRUNCATE public.agencies CASCADE;

-- Also clear auth tables (be careful with this in production!)
DELETE FROM auth.identities;
DELETE FROM auth.users;

-- =====================================================
-- CREATE AGENCIES
-- =====================================================

-- Demo Agency (for admin users)
INSERT INTO public.agencies (id, name, created_at, updated_at)
VALUES ('20000000-0000-0000-0000-000000000001', 'Demo Agency', NOW(), NOW());

-- Test College Agency
INSERT INTO public.agencies (id, name, created_at, updated_at)
VALUES ('20000000-0000-0000-0000-000000000002', 'Test College Agency', NOW(), NOW());

-- =====================================================
-- CREATE AUTH USERS WITH CORRECT PASSWORD HASHING
-- =====================================================

-- Create admin user in auth.users
-- Email: admin@test.local, Password: password
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
  '10000000-0000-0000-0000-000000000001',
  'authenticated',
  'authenticated',
  'admin@test.local',
  crypt('password', gen_salt('bf')),  -- FIXED: Using crypt() function
  NOW(),
  '{"provider":"email","providers":["email"],"agency_id":"20000000-0000-0000-0000-000000000001","role":"agency_admin"}',
  '{"full_name":"Admin User"}',
  NOW(),
  NOW(),
  '',
  '',
  '',
  ''
);

-- Create regular user in auth.users
-- Email: user@test.local, Password: password
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
  '10000000-0000-0000-0000-000000000002',
  'authenticated',
  'authenticated',
  'user@test.local',
  crypt('password', gen_salt('bf')),  -- FIXED: Using crypt() function
  NOW(),
  '{"provider":"email","providers":["email"],"agency_id":"20000000-0000-0000-0000-000000000001","role":"agency_user"}',
  '{"full_name":"Regular User"}',
  NOW(),
  NOW(),
  '',
  '',
  '',
  ''
);

-- Create college admin user
-- Email: college@test.local, Password: password
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
  '10000000-0000-0000-0000-000000000003',
  'authenticated',
  'authenticated',
  'college@test.local',
  crypt('password', gen_salt('bf')),  -- FIXED: Using crypt() function
  NOW(),
  '{"provider":"email","providers":["email"],"agency_id":"20000000-0000-0000-0000-000000000002","role":"college_admin"}',
  '{"full_name":"College Admin"}',
  NOW(),
  NOW()
);

-- =====================================================
-- CREATE AUTH IDENTITIES
-- =====================================================

-- Admin identity
INSERT INTO auth.identities (
  id,
  provider_id,
  user_id,
  identity_data,
  provider,
  last_sign_in_at,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  '10000000-0000-0000-0000-000000000001',
  '10000000-0000-0000-0000-000000000001',
  '{"sub":"10000000-0000-0000-0000-000000000001","email":"admin@test.local","email_verified":true,"provider":"email"}',
  'email',
  NOW(),
  NOW(),
  NOW()
);

-- Regular user identity
INSERT INTO auth.identities (
  id,
  provider_id,
  user_id,
  identity_data,
  provider,
  last_sign_in_at,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  '10000000-0000-0000-0000-000000000002',
  '10000000-0000-0000-0000-000000000002',
  '{"sub":"10000000-0000-0000-0000-000000000002","email":"user@test.local","email_verified":true,"provider":"email"}',
  'email',
  NOW(),
  NOW(),
  NOW()
);

-- College admin identity
INSERT INTO auth.identities (
  id,
  provider_id,
  user_id,
  identity_data,
  provider,
  last_sign_in_at,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  '10000000-0000-0000-0000-000000000003',
  '10000000-0000-0000-0000-000000000003',
  '{"sub":"10000000-0000-0000-0000-000000000003","email":"college@test.local","email_verified":true,"provider":"email"}',
  'email',
  NOW(),
  NOW(),
  NOW()
);

-- =====================================================
-- CREATE PUBLIC USERS (must be after auth.users due to FK)
-- =====================================================

-- Admin user
INSERT INTO public.users (id, email, full_name, agency_id, role, status, created_at, updated_at)
VALUES ('10000000-0000-0000-0000-000000000001', 'admin@test.local', 'Admin User', '20000000-0000-0000-0000-000000000001', 'agency_admin', 'active', NOW(), NOW());

-- Regular user
INSERT INTO public.users (id, email, full_name, agency_id, role, status, created_at, updated_at)
VALUES ('10000000-0000-0000-0000-000000000002', 'user@test.local', 'Regular User', '20000000-0000-0000-0000-000000000001', 'agency_user', 'active', NOW(), NOW());

-- College admin
INSERT INTO public.users (id, email, full_name, agency_id, role, status, created_at, updated_at)
VALUES ('10000000-0000-0000-0000-000000000003', 'college@test.local', 'College Admin', '20000000-0000-0000-0000-000000000002', 'college_admin', 'active', NOW(), NOW());

-- =====================================================
-- CREATE COLLEGES
-- =====================================================

-- Create test colleges
INSERT INTO public.colleges (id, name, code, agency_id, created_at, updated_at)
VALUES
  ('30000000-0000-0000-0000-000000000001', 'Springfield University', 'SPU', '20000000-0000-0000-0000-000000000002', NOW(), NOW()),
  ('30000000-0000-0000-0000-000000000002', 'Riverside College', 'RSC', '20000000-0000-0000-0000-000000000002', NOW(), NOW()),
  ('30000000-0000-0000-0000-000000000003', 'Mountain View Institute', 'MVI', '20000000-0000-0000-0000-000000000002', NOW(), NOW());

-- =====================================================
-- CREATE BRANCHES
-- =====================================================

-- Create branches for each college
INSERT INTO public.branches (id, name, code, college_id, created_at, updated_at)
VALUES
  -- Springfield University branches
  ('40000000-0000-0000-0000-000000000001', 'Main Campus', 'MAIN', '30000000-0000-0000-0000-000000000001', NOW(), NOW()),
  ('40000000-0000-0000-0000-000000000002', 'North Campus', 'NORTH', '30000000-0000-0000-0000-000000000001', NOW(), NOW()),
  -- Riverside College branches
  ('40000000-0000-0000-0000-000000000003', 'Downtown', 'DT', '30000000-0000-0000-0000-000000000002', NOW(), NOW()),
  ('40000000-0000-0000-0000-000000000004', 'West Side', 'WS', '30000000-0000-0000-0000-000000000002', NOW(), NOW()),
  -- Mountain View Institute branches
  ('40000000-0000-0000-0000-000000000005', 'Valley Campus', 'VC', '30000000-0000-0000-0000-000000000003', NOW(), NOW());

-- =====================================================
-- CREATE STUDENTS
-- =====================================================

-- Create sample students
INSERT INTO public.students (id, student_id, first_name, last_name, email, phone, date_of_birth, created_at, updated_at)
VALUES
  ('50000000-0000-0000-0000-000000000001', 'STU001', 'John', 'Doe', 'john.doe@example.com', '+1234567890', '2000-01-15', NOW(), NOW()),
  ('50000000-0000-0000-0000-000000000002', 'STU002', 'Jane', 'Smith', 'jane.smith@example.com', '+1234567891', '1999-05-20', NOW(), NOW()),
  ('50000000-0000-0000-0000-000000000003', 'STU003', 'Robert', 'Johnson', 'robert.j@example.com', '+1234567892', '2001-03-10', NOW(), NOW()),
  ('50000000-0000-0000-0000-000000000004', 'STU004', 'Emily', 'Williams', 'emily.w@example.com', '+1234567893', '2000-07-25', NOW(), NOW()),
  ('50000000-0000-0000-0000-000000000005', 'STU005', 'Michael', 'Brown', 'michael.b@example.com', '+1234567894', '1999-11-30', NOW(), NOW());

-- =====================================================
-- CREATE ENROLLMENTS
-- =====================================================

-- Create enrollments for students
INSERT INTO public.enrollments (
  id,
  student_id,
  branch_id,
  course_name,
  academic_year,
  semester,
  enrollment_date,
  status,
  total_amount,
  paid_amount,
  created_at,
  updated_at
) VALUES
  ('60000000-0000-0000-0000-000000000001', '50000000-0000-0000-0000-000000000001', '40000000-0000-0000-0000-000000000001', 'Computer Science', '2024', 'Fall', NOW(), 'active', 50000.00, 10000.00, NOW(), NOW()),
  ('60000000-0000-0000-0000-000000000002', '50000000-0000-0000-0000-000000000002', '40000000-0000-0000-0000-000000000001', 'Business Administration', '2024', 'Fall', NOW(), 'active', 45000.00, 15000.00, NOW(), NOW()),
  ('60000000-0000-0000-0000-000000000003', '50000000-0000-0000-0000-000000000003', '40000000-0000-0000-0000-000000000003', 'Engineering', '2024', 'Fall', NOW(), 'active', 55000.00, 20000.00, NOW(), NOW()),
  ('60000000-0000-0000-0000-000000000004', '50000000-0000-0000-0000-000000000004', '40000000-0000-0000-0000-000000000005', 'Medicine', '2024', 'Fall', NOW(), 'active', 75000.00, 25000.00, NOW(), NOW()),
  ('60000000-0000-0000-0000-000000000005', '50000000-0000-0000-0000-000000000005', '40000000-0000-0000-0000-000000000002', 'Law', '2024', 'Fall', NOW(), 'active', 60000.00, 30000.00, NOW(), NOW());

-- =====================================================
-- CREATE INSTALLMENTS
-- =====================================================

-- Create installments for each enrollment
DO $$
DECLARE
  enrollment RECORD;
  installment_count INTEGER := 4;
  installment_amount DECIMAL(10,2);
  i INTEGER;
  due_date DATE;
BEGIN
  FOR enrollment IN SELECT * FROM public.enrollments LOOP
    installment_amount := enrollment.total_amount / installment_count;

    FOR i IN 1..installment_count LOOP
      due_date := CURRENT_DATE + (i * 30);

      INSERT INTO public.installments (
        id,
        enrollment_id,
        installment_number,
        amount,
        due_date,
        status,
        created_at,
        updated_at
      ) VALUES (
        gen_random_uuid(),
        enrollment.id,
        i,
        installment_amount,
        due_date,
        CASE
          WHEN i = 1 AND enrollment.paid_amount >= installment_amount THEN 'paid'
          WHEN due_date < CURRENT_DATE THEN 'overdue'
          ELSE 'pending'
        END,
        NOW(),
        NOW()
      );
    END LOOP;
  END LOOP;
END $$;

-- =====================================================
-- SUMMARY
-- =====================================================

DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'SEED DATA CREATED SUCCESSFULLY';
  RAISE NOTICE '========================================';
  RAISE NOTICE '';
  RAISE NOTICE 'Test Users (all passwords are "password"):';
  RAISE NOTICE '  1. admin@test.local - Agency Admin';
  RAISE NOTICE '  2. user@test.local - Agency User';
  RAISE NOTICE '  3. college@test.local - College Admin';
  RAISE NOTICE '';
  RAISE NOTICE 'Agencies: 2';
  RAISE NOTICE 'Colleges: 3';
  RAISE NOTICE 'Branches: 5';
  RAISE NOTICE 'Students: 5';
  RAISE NOTICE 'Enrollments: 5';
  RAISE NOTICE 'Installments: 20 (4 per enrollment)';
  RAISE NOTICE '========================================';
END $$;