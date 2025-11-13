-- Migration 001: Create colleges table with RLS
-- Epic 3: Core Entity Management
-- Story 3.1: College Registry - Task 1

BEGIN;

-- ============================================================
-- STEP 1: Create Table
-- ============================================================

CREATE TABLE colleges (
  -- Primary key
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Tenant isolation key
  agency_id UUID NOT NULL REFERENCES agencies(id) ON DELETE CASCADE,

  -- College information
  name TEXT NOT NULL,
  city TEXT,
  default_commission_rate_percent DECIMAL(5,2)
    CHECK (default_commission_rate_percent BETWEEN 0 AND 100),
  gst_status TEXT NOT NULL DEFAULT 'included'
    CHECK (gst_status IN ('included', 'excluded')),

  -- Standard timestamps
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL,

  -- Unique constraint: Prevent duplicate college names within agency
  UNIQUE(agency_id, name)
);

-- ============================================================
-- STEP 2: Create Indexes (REQUIRED for performance)
-- ============================================================

-- CRITICAL: Index on agency_id for RLS query performance
CREATE INDEX idx_colleges_agency_id ON colleges(agency_id);

-- Index for name searches within agency
CREATE INDEX idx_colleges_agency_name ON colleges(agency_id, name);

-- Index for city-based queries
CREATE INDEX idx_colleges_city ON colleges(agency_id, city) WHERE city IS NOT NULL;

-- ============================================================
-- STEP 3: Add Triggers
-- ============================================================

-- Automatically update updated_at timestamp
CREATE TRIGGER update_colleges_updated_at
  BEFORE UPDATE ON colleges
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================================
-- STEP 4: Enable RLS
-- ============================================================

ALTER TABLE colleges ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- STEP 5: Create RLS Policies
-- ============================================================

-- SELECT Policy: Agency Isolation
-- All users can view colleges in their agency
CREATE POLICY colleges_agency_isolation_select ON colleges
  FOR SELECT
  USING (
    agency_id = (
      SELECT agency_id
      FROM users
      WHERE id = auth.uid()
    )
  );

-- INSERT Policy: Admin Only
-- Only agency admins can create colleges
CREATE POLICY colleges_admin_insert ON colleges
  FOR INSERT
  WITH CHECK (
    agency_id = (
      SELECT agency_id
      FROM users
      WHERE id = auth.uid()
      AND role = 'agency_admin'
    )
  );

-- UPDATE Policy: Admin Only
-- Only agency admins can update colleges in their agency
CREATE POLICY colleges_admin_update ON colleges
  FOR UPDATE
  USING (
    agency_id = (
      SELECT agency_id
      FROM users
      WHERE id = auth.uid()
      AND role = 'agency_admin'
    )
  )
  WITH CHECK (
    agency_id = (
      SELECT agency_id
      FROM users
      WHERE id = auth.uid()
      AND role = 'agency_admin'
    )
  );

-- DELETE Policy: Admin Only
-- Only agency admins can delete colleges in their agency
CREATE POLICY colleges_admin_delete ON colleges
  FOR DELETE
  USING (
    agency_id = (
      SELECT agency_id
      FROM users
      WHERE id = auth.uid()
      AND role = 'agency_admin'
    )
  );

-- ============================================================
-- STEP 6: Add Documentation
-- ============================================================

COMMENT ON TABLE colleges IS
  'Registry of educational institutions with multi-tenant isolation. Each college can have multiple branches, contacts, and associated students.';

COMMENT ON COLUMN colleges.agency_id IS
  'Foreign key to agencies table - enforces tenant isolation via RLS policies';

COMMENT ON COLUMN colleges.name IS
  'College name - must be unique within agency (enforced by unique constraint)';

COMMENT ON COLUMN colleges.city IS
  'Primary city where college is located (branches may be in different cities)';

COMMENT ON COLUMN colleges.default_commission_rate_percent IS
  'Default commission rate (0-100%) applied to payment plans for this college. Can be overridden at branch or payment plan level.';

COMMENT ON COLUMN colleges.gst_status IS
  'GST inclusion status: "included" (commission includes GST) or "excluded" (GST added on top)';

COMMENT ON POLICY colleges_agency_isolation_select ON colleges IS
  'Agency isolation: Users can only SELECT colleges belonging to their agency';

COMMENT ON POLICY colleges_admin_insert ON colleges IS
  'Admin only: Only agency_admin role can INSERT new colleges';

COMMENT ON POLICY colleges_admin_update ON colleges IS
  'Admin only: Only agency_admin role can UPDATE colleges in their agency';

COMMENT ON POLICY colleges_admin_delete ON colleges IS
  'Admin only: Only agency_admin role can DELETE colleges in their agency';

COMMIT;
