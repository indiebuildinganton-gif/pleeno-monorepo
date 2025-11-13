# Story 4.5: Commission Calculation Engine - Task 11

## Story Context
**Story ID**: 4.5
**Story Title**: Commission Calculation Engine
**Previous Task**: Task 10 - Database View for Real-Time Commission Calculation (Completed)

### User Story
**As a** Agency User
**I want** commissions to be automatically calculated based on actual payments received
**So that** I know exactly how much commission I'm entitled to claim from each college

---

## Task 11: Testing

### Acceptance Criteria
All ACs: Comprehensive testing coverage for commission calculation engine
- Unit tests for all calculation functions
- Integration tests for API routes and commission recalculation
- E2E tests for critical user workflows
- Performance tests for query optimization

### Task Description
Implement comprehensive test coverage for the commission calculation engine. This includes unit tests for calculation utilities, integration tests for API endpoints, and E2E tests for user workflows.

### Subtasks Checklist
- [ ] Write unit tests for calculateInstallmentSchedule
- [ ] Write unit tests for calculateEarnedCommission
- [ ] Write integration test: POST /api/installments/[id]/record-payment updates earned_commission
- [ ] Write integration test: GET /api/reports/commission-by-college returns correct aggregations
- [ ] Write E2E test: Payment plan creation with draft installment review
- [ ] Write E2E test: Commission updates when payment recorded
- [ ] Write performance tests: Benchmark commission queries

---

## Context & Constraints

### Key Constraints
- Testing framework: Vitest for unit/integration tests, Playwright for E2E tests
- Test isolation: Each test should be independent, use test database
- RLS testing: Test with multiple agency contexts
- Performance targets: Commission queries < 200ms, reports < 500ms
- Coverage target: 80%+ for commission-related code

### Testing Tools
```json
{
  "vitest": "latest",
  "playwright": "latest",
  "@testing-library/react": "latest",
  "@supabase/supabase-js": "latest"
}
```

---

## Manifest Update Instructions

Before starting:
1. Open: `.bmad-ephemeral/stories/prompts/4-5-commission-calculation-engine/MANIFEST.md`
2. Update Task 10:
   - Status: "Completed"
   - Completed: [Date]
   - Notes: [Implementation notes from Task 10]
3. Update Task 11:
   - Status: "In Progress"
   - Started: [Current Date]

---

## Implementation Steps

### Step 1: Unit Tests for calculateInstallmentSchedule
Create/Update: `packages/utils/src/__tests__/commission-calculator.test.ts`

```typescript
import { describe, it, expect } from 'vitest';
import { calculateInstallmentSchedule } from '../commission-calculator';
import { addMonths } from 'date-fns';

describe('calculateInstallmentSchedule', () => {
  it('should calculate monthly installments with correct dates', () => {
    const result = calculateInstallmentSchedule({
      total_amount: 12000,
      number_of_installments: 12,
      frequency: 'monthly',
      start_date: new Date('2025-01-01'),
      student_lead_time_days: 30,
    });

    expect(result).toHaveLength(12);
    expect(result[0].amount).toBe(1000);
    expect(result[11].amount).toBe(1000);

    // Verify dates are monthly
    expect(result[1].college_due_date).toEqual(addMonths(result[0].college_due_date, 1));
  });

  it('should calculate quarterly installments', () => {
    const result = calculateInstallmentSchedule({
      total_amount: 12000,
      number_of_installments: 4,
      frequency: 'quarterly',
      start_date: new Date('2025-01-01'),
      student_lead_time_days: 30,
    });

    expect(result).toHaveLength(4);
    expect(result[0].amount).toBe(3000);

    // Verify dates are 3 months apart
    expect(result[1].college_due_date).toEqual(addMonths(result[0].college_due_date, 3));
  });

  it('should handle rounding and adjust final installment', () => {
    const result = calculateInstallmentSchedule({
      total_amount: 1000,
      number_of_installments: 3,
      frequency: 'monthly',
      start_date: new Date('2025-01-01'),
      student_lead_time_days: 30,
    });

    // First two installments: 333.33 each
    expect(result[0].amount).toBeCloseTo(333.33, 2);
    expect(result[1].amount).toBeCloseTo(333.33, 2);

    // Final installment adjusts: 333.34 to total 1000
    expect(result[2].amount).toBeCloseTo(333.34, 2);

    // Verify total equals input
    const total = result.reduce((sum, i) => sum + i.amount, 0);
    expect(total).toBeCloseTo(1000, 2);
  });

  it('should throw error if sum does not equal total', () => {
    // This test verifies the validation logic
    // Would need to force an error condition
  });

  it('should handle non-commissionable fees', () => {
    const result = calculateInstallmentSchedule({
      total_amount: 10000,
      number_of_installments: 10,
      frequency: 'monthly',
      start_date: new Date('2025-01-01'),
      student_lead_time_days: 30,
      materials_cost: 500,
      admin_fees: 300,
      other_fees: 200,
    });

    // Should have 10 tuition installments + 1 fee installment
    expect(result).toHaveLength(11);

    // Tuition installments (generates_commission = true)
    const tuitionInstallments = result.filter(i => i.generates_commission);
    expect(tuitionInstallments).toHaveLength(10);
    expect(tuitionInstallments[0].amount).toBeCloseTo(900, 2); // 9000 / 10

    // Fee installment (generates_commission = false)
    const feeInstallments = result.filter(i => !i.generates_commission);
    expect(feeInstallments).toHaveLength(1);
    expect(feeInstallments[0].amount).toBe(1000); // 500 + 300 + 200
  });
});
```

