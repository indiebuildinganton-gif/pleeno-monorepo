# Task 8: Testing

**Story:** 7.1 - Payment Plans Report Generator with Contract Expiration Tracking
**Acceptance Criteria:** All ACs

---

## Task Overview

Write comprehensive tests for the Payment Plans Report feature using Vitest (unit tests), React Testing Library (component tests), and Playwright (E2E tests).

---

## Requirements

### Test Coverage

1. **API Route Unit Tests (Vitest)**
2. **Component Tests (React Testing Library)**
3. **Integration Tests (Playwright)**

---

## 1. API Route Unit Tests

**Location:** `apps/reports/app/api/reports/payment-plans/__tests__/route.test.ts`

### Tests to Write

```typescript
describe('POST /api/reports/payment-plans', () => {
  // Setup: Mock Supabase client
  beforeEach(() => {
    // Mock createClient()
  })

  it('should return payment plans with all joined data', async () => {
    // Test basic query returns data with students, colleges, branches
  })

  it('should filter by date range', async () => {
    // Test date_from and date_to filtering
  })

  it('should filter by college_ids', async () => {
    // Test college filtering
  })

  it('should filter by branch_ids', async () => {
    // Test branch filtering
  })

  it('should filter by student_ids', async () => {
    // Test student filtering
  })

  it('should filter by status', async () => {
    // Test status filtering (pending, paid, overdue, cancelled)
  })

  it('should filter by contract expiration date range', async () => {
    // Test contract_expiration_from and contract_expiration_to
  })

  it('should calculate computed fields correctly', async () => {
    // Test total_paid, earned_commission, days_until_contract_expiration
  })

  it('should calculate summary totals', async () => {
    // Test total_plan_amount, total_paid_amount, total_commission
  })

  it('should paginate results', async () => {
    // Test LIMIT/OFFSET with page and page_size
  })

  it('should sort results by column and direction', async () => {
    // Test ORDER BY with column and direction (asc/desc)
  })

  it('should enforce RLS (only agency data)', async () => {
    // Mock different users → Verify only their agency data returned
  })

  it('should return only requested columns', async () => {
    // Test column selection
  })

  it('should reject request with no columns', async () => {
    // Test validation: at least one column required
  })

  it('should reject invalid date range', async () => {
    // Test validation: date_from <= date_to
  })
})
```

### Lookup API Tests

**Locations:**
- `apps/reports/app/api/reports/lookup/colleges/__tests__/route.test.ts`
- `apps/reports/app/api/reports/lookup/branches/__tests__/route.test.ts`
- `apps/reports/app/api/reports/lookup/students/__tests__/route.test.ts`

```typescript
describe('Lookup APIs', () => {
  describe('GET /api/reports/lookup/colleges', () => {
    it('should return only agency colleges', async () => {})
    it('should include branch count', async () => {})
  })

  describe('GET /api/reports/lookup/branches', () => {
    it('should filter by college_id', async () => {})
    it('should return all branches if no college_id', async () => {})
  })

  describe('GET /api/reports/lookup/students', () => {
    it('should search by name', async () => {})
    it('should reject search < 2 chars', async () => {})
    it('should limit to 50 results', async () => {})
  })
})
```

---

## 2. Component Tests

**Location:** `apps/reports/app/components/__tests__/`

### ReportBuilder Tests

**File:** `ReportBuilder.test.tsx`

```typescript
describe('ReportBuilder', () => {
  it('should render all filter inputs', () => {
    // Test date range, college, branch, student, status, contract expiration filters
  })

  it('should render column selection checkboxes', () => {
    // Test all available columns render
  })

  it('should require at least one column', () => {
    // Test validation error when no columns selected
  })

  it('should render preset filter buttons', () => {
    // Test "Expiring in 30/60/90 days", "Already expired" buttons
  })

  it('should populate filters on preset click', () => {
    // Test clicking preset sets date filters
  })

  it('should validate date range (from <= to)', () => {
    // Test validation error when date_from > date_to
  })

  it('should call onGenerate on form submit', () => {
    // Test form submission
  })

  it('should reset form on Reset button click', () => {
    // Test "Reset Filters" button
  })
})
```

