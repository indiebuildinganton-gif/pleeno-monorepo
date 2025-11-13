# Story 6-2: Cash Flow Projection Chart - Task 2

## Story Context

**As an** Agency Admin
**I want** a visual chart showing projected cash flow for the next 90 days
**So that** I can anticipate incoming payments and plan accordingly

## Task 2: Create CashFlowChart Component

**Acceptance Criteria:** #1, 3-6

### Previous Task Completion

✅ Task 1 completed: Cash Flow Projection API route created at `apps/dashboard/app/api/cash-flow-projection/route.ts`

The API now returns time series data with date buckets, paid amounts, expected amounts, and installment details.

### Task Description

Create the React component that visualizes cash flow data using Recharts. The component will fetch data from the API route (Task 1), render a stacked bar or area chart, and display paid vs expected payments.

### Subtasks

- [ ] Create React component: `apps/dashboard/app/components/CashFlowChart.tsx`
- [ ] Use TanStack Query to fetch cash flow data from `/api/dashboard/cash-flow-projection`
- [ ] Render chart using Recharts library (stacked bar chart or area chart)
- [ ] Configure chart axes:
  - X-axis: Date labels (format based on groupBy - "Jan 15", "Week 2", "Feb 2025")
  - Y-axis: Amount (formatted as currency using agency.currency)
- [ ] Display two data series:
  - **Paid** (green bars/area): Already received payments
  - **Expected** (blue bars/area): Pending installments
- [ ] Implement stacked visualization (paid on bottom, expected stacked on top)
- [ ] Add chart legend explaining color coding

### Context

**Architecture:**
- **Component at `apps/dashboard/app/components/CashFlowChart.tsx`** ← YOU ARE HERE
- API route already created: `apps/dashboard/app/api/cash-flow-projection/route.ts`
- Uses Recharts library for data visualization
- TanStack Query for server state (5-minute stale time)

**Key Patterns from Story 6.1:**
- Follow KPIWidget component pattern for structure
- TanStack Query caching configured with 5-minute stale time
- Recharts already used in SeasonalCommissionChart
- Currency formatting utility: `packages/utils/src/formatters.ts`
- Loading/error states: Use skeleton and error UI patterns

