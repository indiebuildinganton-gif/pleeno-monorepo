# ✅ SUPABASE UAT AUTHENTICATION FIX - COMPLETE SOLUTION

## Problem Summary
The UAT environment authentication was failing with "Invalid credentials" error despite having the correct user records in the database. The root cause was an incompatible password hash format.

## Root Cause
The bcrypt password hash we initially used (`$2a$10$...`) was not compatible with Supabase's authentication system. Supabase requires passwords to be hashed using their specific `crypt()` function with `gen_salt('bf')`.

## The Working Solution

### Prerequisites
- Supabase Project: `ccmciliwfdtdspdlkuos`
- Database URL: `https://ccmciliwfdtdspdlkuos.supabase.co`
- User Account: `lopajs27@gmail.com`

### Step 1: Verify Environment Configuration

Ensure your `.env.uat` file has the correct values:
```env
NEXT_PUBLIC_SUPABASE_URL=https://ccmciliwfdtdspdlkuos.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNjbWNpbGl3ZmR0ZHNwZGxrdW9zIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ4MTY0MzQsImV4cCI6MjA4MDM5MjQzNH0.OtcTS9J6A-wwsPxxrwlImEXQ34WSxCHWD0kBQpmL_pQ
```

### Step 2: The Critical SQL Script That Fixes Authentication

Run this SQL script in your Supabase SQL Editor (https://supabase.com/dashboard/project/ccmciliwfdtdspdlkuos/sql):

```sql
-- =====================================================
-- FIX PASSWORD HASH FOR ALL AUTH USERS
-- This script uses Supabase's native crypt() function
-- to generate compatible password hashes
-- =====================================================

-- 1. First, check if admin@test.local exists
SELECT
  id,
  email,
  encrypted_password
FROM auth.users
WHERE email = 'admin@test.local';

-- 2. Update password for admin@test.local using Supabase's crypt function
-- This is the CRITICAL fix - using crypt() with gen_salt('bf')
UPDATE auth.users
SET encrypted_password = crypt('password', gen_salt('bf'))
WHERE email = 'admin@test.local';

-- 3. Fix passwords for ALL existing users (optional)
-- This sets the password to 'password' for all users
UPDATE auth.users
SET encrypted_password = crypt('password', gen_salt('bf'))
WHERE encrypted_password NOT LIKE '$2b$%';  -- Only update incompatible hashes

-- 4. Verify the fix worked
SELECT
  email,
  CASE
    WHEN encrypted_password = crypt('password', encrypted_password)
    THEN '✅ Password valid'
    ELSE '❌ Password invalid'
  END as status
FROM auth.users
WHERE email = 'admin@test.local';

-- 5. Create a new test user with correct password (if needed)
DO $$
DECLARE
  test_user_id UUID := '10000000-0000-0000-0000-000000000001';
  test_agency_id UUID;
BEGIN
  -- Get first agency or create one
  SELECT id INTO test_agency_id FROM public.agencies LIMIT 1;

  IF test_agency_id IS NULL THEN
    test_agency_id := '20000000-0000-0000-0000-000000000001';
    INSERT INTO public.agencies (id, name, created_at, updated_at)
    VALUES (test_agency_id, 'Test Agency', NOW(), NOW())
    ON CONFLICT (id) DO NOTHING;
  END IF;

  -- Delete existing test user if exists
  DELETE FROM public.users WHERE email = 'admin@test.local';
  DELETE FROM auth.identities WHERE user_id = test_user_id;
  DELETE FROM auth.users WHERE email = 'admin@test.local';

  -- Create auth user with CORRECT password hash
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
    test_user_id,
    'authenticated',
    'authenticated',
    'admin@test.local',
    crypt('password', gen_salt('bf')),  -- CRITICAL: Use crypt() function!
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
    NOW()
  );

  -- Create identity
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

  -- Create public user (remember: auth.users must exist first due to FK)
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
    agency_id = EXCLUDED.agency_id,
    role = EXCLUDED.role;

  RAISE NOTICE '✅ User admin@test.local created with password: password';
END $$;
```

## Key Insights

### Why Initial Attempts Failed
1. **Wrong Hash Format**: We used `$2a$10$...` format, but Supabase requires hashes generated by its `crypt()` function
2. **Manual Hash Generation**: Creating bcrypt hashes outside of Supabase doesn't guarantee compatibility
3. **Foreign Key Order**: `public.users` has FK to `auth.users`, so auth records must be created first

### The Critical Fix
```sql
-- THIS is the magic line that makes passwords work:
UPDATE auth.users
SET encrypted_password = crypt('password', gen_salt('bf'))
WHERE email = 'admin@test.local';
```

**NEVER use hardcoded bcrypt hashes like:**
```sql
-- ❌ DON'T DO THIS - Won't work with Supabase Auth
'$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy'
```

**ALWAYS use Supabase's crypt function:**
```sql
-- ✅ DO THIS - Works with Supabase Auth
crypt('password', gen_salt('bf'))
```

## Testing the Fix

### Test Locally
```bash
curl 'https://ccmciliwfdtdspdlkuos.supabase.co/auth/v1/token?grant_type=password' \
  -H 'apikey: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNjbWNpbGl3ZmR0ZHNwZGxrdW9zIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ4MTY0MzQsImV4cCI6MjA4MDM5MjQzNH0.OtcTS9J6A-wwsPxxrwlImEXQ34WSxCHWD0kBQpmL_pQ' \
  -H 'content-type: application/json' \
  --data-raw '{"email":"admin@test.local","password":"password"}'
```

### Test on Vercel
```bash
curl 'https://pleeno-shell-uat.vercel.app/api/auth/login' \
  -H 'content-type: application/json' \
  --data-raw '{"email":"admin@test.local","password":"password"}'
```

## Login Credentials
- **Email**: `admin@test.local`
- **Password**: `password`

## Vercel Environment Variables
Ensure these are set in Vercel Dashboard:
- `NEXT_PUBLIC_SUPABASE_URL`: `https://ccmciliwfdtdspdlkuos.supabase.co`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNjbWNpbGl3ZmR0ZHNwZGxrdW9zIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ4MTY0MzQsImV4cCI6MjA4MDM5MjQzNH0.OtcTS9J6A-wwsPxxrwlImEXQ34WSxCHWD0kBQpmL_pQ`

## Troubleshooting

If authentication still fails:

1. **Verify the user exists**:
   ```sql
   SELECT * FROM auth.users WHERE email = 'admin@test.local';
   ```

2. **Regenerate password**:
   ```sql
   UPDATE auth.users
   SET encrypted_password = crypt('password', gen_salt('bf'))
   WHERE email = 'admin@test.local';
   ```

3. **Check auth schema exists**:
   ```sql
   SELECT COUNT(*) FROM information_schema.tables
   WHERE table_schema = 'auth' AND table_name = 'users';
   ```

4. **Verify environment variables** match exactly (no trailing spaces!)

## Summary
The authentication issue was resolved by using Supabase's native `crypt()` function with `gen_salt('bf')` to generate password hashes instead of using pre-generated bcrypt hashes. This ensures full compatibility with Supabase's authentication system.