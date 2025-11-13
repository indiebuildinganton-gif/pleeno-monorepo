# Story 4.3: Payment Plan List and Detail Views - Task 1

## Story Context

**As an** Agency User
**I want** to view all payment plans and drill into individual plan details
**So that** I can quickly find plans and see their payment status

## Task 1: Payment Plans List API

### Description
Implement GET /api/payment-plans with comprehensive query params and RLS-enforced filtering.

### Acceptance Criteria
- AC 1: Payment Plans List View
- AC 2: Comprehensive Filtering
- AC 3: Search Functionality
- AC 5: Data Isolation

### Subtasks
- [ ] Implement GET /api/payment-plans with comprehensive query params:
  - status: string[] (multi-select)
  - student_id: string
  - college_id: string
  - branch_id: string
  - amount_min: number
  - amount_max: number
  - installments_min: number
  - installments_max: number
  - due_date_from: string (ISO date)
  - due_date_to: string (ISO date)
  - search: string (student name or reference number)
  - page: number
  - limit: number
  - sort_by: string (default: next_due_date)
  - sort_order: 'asc' | 'desc'
- [ ] Join payment_plans with enrollments, students, branches, colleges
- [ ] Calculate next_due_date: MIN(installments.student_due_date WHERE status = 'pending')
- [ ] Calculate installment counts: COUNT(installments) as total_installments
- [ ] Apply RLS filtering by agency_id
- [ ] Return paginated results with total count
- [ ] Optimize query performance with indexes on (agency_id, status), (student_id), (branch_id)

## Context

### Key Constraints
- Multi-Zone Architecture: Payment plans live in apps/payments/ zone with basePath: /payments
- RLS Security: All database queries must filter by agency_id automatically via Row-Level Security
- API Routes: All API routes must validate authentication and apply agency_id filtering
- Pagination: Default page size of 20 plans
- Path Convention: Use project-relative paths only (strip project-root prefix)

### Interface to Implement
**GET /api/payment-plans**
- Kind: REST endpoint
- Query params:
  - status?: string[]
  - student_id?: string
  - college_id?: string
  - branch_id?: string
  - amount_min?: number
  - amount_max?: number
  - installments_min?: number
  - installments_max?: number
  - due_date_from?: string (ISO date)
  - due_date_to?: string (ISO date)
  - search?: string
  - page?: number
  - limit?: number
  - sort_by?: string
  - sort_order?: 'asc' | 'desc'
- Response: `{ success: boolean, data: PaymentPlan[], meta: { total, page, per_page, total_pages } }`
- Path: apps/payments/app/api/payment-plans/route.ts

### Related Types
```typescript
interface PaymentPlan {
  id: string
  enrollment_id: string
  agency_id: string
  total_amount: number
  currency: string
  start_date: string
  commission_rate_percent: number
  expected_commission: number
  status: 'active' | 'completed' | 'cancelled'
  notes?: string
  reference_number?: string
  created_at: string
  updated_at: string
}
```

### Dependencies
- @supabase/supabase-js (latest) - Supabase client for database queries
- @supabase/ssr (latest) - Supabase SSR helpers for Server Components

### Relevant Documentation
- [docs/architecture.md - Payment Plans Endpoints](docs/architecture.md) - API endpoint specification
- [docs/architecture.md - Database Schema](docs/architecture.md) - payment_plans and installments table structure
- [docs/epics.md - Story 4.3](docs/epics.md) - Full acceptance criteria

## CRITICAL: Manifest Creation Instructions

This is Task 1, so you must create a manifest file to track implementation progress.

1. Create file: `.bmad-ephemeral/stories/prompts/4-3/MANIFEST.md`
2. Use this structure:

```markdown
# Story 4.3 Implementation Manifest

**Story**: Payment Plan List and Detail Views
**Status**: In Progress
**Started**: [Current Date]

## Task Progress

### Task 1: Payment Plans List API
- Status: In Progress
- Started: [Current Date]
- Completed:
- Notes:

### Task 2: Payment Plan Detail API
- Status: Not Started
- Started:
- Completed:
- Notes:

### Task 3: Payment Plans List Page
- Status: Not Started
- Started:
- Completed:
- Notes:

### Task 4: Filter Panel Component
- Status: Not Started
- Started:
- Completed:
- Notes:

### Task 5: Search Bar Component
- Status: Not Started
- Started:
- Completed:
- Notes:

### Task 6: Payment Plan Detail Page
- Status: Not Started
- Started:
- Completed:
- Notes:

### Task 7: Installments List Component
- Status: Not Started
- Started:
- Completed:
- Notes:

### Task 8: Payment Plan Status Calculation
- Status: Not Started
- Started:
- Completed:
- Notes:

### Task 9: Pagination / Infinite Scroll
- Status: Not Started
- Started:
- Completed:
- Notes:

### Task 10: TanStack Query Integration
- Status: Not Started
- Started:
- Completed:
- Notes:

### Task 11: Testing
- Status: Not Started
- Started:
- Completed:
- Notes:

## Implementation Notes

[Add notes as you progress through tasks]
```

3. After completing Task 1, update the manifest:
   - Set Task 1 Status to "Completed"
   - Add Task 1 Completed date
   - Add any relevant notes about the implementation

## Implementation Approach

1. Create the API route file at `apps/payments/app/api/payment-plans/route.ts`
2. Set up Supabase client with SSR configuration
3. Implement query builder that:
   - Starts with base payment_plans query
   - Joins with enrollments, students, branches, colleges
   - Applies all filter parameters conditionally
   - Calculates next_due_date from installments
   - Applies RLS filtering (automatic via Supabase)
4. Implement pagination logic
5. Return properly formatted response
6. Test with various filter combinations

## Next Steps

After completing this task:
1. Update the manifest (Task 1 → Completed)
2. Move to `task-2-prompt.md` (Payment Plan Detail API)
3. Task 2 will build on the base query patterns established here

## Testing Checklist

- [ ] Test API returns only plans for authenticated agency (RLS)
- [ ] Test pagination (page 1, page 2, total count)
- [ ] Test default sort by next_due_date ascending
- [ ] Test status filter (single and multiple values)
- [ ] Test amount range filter
- [ ] Test date range filter
- [ ] Test search by student name
- [ ] Test search by reference number
- [ ] Test filter combinations
- [ ] Test with no results (empty state)
- [ ] Test authentication required (401 without auth)
