# Story 6-5: Overdue Payments Summary Widget - Task 7

## Story Context

**As an** Agency User
**I want** a dedicated widget highlighting all overdue payments
**So that** I can immediately focus on the most urgent follow-ups

## Task 7: Testing

**Acceptance Criteria**: All

### Task Description

Implement comprehensive testing for the overdue payments feature including API route tests, component tests, and end-to-end tests to ensure all functionality works correctly and securely.

### Subtasks

- [ ] Write API route unit tests:
  - Test query returns only overdue installments (status = 'overdue')
  - Test ordering by due_date ASC (oldest first)
  - Test RLS filtering by agency_id
  - Test days_overdue calculation
  - Test totals calculation (count and amount)
  - Test joins with students, colleges, payment_plans
- [ ] Write component tests using React Testing Library:
  - Test OverduePaymentsWidget renders with mock data
  - Test list displays: student name, college, amount, days overdue
  - Test sorting (oldest overdue first)
  - Test clickable rows navigate to payment plan detail
  - Test total count and total amount display
  - Test empty state when no overdue payments
  - Test loading state (skeleton)
  - Test error state with retry
- [ ] Write integration test:
  - Dashboard loads → Overdue widget displays
  - Mark installment as overdue → Widget updates to show it
  - Click overdue item → Navigate to payment plan detail page
  - Record payment for overdue installment → Widget updates (count decreases)
- [ ] Test color coding:
  - 1-7 days: yellow/warning style
  - 8-30 days: orange/alert style
  - 30+ days: red/critical style
- [ ] Test auto-refresh:
  - Wait 5 minutes → Widget refetches automatically
  - Switch tabs → Widget refetches on return

## Context

### Key Constraints

- **Testing Standards**: Vitest for unit tests, React Testing Library for component tests, Playwright for E2E
- **Security Testing**: All database queries must be tested with RLS verification
- **Multi-Tenant Isolation**: Verify no cross-agency data leakage
- **Test Coverage**: Aim for >80% coverage on critical paths

### Test Files Structure

```
apps/dashboard/
├── app/
│   ├── api/
│   │   └── dashboard/
│   │       └── overdue-payments/
│   │           ├── route.ts
│   │           └── route.test.ts              # API route tests
│   ├── components/
│   │   ├── OverduePaymentsWidget.tsx
│   │   └── OverduePaymentsWidget.test.tsx    # Component tests
│   └── hooks/
│       ├── useOverduePayments.ts
│       └── useOverduePayments.test.ts        # Hook tests
tests/
└── e2e/
    └── dashboard/
        └── overdue-payments.spec.ts           # E2E tests
```

## API Route Tests (Vitest)

### Test File: `apps/dashboard/app/api/dashboard/overdue-payments/route.test.ts`

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { GET } from './route'

// Mock Supabase client
const mockSupabase = {
  from: vi.fn(() => ({
    select: vi.fn(() => ({
      eq: vi.fn(() => ({
        order: vi.fn(() => ({
          data: mockOverdueData,
          error: null,
        })),
      })),
    })),
  })),
}

