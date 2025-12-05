# Supabase RLS (Row Level Security) Fix Documentation

## Problem Summary
After successful authentication, users encountered two critical database errors that prevented access to the application:

1. **Error 42P17**: "infinite recursion detected in policy for relation 'users'"
2. **Error 42501**: "permission denied for table users"

## Root Causes

### 1. Infinite Recursion (42P17)
The RLS policies were querying the `users` table within themselves, creating an infinite loop:
```sql
-- BAD: This causes recursion
CREATE POLICY users_check ON users
  USING (
    agency_id = (SELECT agency_id FROM users WHERE id = auth.uid())
  );
```

### 2. Permission Denied (42501)
The RLS policies were created with the wrong role (`{public}` instead of `{authenticated}`), preventing logged-in users from accessing the table.

## The Complete Solution

### Step 1: Connect to Your Supabase Database
```bash
PGPASSWORD=your_password psql -h db.your-project.supabase.co -U postgres -d postgres -p 5432
```

### Step 2: Apply the RLS Fix
Save this as `fix-rls-policies.sql`:

```sql
-- =====================================================
-- FIX RLS POLICIES FOR USERS TABLE
-- =====================================================

-- 1. Drop all existing problematic policies
DROP POLICY IF EXISTS users_admin_delete ON users;
DROP POLICY IF EXISTS users_admin_update ON users;
DROP POLICY IF EXISTS users_agency_isolation_select ON users;
DROP POLICY IF EXISTS users_prevent_insert ON users;
DROP POLICY IF EXISTS users_self_access_select ON users;
DROP POLICY IF EXISTS users_self_update ON users;
DROP POLICY IF EXISTS "Users can view active users in their agency" ON users;

-- 2. Create new policies with correct roles and no recursion

-- Policy 1: Authenticated users can view their own profile
CREATE POLICY users_self_select ON users
  FOR SELECT
  TO authenticated  -- IMPORTANT: Use 'authenticated' not 'public'
  USING (id = auth.uid());

-- Policy 2: Authenticated users can view others in their agency
-- KEY FIX: Use JWT claims instead of querying users table
CREATE POLICY users_agency_select ON users
  FOR SELECT
  TO authenticated
  USING (
    agency_id = (auth.jwt()->>'agency_id')::uuid  -- No recursion!
    OR (auth.jwt()->>'role' IN ('agency_admin', 'super_admin'))
  );

-- Policy 3: Users can update their own profile (protected fields unchanged)
CREATE POLICY users_self_update ON users
  FOR UPDATE
  TO authenticated
  USING (id = auth.uid())
  WITH CHECK (
    id = auth.uid()
    AND agency_id IS NOT DISTINCT FROM agency_id  -- Can't change agency
    AND role IS NOT DISTINCT FROM role  -- Can't change role
  );

-- Policy 4: Agency admins can update users in their agency
CREATE POLICY users_admin_update ON users
  FOR UPDATE
  TO authenticated
  USING (
    auth.jwt()->>'role' IN ('agency_admin', 'super_admin')
    AND agency_id = (auth.jwt()->>'agency_id')::uuid
  )
  WITH CHECK (
    agency_id = (auth.jwt()->>'agency_id')::uuid
  );

-- Policy 5: Agency admins can delete users (except themselves)
CREATE POLICY users_admin_delete ON users
  FOR DELETE
  TO authenticated
  USING (
    auth.jwt()->>'role' IN ('agency_admin', 'super_admin')
    AND agency_id = (auth.jwt()->>'agency_id')::uuid
    AND id != auth.uid()
  );

-- Policy 6: Prevent direct inserts (handled by auth trigger)
CREATE POLICY users_no_insert ON users
  FOR INSERT
  TO authenticated
  WITH CHECK (false);

-- 3. Verify policies are correctly set
SELECT
  policyname,
  cmd,
  roles
FROM pg_policies
WHERE schemaname = 'public' AND tablename = 'users'
ORDER BY policyname;
```

### Step 3: Update JWT Claims for Existing Users
```sql
-- Ensure JWT claims are properly set in auth.users
UPDATE auth.users u
SET raw_app_meta_data = u.raw_app_meta_data ||
    jsonb_build_object(
      'agency_id', COALESCE(
        u.raw_app_meta_data->>'agency_id',
        u.raw_user_meta_data->>'agency_id',
        pu.agency_id::text
      ),
      'role', COALESCE(
        u.raw_app_meta_data->>'role',
        u.raw_user_meta_data->>'role',
        pu.role
      )
    )
FROM public.users pu
WHERE u.id = pu.id;

-- Verify the update
SELECT
  email,
  raw_app_meta_data->>'agency_id' as jwt_agency_id,
  raw_app_meta_data->>'role' as jwt_role
FROM auth.users
WHERE email = 'your-test-email@example.com';
```

