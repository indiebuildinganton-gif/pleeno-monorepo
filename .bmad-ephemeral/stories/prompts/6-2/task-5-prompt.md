# Story 6-2: Cash Flow Projection Chart - Task 5

## Story Context

**As an** Agency Admin
**I want** a visual chart showing projected cash flow for the next 90 days
**So that** I can anticipate incoming payments and plan accordingly

## Task 5: Implement Real-Time Updates

**Acceptance Criteria:** #5

### Previous Task Completion

✅ Task 1: Cash Flow Projection API route created
✅ Task 2: CashFlowChart component with visualization
✅ Task 3: Interactive tooltip with student details
✅ Task 4: View toggle controls (Daily/Weekly/Monthly)

The chart now allows users to switch between different time views.

### Task Description

Configure the chart to update in real-time as payments are recorded. This includes automatic refetching on window focus, background polling, and cache invalidation when payments are created.

### Subtasks

- [ ] Configure TanStack Query to refetch on:
  - Window focus (user returns to dashboard)
  - Background refetch every 5 minutes
  - Manual refetch when user records payment (via mutation callback)
- [ ] Use Supabase Realtime subscription (optional enhancement):
  - Subscribe to installments table changes
  - Filter by agency_id and date range
  - Invalidate query cache on insert/update
- [ ] Add visual indicator when data is being updated (loading spinner in corner)

### Context

**Component Location:** `apps/dashboard/app/components/CashFlowChart.tsx`

**TanStack Query Configuration:**
- Already configured with 5-minute stale time
- Need to add: refetchOnWindowFocus, refetchInterval
- Need to integrate with payment recording mutations

**Supabase Realtime (Optional):**
- Subscribe to `installments` table changes
- Filter by `agency_id` and date range
- Automatically invalidate cache on changes

### Related Documentation

- [docs/architecture.md](docs/architecture.md#real-time-updates) - Real-time patterns
- TanStack Query refetch documentation
- Supabase Realtime documentation

---

## Update Manifest

Before coding, update `docs/stories/prompts/6-2/manifest.md`:

1. Mark Task 4 as "Completed" with today's date
2. Add notes about Task 4
3. Mark Task 5 as "In Progress" with today's date

---

## Implementation Steps

### 1. Update TanStack Query Configuration

Add automatic refetch settings:

```typescript
const { data, isLoading, error, isFetching } = useQuery({
  queryKey: ['cash-flow-projection', cashFlowView, 90],
  queryFn: async () => {
    const res = await fetch(`/api/dashboard/cash-flow-projection?groupBy=${cashFlowView}&days=90`)
    if (!res.ok) throw new Error('Failed to fetch cash flow projection')
    return res.json()
  },
  staleTime: 5 * 60 * 1000,              // 5 minutes
  refetchOnWindowFocus: true,             // ← NEW: Refetch when user returns
  refetchInterval: 5 * 60 * 1000,         // ← NEW: Background refetch every 5 minutes
})
```

### 2. Add Visual Indicator for Updates

Show a subtle loading indicator when data is being updated:

```typescript
return (
  <div className="w-full relative">
    {/* Loading Indicator (top-right corner) */}
    {isFetching && !isLoading && (
      <div className="absolute top-0 right-0 z-10">
        <div className="flex items-center space-x-2 bg-blue-50 px-3 py-1 rounded-lg">
          <div className="animate-spin h-3 w-3 border-2 border-blue-600 border-t-transparent rounded-full" />
          <span className="text-xs text-blue-600">Updating...</span>
        </div>
      </div>
    )}

    {/* View Toggle Buttons */}
    <div className="flex justify-end mb-4 space-x-2">
      {/* ... toggle buttons ... */}
    </div>

    {/* Chart */}
    {/* ... chart ... */}
  </div>
)
```

### 3. Integrate with Payment Recording Mutation

If there's a payment recording mutation in the app, integrate it:

```typescript
// Example: In payment recording component
import { useMutation, useQueryClient } from '@tanstack/react-query'

function PaymentRecordingComponent() {
  const queryClient = useQueryClient()

  const recordPaymentMutation = useMutation({
    mutationFn: async (paymentData) => {
      const res = await fetch('/api/payments', {
        method: 'POST',
        body: JSON.stringify(paymentData),
      })
      return res.json()
    },
    onSuccess: () => {
      // Invalidate cash flow query to trigger refetch
      queryClient.invalidateQueries({ queryKey: ['cash-flow-projection'] })
    },
  })

  return (
    // ... payment form ...
  )
}
```

**Note:** You may need to find where payment recording happens in the codebase and add this invalidation.

### 4. Optional: Add Supabase Realtime Subscription

For live updates without polling:

```typescript
'use client'

import { useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useQueryClient } from '@tanstack/react-query'

export default function CashFlowChart() {
  const queryClient = useQueryClient()
  const { cashFlowView, setCashFlowView } = useDashboardStore()

  // Get current agency_id (you'll need to fetch this)
  const { data: agency } = useQuery({
    queryKey: ['agency'],
    queryFn: async () => {
      const res = await fetch('/api/agency')
      return res.json()
    }
  })

  // Set up Realtime subscription
  useEffect(() => {
    if (!agency?.id) return

    const supabase = createClient()

    const channel = supabase
      .channel('cash-flow-updates')
      .on(
        'postgres_changes',
        {
          event: '*',  // Listen to INSERT, UPDATE, DELETE
          schema: 'public',
          table: 'installments',
          filter: `agency_id=eq.${agency.id}`,
        },
        (payload) => {
          console.log('Installment changed:', payload)
          // Invalidate query to trigger refetch
          queryClient.invalidateQueries({ queryKey: ['cash-flow-projection'] })
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [agency?.id, queryClient])

  // ... rest of component ...
}
```

### 5. Add Manual Refresh Button (Optional)

Add a manual refresh button for users:

```typescript
const { refetch } = useQuery({ /* ... */ })

<div className="flex justify-between items-center mb-4">
  <button
    onClick={() => refetch()}
    disabled={isFetching}
    className="px-3 py-1 text-sm bg-gray-100 hover:bg-gray-200 rounded-lg disabled:opacity-50"
  >
    {isFetching ? 'Refreshing...' : 'Refresh'}
  </button>

  <div className="flex space-x-2">
    {/* View toggle buttons */}
  </div>
</div>
```

---

## Next Steps

After completing Task 5:

1. **Update the manifest** - Mark Task 5 as completed, Task 6 as in progress
2. **Test real-time updates:**
   - Leave dashboard open, switch tabs, return → chart should refetch
   - Wait 5 minutes → chart should refetch
   - Record a payment (if possible) → chart should update
3. **Move to Task 6** - Open `task-6-prompt.md` to add widget header and controls

---

## Testing Checklist

- [ ] Chart refetches when switching back to browser tab (window focus)
- [ ] Chart refetches automatically every 5 minutes (background polling)
- [ ] Loading indicator shows in corner during refetch
- [ ] Loading indicator disappears after refetch completes
- [ ] Manual refresh button triggers refetch (if added)
- [ ] Supabase Realtime subscription works (if implemented)
  - [ ] Recording payment triggers cache invalidation
  - [ ] Chart updates with new data
  - [ ] Subscription cleaned up on component unmount
- [ ] No console errors during refetching
- [ ] Chart doesn't flicker or jump during background updates

---

**Update the manifest, then implement real-time updates!**
