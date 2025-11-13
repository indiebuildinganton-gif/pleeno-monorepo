# Task 2: Implement Activity Logging in Existing API Routes

## Context
You are implementing Story 6.4, Task 2 of the Pleeno payment tracking system.

**Story:** As an Agency User, I want to see a feed of recent activity in the system, so that I'm aware of what's happening and can stay in sync with my team.

**This Task:** Create a centralized activity logger utility and integrate it into existing API routes to log user and system actions.

## Acceptance Criteria
- AC #2-6: Activities logged for payments, payment plans, students, enrollments, and overdue installments

## Requirements

### Part 1: Create Activity Logger Utility

Create utility file at `packages/database/src/activity-logger.ts` that exports:

1. **TypeScript types:**
   ```typescript
   export type ActivityEntityType = 'payment' | 'payment_plan' | 'student' | 'enrollment' | 'installment'
   export type ActivityAction = 'created' | 'recorded' | 'updated' | 'marked_overdue'

   export interface LogActivityParams {
     agency_id: string
     user_id: string | null
     entity_type: ActivityEntityType
     entity_id: string
     action: ActivityAction
     description: string
     metadata?: Record<string, any>
   }
   ```

2. **`logActivity` function:**
   ```typescript
   export async function logActivity(params: LogActivityParams): Promise<void>
   ```
   - Inserts record into `activity_log` table
   - Uses server-side Supabase client
   - Handles null `user_id` for system actions
   - Throws error if insert fails (caller handles)

### Part 2: Integrate Activity Logging into API Routes

Add activity logging to these API routes:

#### 1. Payment Recording
**File:** `apps/payments/app/api/payments/[id]/record/route.ts`

**When:** After successful payment recording

**Activity:**
```typescript
await logActivity({
  agency_id,
  user_id,
  entity_type: 'payment',
  entity_id: payment_plan_id,
  action: 'recorded',
  description: `${user_name} recorded payment of ${formatCurrency(amount)} for ${student_name}`,
  metadata: { student_name, amount, payment_plan_id }
})
```

#### 2. Payment Plan Creation
**File:** `apps/payments/app/api/payment-plans/route.ts`

**When:** After successful payment plan creation

**Activity:**
```typescript
await logActivity({
  agency_id,
  user_id,
  entity_type: 'payment_plan',
  entity_id: plan_id,
  action: 'created',
  description: `${user_name} created payment plan for ${student_name} at ${college_name}`,
  metadata: { student_name, college_name, plan_id }
})
```

#### 3. Student Creation
**File:** `apps/entities/app/api/students/route.ts`

**When:** After successful student creation

**Activity:**
```typescript
await logActivity({
  agency_id,
  user_id,
  entity_type: 'student',
  entity_id: student_id,
  action: 'created',
  description: `${user_name} added new student ${student_name}`,
  metadata: { student_name, student_id }
})
```

#### 4. Enrollment Creation
**File:** `apps/entities/app/api/enrollments/route.ts`

**When:** After successful enrollment creation

**Activity:**
```typescript
await logActivity({
  agency_id,
  user_id,
  entity_type: 'enrollment',
  entity_id: enrollment_id,
  action: 'created',
  description: `${user_name} enrolled ${student_name} at ${college_name}`,
  metadata: { student_name, college_name, enrollment_id }
})
```

#### 5. Installment Overdue (System Action)
**File:** Background job or status detection function (location TBD)

**When:** System marks installment as overdue

**Activity:**
```typescript
await logActivity({
  agency_id,
  user_id: null, // System action
  entity_type: 'installment',
  entity_id: installment_id,
  action: 'marked_overdue',
  description: `System marked installment ${formatCurrency(amount)} as overdue for ${student_name}`,
  metadata: { student_name, amount, installment_id, payment_plan_id }
})
```

## Technical Constraints

- **Architecture:** Shared utility in `packages/database/`, called from multiple zones
- **Security:** Use server-side Supabase client (not anon key)
- **Error Handling:** Activity logging failures should NOT block primary operations (log error and continue)
- **Performance:** Logging is async; consider making it non-blocking (fire-and-forget or queue)
- **Data Privacy:** Do NOT log sensitive data (passwords, tokens, full payment details)

## Implementation Notes

### Activity Logger Utility

```typescript
// packages/database/src/activity-logger.ts

import { createClient } from '@supabase/supabase-js'

export type ActivityEntityType = 'payment' | 'payment_plan' | 'student' | 'enrollment' | 'installment'
export type ActivityAction = 'created' | 'recorded' | 'updated' | 'marked_overdue'

export interface LogActivityParams {
  agency_id: string
  user_id: string | null
  entity_type: ActivityEntityType
  entity_id: string
  action: ActivityAction
  description: string
  metadata?: Record<string, any>
}

/**
 * Logs an activity to the activity_log table.
 * Uses server-side Supabase client with RLS enforcement.
 */
export async function logActivity(params: LogActivityParams): Promise<void> {
  const {
    agency_id,
    user_id,
    entity_type,
    entity_id,
    action,
    description,
    metadata
  } = params

  // Get server-side Supabase client
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!, // Service role for server-side operations
    { auth: { persistSession: false } }
  )

  try {
    const { error } = await supabase
      .from('activity_log')
      .insert({
        agency_id,
        user_id,
        entity_type,
        entity_id,
        action,
        description,
        metadata
      })

    if (error) {
      console.error('Failed to log activity:', error)
      // Don't throw - activity logging should not block primary operations
    }
  } catch (err) {
    console.error('Activity logging error:', err)
    // Don't throw - fail gracefully
  }
}
```

