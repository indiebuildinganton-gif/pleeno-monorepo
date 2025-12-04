-- Migration 004: Enable RLS and create policies for users table
-- Epic 1: Foundation & Multi-Tenant Security
-- Story 1.2: Multi-Tenant Database Schema with RLS

BEGIN;

-- Enable Row-Level Security on users table
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- SELECT POLICIES
-- ============================================================

-- Policy 1: User Agency Isolation (SELECT)
-- Users can view other users in their agency
CREATE POLICY users_agency_isolation_select ON users
  FOR SELECT
  USING (
    agency_id = (
      SELECT agency_id
      FROM users
      WHERE id = auth.uid()
    )
  );

-- Policy 2: User Self-Access (SELECT)
-- Users can always view their own profile
-- This provides a fallback if agency context is missing
CREATE POLICY users_self_access_select ON users
  FOR SELECT
  USING (id = auth.uid());

-- Note: Both SELECT policies apply with OR logic
-- Result: User sees their profile + all users in their agency

-- ============================================================
-- INSERT POLICIES
-- ============================================================

-- Policy 3: Prevent User Creation (INSERT)
-- Users cannot create new user records via application
-- New users created via Supabase Auth signup + trigger
CREATE POLICY users_prevent_insert ON users
  FOR INSERT
  WITH CHECK (false);

-- ============================================================
-- UPDATE POLICIES
-- ============================================================

-- Policy 4: User Self-Update (UPDATE)
-- Users can update their own profile fields
CREATE POLICY users_self_update ON users
  FOR UPDATE
  USING (id = auth.uid())
  WITH CHECK (
    id = auth.uid()
    -- Prevent users from changing their agency_id or role
    AND agency_id = (SELECT agency_id FROM users WHERE id = auth.uid())
    AND role = (SELECT role FROM users WHERE id = auth.uid())
  );

-- Policy 5: Admin User Management (UPDATE)
-- Agency admins can update users in their agency
CREATE POLICY users_admin_update ON users
  FOR UPDATE
  USING (
    -- Admin is in same agency as target user
    agency_id = (
      SELECT agency_id
      FROM users
      WHERE id = auth.uid()
      AND role = 'agency_admin'
    )
  )
  WITH CHECK (
    -- Ensure updated user stays in same agency
    agency_id = (
      SELECT agency_id
      FROM users
      WHERE id = auth.uid()
      AND role = 'agency_admin'
    )
  );

-- ============================================================
-- DELETE POLICIES
-- ============================================================

-- Policy 6: Admin User Deletion (DELETE)
-- Agency admins can delete users in their agency
CREATE POLICY users_admin_delete ON users
  FOR DELETE
  USING (
    agency_id = (
      SELECT agency_id
      FROM users
      WHERE id = auth.uid()
      AND role = 'agency_admin'
    )
    -- Prevent admins from deleting themselves
    AND id != auth.uid()
  );

-- Add policy comments for documentation
COMMENT ON POLICY users_agency_isolation_select ON users IS
  'Users can view all users in their agency - enforced via agency_id match';

COMMENT ON POLICY users_self_access_select ON users IS
  'Users can always view their own profile - provides fallback access';

COMMENT ON POLICY users_self_update ON users IS
  'Users can update their own profile but cannot change agency_id or role';

COMMENT ON POLICY users_admin_update ON users IS
  'Agency admins can update users in their agency including role changes';

COMMENT ON POLICY users_admin_delete ON users IS
  'Agency admins can delete users in their agency but not themselves';

COMMIT;
