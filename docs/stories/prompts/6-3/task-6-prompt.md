# Task 6: Add Widget Header and Controls

## Context
You are implementing **Story 6.3: Commission Breakdown by College** for the Pleeno agency management platform. This task adds the widget container, header, and top-level controls for the commission breakdown widget.

**Story Goal**: Enable Agency Admins to see commission breakdown by college/branch with tax details to identify valuable institutions and prioritize relationships.

**This Task**: Wrap the commission breakdown table in a widget container with header, title, refresh button, and time period filter in the header area.

## Acceptance Criteria Coverage
This task addresses AC #1, #4:
- AC #1: Dashboard widget displays commission breakdown
- AC #4: User can filter by time period

## Task Requirements

### Widget Structure
Create a self-contained widget component with this structure:

```
┌────────────────────────────────────────────────────────────────────┐
│ Commission Breakdown by College           [Refresh] [Export] [•••] │ ← Header
├────────────────────────────────────────────────────────────────────┤
│ Showing: Jan 1 - Dec 31, 2025                                      │ ← Date indicator
├────────────────────────────────────────────────────────────────────┤
│ [Summary Cards: Total Commissions, GST, Amount, Outstanding]       │ ← From Task 5
├────────────────────────────────────────────────────────────────────┤
│ [Time Period ▼] [College ▼] [Branch ▼] [Clear Filters]            │ ← From Task 3
├────────────────────────────────────────────────────────────────────┤
│ [Commission Breakdown Table]                                        │ ← From Task 2
└────────────────────────────────────────────────────────────────────┘
```

### Widget Header Components

#### 1. Widget Title
- **Text**: "Commission Breakdown by College"
- **Style**: Large font, bold, dark text
- **Position**: Left side of header

#### 2. Refresh Button
- **Icon**: Refresh/reload icon (circular arrows)
- **Action**: Manually refetch commission data
- **Loading state**: Spin animation while refetching
- **Tooltip**: "Refresh data"
- **Position**: Right side of header

#### 3. Export to CSV Button (Placeholder)
- **Icon**: Download icon
- **Action**: Future enhancement - placeholder for now
- **State**: Disabled with tooltip explaining "Coming soon"
- **Tooltip**: "Export to CSV (coming soon)"
- **Position**: Right side of header, next to refresh button

#### 4. Actions Menu (Optional)
- **Icon**: Three dots (vertical ellipsis)
- **Action**: Dropdown menu with additional actions
- **Menu items**:
  - "Refresh"
  - "Export to CSV" (disabled)
  - "Widget Settings" (future)
- **Position**: Right side of header, rightmost item

### Date Range Indicator
- **Location**: Below header, above summary cards
- **Content**: Human-readable date range based on selected period
- **Examples**:
  - "All Time"
  - "Jan 1 - Dec 31, 2025" (This Year)
  - "Oct 1 - Dec 31, 2025" (This Quarter)
  - "November 2025" (This Month)
- **Style**: Small text, gray color
- **Updates**: Automatically when period filter changes

### Widget Container Styling
- **Border**: Subtle border or shadow
- **Background**: White or light background
- **Padding**: Consistent spacing (e.g., p-6)
- **Border radius**: Rounded corners (e.g., rounded-lg)
- **Responsive**: Full width on mobile, constrained on desktop

## Implementation Details

