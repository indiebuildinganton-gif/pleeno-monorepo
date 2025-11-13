# Story 4.3: Payment Plan List and Detail Views - Task 6

## Story Context

**As an** Agency User
**I want** to view all payment plans and drill into individual plan details
**So that** I can quickly find plans and see their payment status

## Task 6: Payment Plan Detail Page

### Description
Create /payments/plans/[id]/page.tsx with PaymentPlanDetail component displaying complete plan information.

### Acceptance Criteria
- AC 4: Payment Plan Detail Page

### Subtasks
- [ ] Create /payments/plans/[id]/page.tsx (Server Component)
- [ ] Create PaymentPlanDetail component (Client Component)
- [ ] Display sections:
  - **Plan Overview**: Total amount, currency, status, reference number, notes, start date
  - **Student Information**: Name (linked), contact info, link to student profile page
  - **Enrollment Details**: College name, branch name, program, enrollment status
  - **Commission Breakdown**: Commission rate (%), expected commission (amount), calculation formula display
  - **Payment Progress**: Visual progress bar (X of Y installments paid, $X of $Y paid)
- [ ] Add breadcrumb navigation: Home → Payment Plans → [Plan ID]
- [ ] Add "Edit Plan" button (future story)
- [ ] Add "Cancel Plan" button (future story, with confirmation modal)

## Context

### Previous Task Completion
Tasks 1-5 should now be complete. You should have:
- GET /api/payment-plans/[id] endpoint (Task 2)
- Payment Plans List page with navigation to detail (Task 3)
- Full list, filter, and search functionality

### Key Constraints
- Server Components: Use Next.js 15 Server Components for initial page load
- Client Components: Use 'use client' for interactive detail display
- TanStack Query: 2-minute stale time for detail view
- Responsive Design: Detail page must work on mobile and desktop

### Components to Create
1. **apps/payments/app/plans/[id]/page.tsx** (Server Component)
   - Dynamic route handling
   - Initial data fetch
   - Render PaymentPlanDetail

2. **apps/payments/app/plans/components/PaymentPlanDetail.tsx** (Client Component)
   - 'use client' directive
   - TanStack Query integration
   - Multiple information sections
   - Action buttons

### Dependencies
- @tanstack/react-query (5.90.7) - Server state management
- Shadcn UI components: Card, Badge, Button, Separator, Progress
- date-fns (latest) - Date formatting
- packages/utils/src/formatters.ts - formatCurrency utility

### API Response Structure
```typescript
{
  success: boolean
  data: {
    // Payment Plan fields
    id: string
    total_amount: number
    currency: string
    status: 'active' | 'completed' | 'cancelled'
    reference_number?: string
    notes?: string
    start_date: string
    commission_rate_percent: number
    expected_commission: number

    // Nested relationships
    enrollment: {
      id: string
      program?: string
      status: string
      student: {
        id: string
        first_name: string
        last_name: string
        email?: string
        phone?: string
      }
      branch: {
        id: string
        name: string
        college: {
          id: string
          name: string
        }
      }
    }

    // Installments (handled in Task 7)
    installments: Installment[]

    // Progress metrics
    progress: {
      total_paid: number
      installments_paid_count: number
    }
  }
}
```

### Relevant Documentation
- [docs/architecture.md - Payment Plans Detail](docs/architecture.md) - Detail view structure

## Manifest Update Instructions

1. Open `.bmad-ephemeral/stories/prompts/4-3/MANIFEST.md`
2. Update Task 5:
   - Status: Completed
   - Completed: [Current Date]
   - Notes: [Any relevant implementation notes]
3. Update Task 6:
   - Status: In Progress
   - Started: [Current Date]

## Implementation Approach

### Step 1: Create Server Component Page
```typescript
// apps/payments/app/plans/[id]/page.tsx
interface PageProps {
  params: Promise<{ id: string }>
}

export default async function PaymentPlanDetailPage({ params }: PageProps) {
  const { id } = await params

  return (
    <div className="container mx-auto py-8">
      <PaymentPlanDetail planId={id} />
    </div>
  )
}
```

