-- Migration 006: Create enrollments table
-- Epic 3: Core Entity Management
-- Story 3.3: Student-College Enrollment Linking

BEGIN;

-- ============================================================
-- STEP 1: Create Status ENUM Type
-- ============================================================

CREATE TYPE enrollment_status AS ENUM ('active', 'completed', 'cancelled');

COMMENT ON TYPE enrollment_status IS
  'Enrollment status values: active (ongoing), completed (finished), cancelled (terminated)';

-- ============================================================
-- STEP 2: Create Enrollments Table
-- ============================================================

CREATE TABLE enrollments (
  -- Primary key
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- REQUIRED: Tenant isolation key
  agency_id UUID NOT NULL REFERENCES agencies(id) ON DELETE CASCADE,

  -- Foreign keys to related entities
  student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  branch_id UUID NOT NULL REFERENCES branches(id) ON DELETE CASCADE,

  -- Enrollment details
  program_name TEXT NOT NULL,

  -- Offer letter document references (nullable - can be added later)
  offer_letter_url TEXT,
  offer_letter_filename TEXT,

  -- Enrollment status with default
  status enrollment_status NOT NULL DEFAULT 'active',

  -- Standard timestamps
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL,

  -- Composite unique constraint to prevent duplicate enrollments
  CONSTRAINT unique_student_branch_program UNIQUE (student_id, branch_id, program_name)
);

-- ============================================================
-- STEP 3: Create Indexes (REQUIRED for performance)
-- ============================================================

-- CRITICAL: Index on agency_id for RLS query performance
CREATE INDEX idx_enrollments_agency_id ON enrollments(agency_id);

-- Performance indexes for common query patterns
CREATE INDEX idx_enrollments_agency_student ON enrollments(agency_id, student_id);
CREATE INDEX idx_enrollments_agency_branch ON enrollments(agency_id, branch_id);

-- Index on status for filtering active/completed/cancelled enrollments
CREATE INDEX idx_enrollments_status ON enrollments(status);

-- Index on student_id for reverse lookups
CREATE INDEX idx_enrollments_student_id ON enrollments(student_id);

-- Index on branch_id for reverse lookups
CREATE INDEX idx_enrollments_branch_id ON enrollments(branch_id);

-- ============================================================
-- STEP 4: Add Triggers
-- ============================================================

-- Automatically update updated_at timestamp
CREATE TRIGGER update_enrollments_updated_at
  BEFORE UPDATE ON enrollments
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================================
-- STEP 5: Add Documentation
-- ============================================================

COMMENT ON TABLE enrollments IS
  'Student-college enrollments created through payment plan creation. Links students to branches with program details and offer letter documents. Multi-tenant isolated by agency_id.';

COMMENT ON COLUMN enrollments.agency_id IS
  'Foreign key to agencies table - enforces tenant isolation via RLS policies';

COMMENT ON COLUMN enrollments.student_id IS
  'Foreign key to students table - identifies which student is enrolled';

COMMENT ON COLUMN enrollments.branch_id IS
  'Foreign key to branches table - identifies which college branch the student is enrolled in';

COMMENT ON COLUMN enrollments.program_name IS
  'Name of the program/course the student is enrolled in (e.g., "Bachelor of Business Administration")';

COMMENT ON COLUMN enrollments.offer_letter_url IS
  'URL to the offer letter document in Supabase Storage (nullable - can be uploaded later)';

COMMENT ON COLUMN enrollments.offer_letter_filename IS
  'Original filename of the offer letter document (nullable)';

COMMENT ON COLUMN enrollments.status IS
  'Current status of enrollment: active (ongoing), completed (finished), cancelled (terminated)';

COMMENT ON CONSTRAINT unique_student_branch_program ON enrollments IS
  'Prevents duplicate enrollments for the same student-branch-program combination. If this combo exists, reuse the enrollment instead of creating a new one.';

-- ============================================================
-- STEP 6: Supabase Storage Configuration Notes
-- ============================================================

-- NOTE: The following storage bucket configuration should be created via Supabase UI or Storage API:
--
-- Bucket Name: enrollment-documents
-- Public: false (RLS protected)
-- File Size Limit: 10MB
-- Allowed MIME Types: application/pdf, image/jpeg, image/png
-- Storage Path Pattern: enrollment-documents/{enrollment_id}/{filename}
--
-- RLS policies for the storage bucket will be configured separately to ensure
-- users can only access documents belonging to their agency's enrollments.

COMMIT;
