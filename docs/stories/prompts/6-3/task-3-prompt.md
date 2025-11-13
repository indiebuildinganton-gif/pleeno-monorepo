# Task 3: Implement Filter Controls

## Context
You are implementing **Story 6.3: Commission Breakdown by College** for the Pleeno agency management platform. This task adds filtering capabilities to the commission breakdown table.

**Story Goal**: Enable Agency Admins to see commission breakdown by college/branch with tax details to identify valuable institutions and prioritize relationships.

**This Task**: Add filter UI controls (time period, college, branch) that update the table data when changed.

## Acceptance Criteria Coverage
This task addresses AC #4:
- AC #4: User can filter by college, branch, and time period (all time, this year, this quarter, this month)

## Task Requirements

### Filter Controls Specification
Add three filter controls above the commission breakdown table:

1. **Time Period Dropdown**
   - Options: "All Time", "This Year", "This Quarter", "This Month"
   - Values: "all", "year", "quarter", "month"
   - Default: "All Time" ("all")

2. **College Filter**
   - Dropdown or autocomplete with all colleges
   - Optional (can be empty/null)
   - Shows all colleges belonging to current agency
   - Placeholder: "All Colleges" or "Select College"

3. **Branch Filter**
   - Dropdown with branches
   - Optional (can be empty/null)
   - Filtered by selected college (if college selected)
   - If no college selected: Shows all branches
   - Placeholder: "All Branches" or "Select Branch"

### Additional Controls
- **"Clear Filters" button**: Resets all filters to default state
- **Active filter count badge**: Shows "2 filters active" if 2 filters applied
- **Date range indicator**: Shows human-readable date range based on period selection

### Filter Behavior
- **On filter change**:
  - Update query parameters
  - Refetch data via TanStack Query with new filters
  - Update table with filtered results
- **Filter persistence**: Use Zustand store to persist filter state across page navigations
- **Default state**: All Time, no college filter, no branch filter

## State Management

