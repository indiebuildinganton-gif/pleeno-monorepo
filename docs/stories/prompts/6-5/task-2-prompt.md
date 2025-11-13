# Story 6-5: Overdue Payments Summary Widget - Task 2

## Story Context

**As an** Agency User
**I want** a dedicated widget highlighting all overdue payments
**So that** I can immediately focus on the most urgent follow-ups

## Task 2: Create OverduePaymentsWidget Component

**Acceptance Criteria**: #1-6

### Task Description

Create the main React component that displays overdue payments in a visually urgent manner with color-coded severity indicators, total summaries, and clickable navigation to payment plan details.

### Subtasks

- [ ] Create React component: `apps/dashboard/app/components/OverduePaymentsWidget.tsx`
- [ ] Use TanStack Query to fetch from `/api/dashboard/overdue-payments`
- [ ] Display prominent header:
  - Title: "Overdue Payments"
  - Badge with total count (red/urgent styling)
  - Total amount prominently displayed
- [ ] Display overdue payments table/list:
  - Columns: Student Name, College, Amount, Days Overdue
  - Sort by days overdue (most urgent first)
  - Use urgent visual styling (red accents, warning icons)
  - Clickable rows navigate to `/payments/plans/[plan_id]`
- [ ] Show days overdue with color coding:
  - 1-7 days: yellow/warning
  - 8-30 days: orange/alert
  - 30+ days: red/critical
- [ ] Format amounts as currency (use `formatCurrency` from utils)
- [ ] Responsive layout (table on desktop, cards on mobile)

## Context

### Key Constraints

- **Dashboard Zone Architecture**: Component must live in `apps/dashboard/app/components/`
- **Urgency-Based Styling**: Red/orange/yellow color coding by severity (30+ days red, 8-30 orange, 1-7 yellow)
- **Clickable Navigation**: Each overdue item navigates to `/payments/plans/[plan_id]`
- **TanStack Query**: Use for data fetching with `staleTime: 300000` (5 min), `refetchInterval: 300000`
- **Currency Formatting**: Use `formatCurrency()` utility from `packages/utils/src/formatters.ts`
- **Responsive Layout**: Table on desktop, cards on mobile

### Relevant Interfaces

**OverduePaymentsWidget Component**:
```typescript
export function OverduePaymentsWidget(): JSX.Element

// Props: None (fetches data internally via TanStack Query)

// Renders:
// - Prominent header with count badge and total amount
// - List/table of overdue payments
// - Empty state when no overdue payments
// - Loading skeleton
// - Error state with retry
```

**Path**: `apps/dashboard/app/components/OverduePaymentsWidget.tsx`

**useOverduePayments Hook**:
```typescript
function useOverduePayments(): UseQueryResult<OverduePaymentsResponse>

// Returns:
// - data: OverduePaymentsResponse
// - isLoading: boolean
// - error: Error | null
// - refetch: () => void

// Query Config:
// - queryKey: ['overdue-payments']
// - staleTime: 300000 (5 min)
// - refetchInterval: 300000 (5 min)
// - refetchOnWindowFocus: true
```

**Path**: `apps/dashboard/app/hooks/useOverduePayments.ts` (create this too)

### Component Structure Example

```typescript
// apps/dashboard/app/components/OverduePaymentsWidget.tsx

export function OverduePaymentsWidget() {
  const { data, isLoading, error, refetch } = useOverduePayments()

  if (isLoading) return <OverduePaymentsSkeleton />
  if (error) return <OverduePaymentsError onRetry={() => refetch()} />
  if (!data || data.total_count === 0) return <OverduePaymentsEmpty />

  return (
    <div className="border-2 border-red-500 rounded-lg p-4 bg-red-50">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-red-900">
          Overdue Payments
          <span className="ml-2 px-2 py-1 bg-red-600 text-white text-sm rounded-full">
            {data.total_count}
          </span>
        </h2>
        <div className="text-right">
          <p className="text-sm text-red-700">Total Overdue</p>
          <p className="text-2xl font-bold text-red-900">
            {formatCurrency(data.total_amount)}
          </p>
        </div>
      </div>

      <div className="space-y-2">
        {data.overdue_payments.map((payment) => (
          <OverduePaymentItem key={payment.id} payment={payment} />
        ))}
      </div>
    </div>
  )
}
```

