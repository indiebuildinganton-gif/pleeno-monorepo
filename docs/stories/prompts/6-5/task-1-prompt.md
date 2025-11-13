# Story 6-5: Overdue Payments Summary Widget - Task 1

## Story Context

**As an** Agency User
**I want** a dedicated widget highlighting all overdue payments
**So that** I can immediately focus on the most urgent follow-ups

## Task 1: Create Overdue Payments API Route

**Acceptance Criteria**: #1-5

### Task Description

Create an API endpoint that queries the installments table for all overdue payments, joining with related tables to provide complete context (student, college, payment plan details) and calculating days overdue for urgency sorting.

### Subtasks

- [ ] Create API route: `GET /api/dashboard/overdue-payments`
- [ ] Query installments table:
  - Filter: `status = 'overdue'`
  - Join with: students, payment_plans, enrollments, colleges
  - Calculate: `days_overdue = CURRENT_DATE - due_date`
  - Order by: `due_date ASC` (oldest/most urgent first)
- [ ] Return formatted response:
  ```typescript
  interface OverduePayment {
    id: string
    student_name: string
    college_name: string
    amount: number
    days_overdue: number
    due_date: string
    payment_plan_id: string
    installment_number: number
  }

  interface OverduePaymentsResponse {
    overdue_payments: OverduePayment[]
    total_count: number
    total_amount: number
  }
  ```
- [ ] Apply RLS filtering (agency_id auto-applied)
- [ ] Add caching: 5-minute cache (frequent dashboard access, but needs freshness)
- [ ] Test: Verify only current agency's overdue payments returned
- [ ] Test: Verify correct sorting by days overdue
- [ ] Test: Verify totals calculation (count and amount)

## Context

### Key Constraints

- **API Route Location**: API route at `apps/dashboard/app/api/dashboard/overdue-payments/route.ts`
- **Multi-Tenant Security**: All database queries MUST respect RLS policies (agency_id filtering automatic)
- **Server-Side Client**: Use server-side Supabase client (not anon key) in API routes
- **Database Query**: Query installments WHERE status = 'overdue', ORDER BY due_date ASC (oldest first)
- **Days Overdue Calculation**: Calculate as `CURRENT_DATE - due_date` in SQL for performance
- **Caching**: 5-minute cache (shorter than other widgets due to urgency)

### Relevant Interfaces

**GET /api/dashboard/overdue-payments**:
```typescript
// Response Type
interface OverduePaymentsResponse {
  overdue_payments: OverduePayment[]
  total_count: number
  total_amount: number
}

interface OverduePayment {
  id: string
  student_id: string
  student_name: string
  college_id: string
  college_name: string
  amount: number
  days_overdue: number
  due_date: string
  payment_plan_id: string
  installment_number: number
}
```

**Path**: `apps/dashboard/app/api/dashboard/overdue-payments/route.ts`

**SQL Query Pattern**:
```sql
SELECT
  installments.id,
  installments.amount,
  installments.due_date,
  installments.installment_number,
  (CURRENT_DATE - installments.due_date) AS days_overdue,
  students.id AS student_id,
  students.name AS student_name,
  colleges.id AS college_id,
  colleges.name AS college_name,
  payment_plans.id AS payment_plan_id
FROM installments
INNER JOIN payment_plans ON installments.payment_plan_id = payment_plans.id
INNER JOIN enrollments ON payment_plans.enrollment_id = enrollments.id
INNER JOIN students ON enrollments.student_id = students.id
INNER JOIN colleges ON enrollments.college_id = colleges.id
WHERE installments.status = 'overdue'
  AND payment_plans.agency_id = auth.uid()
ORDER BY installments.due_date ASC;
```

### Dependencies

- **@supabase/supabase-js** (latest): Database client for PostgreSQL with RLS
- **@supabase/ssr** (latest): Server-side Supabase authentication
- **next** (15.x): Next.js API routes
- **zod** (4.x): Request/response validation

### Reference Documentation

- [docs/architecture.md](../../architecture.md) - Dashboard Zone, Multi-Tenant Isolation
- [docs/epics.md](../../epics.md) - Epic 6: Story 6.5
- [.bmad-ephemeral/stories/6-4-recent-activity-feed.md](../../../.bmad-ephemeral/stories/6-4-recent-activity-feed.md) - Previous story patterns

## CRITICAL: Create Implementation Manifest

**Before starting development**, create a manifest file to track progress through all 7 tasks:

**File**: `docs/stories/prompts/6-5/manifest.md`

```markdown
# Story 6-5 Implementation Manifest

**Story**: Overdue Payments Summary Widget
**Status**: In Progress
**Started**: [Current Date]

## Task Progress

### Task 1: Create Overdue Payments API Route
- Status: In Progress
- Started: [Current Date]
- Completed:
- Notes:

### Task 2: Create OverduePaymentsWidget Component
- Status: Not Started
- Started:
- Completed:
- Notes:

### Task 3: Implement Empty State
- Status: Not Started
- Started:
- Completed:
- Notes:

### Task 4: Add Loading and Error States
- Status: Not Started
- Started:
- Completed:
- Notes:

### Task 5: Integrate Widget into Dashboard
- Status: Not Started
- Started:
- Completed:
- Notes:

### Task 6: Add Auto-Refresh for Real-Time Updates
- Status: Not Started
- Started:
- Completed:
- Notes:

### Task 7: Testing
- Status: Not Started
- Started:
- Completed:
- Notes:

## Implementation Notes

[Add notes as you progress through tasks]
```

## Implementation Guide

1. **Create the API route file** at `apps/dashboard/app/api/dashboard/overdue-payments/route.ts`
2. **Import server Supabase client** from `@/lib/supabase/server` or equivalent
3. **Build the query**:
   - Join installments → payment_plans → enrollments → students, colleges
   - Filter by `status = 'overdue'`
   - Calculate `days_overdue` in SQL
   - Order by `due_date ASC`
4. **Calculate totals** (count and sum of amounts)
5. **Add response caching** using Next.js `revalidate` or similar
6. **Add error handling** with proper HTTP status codes
7. **Test the endpoint**:
   - Verify RLS isolation
   - Verify sorting
   - Verify totals calculation

### API Route Structure

The route should include:
- GET handler function
- Server-side Supabase client initialization with JWT auth
- Query execution with proper joins and filtering
- Response formatting matching `OverduePaymentsResponse` interface
- 5-minute cache headers
- Error handling with appropriate status codes

### Testing Approach

Create test cases to verify:
- Only returns installments with `status = 'overdue'`
- RLS filters by agency_id (no cross-agency data)
- Sorting is by `due_date ASC` (oldest first)
- `days_overdue` calculated correctly
- `total_count` and `total_amount` calculated correctly
- All required fields present in response

## Next Steps

After completing this task:

1. **Update the manifest** at `docs/stories/prompts/6-5/manifest.md`:
   - Change Task 1 status to "Completed"
   - Add completion date
   - Add any relevant implementation notes

2. **Proceed to Task 2**: Open `task-2-prompt.md` to create the OverduePaymentsWidget component

3. **Verify**: Test the API endpoint manually (via curl or Postman) to ensure it returns correct data before moving on

---

**Remember**: This is Task 1 of 7. The widget component in Task 2 will consume this API, so ensure the response format is exactly as specified.
