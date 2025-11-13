# Task 5: Activity Feed API

## Context
Story 3.2: Student Registry - Activity timeline showing all student changes

## Acceptance Criteria Coverage
- AC 5: Activity Feed

## Task Description
Implement API endpoint to query audit logs for student activity with filtering and search.

## Subtasks
1. Implement GET /api/students/[id]/activity
2. Query audit_logs filtered by student_id and related entities
3. Support time period filter (Last 30 days, etc.)
4. Support search within activity
5. Return formatted activity entries with old → new values
6. Include enrollment changes, email updates, note additions, visa status changes

## Technical Requirements
- Location: `apps/entities/app/api/students/[id]/activity/`
- Files to create:
  - `route.ts` (GET)
- Query audit_logs table
- Format change entries showing field transitions
- Support pagination

## API Signature
```typescript
GET /api/students/[id]/activity?period=string&search=string&page=number
```

## Activity Entry Format
```typescript
{
  event_type: 'Update' | 'Note',
  description: 'Visa Status changed from "In Process" to "Approved"',
  timestamp: Date,
  user_id: string,
  old_value?: any,
  new_value?: any
}
```

## Constraints
- Query audit_logs table efficiently
- Format old → new values clearly
- Support time period filters
- Enable search across descriptions
- RLS by agency_id

## Reference Files
- Story file: `.bmad-ephemeral/stories/3-2-student-registry.md` (AC 5, lines 44-50)
- Story context: `.bmad-ephemeral/stories/3-2-student-registry.context.xml`

## Definition of Done
- [ ] Activity endpoint working
- [ ] Time period filter functional
- [ ] Search working
- [ ] Old → new values formatted correctly
- [ ] All event types captured
- [ ] Pagination implemented
- [ ] RLS enforced
