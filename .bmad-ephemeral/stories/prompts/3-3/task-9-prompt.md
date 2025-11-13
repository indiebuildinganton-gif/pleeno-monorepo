# Story 3-3: Student-College Enrollment Linking
## Task 9: Enrollment Status Management UI

**Previous Tasks:**
- Tasks 1-8: Database, APIs, Payment Plan, Pages, Document Viewer - COMPLETED ✅

**Story Context:**
- **As a** Agency User
- **I want** to link students to their enrolled colleges through payment plan creation with supporting documentation
- **So that** I can track where each student is studying, store official offer letters, and manage payments for multiple enrollments

---

## Task Description

Add UI controls to student and college detail pages for updating enrollment status (active/completed/cancelled) with confirmation dialogs and optimistic updates.

## Subtasks Checklist

- [ ] Add status update dropdown/buttons to EnrollmentsSection (student page)
- [ ] Add status update dropdown/buttons to EnrolledStudentsSection (college page)
- [ ] Create confirmation dialog for status changes
- [ ] Call PATCH /api/enrollments/[id] on status update
- [ ] Implement optimistic updates with TanStack Query
- [ ] Show success/error toast notifications
- [ ] Refresh enrollment lists after status change

## Acceptance Criteria

This task addresses:
- **AC4**: Enrollment Status Management (mark as completed/cancelled from student or college page)

## Key Constraints

1. **State Management**: Use TanStack Query mutations with optimistic updates
2. **Validation**: Only allow valid status transitions (e.g., can't reactivate completed enrollments)
3. **Audit Logging**: Status changes logged automatically by API (Task 2)

## Implementation Locations

```
apps/entities/app/students/[id]/components/EnrollmentsSection.tsx       # UPDATE: Add status controls
apps/entities/app/colleges/[id]/components/EnrolledStudentsSection.tsx  # UPDATE: Add status controls
packages/ui/src/components/enrollments/EnrollmentStatusMenu.tsx         # NEW: Status update menu
```

## Dependencies

- Task 2: PATCH /api/enrollments/[id] endpoint
- Task 6: EnrollmentsSection component
- Task 7: EnrolledStudentsSection component
- TanStack Query for mutations
- Shadcn UI DropdownMenu, AlertDialog, Toast

## Artifacts & References

**Code References:**
- TanStack Query mutation pattern
- Shadcn AlertDialog for confirmations

**Story Context:** `.bmad-ephemeral/stories/3-3-student-college-enrollment-linking.context.xml` (lines 50-53)

---

## 📋 Update Manifest

**Before starting**, update `.bmad-ephemeral/stories/prompts/3-3/MANIFEST.md`:

1. Mark Task 8 as "Completed" with today's date
2. Add notes about Task 8 (document viewer working, PDFs and images supported)
3. Mark Task 9 as "In Progress" with today's date

---

## Implementation Instructions

1. **Create EnrollmentStatusMenu component**:
   - Use Shadcn DropdownMenu with status options
   - Options: Mark as Completed, Mark as Cancelled, Mark as Active
   - Show confirmation dialog before status change
   - Call PATCH endpoint on confirmation
2. **Update EnrollmentsSection** (student page):
   - Add EnrollmentStatusMenu to Actions column
   - Setup TanStack Query mutation for status updates
   - Implement optimistic updates
   - Show toast on success/error
3. **Update EnrolledStudentsSection** (college page):
   - Add same EnrollmentStatusMenu
   - Reuse mutation logic
4. **Add confirmation dialog**:
   - Use Shadcn AlertDialog
   - Confirm message: "Are you sure you want to mark this enrollment as {status}?"
   - Cancel and Confirm buttons
5. **Implement optimistic updates**:
   - Update local cache immediately
   - Rollback on error
   - Refetch on success for consistency
6. **Add toast notifications**:
   - Success: "Enrollment status updated to {status}"
   - Error: "Failed to update enrollment status"
7. **Test status updates** from both pages

### Testing

- Test marking enrollment as completed from student page
- Test marking enrollment as cancelled from college page
- Test confirmation dialog appears before status change
- Test optimistic update (UI changes immediately)
- Test rollback on API error
- Test toast notifications show correct messages
- Test refreshed data after successful update

---

## Next Steps

After completing Task 9:
1. ✅ Update manifest.md (mark Task 9 complete, add notes)
2. 📄 Move to `task-10-prompt.md` - Duplicate Enrollment Handling Logic
3. 🔄 Continue sequential execution
