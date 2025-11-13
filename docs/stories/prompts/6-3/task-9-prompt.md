# Task 9: Testing

## Context
You are implementing **Story 6.3: Commission Breakdown by College** for the Pleeno agency management platform. This task adds comprehensive test coverage for all components, utilities, and integration points.

**Story Goal**: Enable Agency Admins to see commission breakdown by college/branch with tax details to identify valuable institutions and prioritize relationships.

**This Task**: Write unit tests, component tests, and integration tests to ensure all acceptance criteria are met and the feature works correctly.

## Acceptance Criteria Coverage
This task addresses **ALL acceptance criteria** through testing:
- AC #1: Dashboard displays commission breakdown
- AC #2: All columns display correctly
- AC #3: Table is sortable
- AC #4: Filters work (time period, college, branch)
- AC #5: Drill-down navigation works
- AC #6: Top performers highlighted
- AC #7: GST calculations correct

## Testing Strategy

### Test Pyramid
1. **Unit Tests** (most tests):
   - Utility functions (commission calculations, GST)
   - Helper functions (date formatting, currency formatting)
   - Business logic in isolation

2. **Component Tests** (medium tests):
   - React components with mocked data
   - User interactions (clicks, form inputs)
   - State changes and side effects

3. **Integration Tests** (fewer tests):
   - End-to-end user flows
   - API integration
   - Navigation between pages

## Test Files to Create

### 1. Unit Tests: GST Calculation Utilities
**File**: `packages/utils/src/commission-calculator.test.ts`

**Test Coverage**:
- GST calculation (inclusive mode)
- GST calculation (exclusive mode)
- Earned commission calculation
- Outstanding commission calculation
- Edge cases (zero amounts, negative numbers)

See Task 7 for detailed test implementation.

### 2. API Route Tests
**File**: `apps/dashboard/__tests__/api/commission-by-college.test.ts`

**Test Cases**:
```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { GET } from '@/app/api/commission-by-college/route'
import { createServerClient } from '@/lib/supabase/server'

vi.mock('@/lib/supabase/server')

describe('GET /api/dashboard/commission-by-college', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('aggregates commission by college/branch', async () => {
    const mockData = [
      {
        college_id: 'college-1',
        college_name: 'Test College',
        branch_id: 'branch-1',
        branch_name: 'Test Branch',
        total_earned_commission: 50000,
        total_gst: 5000,
        // ...
      },
    ]

    const mockSupabase = {
      from: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          // ... mock query chain
          data: mockData,
          error: null,
        }),
      }),
    }

    vi.mocked(createServerClient).mockReturnValue(mockSupabase as any)

    const request = new Request('http://localhost/api/commission-by-college?period=all')
    const response = await GET(request)
    const json = await response.json()

    expect(json.data).toEqual(mockData)
    expect(response.status).toBe(200)
  })

  it('filters by time period', async () => {
    // Test period=year filtering
    const request = new Request('http://localhost/api/commission-by-college?period=year')
    const response = await GET(request)

    // Verify query was called with correct date filters
    expect(mockSupabase.from).toHaveBeenCalledWith(expect.stringContaining('WHERE'))
  })

  it('filters by college_id', async () => {
    const request = new Request('http://localhost/api/commission-by-college?college_id=college-1')
    const response = await GET(request)

    // Verify college filter applied
  })

  it('filters by branch_id', async () => {
    const request = new Request('http://localhost/api/commission-by-college?branch_id=branch-1')
    const response = await GET(request)

    // Verify branch filter applied
  })

  it('calculates GST correctly for inclusive mode', async () => {
    // Mock data with gst_inclusive=true
    // Verify GST calculation
  })

  it('calculates GST correctly for exclusive mode', async () => {
    // Mock data with gst_inclusive=false
    // Verify GST calculation
  })

  it('sorts by earned_commission DESC by default', async () => {
    const mockData = [
      { total_earned_commission: 100000 },
      { total_earned_commission: 50000 },
      { total_earned_commission: 75000 },
    ]

    // Verify response is sorted correctly
  })

  it('respects RLS by filtering by agency_id', async () => {
    // Verify only current agency's data returned
  })

  it('handles validation errors', async () => {
    const request = new Request('http://localhost/api/commission-by-college?period=invalid')
    const response = await GET(request)

    expect(response.status).toBe(400)
  })

  it('handles database errors', async () => {
    const mockSupabase = {
      from: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          data: null,
          error: new Error('Database error'),
        }),
      }),
    }

    vi.mocked(createServerClient).mockReturnValue(mockSupabase as any)

    const request = new Request('http://localhost/api/commission-by-college')
    const response = await GET(request)

    expect(response.status).toBe(500)
  })
})
```

