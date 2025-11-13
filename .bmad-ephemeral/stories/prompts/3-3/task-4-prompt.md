# Story 3-3: Student-College Enrollment Linking
## Task 4: Offer Letter Download API

**Previous Tasks:**
- Task 1: Database Schema Implementation - COMPLETED ✅
- Task 2: Enrollment API Routes - COMPLETED ✅
- Task 3: Offer Letter Upload API - COMPLETED ✅

**Story Context:**
- **As a** Agency User
- **I want** to link students to their enrolled colleges through payment plan creation with supporting documentation
- **So that** I can track where each student is studying, store official offer letters, and manage payments for multiple enrollments

---

## Task Description

Implement API endpoint for downloading and serving offer letter documents from Supabase Storage with proper Content-Type and Content-Disposition headers, enforcing RLS permissions.

## Subtasks Checklist

- [ ] GET /api/enrollments/[id]/offer-letter - Download offer letter endpoint
- [ ] Fetch offer letter from Supabase Storage using stored URL
- [ ] Set proper Content-Type header based on file type
- [ ] Set Content-Disposition header for download/inline viewing
- [ ] Verify RLS permissions before serving file
- [ ] Handle 404 when no offer letter exists
- [ ] Stream file response efficiently

## Acceptance Criteria

This task addresses:
- **AC2**: Enrollment Display and Navigation (view/download offer letters)
- **AC5**: Document Management (view/download/maximize documents)

## Key Constraints

1. **RLS Protection**: Verify user has access to the enrollment before serving document (RLS policies on storage)
2. **Content Headers**: Set appropriate Content-Type (PDF/JPEG/PNG) and Content-Disposition (attachment or inline)
3. **Error Handling**: Return 404 if enrollment has no offer letter, 403 if RLS denies access

## Interface to Implement

### GET /api/enrollments/[id]/offer-letter
```typescript
GET /api/enrollments/[id]/offer-letter
Query: ?download=true (optional, for attachment vs inline)
Response: File stream with appropriate headers
```
**Notes**: Serves offer letter file with proper Content-Type and Content-Disposition headers. Checks RLS permissions.

## Implementation Location

```
apps/entities/app/api/enrollments/[id]/offer-letter/route.ts  # UPDATE: Add GET handler
```

## Dependencies

- Task 1: enrollments table and storage bucket
- Task 3: uploaded offer letters
- Supabase Storage API

## Artifacts & References

**Story Context:** `.bmad-ephemeral/stories/3-3-student-college-enrollment-linking.context.xml` (lines 255-261)

---

## 📋 Update Manifest

**Before starting**, update `.bmad-ephemeral/stories/prompts/3-3/MANIFEST.md`:

1. Mark Task 3 as "Completed" with today's date
2. Add notes about Task 3 (upload endpoint working, validation confirmed)
3. Mark Task 4 as "In Progress" with today's date

---

## Implementation Instructions

1. **Update API route** at `apps/entities/app/api/enrollments/[id]/offer-letter/route.ts`
2. **Add GET handler**:
   - Fetch enrollment record from database
   - Check if offer_letter_url exists (return 404 if not)
   - Fetch file from Supabase Storage using offer_letter_url
3. **Set response headers**:
   - Content-Type: application/pdf, image/jpeg, or image/png based on file
   - Content-Disposition: `attachment; filename="{offer_letter_filename}"` if download=true, otherwise `inline`
4. **Stream file response** efficiently
5. **Handle errors**:
   - 404 if enrollment not found or no offer letter
   - 403 if RLS denies access
   - 500 for storage errors
6. **Test download** from browser and API client

### Testing

- Test download of PDF offer letter
- Test download of JPEG/PNG offer letter
- Test inline viewing (download=false)
- Test 404 when enrollment has no offer letter
- Test 403 when user tries to access another agency's offer letter (RLS)
- Verify Content-Type and Content-Disposition headers are correct

---

## Next Steps

After completing Task 4:
1. ✅ Update manifest.md (mark Task 4 complete, add notes)
2. 📄 Move to `task-5-prompt.md` - Payment Plan Creation Integration
3. 🔄 Continue sequential execution
