-- Migration 005: Create student_notes table
-- Epic 3: Entities Domain - Student Registry
-- Story 3.2: Student Registry - Database foundation for student management system

BEGIN;

-- ============================================================
-- STEP 1: Create Student Notes Table
-- ============================================================

CREATE TABLE student_notes (
  -- Primary key
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Foreign keys
  student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

  -- REQUIRED: Tenant isolation key
  agency_id UUID NOT NULL REFERENCES agencies(id) ON DELETE CASCADE,

  -- Note content with max 2000 characters constraint
  content TEXT NOT NULL CHECK (char_length(content) <= 2000),

  -- Standard timestamps
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- ============================================================
-- STEP 2: Create Indexes (REQUIRED for performance)
-- ============================================================

-- CRITICAL: Index on agency_id for RLS query performance
CREATE INDEX idx_student_notes_agency_id ON student_notes(agency_id);

-- Additional indexes for common query patterns
CREATE INDEX idx_student_notes_student_id ON student_notes(agency_id, student_id);
CREATE INDEX idx_student_notes_user_id ON student_notes(agency_id, user_id);
CREATE INDEX idx_student_notes_created_at ON student_notes(agency_id, created_at DESC);

-- ============================================================
-- STEP 3: Add Triggers
-- ============================================================

-- Automatically update updated_at timestamp
CREATE TRIGGER update_student_notes_updated_at
  BEFORE UPDATE ON student_notes
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================================
-- STEP 4: Enable RLS
-- ============================================================

ALTER TABLE student_notes ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- STEP 5: Create RLS Policies
-- ============================================================

-- SELECT Policy: Agency Isolation
CREATE POLICY student_notes_agency_isolation_select ON student_notes
  FOR SELECT
  USING (
    agency_id = (
      SELECT agency_id
      FROM users
      WHERE id = auth.uid()
    )
  );

-- INSERT Policy: Agency Isolation
CREATE POLICY student_notes_agency_isolation_insert ON student_notes
  FOR INSERT
  WITH CHECK (
    agency_id = (
      SELECT agency_id
      FROM users
      WHERE id = auth.uid()
    )
  );

-- UPDATE Policy: Agency Isolation
CREATE POLICY student_notes_agency_isolation_update ON student_notes
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
CREATE POLICY student_notes_agency_isolation_delete ON student_notes
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

COMMENT ON TABLE student_notes IS
  'Notes associated with students - supports collaboration and tracking with 2000 character limit';

COMMENT ON COLUMN student_notes.agency_id IS
  'Foreign key to agencies table - enforces tenant isolation via RLS policies';

COMMENT ON COLUMN student_notes.student_id IS
  'Foreign key to students table - the student this note is about';

COMMENT ON COLUMN student_notes.user_id IS
  'Foreign key to users table - the user who created this note';

COMMENT ON COLUMN student_notes.content IS
  'Note content with maximum 2000 characters enforced by CHECK constraint';

COMMENT ON POLICY student_notes_agency_isolation_select ON student_notes IS
  'Agency isolation: Users can only SELECT notes belonging to their agency';

COMMIT;