### ReportResultsTable Tests

**File:** `ReportResultsTable.test.tsx`

```typescript
describe('ReportResultsTable', () => {
  it('should render table with mock data', () => {
    // Test table renders with PaymentPlanReportRow[]
  })

  it('should format currency columns', () => {
    // Test formatCurrency() applied to plan_amount, total_paid, commission
  })

  it('should format date columns', () => {
    // Test date formatting for contract_expiration_date
  })

  it('should render status badges', () => {
    // Test status badge with color coding
  })

  it('should render contract expiration badges', () => {
    // Test ContractExpirationBadge with different days values
  })

  it('should highlight expired contracts (red)', () => {
    // Test row with contract_status='expired' has red background
  })

  it('should highlight expiring soon contracts (orange)', () => {
    // Test row with days < 7 has orange background
  })

  it('should highlight warning contracts (yellow)', () => {
    // Test row with days < 30 has yellow background
  })

  it('should render summary totals footer', () => {
    // Test footer row with totals
  })

  it('should call onSort when column header clicked', () => {
    // Test sorting callback
  })

  it('should render pagination controls', () => {
    // Test page size, prev/next buttons, page input
  })

  it('should call onPageChange when page changes', () => {
    // Test pagination callback
  })

  it('should show loading state', () => {
    // Test skeleton rows
  })

  it('should show empty state', () => {
    // Test empty message when no data
  })
})
```

---

## 3. Integration Tests (Playwright)

**Location:** `__tests__/e2e/reports/payment-plans.spec.ts`

### E2E Test Flows

```typescript
describe('Payment Plans Report', () => {
  test('should navigate to reports page', async ({ page }) => {
    // Login → Navigate to /reports → Verify page loads
  })

  test('should generate report with filters', async ({ page }) => {
    // Set date range, college → Select columns → Generate → Verify results
  })

  test('should use preset filter (Expiring in 30 days)', async ({ page }) => {
    // Click preset → Generate → Verify highlighted rows
  })

  test('should sort table by column', async ({ page }) => {
    // Generate report → Click column header → Verify results reorder
  })

  test('should change page size', async ({ page }) => {
    // Generate report → Change page size → Verify pagination updates
  })

  test('should navigate to page 2', async ({ page }) => {
    // Generate report → Click Next → Verify different results
  })

  test('should reset filters', async ({ page }) => {
    // Set filters → Generate → Click Reset → Verify form clears and results hide
  })

  test('should filter by expired contracts', async ({ page }) => {
    // Click "Already expired" preset → Generate → Verify red highlighted rows
  })

  test('should display contract expiration badges', async ({ page }) => {
    // Generate report → Verify badges show correct urgency colors
  })

  test('should be responsive (mobile)', async ({ page }) => {
    // Test on mobile viewport → Verify card layout instead of table
  })
})
```

---

## Technical Constraints

- **Vitest:** Use for unit tests
- **React Testing Library:** Use for component tests
- **Playwright:** Use for E2E tests
- **Mock Supabase:** Mock `createClient()` in API tests
- **MSW (optional):** Use Mock Service Worker for API mocking in component tests
- **Test Coverage:** Target 80%+ for business logic

---

## Acceptance Criteria

✅ API route unit tests written (payment-plans, lookup APIs)
✅ Component tests written (ReportBuilder, ReportResultsTable)
✅ E2E tests written (critical user flows)
✅ All tests passing
✅ Test coverage >= 80% for business logic
✅ RLS enforcement tested (mock different agencies)
✅ Contract expiration highlighting tested
✅ Responsive layout tested (mobile viewport)

---

## Reference Code

See story markdown for:
- Testing standards (lines 903-957)
- Test ideas by AC (lines 359-417)

---

## Output

After implementing:
1. Show all test files created
2. Run tests: `npm run test` (unit + component)
3. Run E2E tests: `npm run test:e2e`
4. Show test coverage report
5. Verify all tests pass
6. Document any failing tests or known issues