### Widget Component Structure
```typescript
interface CommissionBreakdownWidgetProps {
  className?: string
}

export function CommissionBreakdownWidget({ className }: CommissionBreakdownWidgetProps) {
  const { commissionFilters, setCommissionFilters, clearCommissionFilters } = useDashboardStore()
  const { data, isLoading, error, refetch, isRefetching } = useCommissionBreakdown(commissionFilters)

  const handleRefresh = () => {
    refetch()
  }

  return (
    <div className={cn("bg-white rounded-lg shadow-sm border border-gray-200", className)}>
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
        <h2 className="text-xl font-bold text-gray-900">
          Commission Breakdown by College
        </h2>
        <div className="flex items-center gap-2">
          <button
            onClick={handleRefresh}
            disabled={isRefetching}
            className="p-2 rounded hover:bg-gray-100 disabled:opacity-50"
            title="Refresh data"
          >
            <RefreshIcon className={cn("h-5 w-5", isRefetching && "animate-spin")} />
          </button>
          <button
            disabled
            className="p-2 rounded hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
            title="Export to CSV (coming soon)"
          >
            <DownloadIcon className="h-5 w-5" />
          </button>
        </div>
      </div>

      {/* Date Range Indicator */}
      <div className="px-6 py-3 bg-gray-50 border-b border-gray-200">
        <p className="text-sm text-gray-600">
          Showing: {getDateRangeLabel(commissionFilters.period)}
        </p>
      </div>

      {/* Widget Body */}
      <div className="p-6">
        {/* Summary Cards (Task 5) */}
        <SummaryCards data={data} isLoading={isLoading} />

        {/* Filter Controls (Task 3) */}
        <FilterControls
          filters={commissionFilters}
          onFilterChange={setCommissionFilters}
          onClearFilters={clearCommissionFilters}
        />

        {/* Commission Breakdown Table (Task 2) */}
        <CommissionBreakdownTable
          data={data}
          isLoading={isLoading}
          error={error}
        />
      </div>
    </div>
  )
}
```

### Refresh Button Implementation
```typescript
function RefreshButton({ onRefresh, isRefreshing }: { onRefresh: () => void; isRefreshing: boolean }) {
  return (
    <button
      onClick={onRefresh}
      disabled={isRefreshing}
      className="inline-flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
      title="Refresh data"
    >
      <RefreshIcon className={cn("h-4 w-4", isRefreshing && "animate-spin")} />
      <span className="hidden sm:inline">Refresh</span>
    </button>
  )
}
```

### Export Button (Placeholder)
```typescript
function ExportButton({ disabled }: { disabled: boolean }) {
  return (
    <button
      disabled={disabled}
      className="inline-flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
      title="Export to CSV (coming soon)"
    >
      <DownloadIcon className="h-4 w-4" />
      <span className="hidden sm:inline">Export</span>
    </button>
  )
}
```

### Date Range Label Function
```typescript
import { format, startOfYear, endOfYear, startOfQuarter, endOfQuarter, startOfMonth, endOfMonth } from 'date-fns'

function getDateRangeLabel(period: 'all' | 'year' | 'quarter' | 'month'): string {
  const now = new Date()

  switch (period) {
    case 'all':
      return 'All Time'
    case 'year':
      return `${format(startOfYear(now), 'MMM d')} - ${format(endOfYear(now), 'MMM d, yyyy')}`
    case 'quarter':
      return `${format(startOfQuarter(now), 'MMM d')} - ${format(endOfQuarter(now), 'MMM d, yyyy')}`
    case 'month':
      return format(now, 'MMMM yyyy')
    default:
      return 'All Time'
  }
}
```

## Responsive Design

### Desktop (lg+)
- Header with title on left, buttons on right
- Full button text visible ("Refresh", "Export")
- Date range indicator below header
- Widget full width or constrained by grid

### Tablet (md)
- Similar to desktop
- Button text may hide on smaller tablets
- Icons remain visible

### Mobile (sm and below)
- Header stacks if needed
- Button text hidden, icons only
- Date range indicator below header (may wrap)
- Widget full width with appropriate padding

## Widget Integration Pattern

This widget follows the established dashboard widget pattern seen in other widgets (KPI widgets, Cash Flow Chart from Story 6.2):

1. **Widget container**: White background, border, rounded corners
2. **Header section**: Title and actions
3. **Content sections**: Summary cards, filters, table
4. **Consistent spacing**: Padding and gaps
5. **Loading/error states**: Handled within widget
6. **Responsive layout**: Adapts to screen size

## Testing Requirements

### Component Tests Required
Add to: `apps/dashboard/__tests__/components/CommissionBreakdownWidget.test.tsx`

**Test Cases**:
1. **Test widget renders**
   - Verify widget container displays
   - Verify header with title
   - Verify refresh and export buttons
   - Verify date range indicator