### Integration Pattern

When integrating into API routes:

1. **Import the utility:**
   ```typescript
   import { logActivity } from '@repo/database/activity-logger'
   ```

2. **Add after successful operation:**
   ```typescript
   // Primary operation (e.g., create payment plan)
   const { data: plan, error } = await supabase.from('payment_plans').insert(...)
   if (error) throw error

   // Log activity (non-blocking)
   await logActivity({
     agency_id: plan.agency_id,
     user_id: session.user.id,
     entity_type: 'payment_plan',
     entity_id: plan.id,
     action: 'created',
     description: `${session.user.name} created payment plan for ${student.name}`,
     metadata: { student_name: student.name, college_name: college.name }
   })
   ```

3. **Wrap in try-catch if needed:**
   ```typescript
   try {
     await logActivity(...)
   } catch (err) {
     // Log but don't fail the request
     console.error('Activity logging failed:', err)
   }
   ```

### Metadata Best Practices

Store minimal metadata needed for display:
- `student_name`: For displaying in feed without additional queries
- `college_name`: For displaying in feed without additional queries
- `amount`: For displaying payment amounts
- `payment_plan_id`: For linking from installment/payment activities
- `student_id`: For linking from enrollment activities

**DO NOT store:**
- Sensitive data (passwords, tokens, SSNs)
- Full payment details (credit card info)
- Personal identifiable information beyond names

## Testing Requirements

### Unit Tests for Activity Logger

Create `packages/database/src/__tests__/activity-logger.test.ts`:

```typescript
import { describe, it, expect, vi } from 'vitest'
import { logActivity } from '../activity-logger'

describe('logActivity', () => {
  it('should insert activity log with all parameters', async () => {
    // Mock Supabase client
    const mockInsert = vi.fn().mockResolvedValue({ error: null })

    await logActivity({
      agency_id: 'agency-123',
      user_id: 'user-123',
      entity_type: 'student',
      entity_id: 'student-123',
      action: 'created',
      description: 'Test created student John Doe',
      metadata: { student_name: 'John Doe' }
    })

    expect(mockInsert).toHaveBeenCalledWith({
      agency_id: 'agency-123',
      user_id: 'user-123',
      entity_type: 'student',
      entity_id: 'student-123',
      action: 'created',
      description: 'Test created student John Doe',
      metadata: { student_name: 'John Doe' }
    })
  })

  it('should handle null user_id for system actions', async () => {
    // Test system-generated activity with user_id: null
    await logActivity({
      agency_id: 'agency-123',
      user_id: null,
      entity_type: 'installment',
      entity_id: 'installment-123',
      action: 'marked_overdue',
      description: 'System marked installment as overdue',
      metadata: { student_name: 'John Doe', amount: 500 }
    })

    // Verify user_id is null
    expect(mockInsert).toHaveBeenCalledWith(
      expect.objectContaining({ user_id: null })
    )
  })

  it('should not throw error if insert fails', async () => {
    // Mock insert failure
    const mockInsert = vi.fn().mockResolvedValue({
      error: { message: 'Insert failed' }
    })

    // Should not throw
    await expect(logActivity({
      agency_id: 'agency-123',
      user_id: 'user-123',
      entity_type: 'student',
      entity_id: 'student-123',
      action: 'created',
      description: 'Test',
      metadata: {}
    })).resolves.not.toThrow()
  })
})
```

### Integration Tests

For each API route:

1. **Test activity logging on success:**
   - Perform operation (create student, record payment, etc.)
   - Query activity_log table
   - Verify activity record exists with correct data

2. **Test primary operation not blocked by logging failure:**
   - Mock activity logger to throw error
   - Perform operation
   - Verify operation succeeds despite logging failure

## Dependencies

- @supabase/supabase-js
- Existing API routes in payments and entities zones
- Currency formatter: `packages/utils/src/formatters.ts` (for formatCurrency)

## References

- [Architecture: Multi-Tenant Isolation](docs/architecture.md#Multi-Tenant-Isolation-RLS)
- [Story: 6.4 Recent Activity Feed](.bmad-ephemeral/stories/6-4-recent-activity-feed.md)
- [Dev Notes: Activity Logging Integration Points](.bmad-ephemeral/stories/6-4-recent-activity-feed.md#Activity-Logging-Integration-Points)
