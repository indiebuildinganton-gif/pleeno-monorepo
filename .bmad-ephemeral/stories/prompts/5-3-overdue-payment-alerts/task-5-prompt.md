# Task 5: Testing and Validation

## Context
You are implementing Story 5.3: Overdue Payment Alerts - Task 5 of 5 (FINAL TASK).

This task ensures comprehensive testing coverage across the entire notification system, from backend generation to frontend display. This validates that all acceptance criteria are met and the system works end-to-end.

## Story Overview
**As an** Agency User
**I want** to receive in-app notifications for overdue payments
**So that** I'm immediately aware when follow-up action is needed

## Prerequisites
- Task 1 completed: Notifications table and API
- Task 2 completed: Notification generation in status job
- Task 3 completed: Notification UI components
- Task 4 completed: Dashboard overdue widget

## Acceptance Criteria (All)
1. Given the automated status job has marked installments as overdue, When I log into the application, Then I see a notification/alert for new overdue payments since my last login
2. And the notification shows the number of overdue installments
3. And clicking the notification takes me to a filtered view of overdue payments
4. And I can dismiss notifications after reviewing
5. And the dashboard prominently displays the total count and value of overdue payments

## Your Task
Comprehensive testing and validation across integration and E2E layers:

### Subtasks:
1. Integration test: status job creates notification when installment becomes overdue
2. Integration test: notification bell icon shows correct unread count
3. Integration test: clicking notification navigates to filtered payment plans
4. Integration test: marking notification as read updates UI and database
5. E2E test: full user flow from login → see notification → click → view overdue payments
6. Test notification deduplication (don't create duplicate notifications for same installment)

## Technical Specifications

### Integration Tests
Location: `__tests__/integration/notifications/`

#### Test 1: Status Job Creates Notification
File: `__tests__/integration/notifications/status-job-notification.test.ts`

**Test:** Status update job marks installment overdue → notification created

```typescript
import { describe, it, expect, beforeEach } from 'vitest';
import { createClient } from '@supabase/supabase-js';

describe('Status Job Notification Generation', () => {
  let supabase;
  let testAgencyId;
  let testStudentId;
  let testPaymentPlanId;
  let testInstallmentId;

  beforeEach(async () => {
    // Setup: Create test agency, student, payment plan, installment
    supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

    // Create test data (agency, student, payment plan)
    const { data: agency } = await supabase.from('agencies').insert({ name: 'Test Agency' }).select().single();
    testAgencyId = agency.id;

    const { data: student } = await supabase.from('students').insert({
      agency_id: testAgencyId,
      first_name: 'John',
      last_name: 'Smith',
      email: 'john@example.com'
    }).select().single();
    testStudentId = student.id;

    const { data: paymentPlan } = await supabase.from('payment_plans').insert({
      agency_id: testAgencyId,
      student_id: testStudentId,
      total_amount: 1000
    }).select().single();
    testPaymentPlanId = paymentPlan.id;

    const { data: installment } = await supabase.from('installments').insert({
      payment_plan_id: testPaymentPlanId,
      amount: 500,
      due_date: new Date(Date.now() - 86400000).toISOString(), // Yesterday
      status: 'pending'
    }).select().single();
    testInstallmentId = installment.id;
  });

  it('should create notification when installment becomes overdue', async () => {
    // Trigger status update job (or manually update status)
    await supabase
      .from('installments')
      .update({ status: 'overdue' })
      .eq('id', testInstallmentId);

    // Manually invoke Edge Function (simulate cron job)
    const response = await fetch(`${process.env.SUPABASE_URL}/functions/v1/payments/status-updater`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.SUPABASE_ANON_KEY}`,
      },
    });

    expect(response.ok).toBe(true);

    // Verify notification created
    const { data: notifications } = await supabase
      .from('notifications')
      .select('*')
      .eq('agency_id', testAgencyId)
      .eq('type', 'overdue_payment');

    expect(notifications).toHaveLength(1);
    expect(notifications[0].message).toContain('John Smith');
    expect(notifications[0].message).toContain('500');
    expect(notifications[0].link).toBe('/payments/plans?status=overdue');
    expect(notifications[0].is_read).toBe(false);
  });

  it('should not create duplicate notifications', async () => {
    // Mark installment overdue
    await supabase.from('installments').update({ status: 'overdue' }).eq('id', testInstallmentId);

    // Trigger job twice
    await fetch(`${process.env.SUPABASE_URL}/functions/v1/payments/status-updater`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${process.env.SUPABASE_ANON_KEY}` },
    });

    await fetch(`${process.env.SUPABASE_URL}/functions/v1/payments/status-updater`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${process.env.SUPABASE_ANON_KEY}` },
    });

    // Verify only one notification created
    const { data: notifications } = await supabase
      .from('notifications')
      .select('*')
      .eq('agency_id', testAgencyId)
      .eq('type', 'overdue_payment');

    expect(notifications).toHaveLength(1);
  });
});
```

#### Test 2: Notification Bell Shows Correct Count
File: `__tests__/integration/notifications/bell-icon.test.tsx`

```typescript
import { describe, it, expect } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { NotificationBell } from '@/components/NotificationBell';

