/**
 * Overdue Payment Notifications E2E Tests
 *
 * End-to-end tests for the complete overdue payment notification flow
 * from installment becoming overdue to user seeing and interacting with notifications.
 *
 * Epic 5: Intelligent Status Automation & Notifications
 * Story 5.3: Overdue Payment Alerts - Task 5
 */

import { test, expect } from '@playwright/test'

test.describe('Overdue Payment Notifications E2E', () => {
  test.beforeEach(async ({ page }) => {
    // Note: These tests require:
    // 1. Authenticated user session
    // 2. Test data (agency, student, payment plan, overdue installment)
    // 3. Status update job to have run
    //
    // In a real implementation, you would:
    // - Set up test user authentication via API
    // - Create test data via Supabase service role client
    // - Trigger status update job manually
  })

  test('should show notification on login and navigate to filtered view', async ({ page }) => {
    test.skip() // Skip until test authentication and data setup is configured

    // ===================================================================
    // Prerequisites (setup via API before test):
    // - User authenticated as test@agency.com
    // - Agency with ID agency-123
    // - Payment plan with overdue installment
    // - Status update job has run → notification created
    // ===================================================================

    // Login
    await page.goto('/login')
    await page.fill('input[name="email"]', 'test@agency.com')
    await page.fill('input[name="password"]', 'TestPassword123!')
    await page.click('button[type="submit"]')

    // Wait for redirect to dashboard
    await page.waitForURL('/dashboard')

    // ===================================================================
    // AC 1: See notification on login
    // ===================================================================

    // Verify notification bell is present
    const bellButton = page.locator('[aria-label="Notifications"]')
    await expect(bellButton).toBeVisible()

    // ===================================================================
    // AC 2: Notification shows number of overdue installments
    // ===================================================================

    // Verify badge shows unread count
    const badge = bellButton.locator('span').filter({ hasText: /^\d+$/ })
    await expect(badge).toBeVisible()
    await expect(badge).toHaveText('1')

    // ===================================================================
    // AC 3: Clicking notification navigates to filtered view
    // ===================================================================

    // Click notification bell
    await bellButton.click()

    // Verify dropdown appears
    await expect(page.locator('text=Notifications')).toBeVisible()

    // Verify notification message is displayed
    const notificationMessage = page.locator('text=/Payment overdue.*\\$.*/')
    await expect(notificationMessage).toBeVisible()

    // Click notification
    await notificationMessage.click()

    // Verify navigation to filtered payment plans
    await page.waitForURL('/payments/plans?status=overdue')
    await expect(page.locator('h1')).toContainText(/Payment Plans/i)

    // Verify filtered view shows only overdue payments
    const statusBadge = page.locator('text=Overdue').first()
    await expect(statusBadge).toBeVisible()

    // Verify no non-overdue payments are shown
    await expect(page.locator('text=Paid')).not.toBeVisible()
    await expect(page.locator('text=Pending').first()).not.toBeVisible()
  })

  test('should mark notification as read and update badge count', async ({ page }) => {
    test.skip() // Skip until test authentication and data setup is configured

    await page.goto('/dashboard')

    // Verify initial unread count
    const bellButton = page.locator('[aria-label="Notifications"]')
    const badge = bellButton.locator('span')
    await expect(badge).toHaveText('1')

    // Open notification dropdown
    await bellButton.click()

    // ===================================================================
    // AC 4: Can dismiss notifications after reviewing
    // ===================================================================

    // Click "Mark as read" button
    const markReadButton = page.locator('text=Mark as read').first()
    await expect(markReadButton).toBeVisible()
    await markReadButton.click()

    // Wait for API call to complete
    await page.waitForResponse((response) =>
      response.url().includes('/api/notifications/') && response.url().includes('/mark-read')
    )

    // Verify badge count decrements (should disappear when 0)
    await expect(badge).not.toBeVisible()

    // Verify notification styling changes (no longer bold, no blue background)
    const notification = page.locator('text=/Payment overdue/').first()
    const notificationContainer = notification.locator('..')
    await expect(notificationContainer).not.toHaveClass(/bg-blue-50/)
    await expect(notificationContainer).not.toHaveClass(/font-semibold/)

    // Verify "Mark as read" button is no longer shown
    await expect(markReadButton).not.toBeVisible()
  })

  test('should display overdue summary on dashboard', async ({ page }) => {
    test.skip() // Skip until test authentication and data setup is configured

    // ===================================================================
    // AC 5: Dashboard displays count and value of overdue payments
    // ===================================================================

    await page.goto('/dashboard')

    // Verify dashboard shows overdue widget
    await expect(page.locator('text=Overdue Payments')).toBeVisible()

    // Verify widget shows count
    await expect(page.locator('text=/\\d+ overdue/i')).toBeVisible()

    // Verify widget shows total value
    await expect(page.locator('text=/Total.*\\$/i')).toBeVisible()

    // Verify widget uses red/urgent styling
    const overdueWidget = page.locator('text=Overdue Payments').locator('..')
    await expect(overdueWidget).toHaveClass(/red|rose/)

    // Click widget
    await overdueWidget.click()

    // Verify navigation to filtered view
    await page.waitForURL('/payments/plans?status=overdue')
  })

  test('should show multiple notifications correctly', async ({ page }) => {
    test.skip() // Skip until test authentication and data setup is configured

    // Prerequisites: 3 overdue installments → 3 notifications

    await page.goto('/dashboard')

    // Verify badge shows count of 3
    const bellButton = page.locator('[aria-label="Notifications"]')
    const badge = bellButton.locator('span')
    await expect(badge).toHaveText('3')

    // Open dropdown
    await bellButton.click()

    // Verify all 3 notifications are listed
    const notifications = page.locator('text=/Payment overdue/i')
    await expect(notifications).toHaveCount(3)

    // Mark one as read
    const firstMarkReadButton = page.locator('text=Mark as read').first()
    await firstMarkReadButton.click()

    // Wait for update
    await page.waitForResponse((response) =>
      response.url().includes('/api/notifications/') && response.url().includes('/mark-read')
    )

    // Verify badge decrements to 2
    await expect(badge).toHaveText('2')
  })

  test('should show "99+" badge when count exceeds 99', async ({ page }) => {
    test.skip() // Skip until test authentication and data setup is configured

    // Prerequisites: 150 overdue installments → 150 notifications

    await page.goto('/dashboard')

    // Verify badge shows "99+"
    const bellButton = page.locator('[aria-label="Notifications"]')
    const badge = bellButton.locator('span')
    await expect(badge).toHaveText('99+')
  })

  test('should hide badge when no unread notifications', async ({ page }) => {
    test.skip() // Skip until test authentication and data setup is configured

    // Prerequisites: No overdue installments or all notifications read

    await page.goto('/dashboard')

    // Verify notification bell exists but badge is hidden
    const bellButton = page.locator('[aria-label="Notifications"]')
    await expect(bellButton).toBeVisible()

    const badge = bellButton.locator('span')
    await expect(badge).not.toBeVisible()

    // Open dropdown
    await bellButton.click()

    // Verify "No notifications" message
    await expect(page.locator('text=No notifications')).toBeVisible()
  })

  test('should show correct state when all payments are current', async ({ page }) => {
    test.skip() // Skip until test authentication and data setup is configured

    // Prerequisites: No overdue installments

    await page.goto('/dashboard')

    // Verify no notification badge
    const bellButton = page.locator('[aria-label="Notifications"]')
    const badge = bellButton.locator('span')
    await expect(badge).not.toBeVisible()

    // Verify dashboard shows positive state (not overdue widget)
    await expect(page.locator('text=/All Current|No Overdue/i')).toBeVisible()

    // Widget should be green/positive
    const statusWidget = page.locator('text=/All Current/i').locator('..')
    await expect(statusWidget).toHaveClass(/green|emerald/)
  })

  test('should handle clicking outside dropdown to close', async ({ page }) => {
    test.skip() // Skip until test authentication and data setup is configured

    await page.goto('/dashboard')

    // Open notification dropdown
    const bellButton = page.locator('[aria-label="Notifications"]')
    await bellButton.click()

    // Verify dropdown is open
    await expect(page.locator('text=Notifications')).toBeVisible()

    // Click outside dropdown (on page heading)
    await page.locator('h1').click()

    // Verify dropdown is closed
    await expect(page.locator('text=Notifications')).not.toBeVisible()
  })

  test('should auto-refresh notification count every 60 seconds', async ({ page }) => {
    test.skip() // Skip until test authentication and data setup is configured

    await page.goto('/dashboard')

    // Initial state: 1 notification
    const bellButton = page.locator('[aria-label="Notifications"]')
    const badge = bellButton.locator('span')
    await expect(badge).toHaveText('1')

    // Simulate new overdue installment being created via API
    // (In real test, this would call Supabase API to create overdue installment + notification)

    // Wait for auto-refresh (60 seconds)
    await page.waitForTimeout(61000)

    // Verify badge updates to 2
    await expect(badge).toHaveText('2')
  })

  test('should show relative timestamps in dropdown', async ({ page }) => {
    test.skip() // Skip until test authentication and data setup is configured

    await page.goto('/dashboard')

    // Open notification dropdown
    const bellButton = page.locator('[aria-label="Notifications"]')
    await bellButton.click()

    // Verify relative timestamps are shown
    await expect(page.locator('text=/\\d+ (second|minute|hour|day)s? ago/i')).toBeVisible()
  })

  test('should limit dropdown to 10 most recent notifications', async ({ page }) => {
    test.skip() // Skip until test authentication and data setup is configured

    // Prerequisites: 15 overdue installments → 15 notifications

    await page.goto('/dashboard')

    // Open notification dropdown
    const bellButton = page.locator('[aria-label="Notifications"]')
    await bellButton.click()

    // Verify only 10 notifications shown in dropdown
    const notifications = page.locator('text=/Payment overdue/i')
    await expect(notifications).toHaveCount(10)

    // Verify "View all notifications" link
    const viewAllLink = page.locator('text=View all notifications')
    await expect(viewAllLink).toBeVisible()

    // Click "View all notifications"
    await viewAllLink.click()

    // Verify navigation to full notifications page
    await page.waitForURL('/notifications')

    // Verify all 15 notifications are shown
    const allNotifications = page.locator('text=/Payment overdue/i')
    await expect(allNotifications).toHaveCount(15)
  })

  test('should ensure RLS prevents seeing other agencies notifications', async ({ page }) => {
    test.skip() // Skip until test authentication and data setup is configured

    // Prerequisites:
    // - User authenticated as user from agency-123
    // - Overdue installment exists for agency-123 (notification created)
    // - Overdue installment exists for agency-456 (notification created)

    await page.goto('/dashboard')

    // Open notification dropdown
    const bellButton = page.locator('[aria-label="Notifications"]')
    await bellButton.click()

    // Verify only agency-123 notification is shown
    // (Would need to verify student name or other identifiable data)
    const notifications = page.locator('text=/Payment overdue/i')

    // Should only see 1 notification (from own agency)
    await expect(notifications).toHaveCount(1)

    // Navigate to full notifications page
    await page.goto('/notifications')

    // Verify still only see own agency's notification
    const allNotifications = page.locator('text=/Payment overdue/i')
    await expect(allNotifications).toHaveCount(1)
  })
})

