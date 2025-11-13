# Task 10: Testing

**Story Context**: [4-1-payment-plan-creation.context.xml](../../4-1-payment-plan-creation.context.xml)

## Task Description

Write comprehensive tests for payment plan creation including integration tests for API, unit tests for commission calculation, validation tests, RLS policy tests, and E2E test for the complete creation flow.

## Acceptance Criteria

- All acceptance criteria (comprehensive test coverage)

## Subtasks

1. Write integration tests for POST /api/payment-plans

2. Test commission calculation with various amounts and rates

3. Test validation errors (negative amount, invalid enrollment, etc.)

4. Test RLS policies (users cannot create plans for other agencies' enrollments)

5. Write E2E test for payment plan creation flow

6. Test enrollment dropdown loading and selection

7. Test real-time commission preview updates

## Implementation Notes

**File Locations**:
- `__tests__/integration/payment-plans.test.ts` (API integration tests)
- `packages/utils/src/commission-calculator.test.ts` (unit tests)
- `__tests__/e2e/payment-plan-creation.spec.ts` (E2E tests)
- `apps/payments/components/__tests__/EnrollmentSelect.test.tsx` (component tests)

**Integration Tests (API)**:
```typescript
// __tests__/integration/payment-plans.test.ts
import { describe, it, expect, beforeEach } from 'vitest';
import { createTestClient } from '../helpers/test-utils';

describe('POST /api/payment-plans', () => {
  let supabase;
  let testUser;
  let testEnrollment;

  beforeEach(async () => {
    // Setup test data
    supabase = createTestClient();
    testUser = await createTestUser();
    testEnrollment = await createTestEnrollment(testUser.agency_id);
  });

  it('creates payment plan successfully', async () => {
    const response = await fetch('/api/payment-plans', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${testUser.token}`,
      },
      body: JSON.stringify({
        enrollment_id: testEnrollment.id,
        total_amount: 10000,
        start_date: '2025-01-01',
        notes: 'Test payment plan',
        reference_number: 'INV-001',
      }),
    });

    expect(response.status).toBe(201);
    const data = await response.json();
    expect(data.success).toBe(true);
    expect(data.data.total_amount).toBe(10000);
    expect(data.data.expected_commission).toBe(1500); // 15% commission
    expect(data.data.status).toBe('active');
  });

  it('validates total_amount > 0', async () => {
    const response = await fetch('/api/payment-plans', {
      method: 'POST',
      body: JSON.stringify({
        enrollment_id: testEnrollment.id,
        total_amount: -1000,
        start_date: '2025-01-01',
      }),
    });

    expect(response.status).toBe(400);
    const data = await response.json();
    expect(data.error.fields.total_amount).toBeDefined();
  });

  it('validates enrollment exists and belongs to same agency', async () => {
    const otherAgencyEnrollment = await createTestEnrollment('other-agency-id');

    const response = await fetch('/api/payment-plans', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${testUser.token}` },
      body: JSON.stringify({
        enrollment_id: otherAgencyEnrollment.id,
        total_amount: 10000,
        start_date: '2025-01-01',
      }),
    });

    expect(response.status).toBe(400);
    expect(data.error.message).toContain('enrollment');
  });

  it('auto-populates commission_rate from branch', async () => {
    const response = await fetch('/api/payment-plans', {
      method: 'POST',
      body: JSON.stringify({
        enrollment_id: testEnrollment.id,
        total_amount: 10000,
        start_date: '2025-01-01',
      }),
    });

    const data = await response.json();
    expect(data.data.commission_rate_percent).toBe(15); // From test branch
  });
});

describe('GET /api/payment-plans/[id]', () => {
  it('returns payment plan with enrollment details', async () => {
    const paymentPlan = await createTestPaymentPlan();

    const response = await fetch(`/api/payment-plans/${paymentPlan.id}`);
    const data = await response.json();

    expect(data.success).toBe(true);
    expect(data.data.enrollment).toBeDefined();
    expect(data.data.enrollment.student).toBeDefined();
    expect(data.data.enrollment.branch).toBeDefined();
    expect(data.data.enrollment.branch.college).toBeDefined();
  });

  it('returns 404 if payment plan belongs to different agency (RLS)', async () => {
    const otherAgencyPlan = await createTestPaymentPlan('other-agency-id');

    const response = await fetch(`/api/payment-plans/${otherAgencyPlan.id}`, {
      headers: { 'Authorization': `Bearer ${testUser.token}` },
    });

    expect(response.status).toBe(404);
  });
});
```

**Unit Tests (Commission Calculator)**:
```typescript
// packages/utils/src/commission-calculator.test.ts
import { describe, it, expect } from 'vitest';
import { calculateExpectedCommission } from './commission-calculator';

describe('calculateExpectedCommission', () => {
  it('calculates commission correctly', () => {
    expect(calculateExpectedCommission(10000, 15)).toBe(1500.00);
    expect(calculateExpectedCommission(5000, 20)).toBe(1000.00);
    expect(calculateExpectedCommission(3500, 10)).toBe(350.00);
  });

  it('handles 0% commission rate', () => {
    expect(calculateExpectedCommission(10000, 0)).toBe(0);
  });

  it('handles 100% commission rate', () => {
    expect(calculateExpectedCommission(5000, 100)).toBe(5000.00);
  });

  it('rounds to 2 decimal places', () => {
    expect(calculateExpectedCommission(1000, 15.555)).toBe(155.56);
  });

  it('handles edge cases', () => {
    expect(calculateExpectedCommission(0, 15)).toBe(0);
    expect(calculateExpectedCommission(10000, 0)).toBe(0);
  });
});
```

**E2E Tests (Playwright)**:
```typescript
// __tests__/e2e/payment-plan-creation.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Payment Plan Creation Flow', () => {
  test('creates payment plan successfully', async ({ page }) => {
    // Login
    await page.goto('/login');
    await page.fill('input[name="email"]', 'test@example.com');
    await page.fill('input[name="password"]', 'password');
    await page.click('button[type="submit"]');

    // Navigate to create payment plan
    await page.goto('/payments/plans/new');
    await expect(page.locator('h1')).toContainText('Create Payment Plan');

    // Select enrollment
    await page.click('button[role="combobox"]');
    await page.fill('input[placeholder*="Search"]', 'John Doe');
    await page.click('text=John Doe - Harvard University');

    // Fill form
    await page.fill('input[name="total_amount"]', '10000');
    await page.fill('input[name="start_date"]', '2025-01-01');
    await page.fill('textarea[name="notes"]', 'Test payment plan');
    await page.fill('input[name="reference_number"]', 'INV-001');

    // Verify commission preview updates
    await expect(page.locator('text=/Expected Commission/')).toBeVisible();
    await expect(page.locator('text=/\\$1,500.00/')).toBeVisible();

    // Submit form
    await page.click('button[type="submit"]');

    // Verify success
    await expect(page).toHaveURL(/\/payments\/plans\/[a-z0-9-]+/);
    await expect(page.locator('text=Payment plan created')).toBeVisible();
  });

  test('shows validation errors', async ({ page }) => {
    await page.goto('/payments/plans/new');

    // Submit without filling form
    await page.click('button[type="submit"]');

    // Verify validation errors
    await expect(page.locator('text=/Please select a valid enrollment/')).toBeVisible();
    await expect(page.locator('text=/Amount must be greater than 0/')).toBeVisible();
  });

  test('handles empty enrollment state', async ({ page }) => {
    // Navigate to page with no enrollments (mock empty response)
    await page.goto('/payments/plans/new');

    await expect(page.locator('text=/No active enrollments found/')).toBeVisible();
    await expect(page.locator('a[href="/students/new"]')).toBeVisible();
  });
});
```

**Component Tests (EnrollmentSelect)**:
```typescript
// apps/payments/components/__tests__/EnrollmentSelect.test.tsx
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { EnrollmentSelect } from '../EnrollmentSelect';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

describe('EnrollmentSelect', () => {
  it('renders and loads enrollments', async () => {
    render(
      <QueryClientProvider client={new QueryClient()}>
        <EnrollmentSelect value="" onChange={() => {}} />
      </QueryClientProvider>
    );

    await waitFor(() => {
      expect(screen.getByRole('combobox')).toBeInTheDocument();
    });
  });

  it('displays enrollments in correct format', async () => {
    render(
      <QueryClientProvider client={new QueryClient()}>
        <EnrollmentSelect value="" onChange={() => {}} />
      </QueryClientProvider>
    );

    await userEvent.click(screen.getByRole('combobox'));

    await waitFor(() => {
      expect(screen.getByText(/John Doe - Harvard/)).toBeInTheDocument();
    });
  });

  it('filters by search term', async () => {
    render(
      <QueryClientProvider client={new QueryClient()}>
        <EnrollmentSelect value="" onChange={() => {}} />
      </QueryClientProvider>
    );

    await userEvent.click(screen.getByRole('combobox'));
    await userEvent.type(screen.getByPlaceholder(/Search/), 'John');

    await waitFor(() => {
      expect(screen.getByText(/John Doe/)).toBeInTheDocument();
      expect(screen.queryByText(/Jane Smith/)).not.toBeInTheDocument();
    });
  });
});
```

## Related Tasks

- **Depends on**: All previous tasks (tests cover entire feature)
- **Blocks**: None (final task)

## Testing Checklist

- [ ] Integration tests for POST /api/payment-plans pass
- [ ] Integration tests for GET /api/payment-plans/[id] pass
- [ ] Commission calculation unit tests pass
- [ ] Validation error tests pass
- [ ] RLS policy tests pass (cross-agency access blocked)
- [ ] E2E test for payment plan creation flow passes
- [ ] EnrollmentSelect component tests pass
- [ ] Database trigger tests pass
- [ ] Audit logging tests pass
- [ ] Test coverage > 80% for business logic

## References

- [docs/architecture.md](../../../docs/architecture.md) - Testing Strategy (lines 1324-1405)
- Vitest docs: https://vitest.dev/
- Playwright docs: https://playwright.dev/
- React Testing Library: https://testing-library.com/react
