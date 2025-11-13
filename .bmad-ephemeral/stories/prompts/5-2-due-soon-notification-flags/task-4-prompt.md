# Story 5.2: Due Soon Notification Flags - Task 4

## Story Context

**As an** Agency User
**I want** to see visual indicators for payments due within the next 4 days
**So that** I can proactively follow up before payments become overdue, including weekend and early-week payments

## Task 4: Testing and validation

### Previous Tasks Completion

✅ Task 1 implemented the backend foundation:
- Database schema with configurable threshold
- Query logic for "due soon" calculation
- Agency settings API

✅ Task 2 implemented the UI layer:
- Badge components for visual indicators
- Dashboard widget showing due soon count
- Payment plan views with due soon status
- Filter functionality

✅ Task 3 implemented the notification system:
- Student notifications database table
- Scheduled job for email reminders
- Email template with React Email
- Resend API integration
- Error handling and logging

### Task Description

Implement comprehensive testing across all layers of the "due soon" notification feature. This includes unit tests for calculation logic, integration tests for the notification system, component tests for UI elements, and end-to-end validation of the complete user flow.

### Subtasks Checklist

- [ ] Unit tests for is_due_soon calculation logic
- [ ] Integration tests for notification sending job
- [ ] Test with different due_soon_threshold_days values (2, 4, 7 days)
- [ ] Test notification timing (ensure 5:00 AM Brisbane / 7:00 PM UTC execution)
- [ ] Test with various timezone scenarios
- [ ] Verify badge colors and dashboard counts update correctly

### Acceptance Criteria

This task validates all acceptance criteria:
- **AC1**: Installments due within threshold are flagged correctly
- **AC2**: Badges display with correct warning colors
- **AC3**: Dashboard shows accurate count
- **AC4**: Filter functionality works correctly
- **AC5**: Threshold is configurable
- **AC6-8**: Notifications sent at correct time with correct content

### Test Categories

## 1. Unit Tests

### Date Calculation Logic (packages/utils/src/date-helpers.test.ts)

Test the isDueSoon() utility function:

```typescript
describe('isDueSoon', () => {
  it('returns true for installment due in 3 days with 4-day threshold', () => {
    const dueDate = addDays(new Date(), 3);
    const threshold = 4;
    expect(isDueSoon(dueDate, threshold)).toBe(true);
  });

  it('returns false for installment due in 5 days with 4-day threshold', () => {
    const dueDate = addDays(new Date(), 5);
    const threshold = 4;
    expect(isDueSoon(dueDate, threshold)).toBe(false);
  });

  it('works with different threshold values', () => {
    const dueDate = addDays(new Date(), 6);
    expect(isDueSoon(dueDate, 7)).toBe(true);
    expect(isDueSoon(dueDate, 5)).toBe(false);
    expect(isDueSoon(dueDate, 6)).toBe(true);
  });

  it('returns false for overdue installments', () => {
    const dueDate = subDays(new Date(), 1);
    expect(isDueSoon(dueDate, 4)).toBe(false);
  });

  it('returns true for installment due today', () => {
    const dueDate = new Date();
    expect(isDueSoon(dueDate, 4)).toBe(true);
  });

  it('handles timezone correctly', () => {
    // Test with Brisbane timezone
    const dueDateBrisbane = zonedTimeToUtc('2025-01-15 17:00', 'Australia/Brisbane');
    const threshold = 4;
    // Add timezone-specific test cases
  });
});
```

### Notification Helper Tests (packages/utils/src/notification-helpers.test.ts)

Test email sending functionality:

```typescript
describe('sendNotificationEmail', () => {
  it('successfully sends email via Resend API', async () => {
    const mockResend = vi.fn().mockResolvedValue({ id: 'msg_123' });
    const result = await sendNotificationEmail({
      to: 'student@example.com',
      studentName: 'John Doe',
      amount: 500,
      dueDate: new Date('2025-01-15'),
      paymentInstructions: 'Pay via bank transfer'
    });
    expect(result.success).toBe(true);
    expect(result.messageId).toBe('msg_123');
  });

  it('handles email delivery failure gracefully', async () => {
    const mockResend = vi.fn().mockRejectedValue(new Error('Network error'));
    const result = await sendNotificationEmail({...});
    expect(result.success).toBe(false);
    expect(result.error).toBe('Network error');
  });

  it('includes all required fields in email template', async () => {
    // Test that template rendering includes all AC8 requirements
  });
});
```

