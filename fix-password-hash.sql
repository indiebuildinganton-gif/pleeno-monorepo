-- =====================================================
-- FIX PASSWORD HASH FOR admin@test.local
-- =====================================================

-- 1. Check current password hash
SELECT
  '=== CURRENT PASSWORD HASH ===' as section;

SELECT
  id,
  email,
  encrypted_password,
  LENGTH(encrypted_password) as hash_length
FROM auth.users
WHERE email = 'admin@test.local';

-- 2. Generate a new bcrypt hash for 'password'
SELECT
  '=== GENERATING NEW HASH ===' as section;

SELECT
  crypt('password', gen_salt('bf')) as new_password_hash;

-- 3. Update the password hash
-- This uses Supabase's built-in bcrypt function
UPDATE auth.users
SET encrypted_password = crypt('password', gen_salt('bf'))
WHERE email = 'admin@test.local';

-- 4. Verify the update
SELECT
  '=== VERIFICATION ===' as section;

SELECT
  id,
  email,
  encrypted_password,
  LENGTH(encrypted_password) as hash_length,
  CASE
    WHEN encrypted_password = crypt('password', encrypted_password)
    THEN '✅ Password is now valid'
    ELSE '❌ Password still invalid'
  END as status
FROM auth.users
WHERE email = 'admin@test.local';

-- 5. Alternative: Set a specific working hash
-- If the above doesn't work, try this known-good hash
/*
UPDATE auth.users
SET encrypted_password = '$2b$10$PXqFXVmG8LIrSEqekcO0fuxZ8IBhSJxaQop0FNLxEB26VkYZJE9Iy'
WHERE email = 'admin@test.local';
*/

-- 6. Final check
SELECT
  '=== FINAL STATUS ===' as section;

SELECT
  'User exists: ' || CASE WHEN COUNT(*) > 0 THEN 'YES' ELSE 'NO' END as user_exists,
  'Email: ' || MAX(email) as email,
  'Password can be verified: ' ||
    CASE
      WHEN MAX(encrypted_password) = crypt('password', MAX(encrypted_password))
      THEN 'YES'
      ELSE 'NO'
    END as password_ok
FROM auth.users
WHERE email = 'admin@test.local';