### 3. Component Tests: CommissionBreakdownTable
**File**: `apps/dashboard/__tests__/components/CommissionBreakdownTable.test.tsx`

**Test Cases**:
```typescript
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { describe, it, expect, vi } from 'vitest'
import { CommissionBreakdownTable } from '@/components/CommissionBreakdownTable'

describe('CommissionBreakdownTable', () => {
  const queryClient = new QueryClient()

  const wrapper = ({ children }) => (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  )

  it('renders table with commission data', async () => {
    const mockData = {
      data: [
        {
          college_name: 'Test College',
          branch_name: 'Test Branch',
          total_earned_commission: 50000,
          // ...
        },
      ],
    }

    global.fetch = vi.fn(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve(mockData),
      })
    )

    render(<CommissionBreakdownTable />, { wrapper })

    await waitFor(() => {
      expect(screen.getByText('Test College')).toBeInTheDocument()
    })
  })

  it('sorts by column when header clicked', async () => {
    render(<CommissionBreakdownTable />, { wrapper })

    const collegeHeader = screen.getByText('College')
    fireEvent.click(collegeHeader)

    // Verify table sorted by college name ASC
    // Click again
    fireEvent.click(collegeHeader)

    // Verify table sorted by college name DESC
  })

  it('displays loading skeleton while loading', () => {
    render(<CommissionBreakdownTable />, { wrapper })

    expect(screen.getByTestId('skeleton-loader')).toBeInTheDocument()
  })

  it('displays error state on fetch failure', async () => {
    global.fetch = vi.fn(() => Promise.reject(new Error('Network error')))

    render(<CommissionBreakdownTable />, { wrapper })

    await waitFor(() => {
      expect(screen.getByText(/Unable to load/)).toBeInTheDocument()
    })

    const retryButton = screen.getByText('Retry')
    expect(retryButton).toBeInTheDocument()
  })

  it('displays empty state when no data', async () => {
    global.fetch = vi.fn(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ data: [] }),
      })
    )

    render(<CommissionBreakdownTable />, { wrapper })

    await waitFor(() => {
      expect(screen.getByText(/No commission data/)).toBeInTheDocument()
    })
  })

  it('highlights top 3 performing colleges', async () => {
    const mockData = {
      data: [
        { college_name: 'Top 1', total_earned_commission: 100000 },
        { college_name: 'Top 2', total_earned_commission: 80000 },
        { college_name: 'Top 3', total_earned_commission: 60000 },
        { college_name: 'Other', total_earned_commission: 40000 },
      ],
    }

    render(<CommissionBreakdownTable />, { wrapper })

    // Verify top 3 have badges/highlighting
    await waitFor(() => {
      expect(screen.getByText('Top 1').closest('tr')).toHaveClass('top-performer')
    })
  })

  it('formats currency amounts correctly', async () => {
    render(<CommissionBreakdownTable />, { wrapper })

    await waitFor(() => {
      expect(screen.getByText('$50,000.00')).toBeInTheDocument()
    })
  })

  it('displays GST in separate column with blue styling', async () => {
    render(<CommissionBreakdownTable />, { wrapper })

    await waitFor(() => {
      const gstCell = screen.getByText('$5,000.00')
      expect(gstCell).toHaveClass('text-blue-600')
    })
  })

  it('displays outstanding commission in red if > 0', async () => {
    const mockData = {
      data: [{ outstanding_commission: 10000 }],
    }

    render(<CommissionBreakdownTable />, { wrapper })

    await waitFor(() => {
      const outstandingCell = screen.getByText('$10,000.00')
      expect(outstandingCell).toHaveClass('text-red-600')
    })
  })
})
```

### 4. Component Tests: Filter Controls
**File**: Add to `apps/dashboard/__tests__/components/CommissionBreakdownTable.test.tsx`

**Test Cases**:
```typescript
describe('CommissionBreakdownTable - Filters', () => {
  it('filters by time period', async () => {
    render(<CommissionBreakdownTable />, { wrapper })

    const periodDropdown = screen.getByLabelText('Time Period')
    fireEvent.change(periodDropdown, { target: { value: 'year' } })

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('period=year')
      )
    })
  })

  it('filters by college', async () => {
    render(<CommissionBreakdownTable />, { wrapper })

    const collegeDropdown = screen.getByLabelText('College')
    fireEvent.change(collegeDropdown, { target: { value: 'college-1' } })

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('college_id=college-1')
      )
    })
  })

  it('filters by branch', async () => {
    render(<CommissionBreakdownTable />, { wrapper })

    const branchDropdown = screen.getByLabelText('Branch')
    fireEvent.change(branchDropdown, { target: { value: 'branch-1' } })

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('branch_id=branch-1')
      )
    })
  })

  it('clears all filters when Clear Filters clicked', async () => {
    render(<CommissionBreakdownTable />, { wrapper })

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

  it('displays active filter count badge', async () => {
    render(<CommissionBreakdownTable />, { wrapper })

    // Apply 2 filters
    // ...

    expect(screen.getByText('2 filters active')).toBeInTheDocument()
  })
})
```