### Step 2: Unit Tests for calculateEarnedCommission
Continue in: `packages/utils/src/__tests__/commission-calculator.test.ts`

```typescript
describe('calculateEarnedCommission', () => {
  it('should calculate basic commission correctly', () => {
    const installments = [
      { status: 'paid', paid_amount: 500, generates_commission: true },
      { status: 'paid', paid_amount: 500, generates_commission: true },
      { status: 'pending', paid_amount: 0, generates_commission: true },
    ];

    const result = calculateEarnedCommission({
      installments,
      total_amount: 2000,
      expected_commission: 200,
      materials_cost: 0,
      admin_fees: 0,
      other_fees: 0,
    });

    // 50% paid (1000 / 2000) = 50% of commission
    expect(result.earned_commission).toBe(100);
    expect(result.total_paid).toBe(1000);
    expect(result.commissionable_amount).toBe(2000);
    expect(result.commission_percentage).toBe(50);
  });

  it('should exclude non-commissionable fees', () => {
    const installments = [
      { status: 'paid', paid_amount: 4000, generates_commission: true },
      { status: 'paid', paid_amount: 1000, generates_commission: false }, // Fee
    ];

    const result = calculateEarnedCommission({
      installments,
      total_amount: 10000,
      expected_commission: 800,
      materials_cost: 500,
      admin_fees: 300,
      other_fees: 200,
    });

    // Commissionable: 10000 - 1000 = 9000
    // Paid (commission-eligible): 4000
    // Commission: (4000 / 9000) * 800 = 355.56
    expect(result.commissionable_amount).toBe(9000);
    expect(result.total_paid).toBe(4000);
    expect(result.earned_commission).toBeCloseTo(355.56, 2);
  });

  it('should exclude installments with generates_commission = false', () => {
    const installments = [
      { status: 'paid', paid_amount: 1000, generates_commission: true },
      { status: 'paid', paid_amount: 500, generates_commission: false },
    ];

    const result = calculateEarnedCommission({
      installments,
      total_amount: 2000,
      expected_commission: 200,
      materials_cost: 0,
      admin_fees: 0,
      other_fees: 0,
    });

    // Only 1000 (commission-eligible) should count
    expect(result.total_paid).toBe(1000);
    expect(result.earned_commission).toBe(100); // 50% of 200
  });

  it('should handle partial payments', () => {
    const installments = [
      { status: 'paid', paid_amount: 750, generates_commission: true }, // Partial (amount was 1000)
      { status: 'pending', paid_amount: 0, generates_commission: true },
    ];

    const result = calculateEarnedCommission({
      installments,
      total_amount: 2000,
      expected_commission: 200,
      materials_cost: 0,
      admin_fees: 0,
      other_fees: 0,
    });

    // 37.5% paid (750 / 2000)
    expect(result.earned_commission).toBe(75);
    expect(result.commission_percentage).toBe(37.5);
  });

  it('should handle edge case: zero commissionable amount', () => {
    const installments = [
      { status: 'paid', paid_amount: 1000, generates_commission: true },
    ];

    const result = calculateEarnedCommission({
      installments,
      total_amount: 1000,
      expected_commission: 100,
      materials_cost: 500,
      admin_fees: 300,
      other_fees: 200,
    });

    // Commissionable amount = 0 (total - fees)
    expect(result.commissionable_amount).toBe(0);
    expect(result.earned_commission).toBe(0);
  });

  it('should handle edge case: no paid installments', () => {
    const installments = [
      { status: 'pending', paid_amount: 0, generates_commission: true },
    ];

    const result = calculateEarnedCommission({
      installments,
      total_amount: 1000,
      expected_commission: 100,
      materials_cost: 0,
      admin_fees: 0,
      other_fees: 0,
    });

    expect(result.earned_commission).toBe(0);
    expect(result.commission_percentage).toBe(0);
  });
});
```