### Zustand Store
Use `packages/stores/src/dashboard-store.ts` (create if doesn't exist)

```typescript
import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface CommissionFilters {
  period: 'all' | 'year' | 'quarter' | 'month'
  college_id: string | null
  branch_id: string | null
}

interface DashboardStore {
  commissionFilters: CommissionFilters
  setCommissionFilters: (filters: Partial<CommissionFilters>) => void
  clearCommissionFilters: () => void
}

const defaultFilters: CommissionFilters = {
  period: 'all',
  college_id: null,
  branch_id: null,
}

export const useDashboardStore = create<DashboardStore>()(
  persist(
    (set) => ({
      commissionFilters: defaultFilters,
      setCommissionFilters: (filters) =>
        set((state) => ({
          commissionFilters: { ...state.commissionFilters, ...filters },
        })),
      clearCommissionFilters: () =>
        set({ commissionFilters: defaultFilters }),
    }),
    {
      name: 'dashboard-store',
    }
  )
)
```

### Component Integration
```typescript
import { useDashboardStore } from '@/stores/dashboard-store'

function CommissionBreakdownTable() {
  const { commissionFilters, setCommissionFilters, clearCommissionFilters } = useDashboardStore()

  // Use filters in TanStack Query
  const { data, isLoading, error, refetch } = useCommissionBreakdown(commissionFilters)

  const handlePeriodChange = (period: string) => {
    setCommissionFilters({ period: period as CommissionFilters['period'] })
  }

  const handleCollegeChange = (college_id: string | null) => {
    setCommissionFilters({ college_id, branch_id: null }) // Reset branch when college changes
  }

  const handleBranchChange = (branch_id: string | null) => {
    setCommissionFilters({ branch_id })
  }

  // ...
}
```

## UI Implementation

### Filter Layout
```
┌─────────────────────────────────────────────────────────────────┐
│ Commission Breakdown by College                                 │
├─────────────────────────────────────────────────────────────────┤
│ [Time Period ▼] [College ▼] [Branch ▼] [Clear Filters] 2 active│
│ Showing: Jan 1 - Dec 31, 2025                                   │
├─────────────────────────────────────────────────────────────────┤
│ [Table with commission data]                                    │
└─────────────────────────────────────────────────────────────────┘
```

### Time Period Dropdown
```typescript
<select
  value={commissionFilters.period}
  onChange={(e) => handlePeriodChange(e.target.value)}
  className="..."
>
  <option value="all">All Time</option>
  <option value="year">This Year</option>
  <option value="quarter">This Quarter</option>
  <option value="month">This Month</option>
</select>
```

### College Filter Dropdown
Fetch colleges using TanStack Query:
```typescript
const { data: colleges } = useQuery({
  queryKey: ['colleges'],
  queryFn: async () => {
    const response = await fetch('/api/entities/colleges')
    if (!response.ok) throw new Error('Failed to fetch colleges')
    return response.json()
  },
  staleTime: 10 * 60 * 1000, // 10 minutes
})
```

```typescript
<select
  value={commissionFilters.college_id || ''}
  onChange={(e) => handleCollegeChange(e.target.value || null)}
  className="..."
>
  <option value="">All Colleges</option>
  {colleges?.data.map((college) => (
    <option key={college.id} value={college.id}>
      {college.name}
    </option>
  ))}
</select>
```

### Branch Filter Dropdown
Fetch branches (filtered by college if selected):
```typescript
const { data: branches } = useQuery({
  queryKey: ['branches', commissionFilters.college_id],
  queryFn: async () => {
    const params = new URLSearchParams()
    if (commissionFilters.college_id) {
      params.set('college_id', commissionFilters.college_id)
    }
    const response = await fetch(`/api/entities/branches?${params}`)
    if (!response.ok) throw new Error('Failed to fetch branches')
    return response.json()
  },
  staleTime: 10 * 60 * 1000, // 10 minutes
  enabled: true, // Always enabled, but filtered by college on backend
})
```

```typescript
<select
  value={commissionFilters.branch_id || ''}
  onChange={(e) => handleBranchChange(e.target.value || null)}
  className="..."
>
  <option value="">All Branches</option>
  {branches?.data.map((branch) => (
    <option key={branch.id} value={branch.id}>
      {branch.name} - {branch.city}
    </option>
  ))}
</select>
```

### Clear Filters Button
```typescript
<button
  onClick={clearCommissionFilters}
  className="..."
  disabled={
    commissionFilters.period === 'all' &&
    !commissionFilters.college_id &&
    !commissionFilters.branch_id
  }
>
  Clear Filters
</button>
```

### Active Filter Count Badge
```typescript
const activeFilterCount = [
  commissionFilters.period !== 'all',
  commissionFilters.college_id !== null,
  commissionFilters.branch_id !== null,
].filter(Boolean).length

{activeFilterCount > 0 && (
  <span className="...">
    {activeFilterCount} filter{activeFilterCount > 1 ? 's' : ''} active
  </span>
)}
```

### Date Range Indicator
```typescript
import { format, startOfYear, endOfYear, startOfQuarter, endOfQuarter, startOfMonth, endOfMonth } from 'date-fns'

function getDateRangeLabel(period: string): string {
  const now = new Date()

  switch (period) {
    case 'all':
      return 'All Time'
    case 'year':
      return `${format(startOfYear(now), 'MMM d')} - ${format(endOfYear(now), 'MMM d, yyyy')}`
    case 'quarter':
      return `${format(startOfQuarter(now), 'MMM d')} - ${format(endOfQuarter(now), 'MMM d, yyyy')}`
    case 'month':
      return `${format(startOfMonth(now), 'MMM d')} - ${format(endOfMonth(now), 'MMM d, yyyy')}`
    default:
      return 'All Time'
  }
}

<div className="text-sm text-gray-600">
  Showing: {getDateRangeLabel(commissionFilters.period)}
</div>
```

## Architecture Context

### Filter State Flow
1. User interacts with filter control (dropdown, button)
2. Component calls Zustand store action (`setCommissionFilters`)
3. Zustand store updates filter state
4. TanStack Query observes state change (via `queryKey: ['commission-breakdown', filters]`)
5. TanStack Query refetches data with new filters
6. Table re-renders with filtered data

### Filter Persistence
- Zustand `persist` middleware saves filter state to localStorage
- Filter state persists across page navigations and browser refreshes
- Key: `dashboard-store` in localStorage

## Testing Requirements

### Component Tests Required
Add to: `apps/dashboard/__tests__/components/CommissionBreakdownTable.test.tsx`

**Test Cases**:
1. **Test filter controls render**
   - Verify time period dropdown renders with 4 options
   - Verify college filter dropdown renders
   - Verify branch filter dropdown renders
   - Verify "Clear Filters" button renders

2. **Test time period filter**
   - Select "This Year" → verify filter state updates
   - Verify TanStack Query refetches with `period=year`
   - Verify date range indicator updates

3. **Test college filter**
   - Select college → verify filter state updates
   - Verify branch filter resets to null
   - Verify TanStack Query refetches with `college_id`

4. **Test branch filter**
   - Select branch → verify filter state updates
   - Verify TanStack Query refetches with `branch_id`

5. **Test "Clear Filters" button**
   - Apply filters (period=year, college selected)
   - Click "Clear Filters"
   - Verify all filters reset to default
   - Verify TanStack Query refetches with default filters

6. **Test active filter count badge**
   - No filters active → badge not displayed
   - 1 filter active → "1 filter active" displayed
   - 2 filters active → "2 filters active" displayed
   - 3 filters active → "3 filters active" displayed

7. **Test filter persistence**
   - Set filters
   - Simulate page navigation
   - Return to page
   - Verify filters still applied

8. **Test branch filter dependency on college**
   - Select college
   - Verify branch dropdown updates to show only branches for that college

### Test Pattern
```typescript
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { describe, it, expect, vi } from 'vitest'
import CommissionBreakdownTable from './CommissionBreakdownTable'

describe('CommissionBreakdownTable - Filters', () => {
  const queryClient = new QueryClient()

  it('filters by time period', async () => {
    render(<CommissionBreakdownTable />, { wrapper: createWrapper() })

    const periodDropdown = screen.getByLabelText('Time Period')
    fireEvent.change(periodDropdown, { target: { value: 'year' } })

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('period=year')
      )
    })
  })

  it('clears filters when Clear Filters clicked', async () => {
    render(<CommissionBreakdownTable />, { wrapper: createWrapper() })

    // Apply filters first
    // ...

    const clearButton = screen.getByText('Clear Filters')
    fireEvent.click(clearButton)

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        expect.not.stringContaining('period=')
      )
    })
  })

  // ... more tests
})
```

## Dependencies
- `zustand` (^5.0.8) - Client-side state management
- `date-fns` (^4.1.0) - Date formatting and manipulation
- `@tanstack/react-query` (^5.90.7) - Server state management (already used)

## API Endpoints Assumed
This task assumes these API endpoints exist (or will be created):
- `GET /api/entities/colleges` - Returns list of colleges
- `GET /api/entities/branches?college_id={uuid}` - Returns branches (optionally filtered by college)

If these don't exist, create simple endpoints that return college/branch lists with RLS filtering.

## Success Criteria
- [ ] Zustand dashboard store created with filter state
- [ ] Time period dropdown implemented with 4 options
- [ ] College filter dropdown implemented
- [ ] Branch filter dropdown implemented (filtered by college)
- [ ] "Clear Filters" button implemented
- [ ] Active filter count badge implemented
- [ ] Date range indicator implemented
- [ ] Filter state persists to localStorage
- [ ] Filters trigger TanStack Query refetch
- [ ] Table updates with filtered data
- [ ] Branch filter resets when college changes
- [ ] Component tests written and passing
- [ ] Filter controls styled consistently with dashboard

## Related Files
- Store: `packages/stores/src/dashboard-store.ts` (create if needed)
- Component: `apps/dashboard/app/components/CommissionBreakdownTable.tsx` (Task 2)
- API Route: `apps/dashboard/app/api/commission-by-college/route.ts` (Task 1)
- Story file: `.bmad-ephemeral/stories/6-3-commission-breakdown-by-college.md`

## Next Steps
After completing this task, proceed to **Task 4: Implement Drill-Down to Payment Plans** which will add navigation to detailed views.
