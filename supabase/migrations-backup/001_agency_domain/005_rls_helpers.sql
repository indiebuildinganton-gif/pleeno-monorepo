-- Migration 005: RLS Helper Functions for Agency Context
-- Epic 1: Foundation & Multi-Tenant Security
-- Story 1.3: Authentication & Authorization Framework
-- Task 6: Implement Agency Context Setting

BEGIN;

-- ============================================================
-- Function: set_agency_context()
-- ============================================================
-- Sets the agency context from JWT claims for Row-Level Security filtering
-- Extracts agency_id from JWT app_metadata and sets PostgreSQL session variable
--
-- This function is called at the start of server-side data fetching operations
-- to ensure RLS policies can filter data by the authenticated user's agency.
--
-- The session variable is LOCAL to the current transaction and automatically
-- cleaned up when the transaction completes.
--
-- Usage: CALL set_agency_context() or SELECT set_agency_context()

CREATE OR REPLACE FUNCTION set_agency_context()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Get agency_id from JWT claims (app_metadata)
  -- The request.jwt.claims setting contains the decoded JWT
  -- Structure: {"sub": "user-id", "app_metadata": {"agency_id": "uuid", "role": "..."}}
  PERFORM set_config(
    'app.current_agency_id',
    COALESCE(
      -- Extract agency_id from JWT claims
      -- First get the full claims JSON, then navigate to app_metadata.agency_id
      (current_setting('request.jwt.claims', true)::json->'app_metadata'->>'agency_id'),
      ''
    ),
    true  -- true = LOCAL to current transaction (auto cleanup)
  );
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION set_agency_context() TO authenticated;

COMMENT ON FUNCTION set_agency_context() IS
'Sets the agency context from JWT app_metadata for Row-Level Security filtering. Call this at the start of server-side data operations.';


-- ============================================================
-- Function: get_current_agency_id()
-- ============================================================
-- Helper function to retrieve the current agency context value
-- Useful for debugging RLS issues and verifying context is set correctly
--
-- Returns: UUID of current agency or NULL if not set
-- Usage: SELECT get_current_agency_id()

CREATE OR REPLACE FUNCTION get_current_agency_id()
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  agency_id_text text;
BEGIN
  -- Get the session variable value
  agency_id_text := current_setting('app.current_agency_id', true);

  -- Return NULL if empty or not set
  IF agency_id_text IS NULL OR agency_id_text = '' THEN
    RETURN NULL;
  END IF;

  -- Cast to UUID and return
  RETURN agency_id_text::uuid;

EXCEPTION
  WHEN OTHERS THEN
    -- If any error (e.g., invalid UUID format), return NULL
    RETURN NULL;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION get_current_agency_id() TO authenticated;

COMMENT ON FUNCTION get_current_agency_id() IS
'Returns the current agency ID from session variable. Used for debugging RLS context.';

COMMIT;
