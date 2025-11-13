# Task 16: Audit Logging

## Context
Story 3.2: Student Registry - Comprehensive change tracking for compliance

## Acceptance Criteria Coverage
- AC All: Audit logging for all operations

## Task Description
Implement audit logging for all student CRUD operations and field changes.

## Subtasks
1. Log all student CRUD operations to audit_logs
2. Log visa status changes
3. Log enrollment changes
4. Log email updates
5. Log note additions
6. Include user_id, timestamp, old/new values

## Technical Requirements
- Location: Middleware or utility function
- Files to create/modify:
  - `packages/utils/src/audit-logger.ts`
- Use audit_logs table
- Capture field-level changes
- Store old and new values

## Audit Log Entry Structure
```typescript
{
  id: uuid,
  agency_id: uuid,
  entity_type: 'student' | 'enrollment' | 'note',
  entity_id: uuid,
  action: 'create' | 'update' | 'delete',
  user_id: uuid,
  field_changes: {
    field_name: { old: value, new: value }
  },
  timestamp: timestamp,
  metadata: json
}
```

## Operations to Log

### Student Operations
- Create student
- Update student (any field)
- Delete student
- Field changes: visa_status, email, phone, etc.

### Enrollment Operations
- Add enrollment
- Update enrollment
- Remove enrollment

### Note Operations
- Create note
- Update note
- Delete note

## Audit Helper Function
```typescript
async function logAudit({
  entity_type: string,
  entity_id: string,
  action: 'create' | 'update' | 'delete',
  old_values?: Record<string, any>,
  new_values?: Record<string, any>,
  metadata?: Record<string, any>
}): Promise<void>
```

## Constraints
- Log BEFORE and AFTER values
- Include user_id from session
- Store agency_id for RLS
- Capture timestamp automatically
- Field-level granularity
- No PII in metadata

## Reference Files
- Story file: `.bmad-ephemeral/stories/3-2-student-registry.md` (Task 16, lines 228-235)
- Story context: `.bmad-ephemeral/stories/3-2-student-registry.context.xml`

## Definition of Done
- [ ] Audit logger utility created
- [ ] All CRUD operations logged
- [ ] Field changes captured
- [ ] Old/new values stored
- [ ] User attribution working
- [ ] Timestamps accurate
- [ ] Activity feed queries audit logs correctly
- [ ] No performance impact