## 2. Component Tests

### DueSoonBadge Tests (apps/dashboard/app/components/DueSoonBadge.test.tsx)

```typescript
describe('DueSoonBadge', () => {
  it('renders with yellow/amber background color', () => {
    render(<DueSoonBadge />);
    const badge = screen.getByText(/due soon/i);
    expect(badge).toHaveClass('bg-amber-100', 'text-amber-800');
  });

  it('displays days until due when provided', () => {
    render(<DueSoonBadge daysUntilDue={3} />);
    expect(screen.getByText(/3d/i)).toBeInTheDocument();
  });

  it('renders different sizes correctly', () => {
    const { rerender } = render(<DueSoonBadge size="sm" />);
    // Test size classes
    rerender(<DueSoonBadge size="lg" />);
    // Test size classes
  });
});
```

### DueSoonWidget Tests (apps/dashboard/app/components/DueSoonWidget.test.tsx)

```typescript
describe('DueSoonWidget', () => {
  it('displays correct count of due soon installments', async () => {
    const mockData = { count: 5, total_amount: 2500 };
    mockUseQuery.mockReturnValue({ data: mockData, isLoading: false });

    render(<DueSoonWidget />);
    expect(screen.getByText('5')).toBeInTheDocument();
    expect(screen.getByText(/2500/)).toBeInTheDocument();
  });

  it('shows loading state while fetching data', () => {
    mockUseQuery.mockReturnValue({ data: null, isLoading: true });
    render(<DueSoonWidget />);
    expect(screen.getByTestId('loading-spinner')).toBeInTheDocument();
  });

  it('links to filtered payment plans view', () => {
    render(<DueSoonWidget />);
    const link = screen.getByRole('link', { name: /view all/i });
    expect(link).toHaveAttribute('href', '/plans?filter=due-soon');
  });
});
```

### InstallmentStatusBadge Tests

```typescript
describe('InstallmentStatusBadge', () => {
  it('shows yellow/amber badge for due soon status', () => {
    render(<InstallmentStatusBadge status="due_soon" />);
    const badge = screen.getByText(/due soon/i);
    expect(badge).toHaveClass('bg-amber-100');
  });

  it('shows red badge for overdue status', () => {
    render(<InstallmentStatusBadge status="overdue" />);
    const badge = screen.getByText(/overdue/i);
    expect(badge).toHaveClass('bg-red-100');
  });

  it('shows green badge for paid status', () => {
    render(<InstallmentStatusBadge status="paid" />);
    const badge = screen.getByText(/paid/i);
    expect(badge).toHaveClass('bg-green-100');
  });
});
```

## 3. API Integration Tests

### Dashboard API Tests (apps/dashboard/app/api/dashboard/due-soon-count/route.test.ts)

```typescript
describe('GET /api/dashboard/due-soon-count', () => {
  it('returns correct count for agency', async () => {
    const response = await GET({ agency_id: 'agency-123' });
    const data = await response.json();
    expect(data.success).toBe(true);
    expect(data.data).toHaveProperty('count');
    expect(data.data).toHaveProperty('total_amount');
  });

  it('respects RLS policies filtering by agency', async () => {
    // Test that only agency-scoped data is returned
  });

  it('requires authentication', async () => {
    // Test without auth token
    const response = await GET({});
    expect(response.status).toBe(401);
  });
});
```

### Agency Settings API Tests

```typescript
describe('PATCH /api/agencies/[id]/settings', () => {
  it('updates due_soon_threshold_days successfully', async () => {
    const response = await PATCH({ due_soon_threshold_days: 7 });
    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data.data.due_soon_threshold_days).toBe(7);
  });

  it('requires Admin role', async () => {
    // Test with non-admin user
    const response = await PATCH({});
    expect(response.status).toBe(403);
  });

  it('validates threshold value range', async () => {
    const response = await PATCH({ due_soon_threshold_days: -1 });
    expect(response.status).toBe(400);
  });
});
```

## 4. Edge Function Tests

### Notification Job Tests (supabase/functions/notifications/send-due-soon-notifications/index.test.ts)