test.describe('Overdue Payment Dashboard Widget E2E', () => {
  test.beforeEach(async ({ page }) => {
    // Same authentication setup as above
  })

  test('should display correct overdue count and total value', async ({ page }) => {
    test.skip() // Skip until test authentication and data setup is configured

    // Prerequisites:
    // - 3 overdue installments: $500, $750, $1000
    // - Total: $2,250

    await page.goto('/dashboard')

    // Verify overdue widget displays
    const overdueWidget = page.locator('text=Overdue Payments').locator('..')

    // Verify count
    await expect(overdueWidget).toContainText('3')

    // Verify total value
    await expect(overdueWidget).toContainText('$2,250')
  })

  test('should navigate to filtered view when clicking widget', async ({ page }) => {
    test.skip() // Skip until test authentication and data setup is configured

    await page.goto('/dashboard')

    // Click overdue widget
    const overdueWidget = page.locator('text=Overdue Payments').locator('..')
    await overdueWidget.click()

    // Verify navigation
    await page.waitForURL('/payments/plans?status=overdue')

    // Verify correct page loaded
    await expect(page.locator('h1')).toContainText(/Payment Plans/i)
  })

  test('should show positive state when no overdue payments', async ({ page }) => {
    test.skip() // Skip until test authentication and data setup is configured

    // Prerequisites: No overdue installments

    await page.goto('/dashboard')

    // Verify positive message
    await expect(page.locator('text=/All Current|No Overdue Payments/i')).toBeVisible()

    // Verify green/positive styling
    const widget = page.locator('text=/All Current/i').locator('..')
    await expect(widget).toHaveClass(/green|emerald/)
  })
})