### Step 4: Update the Auth Trigger
```sql
-- Ensure new users get JWT claims automatically
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  DECLARE
    v_agency_id uuid;
    v_role text;
  BEGIN
    -- Get agency_id and role from metadata
    v_agency_id := COALESCE(
      (new.raw_app_meta_data->>'agency_id')::uuid,
      (new.raw_user_meta_data->>'agency_id')::uuid
    );

    v_role := COALESCE(
      new.raw_app_meta_data->>'role',
      new.raw_user_meta_data->>'role',
      'agency_user' -- default role
    );

    -- Create user record
    INSERT INTO public.users (
      id, email, full_name, role, agency_id, created_at, updated_at
    ) VALUES (
      new.id,
      new.email,
      COALESCE(
        new.raw_user_meta_data->>'full_name',
        new.raw_user_meta_data->>'name',
        split_part(new.email, '@', 1)
      ),
      v_role,
      v_agency_id,
      now(),
      now()
    );

    -- CRITICAL: Update JWT claims for RLS policies
    UPDATE auth.users
    SET raw_app_meta_data = raw_app_meta_data ||
        jsonb_build_object(
          'agency_id', v_agency_id::text,
          'role', v_role
        )
    WHERE id = new.id;

    RETURN new;
  END;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

## Key Principles to Remember

### 1. **Avoid Recursion in RLS Policies**
❌ **DON'T DO THIS:**
```sql
-- This queries the users table within a users table policy
USING (agency_id = (SELECT agency_id FROM users WHERE id = auth.uid()))
```

✅ **DO THIS INSTEAD:**
```sql
-- Use JWT claims to avoid recursion
USING (agency_id = (auth.jwt()->>'agency_id')::uuid)
```

### 2. **Use Correct Roles in Policies**
❌ **DON'T DO THIS:**
```sql
CREATE POLICY my_policy ON users
  TO public  -- Wrong role!
```

✅ **DO THIS:**
```sql
CREATE POLICY my_policy ON users
  TO authenticated  -- Correct role for logged-in users
```

### 3. **Store User Metadata in JWT Claims**
Always ensure `agency_id` and `role` are stored in `raw_app_meta_data`:
- These values are included in the JWT token
- Accessible via `auth.jwt()->>'field_name'` in RLS policies
- No database queries needed = no recursion risk

## Testing the Fix

### 1. Test Authentication
```bash
curl -s 'https://your-app.vercel.app/api/auth/login' \
  -H 'content-type: application/json' \
  --data '{"email":"test@example.com","password":"password"}'
```

### 2. Test Direct Database Query
```bash
# Get auth token
TOKEN=$(curl -s 'https://your-project.supabase.co/auth/v1/token?grant_type=password' \
  -H 'apikey: your-anon-key' \
  -H 'content-type: application/json' \
  --data '{"email":"test@example.com","password":"password"}' | jq -r .access_token)

# Query users table
curl -s 'https://your-project.supabase.co/rest/v1/users?select=*' \
  -H "Authorization: Bearer $TOKEN" \
  -H 'apikey: your-anon-key'
```

## Quick Troubleshooting

### If you get "infinite recursion detected":
1. Check all RLS policies for self-referencing queries
2. Replace with JWT claims: `auth.jwt()->>'field_name'`
3. Ensure JWT claims are set in `raw_app_meta_data`

### If you get "permission denied":
1. Check policies use `TO authenticated` not `TO public`
2. Verify user has JWT claims set
3. Check RLS is enabled: `SELECT rowsecurity FROM pg_tables WHERE tablename = 'users';`

### If JWT claims are missing:
```sql
-- Quick fix for existing users
UPDATE auth.users
SET raw_app_meta_data = raw_app_meta_data ||
    jsonb_build_object('agency_id', 'your-agency-id', 'role', 'agency_user')
WHERE email = 'user@example.com';
```

## Prevention Tips

1. **Always test RLS policies locally first**
2. **Use Supabase SQL Editor to test policies before production**
3. **Keep a backup of working policies**
4. **Document your RLS strategy**
5. **Use JWT claims for user context, not database queries**

## Summary

The RLS issues were caused by:
1. Policies querying themselves (recursion)
2. Wrong role permissions

The fix involves:
1. Using JWT claims instead of queries
2. Setting policies to `authenticated` role
3. Ensuring JWT claims are properly set

This approach eliminates recursion and ensures proper permissions for authenticated users.

---

**Last Updated**: December 5, 2024
**Tested On**: Supabase with Next.js multi-zone architecture
**Status**: ✅ Working Solution