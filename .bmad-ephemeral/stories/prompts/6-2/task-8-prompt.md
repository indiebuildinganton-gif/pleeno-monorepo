# Story 6-2: Cash Flow Projection Chart - Task 8

## Story Context

**As an** Agency Admin
**I want** a visual chart showing projected cash flow for the next 90 days
**So that** I can anticipate incoming payments and plan accordingly

## Task 8: Testing

**Acceptance Criteria:** All

### Previous Task Completion

✅ Task 1: Cash Flow Projection API route created
✅ Task 2: CashFlowChart component with visualization
✅ Task 3: Interactive tooltip with student details
✅ Task 4: View toggle controls (Daily/Weekly/Monthly)
✅ Task 5: Real-time updates configured
✅ Task 6: Widget header and summary metrics
✅ Task 7: Integrated into dashboard page

The Cash Flow Chart is now fully integrated and functional. Time to write comprehensive tests!

### Task Description

Write comprehensive tests covering API routes, component behavior, and end-to-end integration. Ensure all acceptance criteria are validated through automated tests.

### Subtasks

**API Route Tests:**
- [ ] Test date grouping logic (daily, weekly, monthly)
- [ ] Test expected vs paid amount calculation
- [ ] Test date range filtering (90 days from today)
- [ ] Test empty result sets
- [ ] Verify RLS filtering by agency_id

**Component Tests:**
- [ ] Test chart rendering with mock data
- [ ] Test view toggle (daily/weekly/monthly)
- [ ] Test tooltip display on hover
- [ ] Test loading state (skeleton)
- [ ] Test error state with retry button
- [ ] Test real-time refetch behavior

**Integration Tests:**
- [ ] Dashboard loads → Cash flow chart displays
- [ ] Record payment → Chart updates (refetch triggered)
- [ ] Toggle view → Chart re-renders with new grouping
- [ ] Test chart responsiveness on different screen sizes

### Context

**Testing Framework:**
- Vitest for unit tests
- React Testing Library for component tests
- Playwright for E2E tests
- Coverage target: 80%+ for business logic

**Test Locations:**
- API tests: `apps/dashboard/__tests__/api/cash-flow-projection.test.ts`
- Component tests: `apps/dashboard/__tests__/components/CashFlowChart.test.tsx`
- E2E tests: `__tests__/e2e/dashboard-cash-flow.spec.ts`

### Related Documentation

- [docs/architecture.md](docs/architecture.md#testing-standards) - Testing patterns

---

## Update Manifest

Before coding, update `docs/stories/prompts/6-2/manifest.md`:

1. Mark Task 7 as "Completed" with today's date
2. Add notes about Task 7
3. Mark Task 8 as "In Progress" with today's date

---

## Implementation Steps

### 1. API Route Unit Tests

Create `apps/dashboard/__tests__/api/cash-flow-projection.test.ts`:

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { GET } from '@/app/api/cash-flow-projection/route'
import { createClient } from '@/lib/supabase/server'

// Mock Supabase
vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(),
}))