**Visualization Requirements:**
- Stacked bar chart or area chart
- Two data series: paid (green #10b981) and expected (blue #3b82f6)
- X-axis: Date labels formatted by groupBy
- Y-axis: Currency amounts formatted with agency.currency
- Legend showing color coding
- Responsive container (full width, height 400px)

**Data Format from API:**
```typescript
{
  success: boolean,
  data: Array<{
    date_bucket: string,  // ISO date
    paid_amount: number,
    expected_amount: number,
    installment_count: number,
    installments: Array<{
      student_name: string,
      amount: number,
      status: string,
      due_date: string
    }>
  }>
}
```

### Related Documentation

- [docs/architecture.md](docs/architecture.md#dashboard-zone) - Dashboard zone patterns
- [.bmad-ephemeral/stories/6-1-key-performance-indicators-kpis-widget-with-seasonal-and-market-insights.md](.bmad-ephemeral/stories/6-1-key-performance-indicators-kpis-widget-with-seasonal-and-market-insights.md) - KPI widget patterns

### Dependencies

Required packages (should already be installed):
- `@tanstack/react-query` v5.90.7 - Server state management
- `recharts` v3.3.0 - Chart library
- `date-fns` v4.1.0 - Date formatting

---

## Update Manifest

Before coding, update the manifest file:

**File:** `docs/stories/prompts/6-2/manifest.md`

**Updates:**
1. Mark Task 1 as "Completed" with today's date
2. Add notes about Task 1 (e.g., "API route created successfully")
3. Mark Task 2 as "In Progress" with today's date

---

## Implementation Steps

### 1. Create the Component File

Create `apps/dashboard/app/components/CashFlowChart.tsx`

### 2. Implement Basic Structure

```typescript
'use client'

import { useQuery } from '@tanstack/react-query'
import { ResponsiveContainer, BarChart, CartesianGrid, XAxis, YAxis, Tooltip, Legend, Bar } from 'recharts'
import { formatCurrency } from '@/lib/utils/formatters'
import { format } from 'date-fns'

interface CashFlowData {
  date_bucket: string
  paid_amount: number
  expected_amount: number
  installment_count: number
  installments: Array<{
    student_name: string
    amount: number
    status: string
    due_date: string
  }>
}

export default function CashFlowChart() {
  // 1. Fetch data using TanStack Query
  const { data, isLoading, error } = useQuery({
    queryKey: ['cash-flow-projection', 'week', 90],
    queryFn: async () => {
      const res = await fetch('/api/dashboard/cash-flow-projection?groupBy=week&days=90')
      if (!res.ok) throw new Error('Failed to fetch cash flow projection')
      return res.json()
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  })

  // 2. Handle loading and error states
  if (isLoading) return <div>Loading chart...</div>
  if (error) return <div>Error loading chart</div>

  const chartData = data?.data || []

  // 3. Render chart
  return (
    <div className="w-full">
      <ResponsiveContainer width="100%" height={400}>
        <BarChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis
            dataKey="date_bucket"
            tickFormatter={(date) => format(new Date(date), 'MMM dd')}
          />
          <YAxis
            tickFormatter={(value) => formatCurrency(value, 'AUD')}
          />
          <Tooltip />
          <Legend />
          <Bar
            dataKey="paid_amount"
            stackId="a"
            fill="#10b981"
            name="Paid"
          />
          <Bar
            dataKey="expected_amount"
            stackId="a"
            fill="#3b82f6"
            name="Expected"
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
```

### 3. Alternative: Area Chart

If you prefer a smoother visualization:

```typescript
import { AreaChart, Area } from 'recharts'

<ResponsiveContainer width="100%" height={400}>
  <AreaChart data={chartData}>
    <defs>
      <linearGradient id="colorPaid" x1="0" y1="0" x2="0" y2="1">
        <stop offset="5%" stopColor="#10b981" stopOpacity={0.8}/>
        <stop offset="95%" stopColor="#10b981" stopOpacity={0.2}/>
      </linearGradient>
      <linearGradient id="colorExpected" x1="0" y1="0" x2="0" y2="1">
        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8}/>
        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.2}/>
      </linearGradient>
    </defs>
    <CartesianGrid strokeDasharray="3 3" />
    <XAxis dataKey="date_bucket" tickFormatter={(date) => format(new Date(date), 'MMM dd')} />
    <YAxis tickFormatter={(value) => formatCurrency(value, 'AUD')} />
    <Tooltip />
    <Legend />
    <Area
      type="monotone"
      dataKey="paid_amount"
      stackId="1"
      stroke="#10b981"
      fill="url(#colorPaid)"
    />
    <Area
      type="monotone"
      dataKey="expected_amount"
      stackId="1"
      stroke="#3b82f6"
      fill="url(#colorExpected)"
    />
  </AreaChart>
</ResponsiveContainer>
```

### 4. Add Loading Skeleton

```typescript
if (isLoading) {
  return (
    <div className="w-full h-[400px] animate-pulse bg-gray-200 rounded-lg" />
  )
}
```

### 5. Add Error State with Retry

```typescript
if (error) {
  return (
    <div className="w-full p-8 text-center">
      <p className="text-red-600 mb-4">Unable to load cash flow projection</p>
      <button
        onClick={() => refetch()}
        className="px-4 py-2 bg-blue-500 text-white rounded"
      >
        Retry
      </button>
    </div>
  )
}
```

---

## Next Steps

After completing Task 2:

1. **Update the manifest** - Mark Task 2 as completed, Task 3 as in progress
2. **Test the component** - Verify chart renders with data from API
3. **Move to Task 3** - Open `task-3-prompt.md` to implement interactive tooltip

---

## Testing Checklist

- [ ] Component renders without errors
- [ ] Chart displays with correct data from API
- [ ] Two data series visible (paid in green, expected in blue)
- [ ] X-axis shows date labels
- [ ] Y-axis shows currency amounts
- [ ] Legend displays correctly
- [ ] Loading state shows skeleton
- [ ] Error state shows retry button
- [ ] Chart is responsive (full width)

---

**Start by updating the manifest, then create the CashFlowChart component!**
