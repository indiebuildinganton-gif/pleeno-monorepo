# Story 5-4: Payment Status Dashboard Widget - Task 3

## Story Context

**As an** Agency User
**I want** a dashboard widget showing payment status overview at a glance
**So that** I instantly know which payments need attention

---

## Task 3: Create PaymentStatusWidget Component

### Previous Tasks Completion

✅ **Task 1 Complete**: Dashboard page and layout infrastructure established
✅ **Task 2 Complete**: Payment Status Summary API endpoint created with caching and RLS

### Task Description

Build a React component that fetches payment status data from the API endpoint and displays four status cards with counts, totals, and color-coded visual indicators. The component should handle loading and error states gracefully.

### Subtasks

- [ ] Create React component: `apps/dashboard/app/components/PaymentStatusWidget.tsx`
- [ ] Use TanStack Query to fetch payment status summary from API
- [ ] Display four status cards with:
  - Count of installments
  - Total amount formatted as currency
  - Visual status indicator (color-coded)
- [ ] Use visual indicators:
  - Green for paid
  - Yellow/amber for due soon
  - Red for overdue
  - Gray/neutral for pending
- [ ] Style with Tailwind CSS and Shadcn UI components
- [ ] Add loading state while data fetches
- [ ] Add error state if query fails

### Acceptance Criteria

This task supports **AC #1-5**:
- AC #1: Widget displays payment status summary with count and total value for each status category
- AC #2: Widget displays count and total value of pending payments
- AC #3: Widget displays count and total value of due soon payments (next 7 days)
- AC #4: Widget displays count and total value of overdue payments
- AC #5: Widget displays count and total value of paid payments (this month)

---

## Context & Technical Details

### Component Interface

From [Story Context](../../.bmad-ephemeral/stories/5-4-payment-status-dashboard-widget.context.xml):

```typescript
// apps/dashboard/app/components/PaymentStatusWidget.tsx
export default function PaymentStatusWidget(): JSX.Element
// Props: none (fetches data internally via TanStack Query)
// Returns: Widget with 4 status cards (pending, due soon, overdue, paid)
```

### API Response Structure

The component will fetch from `/api/dashboard/payment-status-summary`:

```typescript
{
  success: true,
  data: {
    pending: { count: number, total_amount: number },
    due_soon: { count: number, total_amount: number },
    overdue: { count: number, total_amount: number },
    paid_this_month: { count: number, total_amount: number }
  }
}
```

### Visual Design Requirements

From [docs/PRD.md](../../PRD.md) and [docs/epics.md](../../epics.md):

- **Design Reference**: Stripe Dashboard (clean, data-rich, professional)
- **Color Coding**:
  - 🟢 Green for paid (success state)
  - 🟡 Yellow/amber for due soon (warning state)
  - 🔴 Red for overdue (error/urgent state)
  - ⚪ Gray/neutral for pending (neutral state)
- **Layout**: Four status cards in a grid layout
- **Visual Hierarchy**: Make KPIs prominent with clear labels

### State Management

From [docs/architecture.md](../../architecture.md):

- **TanStack Query**: Use for server state (payment status summary data)
- **Features**: Automatic caching, refetching on window focus, stale-while-revalidate
- **No Zustand needed**: This component doesn't require client-side state management

### Dependencies

- **Package**: `@tanstack/react-query` 5.90.7 - Server state management
- **Styling**: Tailwind CSS 4.x + Shadcn UI components
- **Framework**: Next.js 15.x with React Server Components (but this will be a Client Component)

---

## Implementation Steps

1. **Update Manifest**:
   - Read `docs/stories/prompts/5-4/manifest.md`
   - Update Task 2 status to "Completed" with date (if not already done)
   - Update Task 3 status to "In Progress" with current date

2. **Create Component File**:
   - Create: `apps/dashboard/app/components/PaymentStatusWidget.tsx`
   - Mark as Client Component with `'use client'` directive

3. **Set Up TanStack Query**:
   - Import `useQuery` from `@tanstack/react-query`
   - Create query function to fetch from `/api/dashboard/payment-status-summary`
   - Configure query key: `['payment-status-summary']`
   - Set appropriate stale time and cache time

4. **Implement Loading State**:
   - Show skeleton loaders or spinner while `isLoading`
   - Use Shadcn UI skeleton components for consistent UX
   - Maintain layout structure during loading

5. **Implement Error State**:
   - Handle `isError` state gracefully
   - Show user-friendly error message
   - Consider retry button or refresh option

6. **Build Status Cards**:
   - Create four cards in a responsive grid (2x2 on mobile, 4x1 on desktop)
   - Each card displays:
     - **Icon**: Status-specific icon with color coding
     - **Label**: "Pending", "Due Soon", "Overdue", "Paid This Month"
     - **Count**: Number of installments with label
     - **Total**: Currency-formatted total amount
   - Use Shadcn UI Card component for consistent styling

