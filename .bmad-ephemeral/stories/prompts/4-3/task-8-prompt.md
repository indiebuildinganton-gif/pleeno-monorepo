# Story 4.3: Payment Plan List and Detail Views - Task 8

## Story Context

**As an** Agency User
**I want** to view all payment plans and drill into individual plan details
**So that** I can quickly find plans and see their payment status

## Task 8: Payment Plan Status Calculation

### Description
Implement logic to calculate overall plan status and next due date from installments.

### Acceptance Criteria
- AC 1: Payment Plans List View (status display)
- AC 4: Payment Plan Detail Page (status display)

### Subtasks
- [ ] Calculate overall plan status logic:
  - "active": At least one installment is pending
  - "completed": All installments are paid
  - "cancelled": Plan is explicitly cancelled
- [ ] Calculate next_due_date: MIN(student_due_date) WHERE status = 'pending'
- [ ] Implement as database view or computed column
- [ ] Cache computed values in TanStack Query (5-minute stale time)

## Context

### Previous Task Completion
Tasks 1-7 should now be complete. You should have:
- API endpoints returning payment plans (Tasks 1-2)
- UI displaying plans and installments (Tasks 3-7)
- Status badges displayed throughout

### Key Constraints
- Database optimization: Consider database views for performance
- Caching: TanStack Query already caching for 5 minutes (list) / 2 minutes (detail)
- Consistency: Status calculation logic must be consistent across list and detail views

### Implementation Options

**Option 1: Database View (Recommended)**
- Create Postgres view: `payment_plans_with_status`
- Calculates status and next_due_date at query time
- Optimal performance for large datasets
- Query the view instead of base table

**Option 2: Computed in API Route**
- Calculate status when fetching plans
- Join with installments and compute
- Works but may be slower for large datasets

**Option 3: Materialized View (Advanced)**
- Pre-computed and stored results
- Refresh on schedule or trigger
- Best performance but more complex

### Relevant Documentation
- [docs/architecture.md - Database Schema](docs/architecture.md) - payment_plans and installments tables

## Manifest Update Instructions

1. Open `.bmad-ephemeral/stories/prompts/4-3/MANIFEST.md`
2. Update Task 7:
   - Status: Completed
   - Completed: [Current Date]
   - Notes: [Any relevant implementation notes]
3. Update Task 8:
   - Status: In Progress
   - Started: [Current Date]

## Implementation Approach

### Option 1: Database View (Recommended)

#### Step 1: Create Migration
```sql
-- supabase/migrations/003_payments_domain/004_payment_plans_views.sql

-- Create view for payment plans with computed status and next due date
CREATE OR REPLACE VIEW payment_plans_with_status AS
SELECT
  pp.*,
  -- Calculate overall status
  CASE
    WHEN pp.status = 'cancelled' THEN 'cancelled'
    WHEN COUNT(i.id) FILTER (WHERE i.status = 'pending') > 0 THEN 'active'
    WHEN COUNT(i.id) = COUNT(i.id) FILTER (WHERE i.status = 'paid') THEN 'completed'
    ELSE 'active'
  END as computed_status,

  -- Calculate next due date
  MIN(i.student_due_date) FILTER (WHERE i.status = 'pending') as next_due_date,

  -- Calculate installment counts
  COUNT(i.id) as total_installments,
  COUNT(i.id) FILTER (WHERE i.status = 'paid') as paid_installments,

  -- Calculate payment totals
  COALESCE(SUM(i.paid_amount) FILTER (WHERE i.status = 'paid'), 0) as total_paid

FROM payment_plans pp
LEFT JOIN installments i ON i.payment_plan_id = pp.id
GROUP BY pp.id;

-- Create RLS policies for the view (inherit from base table)
ALTER VIEW payment_plans_with_status SET (security_invoker = true);
```

