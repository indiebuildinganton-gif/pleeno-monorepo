-- Migration 008: Student Documents Storage Configuration and RLS
-- Epic 3: Entities Domain - Student Registry
-- Story 3.2: Student Registry - Document management with Supabase Storage
-- Task 04: Student Documents API

BEGIN;

-- ============================================================
-- STEP 1: Storage Bucket Configuration (Manual Setup Required)
-- ============================================================

-- NOTE: The following storage bucket must be created via Supabase Dashboard or Storage API:
--
-- Bucket Configuration:
-- ---------------------
-- Name: student-documents
-- Public: false (RLS protected)
-- File Size Limit: 10MB
-- Allowed MIME Types: application/pdf, image/jpeg, image/png
-- Storage Path Pattern: student-documents/{student_id}/{filename}
--
-- To create via Supabase Dashboard:
-- 1. Go to Storage > Create Bucket
-- 2. Name: student-documents
-- 3. Set Public: OFF (use RLS)
-- 4. Configure file size limit in bucket settings
--
-- To create via SQL (Supabase allows this):
DO $$
BEGIN
  -- Create bucket if it doesn't exist
  INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
  VALUES (
    'student-documents',
    'student-documents',
    false, -- Not public, use RLS
    10485760, -- 10MB in bytes
    ARRAY['application/pdf', 'image/jpeg', 'image/png']
  )
  ON CONFLICT (id) DO NOTHING;
END $$;

-- ============================================================
-- STEP 2: Storage RLS Policies
-- ============================================================

-- Enable RLS on storage.objects for student-documents bucket
-- Note: RLS is typically enabled by default on storage.objects in Supabase

-- SELECT Policy: Users can only view documents from their agency
CREATE POLICY student_documents_storage_select ON storage.objects
  FOR SELECT
  USING (
    bucket_id = 'student-documents'
    AND (
      -- Check if user's agency owns the student
      EXISTS (
        SELECT 1
        FROM student_documents sd
        JOIN students s ON s.id = sd.student_id
        JOIN users u ON u.id = auth.uid()
        WHERE sd.file_path = storage.objects.name
        AND s.agency_id = u.agency_id
      )
    )
  );

-- INSERT Policy: Users can only upload documents for students in their agency
CREATE POLICY student_documents_storage_insert ON storage.objects
  FOR INSERT
  WITH CHECK (
    bucket_id = 'student-documents'
    AND (
      -- Extract student_id from path (format: {student_id}/{filename})
      -- Check if student belongs to user's agency
      EXISTS (
        SELECT 1
        FROM students s
        JOIN users u ON u.id = auth.uid()
        WHERE s.id::text = split_part(storage.objects.name, '/', 1)
        AND s.agency_id = u.agency_id
      )
    )
  );

-- UPDATE Policy: Users can only update documents from their agency
CREATE POLICY student_documents_storage_update ON storage.objects
  FOR UPDATE
  USING (
    bucket_id = 'student-documents'
    AND (
      EXISTS (
        SELECT 1
        FROM student_documents sd
        JOIN students s ON s.id = sd.student_id
        JOIN users u ON u.id = auth.uid()
        WHERE sd.file_path = storage.objects.name
        AND s.agency_id = u.agency_id
      )
    )
  )
  WITH CHECK (
    bucket_id = 'student-documents'
    AND (
      EXISTS (
        SELECT 1
        FROM student_documents sd
        JOIN students s ON s.id = sd.student_id
        JOIN users u ON u.id = auth.uid()
        WHERE sd.file_path = storage.objects.name
        AND s.agency_id = u.agency_id
      )
    )
  );

-- DELETE Policy: Users can only delete documents from their agency
CREATE POLICY student_documents_storage_delete ON storage.objects
  FOR DELETE
  USING (
    bucket_id = 'student-documents'
    AND (
      EXISTS (
        SELECT 1
        FROM student_documents sd
        JOIN students s ON s.id = sd.student_id
        JOIN users u ON u.id = auth.uid()
        WHERE sd.file_path = storage.objects.name
        AND s.agency_id = u.agency_id
      )
    )
  );

-- ============================================================
-- STEP 3: Add Documentation
-- ============================================================

COMMENT ON POLICY student_documents_storage_select ON storage.objects IS
  'Agency isolation for student documents: Users can only view documents from students in their agency';

COMMENT ON POLICY student_documents_storage_insert ON storage.objects IS
  'Agency isolation for student documents: Users can only upload documents for students in their agency';

COMMENT ON POLICY student_documents_storage_update ON storage.objects IS
  'Agency isolation for student documents: Users can only update documents from students in their agency';

COMMENT ON POLICY student_documents_storage_delete ON storage.objects IS
  'Agency isolation for student documents: Users can only delete documents from students in their agency';

-- ============================================================
-- STEP 4: Verification
-- ============================================================

-- Verify bucket was created
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM storage.buckets WHERE id = 'student-documents') THEN
    RAISE WARNING 'Storage bucket "student-documents" was not created. Please create it manually via Supabase Dashboard or API.';
  ELSE
    RAISE NOTICE 'Storage bucket "student-documents" configured successfully';
  END IF;
END $$;

-- ============================================================
-- ADDITIONAL NOTES
-- ============================================================

-- File Upload Flow:
-- 1. Client uploads file via POST /api/students/[id]/documents with FormData
-- 2. API validates file type (PDF, JPEG, PNG) and size (max 10MB)
-- 3. API generates unique filename: {timestamp}-{random}-{basename}.{ext}
-- 4. API uploads to storage: student-documents/{student_id}/{unique_filename}
-- 5. Storage RLS checks user's agency owns the student
-- 6. API stores metadata in student_documents table
-- 7. API returns document metadata with public URL

-- File Download Flow:
-- 1. Client requests GET /api/students/[id]/documents/[doc_id]
-- 2. API fetches document metadata from student_documents table (RLS enforced)
-- 3. API downloads file from storage using file_path
-- 4. Storage RLS checks user's agency owns the document
-- 5. API returns file with appropriate Content-Type and Content-Disposition headers

-- File Delete Flow:
-- 1. Client requests DELETE /api/students/[id]/documents/[doc_id]
-- 2. API fetches document metadata (RLS enforced)
-- 3. API logs deletion to audit_logs
-- 4. API deletes file from storage
-- 5. Storage RLS checks user's agency owns the document
-- 6. API deletes metadata from student_documents table

-- Security Considerations:
-- - All storage operations are protected by RLS policies
-- - File type and size validation happens at application layer before upload
-- - Unique filenames prevent conflicts and path traversal attacks
-- - Agency isolation ensures no cross-tenant data access
-- - Audit logs track all document operations
-- - Public URLs are generated but access requires RLS check

COMMIT;