### 5. Component Tests: Drill-Down Links
**File**: Add to `apps/dashboard/__tests__/components/CommissionBreakdownTable.test.tsx`

**Test Cases**:
```typescript
import { useRouter } from 'next/navigation'

vi.mock('next/navigation')

describe('CommissionBreakdownTable - Drill-Down', () => {
  it('navigates to college detail when college name clicked', async () => {
    const mockPush = vi.fn()
    vi.mocked(useRouter).mockReturnValue({ push: mockPush } as any)

    render(<CommissionBreakdownTable />, { wrapper })

    await waitFor(() => {
      const collegeLink = screen.getByText('Test College')
      fireEvent.click(collegeLink)

      expect(mockPush).toHaveBeenCalledWith('/entities/colleges/college-1')
    })
  })

  it('navigates to college detail with branch filter when branch clicked', async () => {
    const mockPush = vi.fn()
    vi.mocked(useRouter).mockReturnValue({ push: mockPush } as any)

    render(<CommissionBreakdownTable />, { wrapper })

    await waitFor(() => {
      const branchLink = screen.getByText('Test Branch')
      fireEvent.click(branchLink)

      expect(mockPush).toHaveBeenCalledWith('/entities/colleges/college-1?branch=branch-1')
    })
  })

  it('navigates to payment plans when View Plans clicked', async () => {
    const mockPush = vi.fn()
    vi.mocked(useRouter).mockReturnValue({ push: mockPush } as any)

    render(<CommissionBreakdownTable />, { wrapper })

    await waitFor(() => {
      const viewPlansButton = screen.getByTitle(/View.*payment plans/)
      fireEvent.click(viewPlansButton)

      expect(mockPush).toHaveBeenCalledWith('/payments/plans?college=college-1&branch=branch-1')
    })
  })
})
```

### 6. Component Tests: Summary Metrics
**File**: Add to `apps/dashboard/__tests__/components/CommissionBreakdownTable.test.tsx`

**Test Cases**:
```typescript
describe('CommissionBreakdownTable - Summary Metrics', () => {
  it('displays summary cards with correct totals', async () => {
    const mockData = {
      data: [
        { total_earned_commission: 50000, total_gst: 5000, outstanding_commission: 10000 },
        { total_earned_commission: 30000, total_gst: 3000, outstanding_commission: 5000 },
      ],
    }

    render(<CommissionBreakdownTable />, { wrapper })

    await waitFor(() => {
      // Total Commissions = 50000 + 30000 = 80000
      expect(screen.getByText('$80,000')).toBeInTheDocument()

      // Total GST = 5000 + 3000 = 8000
      expect(screen.getByText('$8,000')).toBeInTheDocument()

      // Outstanding = 10000 + 5000 = 15000
      expect(screen.getByText('$15,000')).toBeInTheDocument()
    })
  })

  it('calculates percentages correctly', async () => {
    // Mock data with known percentages
    // Verify "90% + 10%" or similar display
  })

  it('updates summary when filters change', async () => {
    render(<CommissionBreakdownTable />, { wrapper })

    // Initial summary
    expect(screen.getByText('$80,000')).toBeInTheDocument()

    // Change filter
    fireEvent.change(screen.getByLabelText('Time Period'), { target: { value: 'year' } })

    // Wait for new data and verify summary updated
    await waitFor(() => {
      expect(screen.getByText('$60,000')).toBeInTheDocument()
    })
  })
})
```

### 7. Integration Tests (E2E)
**File**: `__tests__/e2e/dashboard-commission-breakdown.spec.ts`

