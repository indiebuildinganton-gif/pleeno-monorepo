# Story 6-2: Cash Flow Projection Chart - Task 6

## Story Context

**As an** Agency Admin
**I want** a visual chart showing projected cash flow for the next 90 days
**So that** I can anticipate incoming payments and plan accordingly

## Task 6: Add Widget Header and Controls

**Acceptance Criteria:** #1, 6

### Previous Task Completion

✅ Task 1: Cash Flow Projection API route created
✅ Task 2: CashFlowChart component with visualization
✅ Task 3: Interactive tooltip with student details
✅ Task 4: View toggle controls (Daily/Weekly/Monthly)
✅ Task 5: Real-time updates configured

The chart now updates automatically and responds to payment changes.

### Task Description

Wrap the chart in a complete widget container with a header, summary metrics, date range indicator, and refresh button. This creates a polished, dashboard-ready component.

### Subtasks

- [ ] Add widget container with header:
  - Title: "Cash Flow Projection (Next 90 Days)"
  - Refresh button (manual refetch)
  - View toggle buttons (Daily/Weekly/Monthly)
- [ ] Add summary metrics above chart:
  - Total Expected: ${sum of expected_amount}
  - Total Paid: ${sum of paid_amount}
  - Net Projection: ${total expected}
- [ ] Add date range indicator: "Jan 15 - Apr 15, 2025"
- [ ] Responsive layout (full width widget, stacks on mobile)

### Context

**Component Location:** `apps/dashboard/app/components/CashFlowChart.tsx`

**Widget Structure:**
```
┌─────────────────────────────────────────────┐
│ Cash Flow Projection (Next 90 Days)  [⟳]  │
│ Jan 15 - Apr 15, 2025                       │
│                                             │
│ ┌──────────┬──────────┬──────────┐         │
│ │Expected  │Paid      │Net       │         │
│ │$50,000   │$30,000   │$80,000   │         │
│ └──────────┴──────────┴──────────┘         │
│                                             │
│        [Daily] [Weekly] [Monthly]          │
│                                             │
│        [████████ CHART ████████]           │
│                                             │
└─────────────────────────────────────────────┘
```

### Related Documentation

- [docs/architecture.md](docs/architecture.md#dashboard-widgets) - Widget patterns
- [.bmad-ephemeral/stories/6-1-key-performance-indicators-kpis-widget-with-seasonal-and-market-insights.md](.bmad-ephemeral/stories/6-1-key-performance-indicators-kpis-widget-with-seasonal-and-market-insights.md) - KPI widget structure

---

## Update Manifest

Before coding, update `docs/stories/prompts/6-2/manifest.md`:

1. Mark Task 5 as "Completed" with today's date
2. Add notes about Task 5
3. Mark Task 6 as "In Progress" with today's date

---

## Implementation Steps

### 1. Restructure Component with Widget Container

Update `apps/dashboard/app/components/CashFlowChart.tsx`:

```typescript
'use client'

import { useQuery } from '@tanstack/react-query'
import { useDashboardStore } from '@/stores/dashboard-store'
import { formatCurrency } from '@/lib/utils/formatters'
import { format, addDays } from 'date-fns'
import { ResponsiveContainer, BarChart, /* ... */ } from 'recharts'

export default function CashFlowChart() {
  const { cashFlowView, setCashFlowView } = useDashboardStore()

  const { data, isLoading, error, isFetching, refetch } = useQuery({
    queryKey: ['cash-flow-projection', cashFlowView, 90],
    queryFn: async () => {
      const res = await fetch(`/api/dashboard/cash-flow-projection?groupBy=${cashFlowView}&days=90`)
      if (!res.ok) throw new Error('Failed to fetch cash flow projection')
      return res.json()
    },
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: true,
    refetchInterval: 5 * 60 * 1000,
  })

  const chartData = data?.data || []

  // Calculate summary metrics
  const totalExpected = chartData.reduce((sum, d) => sum + d.expected_amount, 0)
  const totalPaid = chartData.reduce((sum, d) => sum + d.paid_amount, 0)
  const netProjection = totalExpected + totalPaid

  // Calculate date range
  const today = new Date()
  const endDate = addDays(today, 90)
  const dateRange = `${format(today, 'MMM dd')} - ${format(endDate, 'MMM dd, yyyy')}`

  return (
    <div className="w-full bg-white rounded-lg shadow-lg p-6">
      {/* Header Section */}
      <div className="flex justify-between items-start mb-4">
        <div>
          <h2 className="text-xl font-bold text-gray-900">
            Cash Flow Projection (Next 90 Days)
          </h2>
          <p className="text-sm text-gray-600 mt-1">{dateRange}</p>
        </div>

        {/* Refresh Button */}
        <button
          onClick={() => refetch()}
          disabled={isFetching}
          className="p-2 rounded-lg hover:bg-gray-100 disabled:opacity-50 transition-colors"
          title="Refresh data"
        >
          <svg
            className={`w-5 h-5 text-gray-600 ${isFetching ? 'animate-spin' : ''}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
            />
          </svg>
        </button>
      </div>

      {/* Summary Metrics */}
      {!isLoading && !error && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-blue-50 rounded-lg p-4">
            <div className="text-sm text-blue-600 font-medium mb-1">Total Expected</div>
            <div className="text-2xl font-bold text-blue-900">
              {formatCurrency(totalExpected, 'AUD')}
            </div>
          </div>
          <div className="bg-green-50 rounded-lg p-4">
            <div className="text-sm text-green-600 font-medium mb-1">Total Paid</div>
            <div className="text-2xl font-bold text-green-900">
              {formatCurrency(totalPaid, 'AUD')}
            </div>
          </div>
          <div className="bg-purple-50 rounded-lg p-4">
            <div className="text-sm text-purple-600 font-medium mb-1">Net Projection</div>
            <div className="text-2xl font-bold text-purple-900">
              {formatCurrency(netProjection, 'AUD')}
            </div>
          </div>
        </div>
      )}

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

      {/* Loading State */}
      {isLoading && (
        <div className="w-full h-[400px] animate-pulse bg-gray-200 rounded-lg" />
      )}

      {/* Error State */}
      {error && (
        <div className="w-full p-8 text-center">
          <p className="text-red-600 mb-4">Unable to load cash flow projection</p>
          <button
            onClick={() => refetch()}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Try Again
          </button>
        </div>
      )}

      {/* Chart */}
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

