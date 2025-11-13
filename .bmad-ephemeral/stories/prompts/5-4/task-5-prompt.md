# Story 5-4: Payment Status Dashboard Widget - Task 5

## Story Context

**As an** Agency User
**I want** a dashboard widget showing payment status overview at a glance
**So that** I instantly know which payments need attention

---

## Task 5: Testing

### Previous Tasks Completion

✅ **Task 1 Complete**: Dashboard infrastructure established
✅ **Task 2 Complete**: Payment Status Summary API endpoint created
✅ **Task 3 Complete**: PaymentStatusWidget component built
✅ **Task 4 Complete**: Navigation to payment plans with filters implemented

### Task Description

Write comprehensive tests for the payment status summary feature, including unit tests for the API route, component tests for the widget, and integration tests to verify the complete user flow. Ensure all acceptance criteria are covered with appropriate test cases.

### Subtasks

- [ ] Write unit tests for payment status summary API route
- [ ] Mock database queries and verify correct aggregation logic
- [ ] Write component tests for PaymentStatusWidget using React Testing Library
- [ ] Test loading states, error states, and data display
- [ ] Verify click navigation passes correct filter parameters
- [ ] Write integration test verifying dashboard loads and displays widget

### Acceptance Criteria

This task covers **All AC** (#1-6) through comprehensive testing:
- AC #1: Dashboard loads and displays payment status summary widget
- AC #2: Widget displays pending payment count and total
- AC #3: Widget displays due soon payment count and total
- AC #4: Widget displays overdue payment count and total
- AC #5: Widget displays paid payment count and total
- AC #6: Clicking status cards navigates with correct filters

---

## Context & Technical Details

### Testing Stack

From [docs/architecture.md](../../architecture.md):

- **Unit Tests**: Vitest
- **Component Tests**: React Testing Library (RTL)
- **Integration Tests**: Playwright (optional for this story)
- **Mocking**: Mock Supabase client and API responses

### Test Locations

From [Story Context](../../.bmad-ephemeral/stories/5-4-payment-status-dashboard-widget.context.xml):

```
apps/dashboard/__tests__/
apps/dashboard/app/components/__tests__/
__tests__/integration/
```

### Testing Standards

From [Story Context](../../.bmad-ephemeral/stories/5-4-payment-status-dashboard-widget.context.xml):

- All tests must mock external dependencies
- Component tests should verify loading states, error states, and user interactions
- API route tests must mock Supabase client and verify RLS enforcement
- Tests should cover edge cases (empty data, large numbers, etc.)

---

## Implementation Steps

1. **Update Manifest**:
   - Read `docs/stories/prompts/5-4/manifest.md`
   - Update Task 4 status to "Completed" with date (if not already done)
   - Update Task 5 status to "In Progress" with current date

2. **Set Up Test Infrastructure** (if not already configured):
   - Verify Vitest configuration in `vitest.config.ts`
   - Verify React Testing Library setup
   - Set up test utilities and mocks directory

3. **Write API Route Unit Tests**:
   - Create: `apps/dashboard/app/api/dashboard/payment-status-summary/__tests__/route.test.ts`
   - Mock Supabase client
   - Test successful response with correct data structure
   - Test authentication failure (401)
   - Test database error handling (500)
   - Verify RLS filtering logic
   - Test aggregation calculations
   - Verify caching headers

4. **Write Component Unit Tests**:
   - Create: `apps/dashboard/app/components/__tests__/PaymentStatusWidget.test.tsx`
   - Mock TanStack Query
   - Mock fetch API
   - Test rendering with successful data
   - Test loading state display
   - Test error state display
   - Test all four status cards render correctly
   - Test currency formatting
   - Test color coding for each status
   - Test navigation links have correct hrefs

5. **Write Component Integration Tests**:
   - Test clicking each status card
   - Verify navigation to correct URLs with query parameters
   - Test user interaction flows

6. **Write Dashboard Integration Test** (Optional with Playwright):
   - Create: `__tests__/integration/dashboard.spec.ts`
   - Test login → dashboard navigation
   - Verify widget renders
   - Test clicking status cards navigates correctly
   - Test end-to-end user flow

7. **Run All Tests**:
   - Execute test suite: `npm run test` or `pnpm test`
   - Verify all tests pass
   - Check code coverage (aim for >80% on new code)
   - Fix any failing tests

8. **Update Manifest**:
   - Mark Task 5 as "Completed" with completion date
   - Add implementation notes:
     - Test files created
     - Coverage achieved
     - Any testing challenges or decisions made

---

## Test Examples

### API Route Unit Test

```typescript
// apps/dashboard/app/api/dashboard/payment-status-summary/__tests__/route.test.ts

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { GET } from '../route'
import { NextRequest } from 'next/server'

// Mock Supabase
vi.mock('@supabase/ssr', () => ({
  createServerClient: vi.fn(() => ({
    auth: {
      getUser: vi.fn(),
    },
    from: vi.fn(),
  })),
}))

describe('GET /api/dashboard/payment-status-summary', () => {
  it('returns payment status summary for authenticated user', async () => {
    // Mock authenticated user
    const mockUser = { id: 'user-123', email: 'test@example.com' }

    // Mock Supabase responses
    // ... setup mocks ...

    const request = new NextRequest('http://localhost:3000/api/dashboard/payment-status-summary')
    const response = await GET(request)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.success).toBe(true)
    expect(data.data).toHaveProperty('pending')
    expect(data.data).toHaveProperty('due_soon')
    expect(data.data).toHaveProperty('overdue')
    expect(data.data).toHaveProperty('paid_this_month')
  })

  it('returns 401 for unauthenticated request', async () => {
    // Mock authentication failure
    // ... setup mocks ...

    const request = new NextRequest('http://localhost:3000/api/dashboard/payment-status-summary')
    const response = await GET(request)

    expect(response.status).toBe(401)
  })

  it('calculates aggregations correctly', async () => {
    // Test that counts and sums are calculated properly
    // Mock database with known data
    // Verify response matches expected calculations
  })

  it('applies RLS filtering by agency_id', async () => {
    // Verify that Supabase queries include RLS filtering
    // This is implicit via auth.uid() but can verify in mocks
  })
})
```

### Component Unit Test

```typescript
// apps/dashboard/app/components/__tests__/PaymentStatusWidget.test.tsx

import { describe, it, expect, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import PaymentStatusWidget from '../PaymentStatusWidget'

const createTestQueryClient = () => new QueryClient({
  defaultOptions: {
    queries: { retry: false },
  },
})

const mockPaymentData = {
  success: true,
  data: {
    pending: { count: 5, total_amount: 5000 },
    due_soon: { count: 3, total_amount: 3000 },
    overdue: { count: 2, total_amount: 2000 },
    paid_this_month: { count: 10, total_amount: 10000 },
  },
}

describe('PaymentStatusWidget', () => {
  it('displays loading state initially', () => {
    const queryClient = createTestQueryClient()

    render(
      <QueryClientProvider client={queryClient}>
        <PaymentStatusWidget />
      </QueryClientProvider>
    )

    // Verify loading state is shown
    expect(screen.getByTestId('payment-status-loading')).toBeInTheDocument()
  })

  it('displays payment status data after loading', async () => {
    global.fetch = vi.fn(() =>
      Promise.resolve({
        ok: true,
        json: async () => mockPaymentData,
      })
    ) as any

    const queryClient = createTestQueryClient()

    render(
      <QueryClientProvider client={queryClient}>
        <PaymentStatusWidget />
      </QueryClientProvider>
    )

    await waitFor(() => {
      expect(screen.getByText('Pending')).toBeInTheDocument()
      expect(screen.getByText('5')).toBeInTheDocument()
      expect(screen.getByText('$5,000.00')).toBeInTheDocument()
    })
  })

  it('displays all four status cards', async () => {
    global.fetch = vi.fn(() =>
      Promise.resolve({
        ok: true,
        json: async () => mockPaymentData,
      })
    ) as any

    const queryClient = createTestQueryClient()

    render(
      <QueryClientProvider client={queryClient}>
        <PaymentStatusWidget />
      </QueryClientProvider>
    )

    await waitFor(() => {
      expect(screen.getByText('Pending')).toBeInTheDocument()
      expect(screen.getByText('Due Soon')).toBeInTheDocument()
      expect(screen.getByText('Overdue')).toBeInTheDocument()
      expect(screen.getByText('Paid This Month')).toBeInTheDocument()
    })
  })

  it('displays error state on fetch failure', async () => {
    global.fetch = vi.fn(() =>
      Promise.reject(new Error('API Error'))
    ) as any

    const queryClient = createTestQueryClient()

    render(
      <QueryClientProvider client={queryClient}>
        <PaymentStatusWidget />
      </QueryClientProvider>
    )

    await waitFor(() => {
      expect(screen.getByText(/error/i)).toBeInTheDocument()
    })
  })

  it('has correct navigation links', async () => {
    global.fetch = vi.fn(() =>
      Promise.resolve({
        ok: true,
        json: async () => mockPaymentData,
      })
    ) as any

    const queryClient = createTestQueryClient()

    render(
      <QueryClientProvider client={queryClient}>
        <PaymentStatusWidget />
      </QueryClientProvider>
    )

    await waitFor(() => {
      const links = screen.getAllByRole('link')
      expect(links[0]).toHaveAttribute('href', '/payments?status=pending')
      expect(links[1]).toHaveAttribute('href', '/payments?status=due_soon')
      expect(links[2]).toHaveAttribute('href', '/payments?status=overdue')
      expect(links[3]).toHaveAttribute('href', '/payments?status=paid&period=current_month')
    })
  })

  it('applies correct color coding', async () => {
    global.fetch = vi.fn(() =>
      Promise.resolve({
        ok: true,
        json: async () => mockPaymentData,
      })
    ) as any

    const queryClient = createTestQueryClient()

    render(
      <QueryClientProvider client={queryClient}>
        <PaymentStatusWidget />
      </QueryClientProvider>
    )

    await waitFor(() => {
      // Verify color classes are applied
      // This depends on your implementation
      // Check for green, amber, red, gray classes
    })
  })
})
```

### Integration Test (Optional - Playwright)

```typescript
// __tests__/integration/dashboard.spec.ts

import { test, expect } from '@playwright/test'

test.describe('Dashboard Payment Status Widget', () => {
  test.beforeEach(async ({ page }) => {
    // Login
    await page.goto('/login')
    await page.fill('[name="email"]', 'test@example.com')
    await page.fill('[name="password"]', 'password123')
    await page.click('button[type="submit"]')

    // Navigate to dashboard
    await page.waitForURL('/dashboard')
  })

  test('displays payment status widget on dashboard load', async ({ page }) => {
    await expect(page.locator('text=Pending')).toBeVisible()
    await expect(page.locator('text=Due Soon')).toBeVisible()
    await expect(page.locator('text=Overdue')).toBeVisible()
    await expect(page.locator('text=Paid This Month')).toBeVisible()
  })

  test('clicking pending card navigates to filtered payments', async ({ page }) => {
    await page.click('text=Pending')
    await page.waitForURL('/payments?status=pending')

    // Verify filter is applied on payments page
    await expect(page).toHaveURL(/status=pending/)
  })

  test('clicking overdue card navigates to filtered payments', async ({ page }) => {
    await page.click('text=Overdue')
    await page.waitForURL('/payments?status=overdue')

    await expect(page).toHaveURL(/status=overdue/)
  })
})
```

---

## Running Tests

### Unit and Component Tests (Vitest)

```bash
# Run all tests
pnpm test

# Run tests in watch mode
pnpm test:watch

# Run tests with coverage
pnpm test:coverage

# Run specific test file
pnpm test PaymentStatusWidget.test.tsx
```

### Integration Tests (Playwright)

```bash
# Run Playwright tests
pnpm playwright test

# Run with UI mode
pnpm playwright test --ui

# Run specific test
pnpm playwright test dashboard.spec.ts
```

---

## Test Coverage Goals

Aim for the following coverage on new code:

- **API Routes**: >90% coverage
- **Components**: >85% coverage
- **Overall**: >80% coverage

Focus on:
- All acceptance criteria covered
- Edge cases (empty data, errors, loading)
- User interactions (clicks, navigation)
- Data formatting (currency, numbers)

---

## Next Steps

After completing this task:

1. **Update the manifest file**:
   - Set Task 5 status to "Completed" with date
   - Add final implementation notes:
     - Test files created and coverage achieved
     - All acceptance criteria validated
     - Any remaining items or future enhancements

2. **Mark Story as Complete**:
   - Update story status to "completed" in manifest
   - Add completion date
   - Review all acceptance criteria are met

3. **Celebrate! 🎉**:
   - All 5 tasks completed
   - Payment Status Dashboard Widget is fully implemented and tested
   - Ready for code review and deployment

---

## Reference Documents

- [docs/architecture.md](../../architecture.md) - Testing infrastructure and standards
- [docs/epics.md](../../epics.md) - Epic 5: Story 5.4 requirements
- [Story Context XML](.bmad-ephemeral/stories/5-4-payment-status-dashboard-widget.context.xml) - Test ideas and coverage requirements
- [Manifest](manifest.md) - Track final progress and completion notes
