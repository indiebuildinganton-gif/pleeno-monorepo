-- Migration 004: Create student_enrollments table
-- Epic 3: Entities Domain - Student Registry
-- Story 3.2: Student Registry - Database foundation for student management system

BEGIN;

-- ============================================================
-- STEP 1: Create Student Enrollments Table
-- ============================================================

CREATE TABLE student_enrollments (
  -- Primary key
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Foreign keys
  student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  college_id UUID NOT NULL REFERENCES colleges(id) ON DELETE CASCADE,
  branch_id UUID NOT NULL REFERENCES branches(id) ON DELETE CASCADE,

  -- REQUIRED: Tenant isolation key
  agency_id UUID NOT NULL REFERENCES agencies(id) ON DELETE CASCADE,

  -- Enrollment information
  enrollment_date DATE NOT NULL DEFAULT CURRENT_DATE,

  -- Standard timestamps
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- ============================================================
-- STEP 2: Create Indexes (REQUIRED for performance)
-- ============================================================

-- CRITICAL: Index on agency_id for RLS query performance
CREATE INDEX idx_student_enrollments_agency_id ON student_enrollments(agency_id);

-- Additional indexes for common query patterns
CREATE INDEX idx_student_enrollments_student_id ON student_enrollments(agency_id, student_id);
CREATE INDEX idx_student_enrollments_college_id ON student_enrollments(agency_id, college_id);
CREATE INDEX idx_student_enrollments_branch_id ON student_enrollments(agency_id, branch_id);
CREATE INDEX idx_student_enrollments_enrollment_date ON student_enrollments(agency_id, enrollment_date);

-- ============================================================
-- STEP 3: Add Triggers
-- ============================================================

-- Automatically update updated_at timestamp
CREATE TRIGGER update_student_enrollments_updated_at
  BEFORE UPDATE ON student_enrollments
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================================
-- STEP 4: Enable RLS
-- ============================================================

ALTER TABLE student_enrollments ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- STEP 5: Create RLS Policies
-- ============================================================

-- SELECT Policy: Agency Isolation
CREATE POLICY student_enrollments_agency_isolation_select ON student_enrollments
  FOR SELECT
  USING (
    agency_id = (
      SELECT agency_id
      FROM users
      WHERE id = auth.uid()
    )
  );

-- INSERT Policy: Agency Isolation
CREATE POLICY student_enrollments_agency_isolation_insert ON student_enrollments
  FOR INSERT
  WITH CHECK (
    agency_id = (
      SELECT agency_id
      FROM users
      WHERE id = auth.uid()
    )
  );

-- UPDATE Policy: Agency Isolation
CREATE POLICY student_enrollments_agency_isolation_update ON student_enrollments
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
CREATE POLICY student_enrollments_agency_isolation_delete ON student_enrollments
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

COMMENT ON TABLE student_enrollments IS
  'Student enrollment records linking students to colleges and branches with multi-tenant isolation';

COMMENT ON COLUMN student_enrollments.agency_id IS
  'Foreign key to agencies table - enforces tenant isolation via RLS policies';

COMMENT ON COLUMN student_enrollments.student_id IS
  'Foreign key to students table - the enrolled student';

COMMENT ON COLUMN student_enrollments.college_id IS
  'Foreign key to colleges table - the institution where student is enrolled';

COMMENT ON COLUMN student_enrollments.branch_id IS
  'Foreign key to branches table - the specific campus/branch of enrollment';

COMMENT ON COLUMN student_enrollments.enrollment_date IS
  'Date when student enrolled at this branch';

COMMENT ON POLICY student_enrollments_agency_isolation_select ON student_enrollments IS
  'Agency isolation: Users can only SELECT enrollments belonging to their agency';

COMMIT;
