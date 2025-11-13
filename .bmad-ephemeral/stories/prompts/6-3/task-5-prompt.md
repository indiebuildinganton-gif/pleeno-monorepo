# Task 5: Add Summary Metrics

## Context
You are implementing **Story 6.3: Commission Breakdown by College** for the Pleeno agency management platform. This task adds summary metric cards above the commission breakdown table.

**Story Goal**: Enable Agency Admins to see commission breakdown by college/branch with tax details to identify valuable institutions and prioritize relationships.

**This Task**: Display aggregate summary cards showing total commissions, GST, combined amounts, and outstanding commission across all filtered results.

## Acceptance Criteria Coverage
This task addresses AC #1, #7:
- AC #1: Dashboard shows commission metrics
- AC #7: Tax calculations (GST) displayed separately and as combined totals

## Task Requirements

### Summary Cards Layout
Display 4 summary cards above the commission breakdown table:

```
┌──────────────────────────────────────────────────────────────────────────────┐
│ Commission Breakdown by College                                              │
├──────────────────────────────────────────────────────────────────────────────┤
│ ┌──────────────┐ ┌──────────────┐ ┌──────────────┐ ┌──────────────────────┐ │
│ │Total         │ │Total GST     │ │Total Amount  │ │Outstanding           │ │
│ │Commissions   │ │$12,345       │ │$135,790      │ │Commission            │ │
│ │Earned        │ │              │ │              │ │$45,600               │ │
│ │$123,445      │ │10%           │ │90% + 10%     │ │                      │ │
│ └──────────────┘ └──────────────┘ └──────────────┘ └──────────────────────┘ │
├──────────────────────────────────────────────────────────────────────────────┤
│ [Filter Controls]                                                            │
│ [Commission Breakdown Table]                                                 │
└──────────────────────────────────────────────────────────────────────────────┘
```

### Summary Card Specifications

#### 1. Total Commissions Earned
- **Calculation**: SUM(total_earned_commission) across all filtered rows
- **Display**: Large currency amount
- **Color**: Green text or green background
- **Subtitle**: "Total Commissions Earned" or "Commission Revenue"
- **Percentage**: X% of total (Commission / (Commission + GST) * 100)
- **Icon**: Dollar sign, trending up, or coins icon

#### 2. Total GST
- **Calculation**: SUM(total_gst) across all filtered rows
- **Display**: Large currency amount
- **Color**: Blue text or blue background
- **Subtitle**: "Total GST" or "Tax Amount"
- **Percentage**: Y% of total (GST / (Commission + GST) * 100)
- **Icon**: Receipt, tax, or percentage icon

#### 3. Total Amount (Commission + GST)
- **Calculation**: SUM(total_with_gst) across all filtered rows
- **Display**: Large currency amount
- **Color**: Neutral (gray, dark) or primary color
- **Subtitle**: "Total Amount" or "Commission + GST"
- **Percentage Breakdown**: "90% + 10%" or "Commission: X%, GST: Y%"
- **Icon**: Sum, total, or calculator icon

#### 4. Outstanding Commission
- **Calculation**: SUM(outstanding_commission) across all filtered rows
- **Display**: Large currency amount
- **Color**: Red text or red background (warning color)
- **Subtitle**: "Outstanding Commission" or "Unpaid"
- **Context**: Amount not yet received from colleges
- **Icon**: Clock, hourglass, or alert icon

### Data Calculation
Calculate totals from the commission breakdown data:

```typescript
const summaryMetrics = useMemo(() => {
  if (!commissionData?.data) {
    return {
      totalCommissions: 0,
      totalGST: 0,
      totalAmount: 0,
      outstandingCommission: 0,
      commissionPercentage: 0,
      gstPercentage: 0,
    }
  }

  const totalCommissions = commissionData.data.reduce(
    (sum, row) => sum + row.total_earned_commission,
    0
  )
  const totalGST = commissionData.data.reduce(
    (sum, row) => sum + row.total_gst,
    0
  )
  const totalAmount = totalCommissions + totalGST
  const outstandingCommission = commissionData.data.reduce(
    (sum, row) => sum + row.outstanding_commission,
    0
  )

  const commissionPercentage = totalAmount > 0
    ? (totalCommissions / totalAmount) * 100
    : 0
  const gstPercentage = totalAmount > 0
    ? (totalGST / totalAmount) * 100
    : 0

  return {
    totalCommissions,
    totalGST,
    totalAmount,
    outstandingCommission,
    commissionPercentage,
    gstPercentage,
  }
}, [commissionData])
```

