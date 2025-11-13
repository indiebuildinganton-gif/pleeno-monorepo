# Story 7-5: Student Payment History Report - Task 9

**Story**: Student Payment History Report
**Task**: Testing and Validation
**Acceptance Criteria**: All ACs

## User Story Context

**As an** Agency User
**I want** to view and export complete payment history for individual students
**So that** I can answer student inquiries and maintain records for dispute resolution

## Task Description

Comprehensive testing and validation of the entire Student Payment History Report feature, including API routes, UI components, PDF generation, date filtering, and edge cases. This task ensures all acceptance criteria are met and the feature is production-ready.

## Subtasks Checklist

- [ ] Write API route tests:
  - Test payment history query accuracy (correct installments)
  - Test date range filtering (inclusive bounds)
  - Test summary calculations (total_paid, total_outstanding)
  - Test RLS enforcement (agency_id isolation)
  - Test with student having no payment plans → Return empty array
  - Test with student having multiple payment plans → Group correctly
- [ ] Write UI integration tests:
  - View payment history → See chronological timeline
  - Filter by date range → See filtered results
  - Expand payment plan → See all installments
  - Export PDF → Verify file format
- [ ] Test edge cases:
  - Student with no payment plans → Display "No payment history"
  - Student with all paid installments → Total outstanding = $0
  - Student with cancelled payment plans → Show cancelled status
  - Large payment history (100+ installments) → Pagination or scrolling
- [ ] Test PDF export:
  - Long payment history (multiple pages) → Verify page breaks
  - Student name with special characters → Verify filename sanitization
  - PDF opens correctly in Adobe Reader, Preview, browsers
- [ ] Test date range filtering:
  - "All Time" → Show all installments
  - "This Year" → Show only current year installments
  - "Custom" range spanning years → Show correct installments
- [ ] Test currency formatting:
  - Amounts display with correct currency symbol (AUD)
  - Negative amounts (credits/refunds) display with minus sign
- [ ] Test statement accuracy:
  - Summary totals match individual installment sums
  - Paid dates match installment paid_at timestamps
  - Status badges match installment status values

## Acceptance Criteria

**All ACs from Story 7-5:**

1. ✅ **AC #1**: Given I am viewing a student's detail page, When I request a payment history report, Then I see a chronological list of all payment plans and installments for that student
2. ✅ **AC #2**: And each entry shows: date, payment plan, college/branch, amount, payment status, paid date
3. ✅ **AC #3**: And the report shows total paid to date and total outstanding
4. ✅ **AC #4**: And the report is exportable to PDF for sharing with the student
5. ✅ **AC #5**: And the PDF is formatted as a clear payment statement
6. ✅ **AC #6**: And I can filter by date range (all time, this year, custom)

## Context & Constraints

### Key Constraints
- **Test Coverage**: Achieve minimum 80% code coverage for new code
- **Test Isolation**: Tests should not depend on external services (mock Supabase)
- **Performance**: API tests should complete in under 2 seconds
- **E2E Tests**: Should run in headless mode for CI/CD integration

### Testing Stack

**Unit Testing:**
- Vitest - Unit test runner
- React Testing Library - Component testing

**Integration Testing:**
- Supertest or similar for API route testing
- Vitest with database setup/teardown

**E2E Testing:**
- Playwright - End-to-end browser testing

### Dependencies

**Required NPM Packages:**
- `vitest` - Unit test runner
- `@testing-library/react` - React component testing
- `@testing-library/jest-dom` - DOM matchers
- `@playwright/test` - E2E testing
- `msw` - API mocking for tests

### Artifacts & References

**Documentation:**
- `.bmad-ephemeral/stories/7-5-student-payment-history-report.context.xml` - Full story context
- Testing standards from other stories

## Implementation Guidelines

### Step 1: API Route Unit Tests

**File**: `apps/entities/app/api/students/[id]/payment-history/__tests__/route.test.ts`

