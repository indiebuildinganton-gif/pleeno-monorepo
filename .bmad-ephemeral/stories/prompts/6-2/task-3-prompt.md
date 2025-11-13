# Story 6-2: Cash Flow Projection Chart - Task 3

## Story Context

**As an** Agency Admin
**I want** a visual chart showing projected cash flow for the next 90 days
**So that** I can anticipate incoming payments and plan accordingly

## Task 3: Implement Interactive Tooltip

**Acceptance Criteria:** #4

### Previous Task Completion

✅ Task 1: Cash Flow Projection API route created
✅ Task 2: CashFlowChart component created with basic visualization

The chart now displays paid vs expected payments in a stacked visualization.

### Task Description

Enhance the chart with an interactive tooltip that displays detailed information when users hover over chart points, including date range, amounts, and a list of students.

### Subtasks

- [ ] Configure Recharts CustomTooltip component
- [ ] Display on hover for each date bucket:
  - Date range (e.g., "Jan 15-21, 2025" for weekly view)
  - Total Expected: ${amount}
  - Total Paid: ${amount}
  - Total for Period: ${expected + paid}
  - Number of Installments: {count}
- [ ] Show list of students in that period (limit to top 5 if > 5):
  - Student Name - ${amount} ({status})
  - "...and {n} more" if exceeds 5
- [ ] Format amounts using agency currency
- [ ] Handle empty buckets (no data for that period)

### Context

**Component Location:** `apps/dashboard/app/components/CashFlowChart.tsx`

**Data Structure Available in Tooltip:**
```typescript
{
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
}
```

**Tooltip Requirements:**
- Show date range formatted by groupBy (daily, weekly, monthly)
- Show total expected, paid, and combined amounts
- Show count of installments
- List up to 5 students with names, amounts, and status
- If more than 5 students, show "...and N more"
- Format all amounts with agency currency
- Handle cases where no installments exist in bucket

### Related Documentation