### Component Structure

#### SummaryCard Component
Create a reusable `SummaryCard` component:

```typescript
interface SummaryCardProps {
  title: string
  value: string
  subtitle?: string
  icon?: React.ReactNode
  color: 'green' | 'blue' | 'gray' | 'red'
  percentage?: string
}

function SummaryCard({ title, value, subtitle, icon, color, percentage }: SummaryCardProps) {
  const colorClasses = {
    green: 'bg-green-50 text-green-700 border-green-200',
    blue: 'bg-blue-50 text-blue-700 border-blue-200',
    gray: 'bg-gray-50 text-gray-700 border-gray-200',
    red: 'bg-red-50 text-red-700 border-red-200',
  }

  return (
    <div className={`rounded-lg border p-4 ${colorClasses[color]}`}>
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-sm font-medium text-gray-600">{title}</h3>
        {icon && <div className="text-gray-400">{icon}</div>}
      </div>
      <div className="text-2xl font-bold">{value}</div>
      {subtitle && <div className="text-xs text-gray-500 mt-1">{subtitle}</div>}
      {percentage && <div className="text-xs font-medium mt-2">{percentage}</div>}
    </div>
  )
}
```

#### Summary Cards Grid
```typescript
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
  <SummaryCard
    title="Total Commissions Earned"
    value={formatCurrency(summaryMetrics.totalCommissions, agency.currency)}
    color="green"
    percentage={`${summaryMetrics.commissionPercentage.toFixed(1)}% of total`}
    icon={<DollarIcon className="h-5 w-5" />}
  />
  <SummaryCard
    title="Total GST"
    value={formatCurrency(summaryMetrics.totalGST, agency.currency)}
    color="blue"
    percentage={`${summaryMetrics.gstPercentage.toFixed(1)}% of total`}
    icon={<ReceiptTaxIcon className="h-5 w-5" />}
  />
  <SummaryCard
    title="Total Amount (Commission + GST)"
    value={formatCurrency(summaryMetrics.totalAmount, agency.currency)}
    color="gray"
    subtitle={`${summaryMetrics.commissionPercentage.toFixed(0)}% + ${summaryMetrics.gstPercentage.toFixed(0)}%`}
    icon={<CalculatorIcon className="h-5 w-5" />}
  />
  <SummaryCard
    title="Outstanding Commission"
    value={formatCurrency(summaryMetrics.outstandingCommission, agency.currency)}
    color="red"
    subtitle="Not yet received"
    icon={<ClockIcon className="h-5 w-5" />}
  />
</div>
```

## Responsive Design

### Desktop (lg+)
- 4 cards in a row (4 columns)
- Equal width cards

### Tablet (md)
- 2 cards per row (2 columns × 2 rows)
- Equal width cards

### Mobile (sm and below)
- 1 card per column (stacked vertically)
- Full width cards

### Grid Classes
```typescript
className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4"
```

## Visual Indicators

### Color Coding
- **Green**: Positive metrics (earned commission)
- **Blue**: Informational (GST, tax-related)
- **Gray/Neutral**: Totals, combined amounts
- **Red**: Warning/attention needed (outstanding amounts)

### Typography
- **Title**: Small text, medium font weight, gray color
- **Value**: Large text (2xl), bold font weight, color matches card theme
- **Subtitle**: Extra small text, gray color
- **Percentage**: Small text, medium font weight

### Icons
Use icons from an existing icon library (e.g., Heroicons, Lucide):
- Dollar/Currency icon for commissions
- Receipt/Tax icon for GST
- Calculator/Sum icon for total
- Clock/Hourglass icon for outstanding

## State Handling

### Loading State
When data is loading, show skeleton placeholders:
```typescript
{isLoading ? (
  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
    {[...Array(4)].map((_, i) => (
      <div key={i} className="h-32 bg-gray-200 rounded-lg animate-pulse" />
    ))}
  </div>
) : (
  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
    {/* Summary cards */}
  </div>
)}
```

### Empty State
When no data available (empty table), show zeros or placeholder:
```typescript
<SummaryCard
  title="Total Commissions Earned"
  value="$0.00"
  color="green"
  subtitle="No data available"
/>
```

### Dynamic Updates
Summary cards update automatically when:
- Filters change (period, college, branch)
- Table data refetches
- Because calculation is memoized based on `commissionData`

## Testing Requirements

