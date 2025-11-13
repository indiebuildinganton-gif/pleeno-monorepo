# Task 13: Testing

**Story:** 4.2 Flexible Installment Structure
**Acceptance Criteria:** All
**Status:** pending

## Context

This task implements comprehensive testing for the entire payment plan wizard flow, including unit tests for utilities, integration tests for API endpoints, component tests for UI, and E2E tests for the complete 3-step wizard.

## Task Description

Create a complete test suite covering all layers of the payment plan wizard: utilities, components, API routes, database operations, and end-to-end flows.

## Subtasks

### Unit Tests - Commission Calculator Utilities

- [ ] Create file: `packages/utils/src/__tests__/commission-calculator.test.ts`
- [ ] Test `calculateCommissionableValue()`:
  - With no fees (result = total_course_value)
  - With materials_cost only
  - With all three fees (materials, admin, other)
  - Edge case: fees sum to total_course_value (result = 0)
  - Edge case: negative fees (should not occur with validation, but test)
- [ ] Test `calculateExpectedCommission()`:
  - With gst_inclusive = true (no GST adjustment)
  - With gst_inclusive = false (divide by 1.10 to remove GST)
  - With commission_rate = 0 (result = 0)
  - With commission_rate = 1 (result = 100% of base)
  - With commission_rate = 0.15 (typical 15%)
  - Edge case: commissionable_value = 0 (result = 0)

### Unit Tests - Date Helper Utilities

- [ ] Create file: `packages/utils/src/__tests__/date-helpers.test.ts`
- [ ] Test `calculateStudentDueDate()`:
  - With student_lead_time_days = 7
  - With student_lead_time_days = 14
  - With student_lead_time_days = 30
  - Edge case: lead time = 0 (same date)
  - Verify uses date-fns subDays correctly
- [ ] Test `calculateCollegeDueDate()`:
  - With student_lead_time_days = 7
  - Verify reverse calculation: calculateCollegeDueDate(calculateStudentDueDate(date, n), n) === date
- [ ] Test `generateInstallmentDueDates()`:
  - Monthly frequency with count = 1
  - Monthly frequency with count = 11
  - Quarterly frequency with count = 4
  - Verify dates are exactly 1 month apart (monthly)
  - Verify dates are exactly 3 months apart (quarterly)
  - Edge cases: count = 0, invalid frequency
  - Date edge cases: month boundaries (Jan 31 → Feb 28), leap years

### Integration Tests - Generate Installments API

- [ ] Create file: `apps/payments/__tests__/integration/generate-installments-api.test.ts`
- [ ] Test POST /api/payment-plans/[id]/generate-installments:
  - Success case: valid request body returns installments
  - With initial_payment_paid = true: initial installment status = 'paid'
  - With initial_payment_amount = 0: no initial installment
  - Monthly frequency: verify 1 month intervals
  - Quarterly frequency: verify 3 month intervals
  - Verify amounts sum to commissionable_value
  - Verify student due dates = college due dates - lead time
  - Error cases:
    - Invalid payment_frequency
    - Negative amounts
    - Missing required fields
    - Unauthorized (no auth token)

### Integration Tests - Payment Plan Creation API

- [ ] Create file: `apps/payments/__tests__/integration/payment-plans-api.test.ts`
- [ ] Test POST /api/payment-plans:
  - Success case: payment plan + installments created
  - With initial payment paid: initial installment status = 'paid'
  - With initial payment unpaid: all installments status = 'draft'
  - Without initial payment: no installment 0
  - Verify payment_plan record created with all fields
  - Verify installments created with correct data
  - Verify commission auto-calculated by trigger
  - Verify transaction atomicity:
    - Mock installments insert failure → payment plan not created
  - Error cases:
    - Validation error: installments sum mismatch
    - Student not owned by agency (403 Forbidden)
    - Empty installments array
    - Missing required fields
    - Unauthorized (401)

### Component Tests - Wizard Steps

- [ ] Create file: `apps/payments/__tests__/components/PaymentPlanWizardStep1.test.tsx`
- [ ] Test Step 1 component:
  - Form validation: all required fields enforced
  - Invalid commission rate (< 0 or > 1) shows error
  - End date before start date shows error
  - Student dropdown loads from API
  - Selecting student auto-populates college/branch
  - "Next" button disabled when form invalid
  - "Next" button enabled when form valid
  - Clicking "Next" saves data and navigates to Step 2

- [ ] Create file: `apps/payments/__tests__/components/PaymentPlanWizardStep2.test.tsx`
- [ ] Test Step 2 component:
  - Form validation: required fields enforced
  - Initial payment due date required when amount > 0
  - Real-time summary updates:
    - Change materials_cost → commissionable value decreases
    - Toggle gst_inclusive → commission changes
  - Conditional field enabling:
    - Initial payment fields disabled when amount = 0
  - Student due date preview updates in real-time
  - "Generate Installments" calls API on submit
  - Success: navigates to Step 3 with generated installments
  - Error: displays error message