```typescript
import { assertEquals } from "https://deno.land/std@0.192.0/testing/asserts.ts";

Deno.test("queries installments due in 36 hours", async () => {
  const mockSupabase = createMockSupabaseClient();
  const result = await queryDueSoonInstallments(mockSupabase);

  // Verify query includes correct date range
  assertEquals(result.length > 0, true);
});

Deno.test("prevents duplicate notification sends", async () => {
  // Insert existing notification record
  // Attempt to send again
  // Verify no duplicate sent
});

Deno.test("handles email delivery failure", async () => {
  const mockResend = { send: () => Promise.reject(new Error('Failed')) };
  const result = await sendNotification(installment, mockResend);

  assertEquals(result.delivery_status, 'failed');
  assertEquals(result.error_message, 'Failed');
});

Deno.test("logs notification to student_notifications table", async () => {
  await sendNotification(installment);

  const notificationRecord = await queryNotificationLog();
  assertEquals(notificationRecord.notification_type, 'due_soon');
  assertEquals(notificationRecord.delivery_status, 'sent');
});

Deno.test("skips installment already paid", async () => {
  const paidInstallment = { ...installment, status: 'paid' };
  const result = await sendNotification(paidInstallment);

  assertEquals(result, null); // No notification sent
});
```

## 5. End-to-End Tests

### Complete Flow Test (__tests__/e2e/due-soon-notifications.spec.ts)

```typescript
test.describe('Due Soon Notification Flow', () => {
  test('complete flow from creation to notification', async ({ page }) => {
    // 1. Login as agency admin
    await page.goto('/login');
    await loginAsAdmin(page);

    // 2. Create payment plan with installment due in 2 days
    await createPaymentPlan({
      amount: 500,
      dueDate: addDays(new Date(), 2)
    });

    // 3. Navigate to dashboard
    await page.goto('/dashboard');

    // 4. Verify due soon widget shows count of 1
    await expect(page.locator('[data-testid="due-soon-widget"]')).toContainText('1');

    // 5. Navigate to payment plans
    await page.goto('/plans');

    // 6. Verify due soon badge visible
    await expect(page.locator('.due-soon-badge')).toBeVisible();

    // 7. Apply due soon filter
    await page.click('[data-filter="due-soon"]');
    await expect(page.locator('.payment-plan-row')).toHaveCount(1);

    // 8. Verify badge color is yellow/amber
    const badge = page.locator('.due-soon-badge');
    await expect(badge).toHaveCSS('background-color', 'rgb(254, 243, 199)'); // amber-100
  });
});
```

### Timezone Test

```typescript
test('handles different agency timezones correctly', async ({ page }) => {
  // Set agency timezone to Brisbane
  await updateAgencySettings({ timezone: 'Australia/Brisbane' });

  // Create installment due at specific time
  const dueDate = zonedTimeToUtc('2025-01-15 17:00', 'Australia/Brisbane');
  await createInstallment({ dueDate });

  // Verify due soon calculation respects timezone
  const isDueSoon = await checkDueSoonStatus(installment.id);
  expect(isDueSoon).toBe(true);
});
```

## 6. Notification Timing Tests

### Scheduled Job Execution Test

```typescript
test('notification job runs at correct time', async () => {
  // Mock pg_cron execution at 7:00 PM UTC
  const currentTime = new Date('2025-01-14T19:00:00Z'); // 7 PM UTC

  // Job should query installments due 2025-01-15 at 5 PM Brisbane
  const queriedInstallments = await simulateJobExecution(currentTime);

  // Verify correct installments selected (due in 36 hours)
  expect(queriedInstallments).toHaveLength(expectedCount);
  queriedInstallments.forEach(inst => {
    const brisbaneTime = utcToZonedTime(inst.due_date, 'Australia/Brisbane');
    expect(getDate(brisbaneTime)).toBe(15); // Next day
  });
});
```

## 7. Threshold Configuration Tests

```typescript
describe('Configurable Threshold', () => {
  test.each([2, 4, 7])('works with %i day threshold', async (days) => {
    await updateAgencySettings({ due_soon_threshold_days: days });

    const installmentWithinThreshold = createInstallment({
      dueDate: addDays(new Date(), days - 1)
    });
    const installmentOutsideThreshold = createInstallment({
      dueDate: addDays(new Date(), days + 1)
    });

    expect(await isDueSoon(installmentWithinThreshold.id)).toBe(true);
    expect(await isDueSoon(installmentOutsideThreshold.id)).toBe(false);
  });
});
```

