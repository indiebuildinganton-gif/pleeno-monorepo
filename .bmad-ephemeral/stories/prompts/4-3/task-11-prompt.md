# Story 4.3: Payment Plan List and Detail Views - Task 11

## Story Context

**As an** Agency User
**I want** to view all payment plans and drill into individual plan details
**So that** I can quickly find plans and see their payment status

## Task 11: Testing

### Description
Write comprehensive integration and E2E tests for payment plans list and detail views.

### Acceptance Criteria
- AC: All (comprehensive test coverage)

### Subtasks
- [ ] Write integration tests for GET /api/payment-plans with various filter combinations
- [ ] Test RLS policies: users cannot access other agencies' payment plans
- [ ] Test search functionality (student name, reference number)
- [ ] Test pagination/sorting
- [ ] Write E2E test: Navigate from list → detail page
- [ ] Test filter combinations and clear filters
- [ ] Test empty states (no plans, no results after filtering)
- [ ] Test detail page with various plan statuses

## Context

### Previous Task Completion
Tasks 1-10 should now be complete. You should have:
- All API endpoints working (Tasks 1-2)
- All UI components rendering (Tasks 3-7)
- Status calculation (Task 8)
- Pagination (Task 9)
- TanStack Query hooks (Task 10)
- Full feature functionality ready for testing

### Key Constraints
- Testing: Integration tests for API endpoints, E2E tests for user flows, RLS policy tests
- Tools: Jest for unit/integration, Playwright or Cypress for E2E
- Coverage: Aim for high coverage of critical paths

### Test Structure
```
apps/payments/
├── app/
│   ├── api/
│   │   └── payment-plans/
│   │       ├── __tests__/
│   │       │   └── route.test.ts
│   │       └── [id]/
│   │           └── __tests__/
│   │               └── route.test.ts
│   └── plans/
│       ├── __tests__/
│       │   ├── PaymentPlansList.test.tsx
│       │   └── PaymentPlanDetail.test.tsx
│       └── components/
│           └── __tests__/
│               ├── PaymentPlansFilterPanel.test.tsx
│               ├── PaymentPlansSearchBar.test.tsx
│               └── InstallmentsList.test.tsx
tests/e2e/
└── payment-plans/
    ├── list-and-filter.spec.ts
    └── detail-view.spec.ts
```

### Dependencies
- jest (latest) - Unit/integration testing
- @testing-library/react (latest) - Component testing
- @testing-library/user-event (latest) - User interaction simulation
- playwright or @playwright/test (latest) - E2E testing
- msw (Mock Service Worker) - API mocking for component tests

### Relevant Documentation
- [docs/architecture.md - Testing](docs/architecture.md) - Testing patterns

## Manifest Update Instructions

1. Open `.bmad-ephemeral/stories/prompts/4-3/MANIFEST.md`
2. Update Task 10:
   - Status: Completed
   - Completed: [Current Date]
   - Notes: [Any relevant implementation notes]
3. Update Task 11:
   - Status: In Progress
   - Started: [Current Date]

## Implementation Approach

### Part 1: API Integration Tests

#### Test 1: GET /api/payment-plans - Basic Functionality
```typescript
// apps/payments/app/api/payment-plans/__tests__/route.test.ts
import { GET } from '../route'
import { createMockRequest } from '@/tests/helpers'

describe('GET /api/payment-plans', () => {
  it('returns paginated payment plans for authenticated user', async () => {
    const request = createMockRequest({
      method: 'GET',
      url: '/api/payment-plans',
      auth: { userId: 'user-1', agencyId: 'agency-1' },
    })

    const response = await GET(request)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.success).toBe(true)
    expect(data.data).toBeInstanceOf(Array)
    expect(data.meta).toMatchObject({
      total: expect.any(Number),
      page: 1,
      per_page: 20,
      total_pages: expect.any(Number),
    })
  })

  it('returns 401 for unauthenticated requests', async () => {
    const request = createMockRequest({
      method: 'GET',
      url: '/api/payment-plans',
      auth: null, // No auth
    })

    const response = await GET(request)
    expect(response.status).toBe(401)
  })
})
```

