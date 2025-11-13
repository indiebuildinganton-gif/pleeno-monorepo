# Story 4.3: Payment Plan List and Detail Views - Task 3

## Story Context

**As an** Agency User
**I want** to view all payment plans and drill into individual plan details
**So that** I can quickly find plans and see their payment status

## Task 3: Payment Plans List Page

### Description
Create /payments/plans/page.tsx with PaymentPlansList component displaying plans in table/card layout.

### Acceptance Criteria
- AC 1: Payment Plans List View
- AC 2: Comprehensive Filtering (UI structure, filters implemented in Task 4)
- AC 3: Search Functionality (UI structure, search implemented in Task 5)

### Subtasks
- [ ] Create /payments/plans/page.tsx (Server Component)
- [ ] Create PaymentPlansList component (Client Component with TanStack Query)
- [ ] Display plans in table/card layout with columns:
  - Student Name (linked to student profile)
  - College / Branch
  - Total Amount (formatted currency)
  - Installments (e.g., "5 of 12 paid")
  - Next Due Date (formatted date)
  - Status (badge: active/completed/cancelled)
- [ ] Implement default sort by next_due_date ASC
- [ ] Add "View Details" button/link for each plan
- [ ] Show loading skeleton while fetching data
- [ ] Show empty state: "No payment plans found. Create your first payment plan."

## Context

### Previous Task Completion
Tasks 1-2 should now be complete. You should have:
- GET /api/payment-plans endpoint (Task 1)
- GET /api/payment-plans/[id] endpoint (Task 2)
- API response structures established

### Key Constraints
- Multi-Zone Architecture: Payment plans live in apps/payments/ zone with basePath: /payments
- Server Components: Use Next.js 15 Server Components for initial page loads (page.tsx files)
- Client Components: Use 'use client' for interactive components (TanStack Query hooks)
- TanStack Query: Use query keys ['payment-plans', { filters }] with 5-minute stale time
- Responsive Design: List view must work on mobile (card layout) and desktop (table layout)

### Components to Create
1. **apps/payments/app/plans/page.tsx** (Server Component)
   - Initial page setup
   - Layout and structure
   - Render PaymentPlansList

2. **apps/payments/app/plans/components/PaymentPlansList.tsx** (Client Component)
   - 'use client' directive
   - TanStack Query integration
   - Table/card rendering
   - Loading and empty states

3. **apps/payments/app/plans/components/PaymentPlanStatusBadge.tsx** (Reusable component)
   - Display status with appropriate styling
   - active = green, completed = gray, cancelled = red

### Dependencies
- @tanstack/react-query (5.90.7) - Server state management
- @tanstack/react-table (latest) - Table component
- Shadcn UI components: Table, Badge, Button, Skeleton
- date-fns (latest) - Date formatting
- packages/utils/src/formatters.ts - formatCurrency utility

### Relevant Documentation
- [docs/architecture.md - Payment Plans List](docs/architecture.md) - List view component structure
- [docs/architecture.md - State Management](docs/architecture.md) - TanStack Query patterns

## Manifest Update Instructions

1. Open `.bmad-ephemeral/stories/prompts/4-3/MANIFEST.md`
2. Update Task 2:
   - Status: Completed
   - Completed: [Current Date]
   - Notes: [Any relevant implementation notes]
3. Update Task 3:
   - Status: In Progress
   - Started: [Current Date]

## Implementation Approach

### Step 1: Create Server Component Page
```typescript
// apps/payments/app/plans/page.tsx
export default async function PaymentPlansPage() {
  return (
    <div className="container mx-auto py-8">
      <h1>Payment Plans</h1>
      <PaymentPlansList />
    </div>
  )
}
```

### Step 2: Create Client Component with TanStack Query
```typescript
// apps/payments/app/plans/components/PaymentPlansList.tsx
'use client'

import { useQuery } from '@tanstack/react-query'

export function PaymentPlansList() {
  const { data, isLoading, error } = useQuery({
    queryKey: ['payment-plans', {}],
    queryFn: () => fetch('/api/payment-plans').then(res => res.json()),
    staleTime: 5 * 60 * 1000, // 5 minutes
  })

  // Render loading skeleton, error, empty state, or table
}
```

### Step 3: Implement Table/Card Layout
- Desktop: Table with columns
- Mobile: Card layout (responsive)
- Use Shadcn Table component
- Format currency with formatCurrency()
- Format dates with date-fns

### Step 4: Implement Status Badge
- Create reusable PaymentPlanStatusBadge component
- Use Shadcn Badge component
- Color coding: active (green), completed (gray), cancelled (red)

## Building on Previous Work

- Consume GET /api/payment-plans from Task 1
- Use response structure established in Task 1
- Prepare for filter/search integration (Tasks 4-5)

## Next Steps

After completing this task:
1. Update the manifest (Task 3 → Completed)
2. Move to `task-4-prompt.md` (Filter Panel Component)
3. Task 4 will add comprehensive filtering UI

## Testing Checklist

- [ ] Test page renders at /payments/plans
- [ ] Test loading skeleton shows while fetching
- [ ] Test empty state shows when no plans
- [ ] Test table displays all columns correctly
- [ ] Test currency formatting (e.g., $1,234.56)
- [ ] Test date formatting
- [ ] Test status badges render with correct colors
- [ ] Test "View Details" link navigates to detail page
- [ ] Test responsive layout (desktop table, mobile cards)
- [ ] Test default sort by next_due_date ASC