```typescript
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { GET } from '../route'
import { createMockSupabaseClient } from '@/test-utils/supabase-mock'

describe('Payment History API Route', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should return payment history for authenticated user', async () => {
    const mockSupabase = createMockSupabaseClient({
      user: { id: 'user-1', user_metadata: { agency_id: 'agency-1' } },
      student: { id: 'student-1', full_name: 'John Doe' },
      paymentHistory: [
        {
          installment_id: 'inst-1',
          amount: 5000,
          due_date: '2025-01-15',
          paid_at: '2025-01-10',
          paid_amount: 5000,
          status: 'paid',
        },
      ],
    })

    const request = new Request('http://localhost/api/students/student-1/payment-history')
    const response = await GET(request, { params: { id: 'student-1' } })

    expect(response.status).toBe(200)
    const data = await response.json()
    expect(data.data).toHaveLength(1)
    expect(data.summary.total_paid).toBe(5000)
  })

  it('should return 401 for unauthenticated requests', async () => {
    const mockSupabase = createMockSupabaseClient({ user: null })

    const request = new Request('http://localhost/api/students/student-1/payment-history')
    const response = await GET(request, { params: { id: 'student-1' } })

    expect(response.status).toBe(401)
  })

  it('should enforce RLS - deny access to other agency students', async () => {
    const mockSupabase = createMockSupabaseClient({
      user: { id: 'user-1', user_metadata: { agency_id: 'agency-1' } },
      student: null, // Student not found due to RLS
    })

    const request = new Request('http://localhost/api/students/student-2/payment-history')
    const response = await GET(request, { params: { id: 'student-2' } })

    expect(response.status).toBe(404)
  })

  it('should filter by date range correctly', async () => {
    const mockSupabase = createMockSupabaseClient({
      user: { id: 'user-1', user_metadata: { agency_id: 'agency-1' } },
      student: { id: 'student-1' },
      paymentHistory: [
        { due_date: '2025-01-15', amount: 5000 },
        { due_date: '2024-06-15', amount: 3000 },
      ],
    })

    const request = new Request(
      'http://localhost/api/students/student-1/payment-history?date_from=2025-01-01&date_to=2025-12-31'
    )
    const response = await GET(request, { params: { id: 'student-1' } })

    const data = await response.json()
    expect(data.data).toHaveLength(1)
    expect(data.data[0].due_date).toBe('2025-01-15')
  })

  it('should calculate summary totals correctly', async () => {
    const mockSupabase = createMockSupabaseClient({
      user: { id: 'user-1', user_metadata: { agency_id: 'agency-1' } },
      student: { id: 'student-1' },
      paymentHistory: [
        { amount: 5000, paid_at: '2025-01-10', paid_amount: 5000 }, // Paid
        { amount: 3000, paid_at: null, paid_amount: null }, // Outstanding
      ],
    })

    const request = new Request('http://localhost/api/students/student-1/payment-history')
    const response = await GET(request, { params: { id: 'student-1' } })

    const data = await response.json()
    expect(data.summary.total_paid).toBe(5000)
    expect(data.summary.total_outstanding).toBe(3000)
    expect(data.summary.percentage_paid).toBeCloseTo(62.5, 1)
  })

  it('should handle student with no payment plans', async () => {
    const mockSupabase = createMockSupabaseClient({
      user: { id: 'user-1', user_metadata: { agency_id: 'agency-1' } },
      student: { id: 'student-1' },
      paymentHistory: [],
    })

    const request = new Request('http://localhost/api/students/student-1/payment-history')
    const response = await GET(request, { params: { id: 'student-1' } })

    const data = await response.json()
    expect(data.data).toHaveLength(0)
    expect(data.summary.total_paid).toBe(0)
    expect(data.summary.total_outstanding).toBe(0)
    expect(data.summary.percentage_paid).toBe(0)
  })
})
```

### Step 2: Component Integration Tests

**File**: `apps/entities/app/students/[id]/components/__tests__/PaymentHistoryTimeline.test.tsx`