- [ ] Create file: `apps/payments/__tests__/components/PaymentPlanWizardStep3.test.tsx`
- [ ] Test Step 3 component:
  - Summary displays all data correctly
  - Commission highlighted in green
  - Installment table displays all installments
  - Initial payment row styled differently
  - Validation:
    - Valid amounts: green banner, "Create" enabled
    - Invalid amounts: red banner, "Create" disabled
  - "Edit Step 1" navigates to Step 1
  - "Edit Step 2" navigates to Step 2
  - "Create Payment Plan" calls API
  - Success: redirects to payment plan detail
  - Error: displays error message

### Component Tests - Installment Table

- [ ] Create file: `apps/payments/__tests__/components/InstallmentTable.test.tsx`
- [ ] Test InstallmentTable component:
  - Renders empty state when installments = []
  - Renders initial payment row with "Initial Payment" label
  - Renders regular installments with "Installment N" labels
  - Formats currency correctly
  - Formats dates correctly
  - Displays status badges with correct colors
  - Initial payment row has bold styling
  - Table footer shows correct total
  - Sorting works (if implemented)

### E2E Tests - Full Wizard Flow

- [ ] Create file: `__tests__/e2e/payment-plan-wizard.spec.ts`
- [ ] Test complete wizard flow:
  - Navigate to /plans/new
  - **Step 1:**
    - Select student from dropdown
    - Enter course name, total value, commission rate
    - Select start and end dates
    - Click "Next"
  - **Step 2:**
    - Enter initial payment amount and due date
    - Toggle "already paid"
    - Enter number of installments
    - Select payment frequency (monthly)
    - Enter non-commissionable fees
    - Enter first college due date
    - Enter student lead time
    - Verify real-time summary updates
    - Click "Generate Installments"
  - **Step 3:**
    - Verify summary displays correctly
    - Verify installment table displays all installments
    - Verify validation passes (green banner)
    - Click "Create Payment Plan"
  - **Verification:**
    - Redirected to payment plan detail page
    - Query database: payment plan exists
    - Query database: installments exist
    - Verify commission calculations are accurate
    - Verify audit log entry created

- [ ] Test edit and regenerate flow:
  - Complete to Step 3
  - Click "Edit Step 2"
  - Change materials_cost
  - Regenerate installments
  - Return to Step 3
  - Verify installments updated
  - Verify commission recalculated

- [ ] Test navigation and state persistence:
  - Complete Step 1 → Step 2
  - Click "Back" to Step 1
  - Verify data preserved
  - Modify data
  - Proceed to Step 2
  - Verify updated data

- [ ] Test validation error handling:
  - Enter invalid data in Step 1
  - Verify "Next" disabled
  - Fix errors
  - Verify "Next" enabled
  - Repeat for Steps 2 and 3

### Database Tests - RLS Policies

- [ ] Create file: `__tests__/database/installments-rls.test.ts`
- [ ] Test RLS policies on installments table:
  - User can query installments for their agency
  - User cannot query installments for other agencies
  - User can insert installments for their agency
  - User cannot insert installments for other agencies
  - User can update installments for their agency
  - User cannot update installments for other agencies

### Database Tests - Triggers

- [ ] Create file: `__tests__/database/commission-triggers.test.ts`
- [ ] Test commission calculation trigger:
  - INSERT payment plan → commissionable_value auto-calculated
  - INSERT payment plan → expected_commission auto-calculated
  - UPDATE payment plan (change fees) → commissionable_value recalculated
  - UPDATE payment plan (toggle gst_inclusive) → expected_commission recalculated
  - Verify calculations match expected values

## Technical Requirements

**Testing Frameworks:**
- Vitest for unit and integration tests
- React Testing Library for component tests
- Playwright for E2E tests

**Test File Locations:**
```
packages/utils/src/__tests__/
  ├── commission-calculator.test.ts
  └── date-helpers.test.ts

apps/payments/__tests__/
  ├── integration/
  │   ├── generate-installments-api.test.ts
  │   └── payment-plans-api.test.ts
  └── components/
      ├── PaymentPlanWizardStep1.test.tsx
      ├── PaymentPlanWizardStep2.test.tsx
      ├── PaymentPlanWizardStep3.test.tsx
      └── InstallmentTable.test.tsx

__tests__/
  ├── e2e/
  │   └── payment-plan-wizard.spec.ts
  └── database/
      ├── installments-rls.test.ts
      └── commission-triggers.test.ts
```

