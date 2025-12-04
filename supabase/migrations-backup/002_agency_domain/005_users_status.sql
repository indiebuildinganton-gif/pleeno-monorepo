-- Migration 005: User Status Management and Authentication Control
-- Epic 2: Agency Setup and User Management
-- Story 2.3: User Management Interface (AC 3, 4)
--
-- This migration adds:
-- 1. Status field to users table (if not exists)
-- 2. Trigger to prevent inactive users from logging in
-- 3. Audit logging trigger for status and role changes
-- 4. RLS policy updates to check status for authentication

BEGIN;

-- ============================================================================
-- ADD STATUS FIELD TO USERS TABLE
-- ============================================================================

-- Add status field to users table (idempotent - column may already exist)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'users'
    AND column_name = 'status'
  ) THEN
    ALTER TABLE users ADD COLUMN status TEXT
      CHECK (status IN ('active', 'inactive'))
      DEFAULT 'active';

    COMMENT ON COLUMN users.status IS 'User account status: active (can log in) or inactive (blocked from login)';
  END IF;
END $$;

-- Create index for efficient status queries if not exists
CREATE INDEX IF NOT EXISTS idx_users_status_lookup ON users(status) WHERE status = 'inactive';

-- ============================================================================
-- TRIGGER: Prevent Inactive Users from Logging In
-- ============================================================================

-- Function to check user status on authentication
-- Note: Supabase Auth manages sessions in auth.sessions table (auth schema)
-- Direct triggers on auth.sessions may not be supported in all Supabase versions
-- This function should be called from middleware/API layer during authentication
CREATE OR REPLACE FUNCTION check_user_active()
RETURNS TRIGGER AS $$
DECLARE
  user_status TEXT;
BEGIN
  -- Get user status from public.users table
  SELECT status INTO user_status
  FROM public.users
  WHERE id = NEW.user_id;

  -- If user not found or inactive, prevent session creation
  IF user_status IS NULL THEN
    RAISE EXCEPTION 'User not found in users table';
  END IF;

  IF user_status = 'inactive' THEN
    RAISE EXCEPTION 'User account is deactivated. Please contact your agency administrator.';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION check_user_active IS 'Validates that a user is active before allowing session creation. Raises exception if user is inactive.';

-- Attempt to create trigger on auth.sessions
-- NOTE: This may fail if auth.sessions is not accessible
-- In that case, status checking should be enforced at the API/middleware level
DO $$
BEGIN
  -- Drop trigger if it exists
  DROP TRIGGER IF EXISTS check_user_active_trigger ON auth.sessions;

  -- Create trigger to check user status on session creation
  CREATE TRIGGER check_user_active_trigger
    BEFORE INSERT ON auth.sessions
    FOR EACH ROW
    EXECUTE FUNCTION check_user_active();
EXCEPTION
  WHEN insufficient_privilege THEN
    RAISE NOTICE 'Cannot create trigger on auth.sessions (insufficient privileges). User status checking must be enforced at API/middleware level.';
  WHEN undefined_table THEN
    RAISE NOTICE 'auth.sessions table not accessible. User status checking must be enforced at API/middleware level.';
END $$;

-- ============================================================================
-- TRIGGER: Audit Logging for User Changes
-- ============================================================================

-- Function to log status and role changes to audit_log table
CREATE OR REPLACE FUNCTION log_user_changes()
RETURNS TRIGGER AS $$
DECLARE
  acting_user_id UUID;