```tsx
import { describe, it, expect } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { PaymentHistoryTimeline } from '../PaymentHistoryTimeline'

describe('PaymentHistoryTimeline', () => {
  const mockPaymentHistory = [
    {
      installment_id: 'inst-1',
      installment_number: 1,
      amount: 5000,
      due_date: '2025-01-15',
      paid_at: '2025-01-10',
      paid_amount: 5000,
      status: 'paid',
      payment_plan_id: 'plan-1',
      plan_total_amount: 20000,
      plan_start_date: '2025-01-01',
      program_name: 'Certificate IV',
      branch_name: 'Brisbane Campus',
      branch_city: 'Brisbane',
      college_name: 'Imagine Education',
    },
  ]

  const mockSummary = {
    total_paid: 5000,
    total_outstanding: 15000,
    percentage_paid: 25,
  }

  it('should render summary card with correct totals', () => {
    render(
      <PaymentHistoryTimeline
        paymentHistory={mockPaymentHistory}
        summary={mockSummary}
      />
    )

    expect(screen.getByText('$5,000.00')).toBeInTheDocument() // Total Paid
    expect(screen.getByText('$15,000.00')).toBeInTheDocument() // Outstanding
    expect(screen.getByText('25.0%')).toBeInTheDocument() // Percentage
  })

  it('should display payment plans grouped correctly', () => {
    render(
      <PaymentHistoryTimeline
        paymentHistory={mockPaymentHistory}
        summary={mockSummary}
      />
    )

    expect(screen.getByText('Imagine Education - Brisbane Campus')).toBeInTheDocument()
    expect(screen.getByText(/Certificate IV/)).toBeInTheDocument()
  })

  it('should expand and collapse payment plan sections', () => {
    render(
      <PaymentHistoryTimeline
        paymentHistory={mockPaymentHistory}
        summary={mockSummary}
      />
    )

    const planHeader = screen.getByText('Imagine Education - Brisbane Campus')

    // Initially collapsed (no installments visible)
    expect(screen.queryByText('Installment #1')).not.toBeInTheDocument()

    // Click to expand
    fireEvent.click(planHeader)

    // Now installments visible
    expect(screen.getByText('Installment #1')).toBeInTheDocument()
    expect(screen.getByText('Paid')).toBeInTheDocument()
  })

  it('should display correct status badges', () => {
    const historyWithStatuses = [
      { ...mockPaymentHistory[0], status: 'paid' },
      { ...mockPaymentHistory[0], installment_id: 'inst-2', status: 'pending' },
      { ...mockPaymentHistory[0], installment_id: 'inst-3', status: 'overdue' },
    ]

    render(
      <PaymentHistoryTimeline
        paymentHistory={historyWithStatuses}
        summary={mockSummary}
      />
    )

    // Expand plan
    const planHeader = screen.getByText('Imagine Education - Brisbane Campus')
    fireEvent.click(planHeader)

    expect(screen.getByText('Paid')).toHaveClass('text-green-800')
    expect(screen.getByText('Pending')).toHaveClass('text-blue-800')
    expect(screen.getByText('Overdue')).toHaveClass('text-red-800')
  })
})
```

### Step 3: PDF Export Tests

**File**: `apps/entities/app/api/students/[id]/payment-history/export/__tests__/route.test.ts`

