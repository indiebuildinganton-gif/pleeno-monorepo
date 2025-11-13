# Story 4.3: Payment Plan List and Detail Views - Task 2

## Story Context

**As an** Agency User
**I want** to view all payment plans and drill into individual plan details
**So that** I can quickly find plans and see their payment status

## Task 2: Payment Plan Detail API

### Description
Implement GET /api/payment-plans/[id] with nested relationships and progress calculations.

### Acceptance Criteria
- AC 4: Payment Plan Detail Page
- AC 5: Data Isolation

### Subtasks
- [ ] Implement GET /api/payment-plans/[id]
- [ ] Return payment plan with nested relationships:
  - enrollment (with student, branch, college)
  - all installments (ordered by student_due_date ASC)
- [ ] Calculate plan progress metrics:
  - total_paid: SUM(installments.paid_amount WHERE status = 'paid')
  - installments_paid_count: COUNT(installments WHERE status = 'paid')
- [ ] Apply RLS filtering by agency_id
- [ ] Return 404 if plan not found or belongs to different agency

## Context

### Previous Task Completion
Task 1 (Payment Plans List API) should now be complete. You should have:
- GET /api/payment-plans endpoint with filtering
- Query patterns for joining payment_plans with related tables
- RLS filtering established

### Key Constraints
- RLS Security: All database queries must filter by agency_id automatically via Row-Level Security
- API Routes: All API routes must validate authentication and apply agency_id filtering
- Path Convention: Use project-relative paths only

### Interface to Implement
**GET /api/payment-plans/[id]**
- Kind: REST endpoint
- Path param: id (UUID)
- Response:
```typescript
{
  success: boolean
  data: PaymentPlan & {
    enrollment: Enrollment & {
      student: Student
      branch: Branch & { college: College }
    }
    installments: Installment[]
    progress: {
      total_paid: number
      installments_paid_count: number
    }
  }
}
```
- Path: apps/payments/app/api/payment-plans/[id]/route.ts

### Related Types
```typescript
interface Installment {
  id: string
  payment_plan_id: string
  agency_id: string
  installment_number: number
  amount: number
  student_due_date: string
  college_due_date: string
  is_initial_payment: boolean
  generates_commission: boolean
  status: 'pending' | 'paid' | 'overdue' | 'cancelled' | 'draft'
  paid_date?: string
  paid_amount?: number
  created_at: string
  updated_at: string
}
```

### Dependencies
- @supabase/supabase-js (latest) - Supabase client for database queries
- @supabase/ssr (latest) - Supabase SSR helpers

### Relevant Documentation
- [docs/architecture.md - Payment Plans Endpoints](docs/architecture.md) - API endpoint specification
- [docs/architecture.md - Database Schema](docs/architecture.md) - installments table structure

## Manifest Update Instructions

1. Open `.bmad-ephemeral/stories/prompts/4-3/MANIFEST.md`
2. Update Task 1:
   - Status: Completed
   - Completed: [Current Date]
   - Notes: [Any relevant implementation notes]
3. Update Task 2:
   - Status: In Progress
   - Started: [Current Date]

## Implementation Approach

1. Create the API route file at `apps/payments/app/api/payment-plans/[id]/route.ts`
2. Set up Supabase client with SSR configuration
3. Implement query that:
   - Fetches payment plan by ID
   - Joins with enrollment, student, branch, college
   - Fetches all related installments (ordered by student_due_date)
   - Calculates progress metrics (total_paid, installments_paid_count)
   - Applies RLS filtering automatically
4. Handle not found case (404)
5. Handle authorization errors (403 if different agency)
6. Return properly formatted response

## Building on Previous Work

- Reuse Supabase client setup from Task 1
- Reuse RLS filtering patterns from Task 1
- Similar response format structure

## Next Steps

After completing this task:
1. Update the manifest (Task 2 → Completed)
2. Move to `task-3-prompt.md` (Payment Plans List Page)
3. Task 3 will create the UI that consumes this API

## Testing Checklist

- [ ] Test GET /api/payment-plans/[id] returns plan with nested data
- [ ] Test plan progress calculation (5 of 10 paid shows correct values)
- [ ] Test installments ordered by student_due_date ASC
- [ ] Test RLS: user cannot access other agency's plan (404 or 403)
- [ ] Test 404 for non-existent plan ID
- [ ] Test authentication required (401 without auth)
- [ ] Test response includes all nested relationships