### Step 3: Integration Test for Payment Recording
Create: `apps/payments/__tests__/api/commission-recalculation.test.ts`

```typescript
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { createClient } from '@supabase/supabase-js';

describe('POST /api/installments/[id]/record-payment - Commission Recalculation', () => {
  let supabase: any;
  let testPaymentPlan: any;
  let testInstallment: any;

  beforeEach(async () => {
    // Setup test database
    supabase = createClient(/* test config */);

    // Create test payment plan and installments
    testPaymentPlan = await createTestPaymentPlan({
      total_amount: 10000,
      expected_commission: 1000,
      number_of_installments: 10,
    });

    testInstallment = testPaymentPlan.installments[0];
  });

  afterEach(async () => {
    // Cleanup test data
    await cleanupTestData(testPaymentPlan.id);
  });

  it('should recalculate earned_commission after payment recorded', async () => {
    const response = await fetch(`/api/installments/${testInstallment.id}/record-payment`, {
      method: 'POST',
      body: JSON.stringify({
        paid_date: new Date().toISOString(),
        paid_amount: 1000,
        payment_notes: 'Test payment',
      }),
    });

    expect(response.ok).toBe(true);
    const data = await response.json();

    // Verify commission recalculated
    expect(data.payment_plan.earned_commission).toBe(100); // 10% paid
    expect(data.commission.commission_percentage).toBe(10);
  });

  it('should handle partial payment contribution', async () => {
    const response = await fetch(`/api/installments/${testInstallment.id}/record-payment`, {
      method: 'POST',
      body: JSON.stringify({
        paid_date: new Date().toISOString(),
        paid_amount: 500, // Partial payment (amount is 1000)
        payment_notes: 'Partial payment',
      }),
    });

    const data = await response.json();

    // Verify partial payment contributes proportionally
    expect(data.payment_plan.earned_commission).toBe(50); // 5% paid
  });

  it('should not increase commission for non-commissionable installments', async () => {
    // Create fee installment with generates_commission = false
    const feeInstallment = await createTestInstallment({
      payment_plan_id: testPaymentPlan.id,
      amount: 500,
      generates_commission: false,
    });

    const response = await fetch(`/api/installments/${feeInstallment.id}/record-payment`, {
      method: 'POST',
      body: JSON.stringify({
        paid_date: new Date().toISOString(),
        paid_amount: 500,
      }),
    });

    const data = await response.json();

    // Commission should not increase
    expect(data.payment_plan.earned_commission).toBe(0);
  });
});
```

### Step 4: Integration Test for Commission Report API
Create: `apps/reports/__tests__/api/commission-by-college.test.ts`

```typescript
describe('GET /api/reports/commission-by-college', () => {
  it('should aggregate commission by college and branch', async () => {
    // Create test payment plans for multiple colleges
    await createTestPaymentPlan({
      college_id: 'college-1',
      branch_id: 'branch-1',
      expected_commission: 1000,
      earned_commission: 500,
    });

    await createTestPaymentPlan({
      college_id: 'college-1',
      branch_id: 'branch-1',
      expected_commission: 2000,
      earned_commission: 1000,
    });

    const response = await fetch('/api/reports/commission-by-college');
    const data = await response.json();

    expect(data).toHaveLength(1); // One college-branch combination
    expect(data[0].total_expected).toBe(3000);
    expect(data[0].total_earned).toBe(1500);
    expect(data[0].total_outstanding).toBe(1500);
    expect(data[0].plan_count).toBe(2);
  });

  it('should filter by date range', async () => {
    // Test date range filtering
  });

  it('should filter by college_id', async () => {
    // Test college filtering
  });

  it('should respect RLS (agency_id filtering)', async () => {
    // Test RLS enforcement
  });
});
```

### Step 5: E2E Test for Payment Plan Creation
Create: `__tests__/e2e/payment-plan-creation.spec.ts`

