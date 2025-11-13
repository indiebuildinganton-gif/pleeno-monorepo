# Task 3: Student Notes API

## Context
Story 3.2: Student Registry - Notes functionality for student records

## Acceptance Criteria Coverage
- AC 4: Notes Section

## Task Description
Implement REST API endpoints for creating, reading, updating, and deleting student notes.

## Subtasks
1. Implement GET /api/students/[id]/notes
2. Implement POST /api/students/[id]/notes
3. Implement PATCH /api/students/[id]/notes/[note_id]
4. Implement DELETE /api/students/[id]/notes/[note_id]
5. Validate content max length: 2000 characters
6. Return notes with user attribution and timestamps

## Technical Requirements
- Location: `apps/entities/app/api/students/[id]/notes/`
- Files to create:
  - `route.ts` (GET, POST)
  - `[note_id]/route.ts` (PATCH, DELETE)
- Use student_notes table
- Include user_id from session
- Return notes with relative timestamps

## API Signatures
```typescript
GET /api/students/[id]/notes
POST /api/students/[id]/notes {content: string (max 2000)}
PATCH /api/students/[id]/notes/[note_id] {content: string}
DELETE /api/students/[id]/notes/[note_id]
```

## Constraints
- Max 2,000 characters per note
- Require authentication
- Log note additions to audit_logs
- RLS by agency_id

## Reference Files
- Story file: `.bmad-ephemeral/stories/3-2-student-registry.md` (AC 4, lines 37-42)
- Story context: `.bmad-ephemeral/stories/3-2-student-registry.context.xml`

## Definition of Done
- [ ] All endpoints implemented
- [ ] Character limit enforced
- [ ] User attribution working
- [ ] Timestamps displaying correctly
- [ ] RLS enforced
- [ ] Audit logging active
