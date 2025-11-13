-- Migration 006: Create student_documents table
-- Epic 3: Entities Domain - Student Registry
-- Story 3.2: Student Registry - Database foundation for student management system

BEGIN;

-- ============================================================
-- STEP 1: Create Student Documents Table
-- ============================================================

CREATE TABLE student_documents (
  -- Primary key
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Foreign keys
  student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,

  -- REQUIRED: Tenant isolation key
  agency_id UUID NOT NULL REFERENCES agencies(id) ON DELETE CASCADE,

  -- Document metadata
  document_type TEXT NOT NULL CHECK (document_type IN ('offer_letter', 'passport', 'visa', 'other')),
  file_name TEXT NOT NULL,
  file_path TEXT NOT NULL,
  file_size INTEGER,

  -- Audit fields
  uploaded_by UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  uploaded_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- ============================================================
-- STEP 2: Create Indexes (REQUIRED for performance)
-- ============================================================

-- CRITICAL: Index on agency_id for RLS query performance
CREATE INDEX idx_student_documents_agency_id ON student_documents(agency_id);

-- Additional indexes for common query patterns
CREATE INDEX idx_student_documents_student_id ON student_documents(agency_id, student_id);
CREATE INDEX idx_student_documents_type ON student_documents(agency_id, document_type);
CREATE INDEX idx_student_documents_uploaded_at ON student_documents(agency_id, uploaded_at DESC);

-- ============================================================
-- STEP 3: Enable RLS
-- ============================================================

ALTER TABLE student_documents ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- STEP 4: Create RLS Policies
-- ============================================================

-- SELECT Policy: Agency Isolation
CREATE POLICY student_documents_agency_isolation_select ON student_documents
  FOR SELECT
  USING (
    agency_id = (
      SELECT agency_id
      FROM users
      WHERE id = auth.uid()
    )
  );

-- INSERT Policy: Agency Isolation
CREATE POLICY student_documents_agency_isolation_insert ON student_documents
  FOR INSERT
  WITH CHECK (
    agency_id = (
      SELECT agency_id
      FROM users
      WHERE id = auth.uid()
    )
  );

-- UPDATE Policy: Agency Isolation
CREATE POLICY student_documents_agency_isolation_update ON student_documents
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
CREATE POLICY student_documents_agency_isolation_delete ON student_documents
  FOR DELETE
  USING (
    agency_id = (
      SELECT agency_id
      FROM users
      WHERE id = auth.uid()
    )
  );

-- ============================================================
-- STEP 5: Add Documentation
-- ============================================================

COMMENT ON TABLE student_documents IS
  'Document metadata for student files stored in Supabase Storage with multi-tenant isolation';

COMMENT ON COLUMN student_documents.agency_id IS
  'Foreign key to agencies table - enforces tenant isolation via RLS policies';

COMMENT ON COLUMN student_documents.student_id IS
  'Foreign key to students table - the student this document belongs to';

COMMENT ON COLUMN student_documents.document_type IS
  'Type of document: offer_letter, passport, visa, or other';

COMMENT ON COLUMN student_documents.file_name IS
  'Original filename as uploaded by user';

COMMENT ON COLUMN student_documents.file_path IS
  'Path to file in Supabase Storage bucket';

COMMENT ON COLUMN student_documents.file_size IS
  'File size in bytes';

COMMENT ON COLUMN student_documents.uploaded_by IS
  'Foreign key to users table - user who uploaded this document';

COMMENT ON COLUMN student_documents.uploaded_at IS
  'Timestamp when document was uploaded';

COMMENT ON POLICY student_documents_agency_isolation_select ON student_documents IS
  'Agency isolation: Users can only SELECT documents belonging to their agency';

COMMIT;
