-- Migration 001: Create colleges table
-- Epic 3: Entities Domain
-- Foundation for educational institution management

BEGIN;

-- ============================================================
-- STEP 1: Create Colleges Table
-- ============================================================

CREATE TABLE colleges (
  -- Primary key
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- REQUIRED: Tenant isolation key
  agency_id UUID NOT NULL REFERENCES agencies(id) ON DELETE CASCADE,

  -- College information
  name TEXT NOT NULL,
  city TEXT,
  country TEXT,
  default_commission_rate_percent DECIMAL(5,2) CHECK (default_commission_rate_percent BETWEEN 0 AND 100),
  gst_status TEXT CHECK (gst_status IN ('included', 'excluded')) DEFAULT 'included',
  contract_expiration_date DATE,

  -- Standard timestamps
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- ============================================================
-- STEP 2: Create Indexes (REQUIRED for performance)
-- ============================================================

-- CRITICAL: Index on agency_id for RLS query performance
CREATE INDEX idx_colleges_agency_id ON colleges(agency_id);

-- Additional indexes for common query patterns
CREATE INDEX idx_colleges_name ON colleges(agency_id, name);
CREATE INDEX idx_colleges_country ON colleges(agency_id, country) WHERE country IS NOT NULL;

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
CREATE POLICY colleges_agency_isolation_select ON colleges
  FOR SELECT
  USING (
    agency_id = (
      SELECT agency_id
      FROM users
      WHERE id = auth.uid()
    )
  );

-- INSERT Policy: Agency Isolation
CREATE POLICY colleges_agency_isolation_insert ON colleges
  FOR INSERT
  WITH CHECK (
    agency_id = (
      SELECT agency_id
      FROM users
      WHERE id = auth.uid()
    )
  );

-- UPDATE Policy: Agency Isolation
CREATE POLICY colleges_agency_isolation_update ON colleges
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
CREATE POLICY colleges_agency_isolation_delete ON colleges
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

COMMENT ON TABLE colleges IS
  'Educational institutions (colleges/universities) with multi-tenant isolation';

COMMENT ON COLUMN colleges.agency_id IS
  'Foreign key to agencies table - enforces tenant isolation via RLS policies';

COMMENT ON COLUMN colleges.default_commission_rate_percent IS
  'Default commission rate for this college (0-100%). Can be overridden at branch level.';

COMMENT ON COLUMN colleges.gst_status IS
  'Whether commission amounts include or exclude GST: included or excluded';

COMMENT ON POLICY colleges_agency_isolation_select ON colleges IS
  'Agency isolation: Users can only SELECT colleges belonging to their agency';

COMMIT;