describe('NotificationBell', () => {
  it('should display correct unread count', async () => {
    const queryClient = new QueryClient();

    // Mock API response with 3 unread notifications
    global.fetch = vi.fn(() =>
      Promise.resolve({
        json: () => Promise.resolve({
          data: [
            { id: '1', is_read: false },
            { id: '2', is_read: false },
            { id: '3', is_read: false },
          ]
        }),
      })
    );

    render(
      <QueryClientProvider client={queryClient}>
        <NotificationBell />
      </QueryClientProvider>
    );

    await waitFor(() => {
      expect(screen.getByText('3')).toBeInTheDocument();
    });
  });

  it('should hide badge when count is 0', async () => {
    const queryClient = new QueryClient();

    global.fetch = vi.fn(() =>
      Promise.resolve({
        json: () => Promise.resolve({ data: [] }),
      })
    );

    render(
      <QueryClientProvider client={queryClient}>
        <NotificationBell />
      </QueryClientProvider>
    );

    await waitFor(() => {
      expect(screen.queryByText('0')).not.toBeInTheDocument();
    });
  });
});
```

#### Test 3: Clicking Notification Navigates
File: `__tests__/integration/notifications/navigation.test.tsx`

```typescript
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { NotificationDropdown } from '@/components/NotificationDropdown';
import { useRouter } from 'next/navigation';

vi.mock('next/navigation');

describe('Notification Navigation', () => {
  it('should navigate to notification link on click', () => {
    const mockPush = vi.fn();
    (useRouter as any).mockReturnValue({ push: mockPush });

    const notifications = [
      {
        id: '1',
        message: 'Payment overdue: John Smith',
        link: '/payments/plans?status=overdue',
        is_read: false,
        created_at: new Date().toISOString(),
      }
    ];

    render(<NotificationDropdown notifications={notifications} onClose={() => {}} />);

    const notification = screen.getByText('Payment overdue: John Smith');
    fireEvent.click(notification);

    expect(mockPush).toHaveBeenCalledWith('/payments/plans?status=overdue');
  });
});
```

#### Test 4: Mark as Read Updates UI and Database
File: `__tests__/integration/notifications/mark-read.test.tsx`

```typescript
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { NotificationDropdown } from '@/components/NotificationDropdown';

describe('Mark Notification as Read', () => {
  it('should mark notification as read and update UI optimistically', async () => {
    const queryClient = new QueryClient();

    // Mock PATCH API
    global.fetch = vi.fn(() =>
      Promise.resolve({
        json: () => Promise.resolve({ success: true }),
      })
    );

    const notifications = [
      {
        id: '1',
        message: 'Payment overdue',
        is_read: false,
        created_at: new Date().toISOString(),
      }
    ];

    render(
      <QueryClientProvider client={queryClient}>
        <NotificationDropdown notifications={notifications} onClose={() => {}} />
      </QueryClientProvider>
    );

    const markReadButton = screen.getByText('Mark as read');
    fireEvent.click(markReadButton);

    // Verify API called
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        '/api/notifications/1/mark-read',
        expect.objectContaining({ method: 'PATCH' })
      );
    });
  });
});
```

### E2E Tests (Playwright)
Location: `__tests__/e2e/notifications/`

#### Test 5: Full User Flow
File: `__tests__/e2e/notifications/overdue-flow.spec.ts`

```typescript
import { test, expect } from '@playwright/test';

