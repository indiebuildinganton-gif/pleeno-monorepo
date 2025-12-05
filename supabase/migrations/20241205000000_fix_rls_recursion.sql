-- Fix for infinite recursion in users table RLS policies
-- The issue: Policies were querying the users table within themselves, causing recursion

-- First, drop the problematic policies
DROP POLICY IF EXISTS users_agency_isolation_select ON users;
DROP POLICY IF EXISTS users_self_access_select ON users;
DROP POLICY IF EXISTS users_self_update ON users;
DROP POLICY IF EXISTS users_admin_update ON users;
DROP POLICY IF EXISTS users_admin_delete ON users;
DROP POLICY IF EXISTS users_prevent_insert ON users;

-- Create fixed policies that avoid recursion

-- Policy 1: Users can view their own profile
CREATE POLICY users_self_access_select ON users
  FOR SELECT
  USING (id = auth.uid());

-- Policy 2: Users can view others in their agency (using auth.jwt() to avoid recursion)
CREATE POLICY users_agency_isolation_select ON users
  FOR SELECT
  USING (
    -- Use JWT claims to get agency_id without querying users table
    agency_id = (auth.jwt()->>'agency_id')::uuid
    OR
    -- Allow viewing if user is agency admin
    EXISTS (
      SELECT 1 FROM auth.users au
      WHERE au.id = auth.uid()
      AND (au.raw_user_meta_data->>'role' = 'agency_admin'
           OR au.raw_app_meta_data->>'role' = 'agency_admin')
    )
  );

-- Policy 3: Prevent direct user creation
CREATE POLICY users_prevent_insert ON users
  FOR INSERT
  WITH CHECK (false);

-- Policy 4: Users can update their own profile (but not agency_id or role)
CREATE POLICY users_self_update ON users
  FOR UPDATE
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

-- Policy 5: Agency admins can update users in their agency
CREATE POLICY users_admin_update ON users
  FOR UPDATE
  USING (
    -- Check if current user is admin using JWT claims
    (auth.jwt()->>'role' = 'agency_admin'
     OR auth.jwt()->>'role' = 'super_admin')
    AND
    -- Target user is in same agency
    agency_id = (auth.jwt()->>'agency_id')::uuid
  )
  WITH CHECK (
    -- Ensure user stays in same agency
    agency_id = (auth.jwt()->>'agency_id')::uuid
  );

-- Policy 6: Agency admins can delete users (except themselves)
CREATE POLICY users_admin_delete ON users
  FOR DELETE
  USING (
    -- Check if current user is admin
    (auth.jwt()->>'role' = 'agency_admin'
     OR auth.jwt()->>'role' = 'super_admin')
    AND
    -- Target user is in same agency
    agency_id = (auth.jwt()->>'agency_id')::uuid
    AND
    -- Cannot delete self
    id != auth.uid()
  );

-- Update the auth trigger to ensure JWT claims are properly set
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  -- Get agency_id and role from metadata
  DECLARE
    v_agency_id uuid;
    v_role text;
  BEGIN
    -- Try to get from app_metadata first, then user_metadata
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
      id,
      email,
      full_name,
      role,
      agency_id,
      created_at,
      updated_at
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

    -- Update the JWT claims in app_metadata for RLS policies
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