**Test Cases**:
```typescript
import { test, expect } from '@playwright/test'

test.describe('Dashboard - Commission Breakdown Widget', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login')
    await page.fill('[name="email"]', 'admin@test.com')
    await page.fill('[name="password"]', 'password')
    await page.click('button[type="submit"]')
    await page.waitForURL('/dashboard')
  })

  test('displays commission breakdown widget on dashboard', async ({ page }) => {
    await expect(page.getByText('Commission Breakdown by College')).toBeVisible()
    await expect(page.locator('table')).toBeVisible()
  })

  test('applies time period filter and updates table', async ({ page }) => {
    await page.selectOption('[aria-label="Time Period"]', 'year')

    await page.waitForResponse((response) =>
      response.url().includes('period=year')
    )

    await expect(page.getByText(/Jan 1 - Dec 31/)).toBeVisible()
  })

  test('applies college filter and updates table', async ({ page }) => {
    await page.selectOption('[aria-label="College"]', 'Test College')

    await page.waitForResponse((response) =>
      response.url().includes('college_id=')
    )

    // Verify only Test College rows visible
  })

  test('sorts table by clicking column header', async ({ page }) => {
    const collegeHeader = page.locator('th', { hasText: 'College' })
    await collegeHeader.click()

    // Verify sort indicator (arrow) visible
    await expect(collegeHeader.locator('[aria-sort="ascending"]')).toBeVisible()

    // Click again to sort descending
    await collegeHeader.click()
    await expect(collegeHeader.locator('[aria-sort="descending"]')).toBeVisible()
  })

  test('navigates to college detail when college name clicked', async ({ page }) => {
    await page.click('table >> text=Test College')

    await expect(page).toHaveURL(/\/entities\/colleges\//)
  })

  test('navigates to payment plans when View Plans clicked', async ({ page }) => {
    await page.click('button[title*="View payment plans"]')

    await expect(page).toHaveURL(/\/payments\/plans/)
  })

  test('refreshes data when refresh button clicked', async ({ page }) => {
    const refreshButton = page.locator('button[title="Refresh data"]')
    await refreshButton.click()

    // Verify API called again
    await page.waitForResponse((response) =>
      response.url().includes('/api/dashboard/commission-by-college')
    )

    // Verify loading spinner appeared (animation)
    await expect(refreshButton.locator('svg[class*="animate-spin"]')).toBeVisible()
  })

  test('widget is responsive on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 })

    await expect(page.getByText('Commission Breakdown by College')).toBeVisible()
    await expect(page.locator('table')).toBeVisible()
  })
})
```

### 8. Responsive Design Tests
**File**: Add to E2E tests

**Test Cases**:
```typescript
test.describe('Responsive Design', () => {
  test('displays correctly on desktop', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 720 })
    // Verify layout
  })

  test('displays correctly on tablet', async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 1024 })
    // Verify layout adapts
  })

  test('displays correctly on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 })
    // Verify mobile layout, horizontal scroll if needed
  })
})
```

## Test Coverage Goals

### Coverage Targets
- **Unit tests**: 90%+ coverage for utility functions
- **Component tests**: 80%+ coverage for components
- **Integration tests**: Key user flows covered

### Critical Paths to Cover
1. Commission data aggregation (API)
2. GST calculation (inclusive and exclusive)
3. Table rendering and sorting
4. Filter application and state management
5. Drill-down navigation
6. Summary metric calculations
7. Error and loading states

## Running Tests

### Commands
```bash
# Run all tests
npm test

# Run unit tests only
npm run test:unit

# Run component tests only
npm run test:component

# Run E2E tests only
npm run test:e2e

# Run tests with coverage
npm run test:coverage

# Run tests in watch mode
npm run test:watch
```

## Success Criteria
- [ ] Unit tests for commission-calculator.ts (100% coverage)
- [ ] API route tests written and passing
- [ ] Component tests for CommissionBreakdownTable written and passing
- [ ] Filter control tests written and passing
- [ ] Drill-down navigation tests written and passing
- [ ] Summary metric tests written and passing
- [ ] Widget integration tests written and passing
- [ ] E2E tests for dashboard integration written and passing
- [ ] All tests passing in CI/CD pipeline
- [ ] Test coverage meets targets (80%+ overall)
- [ ] All acceptance criteria validated through tests

## Related Files
- Utility tests: `packages/utils/src/commission-calculator.test.ts`
- API tests: `apps/dashboard/__tests__/api/commission-by-college.test.ts`
- Component tests: `apps/dashboard/__tests__/components/CommissionBreakdownTable.test.tsx`
- E2E tests: `__tests__/e2e/dashboard-commission-breakdown.spec.ts`
- Story file: `.bmad-ephemeral/stories/6-3-commission-breakdown-by-college.md`

## Final Notes
This comprehensive testing task ensures that:
1. All acceptance criteria are validated
2. Business logic is correct (commission calculations, GST)
3. User interactions work as expected
4. Error handling is robust
5. Responsive design works on all devices
6. Feature integrates correctly with dashboard

Once all tests pass, Story 6.3 is complete and ready for production deployment.
