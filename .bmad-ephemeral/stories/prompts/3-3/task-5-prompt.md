# Story 3-3: Student-College Enrollment Linking
## Task 5: Payment Plan Creation Integration

**Previous Tasks:**
- Tasks 1-4: Database, API Routes, Upload/Download - COMPLETED ✅

**Story Context:**
- **As a** Agency User
- **I want** to link students to their enrolled colleges through payment plan creation with supporting documentation
- **So that** I can track where each student is studying, store official offer letters, and manage payments for multiple enrollments

---

## Task Description

Integrate enrollment creation into the payment plan wizard, allowing users to select student/college, upload offer letter, and automatically create/link enrollment when saving payment plan.

## Subtasks Checklist

- [ ] Update PaymentPlanWizard component to include enrollment creation in Step 1
- [ ] Add student dropdown (search/select from students table)
- [ ] Add college/branch dropdown (search/select from branches table)
- [ ] Add program name text input field
- [ ] Create OfferLetterUpload component for file attachment
- [ ] Call POST /api/enrollments before creating payment plan
- [ ] Handle duplicate enrollment (reuse existing if found)
- [ ] Link payment_plans.enrollment_id to created/found enrollment
- [ ] Update form validation to require student, branch, program

## Acceptance Criteria

This task addresses:
- **AC1**: Enrollment Creation via Payment Plan (all requirements)

## Key Constraints

1. **Multi-Zone Architecture**: Payment plan wizard in apps/payments/, enrollment components shared via packages/ui/
2. **Foreign Key Relationship**: Enrollment must be created BEFORE payment plan (enrollment_id required)
3. **Duplicate Handling**: Use findOrCreateEnrollment logic to reuse existing active enrollments

## Components to Implement

### OfferLetterUpload Component
```typescript
// packages/ui/src/components/enrollments/OfferLetterUpload.tsx
interface OfferLetterUploadProps {
  onFileSelect: (file: File) => void;
  value?: File;
}
```
**Notes**: File upload component for offer letters in payment plan wizard. Validates file type and size client-side.

## Implementation Locations

```
apps/payments/app/plans/new/components/PaymentPlanWizard.tsx  # UPDATE: Add enrollment creation
apps/payments/app/plans/new/components/OfferLetterUpload.tsx  # NEW: File upload component
packages/ui/src/components/enrollments/                        # Shared enrollment components
packages/utils/src/enrollment-helpers.ts                       # NEW: findOrCreateEnrollment utility
```

## Dependencies

- Tasks 1-4: Enrollment APIs and database
- React Hook Form for form state
- Zod for validation
- TanStack Query for student/branch dropdowns

## Artifacts & References

**Code References:**
- `apps/payments/app/plans/new/components/PaymentPlanWizard.tsx` (lines update) - Add enrollment logic to Step 1
- `packages/utils/src/file-upload.ts` - File upload utilities

**Story Context:** `.bmad-ephemeral/stories/3-3-student-college-enrollment-linking.context.xml` (lines 147-162)

---

## 📋 Update Manifest

**Before starting**, update `.bmad-ephemeral/stories/prompts/3-3/MANIFEST.md`:

1. Mark Task 4 as "Completed" with today's date
2. Add notes about Task 4 (download endpoint working, headers correct)
3. Mark Task 5 as "In Progress" with today's date

---

## Implementation Instructions

1. **Create enrollment-helpers utility**:
   - `packages/utils/src/enrollment-helpers.ts`
   - Implement `findOrCreateEnrollment(student_id, branch_id, program_name)`
   - Check for existing enrollment, reuse if active, create if not found
2. **Create OfferLetterUpload component**:
   - File input with drag-and-drop
   - Client-side validation (PDF/JPEG/PNG, max 10MB)
   - Preview thumbnail for images
3. **Update PaymentPlanWizard**:
   - Add student dropdown (with search)
   - Add branch dropdown (with search)
   - Add program name input
   - Add OfferLetterUpload component
   - Update form schema to include enrollment fields
4. **Modify payment plan creation flow**:
   - Call `findOrCreateEnrollment()` first
   - Upload offer letter if provided
   - Create payment plan with enrollment_id
5. **Test full flow** from wizard to payment plan creation

### Testing

- Test creating payment plan with new student-branch-program (creates new enrollment)
- Test creating second payment plan with same student-branch-program (reuses enrollment)
- Test offer letter upload during payment plan creation
- Test validation errors (missing student, branch, program)
- Verify payment_plans.enrollment_id correctly linked

---

## Next Steps

After completing Task 5:
1. ✅ Update manifest.md (mark Task 5 complete, add notes)
2. 📄 Move to `task-6-prompt.md` - Student Detail Page Enrollments Section
3. 🔄 Continue sequential execution