- [docs/architecture.md](docs/architecture.md#date-handling) - Date formatting patterns
- Recharts CustomTooltip documentation

---

## Update Manifest

Before coding, update `docs/stories/prompts/6-2/manifest.md`:

1. Mark Task 2 as "Completed" with today's date
2. Add notes about Task 2
3. Mark Task 3 as "In Progress" with today's date

---

## Implementation Steps

### 1. Create Custom Tooltip Component

Add to `apps/dashboard/app/components/CashFlowChart.tsx` or create separate file:

```typescript
import { formatCurrency } from '@/lib/utils/formatters'
import { format, parseISO } from 'date-fns'

interface CashFlowTooltipProps {
  active?: boolean
  payload?: Array<{
    payload: CashFlowData
  }>
  groupBy?: 'day' | 'week' | 'month'
}

function CashFlowTooltip({ active, payload, groupBy = 'week' }: CashFlowTooltipProps) {
  if (!active || !payload || payload.length === 0) return null

  const data = payload[0].payload
  const { date_bucket, paid_amount, expected_amount, installment_count, installments } = data

  // Format date range based on groupBy
  const formatDateRange = (dateStr: string, groupBy: string) => {
    const date = parseISO(dateStr)
    if (groupBy === 'day') {
      return format(date, 'MMM dd, yyyy')
    } else if (groupBy === 'week') {
      // Show week range (e.g., "Jan 15-21, 2025")
      const weekEnd = new Date(date)
      weekEnd.setDate(date.getDate() + 6)
      return `${format(date, 'MMM dd')}-${format(weekEnd, 'dd, yyyy')}`
    } else {
      // Monthly
      return format(date, 'MMMM yyyy')
    }
  }

  const totalAmount = paid_amount + expected_amount
  const displayInstallments = installments?.slice(0, 5) || []
  const remainingCount = (installments?.length || 0) - 5

  return (
    <div className="bg-white p-4 rounded-lg shadow-lg border border-gray-200 max-w-sm">
      {/* Date Range */}
      <div className="font-semibold text-gray-900 mb-2">
        {formatDateRange(date_bucket, groupBy)}
      </div>

      {/* Amounts */}
      <div className="space-y-1 mb-3 text-sm">
        <div className="flex justify-between">
          <span className="text-gray-600">Total Expected:</span>
          <span className="font-medium text-blue-600">
            {formatCurrency(expected_amount, 'AUD')}
          </span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-600">Total Paid:</span>
          <span className="font-medium text-green-600">
            {formatCurrency(paid_amount, 'AUD')}
          </span>
        </div>
        <div className="flex justify-between border-t pt-1">
          <span className="text-gray-900 font-medium">Total for Period:</span>
          <span className="font-bold text-gray-900">
            {formatCurrency(totalAmount, 'AUD')}
          </span>
        </div>
      </div>

      {/* Installment Count */}
      <div className="text-sm text-gray-600 mb-2">
        {installment_count} {installment_count === 1 ? 'installment' : 'installments'}
      </div>

      {/* Student List */}
      {displayInstallments.length > 0 && (
        <div className="border-t pt-2">
          <div className="text-xs font-medium text-gray-700 mb-1">Students:</div>
          <div className="space-y-1">
            {displayInstallments.map((inst, idx) => (
              <div key={idx} className="text-xs text-gray-600 flex justify-between">
                <span className="truncate mr-2">{inst.student_name}</span>
                <span className="whitespace-nowrap">
                  {formatCurrency(inst.amount, 'AUD')}
                  <span className={`ml-1 ${inst.status === 'paid' ? 'text-green-600' : 'text-blue-600'}`}>
                    ({inst.status})
                  </span>
                </span>
              </div>
            ))}
            {remainingCount > 0 && (
              <div className="text-xs text-gray-500 italic">
                ...and {remainingCount} more
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
```

### 2. Integrate Tooltip into Chart

Update the chart component:

```typescript
<ResponsiveContainer width="100%" height={400}>
  <BarChart data={chartData}>
    <CartesianGrid strokeDasharray="3 3" />
    <XAxis dataKey="date_bucket" tickFormatter={(date) => format(new Date(date), 'MMM dd')} />
    <YAxis tickFormatter={(value) => formatCurrency(value, 'AUD')} />

    {/* Replace default Tooltip with CustomTooltip */}
    <Tooltip content={<CashFlowTooltip groupBy="week" />} />

    <Legend />
    <Bar dataKey="paid_amount" stackId="a" fill="#10b981" name="Paid" />
    <Bar dataKey="expected_amount" stackId="a" fill="#3b82f6" name="Expected" />
  </BarChart>
</ResponsiveContainer>
```

### 3. Handle Empty Buckets

Add check in tooltip:

```typescript
if (!active || !payload || payload.length === 0) return null

const data = payload[0].payload

// Handle empty bucket
if (!data.installments || data.installments.length === 0) {
  return (
    <div className="bg-white p-4 rounded-lg shadow-lg border border-gray-200">
      <div className="text-sm text-gray-600">No installments in this period</div>
    </div>
  )
}
```

### 4. Get Agency Currency Dynamically

Update to use actual agency currency instead of hardcoded 'AUD':

```typescript
// In parent component, fetch agency data
const { data: agency } = useQuery({
  queryKey: ['agency'],
  queryFn: async () => {
    const res = await fetch('/api/agency')
    return res.json()
  }
})

// Pass currency to tooltip
<Tooltip content={<CashFlowTooltip groupBy="week" currency={agency?.currency || 'AUD'} />} />
```

---

## Next Steps

After completing Task 3:

1. **Update the manifest** - Mark Task 3 as completed, Task 4 as in progress
2. **Test the tooltip** - Hover over chart bars and verify all information displays correctly
3. **Move to Task 4** - Open `task-4-prompt.md` to add view toggle controls

---

## Testing Checklist

- [ ] Tooltip appears when hovering over chart bars
- [ ] Date range displays correctly for weekly grouping
- [ ] Expected amount shows in blue
- [ ] Paid amount shows in green
- [ ] Total for period calculates correctly
- [ ] Installment count displays correctly
- [ ] Student list shows up to 5 students
- [ ] "...and N more" shows when more than 5 students
- [ ] Amounts formatted with correct currency
- [ ] Empty buckets handled gracefully
- [ ] Tooltip disappears when hover ends

---

**Update the manifest, then implement the interactive tooltip!**