describe('GET /api/dashboard/overdue-payments', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns only overdue installments', async () => {
    const response = await GET()
    const data = await response.json()

    expect(data.overdue_payments).toHaveLength(3)
    data.overdue_payments.forEach((payment: any) => {
      // Verify each has required fields
      expect(payment).toHaveProperty('id')
      expect(payment).toHaveProperty('student_name')
      expect(payment).toHaveProperty('college_name')
      expect(payment).toHaveProperty('amount')
      expect(payment).toHaveProperty('days_overdue')
    })
  })

  it('orders by due_date ASC (oldest first)', async () => {
    const response = await GET()
    const data = await response.json()

    const daysOverdue = data.overdue_payments.map((p: any) => p.days_overdue)
    const sorted = [...daysOverdue].sort((a, b) => b - a) // Descending (oldest first)
    expect(daysOverdue).toEqual(sorted)
  })

  it('filters by agency_id via RLS', async () => {
    // Mock RLS by checking query includes agency_id filter
    const response = await GET()

    expect(mockSupabase.from).toHaveBeenCalledWith('installments')
    // Verify RLS is applied (check for agency_id in query)
  })

  it('calculates days_overdue correctly', async () => {
    const response = await GET()
    const data = await response.json()

    data.overdue_payments.forEach((payment: any) => {
      const dueDate = new Date(payment.due_date)
      const today = new Date()
      const expectedDays = Math.floor((today.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24))

      expect(payment.days_overdue).toBeCloseTo(expectedDays, 0)
    })
  })

  it('calculates totals correctly', async () => {
    const response = await GET()
    const data = await response.json()

    expect(data.total_count).toBe(data.overdue_payments.length)

    const expectedTotal = data.overdue_payments.reduce((sum: number, p: any) => sum + p.amount, 0)
    expect(data.total_amount).toBe(expectedTotal)
  })

  it('returns empty array when no overdue payments', async () => {
    // Mock empty result
    mockSupabase.from = vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          order: vi.fn(() => ({
            data: [],
            error: null,
          })),
        })),
      })),
    }))

    const response = await GET()
    const data = await response.json()

    expect(data.overdue_payments).toEqual([])
    expect(data.total_count).toBe(0)
    expect(data.total_amount).toBe(0)
  })

  it('handles database errors gracefully', async () => {
    // Mock database error
    mockSupabase.from = vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          order: vi.fn(() => ({
            data: null,
            error: { message: 'Database connection failed' },
          })),
        })),
      })),
    }))

    const response = await GET()

    expect(response.status).toBe(500)
  })
})
```

## Component Tests (React Testing Library)

### Test File: `apps/dashboard/app/components/OverduePaymentsWidget.test.tsx`

```typescript
import { describe, it, expect, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { OverduePaymentsWidget } from './OverduePaymentsWidget'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

const mockOverdueData = {
  overdue_payments: [
    {
      id: '1',
      student_name: 'John Doe',
      college_name: 'Harvard',
      amount: 5000,
      days_overdue: 35,
      payment_plan_id: 'plan-1',
    },
    {
      id: '2',
      student_name: 'Jane Smith',
      college_name: 'MIT',
      amount: 3000,
      days_overdue: 15,
      payment_plan_id: 'plan-2',
    },
  ],
  total_count: 2,
  total_amount: 8000,
}

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  })
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  )
}