### Step 2: Create Client Component with TanStack Query
```typescript
// apps/payments/app/plans/components/PaymentPlanDetail.tsx
'use client'

import { useQuery } from '@tanstack/react-query'

interface Props {
  planId: string
}

export function PaymentPlanDetail({ planId }: Props) {
  const { data, isLoading, error } = useQuery({
    queryKey: ['payment-plan', planId],
    queryFn: () => fetch(`/api/payment-plans/${planId}`).then(res => res.json()),
    staleTime: 2 * 60 * 1000, // 2 minutes
  })

  if (isLoading) return <DetailSkeleton />
  if (error) return <ErrorDisplay error={error} />
  if (!data?.success) return <NotFound />

  const plan = data.data

  return (
    <div className="space-y-6">
      <Breadcrumbs />
      <PlanOverviewSection plan={plan} />
      <StudentInformationSection student={plan.enrollment.student} />
      <EnrollmentDetailsSection enrollment={plan.enrollment} />
      <CommissionBreakdownSection plan={plan} />
      <PaymentProgressSection plan={plan} />
      <InstallmentsList installments={plan.installments} /> {/* Task 7 */}
      <ActionButtons planId={planId} />
    </div>
  )
}
```

### Step 3: Implement Information Sections

1. **Plan Overview Section**
   - Total amount (formatted currency)
   - Currency
   - Status badge
   - Reference number
   - Notes (if present)
   - Start date (formatted)
   - Use Card component

2. **Student Information Section**
   - Student name (linked to student profile)
   - Email (if present)
   - Phone (if present)
   - Link button: "View Student Profile"

3. **Enrollment Details Section**
   - College name
   - Branch name
   - Program (if present)
   - Enrollment status

4. **Commission Breakdown Section**
   - Commission rate (e.g., "5%")
   - Expected commission (formatted currency)
   - Calculation display: "5% of $10,000 = $500"

5. **Payment Progress Section**
   - Visual progress bar
   - Text: "5 of 12 installments paid"
   - Text: "$5,000 of $10,000 paid"
   - Use Shadcn Progress component

### Step 4: Breadcrumb Navigation
```typescript
<Breadcrumb>
  <BreadcrumbItem>
    <BreadcrumbLink href="/">Home</BreadcrumbLink>
  </BreadcrumbItem>
  <BreadcrumbItem>
    <BreadcrumbLink href="/payments/plans">Payment Plans</BreadcrumbLink>
  </BreadcrumbItem>
  <BreadcrumbItem>
    <BreadcrumbPage>{plan.reference_number || plan.id}</BreadcrumbPage>
  </BreadcrumbItem>
</Breadcrumb>
```

### Step 5: Action Buttons (Placeholders)
```typescript
<div className="flex gap-2">
  <Button variant="outline" disabled>
    Edit Plan
    <span className="text-xs text-muted-foreground ml-2">(Coming Soon)</span>
  </Button>
  <Button variant="destructive" disabled>
    Cancel Plan
    <span className="text-xs text-muted-foreground ml-2">(Coming Soon)</span>
  </Button>
</div>
```

Note: Edit and Cancel functionality will be implemented in future stories.

## Building on Previous Work

- Consume GET /api/payment-plans/[id] from Task 2
- Use PaymentPlanStatusBadge from Task 3
- Use formatCurrency from existing utilities
- Installments list integrated in Task 7

## Next Steps

After completing this task:
1. Update the manifest (Task 6 → Completed)
2. Move to `task-7-prompt.md` (Installments List Component)
3. Task 7 will add the installments table to the detail page

## Testing Checklist

- [ ] Test detail page renders at /payments/plans/[id]
- [ ] Test all sections display correct data
- [ ] Test currency formatting
- [ ] Test date formatting
- [ ] Test status badge displays
- [ ] Test progress bar calculation (visual and text)
- [ ] Test student name links to student profile
- [ ] Test breadcrumb navigation works
- [ ] Test 404 for non-existent plan ID
- [ ] Test loading skeleton shows while fetching
- [ ] Test error display for API errors
- [ ] Test RLS: user cannot view other agency's plan
- [ ] Test responsive layout (mobile and desktop)