### 2. Add Responsive Layout for Mobile

Update grid for mobile:

```typescript
{/* Summary Metrics - Responsive */}
<div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
  {/* Metrics cards */}
</div>

{/* View Toggle - Stack on mobile */}
<div className="flex flex-col sm:flex-row justify-end mb-4 space-y-2 sm:space-y-0 sm:space-x-2">
  {/* Toggle buttons */}
</div>
```

### 3. Add Empty State (No Data)

```typescript
{!isLoading && !error && chartData.length === 0 && (
  <div className="w-full p-12 text-center">
    <div className="text-gray-400 mb-4">
      <svg className="w-16 h-16 mx-auto" fill="currentColor" viewBox="0 0 20 20">
        <path d="M3 3a1 1 0 000 2v8a2 2 0 002 2h2.586l-1.293 1.293a1 1 0 101.414 1.414L10 15.414l2.293 2.293a1 1 0 001.414-1.414L12.414 15H15a2 2 0 002-2V5a1 1 0 100-2H3zm11.707 4.707a1 1 0 00-1.414-1.414L10 9.586 8.707 8.293a1 1 0 00-1.414 0l-2 2a1 1 0 101.414 1.414L8 10.414l1.293 1.293a1 1 0 001.414 0l4-4z" />
      </svg>
    </div>
    <p className="text-gray-600 mb-4">No upcoming payments scheduled in the next 90 days</p>
    <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
      Create Payment Plan
    </button>
  </div>
)}
```

---

## Next Steps

After completing Task 6:

1. **Update the manifest** - Mark Task 6 as completed, Task 7 as in progress
2. **Preview the widget** - Verify all elements display correctly
3. **Move to Task 7** - Open `task-7-prompt.md` to integrate into dashboard page

---

## Testing Checklist

- [ ] Widget container has rounded corners and shadow
- [ ] Header displays "Cash Flow Projection (Next 90 Days)"
- [ ] Date range shows correct dates (today to +90 days)
- [ ] Refresh button triggers manual refetch
- [ ] Refresh button shows spinning icon during refetch
- [ ] Summary metrics calculate correctly:
  - [ ] Total Expected sums all expected_amount values
  - [ ] Total Paid sums all paid_amount values
  - [ ] Net Projection = Expected + Paid
- [ ] Summary metrics have colored backgrounds (blue, green, purple)
- [ ] View toggle buttons positioned correctly (right side)
- [ ] Chart renders below summary metrics
- [ ] Empty state shows when no data
- [ ] Layout is responsive on mobile (metrics stack, buttons stack)
- [ ] All currency amounts formatted correctly

---

**Update the manifest, then add the widget header and controls!**
