# Story 3-3: Student-College Enrollment Linking
## Task 6: Student Detail Page - Enrollments Section

**Previous Tasks:**
- Tasks 1-5: Database, APIs, Payment Plan Integration - COMPLETED ✅

**Story Context:**
- **As a** Agency User
- **I want** to link students to their enrolled colleges through payment plan creation with supporting documentation
- **So that** I can track where each student is studying, store official offer letters, and manage payments for multiple enrollments

---

## Task Description

Add an Enrollments Section to the Student Detail Page displaying all enrollments for the student with college/branch info, program names, status badges, and offer letter download links.

## Subtasks Checklist

- [ ] Create EnrollmentsSection component for student detail page
- [ ] Fetch enrollments using GET /api/students/[id]/enrollments
- [ ] Display enrollments in table/card layout with college, branch, program, status
- [ ] Add EnrollmentStatusBadge component (active=green, completed=blue, cancelled=gray)
- [ ] Add "View Offer Letter" link/button for each enrollment
- [ ] Integrate EnrollmentsSection into student detail page
- [ ] Handle empty state (no enrollments)

## Acceptance Criteria

This task addresses:
- **AC2**: Enrollment Display and Navigation (view enrollments on student page)
- **AC3**: Multiple Enrollment Support (display multiple enrollments)

## Key Constraints

1. **Multi-Zone Architecture**: Student detail page in apps/entities/, shared components in packages/ui/
2. **State Management**: Use TanStack Query for enrollment data fetching
3. **Status Display**: Use color-coded badges (active=green, completed=blue, cancelled=gray)

## Components to Implement

### EnrollmentsSection
```typescript
// apps/entities/app/students/[id]/components/EnrollmentsSection.tsx
interface EnrollmentsSectionProps {
  studentId: string;
}
```
**Notes**: Display enrollments list on student detail page with offer letter links.

### EnrollmentStatusBadge
```typescript
// packages/ui/src/components/enrollments/EnrollmentStatusBadge.tsx
interface EnrollmentStatusBadgeProps {
  status: 'active' | 'completed' | 'cancelled';
}
```
**Notes**: Status badge component with color coding.

## Implementation Locations

```
apps/entities/app/students/[id]/components/EnrollmentsSection.tsx     # NEW: Enrollments display
packages/ui/src/components/enrollments/EnrollmentStatusBadge.tsx      # NEW: Status badge
packages/ui/src/components/enrollments/                                # Shared components
```

## Dependencies

- Task 2: GET /api/students/[id]/enrollments endpoint
- Task 4: Offer letter download endpoint
- TanStack Query for data fetching
- Shadcn UI components (Table, Badge, Card)

## Artifacts & References

**Code References:**
- Student detail page structure from Story 3.2 (ready for enrollment section)
- `packages/ui/src/components/` - Existing component patterns

**Story Context:** `.bmad-ephemeral/stories/3-3-student-college-enrollment-linking.context.xml` (lines 136-148)

---

## 📋 Update Manifest

**Before starting**, update `.bmad-ephemeral/stories/prompts/3-3/MANIFEST.md`:

1. Mark Task 5 as "Completed" with today's date
2. Add notes about Task 5 (payment plan integration complete, enrollment creation working)
3. Mark Task 6 as "In Progress" with today's date

---

## Implementation Instructions

1. **Create EnrollmentStatusBadge component**:
   - Use Shadcn Badge component
   - Color map: active → green, completed → blue, cancelled → gray
   - Display status text
2. **Create EnrollmentsSection component**:
   - Use TanStack Query to fetch enrollments
   - Display in Table or Card layout
   - Columns: College/Branch, Program, Status, Offer Letter, Actions
   - Add "View Offer Letter" button linking to download endpoint
   - Handle loading and error states
   - Empty state message when no enrollments
3. **Integrate into student detail page**:
   - Import and render EnrollmentsSection
   - Place after student info section
4. **Style and responsive design**:
   - Ensure mobile-friendly layout
   - Use consistent spacing with rest of page
5. **Test component** with various scenarios

### Testing

- Test display of multiple enrollments for a student
- Test status badges show correct colors
- Test "View Offer Letter" link opens/downloads document
- Test empty state when student has no enrollments
- Test loading state while fetching data
- Test responsive design on mobile

---

## Next Steps

After completing Task 6:
1. ✅ Update manifest.md (mark Task 6 complete, add notes)
2. 📄 Move to `task-7-prompt.md` - College Detail Page Enrolled Students Section
3. 🔄 Continue sequential execution
