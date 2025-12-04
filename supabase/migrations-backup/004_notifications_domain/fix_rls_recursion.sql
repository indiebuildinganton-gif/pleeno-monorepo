-- Fix infinite recursion in notifications RLS policies
-- Epic 5: Intelligent Status Automation & Notifications
-- Story 5.3: Overdue Payment Alerts - Bug Fix

BEGIN;

-- ============================================================
-- STEP 1: Create helper functions to bypass RLS
-- ============================================================
-- These functions use SECURITY DEFINER with postgres ownership to bypass RLS.
-- The postgres role has BYPASSRLS privilege, so queries within these functions
-- don't trigger RLS policies on the users table, preventing infinite recursion.

DROP FUNCTION IF EXISTS public.get_user_agency_id() CASCADE;
DROP FUNCTION IF EXISTS public.is_agency_admin() CASCADE;

-- Function to get user's agency_id
CREATE FUNCTION public.get_user_agency_id()
RETURNS UUID
LANGUAGE plpgsql
VOLATILE
SECURITY DEFINER
AS $$
DECLARE
  v_agency_id UUID;
  v_uid UUID;
  original_role TEXT;
BEGIN
  v_uid := auth.uid();

  -- Save current role
  SELECT current_user INTO original_role;

  -- Switch to postgres role to bypass RLS
  EXECUTE 'SET LOCAL ROLE postgres';

  -- Query without RLS
  SELECT agency_id INTO v_agency_id
  FROM users
  WHERE id = v_uid;

  -- Restore original role
  EXECUTE format('SET LOCAL ROLE %I', original_role);

  RETURN v_agency_id;
END;
$$;

-- Function to check if user is agency admin
CREATE FUNCTION public.is_agency_admin()
RETURNS BOOLEAN
LANGUAGE plpgsql
VOLATILE
SECURITY DEFINER
AS $$
DECLARE
  v_role TEXT;
  v_uid UUID;
  original_role TEXT;
BEGIN
  v_uid := auth.uid();

  -- Save current role
  SELECT current_user INTO original_role;

  -- Switch to postgres role to bypass RLS
  EXECUTE 'SET LOCAL ROLE postgres';

  -- Query without RLS
  SELECT role INTO v_role
  FROM users
  WHERE id = v_uid;

  -- Restore original role
  EXECUTE format('SET LOCAL ROLE %I', original_role);

  RETURN v_role = 'agency_admin';
END;
$$;

-- Ensure functions are owned by postgres (has BYPASSRLS)
ALTER FUNCTION public.get_user_agency_id() OWNER TO postgres;
ALTER FUNCTION public.is_agency_admin() OWNER TO postgres;

-- Grant execute to authenticated users
GRANT EXECUTE ON FUNCTION public.get_user_agency_id() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_user_agency_id() TO anon;
GRANT EXECUTE ON FUNCTION public.is_agency_admin() TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_agency_admin() TO anon;

COMMENT ON FUNCTION public.get_user_agency_id() IS
  'Returns the agency_id of the authenticated user. Uses SECURITY DEFINER with postgres ownership to bypass RLS and prevent recursion.';

COMMENT ON FUNCTION public.is_agency_admin() IS
  'Returns true if the authenticated user has agency_admin role. Uses SECURITY DEFINER with postgres ownership to bypass RLS and prevent recursion.';

-- ============================================================
-- STEP 2: Drop existing notifications policies
-- ============================================================

DROP POLICY IF EXISTS notifications_agency_isolation_select ON notifications;
DROP POLICY IF EXISTS notifications_user_update ON notifications;
DROP POLICY IF EXISTS notifications_admin_delete ON notifications;

-- ============================================================
-- STEP 3: Recreate policies using the helper function
-- ============================================================

-- SELECT Policy: Users can view notifications in their agency
CREATE POLICY notifications_agency_isolation_select ON notifications
  FOR SELECT
  USING (
    agency_id = public.get_user_agency_id()
    AND (user_id IS NULL OR user_id = auth.uid())
  );

-- UPDATE Policy: Users can update their own notifications
CREATE POLICY notifications_user_update ON notifications
  FOR UPDATE
  USING (
    agency_id = public.get_user_agency_id()
    AND (user_id IS NULL OR user_id = auth.uid())
  )
  WITH CHECK (
    agency_id = public.get_user_agency_id()
    AND (user_id IS NULL OR user_id = auth.uid())
  );

-- DELETE Policy: Admin only (for maintenance/cleanup)
CREATE POLICY notifications_admin_delete ON notifications
  FOR DELETE
  USING (
    agency_id = public.get_user_agency_id()
    AND public.is_agency_admin()
  );

-- ============================================================
-- STEP 4: Update policy comments
-- ============================================================

COMMENT ON POLICY notifications_agency_isolation_select ON notifications IS
  'Agency isolation: Users can SELECT notifications for their agency (both agency-wide and user-specific). Uses public.get_user_agency_id() to prevent RLS recursion.';

COMMENT ON POLICY notifications_user_update ON notifications IS
  'Users can UPDATE their own notifications (mark as read). Uses public.get_user_agency_id() to prevent RLS recursion.';

COMMENT ON POLICY notifications_admin_delete ON notifications IS
  'Admin only: Only agency_admin role can DELETE notifications in their agency. Uses public.get_user_agency_id() to prevent RLS recursion.';

-- ============================================================
-- STEP 5: Fix users table policies to prevent recursion
-- ============================================================
-- The users table also had recursive policies that needed fixing

DROP POLICY IF EXISTS users_agency_isolation_select ON users;
DROP POLICY IF EXISTS users_admin_update ON users;
DROP POLICY IF EXISTS users_admin_delete ON users;

CREATE POLICY users_agency_isolation_select ON users
  FOR SELECT
  USING (
    agency_id = public.get_user_agency_id()
  );

CREATE POLICY users_admin_update ON users
  FOR UPDATE
  USING (
    agency_id = public.get_user_agency_id()
    AND public.is_agency_admin()
  );

CREATE POLICY users_admin_delete ON users
  FOR DELETE
  USING (
    agency_id = public.get_user_agency_id()
    AND public.is_agency_admin()
    AND id <> auth.uid()
  );

COMMENT ON POLICY users_agency_isolation_select ON users IS
  'Agency isolation: Users can SELECT other users in their agency. Uses public.get_user_agency_id() to prevent RLS recursion.';

COMMENT ON POLICY users_admin_update ON users IS
  'Admin only: Agency admins can UPDATE users in their agency. Uses helper functions to prevent RLS recursion.';

COMMENT ON POLICY users_admin_delete ON users IS
  'Admin only: Agency admins can DELETE users in their agency (except themselves). Uses helper functions to prevent RLS recursion.';

COMMIT;
