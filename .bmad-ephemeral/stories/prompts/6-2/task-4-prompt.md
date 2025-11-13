# Story 6-2: Cash Flow Projection Chart - Task 4

## Story Context

**As an** Agency Admin
**I want** a visual chart showing projected cash flow for the next 90 days
**So that** I can anticipate incoming payments and plan accordingly

## Task 4: Add View Toggle Controls

**Acceptance Criteria:** #6

### Previous Task Completion

✅ Task 1: Cash Flow Projection API route created
✅ Task 2: CashFlowChart component with visualization
✅ Task 3: Interactive tooltip with student details

The chart now displays data with an interactive tooltip showing detailed information.

### Task Description

Add toggle buttons that allow users to switch between daily, weekly, and monthly views. The selected view should be persisted in Zustand store and trigger a data refetch.

### Subtasks

- [ ] Add button group above chart: "Daily" | "Weekly" | "Monthly"
- [ ] Use Zustand store to persist selected view (dashboard-store)
- [ ] On toggle:
  - Update query parameter `groupBy` value
  - Refetch data via TanStack Query
  - Update chart with new grouping
- [ ] Default to "Weekly" view
- [ ] Highlight selected button (active state styling)

### Context

**Component Location:** `apps/dashboard/app/components/CashFlowChart.tsx`

**State Management:**
- Use Zustand dashboard-store to persist view selection
- Store location: `packages/stores/src/dashboard-store.ts`
- Add state: `cashFlowView: 'daily' | 'weekly' | 'monthly'`
- Add action: `setCashFlowView(view: 'daily' | 'weekly' | 'monthly'): void`

**Query Integration:**
- TanStack Query already fetching from `/api/dashboard/cash-flow-projection?groupBy={view}`
- Update queryKey to include groupBy parameter
- Changing view triggers automatic refetch

### Related Documentation

