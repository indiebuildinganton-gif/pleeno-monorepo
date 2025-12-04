-- Migration 007: Enable RLS policies for enrollments table
-- Epic 3: Core Entity Management
-- Story 3.3: Student-College Enrollment Linking

BEGIN;

-- ============================================================
-- STEP 1: Enable RLS
-- ============================================================

ALTER TABLE enrollments ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- STEP 2: Create RLS Policies for Multi-Tenant Isolation
-- ============================================================

-- SELECT Policy: Agency Isolation
-- Users can only view enrollments belonging to their agency
CREATE POLICY enrollments_agency_isolation_select ON enrollments
  FOR SELECT
  USING (
    agency_id = (
      SELECT agency_id
      FROM users
      WHERE id = auth.uid()
    )
  );

-- INSERT Policy: Agency Isolation
-- Users can only create enrollments for their agency
CREATE POLICY enrollments_agency_isolation_insert ON enrollments
  FOR INSERT
  WITH CHECK (
    agency_id = (
      SELECT agency_id
      FROM users
      WHERE id = auth.uid()
    )
  );

-- UPDATE Policy: Agency Isolation
-- Users can only update enrollments belonging to their agency
CREATE POLICY enrollments_agency_isolation_update ON enrollments
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
-- Users can only delete enrollments belonging to their agency
CREATE POLICY enrollments_agency_isolation_delete ON enrollments
  FOR DELETE
  USING (
    agency_id = (
      SELECT agency_id
      FROM users
      WHERE id = auth.uid()
    )
  );

-- ============================================================
-- STEP 3: Add Policy Documentation
-- ============================================================

COMMENT ON POLICY enrollments_agency_isolation_select ON enrollments IS
  'Agency isolation: Users can only SELECT enrollment records belonging to their agency';

COMMENT ON POLICY enrollments_agency_isolation_insert ON enrollments IS
  'Agency isolation: Users can only INSERT enrollment records for their agency';

COMMENT ON POLICY enrollments_agency_isolation_update ON enrollments IS
  'Agency isolation: Users can only UPDATE enrollment records belonging to their agency';

COMMENT ON POLICY enrollments_agency_isolation_delete ON enrollments IS
  'Agency isolation: Users can only DELETE enrollment records belonging to their agency';

-- ============================================================
-- STEP 4: Storage Bucket RLS Configuration Notes
-- ============================================================

-- NOTE: The following RLS policies should be configured for the 'enrollment-documents' storage bucket:
--
-- Policy 1: enrollment_documents_select (SELECT)
-- Allow users to view/download documents from enrollments belonging to their agency:
--
-- USING expression:
-- bucket_id = 'enrollment-documents' AND (
--   SELECT agency_id FROM enrollments WHERE id::text = (storage.foldername(name))[1]
-- ) = (
--   SELECT agency_id FROM users WHERE id = auth.uid()
-- )
--
-- Policy 2: enrollment_documents_insert (INSERT)
-- Allow users to upload documents to enrollments belonging to their agency:
--
-- WITH CHECK expression:
-- bucket_id = 'enrollment-documents' AND (
--   SELECT agency_id FROM enrollments WHERE id::text = (storage.foldername(name))[1]
-- ) = (
--   SELECT agency_id FROM users WHERE id = auth.uid()
-- )
--
-- Policy 3: enrollment_documents_delete (DELETE)
-- Allow users to delete documents from enrollments belonging to their agency:
--
-- USING expression:
-- bucket_id = 'enrollment-documents' AND (
--   SELECT agency_id FROM enrollments WHERE id::text = (storage.foldername(name))[1]
-- ) = (
--   SELECT agency_id FROM users WHERE id = auth.uid()
-- )

COMMIT;