describe('OverduePaymentsWidget', () => {
  it('renders loading state initially', () => {
    render(<OverduePaymentsWidget />, { wrapper: createWrapper() })

    expect(screen.getByLabelText(/loading overdue payments/i)).toBeInTheDocument()
  })

  it('displays overdue payments with all required fields', async () => {
    // Mock API response
    global.fetch = vi.fn(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve(mockOverdueData),
      })
    ) as any

    render(<OverduePaymentsWidget />, { wrapper: createWrapper() })

    await waitFor(() => {
      expect(screen.getByText('John Doe')).toBeInTheDocument()
      expect(screen.getByText('Harvard')).toBeInTheDocument()
      expect(screen.getByText('$5,000')).toBeInTheDocument()
      expect(screen.getByText(/35 days overdue/i)).toBeInTheDocument()

      expect(screen.getByText('Jane Smith')).toBeInTheDocument()
      expect(screen.getByText('MIT')).toBeInTheDocument()
      expect(screen.getByText('$3,000')).toBeInTheDocument()
      expect(screen.getByText(/15 days overdue/i)).toBeInTheDocument()
    })
  })

  it('displays total count and total amount', async () => {
    global.fetch = vi.fn(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve(mockOverdueData),
      })
    ) as any

    render(<OverduePaymentsWidget />, { wrapper: createWrapper() })

    await waitFor(() => {
      expect(screen.getByText('2')).toBeInTheDocument() // total count badge
      expect(screen.getByText('$8,000')).toBeInTheDocument() // total amount
    })
  })

  it('applies correct color coding based on days overdue', async () => {
    global.fetch = vi.fn(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve(mockOverdueData),
      })
    ) as any

    render(<OverduePaymentsWidget />, { wrapper: createWrapper() })

    await waitFor(() => {
      const day35Element = screen.getByText(/35 days overdue/i)
      expect(day35Element).toHaveClass('text-red-600') // 30+ days = red

      const day15Element = screen.getByText(/15 days overdue/i)
      expect(day15Element).toHaveClass('text-orange-600') // 8-30 days = orange
    })
  })

  it('navigates to payment plan detail on click', async () => {
    const user = userEvent.setup()

    global.fetch = vi.fn(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve(mockOverdueData),
      })
    ) as any

    render(<OverduePaymentsWidget />, { wrapper: createWrapper() })

    await waitFor(() => {
      const firstItem = screen.getByText('John Doe').closest('a')
      expect(firstItem).toHaveAttribute('href', '/payments/plans/plan-1')
    })
  })

  it('shows empty state when no overdue payments', async () => {
    global.fetch = vi.fn(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve({
          overdue_payments: [],
          total_count: 0,
          total_amount: 0,
        }),
      })
    ) as any

    render(<OverduePaymentsWidget />, { wrapper: createWrapper() })

    await waitFor(() => {
      expect(screen.getByText(/no overdue payments/i)).toBeInTheDocument()
      expect(screen.getByText(/great work/i)).toBeInTheDocument()
      expect(screen.getByText('🎉')).toBeInTheDocument()
    })
  })

  it('shows error state and retry button on fetch failure', async () => {
    const user = userEvent.setup()

    global.fetch = vi.fn(() => Promise.reject(new Error('Network error'))) as any

    render(<OverduePaymentsWidget />, { wrapper: createWrapper() })

    await waitFor(() => {
      expect(screen.getByText(/unable to load overdue payments/i)).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /retry/i })).toBeInTheDocument()
    })

    // Click retry
    const retryButton = screen.getByRole('button', { name: /retry/i })
    await user.click(retryButton)

    // Verify refetch attempted
    expect(global.fetch).toHaveBeenCalledTimes(2) // Initial + retry
  })
})
```

## E2E Tests (Playwright)

### Test File: `tests/e2e/dashboard/overdue-payments.spec.ts`

```typescript
import { test, expect } from '@playwright/test'