- [docs/architecture.md](docs/architecture.md#state-management) - Zustand patterns

---

## Update Manifest

Before coding, update `docs/stories/prompts/6-2/manifest.md`:

1. Mark Task 3 as "Completed" with today's date
2. Add notes about Task 3
3. Mark Task 4 as "In Progress" with today's date

---

## Implementation Steps

### 1. Update Zustand Dashboard Store

**File:** `packages/stores/src/dashboard-store.ts`

If this file doesn't exist, create it:

```typescript
import { create } from 'zustand'
import { persist } from 'zustand/middleware'

type GroupBy = 'daily' | 'weekly' | 'monthly'

interface DashboardStore {
  cashFlowView: GroupBy
  setCashFlowView: (view: GroupBy) => void
}

export const useDashboardStore = create<DashboardStore>()(
  persist(
    (set) => ({
      cashFlowView: 'weekly',
      setCashFlowView: (view) => set({ cashFlowView: view }),
    }),
    {
      name: 'dashboard-store',
    }
  )
)
```

If the file exists, add the new state and action:

```typescript
// Add to existing interface
interface DashboardStore {
  // ... existing state
  cashFlowView: 'daily' | 'weekly' | 'monthly'
  setCashFlowView: (view: 'daily' | 'weekly' | 'monthly') => void
}

// Add to store
export const useDashboardStore = create<DashboardStore>()(
  persist(
    (set) => ({
      // ... existing state
      cashFlowView: 'weekly',
      setCashFlowView: (view) => set({ cashFlowView: view }),
    }),
    {
      name: 'dashboard-store',
    }
  )
)
```

### 2. Update CashFlowChart Component

Add view toggle buttons and integrate with store:

```typescript
'use client'

import { useQuery } from '@tanstack/react-query'
import { useDashboardStore } from '@/stores/dashboard-store'
import { ResponsiveContainer, BarChart, /* ... */ } from 'recharts'

export default function CashFlowChart() {
  // Get view from Zustand store
  const { cashFlowView, setCashFlowView } = useDashboardStore()

  // Update query to use dynamic groupBy
  const { data, isLoading, error } = useQuery({
    queryKey: ['cash-flow-projection', cashFlowView, 90],
    queryFn: async () => {
      const res = await fetch(`/api/dashboard/cash-flow-projection?groupBy=${cashFlowView}&days=90`)
      if (!res.ok) throw new Error('Failed to fetch cash flow projection')
      return res.json()
    },
    staleTime: 5 * 60 * 1000,
  })

  const chartData = data?.data || []

  return (
    <div className="w-full">
      {/* View Toggle Buttons */}
      <div className="flex justify-end mb-4 space-x-2">
        <button
          onClick={() => setCashFlowView('daily')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            cashFlowView === 'daily'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          Daily
        </button>
        <button
          onClick={() => setCashFlowView('weekly')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            cashFlowView === 'weekly'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          Weekly
        </button>
        <button
          onClick={() => setCashFlowView('monthly')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            cashFlowView === 'monthly'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          Monthly
        </button>
      </div>

      {/* Chart */}
      {isLoading && <div className="w-full h-[400px] animate-pulse bg-gray-200 rounded-lg" />}

      {error && (
        <div className="w-full p-8 text-center">
          <p className="text-red-600 mb-4">Unable to load cash flow projection</p>
        </div>
      )}

      {!isLoading && !error && (
        <ResponsiveContainer width="100%" height={400}>
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date_bucket" tickFormatter={(date) => formatDateLabel(date, cashFlowView)} />
            <YAxis tickFormatter={(value) => formatCurrency(value, 'AUD')} />
            <Tooltip content={<CashFlowTooltip groupBy={cashFlowView} />} />
            <Legend />
            <Bar dataKey="paid_amount" stackId="a" fill="#10b981" name="Paid" />
            <Bar dataKey="expected_amount" stackId="a" fill="#3b82f6" name="Expected" />
          </BarChart>
        </ResponsiveContainer>
      )}
    </div>
  )
}
```

### 3. Add Date Formatting Based on View

Create helper function to format X-axis labels:

```typescript
import { format, parseISO } from 'date-fns'

function formatDateLabel(dateStr: string, groupBy: string) {
  const date = parseISO(dateStr)

  if (groupBy === 'daily') {
    return format(date, 'MMM dd')  // "Jan 15"
  } else if (groupBy === 'weekly') {
    const weekNum = Math.ceil(date.getDate() / 7)
    return `Week ${weekNum}`  // "Week 2"
  } else {
    return format(date, 'MMM yyyy')  // "Feb 2025"
  }
}
```

### 4. Optional: Add Loading State During View Change

Add a subtle loading indicator:

```typescript
const { data, isLoading, error, isFetching } = useQuery({ /* ... */ })

{/* Add indicator when refetching */}
{isFetching && !isLoading && (
  <div className="absolute top-2 right-2">
    <div className="animate-spin h-4 w-4 border-2 border-blue-600 border-t-transparent rounded-full" />
  </div>
)}
```

---

## Next Steps

After completing Task 4:

1. **Update the manifest** - Mark Task 4 as completed, Task 5 as in progress
2. **Test view toggling** - Click each button and verify chart updates
3. **Move to Task 5** - Open `task-5-prompt.md` to implement real-time updates

---

## Testing Checklist

- [ ] Three toggle buttons display: Daily, Weekly, Monthly
- [ ] Default view is "Weekly"
- [ ] Clicking "Daily" switches to daily view and refetches data
- [ ] Clicking "Monthly" switches to monthly view and refetches data
- [ ] Active button has blue background (highlighted)
- [ ] Inactive buttons have gray background
- [ ] Chart X-axis labels update based on view (daily: "Jan 15", weekly: "Week 2", monthly: "Feb 2025")
- [ ] Tooltip dateRange updates based on view
- [ ] View selection persists after page refresh (Zustand persist)
- [ ] Loading indicator shows during refetch (optional)

---

**Update the manifest, then add the view toggle controls!**