```typescript
import { describe, it, expect } from 'vitest'
import { GET } from '../route'

describe('PDF Export API Route', () => {
  it('should generate PDF with correct headers', async () => {
    const mockSupabase = createMockSupabaseClient({
      user: { id: 'user-1', user_metadata: { agency_id: 'agency-1' } },
      student: { id: 'student-1', full_name: 'John Doe' },
      agency: { name: 'Test Agency', logo_url: null },
      paymentHistory: [
        { amount: 5000, status: 'paid' },
      ],
    })

    const request = new Request(
      'http://localhost/api/students/student-1/payment-history/export?format=pdf'
    )
    const response = await GET(request, { params: { id: 'student-1' } })

    expect(response.status).toBe(200)
    expect(response.headers.get('Content-Type')).toBe('application/pdf')
    expect(response.headers.get('Content-Disposition')).toContain('payment_statement')
  })

  it('should sanitize student name in filename', async () => {
    const mockSupabase = createMockSupabaseClient({
      student: { full_name: "John O'Doe (Special)" },
    })

    const request = new Request(
      'http://localhost/api/students/student-1/payment-history/export?format=pdf'
    )
    const response = await GET(request, { params: { id: 'student-1' } })

    const contentDisposition = response.headers.get('Content-Disposition')
    expect(contentDisposition).toContain('john_odoe_special')
    expect(contentDisposition).not.toContain("'")
    expect(contentDisposition).not.toContain('(')
  })

  it('should return 400 for invalid format', async () => {
    const request = new Request(
      'http://localhost/api/students/student-1/payment-history/export?format=xml'
    )
    const response = await GET(request, { params: { id: 'student-1' } })

    expect(response.status).toBe(400)
  })
})
```

### Step 4: E2E Tests with Playwright

**File**: `__tests__/e2e/student-payment-history.spec.ts`

```typescript
import { test, expect } from '@playwright/test'

test.describe('Student Payment History', () => {
  test.beforeEach(async ({ page }) => {
    // Login and navigate to student detail page
    await page.goto('/login')
    await page.fill('[name="email"]', 'test@agency.com')
    await page.fill('[name="password"]', 'password123')
    await page.click('button[type="submit"]')
    await page.waitForURL('/dashboard')

    // Navigate to student detail
    await page.goto('/students/test-student-id')
  })

  test('should display payment history section', async ({ page }) => {
    await expect(page.locator('h2:has-text("Payment History")')).toBeVisible()
  })

  test('should filter by This Year', async ({ page }) => {
    await page.click('button:has-text("This Year")')

    // Wait for data to load
    await page.waitForSelector('[data-testid="payment-timeline"]')

    // Verify filter is applied
    await expect(page.locator('text=/Showing: This Year/')).toBeVisible()
  })

  test('should export PDF', async ({ page }) => {
    const downloadPromise = page.waitForEvent('download')

    await page.click('button:has-text("Export PDF")')

    const download = await downloadPromise
    expect(download.suggestedFilename()).toContain('payment_statement')
    expect(download.suggestedFilename()).toMatch(/\.pdf$/)
  })

  test('should expand and collapse payment plans', async ({ page }) => {
    // Click to expand first payment plan
    await page.click('[data-testid="payment-plan-header"]')

    // Verify installments are visible
    await expect(page.locator('text=/Installment #/')).toBeVisible()

    // Click to collapse
    await page.click('[data-testid="payment-plan-header"]')

    // Verify installments are hidden
    await expect(page.locator('text=/Installment #/')).toBeHidden()
  })

  test('should display empty state for no payment history', async ({ page }) => {
    // Navigate to student with no payment history
    await page.goto('/students/student-no-payments')

    await expect(
      page.locator('text=/No payment history available/')
    ).toBeVisible()

    // Export button should be disabled
    await expect(page.locator('button:has-text("Export PDF")')).toBeDisabled()
  })
})
```

### Step 5: Edge Case Tests

**File**: `apps/entities/app/api/students/[id]/payment-history/__tests__/edge-cases.test.ts`