### Component Tests Required
Add to: `apps/dashboard/__tests__/components/CommissionBreakdownTable.test.tsx`

**Test Cases**:
1. **Test summary cards render**
   - Verify 4 summary cards display
   - Verify titles are correct
   - Verify initial values (with mock data)

2. **Test summary calculations**
   - Mock commission data with known values
   - Verify Total Commissions = SUM(earned)
   - Verify Total GST = SUM(gst)
   - Verify Total Amount = Commissions + GST
   - Verify Outstanding = SUM(outstanding)

3. **Test percentage calculations**
   - Verify commission percentage = (commissions / total) * 100
   - Verify GST percentage = (gst / total) * 100
   - Verify percentages sum to 100%

4. **Test summary updates when filters change**
   - Apply filter (e.g., period=year)
   - Verify summary cards recalculate
   - Verify new totals reflect filtered data

5. **Test loading state**
   - Mock loading state
   - Verify skeleton placeholders display

6. **Test empty state**
   - Mock empty data response
   - Verify summary cards show $0.00 or placeholder

7. **Test responsive layout**
   - Test on different viewport sizes
   - Verify grid adjusts (4 → 2 → 1 columns)

8. **Test currency formatting**
   - Verify amounts formatted with correct currency symbol
   - Verify thousands separators and decimals

### Test Pattern
```typescript
import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import CommissionBreakdownTable from './CommissionBreakdownTable'

describe('CommissionBreakdownTable - Summary Metrics', () => {
  it('displays summary cards with correct totals', () => {
    const mockData = {
      data: [
        {
          total_earned_commission: 50000,
          total_gst: 5000,
          outstanding_commission: 10000,
          // ... other fields
        },
        {
          total_earned_commission: 30000,
          total_gst: 3000,
          outstanding_commission: 5000,
          // ... other fields
        },
      ],
    }

    render(<CommissionBreakdownTable />, {
      wrapper: createWrapperWithData(mockData),
    })

    // Total Commissions = 50000 + 30000 = 80000
    expect(screen.getByText('$80,000')).toBeInTheDocument()

    // Total GST = 5000 + 3000 = 8000
    expect(screen.getByText('$8,000')).toBeInTheDocument()

    // Total Amount = 80000 + 8000 = 88000
    expect(screen.getByText('$88,000')).toBeInTheDocument()

    // Outstanding = 10000 + 5000 = 15000
    expect(screen.getByText('$15,000')).toBeInTheDocument()
  })

  it('calculates percentages correctly', () => {
    // Mock data with 90% commission, 10% GST
    // Verify percentage displays
  })

  // ... more tests
})
```

## Dependencies
- `packages/utils/src/formatters.ts` - formatCurrency function (already used)
- Icon library (Heroicons, Lucide, or similar) - check project for existing
- Tailwind CSS - for styling

## Accessibility Considerations

### Semantic HTML
- Use heading tags for card titles (`<h3>` or appropriate level)
- Use `<div>` for card containers with proper ARIA if needed

### Screen Reader Support
- Ensure card titles are descriptive
- Values should be announced with context (e.g., "$123,445 total commissions earned")
- Consider `aria-label` for icons

### Color Contrast
- Ensure text meets WCAG AA contrast ratio (4.5:1 minimum)
- Don't rely solely on color to convey meaning (use text labels)

## Success Criteria
- [ ] 4 summary cards created above table
- [ ] Total Commissions Earned card displays correctly
- [ ] Total GST card displays correctly
- [ ] Total Amount card displays correctly
- [ ] Outstanding Commission card displays correctly
- [ ] All calculations accurate (sum of filtered rows)
- [ ] Percentage breakdowns display correctly
- [ ] Cards update when filters change
- [ ] Currency formatting applied to all amounts
- [ ] Color coding applied (green, blue, gray, red)
- [ ] Icons included in each card
- [ ] Responsive layout (4 → 2 → 1 columns)
- [ ] Loading state with skeleton placeholders
- [ ] Empty state handled gracefully
- [ ] Component tests written and passing

## Related Files
- Component: `apps/dashboard/app/components/CommissionBreakdownTable.tsx` (Task 2)
- Utility: `packages/utils/src/formatters.ts` (formatCurrency)
- Story file: `.bmad-ephemeral/stories/6-3-commission-breakdown-by-college.md`

## Next Steps
After completing this task, proceed to **Task 6: Add Widget Header and Controls** which will add the widget container and header.
