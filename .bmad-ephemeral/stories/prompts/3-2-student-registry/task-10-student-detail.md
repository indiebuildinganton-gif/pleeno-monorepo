# Task 10: Student Detail Page

## Context
Story 3.2: Student Registry - Detail view for individual student

## Acceptance Criteria Coverage
- AC 3: Student Detail Page

## Task Description
Create student detail page showing info, action buttons, and navigation.

## Subtasks
1. Create /entities/students/[id] page
2. Display student name as heading
3. Add "Back to Students" navigation link
4. Add action buttons: "Edit Info", "+ New Payment Plan", "Delete"
5. Display student info: Email, Phone, Visa Status (badge), College/Branch (link)
6. Format College/Branch as "College - Branch (City)"
7. Make College/Branch clickable to college detail page

## Technical Requirements
- Location: `apps/entities/app/students/[id]/`
- Files to create:
  - `page.tsx` (Server Component)
- Fetch student with enrollment joins
- Use Shadcn Badge for visa status
- Use Link component for navigation

## Page Layout
```
[← Back to Students]

[Student Full Name]
[Edit Info] [+ New Payment Plan] [Delete]

Student Information:
- Email: [email]
- Phone: [phone]
- Visa Status: [colored badge]
- College/Branch: [College - Branch (City)] (clickable link)

[Notes Section - Task 11]
[Activity Feed - Task 12]
```

## College/Branch Format
Display as: "Imagine - Imagine (Brisbane)"
Format: "{college_name} - {branch_name} ({city})"
Link to: /entities/colleges/[college_id]

## Constraints
- Server Component for SSR
- Fetch with joins (enrollments, colleges, branches)
- Badge color matches visa status
- Clickable college/branch link
- Action buttons functional

## Reference Files
- Story file: `.bmad-ephemeral/stories/3-2-student-registry.md` (AC 3, lines 31-35)
- Story context: `.bmad-ephemeral/stories/3-2-student-registry.context.xml`

## Definition of Done
- [ ] Page renders correctly
- [ ] Student name displayed as heading
- [ ] Back navigation working
- [ ] All action buttons present
- [ ] Student info displayed correctly
- [ ] Visa status badge correct color
- [ ] College/Branch formatted correctly
- [ ] College/Branch link working
- [ ] Delete confirmation working
