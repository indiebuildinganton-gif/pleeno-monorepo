-- Template for creating new tenant-scoped table with RLS
-- Copy this template and replace {table_name} with actual table name
-- IMPORTANT: Delete this template file before applying migration

-- Migration XXX: Create {table_name} table with RLS
-- Epic: X - Description
-- Story: X.X - Description

BEGIN;

-- ============================================================
-- STEP 1: Create Table
-- ============================================================

CREATE TABLE {table_name} (
  -- Primary key
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- REQUIRED: Tenant isolation key
  agency_id UUID NOT NULL REFERENCES agencies(id) ON DELETE CASCADE,

  -- Add your table-specific columns here
  -- example_column TEXT NOT NULL,

  -- Standard timestamps
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- ============================================================
-- STEP 2: Create Indexes (REQUIRED for performance)
-- ============================================================

-- CRITICAL: Index on agency_id for RLS query performance
CREATE INDEX idx_{table_name}_agency_id ON {table_name}(agency_id);

-- Add additional indexes based on query patterns
-- CREATE INDEX idx_{table_name}_agency_status ON {table_name}(agency_id, status);

-- ============================================================
-- STEP 3: Add Triggers
-- ============================================================

-- Automatically update updated_at timestamp
CREATE TRIGGER update_{table_name}_updated_at
  BEFORE UPDATE ON {table_name}
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================================
-- STEP 4: Enable RLS
-- ============================================================

ALTER TABLE {table_name} ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- STEP 5: Create RLS Policies
-- ============================================================

-- SELECT Policy: Agency Isolation
CREATE POLICY {table_name}_agency_isolation_select ON {table_name}
  FOR SELECT
  USING (
    agency_id = (
      SELECT agency_id
      FROM users
      WHERE id = auth.uid()
    )
  );

-- INSERT Policy: Agency Isolation
CREATE POLICY {table_name}_agency_isolation_insert ON {table_name}
  FOR INSERT
  WITH CHECK (
    agency_id = (
      SELECT agency_id
      FROM users
      WHERE id = auth.uid()
    )
  );

-- UPDATE Policy: Agency Isolation
CREATE POLICY {table_name}_agency_isolation_update ON {table_name}
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
CREATE POLICY {table_name}_agency_isolation_delete ON {table_name}
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

COMMENT ON TABLE {table_name} IS
  'Description of table purpose and multi-tenant isolation pattern';

COMMENT ON COLUMN {table_name}.agency_id IS
  'Foreign key to agencies table - enforces tenant isolation via RLS policies';

COMMENT ON POLICY {table_name}_agency_isolation_select ON {table_name} IS
  'Agency isolation: Users can only SELECT rows belonging to their agency';

COMMIT;