#### Step 2: Update API Routes to Use View
```typescript
// apps/payments/app/api/payment-plans/route.ts
// Instead of querying 'payment_plans', query 'payment_plans_with_status'

const { data, error } = await supabase
  .from('payment_plans_with_status')
  .select('*')
  .eq('agency_id', agencyId) // RLS handles this automatically
  .order('next_due_date', { ascending: true })

// Response now includes:
// - computed_status
// - next_due_date
// - total_installments
// - paid_installments
// - total_paid
```

#### Step 3: Update TypeScript Types
```typescript
// packages/database/src/types/payment-plan.ts

interface PaymentPlanWithStatus extends PaymentPlan {
  computed_status: 'active' | 'completed' | 'cancelled'
  next_due_date: string | null
  total_installments: number
  paid_installments: number
  total_paid: number
}
```

### Option 2: Computed in API Route

If you prefer not to use a database view:

```typescript
// In API route
async function getPaymentPlansWithStatus(supabase, agencyId) {
  // Fetch payment plans with installments
  const { data: plans } = await supabase
    .from('payment_plans')
    .select(`
      *,
      installments (
        id,
        status,
        student_due_date,
        paid_amount
      )
    `)
    .eq('agency_id', agencyId)

  // Calculate status for each plan
  return plans.map(plan => ({
    ...plan,
    computed_status: calculateStatus(plan),
    next_due_date: calculateNextDueDate(plan.installments),
    total_installments: plan.installments.length,
    paid_installments: plan.installments.filter(i => i.status === 'paid').length,
    total_paid: plan.installments
      .filter(i => i.status === 'paid')
      .reduce((sum, i) => sum + (i.paid_amount || 0), 0),
  }))
}

function calculateStatus(plan) {
  if (plan.status === 'cancelled') return 'cancelled'
  const hasPending = plan.installments.some(i => i.status === 'pending')
  if (hasPending) return 'active'
  const allPaid = plan.installments.every(i => i.status === 'paid')
  return allPaid ? 'completed' : 'active'
}

function calculateNextDueDate(installments) {
  const pendingDates = installments
    .filter(i => i.status === 'pending')
    .map(i => new Date(i.student_due_date))
  return pendingDates.length > 0
    ? new Date(Math.min(...pendingDates)).toISOString()
    : null
}
```

## Status Calculation Logic

### Overall Plan Status
```
IF plan.status = 'cancelled' THEN
  computed_status = 'cancelled'
ELSE IF any installment has status = 'pending' THEN
  computed_status = 'active'
ELSE IF all installments have status = 'paid' THEN
  computed_status = 'completed'
ELSE
  computed_status = 'active'
```

### Next Due Date
```
next_due_date = MIN(installments.student_due_date)
                WHERE installments.status = 'pending'
```

If no pending installments, `next_due_date` is NULL.

## Testing the View

```sql
-- Test the view
SELECT
  id,
  total_amount,
  computed_status,
  next_due_date,
  total_installments,
  paid_installments,
  total_paid
FROM payment_plans_with_status
WHERE agency_id = 'test-agency-id';
```

## Update Frontend Components

### Update List Component (Task 3)
```typescript
// No changes needed if using database view
// The API already returns computed_status and next_due_date
```

### Update Detail Component (Task 6)
```typescript
// Display computed_status instead of base status
<PaymentPlanStatusBadge status={plan.computed_status} />
```

## Next Steps

After completing this task:
1. Update the manifest (Task 8 → Completed)
2. Move to `task-9-prompt.md` (Pagination / Infinite Scroll)
3. Task 9 will implement pagination logic

## Testing Checklist

- [ ] Test database view returns correct computed_status
- [ ] Test status = 'active' when any installment is pending
- [ ] Test status = 'completed' when all installments are paid
- [ ] Test status = 'cancelled' when plan is cancelled
- [ ] Test next_due_date returns earliest pending due date
- [ ] Test next_due_date is NULL when no pending installments
- [ ] Test total_installments count is accurate
- [ ] Test paid_installments count is accurate
- [ ] Test total_paid sum is accurate
- [ ] Test view respects RLS (agency_id filtering)
- [ ] Test API routes return computed fields
- [ ] Test UI displays computed status correctly