7. **Apply Color Coding**:
   - **Paid**: Green (`text-green-600`, `bg-green-50`, `border-green-200`)
   - **Due Soon**: Yellow/Amber (`text-amber-600`, `bg-amber-50`, `border-amber-200`)
   - **Overdue**: Red (`text-red-600`, `bg-red-50`, `border-red-200`)
   - **Pending**: Gray (`text-gray-600`, `bg-gray-50`, `border-gray-200`)

8. **Format Currency**:
   - Use JavaScript `Intl.NumberFormat` for currency formatting
   - Example: `new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount)`
   - Consider creating a utility function for reuse

9. **Make Cards Clickable** (Prepare for Task 4):
   - Wrap cards in button or link element
   - Add hover states for interactivity
   - Add cursor-pointer class
   - Note: Navigation logic will be added in Task 4

10. **Update Manifest**:
    - Mark Task 3 as "Completed" with completion date
    - Add implementation notes:
      - Component location
      - TanStack Query configuration used
      - UI library components used

---

## Code Example Structure

```typescript
// apps/dashboard/app/components/PaymentStatusWidget.tsx
'use client'

import { useQuery } from '@tanstack/react-query'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

interface PaymentStatus {
  count: number
  total_amount: number
}

interface PaymentStatusData {
  pending: PaymentStatus
  due_soon: PaymentStatus
  overdue: PaymentStatus
  paid_this_month: PaymentStatus
}

export default function PaymentStatusWidget() {
  const { data, isLoading, isError } = useQuery<{ success: boolean; data: PaymentStatusData }>({
    queryKey: ['payment-status-summary'],
    queryFn: async () => {
      const response = await fetch('/api/dashboard/payment-status-summary')
      if (!response.ok) throw new Error('Failed to fetch payment status')
      return response.json()
    },
    staleTime: 5 * 60 * 1000, // 5 minutes (matches API cache)
  })

  if (isLoading) {
    return <PaymentStatusSkeleton />
  }

  if (isError || !data?.success) {
    return <PaymentStatusError />
  }

  const statusData = data.data

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <StatusCard
        label="Pending"
        count={statusData.pending.count}
        amount={statusData.pending.total_amount}
        colorClass="gray"
      />
      <StatusCard
        label="Due Soon"
        count={statusData.due_soon.count}
        amount={statusData.due_soon.total_amount}
        colorClass="amber"
      />
      <StatusCard
        label="Overdue"
        count={statusData.overdue.count}
        amount={statusData.overdue.total_amount}
        colorClass="red"
      />
      <StatusCard
        label="Paid This Month"
        count={statusData.paid_this_month.count}
        amount={statusData.paid_this_month.total_amount}
        colorClass="green"
      />
    </div>
  )
}

function StatusCard({ label, count, amount, colorClass }: {
  label: string
  count: number
  amount: number
  colorClass: 'gray' | 'amber' | 'red' | 'green'
}) {
  // Implement card UI with Tailwind CSS and Shadcn components
  // Apply color-coded styling based on colorClass
  // Format amount as currency
  return (
    <Card className="cursor-pointer hover:shadow-md transition-shadow">
      {/* Card content */}
    </Card>
  )
}

function PaymentStatusSkeleton() {
  // Loading skeleton UI
  return <div>Loading...</div>
}

function PaymentStatusError() {
  // Error state UI
  return <div>Error loading payment status</div>
}
```

---

## Styling Guidelines

### Shadcn UI Components to Use

- `Card`, `CardContent`, `CardHeader`, `CardTitle` - For status cards
- `Skeleton` - For loading state
- `Alert`, `AlertDescription` - For error state

### Tailwind CSS Classes

**Card Base Styles**:
```css
className="cursor-pointer hover:shadow-md transition-shadow"
```

**Color Variants**:
- Green: `text-green-600 bg-green-50 border-green-200`
- Amber: `text-amber-600 bg-amber-50 border-amber-200`
- Red: `text-red-600 bg-red-50 border-red-200`
- Gray: `text-gray-600 bg-gray-50 border-gray-200`

**Responsive Grid**:
```css
className="grid gap-4 md:grid-cols-2 lg:grid-cols-4"
```

---

## Next Steps

After completing this task:

1. **Update the manifest file**:
   - Set Task 3 status to "Completed" with date
   - Add implementation notes about the component and TanStack Query setup

2. **Integrate Widget into Dashboard Page**:
   - Import `PaymentStatusWidget` into `apps/dashboard/app/page.tsx`
   - Add to dashboard page layout

3. **Proceed to Task 4**: Add Navigation to Payment Plans with Filters
   - Prompt file: `task-4-prompt.md`
   - This will make the status cards clickable and add navigation logic

---

## Reference Documents

- [docs/architecture.md](../../architecture.md) - State management patterns, UI components
- [docs/epics.md](../../epics.md) - Epic 5: Story 5.4 UI requirements
- [docs/PRD.md](../../PRD.md) - Dashboard design reference (Stripe Dashboard)
- [Story Context XML](.bmad-ephemeral/stories/5-4-payment-status-dashboard-widget.context.xml) - Complete technical specification
- [Manifest](manifest.md) - Track progress and implementation notes
