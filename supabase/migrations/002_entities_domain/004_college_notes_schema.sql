-- Migration 004: Create college_notes table
-- Epic 3: Entities Domain
-- Story 3.1: College Registry - Task 4
-- Foundation for managing college notes with user attribution and 2000 character limit

BEGIN;

-- ============================================================
-- STEP 1: Create College Notes Table
-- ============================================================

CREATE TABLE college_notes (
  -- Primary key
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Foreign keys
  college_id UUID NOT NULL REFERENCES colleges(id) ON DELETE CASCADE,
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
CREATE INDEX idx_college_notes_agency ON college_notes(agency_id);

-- Index for chronological display of notes (as per AC)
CREATE INDEX idx_college_notes_college ON college_notes(college_id, created_at DESC);

-- Additional indexes for common query patterns
CREATE INDEX idx_college_notes_user_id ON college_notes(agency_id, user_id);

-- ============================================================
-- STEP 3: Add Triggers
-- ============================================================

-- Automatically update updated_at timestamp
CREATE TRIGGER update_college_notes_updated_at
  BEFORE UPDATE ON college_notes
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================================
-- STEP 4: Enable RLS
-- ============================================================

ALTER TABLE college_notes ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- STEP 5: Create RLS Policies
-- ============================================================

-- SELECT Policy: Agency Isolation
-- All users in the agency can view notes
CREATE POLICY college_notes_agency_isolation_select ON college_notes
  FOR SELECT
  USING (
    agency_id = (
      SELECT agency_id
      FROM users
      WHERE id = auth.uid()
    )
  );

-- INSERT Policy: All Authenticated Users
-- All users in the agency can create notes
CREATE POLICY college_notes_agency_insert ON college_notes
  FOR INSERT
  WITH CHECK (
    agency_id = (
      SELECT agency_id
      FROM users
      WHERE id = auth.uid()
    )
  );

-- UPDATE Policy: Own Notes or Admin
-- Users can update their own notes, admins can update all notes in their agency
CREATE POLICY college_notes_update ON college_notes
  FOR UPDATE
  USING (
    agency_id = (
      SELECT agency_id
      FROM users
      WHERE id = auth.uid()
    )
    AND (
      user_id = auth.uid()
      OR EXISTS (
        SELECT 1
        FROM users
        WHERE id = auth.uid()
        AND role = 'agency_admin'
        AND agency_id = college_notes.agency_id
      )
    )
  )
  WITH CHECK (
    agency_id = (
      SELECT agency_id
      FROM users
      WHERE id = auth.uid()
    )
  );

-- DELETE Policy: Own Notes or Admin
-- Users can delete their own notes, admins can delete all notes in their agency
CREATE POLICY college_notes_delete ON college_notes
  FOR DELETE
  USING (
    agency_id = (
      SELECT agency_id
      FROM users
      WHERE id = auth.uid()
    )
    AND (
      user_id = auth.uid()
      OR EXISTS (
        SELECT 1
        FROM users
        WHERE id = auth.uid()
        AND role = 'agency_admin'
        AND agency_id = college_notes.agency_id
      )
    )
  );

-- ============================================================
-- STEP 6: Add Documentation
-- ============================================================

COMMENT ON TABLE college_notes IS
  'Notes associated with colleges - supports collaboration and tracking with 2000 character limit. All users can add notes, users can modify/delete their own notes, admins can modify/delete all notes.';

COMMENT ON COLUMN college_notes.agency_id IS
  'Foreign key to agencies table - enforces tenant isolation via RLS policies';

COMMENT ON COLUMN college_notes.college_id IS
  'Foreign key to colleges table - the college this note is about. Cascade deletes when college is deleted.';

COMMENT ON COLUMN college_notes.user_id IS
  'Foreign key to users table - the user who created this note. Cascade deletes when user is deleted.';

COMMENT ON COLUMN college_notes.content IS
  'Note content with maximum 2000 characters enforced by CHECK constraint';

COMMENT ON POLICY college_notes_agency_isolation_select ON college_notes IS
  'Agency isolation: Users can only SELECT notes belonging to their agency';

COMMENT ON POLICY college_notes_agency_insert ON college_notes IS
  'All authenticated users in the agency can INSERT new college notes';

COMMENT ON POLICY college_notes_update ON college_notes IS
  'Users can UPDATE their own notes, agency_admin role can UPDATE all notes in their agency';

COMMENT ON POLICY college_notes_delete ON college_notes IS
  'Users can DELETE their own notes, agency_admin role can DELETE all notes in their agency';

COMMIT;
