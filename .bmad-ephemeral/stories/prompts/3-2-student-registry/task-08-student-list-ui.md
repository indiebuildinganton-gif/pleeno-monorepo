# Task 8: Student List UI Component

## Context
Story 3.2: Student Registry - Main table view for all students

## Acceptance Criteria Coverage
- AC 1: Student List View

## Task Description
Create student list page with table, search, filters, and action buttons.

## Subtasks
1. Create /entities/students page with table view
2. Implement columns: Full Name, Email, Visa Status, College/Branch, Updated
3. Create visa status badge components with color coding (red/blue/green/gray)
4. Display College/Branch as two-line format
5. Implement relative timestamp display (e.g., "4 days ago")
6. Add search box in top right
7. Add "Export CSV" button
8. Add "+ Add Student" button
9. Make rows clickable to navigate to detail page

## Technical Requirements
- Location: `apps/entities/app/students/`
- Files to create:
  - `page.tsx` (Server Component)
  - `components/StudentTable.tsx` (Client Component)
- Use @tanstack/react-table
- Use Shadcn Table, Badge components
- Use formatRelativeTime() from packages/utils

## UI Specifications
- Table columns: Full Name, Email, Visa Status (badge), College/Branch (2 lines), Updated (relative)
- Visa status colors:
  - Denied: red
  - In Process: blue
  - Approved: green
  - Expired: gray
- College/Branch format:
  - Line 1: "College Name"
  - Line 2: "Branch (City)"
- Search in top right corner
- Action buttons in header

## Constraints
- Server Component for page
- Client Component for table
- Use TanStack Query for data fetching
- Implement pagination
- RLS automatically applied

## Reference Files
- Story file: `.bmad-ephemeral/stories/3-2-student-registry.md` (AC 1, lines 13-20)
- Architecture: `docs/architecture.md` (Project Structure)
- Utility: `packages/utils/src/date-helpers.ts`

## Definition of Done
- [ ] Page renders correctly
- [ ] All columns displayed
- [ ] Badge colors correct
- [ ] Relative timestamps working
- [ ] Search functional
- [ ] Export button working
- [ ] Add button navigates to form
- [ ] Rows clickable
- [ ] Responsive design