#### Test 2: RLS Policy Validation
```typescript
it('only returns payment plans for user\'s agency (RLS)', async () => {
  // Create plans for two different agencies
  await createPaymentPlan({ agencyId: 'agency-1', totalAmount: 1000 })
  await createPaymentPlan({ agencyId: 'agency-2', totalAmount: 2000 })

  // User from agency-1 should only see agency-1 plans
  const request = createMockRequest({
    method: 'GET',
    url: '/api/payment-plans',
    auth: { userId: 'user-1', agencyId: 'agency-1' },
  })

  const response = await GET(request)
  const data = await response.json()

  expect(data.data).toHaveLength(1)
  expect(data.data[0].agency_id).toBe('agency-1')
  expect(data.data[0].total_amount).toBe(1000)
})
```

#### Test 3: Filtering
```typescript
describe('Filtering', () => {
  beforeEach(async () => {
    // Seed test data with various statuses
    await createPaymentPlan({ status: 'active', studentId: 's1' })
    await createPaymentPlan({ status: 'completed', studentId: 's2' })
    await createPaymentPlan({ status: 'cancelled', studentId: 's3' })
  })

  it('filters by status (single)', async () => {
    const request = createMockRequest({
      url: '/api/payment-plans?status=active',
      auth: mockAuth,
    })

    const response = await GET(request)
    const data = await response.json()

    expect(data.data.every(p => p.status === 'active')).toBe(true)
  })

  it('filters by status (multiple)', async () => {
    const request = createMockRequest({
      url: '/api/payment-plans?status=active,completed',
      auth: mockAuth,
    })

    const response = await GET(request)
    const data = await response.json()

    expect(data.data.every(p => ['active', 'completed'].includes(p.status))).toBe(true)
  })

  it('filters by amount range', async () => {
    await createPaymentPlan({ totalAmount: 500 })
    await createPaymentPlan({ totalAmount: 1500 })
    await createPaymentPlan({ totalAmount: 2500 })

    const request = createMockRequest({
      url: '/api/payment-plans?amount_min=1000&amount_max=2000',
      auth: mockAuth,
    })

    const response = await GET(request)
    const data = await response.json()

    expect(data.data).toHaveLength(1)
    expect(data.data[0].total_amount).toBe(1500)
  })

  it('combines multiple filters', async () => {
    const request = createMockRequest({
      url: '/api/payment-plans?status=active&amount_min=1000&student_id=s1',
      auth: mockAuth,
    })

    const response = await GET(request)
    const data = await response.json()

    // Verify all filters applied correctly
  })
})
```

#### Test 4: Search
```typescript
describe('Search', () => {
  it('searches by student name (partial match)', async () => {
    await createPaymentPlan({ studentName: 'John Doe' })
    await createPaymentPlan({ studentName: 'Jane Smith' })

    const request = createMockRequest({
      url: '/api/payment-plans?search=john',
      auth: mockAuth,
    })

    const response = await GET(request)
    const data = await response.json()

    expect(data.data).toHaveLength(1)
    expect(data.data[0].enrollment.student.first_name).toBe('John')
  })

  it('searches by reference number (exact match)', async () => {
    await createPaymentPlan({ referenceNumber: 'PP-2024-001' })
    await createPaymentPlan({ referenceNumber: 'PP-2024-002' })

    const request = createMockRequest({
      url: '/api/payment-plans?search=PP-2024-001',
      auth: mockAuth,
    })

    const response = await GET(request)
    const data = await response.json()

    expect(data.data).toHaveLength(1)
    expect(data.data[0].reference_number).toBe('PP-2024-001')
  })
})
```