BEGIN
  -- Get the current user ID from session or use the updated user's ID
  acting_user_id := COALESCE(
    NULLIF(current_setting('app.current_user_id', TRUE), '')::UUID,
    auth.uid(),
    NEW.id  -- Fallback to the user being updated
  );

  -- Log status changes
  IF OLD.status IS DISTINCT FROM NEW.status THEN
    INSERT INTO audit_log (entity_type, entity_id, user_id, action, changes_json, created_at)
    VALUES (
      'user',
      NEW.id,
      acting_user_id,
      'status_change',
      jsonb_build_object(
        'old_status', OLD.status,
        'new_status', NEW.status,
        'changed_at', now(),
        'user_email', NEW.email,
        'user_name', NEW.full_name
      ),
      now()
    );
  END IF;

  -- Log role changes
  IF OLD.role IS DISTINCT FROM NEW.role THEN
    INSERT INTO audit_log (entity_type, entity_id, user_id, action, changes_json, created_at)
    VALUES (
      'user',
      NEW.id,
      acting_user_id,
      'role_change',
      jsonb_build_object(
        'old_role', OLD.role,
        'new_role', NEW.role,
        'changed_at', now(),
        'user_email', NEW.email,
        'user_name', NEW.full_name
      ),
      now()
    );
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION log_user_changes IS 'Automatically logs status and role changes to audit_log table for compliance and tracking';

-- Drop existing trigger if it exists and recreate
DROP TRIGGER IF EXISTS user_changes_audit_trigger ON users;

CREATE TRIGGER user_changes_audit_trigger
  AFTER UPDATE ON users
  FOR EACH ROW
  EXECUTE FUNCTION log_user_changes();

-- ============================================================================
-- RLS POLICY UPDATES
-- ============================================================================

-- Update existing RLS policies to consider user status
-- Users should only be able to interact with active users (except admins)

-- Policy for selecting users - allow viewing inactive users for admin
-- (This assumes existing RLS policies already check agency_id)
DROP POLICY IF EXISTS "Users can view active users in their agency" ON users;

CREATE POLICY "Users can view active users in their agency"
  ON users
  FOR SELECT
  TO authenticated
  USING (
    -- Users can view users in their own agency
    agency_id = (SELECT agency_id FROM users WHERE id = auth.uid())
    AND (
      -- Either the user is active
      status = 'active'
      -- OR the viewing user is an admin (can see all users)
      OR (SELECT role FROM users WHERE id = auth.uid()) = 'agency_admin'
    )
  );

-- ============================================================================
-- HELPER FUNCTION FOR API LAYER
-- ============================================================================

-- Function to validate user status (for use in API/middleware)
CREATE OR REPLACE FUNCTION check_user_active_status(user_uuid UUID)
RETURNS BOOLEAN AS $$
DECLARE
  user_status TEXT;
BEGIN
  SELECT status INTO user_status
  FROM users
  WHERE id = user_uuid;

  IF user_status IS NULL THEN
    RAISE EXCEPTION 'User not found';
  END IF;

  IF user_status != 'active' THEN
    RAISE EXCEPTION 'User account is % and cannot log in. Please contact your agency administrator.', user_status;
  END IF;

  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION check_user_active_status IS 'Validates that a user is active before allowing authentication. Call from middleware/API layer. Returns TRUE if active, raises exception if inactive.';

-- ============================================================================
-- NOTES FOR IMPLEMENTATION
-- ============================================================================

-- 1. The status field may already exist in the users table from the original schema.
--    This migration ensures it exists and has proper constraints.
--
-- 2. Preventing inactive user logins MUST be enforced at multiple levels:
--    a) Database trigger on auth.sessions (if supported)
--    b) API/middleware level by calling check_user_active_status()
--    c) Client-side checks (for UX, not security)
--
-- 3. Constraint to prevent admin from deactivating themselves should be
--    enforced at the API level, not database level, for better error messages.
--
-- 4. To set the current_user_id for audit logging, use:
--    SELECT set_config('app.current_user_id', auth.uid()::text, false);
--    This should be called at the start of API routes that modify users.
--
-- 5. The audit_log table must exist before this migration runs.
--    It should be created in an earlier migration (e.g., 001_agency_domain/006_users_status.sql)
--
-- 6. RLS policies are updated to allow admins to view inactive users while
--    regular users can only see active users.
--
-- 7. For API implementation, use check_user_active_status() during authentication
--    to ensure inactive users cannot log in:
--
--    Example middleware:
--    ```typescript
--    const { data, error } = await supabase.rpc('check_user_active_status', {
--      user_uuid: user.id
--    });
--    if (error) {
--      throw new Error('Account is deactivated');
--    }
--    ```

COMMIT;
