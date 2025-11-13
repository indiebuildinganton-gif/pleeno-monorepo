# Story 5-4: Payment Status Dashboard Widget - Task 4

## Story Context

**As an** Agency User
**I want** a dashboard widget showing payment status overview at a glance
**So that** I instantly know which payments need attention

---

## Task 4: Add Navigation to Payment Plans with Filters

### Previous Tasks Completion

✅ **Task 1 Complete**: Dashboard infrastructure established
✅ **Task 2 Complete**: Payment Status Summary API endpoint created
✅ **Task 3 Complete**: PaymentStatusWidget component built with TanStack Query

### Task Description

Make each status card in the PaymentStatusWidget clickable to navigate to the payment plans page with appropriate filter parameters. This allows users to drill down from the summary view to see detailed lists of payments in each status category.

### Subtasks

- [ ] Make each status card clickable (Link or router navigation)
- [ ] Pass filter parameter to `/payments` route:
  - Pending: `/payments?status=pending`
  - Due Soon: `/payments?status=due_soon`
  - Overdue: `/payments?status=overdue`
  - Paid This Month: `/payments?status=paid&period=current_month`
- [ ] Ensure payments zone can receive and apply filter query parameters

### Acceptance Criteria

This task supports **AC #6**: Clicking any metric filters the payment plans list accordingly (navigates to /payments with appropriate filter)

---

## Context & Technical Details

### Navigation Requirements

From [docs/epics.md](../../epics.md):

Each status card must navigate to the `/payments` zone with specific query parameters:
- **Pending**: `/payments?status=pending`
- **Due Soon**: `/payments?status=due_soon`
- **Overdue**: `/payments?status=overdue`
- **Paid This Month**: `/payments?status=paid&period=current_month`

### Multi-Zone Architecture

From [docs/architecture.md](../../architecture.md):

- Dashboard widget is in `apps/dashboard/` zone
- Payments page is in `apps/payments/` zone (separate Next.js app)
- Shell app proxies both zones via `next.config.js` rewrites
- Navigation between zones uses standard Next.js Link component

### Implementation Approach

Two options for navigation:

1. **Next.js Link Component** (Recommended):
   - Use `<Link href="/payments?status=...">` from `next/link`
   - Handles client-side routing efficiently
   - Maintains SPA behavior

2. **useRouter Hook**:
   - Use `router.push('/payments?status=...')` from `next/navigation`
   - Programmatic navigation option
   - Useful if additional logic needed on click

---

## Implementation Steps

1. **Update Manifest**:
   - Read `docs/stories/prompts/5-4/manifest.md`
   - Update Task 3 status to "Completed" with date (if not already done)
   - Update Task 4 status to "In Progress" with current date

2. **Update PaymentStatusWidget Component**:
   - Open: `apps/dashboard/app/components/PaymentStatusWidget.tsx`
   - Import `Link` from `next/link`
   - Wrap each `StatusCard` in a `Link` component

3. **Add Navigation Props to StatusCard**:
   - Update `StatusCard` component to accept `href` prop
   - Pass appropriate filter URL for each status:
     - Pending: `/payments?status=pending`
     - Due Soon: `/payments?status=due_soon`
     - Overdue: `/payments?status=overdue`
     - Paid This Month: `/payments?status=paid&period=current_month`

4. **Enhance Card Interactivity**:
   - Ensure hover states are visible and intuitive
   - Add visual feedback (e.g., subtle scale transform on hover)
   - Consider adding an arrow icon to indicate clickability

5. **Verify Payments Zone Integration**:
   - Check if `apps/payments/` zone exists and can handle query parameters
   - If payments zone doesn't exist yet, document this as a future integration point
   - Add TODO comment or implementation note about payments zone coordination

6. **Test Navigation**:
   - Click each status card
   - Verify correct URL with query parameters
   - Ensure navigation works in both dev and production environments
   - Test back button navigation

7. **Update Manifest**:
   - Mark Task 4 as "Completed" with completion date
   - Add implementation notes:
     - Navigation approach used (Link vs router)
     - Query parameter formats
     - Any integration considerations with payments zone

