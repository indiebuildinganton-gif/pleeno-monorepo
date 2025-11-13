# Task 2: Create CommissionBreakdownTable Component

## Context
You are implementing **Story 6.3: Commission Breakdown by College** for the Pleeno agency management platform. This task creates the main React table component that displays commission data.

**Story Goal**: Enable Agency Admins to see commission breakdown by college/branch with tax details to identify valuable institutions and prioritize relationships.

**This Task**: Create a sortable, interactive data table using TanStack Table that displays commission breakdown data.

## Acceptance Criteria Coverage
This task addresses AC #1, #2, #3, #6, #7:
- AC #1: Dashboard shows commission earned per college/branch
- AC #2: Each row shows all required columns (college, branch, commissions, GST, totals, expected/earned/outstanding)
- AC #3: List is sortable by any column
- AC #6: Widget highlights top-performing colleges
- AC #7: Tax calculations (GST) displayed separately and combined

## Task Requirements

### Component Specification
- **Component Name**: `CommissionBreakdownTable`
- **Location**: `apps/dashboard/app/components/CommissionBreakdownTable.tsx`
- **Library**: TanStack Table (headless table library)

### Data Fetching
- Use **TanStack Query** to fetch data from `/api/dashboard/commission-by-college`
- Query key pattern: `['commission-breakdown', filters]`
- Stale time: 5 minutes (300000ms)
- Background refetch on window focus enabled

### Table Columns
Display these columns in order:

1. **College** (text, sortable)
   - Display: College name
   - Clickable link to college detail page
   - Sort key: `college_name`

2. **Branch** (text, sortable)
   - Display: Branch name + city (e.g., "Sydney Campus (Sydney)")
   - Clickable link to college detail with branch filter
   - Sort key: `branch_name`

3. **Total Commissions** (currency, sortable)
   - Display: Commission amount (excluding GST)
   - Format using `formatCurrency(amount, currency)`
   - Sort key: `total_commissions`

4. **Total GST** (currency, sortable)
   - Display: GST amount
   - Format using `formatCurrency(amount, currency)`
   - Blue text or icon to distinguish from commission
   - Sort key: `total_gst`

5. **Total (Commission + GST)** (currency, sortable)
   - Display: Combined total
   - Bold/emphasized styling
   - Format using `formatCurrency(amount, currency)`
   - Sort key: `total_with_gst`

6. **Expected** (currency, sortable)
   - Display: Total expected commission
   - Format using `formatCurrency(amount, currency)`
   - Sort key: `total_expected_commission`

7. **Earned** (currency, sortable)
   - Display: Total earned commission
   - Green text and medium font weight
   - Format using `formatCurrency(amount, currency)`
   - Sort key: `total_earned_commission`

8. **Outstanding** (currency, sortable)
   - Display: Outstanding commission
   - Red text if > 0, green text if = 0
   - Format using `formatCurrency(amount, currency)`
   - Sort key: `outstanding_commission`

### Column Sorting
- **Default sort**: Earned commission DESC (highest earners first)
- **Click column header** to toggle sort ASC/DESC
- **Visual indicator**: Arrow icon showing current sort column and direction
  - ↑ for ascending
  - ↓ for descending
- Only one column sorted at a time (single-column sorting)

### Currency Formatting
Use the `formatCurrency()` utility from `packages/utils/src/formatters.ts`:
```typescript
formatCurrency(amount: number, currency: string): string
// Example: formatCurrency(1234.56, 'AUD') => "$1,234.56"
```

Get agency currency from context/store.

### Top Performer Highlighting
- **Identify top 3 performers**: Colleges with highest `total_earned_commission`
- **Visual indicator**: Badge or background color for top 3
  - 1st place: Gold badge/color
  - 2nd place: Silver badge/color
  - 3rd place: Bronze badge/color
- Display rank visually (e.g., "🥇", "🥈", "🥉" or "1st", "2nd", "3rd")

### GST Display Styling
- GST column should be visually distinct (blue text or icon)
- Tooltip on GST column header explaining inclusive vs exclusive calculation
- Combined total (Commission + GST) should be emphasized (bold)

## Component Structure

