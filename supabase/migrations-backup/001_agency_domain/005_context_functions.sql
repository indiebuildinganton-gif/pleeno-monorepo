-- Migration 005: Create helper functions for agency context setting
-- Epic 1: Foundation & Multi-Tenant Security
-- Story 1.2: Multi-Tenant Database Schema with RLS

BEGIN;

-- Function: Extract agency_id from JWT and set session variable
CREATE OR REPLACE FUNCTION set_agency_context()
RETURNS VOID AS $$
DECLARE
  user_agency_id UUID;
BEGIN
  -- Get current user's agency_id from users table
  SELECT agency_id INTO user_agency_id
  FROM users
  WHERE id = auth.uid();

  -- Set session variable for use by RLS policies
  IF user_agency_id IS NOT NULL THEN
    PERFORM set_config(
      'app.current_agency_id',
      user_agency_id::text,
      true  -- true = local to transaction (important for security)
    );
  ELSE
    -- Clear context if no agency found
    PERFORM set_config('app.current_agency_id', '', true);
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function: Get current agency context (helper for debugging)
CREATE OR REPLACE FUNCTION get_agency_context()
RETURNS UUID AS $$
BEGIN
  RETURN current_setting('app.current_agency_id', true)::uuid;
EXCEPTION
  WHEN OTHERS THEN
    RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function: Verify user belongs to agency (helper for testing)
CREATE OR REPLACE FUNCTION verify_agency_access(target_agency_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  user_agency UUID;
BEGIN
  SELECT agency_id INTO user_agency
  FROM users
  WHERE id = auth.uid();

  RETURN user_agency = target_agency_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add comments
COMMENT ON FUNCTION set_agency_context() IS
  'Extracts agency_id from current user and sets PostgreSQL session variable app.current_agency_id';

COMMENT ON FUNCTION get_agency_context() IS
  'Returns current agency_id from session variable (useful for debugging)';

COMMENT ON FUNCTION verify_agency_access(UUID) IS
  'Checks if current user belongs to specified agency (useful for application logic)';

COMMIT;