#### Test 5: Pagination and Sorting
```typescript
describe('Pagination', () => {
  beforeEach(async () => {
    // Create 25 payment plans
    for (let i = 0; i < 25; i++) {
      await createPaymentPlan({ totalAmount: i * 100 })
    }
  })

  it('returns first page with default limit (20)', async () => {
    const request = createMockRequest({
      url: '/api/payment-plans',
      auth: mockAuth,
    })

    const response = await GET(request)
    const data = await response.json()

    expect(data.data).toHaveLength(20)
    expect(data.meta).toMatchObject({
      page: 1,
      per_page: 20,
      total: 25,
      total_pages: 2,
    })
  })

  it('returns second page', async () => {
    const request = createMockRequest({
      url: '/api/payment-plans?page=2',
      auth: mockAuth,
    })

    const response = await GET(request)
    const data = await response.json()

    expect(data.data).toHaveLength(5)
    expect(data.meta.page).toBe(2)
  })

  it('sorts by next_due_date ascending (default)', async () => {
    const response = await GET(createMockRequest({ url: '/api/payment-plans', auth: mockAuth }))
    const data = await response.json()

    const dates = data.data.map(p => new Date(p.next_due_date).getTime())
    expect(dates).toEqual([...dates].sort((a, b) => a - b))
  })
})
```

#### Test 6: GET /api/payment-plans/[id] - Detail Endpoint
```typescript
// apps/payments/app/api/payment-plans/[id]/__tests__/route.test.ts
describe('GET /api/payment-plans/[id]', () => {
  it('returns payment plan with nested relationships', async () => {
    const plan = await createPaymentPlan({
      totalAmount: 10000,
      withInstallments: 10,
    })

    const request = createMockRequest({
      url: `/api/payment-plans/${plan.id}`,
      params: { id: plan.id },
      auth: mockAuth,
    })

    const response = await GET(request, { params: { id: plan.id } })
    const data = await response.json()

    expect(data.success).toBe(true)
    expect(data.data).toMatchObject({
      id: plan.id,
      total_amount: 10000,
      enrollment: expect.any(Object),
      installments: expect.arrayContaining([
        expect.objectContaining({
          installment_number: expect.any(Number),
          amount: expect.any(Number),
        }),
      ]),
      progress: {
        total_paid: expect.any(Number),
        installments_paid_count: expect.any(Number),
      },
    })
    expect(data.data.installments).toHaveLength(10)
  })

  it('returns 404 for non-existent plan', async () => {
    const request = createMockRequest({
      url: '/api/payment-plans/non-existent-id',
      params: { id: 'non-existent-id' },
      auth: mockAuth,
    })

    const response = await GET(request, { params: { id: 'non-existent-id' } })
    expect(response.status).toBe(404)
  })

  it('returns 404 for plan belonging to different agency (RLS)', async () => {
    const plan = await createPaymentPlan({ agencyId: 'agency-2' })

    const request = createMockRequest({
      url: `/api/payment-plans/${plan.id}`,
      params: { id: plan.id },
      auth: { userId: 'user-1', agencyId: 'agency-1' }, // Different agency
    })

    const response = await GET(request, { params: { id: plan.id } })
    expect(response.status).toBe(404) // RLS makes it appear not found
  })
})
```

### Part 2: Component Tests

#### Test 7: PaymentPlansList Component
```typescript
// apps/payments/app/plans/__tests__/PaymentPlansList.test.tsx
import { render, screen, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { PaymentPlansList } from '../components/PaymentPlansList'
import { server } from '@/tests/mocks/server'
import { rest } from 'msw'

describe('PaymentPlansList', () => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  })

  const wrapper = ({ children }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  )

  it('renders loading skeleton initially', () => {
    render(<PaymentPlansList />, { wrapper })
    expect(screen.getByTestId('loading-skeleton')).toBeInTheDocument()
  })

  it('renders payment plans list', async () => {
    server.use(
      rest.get('/api/payment-plans', (req, res, ctx) => {
        return res(
          ctx.json({
            success: true,
            data: [
              { id: '1', total_amount: 10000, status: 'active' },
              { id: '2', total_amount: 5000, status: 'completed' },
            ],
            meta: { total: 2, page: 1, per_page: 20, total_pages: 1 },
          })
        )
      })
    )

    render(<PaymentPlansList />, { wrapper })

    await waitFor(() => {
      expect(screen.getByText('$10,000')).toBeInTheDocument()
      expect(screen.getByText('$5,000')).toBeInTheDocument()
    })
  })

  it('renders empty state when no plans', async () => {
    server.use(
      rest.get('/api/payment-plans', (req, res, ctx) => {
        return res(
          ctx.json({
            success: true,
            data: [],
            meta: { total: 0, page: 1, per_page: 20, total_pages: 0 },
          })
        )
      })
    )

    render(<PaymentPlansList />, { wrapper })

    await waitFor(() => {
      expect(screen.getByText(/no payment plans found/i)).toBeInTheDocument()
    })
  })

  it('renders error state on API failure', async () => {
    server.use(
      rest.get('/api/payment-plans', (req, res, ctx) => {
        return res(ctx.status(500))
      })
    )

    render(<PaymentPlansList />, { wrapper })

    await waitFor(() => {
      expect(screen.getByText(/failed to fetch/i)).toBeInTheDocument()
    })
  })
})
```