test.describe('Overdue Payment Notifications E2E', () => {
  test('should show notification on login and navigate to filtered view', async ({ page }) => {
    // Setup: Create overdue installment via API
    // (Requires test user authentication and API setup)

    // Login
    await page.goto('/login');
    await page.fill('input[name="email"]', 'testuser@example.com');
    await page.fill('input[name="password"]', 'password123');
    await page.click('button[type="submit"]');

    // Wait for redirect to dashboard
    await page.waitForURL('/dashboard');

    // Verify notification bell shows unread count
    const badge = page.locator('[aria-label="Notifications"] span');
    await expect(badge).toHaveText('1');

    // Click notification bell
    await page.click('[aria-label="Notifications"]');

    // Verify dropdown shows notification
    await expect(page.locator('text=Payment overdue')).toBeVisible();

    // Click notification
    await page.click('text=Payment overdue');

    // Verify navigation to filtered payment plans
    await page.waitForURL('/payments/plans?status=overdue');
    await expect(page.locator('h1')).toHaveText(/Payment Plans/i);

    // Verify filtered view shows only overdue payments
    const statusBadge = page.locator('text=Overdue').first();
    await expect(statusBadge).toBeVisible();
  });

  test('should display overdue summary on dashboard', async ({ page }) => {
    await page.goto('/dashboard');

    // Verify dashboard shows overdue widget
    await expect(page.locator('text=Overdue Payment')).toBeVisible();
    await expect(page.locator('text=Total')).toBeVisible();

    // Click widget
    await page.click('text=Overdue Payment');

    // Verify navigation
    await page.waitForURL('/payments/plans?status=overdue');
  });
});
```

### Deduplication Test
File: `__tests__/integration/notifications/deduplication.test.ts`

```typescript
describe('Notification Deduplication', () => {
  it('should not create duplicate notifications for same installment', async () => {
    // Mark installment overdue
    await supabase.from('installments').update({ status: 'overdue' }).eq('id', testInstallmentId);

    // Run job
    await invokeStatusUpdater();

    // Verify 1 notification
    let { data: notifications } = await supabase.from('notifications').select('*').eq('agency_id', testAgencyId);
    expect(notifications).toHaveLength(1);

    // Run job again (next day)
    await invokeStatusUpdater();

    // Verify still only 1 notification
    ({ data: notifications } = await supabase.from('notifications').select('*').eq('agency_id', testAgencyId));
    expect(notifications).toHaveLength(1);
  });

  it('should create new notification if installment paid then overdue again', async () => {
    // Mark overdue → notification created
    await supabase.from('installments').update({ status: 'overdue' }).eq('id', testInstallmentId);
    await invokeStatusUpdater();

    let { data: notifications } = await supabase.from('notifications').select('*');
    expect(notifications).toHaveLength(1);

    // Mark as paid
    await supabase.from('installments').update({ status: 'paid' }).eq('id', testInstallmentId);

    // Mark overdue again
    await supabase.from('installments').update({ status: 'overdue' }).eq('id', testInstallmentId);
    await invokeStatusUpdater();

    // Verify new notification created
    ({ data: notifications } = await supabase.from('notifications').select('*'));
    expect(notifications).toHaveLength(2);
  });
});
```

## Manual Testing Checklist

### AC 1: See Notification on Login
- [ ] Mark installment as overdue via database
- [ ] Run status update job manually
- [ ] Log into application
- [ ] Verify notification bell shows unread count
- [ ] Verify notification appears in dropdown

### AC 2: Notification Shows Count
- [ ] Create multiple overdue installments
- [ ] Verify badge shows correct count (e.g., "3")
- [ ] Verify dropdown lists all notifications

### AC 3: Navigate to Filtered View
- [ ] Click notification in dropdown
- [ ] Verify navigation to /payments/plans?status=overdue
- [ ] Verify filtered view shows only overdue payment plans

### AC 4: Dismiss Notifications
- [ ] Click "Mark as read" button
- [ ] Verify notification styled as read (not bold, gray)
- [ ] Verify unread count badge decrements
- [ ] Verify notification marked as read in database

### AC 5: Dashboard Overdue Widget
- [ ] Navigate to dashboard
- [ ] Verify overdue widget appears at top
- [ ] Verify widget shows correct count and total value
- [ ] Verify widget uses red styling
- [ ] Click widget → navigates to filtered view

### Edge Cases
- [ ] No overdue payments → bell badge hidden, dashboard shows green "All Current"
- [ ] All notifications read → badge hidden
- [ ] Multiple agencies → only see own agency's notifications (RLS test)
- [ ] Installment paid → notification count decrements

## Testing Tools & Setup

### Required Packages
```bash
npm install -D vitest @vitest/ui @testing-library/react @testing-library/jest-dom
npm install -D @playwright/test
```

### Test Configuration
File: `vitest.config.ts`

```typescript
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'jsdom',
    setupFiles: ['./vitest.setup.ts'],
  },
});
```

File: `vitest.setup.ts`

```typescript
import '@testing-library/jest-dom';
import { vi } from 'vitest';

// Mock Next.js router
vi.mock('next/navigation', () => ({
  useRouter: vi.fn(),
  usePathname: vi.fn(),
}));
```

## Success Criteria
- [ ] Integration test: status job → notification creation passes
- [ ] Integration test: bell icon shows correct unread count passes
- [ ] Integration test: notification navigation passes
- [ ] Integration test: mark as read updates UI/DB passes
- [ ] E2E test: full user flow passes
- [ ] Deduplication test passes
- [ ] Manual testing checklist completed
- [ ] All acceptance criteria validated

## Test Execution Commands

```bash
# Run all tests
npm test

# Run integration tests only
npm test -- __tests__/integration

# Run E2E tests only
npx playwright test

# Run specific test file
npm test -- notifications/status-job-notification.test.ts

# Run tests with coverage
npm test -- --coverage
```

## Context Files Reference
- Story Context: `.bmad-ephemeral/stories/5-3-overdue-payment-alerts.context.xml`
- Architecture: `docs/architecture.md` (testing standards)
- All previous tasks (1-4) for integration testing

## Final Steps
After completing this task:
1. Update the MANIFEST.md file to mark Task 5 as complete
2. Mark Story 5.3 as DONE in story file
3. Document any learnings or issues in Dev Agent Record section

---

**Testing Philosophy:** This comprehensive test suite validates the entire notification system end-to-end, from backend generation to frontend display. Integration tests verify each component works correctly, while E2E tests validate the complete user journey. Deduplication tests prevent notification spam, and manual testing ensures UX quality.