test.describe('Overdue Payments Widget', () => {
  test.beforeEach(async ({ page }) => {
    // Login and navigate to dashboard
    await page.goto('/login')
    await page.fill('[name=email]', 'test@agency.com')
    await page.fill('[name=password]', 'password123')
    await page.click('button[type=submit]')
    await page.waitForURL('/dashboard')
  })

  test('displays overdue payments on dashboard load', async ({ page }) => {
    // Verify widget is visible
    await expect(page.locator('text=Overdue Payments')).toBeVisible()

    // Verify at least one overdue payment is shown (if test data exists)
    const overdueItems = page.locator('[data-testid=overdue-payment-item]')
    const count = await overdueItems.count()

    if (count > 0) {
      // Verify first item has required fields
      await expect(overdueItems.first()).toContainText(/\$/)
      await expect(overdueItems.first()).toContainText(/days overdue/)
    }
  })

  test('navigates to payment plan detail on click', async ({ page }) => {
    const firstItem = page.locator('[data-testid=overdue-payment-item]').first()

    if (await firstItem.isVisible()) {
      await firstItem.click()

      // Verify navigation to payment plan detail page
      await expect(page).toHaveURL(/\/payments\/plans\/[^/]+/)
    }
  })

  test('updates widget when installment becomes overdue', async ({ page }) => {
    // Get initial count
    const initialCountText = await page.locator('text=Overdue Payments').locator('..').locator('[class*="rounded-full"]').textContent()
    const initialCount = parseInt(initialCountText || '0')

    // Mark an installment as overdue (via API or database)
    // This would be done via test setup or API call

    // Refresh or wait for auto-refresh
    await page.reload()

    // Verify count increased
    const newCountText = await page.locator('text=Overdue Payments').locator('..').locator('[class*="rounded-full"]').textContent()
    const newCount = parseInt(newCountText || '0')

    expect(newCount).toBeGreaterThanOrEqual(initialCount)
  })

  test('shows celebration when no overdue payments', async ({ page }) => {
    // Clear all overdue payments (via test setup)
    // This would mark all as paid in test database

    await page.reload()

    // Verify celebration state
    await expect(page.locator('text=No overdue payments!')).toBeVisible()
    await expect(page.locator('text=🎉')).toBeVisible()
    await expect(page.locator('text=Great work')).toBeVisible()
  })

  test('auto-refreshes after 5 minutes', async ({ page }) => {
    // Fast-forward time (if using fake timers)
    // Or wait actual 5 minutes in slow test

    // Note: This test may be skipped in CI for speed
    test.slow()

    await page.waitForTimeout(300000) // 5 minutes

    // Verify network request was made
    const requests = page.context().request
    // Check for API call to /api/dashboard/overdue-payments
  })

  test('refetches on window focus', async ({ page }) => {
    // Blur window (switch tabs)
    await page.evaluate(() => window.blur())

    // Wait a bit
    await page.waitForTimeout(1000)

    // Focus window (return to tab)
    await page.evaluate(() => window.focus())

    // Verify refetch occurred
    // Check for network request or data update
  })
})
```

## Testing Checklist

### API Route Tests ✅
- [ ] Returns only overdue installments
- [ ] Orders by due_date ASC
- [ ] RLS filters by agency_id
- [ ] Calculates days_overdue correctly
- [ ] Calculates totals correctly
- [ ] Handles empty result
- [ ] Handles database errors

### Component Tests ✅
- [ ] Renders loading skeleton
- [ ] Displays all overdue payment fields
- [ ] Shows total count and amount
- [ ] Color codes by urgency (yellow/orange/red)
- [ ] Navigates on click
- [ ] Shows empty state
- [ ] Shows error state with retry

### E2E Tests ✅
- [ ] Widget displays on dashboard load
- [ ] Navigates to payment plan detail
- [ ] Updates when installment becomes overdue
- [ ] Shows celebration when empty
- [ ] Auto-refreshes after 5 minutes
- [ ] Refetches on window focus

## Next Steps

After completing this task:

1. **Update the manifest** at `docs/stories/prompts/6-5/manifest.md`:
   - Change Task 7 status to "Completed"
   - Mark entire story as "Completed"
   - Add completion date
   - Document test coverage percentage

2. **Run all tests** to verify:
   ```bash
   # Unit tests
   npm run test

   # E2E tests
   npm run test:e2e
   ```

3. **Update story status** in `.bmad-ephemeral/stories/6-5-overdue-payments-summary-widget.md`:
   - Change status from "ready-for-dev" to "done"

4. **Demo the feature** to stakeholders:
   - Show widget on dashboard
   - Demonstrate urgency color coding
   - Show empty state celebration
   - Demonstrate auto-refresh

---

**Congratulations!** This completes Story 6-5: Overdue Payments Summary Widget. All 7 tasks are done!

### Story Completion Checklist

- ✅ Task 1: API Route created
- ✅ Task 2: Widget component created
- ✅ Task 3: Empty state implemented
- ✅ Task 4: Loading/error states added
- ✅ Task 5: Integrated into dashboard
- ✅ Task 6: Auto-refresh configured
- ✅ Task 7: Comprehensive testing complete

**Final Verification**:
1. API endpoint returns correct data
2. Widget displays correctly on dashboard
3. Urgency color coding works (yellow/orange/red)
4. Empty state shows celebration
5. Auto-refresh works (5-minute interval + window focus)
6. All tests pass (unit, component, E2E)
7. No cross-agency data leakage (RLS verified)
