# Task 4: Student Documents API

## Context
Story 3.2: Student Registry - Document management with Supabase Storage

## Acceptance Criteria Coverage
- AC 7: Document Management

## Task Description
Implement file upload/download API using Supabase Storage for offer letters and student documents.

## Subtasks
1. Implement POST /api/students/[id]/documents (file upload)
2. Implement GET /api/students/[id]/documents/[doc_id] (download)
3. Implement DELETE /api/students/[id]/documents/[doc_id]
4. Configure Supabase Storage bucket: student-documents
5. Implement RLS policies for storage bucket
6. Support PDF and image formats (offer_letter, passport, visa, other)
7. Store file metadata in student_documents table

## Technical Requirements
- Location: `apps/entities/app/api/students/[id]/documents/`
- Files to create:
  - `route.ts` (POST)
  - `[doc_id]/route.ts` (GET, DELETE)
- Create utility: `packages/utils/src/file-upload.ts`
- Storage path: `student-documents/{student_id}/{filename}`
- Max file size: 10MB
- Supported formats: PDF, JPEG, PNG

## API Signatures
```typescript
POST /api/students/[id]/documents FormData {file: File, document_type: enum}
GET /api/students/[id]/documents/[doc_id]
DELETE /api/students/[id]/documents/[doc_id]
```

## Constraints
- File type validation (PDF, JPEG, PNG only)
- File size limit: 10MB
- RLS on storage bucket
- Generate unique filenames
- Store metadata in database

## Reference Files
- Architecture: `docs/architecture.md` lines 1199-1254 (File Upload Pattern)
- Story context: `.bmad-ephemeral/stories/3-2-student-registry.context.xml`

## Definition of Done
- [ ] Upload endpoint working
- [ ] Download endpoint working
- [ ] Delete endpoint working
- [ ] Storage bucket configured
- [ ] RLS policies set
- [ ] File validation working
- [ ] Metadata stored correctly