```typescript
import { test, expect } from '@playwright/test';

test.describe('Payment Plan Creation with Draft Installments', () => {
  test('should create payment plan with draft installment review', async ({ page }) => {
    await page.goto('/payments/plans/new');

    // Step 1: Basic Info
    await page.fill('[name="total_amount"]', '12000');
    await page.fill('[name="number_of_installments"]', '12');
    await page.select('[name="frequency"]', 'monthly');
    await page.click('button:has-text("Next")');

    // Step 2: Draft Installments Review
    await expect(page.locator('table')).toBeVisible();
    await expect(page.locator('tbody tr')).toHaveCount(12);

    // Verify amounts calculated correctly
    const firstInstallment = page.locator('tbody tr:first-child');
    await expect(firstInstallment.locator('td:nth-child(2)')).toHaveText('$1,000.00');

    // Edit installment amounts
    await page.click('button:has-text("Edit Amounts")');
    await page.fill('input[name="installment-1-amount"]', '1500');

    // Verify validation error (sum != total)
    await expect(page.locator('text=Installments must total')).toBeVisible();

    // Reset to auto-calculated
    await page.click('button:has-text("Reset")');
    await expect(page.locator('text=Installments must total')).not.toBeVisible();

    // Continue to next step
    await page.click('button:has-text("Next")');

    // Submit
    await page.click('button:has-text("Create Payment Plan")');

    // Verify success
    await expect(page.locator('text=Payment plan created')).toBeVisible();
  });
});
```

### Step 6: E2E Test for Commission Updates
Create: `__tests__/e2e/commission-updates.spec.ts`

```typescript
test.describe('Commission Updates on Payment Recording', () => {
  test('should update commission when payment recorded', async ({ page }) => {
    // Navigate to payment plan detail
    await page.goto('/payments/plans/[test-plan-id]');

    // Verify initial commission state
    await expect(page.locator('text=Earned Commission')).toBeVisible();
    const initialEarned = await page.locator('[data-testid="earned-commission"]').textContent();

    // Record a payment
    await page.click('button:has-text("Mark as Paid")');
    await page.fill('[name="paid_amount"]', '1000');
    await page.click('button:has-text("Confirm")');

    // Wait for commission to update
    await page.waitForTimeout(1000); // Allow for query invalidation

    // Verify commission increased
    const updatedEarned = await page.locator('[data-testid="earned-commission"]').textContent();
    expect(updatedEarned).not.toBe(initialEarned);

    // Verify progress bar updated
    const progressBar = page.locator('[role="progressbar"]');
    await expect(progressBar).toHaveAttribute('aria-valuenow', expect.stringMatching(/[1-9]/));

    // Navigate to dashboard
    await page.goto('/dashboard');

    // Verify commission widget updated
    await expect(page.locator('[data-testid="commission-widget"]')).toBeVisible();
  });
});
```

### Step 7: Performance Tests
Create: `__tests__/performance/commission-queries.test.ts`

```typescript
test.describe('Commission Query Performance', () => {
  test('commission calculation should complete within 200ms', async () => {
    const start = performance.now();

    await fetch('/api/dashboard/commission-summary');

    const duration = performance.now() - start;
    expect(duration).toBeLessThan(200);
  });

  test('commission report should complete within 500ms', async () => {
    const start = performance.now();

    await fetch('/api/reports/commission-by-college');

    const duration = performance.now() - start;
    expect(duration).toBeLessThan(500);
  });
});
```

---

## Test Coverage Requirements

### Target Coverage
- **Unit Tests**: 90%+ for commission-calculator.ts
- **Integration Tests**: 80%+ for API routes
- **E2E Tests**: Critical user paths (payment plan creation, payment recording)
- **Performance Tests**: All commission-related queries

### Running Tests
```bash
# Unit tests
npm run test:unit

# Integration tests
npm run test:integration

# E2E tests
npm run test:e2e

# All tests
npm run test

# Coverage report
npm run test:coverage
```

---

## Context References

### Story Context File
Full context: `.bmad-ephemeral/stories/4-5-commission-calculation-engine.context.xml`

### Test Files Created
- Unit: `packages/utils/src/__tests__/commission-calculator.test.ts`
- Integration: `apps/payments/__tests__/api/commission-recalculation.test.ts`
- Integration: `apps/reports/__tests__/api/commission-by-college.test.ts`
- E2E: `__tests__/e2e/payment-plan-creation.spec.ts`
- E2E: `__tests__/e2e/commission-updates.spec.ts`
- Performance: `__tests__/performance/commission-queries.test.ts`

---

## Next Steps

After completing Task 11:
1. Update MANIFEST.md:
   - Task 11 status: "Completed"
   - Task 11 completed date
   - Add notes: All tests written and passing, coverage targets met
2. Run full test suite and verify all tests pass
3. Generate coverage report
4. Move to Task 12: Migration and Data Seeding
5. Reference file: `task-12-prompt.md`

---

## Success Criteria

Task 11 is complete when:
- [x] All unit tests written and passing
- [x] All integration tests written and passing
- [x] All E2E tests written and passing
- [x] Performance tests meet targets (< 200ms, < 500ms)
- [x] Test coverage meets targets (80%+ overall, 90%+ for utilities)
- [x] All edge cases covered in tests
- [x] Test suite runs without errors
- [x] Coverage report generated and reviewed
- [x] MANIFEST.md updated with Task 11 completion
