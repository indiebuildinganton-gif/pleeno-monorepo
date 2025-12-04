# Student Documents Storage Setup

This document provides instructions for setting up the Supabase Storage bucket for student documents.

## Overview

The Student Documents API uses Supabase Storage to store files (PDFs and images) uploaded by users. Files are organized by student ID and protected by Row-Level Security (RLS) policies to ensure multi-tenant isolation.

## Storage Configuration

### Bucket Details

- **Bucket Name**: `student-documents`
- **Public Access**: Disabled (protected by RLS)
- **File Size Limit**: 10MB
- **Allowed MIME Types**:
  - `application/pdf`
  - `image/jpeg`
  - `image/png`
- **Storage Path Pattern**: `{student_id}/{unique_filename}`

### Setup Instructions

#### Option 1: Via Supabase Dashboard (Recommended)

1. Navigate to your Supabase project dashboard
2. Go to **Storage** section
3. Click **Create Bucket**
4. Configure the bucket:
   - Name: `student-documents`
   - Public: **OFF** (use RLS)
5. After creation, configure bucket settings:
   - Set file size limit to 10MB
   - Configure allowed MIME types (if supported by UI)

#### Option 2: Via Migration SQL

The storage bucket configuration is included in migration file `008_student_documents_storage.sql`. When you run the migration, it will:

1. Create the `student-documents` bucket (if it doesn't exist)
2. Configure RLS policies for multi-tenant isolation
3. Set up proper access controls

To run the migration:

```bash
supabase db push
```

Or if using remote Supabase:

```bash
supabase db push --db-url "postgresql://..."
```

#### Option 3: Via Supabase API

Use the Supabase Management API or client SDK:

```typescript
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)

await supabase.storage.createBucket('student-documents', {
  public: false,
  fileSizeLimit: 10485760, // 10MB in bytes
  allowedMimeTypes: ['application/pdf', 'image/jpeg', 'image/png']
})
```

## RLS Policies

The following RLS policies are automatically created by the migration to ensure multi-tenant data isolation:

### SELECT Policy
Users can only view documents from students in their agency.

### INSERT Policy
Users can only upload documents for students in their agency.

### UPDATE Policy
Users can only update documents from students in their agency.

### DELETE Policy
Users can only delete documents from students in their agency.

## API Endpoints

### Upload Document
```
POST /api/students/[id]/documents
Content-Type: multipart/form-data

Body:
- file: File (PDF or image, max 10MB)
- document_type: "offer_letter" | "passport" | "visa" | "other"
```

### List Documents
```
GET /api/students/[id]/documents
```

### Download Document
```
GET /api/students/[id]/documents/[doc_id]
```

### Delete Document
```
DELETE /api/students/[id]/documents/[doc_id]
```

## File Upload Flow

1. Client uploads file via POST endpoint with `multipart/form-data`
2. API validates:
   - File type (must be PDF, JPEG, or PNG)
   - File size (max 10MB)
   - Document type (must be valid enum value)
3. API generates unique filename: `{timestamp}-{random}-{basename}.{ext}`
4. API uploads to storage at path: `student-documents/{student_id}/{unique_filename}`
5. Storage RLS verifies user's agency owns the student
6. API stores metadata in `student_documents` table
7. API returns document metadata with public URL

## File Download Flow

1. Client requests document via GET endpoint
2. API fetches document metadata from `student_documents` table (RLS enforced)
3. API downloads file from storage using `file_path`
4. Storage RLS verifies user's agency owns the document
5. API returns file with appropriate headers:
   - `Content-Type`: Based on file extension
   - `Content-Disposition`: `attachment; filename="original-name.pdf"`
   - `Content-Length`: File size in bytes

## File Delete Flow

1. Client requests deletion via DELETE endpoint
2. API fetches document metadata (RLS enforced)
3. API logs deletion to `audit_logs` table
4. API deletes file from storage
5. Storage RLS verifies user's agency owns the document
6. API deletes metadata from `student_documents` table

## Security Features

- **Multi-tenant Isolation**: RLS policies ensure agencies can only access their own documents
- **File Type Validation**: Only PDF and image files are allowed
- **File Size Validation**: 10MB maximum to prevent abuse
- **Unique Filenames**: Prevents conflicts and path traversal attacks
- **Audit Logging**: All operations (create, delete) are logged
- **Agency Verification**: Student ownership verified before any file operation

## Database Schema

### student_documents Table

```sql
CREATE TABLE student_documents (
  id UUID PRIMARY KEY,
  student_id UUID REFERENCES students(id),
  agency_id UUID REFERENCES agencies(id),
  document_type TEXT CHECK (document_type IN ('offer_letter', 'passport', 'visa', 'other')),
  file_name TEXT NOT NULL,
  file_path TEXT NOT NULL,
  file_size INTEGER,
  uploaded_by UUID REFERENCES users(id),
  uploaded_at TIMESTAMPTZ DEFAULT now()
);
```

## Troubleshooting

### Bucket not found error
Ensure the `student-documents` bucket is created in your Supabase project. Check the Storage section in your dashboard.

### Permission denied error
Verify that:
1. User is authenticated
2. Student belongs to user's agency
3. RLS policies are properly configured on both the `student_documents` table and `storage.objects`

### File too large error
The maximum file size is 10MB. Check the file size before uploading.

### Invalid file type error
Only PDF, JPEG, and PNG files are supported. Check the file MIME type.

## Testing

To test the storage setup:

1. Create a student record
2. Upload a test document (PDF or image)
3. Verify the file appears in Supabase Storage under `student-documents/{student_id}/`
4. Download the document to ensure it's accessible
5. Delete the document to verify cleanup works

## Monitoring

Monitor storage usage in Supabase Dashboard:
- Navigate to **Storage** > **student-documents**
- Check file count and total size
- Review recent uploads
- Check RLS policy effectiveness in logs

## Maintenance

### Cleanup orphaned files
If files exist in storage but not in the database (rare edge cases), you can identify and clean them up:

```sql
-- Find files without database records
-- (This would require custom logic comparing storage.objects with student_documents)
```

### Archive old documents
Consider implementing a retention policy for old documents based on your compliance requirements.

## References

- [Supabase Storage Documentation](https://supabase.com/docs/guides/storage)
- [Supabase Storage RLS](https://supabase.com/docs/guides/storage/security/access-control)
- Architecture: `docs/architecture.md` lines 1199-1254 (File Upload Pattern)
- Story context: `.bmad-ephemeral/stories/3-2-student-registry.context.xml`