## 8. Error Handling Tests

```typescript
test('handles Resend API rate limiting', async () => {
  const rateLimitedResend = mockResendWithRateLimit();

  const result = await sendBatchNotifications(installments, rateLimitedResend);

  // Verify retry logic executed
  expect(result.retried).toBeGreaterThan(0);
  expect(result.eventuallySucceeded).toBe(true);
});

test('logs errors for debugging', async () => {
  const failingResend = mockResendWithError();

  await sendNotification(installment, failingResend);

  const notificationLog = await queryNotificationLog(installment.id);
  expect(notificationLog.delivery_status).toBe('failed');
  expect(notificationLog.error_message).toContain('Resend API error');
});
```

---

## Update Manifest

Before starting testing, update the manifest file:

`.bmad-ephemeral/stories/prompts/5-2-due-soon-notification-flags/MANIFEST.md`

Update:
1. Mark Task 3 status as "Completed" with completion date
2. Add notes about Task 3 implementation (notification system created)
3. Mark Task 4 status as "In Progress" with start date

---

## Implementation Steps

1. **Update manifest** to mark Task 4 as in progress
2. **Write unit tests** for date calculation logic
3. **Write unit tests** for notification helpers
4. **Write component tests** for badge and widget components
5. **Write API integration tests** for dashboard and settings endpoints
6. **Write Edge Function tests** for notification job
7. **Write E2E tests** for complete user flow
8. **Run all test suites** and ensure they pass
9. **Test with different threshold values** (2, 4, 7 days)
10. **Test notification timing** with various scenarios
11. **Test timezone handling** across different agencies
12. **Verify badge colors** and visual consistency
13. **Test error handling** and retry logic
14. **Update manifest** when all tests pass

## Test Execution Commands

```bash
# Unit tests
npm test packages/utils/src/date-helpers.test.ts
npm test packages/utils/src/notification-helpers.test.ts

# Component tests
npm test apps/dashboard/app/components/

# API tests
npm test apps/dashboard/app/api/
npm test apps/agency/app/api/

# Edge Function tests
cd supabase/functions/notifications/send-due-soon-notifications
deno test

# E2E tests
npm run test:e2e

# All tests
npm test
```

## Validation Checklist

Before marking this task complete, verify:

- [ ] All unit tests pass (100% coverage on critical logic)
- [ ] All component tests pass (badges render with correct colors)
- [ ] All API integration tests pass (correct data returned)
- [ ] Edge Function tests pass (notification logic correct)
- [ ] E2E tests pass (complete user flow works)
- [ ] Tested with threshold values: 2, 4, 7 days
- [ ] Notification timing verified (7 PM UTC = 5 AM Brisbane)
- [ ] Timezone handling works for different agencies
- [ ] Badge colors consistent (yellow/amber, red, green)
- [ ] Dashboard counts accurate
- [ ] Filter functionality works correctly
- [ ] Error handling tested and working
- [ ] Duplicate prevention verified
- [ ] Email template includes all required fields (AC8)

---

## Final Validation

After all tests pass, perform manual testing:

1. **Create test installment** due in 3 days
2. **Verify dashboard** shows count of 1
3. **Check payment plan view** shows due soon badge
4. **Apply filter** and verify only due soon plans shown
5. **Wait for notification job** (or manually trigger)
6. **Verify email received** with correct content
7. **Check notification log** shows successful send
8. **Try to send duplicate** and verify prevented

## Story Completion

Once all tests pass and validation complete:

1. **Update manifest** - mark Task 4 as "Completed"
2. **Update story file** - mark story as "done" in [.bmad-ephemeral/stories/5-2-due-soon-notification-flags.md](.bmad-ephemeral/stories/5-2-due-soon-notification-flags.md)
3. **Document any known issues** or future improvements
4. **Celebrate!** Story 5.2 is complete! 🎉

---

**Source Story**: [.bmad-ephemeral/stories/5-2-due-soon-notification-flags.md](.bmad-ephemeral/stories/5-2-due-soon-notification-flags.md)
**Story Context**: [.bmad-ephemeral/stories/5-2-due-soon-notification-flags.context.xml](.bmad-ephemeral/stories/5-2-due-soon-notification-flags.context.xml)