```typescript
describe('Payment History Edge Cases', () => {
  it('should handle large payment history (100+ installments)', async () => {
    const largeHistory = Array.from({ length: 150 }, (_, i) => ({
      installment_id: `inst-${i}`,
      amount: 1000,
      due_date: `2025-${String(i % 12 + 1).padStart(2, '0')}-15`,
      status: 'paid',
    }))

    const mockSupabase = createMockSupabaseClient({
      paymentHistory: largeHistory,
    })

    const request = new Request('http://localhost/api/students/student-1/payment-history')
    const response = await GET(request, { params: { id: 'student-1' } })

    const data = await response.json()
    expect(data.data).toHaveLength(150)
    expect(response.status).toBe(200)
  })

  it('should handle all paid installments (total_outstanding = 0)', async () => {
    const allPaidHistory = [
      { amount: 5000, paid_at: '2025-01-10', paid_amount: 5000 },
      { amount: 3000, paid_at: '2025-02-10', paid_amount: 3000 },
    ]

    const mockSupabase = createMockSupabaseClient({
      paymentHistory: allPaidHistory,
    })

    const request = new Request('http://localhost/api/students/student-1/payment-history')
    const response = await GET(request, { params: { id: 'student-1' } })

    const data = await response.json()
    expect(data.summary.total_outstanding).toBe(0)
    expect(data.summary.percentage_paid).toBe(100)
  })

  it('should handle cancelled payment plans', async () => {
    const cancelledHistory = [
      { status: 'cancelled', amount: 5000, paid_at: null },
    ]

    const mockSupabase = createMockSupabaseClient({
      paymentHistory: cancelledHistory,
    })

    const request = new Request('http://localhost/api/students/student-1/payment-history')
    const response = await GET(request, { params: { id: 'student-1' } })

    const data = await response.json()
    expect(data.data[0].status).toBe('cancelled')
  })
})
```

## Next Steps

After completing this task:
1. Update manifest.md - mark Task 9 as "Completed" with date
2. Run full test suite and verify all tests pass
3. Check code coverage report (should be >= 80%)
4. Update story status to "completed" in sprint-status.yaml
5. Prepare demo and documentation for stakeholders

## Testing Checklist

### API Route Tests
- [ ] Payment history query returns correct installments
- [ ] Date range filtering works (inclusive bounds)
- [ ] Summary calculations are accurate
- [ ] RLS enforcement prevents cross-agency access
- [ ] Handles student with no payment plans
- [ ] Handles multiple payment plans correctly
- [ ] Returns 401 for unauthenticated requests
- [ ] Returns 404 for non-existent students

### UI Component Tests
- [ ] Timeline displays payment plans grouped correctly
- [ ] Summary card shows correct totals
- [ ] Payment plans expand/collapse correctly
- [ ] Status badges use correct colors
- [ ] Currency formatting is correct
- [ ] Date formatting is correct
- [ ] Empty state displays when no data
- [ ] Loading state displays during fetch

### PDF Export Tests
- [ ] PDF generates with correct headers
- [ ] Filename sanitization works
- [ ] PDF includes all required sections
- [ ] Agency logo displays (if available)
- [ ] Long histories generate multi-page PDFs
- [ ] PDF opens in various readers

### Date Filtering Tests
- [ ] "All Time" shows all installments
- [ ] "This Year" shows current year only
- [ ] "Custom" range filters correctly
- [ ] Invalid date range shows error
- [ ] Filter persists across PDF export

### Edge Case Tests
- [ ] Large payment history (100+ installments)
- [ ] All paid installments (outstanding = 0)
- [ ] Cancelled payment plans
- [ ] Special characters in student names
- [ ] Multiple payment plans per student

### E2E Tests
- [ ] Full user flow: Login → Students → Detail → Payment History → Export
- [ ] Navigation links work correctly
- [ ] Filters work end-to-end
- [ ] PDF download works
- [ ] Works on different browsers (Chrome, Firefox, Safari)

### Code Coverage
- [ ] >= 80% code coverage for API routes
- [ ] >= 80% code coverage for components
- [ ] >= 80% code coverage for utilities
- [ ] All critical paths covered

### Performance
- [ ] API routes respond in < 2 seconds
- [ ] UI renders without lag
- [ ] PDF generation completes in < 5 seconds
- [ ] Large datasets don't freeze UI

### Accessibility
- [ ] Keyboard navigation works
- [ ] Screen readers can navigate
- [ ] ARIA labels are present
- [ ] Color contrast meets WCAG standards

## Final Validation

After all tests pass:
1. ✅ All acceptance criteria validated
2. ✅ Code coverage >= 80%
3. ✅ All edge cases tested
4. ✅ Manual testing completed
5. ✅ Documentation updated
6. ✅ Demo prepared
7. ✅ Story marked as "completed"