### TypeScript Interfaces
```typescript
interface CommissionBreakdown {
  college_id: string
  college_name: string
  branch_id: string
  branch_name: string
  branch_city: string
  total_commissions: number
  total_gst: number
  total_with_gst: number
  total_expected_commission: number
  total_earned_commission: number
  outstanding_commission: number
  payment_plan_count: number
}

interface CommissionBreakdownTableProps {
  filters?: {
    period?: 'all' | 'year' | 'quarter' | 'month'
    college_id?: string
    branch_id?: string
  }
}
```

### TanStack Query Hook
```typescript
import { useQuery } from '@tanstack/react-query'

function useCommissionBreakdown(filters: CommissionFilters) {
  return useQuery({
    queryKey: ['commission-breakdown', filters],
    queryFn: async () => {
      const params = new URLSearchParams()
      if (filters.period) params.set('period', filters.period)
      if (filters.college_id) params.set('college_id', filters.college_id)
      if (filters.branch_id) params.set('branch_id', filters.branch_id)

      const response = await fetch(`/api/dashboard/commission-by-college?${params}`)
      if (!response.ok) throw new Error('Failed to fetch commission breakdown')
      return response.json()
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: true,
  })
}
```

### TanStack Table Configuration
```typescript
import { useReactTable, getCoreRowModel, getSortedRowModel, ColumnDef } from '@tanstack/react-table'

const columns: ColumnDef<CommissionBreakdown>[] = [
  {
    accessorKey: 'college_name',
    header: 'College',
    cell: ({ row }) => (
      <Link
        href={`/entities/colleges/${row.original.college_id}`}
        className="text-blue-600 hover:underline"
      >
        {row.original.college_name}
      </Link>
    ),
  },
  {
    accessorKey: 'branch_name',
    header: 'Branch',
    cell: ({ row }) => (
      <Link
        href={`/entities/colleges/${row.original.college_id}?branch=${row.original.branch_id}`}
        className="text-blue-600 hover:underline"
      >
        {row.original.branch_name} ({row.original.branch_city})
      </Link>
    ),
  },
  {
    accessorKey: 'total_commissions',
    header: 'Total Commissions',
    cell: ({ row }) => formatCurrency(row.original.total_commissions, agency.currency),
  },
  {
    accessorKey: 'total_gst',
    header: 'Total GST',
    cell: ({ row }) => (
      <span className="text-blue-600">
        {formatCurrency(row.original.total_gst, agency.currency)}
      </span>
    ),
  },
  {
    accessorKey: 'total_with_gst',
    header: 'Total (Commission + GST)',
    cell: ({ row }) => (
      <span className="font-semibold">
        {formatCurrency(row.original.total_with_gst, agency.currency)}
      </span>
    ),
  },
  {
    accessorKey: 'total_expected_commission',
    header: 'Expected',
    cell: ({ row }) => formatCurrency(row.original.total_expected_commission, agency.currency),
  },
  {
    accessorKey: 'total_earned_commission',
    header: 'Earned',
    cell: ({ row }) => (
      <span className="text-green-600 font-medium">
        {formatCurrency(row.original.total_earned_commission, agency.currency)}
      </span>
    ),
  },
  {
    accessorKey: 'outstanding_commission',
    header: 'Outstanding',
    cell: ({ row }) => (
      <span className={row.original.outstanding_commission > 0 ? 'text-red-600' : 'text-green-600'}>
        {formatCurrency(row.original.outstanding_commission, agency.currency)}
      </span>
    ),
  },
]

const table = useReactTable({
  data: commissionData,
  columns,
  getCoreRowModel: getCoreRowModel(),
  getSortedRowModel: getSortedRowModel(),
  initialState: {
    sorting: [{ id: 'total_earned_commission', desc: true }], // Default sort
  },
})
```

## UI States

### Loading State
- Display skeleton loader with table shape
- Show rows and columns placeholders
- Use Tailwind CSS or shadcn/ui skeleton component
- Smooth transition from skeleton to actual table

### Error State
- Clear error message: "Unable to load commission breakdown"
- Retry button that triggers refetch
- Support contact link or help text
- Don't show table when error occurs

### Empty State
- Display when no data available for selected filters
- Message: "No commission data available for selected period"
- Empty table illustration (icon or image)
- CTA button: "Create Payment Plan"
- Filter hint: "Try adjusting filters to see more data"

## Architecture Context