---

## Code Example Structure

```typescript
// apps/dashboard/app/components/PaymentStatusWidget.tsx
'use client'

import { useQuery } from '@tanstack/react-query'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

// ... (existing interfaces)

export default function PaymentStatusWidget() {
  // ... (existing query logic)

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <StatusCard
        label="Pending"
        count={statusData.pending.count}
        amount={statusData.pending.total_amount}
        colorClass="gray"
        href="/payments?status=pending"
      />
      <StatusCard
        label="Due Soon"
        count={statusData.due_soon.count}
        amount={statusData.due_soon.total_amount}
        colorClass="amber"
        href="/payments?status=due_soon"
      />
      <StatusCard
        label="Overdue"
        count={statusData.overdue.count}
        amount={statusData.overdue.total_amount}
        colorClass="red"
        href="/payments?status=overdue"
      />
      <StatusCard
        label="Paid This Month"
        count={statusData.paid_this_month.count}
        amount={statusData.paid_this_month.total_amount}
        colorClass="green"
        href="/payments?status=paid&period=current_month"
      />
    </div>
  )
}

function StatusCard({
  label,
  count,
  amount,
  colorClass,
  href
}: {
  label: string
  count: number
  amount: number
  colorClass: 'gray' | 'amber' | 'red' | 'green'
  href: string
}) {
  return (
    <Link href={href}>
      <Card className="cursor-pointer hover:shadow-md hover:scale-[1.02] transition-all">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">
            {label}
          </CardTitle>
          {/* Optional: Add arrow icon to indicate clickability */}
          <ArrowRightIcon className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{count}</div>
          <p className="text-xs text-muted-foreground">
            {formatCurrency(amount)}
          </p>
        </CardContent>
      </Card>
    </Link>
  )
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(amount)
}
```

---

## Alternative: Programmatic Navigation

If you need to add analytics or additional logic on click:

```typescript
'use client'

import { useRouter } from 'next/navigation'

function StatusCard({ label, count, amount, colorClass, href }: StatusCardProps) {
  const router = useRouter()

  const handleClick = () => {
    // Add analytics or logging here
    console.log(`Navigating to ${href}`)

    // Navigate to payments with filter
    router.push(href)
  }

  return (
    <Card
      onClick={handleClick}
      className="cursor-pointer hover:shadow-md hover:scale-[1.02] transition-all"
    >
      {/* Card content */}
    </Card>
  )
}
```

---

## Integration Notes for Payments Zone

### Expected Behavior in Payments Zone

The payments zone (`apps/payments/`) should:

1. **Parse Query Parameters**:
   - Read `status` from query params
   - Read `period` from query params (if present)

2. **Filter Payment Plans**:
   - Apply filters to payment plans list
   - Update UI to show active filters
   - Allow users to clear or modify filters

3. **Example Implementation** (for payments zone):

```typescript
// apps/payments/app/page.tsx
'use client'

import { useSearchParams } from 'next/navigation'

export default function PaymentsPage() {
  const searchParams = useSearchParams()
  const status = searchParams.get('status')
  const period = searchParams.get('period')

  // Apply filters to payment plans query
  // ...
}
```

### Coordination with Payments Zone Team

If the payments zone is not yet implemented or doesn't handle filters:
- Document the expected filter parameters in the payments zone backlog
- Add integration testing as a future task
- Consider adding a user notification if filters aren't yet supported

---

## Next Steps

After completing this task:

1. **Update the manifest file**:
   - Set Task 4 status to "Completed" with date
   - Add implementation notes about navigation approach and integration

2. **Proceed to Task 5**: Testing
   - Prompt file: `task-5-prompt.md`
   - This will add comprehensive tests for the entire widget and API

---

## Reference Documents

- [docs/architecture.md](../../architecture.md) - Multi-zone navigation patterns
- [docs/epics.md](../../epics.md) - Epic 5: Story 5.4 navigation requirements
- [Story Context XML](.bmad-ephemeral/stories/5-4-payment-status-dashboard-widget.context.xml) - Complete technical specification
- [Manifest](manifest.md) - Track progress and implementation notes