**OverduePaymentItem Component**:
```typescript
function OverduePaymentItem({ payment }: { payment: OverduePayment }) {
  const urgencyColor = getUrgencyColor(payment.days_overdue)

  return (
    <Link
      href={`/payments/plans/${payment.payment_plan_id}`}
      className="block p-3 rounded-lg border hover:bg-white transition-colors"
    >
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <p className="font-medium">{payment.student_name}</p>
          <p className="text-sm text-muted-foreground">{payment.college_name}</p>
        </div>
        <div className="text-right">
          <p className="font-bold">{formatCurrency(payment.amount)}</p>
          <p className={`text-sm font-medium ${urgencyColor}`}>
            {payment.days_overdue} days overdue
          </p>
        </div>
      </div>
    </Link>
  )
}
```

**Urgency Color Helper**:
```typescript
function getUrgencyColor(days: number): string {
  if (days >= 30) return 'text-red-600'      // Critical
  if (days >= 8) return 'text-orange-600'    // Alert
  return 'text-yellow-600'                   // Warning
}

function getUrgencyBgColor(days: number): string {
  if (days >= 30) return 'bg-red-100 border-red-300'
  if (days >= 8) return 'bg-orange-100 border-orange-300'
  return 'bg-yellow-100 border-yellow-300'
}
```

### Dependencies

- **react** (18.x): React library
- **next** (15.x): Next.js Link component for navigation
- **@tanstack/react-query** (5.90.7): Server state management, caching, auto-refresh
- **tailwindcss** (4.x): Utility-first CSS framework
- **shadcn-ui** (latest): UI components (if using Card, Button, etc.)

### Reference Documentation

- [docs/architecture.md](../../architecture.md) - Dashboard Zone, State Management (TanStack Query)
- [docs/epics.md](../../epics.md) - Epic 6: Story 6.5
- [.bmad-ephemeral/stories/6-4-recent-activity-feed.md](../../../.bmad-ephemeral/stories/6-4-recent-activity-feed.md) - Activity feed patterns

## Implementation Guide

1. **Create the hook file** at `apps/dashboard/app/hooks/useOverduePayments.ts`:
   ```typescript
   export function useOverduePayments() {
     return useQuery({
       queryKey: ['overdue-payments'],
       queryFn: async () => {
         const res = await fetch('/api/dashboard/overdue-payments')
         if (!res.ok) throw new Error('Failed to fetch overdue payments')
         return res.json() as Promise<OverduePaymentsResponse>
       },
       staleTime: 300000, // 5 minutes
       refetchInterval: 300000, // Auto-refresh every 5 minutes
       refetchOnWindowFocus: true,
     })
   }
   ```

2. **Create the main widget component** at `apps/dashboard/app/components/OverduePaymentsWidget.tsx`

3. **Create helper components**:
   - `OverduePaymentItem` - Individual payment row
   - `OverduePaymentsSkeleton` - Loading state (Task 4 will detail this)
   - `OverduePaymentsError` - Error state (Task 4 will detail this)
   - `OverduePaymentsEmpty` - Empty state (Task 3 will detail this)

4. **Implement color coding logic**:
   - Create `getUrgencyColor()` helper
   - Apply to days overdue display

5. **Add responsive layout**:
   - Desktop: Table-like layout
   - Mobile: Card-based layout
   - Use Tailwind responsive classes

6. **Import and use `formatCurrency`** from `packages/utils/src/formatters.ts`

### Testing Approach

Create test cases to verify:
- Component renders with mock data
- Displays student name, college, amount, days overdue
- Sorting is correct (oldest overdue first)
- Clickable rows navigate to correct payment plan URL
- Total count badge shows correct number
- Total amount displays correctly formatted
- Color coding: yellow (1-7), orange (8-30), red (30+)
- Responsive layout works on mobile and desktop

## Next Steps

After completing this task:

1. **Update the manifest** at `docs/stories/prompts/6-5/manifest.md`:
   - Change Task 2 status to "Completed"
   - Add completion date
   - Add any relevant implementation notes

2. **Proceed to Task 3**: Open `task-3-prompt.md` to implement the empty state

3. **Verify**: Test the component in the browser to ensure it displays correctly with real API data

---

**Remember**: This is Task 2 of 7. Task 3 will add the empty state component, and Task 4 will add loading/error states.
