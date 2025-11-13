-- Migration 009: Create get_college_activity function for activity feed
-- Epic 3: Entities Domain
-- Story 3.1: College Registry - Task 5
-- Acceptance Criteria: AC 14-16
-- Foundation for college activity feed with filtering and search capabilities

BEGIN;

-- ============================================================
-- STEP 1: Create Activity Feed Function
-- ============================================================

-- Function: get_college_activity()
-- Retrieves activity feed for a college from audit_logs
-- Includes activities for the college itself and related entities (branches, contacts)
-- Supports time-based filtering and text search
CREATE OR REPLACE FUNCTION get_college_activity(
  p_college_id UUID,
  p_from_date TIMESTAMPTZ DEFAULT NULL,
  p_search_query TEXT DEFAULT NULL
)
RETURNS TABLE (
  id UUID,
  timestamp TIMESTAMPTZ,
  user_name TEXT,
  entity_type TEXT,
  action TEXT,
  old_values JSONB,
  new_values JSONB
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    al.id,
    al.created_at AS timestamp,
    u.full_name AS user_name,
    al.entity_type,
    al.action,
    al.old_values,
    al.new_values
  FROM audit_logs al
  LEFT JOIN users u ON al.user_id = u.id
  WHERE
    (
      -- College activities
      (al.entity_id = p_college_id AND al.entity_type = 'college')
      -- Branch activities
      OR (al.entity_id IN (
        SELECT id FROM branches WHERE college_id = p_college_id
      ) AND al.entity_type = 'branch')
      -- College contact activities
      OR (al.entity_id IN (
        SELECT id FROM college_contacts WHERE college_id = p_college_id
      ) AND al.entity_type = 'college_contact')
    )
    -- Time period filter
    AND (p_from_date IS NULL OR al.created_at >= p_from_date)
    -- Text search filter (searches in action field)
    AND (p_search_query IS NULL OR al.action ILIKE '%' || p_search_query || '%')
  ORDER BY al.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================
-- STEP 2: Add Documentation
-- ============================================================

COMMENT ON FUNCTION get_college_activity(UUID, TIMESTAMPTZ, TEXT) IS
  'Retrieves activity feed for a college from audit_logs. Includes activities for the college itself, its branches, and contacts. Supports time-based filtering (p_from_date) and text search (p_search_query) on action field. Returns activities ordered by timestamp (newest first).';

COMMIT;