**Test Data Helpers:**
```typescript
// __tests__/helpers/payment-plan-fixtures.ts

export const createTestStudent = () => ({
  id: '123e4567-e89b-12d3-a456-426614174000',
  name: 'John Doe',
  agency_id: 'agency-1',
  branch_id: 'branch-1',
})

export const createTestPaymentPlanWizardData = () => ({
  student_id: '123e4567-e89b-12d3-a456-426614174000',
  course_name: 'Bachelor of Business',
  total_course_value: 10000,
  commission_rate: 0.15,
  course_start_date: '2025-02-01',
  course_end_date: '2025-12-31',
  initial_payment_amount: 2000,
  initial_payment_due_date: '2025-02-01',
  initial_payment_paid: false,
  number_of_installments: 4,
  payment_frequency: 'quarterly',
  materials_cost: 500,
  admin_fees: 200,
  other_fees: 100,
  first_college_due_date: '2025-03-15',
  student_lead_time_days: 7,
  gst_inclusive: true,
})

export const createTestInstallments = () => [
  {
    installment_number: 0,
    amount: 2000,
    student_due_date: '2025-02-01',
    college_due_date: '2025-02-08',
    is_initial_payment: true,
    generates_commission: true,
  },
  {
    installment_number: 1,
    amount: 2000,
    student_due_date: '2025-03-08',
    college_due_date: '2025-03-15',
    is_initial_payment: false,
    generates_commission: true,
  },
  // ... more installments
]
```

## Acceptance Criteria

✅ **AC All:** Comprehensive testing
- Unit tests for commission calculation utilities
- Unit tests for date calculation utilities
- Integration tests for API endpoints
- Component tests for wizard steps
- E2E tests for full wizard flow
- Database tests for RLS policies and triggers
- All tests pass and cover edge cases

## References

**From Story Context:**
- All previous tasks (1-12) have test requirements
- Architecture: Testing standards (Vitest, RTL, Playwright)
- Test coverage target: 80%+

## Testing Checklist

### Unit Test Coverage

- [ ] Commission calculator: 100% coverage
- [ ] Date helpers: 100% coverage

### Integration Test Coverage

- [ ] Generate installments API: All success and error cases
- [ ] Payment plan creation API: All success and error cases
- [ ] Database triggers: All scenarios

### Component Test Coverage

- [ ] Step 1: All form validations and interactions
- [ ] Step 2: All form validations, real-time updates, API calls
- [ ] Step 3: All display logic, validation, navigation, API calls
- [ ] InstallmentTable: All rendering scenarios

### E2E Test Coverage

- [ ] Full wizard flow (happy path)
- [ ] Edit and regenerate flow
- [ ] Navigation and state persistence
- [ ] Validation error handling

### Database Test Coverage

- [ ] RLS policies: All CRUD operations
- [ ] Commission triggers: All INSERT/UPDATE scenarios

## Dev Notes

**Testing Philosophy:**

1. **Unit Tests:** Fast, isolated, test pure functions
2. **Integration Tests:** Test API routes with real database (test environment)
3. **Component Tests:** Test UI logic, user interactions, not implementation details
4. **E2E Tests:** Test critical user journeys end-to-end

**Test Database Setup:**

Use separate test database:
```typescript
// vitest.config.ts
export default defineConfig({
  test: {
    setupFiles: ['./test-setup.ts'],
    environment: 'node',
  },
})

// test-setup.ts
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.TEST_SUPABASE_URL!,
  process.env.TEST_SUPABASE_KEY!
)

// Reset database before each test suite
beforeEach(async () => {
  await supabase.from('payment_plans').delete().neq('id', '')
  await supabase.from('installments').delete().neq('id', '')
})
```

**Mocking:**

Mock external dependencies:
```typescript
// Mock Supabase client for unit tests
vi.mock('@supabase/supabase-js', () => ({
  createClient: () => ({
    from: () => ({
      insert: vi.fn().mockResolvedValue({ data: [], error: null }),
      select: vi.fn().mockResolvedValue({ data: [], error: null }),
    }),
  }),
}))
```

**Component Testing Best Practices:**

Test user behavior, not implementation:
```typescript
// ❌ Bad: Testing implementation details
expect(form.state.values.commission_rate).toBe(0.15)

// ✓ Good: Testing user-visible behavior
const input = screen.getByLabelText('Commission Rate')
expect(input).toHaveValue('0.15')
```

**E2E Testing Best Practices:**

Use data-testid for reliable selectors:
```tsx
<Button data-testid="wizard-next-button">Next</Button>
```

```typescript
await page.getByTestId('wizard-next-button').click()
```

**Snapshot Testing:**

Use for complex UI components:
```typescript
it('renders installment table correctly', () => {
  const { container } = render(<InstallmentTable installments={testData} />)
  expect(container).toMatchSnapshot()
})
```

**Test Coverage Reporting:**

Run coverage report:
```bash
npm run test:coverage
```

Target: 80%+ coverage for critical code paths.

**CI/CD Integration:**

Run tests in CI pipeline:
```yaml
# .github/workflows/test.yml
name: Test
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - run: npm install
      - run: npm run test
      - run: npm run test:e2e
```

**Test Naming Convention:**

Use descriptive test names:
```typescript
describe('calculateCommissionableValue', () => {
  it('subtracts all fees from total course value', () => {
    // ...
  })

  it('returns zero when fees equal total course value', () => {
    // ...
  })

  it('returns total course value when no fees are provided', () => {
    // ...
  })
})
```

**Performance Testing:**

Consider adding performance tests for:
- API response time (should be < 200ms)
- Database query performance (use EXPLAIN ANALYZE)
- Wizard step transitions (should be < 100ms)
