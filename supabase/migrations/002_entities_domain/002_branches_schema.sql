-- Migration 002: Create branches table
-- Epic 3: Entities Domain
-- Foundation for college campus/branch management

BEGIN;

-- ============================================================
-- STEP 1: Create Branches Table
-- ============================================================

CREATE TABLE branches (
  -- Primary key
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Foreign keys
  college_id UUID NOT NULL REFERENCES colleges(id) ON DELETE CASCADE,

  -- REQUIRED: Tenant isolation key
  agency_id UUID NOT NULL REFERENCES agencies(id) ON DELETE CASCADE,

  -- Branch information
  name TEXT NOT NULL,
  city TEXT NOT NULL,
  commission_rate_percent DECIMAL(5,2) CHECK (commission_rate_percent BETWEEN 0 AND 100),  -- Overrides college default

  -- Standard timestamps
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- ============================================================
-- STEP 2: Create Indexes (REQUIRED for performance)
-- ============================================================

-- CRITICAL: Index on agency_id for RLS query performance
CREATE INDEX idx_branches_agency_id ON branches(agency_id);

-- Additional indexes for common query patterns
CREATE INDEX idx_branches_college_id ON branches(agency_id, college_id);
CREATE INDEX idx_branches_city ON branches(agency_id, city);
CREATE INDEX idx_branches_name ON branches(agency_id, name);

-- ============================================================
-- STEP 3: Add Triggers
-- ============================================================

-- Automatically update updated_at timestamp
CREATE TRIGGER update_branches_updated_at
  BEFORE UPDATE ON branches
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================================
-- STEP 4: Enable RLS
-- ============================================================

ALTER TABLE branches ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- STEP 5: Create RLS Policies
-- ============================================================

-- SELECT Policy: Agency Isolation
CREATE POLICY branches_agency_isolation_select ON branches
  FOR SELECT
  USING (
    agency_id = (
      SELECT agency_id
      FROM users
      WHERE id = auth.uid()
    )
  );

-- INSERT Policy: Agency Isolation
CREATE POLICY branches_agency_isolation_insert ON branches
  FOR INSERT
  WITH CHECK (
    agency_id = (
      SELECT agency_id
      FROM users
      WHERE id = auth.uid()
    )
  );

-- UPDATE Policy: Agency Isolation
CREATE POLICY branches_agency_isolation_update ON branches
  FOR UPDATE
  USING (
    agency_id = (
      SELECT agency_id
      FROM users
      WHERE id = auth.uid()
    )
  )
  WITH CHECK (
    agency_id = (
      SELECT agency_id
      FROM users
      WHERE id = auth.uid()
    )
  );

-- DELETE Policy: Agency Isolation
CREATE POLICY branches_agency_isolation_delete ON branches
  FOR DELETE
  USING (
    agency_id = (
      SELECT agency_id
      FROM users
      WHERE id = auth.uid()
    )
  );

-- ============================================================
-- STEP 6: Add Documentation
-- ============================================================

COMMENT ON TABLE branches IS
  'College branches/campuses with optional commission rate overrides';

COMMENT ON COLUMN branches.agency_id IS
  'Foreign key to agencies table - enforces tenant isolation via RLS policies';

COMMENT ON COLUMN branches.college_id IS
  'Foreign key to colleges table - the parent institution';

COMMENT ON COLUMN branches.commission_rate_percent IS
  'Commission rate for this branch (0-100%). Overrides college default if set.';

COMMENT ON POLICY branches_agency_isolation_select ON branches IS
  'Agency isolation: Users can only SELECT branches belonging to their agency';

COMMIT;