describe('Cash Flow Projection API', () => {
  let mockSupabase: any

  beforeEach(() => {
    mockSupabase = {
      from: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      gte: vi.fn().mockReturnThis(),
      lte: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      single: vi.fn(),
    }
    vi.mocked(createClient).mockReturnValue(mockSupabase)
  })

  it('should return weekly grouped data by default', async () => {
    mockSupabase.single.mockResolvedValueOnce({ data: { timezone: 'Australia/Sydney' } })
    mockSupabase.select.mockResolvedValueOnce({
      data: [
        {
          date_bucket: '2025-01-13',
          paid_amount: 5000,
          expected_amount: 3000,
          installment_count: 5,
          installments: [],
        },
      ],
    })

    const request = new Request('http://localhost:3000/api/dashboard/cash-flow-projection')
    const response = await GET(request)
    const data = await response.json()

    expect(data.success).toBe(true)
    expect(data.data).toHaveLength(1)
    expect(data.data[0].paid_amount).toBe(5000)
  })

  it('should filter by 90 days from today', async () => {
    mockSupabase.single.mockResolvedValueOnce({ data: { timezone: 'Australia/Sydney' } })

    const request = new Request('http://localhost:3000/api/dashboard/cash-flow-projection?days=90')
    await GET(request)

    // Verify date range filters were applied
    expect(mockSupabase.gte).toHaveBeenCalled()
    expect(mockSupabase.lte).toHaveBeenCalled()
  })

  it('should group by day when groupBy=daily', async () => {
    mockSupabase.single.mockResolvedValueOnce({ data: { timezone: 'Australia/Sydney' } })

    const request = new Request('http://localhost:3000/api/dashboard/cash-flow-projection?groupBy=daily')
    await GET(request)

    // Verify daily grouping was used in query
    // (Implementation-specific - adjust based on actual query)
  })

  it('should separate paid and expected amounts', async () => {
    mockSupabase.single.mockResolvedValueOnce({ data: { timezone: 'Australia/Sydney' } })
    mockSupabase.select.mockResolvedValueOnce({
      data: [
        {
          date_bucket: '2025-01-13',
          paid_amount: 5000,  // Only status='paid'
          expected_amount: 3000,  // Only status='pending'
          installment_count: 8,
          installments: [],
        },
      ],
    })

    const request = new Request('http://localhost:3000/api/dashboard/cash-flow-projection')
    const response = await GET(request)
    const data = await response.json()

    expect(data.data[0].paid_amount).toBe(5000)
    expect(data.data[0].expected_amount).toBe(3000)
  })

  it('should return empty array when no installments', async () => {
    mockSupabase.single.mockResolvedValueOnce({ data: { timezone: 'Australia/Sydney' } })
    mockSupabase.select.mockResolvedValueOnce({ data: [] })

    const request = new Request('http://localhost:3000/api/dashboard/cash-flow-projection')
    const response = await GET(request)
    const data = await response.json()

    expect(data.success).toBe(true)
    expect(data.data).toEqual([])
  })

  it('should handle errors gracefully', async () => {
    mockSupabase.single.mockRejectedValueOnce(new Error('Database error'))

    const request = new Request('http://localhost:3000/api/dashboard/cash-flow-projection')
    const response = await GET(request)
    const data = await response.json()

    expect(data.success).toBe(false)
    expect(response.status).toBe(500)
  })
})
```

### 2. Component Tests

Create `apps/dashboard/__tests__/components/CashFlowChart.test.tsx`:

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor, fireEvent } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import CashFlowChart from '@/app/components/CashFlowChart'

const mockData = {
  success: true,
  data: [
    {
      date_bucket: '2025-01-13',
      paid_amount: 5000,
      expected_amount: 3000,
      installment_count: 5,
      installments: [
        { student_name: 'John Doe', amount: 1000, status: 'paid', due_date: '2025-01-15' },
      ],
    },
  ],
}

describe('CashFlowChart', () => {
  let queryClient: QueryClient

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    })
    global.fetch = vi.fn()
  })

  const renderComponent = () => {
    return render(
      <QueryClientProvider client={queryClient}>
        <CashFlowChart />
      </QueryClientProvider>
    )
  }

  it('should render loading state initially', () => {
    vi.mocked(fetch).mockImplementation(() => new Promise(() => {}))
    renderComponent()

    expect(screen.getByRole('status')).toBeInTheDocument() // Loading skeleton
  })

  it('should render chart with data', async () => {
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => mockData,
    } as Response)

    renderComponent()

    await waitFor(() => {
      expect(screen.getByText('Cash Flow Projection (Next 90 Days)')).toBeInTheDocument()
    })

    // Verify summary metrics
    expect(screen.getByText('Total Expected')).toBeInTheDocument()
    expect(screen.getByText('Total Paid')).toBeInTheDocument()
    expect(screen.getByText('Net Projection')).toBeInTheDocument()
  })

  it('should toggle between daily, weekly, and monthly views', async () => {
    vi.mocked(fetch).mockResolvedValue({
      ok: true,
      json: async () => mockData,
    } as Response)

    renderComponent()

    await waitFor(() => screen.getByText('Weekly'))

    // Click Daily button
    fireEvent.click(screen.getByText('Daily'))

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('groupBy=daily'),
        expect.any(Object)
      )
    })

    // Click Monthly button
    fireEvent.click(screen.getByText('Monthly'))

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('groupBy=monthly'),
        expect.any(Object)
      )
    })
  })

  it('should show error state and retry button', async () => {
    vi.mocked(fetch).mockRejectedValueOnce(new Error('Network error'))

    renderComponent()

    await waitFor(() => {
      expect(screen.getByText('Unable to load cash flow projection')).toBeInTheDocument()
      expect(screen.getByText('Try Again')).toBeInTheDocument()
    })
  })

  it('should refetch data when refresh button clicked', async () => {
    vi.mocked(fetch).mockResolvedValue({
      ok: true,
      json: async () => mockData,
    } as Response)

    renderComponent()

    await waitFor(() => screen.getByTitle('Refresh data'))

    const refreshButton = screen.getByTitle('Refresh data')
    fireEvent.click(refreshButton)

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledTimes(2) // Initial + refetch
    })
  })

  it('should calculate summary metrics correctly', async () => {
    const multipleDataPoints = {
      success: true,
      data: [
        { date_bucket: '2025-01-13', paid_amount: 5000, expected_amount: 3000, installment_count: 5, installments: [] },
        { date_bucket: '2025-01-20', paid_amount: 2000, expected_amount: 4000, installment_count: 3, installments: [] },
      ],
    }

    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => multipleDataPoints,
    } as Response)

    renderComponent()

    await waitFor(() => {
      // Total Expected: 3000 + 4000 = 7000
      expect(screen.getByText(/7,000/)).toBeInTheDocument()
      // Total Paid: 5000 + 2000 = 7000
      // Net: 7000 + 7000 = 14000
      expect(screen.getByText(/14,000/)).toBeInTheDocument()
    })
  })
})
```