#### Test 8: Filter Panel Component
```typescript
// apps/payments/app/plans/components/__tests__/PaymentPlansFilterPanel.test.tsx
import { render, screen, fireEvent } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { PaymentPlansFilterPanel } from '../PaymentPlansFilterPanel'

describe('PaymentPlansFilterPanel', () => {
  it('renders all filter controls', () => {
    render(<PaymentPlansFilterPanel />)

    expect(screen.getByLabelText(/status/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/student/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/amount/i)).toBeInTheDocument()
    expect(screen.getByText(/clear all filters/i)).toBeInTheDocument()
  })

  it('updates URL when filters change', async () => {
    const user = userEvent.setup()
    render(<PaymentPlansFilterPanel />)

    const statusCheckbox = screen.getByLabelText('Active')
    await user.click(statusCheckbox)

    expect(window.location.search).toContain('status=active')
  })

  it('displays active filters as chips', async () => {
    const user = userEvent.setup()
    render(<PaymentPlansFilterPanel />)

    await user.click(screen.getByLabelText('Active'))
    await user.click(screen.getByLabelText('Completed'))

    expect(screen.getByText('Status: Active')).toBeInTheDocument()
    expect(screen.getByText('Status: Completed')).toBeInTheDocument()
  })

  it('clears all filters when clear button clicked', async () => {
    const user = userEvent.setup()
    render(<PaymentPlansFilterPanel />)

    await user.click(screen.getByLabelText('Active'))
    await user.click(screen.getByText(/clear all filters/i))

    expect(screen.queryByText('Status: Active')).not.toBeInTheDocument()
    expect(window.location.search).toBe('')
  })
})
```

### Part 3: E2E Tests

#### Test 9: List to Detail Navigation
```typescript
// tests/e2e/payment-plans/list-and-filter.spec.ts
import { test, expect } from '@playwright/test'

test.describe('Payment Plans List', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/payments/plans')
  })

  test('displays payment plans list', async ({ page }) => {
    await expect(page.getByRole('heading', { name: 'Payment Plans' })).toBeVisible()
    await expect(page.getByRole('table')).toBeVisible()
  })

  test('navigates from list to detail page', async ({ page }) => {
    await page.getByRole('button', { name: 'View Details' }).first().click()
    await expect(page).toHaveURL(/\/payments\/plans\/[a-z0-9-]+/)
    await expect(page.getByRole('heading', { name: /payment plan/i })).toBeVisible()
  })

  test('filters plans by status', async ({ page }) => {
    await page.getByLabel('Status').click()
    await page.getByLabel('Active').check()
    await page.getByRole('button', { name: 'Apply Filters' }).click()

    await expect(page).toHaveURL(/status=active/)
    // Verify only active plans shown
    const badges = page.locator('[data-status]')
    await expect(badges.first()).toHaveAttribute('data-status', 'active')
  })

  test('searches for payment plan', async ({ page }) => {
    await page.getByPlaceholder(/search/i).fill('John')
    await page.waitForURL(/search=John/)

    // Verify search results
    await expect(page.getByText('John')).toBeVisible()
  })

  test('clears all filters', async ({ page }) => {
    // Apply filters
    await page.getByLabel('Active').check()
    await page.getByPlaceholder(/search/i).fill('test')

    // Clear all
    await page.getByRole('button', { name: /clear all/i }).click()

    await expect(page).toHaveURL('/payments/plans')
    await expect(page.getByPlaceholder(/search/i)).toHaveValue('')
  })

  test('pagination works', async ({ page }) => {
    await page.getByRole('button', { name: 'Next' }).click()
    await expect(page).toHaveURL(/page=2/)

    await page.getByRole('button', { name: 'Previous' }).click()
    await expect(page).toHaveURL(/page=1/)
  })
})
```

