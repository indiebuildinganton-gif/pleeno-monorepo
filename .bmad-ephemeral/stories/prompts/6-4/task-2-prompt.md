# Story 6-4: Recent Activity Feed - Task 2

## Story Context

**As an** Agency User
**I want** to see a feed of recent activity in the system
**So that** I'm aware of what's happening and can stay in sync with my team

## Task 2: Implement Activity Logging in Existing API Routes

**Acceptance Criteria**: #2-6

### Task Description

Implement activity logging across all relevant API routes to track payments, payment plans, students, enrollments, and overdue installments. This creates a centralized utility and integrates it into existing endpoints.

### Subtasks

- [ ] Identify API routes that need logging:
  - Payment recording: `POST /api/payments/[id]/record`
  - Payment plan creation: `POST /api/payment-plans`
  - Student creation: `POST /api/students`
  - Enrollment creation: `POST /api/enrollments`
  - Installment overdue marking: Background job in status detection
- [ ] Create utility function in `packages/database/src/activity-logger.ts`:
  - `logActivity(agency_id, user_id, entity_type, entity_id, action, description, metadata)`
  - Function inserts activity_log record with current timestamp
  - Function handles null user_id for system actions
- [ ] Add activity logging to each identified route:
  - Payment recorded: "{{user}} recorded payment of {{amount}} for {{student_name}}"
  - Payment plan created: "{{user}} created payment plan for {{student_name}} at {{college_name}}"
  - Student added: "{{user}} added new student {{student_name}}"
  - Enrollment added: "{{user}} enrolled {{student_name}} at {{college_name}}"
  - Installment overdue: "System marked installment {{amount}} as overdue for {{student_name}}"
- [ ] Store metadata: student_name, college_name, amount, etc. for display
- [ ] Test: Verify activities are logged with correct descriptions

## Context from Previous Task

**Task 1 Completed**: The activity_log database table has been created with RLS policies and indexes. The schema is ready to receive activity records.

## Key Constraints

- **Architecture**: Activity logging must be implemented via centralized utility function in packages/database/src/activity-logger.ts to ensure consistency
- **Security**: All activity_log queries MUST respect RLS policies - use server-side Supabase client with JWT auth
- **Security**: Activity descriptions must NOT include sensitive data (passwords, tokens, full payment details)
- **Cross-cutting**: This story introduces activity logging infrastructure used by multiple zones - coordinate with Entity and Payment zones for consistent implementation

## Relevant Interfaces

**logActivity Utility Function**:
```typescript
async function logActivity(
  agency_id: string,
  user_id: string | null,
  entity_type: ActivityEntityType,
  entity_id: string,
  action: ActivityAction,
  description: string,
  metadata?: Record<string, any>
): Promise<void>
```

**Path**: packages/database/src/activity-logger.ts

**Type Definitions**:
```typescript
export type ActivityEntityType = 'payment' | 'payment_plan' | 'student' | 'enrollment' | 'installment'
export type ActivityAction = 'created' | 'recorded' | 'updated' | 'marked_overdue'

export interface ActivityLog {
  id: string
  agency_id: string
  user_id: string | null
  entity_type: ActivityEntityType
  entity_id: string
  action: ActivityAction
  description: string
  metadata: Record<string, any>
  created_at: string
}
```

## Dependencies

- **@supabase/supabase-js** (latest): Database client for PostgreSQL with RLS
- **@supabase/ssr** (latest): Server-side Supabase authentication

## Reference Documentation

- [docs/epics.md](docs/epics.md) - Epic 6: Story 6.4 technical notes on activity logging
- [.bmad-ephemeral/stories/6-4-recent-activity-feed.md](.bmad-ephemeral/stories/6-4-recent-activity-feed.md) - Detailed implementation examples for each API route

## Implementation Guide

### 1. Create Activity Logger Utility

**File**: `packages/database/src/activity-logger.ts`

This utility should:
- Accept all required parameters (agency_id, user_id, entity_type, entity_id, action, description, metadata)
- Use server-side Supabase client to insert into activity_log table
- Handle null user_id for system actions
- Include error handling and logging
- Export TypeScript types for consistency

### 2. Integration Points

**API Routes to Modify**:

1. **Payment Recording**: `apps/payments/app/api/payments/[id]/record/route.ts`
   ```typescript
   await logActivity(
     agency_id,
     user_id,
     'payment',
     payment_plan_id,
     'recorded',
     `${user_name} recorded payment of ${formatCurrency(amount)} for ${student_name}`,
     { student_name, amount, payment_plan_id }
   )
   ```

2. **Payment Plan Creation**: `apps/payments/app/api/payment-plans/route.ts`
   ```typescript
   await logActivity(
     agency_id,
     user_id,
     'payment_plan',
     plan_id,
     'created',
     `${user_name} created payment plan for ${student_name} at ${college_name}`,
     { student_name, college_name, plan_id }
   )
   ```

3. **Student Creation**: `apps/entities/app/api/students/route.ts`
   ```typescript
   await logActivity(
     agency_id,
     user_id,
     'student',
     student_id,
     'created',
     `${user_name} added new student ${student_name}`,
     { student_name, student_id }
   )
   ```

4. **Enrollment Creation**: `apps/entities/app/api/enrollments/route.ts`
   ```typescript
   await logActivity(
     agency_id,
     user_id,
     'enrollment',
     enrollment_id,
     'created',
     `${user_name} enrolled ${student_name} at ${college_name}`,
     { student_name, college_name, enrollment_id }
   )
   ```

5. **Installment Overdue (System Action)**: Background job or status detection function
   ```typescript
   await logActivity(
     agency_id,
     null, // System action, no user
     'installment',
     installment_id,
     'marked_overdue',
     `System marked installment ${formatCurrency(amount)} as overdue for ${student_name}`,
     { student_name, amount, installment_id, payment_plan_id }
   )
   ```

### 3. Testing Approach

- **Unit tests** for logActivity utility function
- **Integration tests** for each API route modification
- **Verify** activity records are created with correct descriptions
- **Test** null user_id handling for system actions
- **Verify** metadata is stored correctly

## Manifest Update Instructions

**Before starting**: Read the current manifest at `docs/stories/prompts/6-4/manifest.md`

**After completing this task**:
1. Update Task 1 status to "Completed" with today's date
2. Update Task 2 status to "Completed" with today's date
3. Add implementation notes about:
   - Location of activity-logger utility
   - Which API routes were modified
   - Any challenges or decisions made

## Next Steps

After completing this task:

1. **Update the manifest** at `docs/stories/prompts/6-4/manifest.md`
2. **Proceed to Task 3**: Open `task-3-prompt.md` to create the Activity Feed API route
3. **Verify**: Test that activities are being logged correctly by performing actions in each zone

---

**Progress**: Task 2 of 8. The database schema is ready, and now we're creating the infrastructure to capture activities.
