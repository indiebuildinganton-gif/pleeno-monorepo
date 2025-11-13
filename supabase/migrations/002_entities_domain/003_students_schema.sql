-- Migration 003: Create students table
-- Epic 3: Entities Domain - Student Registry
-- Story 3.2: Student Registry - Database foundation for student management system

BEGIN;

-- ============================================================
-- STEP 1: Create Students Table
-- ============================================================

CREATE TABLE students (
  -- Primary key
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- REQUIRED: Tenant isolation key
  agency_id UUID NOT NULL REFERENCES agencies(id) ON DELETE CASCADE,

  -- Student core information
  full_name TEXT NOT NULL,
  email TEXT,  -- Optional
  phone TEXT,  -- Optional
  passport_number TEXT NOT NULL,
  date_of_birth DATE,
  nationality TEXT,

  -- Visa status enum
  visa_status TEXT CHECK (visa_status IN ('in_process', 'approved', 'denied', 'expired')),

  -- Standard timestamps
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL,

  -- UNIQUE constraint: passport numbers unique within each agency only
  UNIQUE(agency_id, passport_number)
);

-- ============================================================
-- STEP 2: Create Indexes (REQUIRED for performance)
-- ============================================================

-- CRITICAL: Index on agency_id for RLS query performance
CREATE INDEX idx_students_agency_id ON students(agency_id);

-- Additional indexes for common query patterns
CREATE INDEX idx_students_passport ON students(agency_id, passport_number);
CREATE INDEX idx_students_email ON students(agency_id, email) WHERE email IS NOT NULL;
CREATE INDEX idx_students_visa_status ON students(agency_id, visa_status) WHERE visa_status IS NOT NULL;

-- ============================================================
-- STEP 3: Add Triggers
-- ============================================================

-- Automatically update updated_at timestamp
CREATE TRIGGER update_students_updated_at
  BEFORE UPDATE ON students
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================================
-- STEP 4: Enable RLS
-- ============================================================

ALTER TABLE students ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- STEP 5: Create RLS Policies
-- ============================================================

-- SELECT Policy: Agency Isolation
CREATE POLICY students_agency_isolation_select ON students
  FOR SELECT
  USING (
    agency_id = (
      SELECT agency_id
      FROM users
      WHERE id = auth.uid()
    )
  );

-- INSERT Policy: Agency Isolation
CREATE POLICY students_agency_isolation_insert ON students
  FOR INSERT
  WITH CHECK (
    agency_id = (
      SELECT agency_id
      FROM users
      WHERE id = auth.uid()
    )
  );

-- UPDATE Policy: Agency Isolation
CREATE POLICY students_agency_isolation_update ON students
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
CREATE POLICY students_agency_isolation_delete ON students
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

COMMENT ON TABLE students IS
  'Student records with multi-tenant isolation. Each agency maintains its own student registry with RLS enforcement.';

COMMENT ON COLUMN students.agency_id IS
  'Foreign key to agencies table - enforces tenant isolation via RLS policies';

COMMENT ON COLUMN students.passport_number IS
  'Passport number - unique within each agency (not globally unique)';

COMMENT ON COLUMN students.visa_status IS
  'Current visa status: in_process, approved, denied, or expired';

COMMENT ON COLUMN students.email IS
  'Student email - optional to support partial data collection';

COMMENT ON COLUMN students.phone IS
  'Student phone number - optional to support partial data collection';

COMMENT ON POLICY students_agency_isolation_select ON students IS
  'Agency isolation: Users can only SELECT students belonging to their agency';

COMMIT;