#### Test 10: Detail Page
```typescript
// tests/e2e/payment-plans/detail-view.spec.ts
test.describe('Payment Plan Detail', () => {
  test('displays complete payment plan information', async ({ page }) => {
    await page.goto('/payments/plans/test-plan-id')

    // Verify sections
    await expect(page.getByRole('heading', { name: /plan overview/i })).toBeVisible()
    await expect(page.getByRole('heading', { name: /student information/i })).toBeVisible()
    await expect(page.getByRole('heading', { name: /installments/i })).toBeVisible()

    // Verify data
    await expect(page.getByText(/total amount/i)).toBeVisible()
    await expect(page.getByText(/commission/i)).toBeVisible()
    await expect(page.getByRole('progressbar')).toBeVisible()
  })

  test('displays installments table', async ({ page }) => {
    await page.goto('/payments/plans/test-plan-id')

    const table = page.getByRole('table')
    await expect(table).toBeVisible()

    // Verify columns
    await expect(page.getByRole('columnheader', { name: '#' })).toBeVisible()
    await expect(page.getByRole('columnheader', { name: 'Amount' })).toBeVisible()
    await expect(page.getByRole('columnheader', { name: 'Status' })).toBeVisible()
  })

  test('highlights overdue installments', async ({ page }) => {
    await page.goto('/payments/plans/test-plan-id')

    const overdueRow = page.locator('[data-status="overdue"]').first()
    await expect(overdueRow).toHaveClass(/bg-red/)
  })

  test('breadcrumb navigation works', async ({ page }) => {
    await page.goto('/payments/plans/test-plan-id')

    await page.getByRole('link', { name: 'Payment Plans' }).click()
    await expect(page).toHaveURL('/payments/plans')
  })
})
```

## Running Tests

```bash
# Unit/Integration tests
npm run test

# E2E tests
npm run test:e2e

# Coverage report
npm run test:coverage
```

## Next Steps

After completing this task:
1. Update the manifest (Task 11 → Completed)
2. Update story status to "Completed"
3. Review all acceptance criteria are met
4. Story 4.3 is complete!

## Testing Checklist

### API Tests
- [ ] GET /api/payment-plans returns plans for authenticated user
- [ ] RLS: users only see their agency's plans
- [ ] Filter by status (single and multiple)
- [ ] Filter by student, college, amount range
- [ ] Search by student name (partial match)
- [ ] Search by reference number
- [ ] Multiple filters combined work correctly
- [ ] Pagination returns correct page and meta
- [ ] Sorting by next_due_date works
- [ ] GET /api/payment-plans/[id] returns plan with nested data
- [ ] 404 for non-existent plan
- [ ] 404 for other agency's plan (RLS)

### Component Tests
- [ ] PaymentPlansList renders loading skeleton
- [ ] PaymentPlansList renders plans correctly
- [ ] PaymentPlansList shows empty state
- [ ] PaymentPlansList shows error state
- [ ] Filter panel renders all controls
- [ ] Filter panel updates URL on change
- [ ] Filter panel displays active filters as chips
- [ ] Filter panel clears all filters
- [ ] Search bar debounces input (300ms)
- [ ] Search bar updates URL
- [ ] InstallmentsList renders table correctly
- [ ] InstallmentsList highlights overdue installments

### E2E Tests
- [ ] Navigate from list to detail page
- [ ] Apply filters and verify results
- [ ] Search and verify results
- [ ] Clear all filters works
- [ ] Pagination navigation works
- [ ] Detail page displays all sections
- [ ] Installments table renders
- [ ] Overdue highlighting works
- [ ] Breadcrumb navigation works
- [ ] Back button preserves filter state
