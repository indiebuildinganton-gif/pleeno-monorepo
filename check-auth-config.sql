-- =====================================================
-- CHECK AUTH CONFIGURATION AND PASSWORD
-- =====================================================

-- 1. Check if admin@test.local exists in auth.users
SELECT
  '=== AUTH USER CHECK ===' as section;

SELECT
  id,
  email,
  encrypted_password,
  email_confirmed_at,
  created_at,
  CASE
    WHEN encrypted_password = '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy'
    THEN '✅ Password hash matches expected'
    ELSE '❌ Password hash DIFFERENT'
  END as password_status,
  LENGTH(encrypted_password) as hash_length
FROM auth.users
WHERE email = 'admin@test.local';

-- 2. Check Supabase configuration
SELECT
  '=== SUPABASE CONFIG ===' as section;

-- Check if there are any auth settings
SELECT
  key,
  value
FROM auth.flow_state
LIMIT 5;

-- 3. Test password verification using Supabase's function
SELECT
  '=== PASSWORD VERIFICATION TEST ===' as section;

-- Try to verify the password using pgcrypto
SELECT
  email,
  CASE
    WHEN encrypted_password = crypt('password', encrypted_password)
    THEN '✅ Password verification SUCCESS'
    ELSE '❌ Password verification FAILED'
  END as verification_status
FROM auth.users
WHERE email = 'admin@test.local';

-- 4. Check auth configuration settings
SELECT
  '=== AUTH SETTINGS ===' as section;

-- Check if there are any custom auth configurations
SELECT
  COUNT(*) as active_sessions
FROM auth.sessions
WHERE created_at > NOW() - INTERVAL '1 day';

-- 5. Check for any auth hooks or triggers
SELECT
  '=== AUTH TRIGGERS ===' as section;

SELECT
  trigger_name,
  event_manipulation,
  event_object_table,
  action_timing
FROM information_schema.triggers
WHERE trigger_schema = 'auth'
  AND event_object_table IN ('users', 'sessions')
ORDER BY trigger_name;

-- 6. Generate a new password hash for testing
SELECT
  '=== NEW PASSWORD HASH ===' as section;

-- Generate a proper bcrypt hash for 'password'
SELECT
  crypt('password', gen_salt('bf', 10)) as new_hash_for_password;

-- 7. Check JWT secret configuration
SELECT
  '=== JWT CONFIGURATION ===' as section;

-- Check if pgjwt extension is installed and configured
SELECT
  extname,
  extversion
FROM pg_extension
WHERE extname = 'pgjwt';

-- 8. Final diagnosis
SELECT
  '=== DIAGNOSIS ===' as section,
  CASE
    WHEN NOT EXISTS (SELECT 1 FROM auth.users WHERE email = 'admin@test.local')
    THEN '❌ User does not exist'
    WHEN EXISTS (
      SELECT 1 FROM auth.users
      WHERE email = 'admin@test.local'
        AND encrypted_password != crypt('password', encrypted_password)
    )
    THEN '❌ Password hash mismatch - may need to regenerate'
    ELSE '✅ User exists with correct password'
  END as status;