### 3. E2E Tests

Create `__tests__/e2e/dashboard-cash-flow.spec.ts`:

```typescript
import { test, expect } from '@playwright/test'

test.describe('Dashboard Cash Flow Chart', () => {
  test.beforeEach(async ({ page }) => {
    // Login as agency admin
    await page.goto('/login')
    await page.fill('input[name="email"]', 'admin@example.com')
    await page.fill('input[name="password"]', 'password123')
    await page.click('button[type="submit"]')

    // Navigate to dashboard
    await page.goto('/dashboard')
  })

  test('should display cash flow chart on dashboard', async ({ page }) => {
    // Wait for chart to load
    await expect(page.locator('text=Cash Flow Projection (Next 90 Days)')).toBeVisible()

    // Verify summary metrics visible
    await expect(page.locator('text=Total Expected')).toBeVisible()
    await expect(page.locator('text=Total Paid')).toBeVisible()
    await expect(page.locator('text=Net Projection')).toBeVisible()

    // Verify chart renders
    await expect(page.locator('.recharts-responsive-container')).toBeVisible()
  })

  test('should toggle between different views', async ({ page }) => {
    await page.waitForSelector('text=Cash Flow Projection')

    // Click Daily
    await page.click('button:has-text("Daily")')
    await page.waitForResponse((response) =>
      response.url().includes('groupBy=daily')
    )

    // Verify Daily button is active
    await expect(page.locator('button:has-text("Daily")')).toHaveClass(/bg-blue-600/)

    // Click Monthly
    await page.click('button:has-text("Monthly")')
    await page.waitForResponse((response) =>
      response.url().includes('groupBy=monthly')
    )

    // Verify Monthly button is active
    await expect(page.locator('button:has-text("Monthly")')).toHaveClass(/bg-blue-600/)
  })

  test('should show tooltip on hover', async ({ page }) => {
    await page.waitForSelector('.recharts-responsive-container')

    // Hover over a bar in the chart
    await page.hover('.recharts-bar-rectangle:first-child')

    // Verify tooltip appears
    await expect(page.locator('.recharts-tooltip-wrapper')).toBeVisible()
  })

  test('should be responsive on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 })
    await page.goto('/dashboard')

    // Verify chart still visible and readable
    await expect(page.locator('text=Cash Flow Projection')).toBeVisible()
    await expect(page.locator('.recharts-responsive-container')).toBeVisible()

    // Verify summary metrics stack vertically
    const metrics = page.locator('[class*="grid"]')
    await expect(metrics).toBeVisible()
  })

  test('should refetch data when refresh button clicked', async ({ page }) => {
    await page.waitForSelector('text=Cash Flow Projection')

    // Click refresh button
    await page.click('button[title="Refresh data"]')

    // Wait for loading indicator
    await page.waitForSelector('.animate-spin', { state: 'attached' })

    // Wait for loading to finish
    await page.waitForSelector('.animate-spin', { state: 'detached' })

    // Verify chart still displays
    await expect(page.locator('.recharts-responsive-container')).toBeVisible()
  })
})
```