2. **Test refresh button**
   - Click refresh → verify refetch triggered
   - During refetch → verify button shows loading state (spin animation)
   - After refetch → verify button returns to normal state

3. **Test export button (placeholder)**
   - Verify button is disabled
   - Hover over button → verify tooltip "Export to CSV (coming soon)"
   - Click button → no action (disabled)

4. **Test date range indicator**
   - Period = "all" → displays "All Time"
   - Period = "year" → displays "Jan 1 - Dec 31, 2025"
   - Period = "quarter" → displays quarter date range
   - Period = "month" → displays month name
   - Change period filter → indicator updates

5. **Test responsive layout**
   - Desktop: Title and buttons on same row
   - Mobile: Layout adapts, button text hidden

6. **Test widget sections**
   - Verify summary cards section renders
   - Verify filter controls section renders
   - Verify table section renders

### Test Pattern
```typescript
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { describe, it, expect, vi } from 'vitest'
import { CommissionBreakdownWidget } from './CommissionBreakdownWidget'

describe('CommissionBreakdownWidget', () => {
  it('renders widget with header and title', () => {
    render(<CommissionBreakdownWidget />, { wrapper: createWrapper() })

    expect(screen.getByText('Commission Breakdown by College')).toBeInTheDocument()
    expect(screen.getByTitle('Refresh data')).toBeInTheDocument()
    expect(screen.getByTitle('Export to CSV (coming soon)')).toBeInTheDocument()
  })

  it('triggers refetch when refresh button clicked', async () => {
    const mockRefetch = vi.fn()
    // Mock useCommissionBreakdown to return mockRefetch

    render(<CommissionBreakdownWidget />)

    const refreshButton = screen.getByTitle('Refresh data')
    fireEvent.click(refreshButton)

    await waitFor(() => {
      expect(mockRefetch).toHaveBeenCalled()
    })
  })

  it('displays date range based on selected period', () => {
    // Mock filter state with period="year"
    render(<CommissionBreakdownWidget />)

    expect(screen.getByText(/Jan 1 - Dec 31/)).toBeInTheDocument()
  })

  // ... more tests
})
```

## Dependencies
- `date-fns` (^4.1.0) - Date manipulation for range labels
- Icon library (Heroicons, Lucide) - Refresh, Download icons
- `clsx` or `cn` utility - Conditional class names

## Accessibility Considerations

### Semantic HTML
- Use `<h2>` for widget title (appropriate heading level)
- Use `<button>` for interactive elements
- Use semantic structure for widget sections

### Button Accessibility
- All buttons have descriptive `title` attributes (tooltips)
- Disabled buttons have `disabled` attribute and visual feedback
- Keyboard accessible (focusable, activatable with Enter/Space)

### Screen Reader Support
- Widget title announced as heading
- Button purposes clear from text or aria-label
- Date range indicator readable

## Success Criteria
- [ ] Widget container created with consistent styling
- [ ] Header section with title displayed
- [ ] Refresh button implemented and functional
- [ ] Refresh button shows loading animation when refetching
- [ ] Export button added as disabled placeholder
- [ ] Date range indicator displays below header
- [ ] Date range updates when period filter changes
- [ ] Widget wraps summary cards, filters, and table
- [ ] Responsive layout works on mobile/tablet/desktop
- [ ] Consistent spacing and padding throughout widget
- [ ] Widget follows dashboard widget pattern
- [ ] Component tests written and passing

## Related Files
- Component: `apps/dashboard/app/components/CommissionBreakdownWidget.tsx` (new file)
- Table component: `apps/dashboard/app/components/CommissionBreakdownTable.tsx` (Task 2)
- Summary cards: Part of widget (Task 5)
- Filter controls: Part of widget (Task 3)
- Story file: `.bmad-ephemeral/stories/6-3-commission-breakdown-by-college.md`

## Next Steps
After completing this task, proceed to **Task 7: Integrate GST Calculation Logic** which will create the utility functions for GST calculations.
