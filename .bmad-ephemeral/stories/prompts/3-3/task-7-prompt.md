# Story 3-3: Student-College Enrollment Linking
## Task 7: College Detail Page - Enrolled Students Section

**Previous Tasks:**
- Tasks 1-6: Database, APIs, Payment Plan, Student Page - COMPLETED ✅

**Story Context:**
- **As a** Agency User
- **I want** to link students to their enrolled colleges through payment plan creation with supporting documentation
- **So that** I can track where each student is studying, store official offer letters, and manage payments for multiple enrollments

---

## Task Description

Add an Enrolled Students Section to the College/Branch Detail Page displaying all students enrolled at that branch with program names, enrollment status, and offer letter access.

## Subtasks Checklist

- [ ] Create EnrolledStudentsSection component for college/branch detail page
- [ ] Fetch enrollments using GET /api/branches/[id]/enrollments
- [ ] Display enrolled students in table/card layout with student name, program, status
- [ ] Add "View Offer Letter" link/button for each enrollment
- [ ] Link to student detail page from student name
- [ ] Integrate EnrolledStudentsSection into college/branch detail page
- [ ] Handle empty state (no enrolled students)

## Acceptance Criteria

This task addresses:
- **AC2**: Enrollment Display and Navigation (view enrolled students on college page)

## Key Constraints

1. **Multi-Zone Architecture**: College detail page in apps/entities/, shared components in packages/ui/
2. **State Management**: Use TanStack Query for enrollment data fetching
3. **Navigation**: Student names should link to their detail pages

## Component to Implement

### EnrolledStudentsSection
```typescript
// apps/entities/app/colleges/[id]/components/EnrolledStudentsSection.tsx
interface EnrolledStudentsSectionProps {
  branchId: string;
}
```
**Notes**: Display enrolled students list on college/branch detail page.

## Implementation Location

```
apps/entities/app/colleges/[id]/components/EnrolledStudentsSection.tsx  # NEW: Enrolled students display
```

## Dependencies

- Task 2: GET /api/branches/[id]/enrollments endpoint
- Task 4: Offer letter download endpoint
- Task 6: EnrollmentStatusBadge component (reuse)
- TanStack Query for data fetching

## Artifacts & References

**Code References:**
- College/branch detail page from Epic 3
- EnrollmentStatusBadge from Task 6 (reuse)

**Story Context:** `.bmad-ephemeral/stories/3-3-student-college-enrollment-linking.context.xml` (lines 142-148)

---

## 📋 Update Manifest

**Before starting**, update `.bmad-ephemeral/stories/prompts/3-3/MANIFEST.md`:

1. Mark Task 6 as "Completed" with today's date
2. Add notes about Task 6 (enrollments section on student page working)
3. Mark Task 7 as "In Progress" with today's date

---

## Implementation Instructions

1. **Create EnrolledStudentsSection component**:
   - Use TanStack Query to fetch branch enrollments
   - Display in Table or Card layout
   - Columns: Student Name (linked), Program, Status, Offer Letter, Actions
   - Reuse EnrollmentStatusBadge from Task 6
   - Add "View Offer Letter" button
   - Handle loading and error states
   - Empty state message when no students enrolled
2. **Integrate into college/branch detail page**:
   - Import and render EnrolledStudentsSection
   - Place in appropriate section (e.g., after branch info)
3. **Add navigation links**:
   - Student name links to `/students/[id]`
   - Use Next.js Link component
4. **Style and responsive design**:
   - Consistent with student detail page design
   - Mobile-friendly layout
5. **Test component** with various scenarios

### Testing

- Test display of multiple enrolled students for a branch
- Test student name links navigate to correct student detail page
- Test status badges show correct colors
- Test "View Offer Letter" link opens/downloads document
- Test empty state when branch has no enrolled students
- Test loading state while fetching data

---

## Next Steps

After completing Task 7:
1. ✅ Update manifest.md (mark Task 7 complete, add notes)
2. 📄 Move to `task-8-prompt.md` - Document Viewer Component
3. 🔄 Continue sequential execution