---

## Next Steps

After completing Task 8:

1. **Update the manifest** - Mark Task 8 as completed
2. **Run all tests:**
   ```bash
   npm test                    # Unit and component tests
   npm run test:e2e           # E2E tests
   ```
3. **Verify coverage:**
   ```bash
   npm run test:coverage
   ```
4. **Final story completion:**
   - Update manifest: Story status → "Completed"
   - Add completion date
   - Summarize implementation notes

---

## Testing Commands

```bash
# Run all tests
npm test

# Run API tests only
npm test apps/dashboard/__tests__/api

# Run component tests only
npm test apps/dashboard/__tests__/components

# Run E2E tests
npm run test:e2e

# Run with coverage
npm run test:coverage

# Watch mode (during development)
npm test -- --watch
```

---

## Testing Checklist

### API Route Tests
- [ ] Weekly grouping returns correct date buckets
- [ ] Monthly grouping returns correct date buckets
- [ ] Daily grouping returns one bucket per day
- [ ] expected_amount only includes pending installments
- [ ] paid_amount only includes paid installments
- [ ] Date range filters to exactly 90 days
- [ ] RLS filters by agency_id
- [ ] Empty result returns empty array
- [ ] Installments array includes student details
- [ ] Error handling returns 500 status

### Component Tests
- [ ] Loading state shows skeleton
- [ ] Chart renders with mock data
- [ ] View toggle buttons work (Daily/Weekly/Monthly)
- [ ] Active button has correct styling
- [ ] Tooltip appears on hover (if testable)
- [ ] Error state shows retry button
- [ ] Refresh button triggers refetch
- [ ] Summary metrics calculate correctly
- [ ] Currency formatting works

### E2E Tests
- [ ] Dashboard loads with chart visible
- [ ] Toggle view updates chart
- [ ] Tooltip shows on hover
- [ ] Responsive on mobile (375px)
- [ ] Refresh button works
- [ ] No console errors

---

## Final Manifest Update

After all tests pass, update `docs/stories/prompts/6-2/manifest.md`:

```markdown
# Story 6-2: Cash Flow Projection Chart - Implementation Manifest

**Story:** Cash Flow Projection Chart
**Status:** Completed ✅
**Started:** [Date]
**Completed:** [Today's Date]

## Task Progress

### Task 1: Create Cash Flow Projection API Route
- Status: Completed ✅
- Completed: [Date]

### Task 2: Create CashFlowChart Component
- Status: Completed ✅
- Completed: [Date]

### Task 3: Implement Interactive Tooltip
- Status: Completed ✅
- Completed: [Date]

### Task 4: Add View Toggle Controls
- Status: Completed ✅
- Completed: [Date]

### Task 5: Implement Real-Time Updates
- Status: Completed ✅
- Completed: [Date]

### Task 6: Add Widget Header and Controls
- Status: Completed ✅
- Completed: [Date]

### Task 7: Integrate into Dashboard Page
- Status: Completed ✅
- Completed: [Date]

### Task 8: Testing
- Status: Completed ✅
- Completed: [Today's Date]
- Notes: All tests passing, coverage above 80%

## Implementation Summary

[Add summary of what was built, any challenges, decisions made]
```

---

**Update the manifest, write the tests, and complete Story 6-2!**
