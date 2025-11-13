# Task 11: Notes Section UI

## Context
Story 3.2: Student Registry - Notes interface for student detail page

## Acceptance Criteria Coverage
- AC 4: Notes Section

## Task Description
Create notes section component with text area, character counter, and note list.

## Subtasks
1. Create Notes component for student detail page
2. Add text area with max 2,000 character validation
3. Display character counter (e.g., "0 / 2,000")
4. Add "Post Note" button
5. List existing notes with relative timestamps
6. Add edit/delete icons for each note
7. Implement note editing modal
8. Handle note deletion with confirmation

## Technical Requirements
- Location: `apps/entities/app/students/components/`
- Files to create:
  - `NotesSection.tsx` (Client Component)
- Use Shadcn Textarea, Dialog components
- Use formatRelativeTime() for timestamps
- Use TanStack Query for notes fetching

## UI Layout
```
Add Note:
[Text area - max 2,000 chars]
[Character counter: 0 / 2,000]
[Post Note button]

Previous Notes:
┌─────────────────────────────────┐
│ Note content here...            │
│ [Edit] [Delete] - 4 days ago    │
└─────────────────────────────────┘
```

## Character Counter Logic
- Show current count / 2,000
- Update live as user types
- Disable submit if > 2,000
- Visual warning at 1,800+

## Constraints
- Max 2,000 characters enforced
- Character counter updates live
- Notes show user attribution
- Relative timestamps ("4 days ago")
- Edit/delete only for note owner
- Delete requires confirmation

## Reference Files
- Story file: `.bmad-ephemeral/stories/3-2-student-registry.md` (AC 4, lines 37-42)
- Utility: `packages/utils/src/date-helpers.ts`

## Definition of Done
- [ ] Text area functional
- [ ] Character counter working
- [ ] Max length enforced
- [ ] Post Note working
- [ ] Notes list displayed
- [ ] Timestamps relative
- [ ] Edit modal working
- [ ] Delete confirmation working
- [ ] User attribution shown
