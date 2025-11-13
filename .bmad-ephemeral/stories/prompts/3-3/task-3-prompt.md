# Story 3-3: Student-College Enrollment Linking
## Task 3: Offer Letter Upload API

**Previous Tasks:**
- Task 1: Database Schema Implementation - COMPLETED ✅
- Task 2: Enrollment API Routes - COMPLETED ✅

**Story Context:**
- **As a** Agency User
- **I want** to link students to their enrolled colleges through payment plan creation with supporting documentation
- **So that** I can track where each student is studying, store official offer letters, and manage payments for multiple enrollments

---

## Task Description

Implement API endpoint for uploading offer letter documents to Supabase Storage, with file validation, RLS policies, and metadata storage in the enrollments table.

## Subtasks Checklist

- [ ] POST /api/enrollments/[id]/offer-letter - Upload offer letter endpoint
- [ ] Validate file type (PDF, JPEG, PNG only)
- [ ] Validate file size (max 10MB)
- [ ] Upload to Supabase Storage at enrollment-documents/{enrollment_id}/{filename}
- [ ] Update enrollments table with offer_letter_url and offer_letter_filename
- [ ] Implement error handling for upload failures
- [ ] Add audit logging for document uploads

## Acceptance Criteria

This task addresses:
- **AC1**: Enrollment Creation via Payment Plan (offer letter attachment)
- **AC5**: Document Management (upload PDF/image formats)

## Key Constraints

1. **File Upload Constraints**: Storage path `enrollment-documents/{enrollment_id}/{filename}`. Validate file type (PDF, JPEG, PNG), max size 10MB.
2. **RLS Policies**: Storage bucket must enforce agency_id filtering to prevent cross-agency access
3. **Metadata Storage**: Store offer_letter_url and offer_letter_filename in enrollments table after successful upload

## Interface to Implement

### POST /api/enrollments/[id]/offer-letter
```typescript
POST /api/enrollments/[id]/offer-letter
Body: FormData with file field
Response: { offer_letter_url, offer_letter_filename }
```
**Notes**: Uploads offer letter to Supabase Storage. Validates file type and size. Updates enrollments table metadata.

## Implementation Location

```
apps/entities/app/api/enrollments/[id]/offer-letter/route.ts  # NEW: File upload endpoint
packages/utils/src/file-upload.ts                              # UPDATE: Add uploadOfferLetter helper
```

## Dependencies

- Task 1: enrollments table and storage bucket
- Task 2: enrollment existence validation
- Supabase Storage API
- File upload utilities from Story 3.2 (`packages/utils/src/file-upload.ts`)

## Artifacts & References

**Code References:**
- `packages/utils/src/file-upload.ts` - Existing file upload utilities from Story 3.2 to adapt for offer letters
- Storage bucket RLS from Task 1 migrations

**Story Context:** `.bmad-ephemeral/stories/3-3-student-college-enrollment-linking.context.xml` (lines 249-261)

---

## 📋 Update Manifest

**Before starting**, update `.bmad-ephemeral/stories/prompts/3-3/MANIFEST.md`:

1. Mark Task 2 as "Completed" with today's date
2. Add notes about Task 2 (API routes created, endpoints tested)
3. Mark Task 3 as "In Progress" with today's date

---

## Implementation Instructions

1. **Create API route** at `apps/entities/app/api/enrollments/[id]/offer-letter/route.ts`
2. **Implement file validation**:
   - Check MIME type (application/pdf, image/jpeg, image/png)
   - Check file size <= 10MB
   - Return 400 error if validation fails
3. **Upload to Supabase Storage**:
   - Use path: `enrollment-documents/{enrollment_id}/{filename}`
   - Generate unique filename if needed (e.g., add timestamp)
   - Get public URL from storage
4. **Update enrollments table**:
   - Set offer_letter_url and offer_letter_filename
   - Use Supabase client to update record
5. **Add audit logging** for document upload event
6. **Extend file-upload utility** in `packages/utils/src/file-upload.ts` with `uploadOfferLetter()` helper
7. **Test upload** with valid and invalid files

### Testing

- Test upload with valid PDF (< 10MB)
- Test upload with valid JPEG/PNG (< 10MB)
- Test rejection of invalid file types (DOC, TXT)
- Test rejection of oversized files (> 10MB)
- Verify offer_letter_url stored correctly in enrollments table
- Verify RLS prevents cross-agency access to uploaded files

---

## Next Steps

After completing Task 3:
1. ✅ Update manifest.md (mark Task 3 complete, add notes)
2. 📄 Move to `task-4-prompt.md` - Offer Letter Download API
3. 🔄 Continue sequential execution
