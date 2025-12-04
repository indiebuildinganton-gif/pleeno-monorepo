-- Migration 002: Create branches table with auto-commission inheritance
-- Epic 3: Entities Domain
-- Story 3.1: College Registry - Task 2
-- Foundation for college campus/branch management with automatic commission rate inheritance

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
-- STEP 2: Create Trigger Function for Auto-Commission Rate
-- ============================================================

-- Trigger function to auto-populate commission rate from college default
CREATE OR REPLACE FUNCTION set_branch_default_commission()
RETURNS TRIGGER AS $$
BEGIN
  -- If commission_rate_percent is not provided, copy from college
  IF NEW.commission_rate_percent IS NULL THEN
    SELECT default_commission_rate_percent INTO NEW.commission_rate_percent
    FROM colleges WHERE id = NEW.college_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply trigger before INSERT on branches
CREATE TRIGGER branch_default_commission_trigger
  BEFORE INSERT ON branches
  FOR EACH ROW
  EXECUTE FUNCTION set_branch_default_commission();

-- ============================================================
-- STEP 3: Create Indexes (REQUIRED for performance)
-- ============================================================

-- CRITICAL: Index on agency_id for RLS query performance
CREATE INDEX idx_branches_agency_id ON branches(agency_id);

-- Additional indexes for common query patterns
CREATE INDEX idx_branches_college_id ON branches(agency_id, college_id);
CREATE INDEX idx_branches_city ON branches(agency_id, city);
CREATE INDEX idx_branches_name ON branches(agency_id, name);

-- ============================================================
-- STEP 4: Add Updated_At Trigger
-- ============================================================

-- Automatically update updated_at timestamp
CREATE TRIGGER update_branches_updated_at
  BEFORE UPDATE ON branches
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================================
-- STEP 5: Enable RLS
-- ============================================================

ALTER TABLE branches ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- STEP 6: Create RLS Policies
-- ============================================================

-- SELECT Policy: Agency Isolation
-- All users can view branches in their agency
CREATE POLICY branches_agency_isolation_select ON branches
  FOR SELECT
  USING (
    agency_id = (
      SELECT agency_id
      FROM users
      WHERE id = auth.uid()
    )
  );

-- INSERT Policy: Admin Only
-- Only agency admins can create branches
CREATE POLICY branches_admin_insert ON branches
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
-- Only agency admins can update branches in their agency
CREATE POLICY branches_admin_update ON branches
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
-- Only agency admins can delete branches in their agency
CREATE POLICY branches_admin_delete ON branches
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
-- STEP 7: Add Documentation
-- ============================================================

COMMENT ON TABLE branches IS
  'College branches/campuses with optional commission rate overrides and automatic inheritance from parent college';

COMMENT ON COLUMN branches.agency_id IS
  'Foreign key to agencies table - enforces tenant isolation via RLS policies';

COMMENT ON COLUMN branches.college_id IS
  'Foreign key to colleges table - the parent institution. Cascade deletes when college is deleted.';

COMMENT ON COLUMN branches.name IS
  'Branch name (e.g., "Main Campus", "Downtown Branch")';

COMMENT ON COLUMN branches.city IS
  'City where this branch is located (may differ from parent college city)';

COMMENT ON COLUMN branches.commission_rate_percent IS
  'Commission rate for this branch (0-100%). If not provided, automatically inherits from college default_commission_rate_percent via trigger. Can override college default if explicitly set.';

COMMENT ON POLICY branches_agency_isolation_select ON branches IS
  'Agency isolation: Users can only SELECT branches belonging to their agency';

COMMENT ON POLICY branches_admin_insert ON branches IS
  'Admin only: Only agency_admin role can INSERT new branches';

COMMENT ON POLICY branches_admin_update ON branches IS
  'Admin only: Only agency_admin role can UPDATE branches in their agency';

COMMENT ON POLICY branches_admin_delete ON branches IS
  'Admin only: Only agency_admin role can DELETE branches in their agency';

COMMIT;