### Dashboard Zone
- Component lives in `apps/dashboard/app/components/`
- Follows established dashboard widget patterns
- Uses Tailwind CSS for styling
- Consistent with other dashboard components (KPI widgets, Cash Flow Chart)

### State Management
- **Server state**: TanStack Query handles data fetching, caching, refetching
- **Filter state**: Will be managed by Zustand dashboard-store (handled in Task 3)
- **Table state**: TanStack Table manages sorting internally

### Styling Guidelines
- Use Tailwind CSS utility classes
- Follow shadcn/ui design system if available
- Consistent spacing and typography with other dashboard widgets
- Responsive design (mobile, tablet, desktop)
- Table should be scrollable horizontally on mobile if needed

## Testing Requirements

### Component Tests Required
Create: `apps/dashboard/__tests__/components/CommissionBreakdownTable.test.tsx`

**Test Cases**:
1. **Test table rendering with mock data**
   - Verify TanStack Table renders with correct columns
   - Verify correct number of rows
   - Verify column headers display correctly

2. **Test column sorting**
   - Click header → table sorts ASC
   - Click again → table sorts DESC
   - Verify arrow indicators display correctly
   - Verify default sort (earned DESC) applies on mount

3. **Test loading state**
   - Mock query loading → skeleton UI displays
   - Data loads → table renders with data

4. **Test error state**
   - Mock query error → error message displays
   - Click retry → refetch triggered

5. **Test empty state**
   - Mock empty data response → empty state message displays
   - "Create Payment Plan" CTA visible

6. **Test top performer highlighting**
   - Mock data with various earned amounts
   - Verify top 3 colleges have visual badges
   - Others do not have badges

7. **Test drill-down links**
   - Mock router
   - Click college name → verify navigation to college detail
   - Click branch name → verify navigation with branch filter

8. **Test currency formatting**
   - Verify amounts formatted with correct currency symbol
   - Verify thousands separators and decimals

9. **Test responsive design**
   - Test on different viewport sizes
   - Verify table adapts or scrolls horizontally

### Test Pattern
```typescript
import { render, screen, fireEvent } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { describe, it, expect, vi } from 'vitest'
import CommissionBreakdownTable from './CommissionBreakdownTable'

describe('CommissionBreakdownTable', () => {
  const queryClient = new QueryClient()

  const wrapper = ({ children }) => (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  )

  it('renders table with commission data', async () => {
    // Mock fetch to return test data
    global.fetch = vi.fn(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ data: mockCommissionData }),
      })
    )

    render(<CommissionBreakdownTable />, { wrapper })

    // Wait for data to load
    await screen.findByText('Mock College Name')

    // Assert table rendered
    expect(screen.getByRole('table')).toBeInTheDocument()
  })

  it('sorts by column when header clicked', async () => {
    // Test sorting logic
  })

  // ... more tests
})
```

## Dependencies
- `@tanstack/react-table` (^8.21.3) - Headless table library
- `@tanstack/react-query` (^5.90.7) - Server state management
- `next/link` - Next.js Link component for navigation
- `packages/utils/src/formatters` - Currency formatting utility
- Tailwind CSS / shadcn/ui - Styling

## Success Criteria
- [ ] Component created at correct path
- [ ] TanStack Table configured with all 8 columns
- [ ] Data fetched using TanStack Query
- [ ] Default sort by earned_commission DESC
- [ ] Column sorting implemented with visual indicators
- [ ] Currency amounts formatted correctly
- [ ] Top 3 performers highlighted with badges
- [ ] College/branch names are clickable links
- [ ] GST column visually distinct (blue text)
- [ ] Combined total emphasized (bold)
- [ ] Outstanding amounts colored (red if > 0, green if = 0)
- [ ] Loading state with skeleton
- [ ] Error state with retry button
- [ ] Empty state with CTA
- [ ] Component tests written and passing
- [ ] Responsive design works on mobile/tablet/desktop

## Related Files
- API Route: `apps/dashboard/app/api/commission-by-college/route.ts` (Task 1)
- Utility: `packages/utils/src/formatters.ts` (may need to create)
- Story file: `.bmad-ephemeral/stories/6-3-commission-breakdown-by-college.md`
- Context file: `.bmad-ephemeral/stories/6-3-commission-breakdown-by-college.context.xml`

## Next Steps
After completing this task, proceed to **Task 3: Implement Filter Controls** which will add filtering capabilities to this table.
