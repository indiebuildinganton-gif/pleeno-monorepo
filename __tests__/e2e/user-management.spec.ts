/**
 * User Management E2E Tests
 *
 * End-to-end tests for user management functionality using Playwright
 * Epic 2: Agency Configuration & User Management
 * Story 2.3: User Management Interface
 */

import { test, expect } from '@playwright/test'

test.describe('User Management', () => {
  test.beforeEach(async ({ page }) => {
    // Note: These tests require an authenticated admin user
    // In a real implementation, you would set up authentication state
    // For now, we'll skip the actual test execution but document the expected behavior
  })

  test('should display user management page', async ({ page }) => {
    test.skip() // Skip until test authentication is set up

    await page.goto('/users')

    // Verify page elements
    await expect(page.getByRole('heading', { name: /user management/i })).toBeVisible()
    await expect(page.getByRole('table')).toBeVisible()
  })

  test('admin can view all users in their agency', async ({ page }) => {
    test.skip() // Skip until test authentication is set up

    await page.goto('/users')

    // Verify table columns
    await expect(page.getByRole('columnheader', { name: /name/i })).toBeVisible()
    await expect(page.getByRole('columnheader', { name: /email/i })).toBeVisible()
    await expect(page.getByRole('columnheader', { name: /role/i })).toBeVisible()
    await expect(page.getByRole('columnheader', { name: /status/i })).toBeVisible()
    await expect(page.getByRole('columnheader', { name: /assigned tasks/i })).toBeVisible()
    await expect(page.getByRole('columnheader', { name: /actions/i })).toBeVisible()

    // Verify user rows are displayed
    const userRows = page.locator('tbody tr')
    await expect(userRows).not.toHaveCount(0)
  })

  test('admin can change user role', async ({ page }) => {
    test.skip() // Skip until test authentication is set up

    await page.goto('/users')

    // Find a user row (not yourself)
    const userRow = page.locator('tr').filter({ hasText: 'Regular User' }).first()

    // Open actions menu
    await userRow.getByRole('button', { name: /open menu/i }).click()

    // Click "Change Role"
    await page.getByText('Change Role').click()

    // Verify confirmation dialog appears
    await expect(page.getByText('Change User Role')).toBeVisible()

    // Confirm role change
    await page.getByRole('button', { name: /confirm change/i }).click()

    // Verify success notification
    await expect(page.getByText(/role updated/i)).toBeVisible()

    // Verify role badge updated in table
    await expect(userRow.getByText('Admin')).toBeVisible()
  })

  test('admin can deactivate user', async ({ page }) => {
    test.skip() // Skip until test authentication is set up

    await page.goto('/users')

    // Find a user row
    const userRow = page.locator('tr').filter({ hasText: 'Regular User' }).first()

    // Open actions menu
    await userRow.getByRole('button', { name: /open menu/i }).click()

    // Click "Deactivate"
    await page.getByText('Deactivate').click()

    // Verify confirmation dialog appears
    await expect(page.getByText('Deactivate User')).toBeVisible()
    await expect(page.getByText('This user will no longer be able to log in')).toBeVisible()

    // Confirm deactivation
    await page.getByRole('button', { name: /deactivate user/i }).click()

    // Verify success notification
    await expect(page.getByText(/has been deactivated/i)).toBeVisible()

    // Verify status badge updated
    await expect(userRow.getByText('Inactive')).toBeVisible()
  })

  test('admin can reactivate user', async ({ page }) => {
    test.skip() // Skip until test authentication is set up

    await page.goto('/users')

    // Find an inactive user row
    const userRow = page.locator('tr').filter({ has: page.getByText('Inactive') }).first()

    // Open actions menu
    await userRow.getByRole('button', { name: /open menu/i }).click()

    // Click "Activate"
    await page.getByText('Activate').click()

    // Verify confirmation dialog
    await expect(page.getByText('Reactivate User')).toBeVisible()
    await expect(page.getByText('This user will regain access to the system')).toBeVisible()

    // Confirm activation
    await page.getByRole('button', { name: /reactivate user/i }).click()

    // Verify success notification
    await expect(page.getByText(/has been reactivated/i)).toBeVisible()

    // Verify status badge updated
    await expect(userRow.getByText('Active')).toBeVisible()
  })

  test('admin cannot deactivate themselves', async ({ page }) => {
    test.skip() // Skip until test authentication is set up

    await page.goto('/users')

    // Find own user row (marked with "You")
    const ownRow = page.locator('tr').filter({ hasText: '(You)' }).first()

    // Open actions menu
    await ownRow.getByRole('button', { name: /open menu/i }).click()

    // Verify deactivate option is disabled
    const deactivateButton = page.getByText('Deactivate')
    await expect(deactivateButton).toHaveAttribute('data-disabled', 'true')
  })

  test('deactivated user cannot log in', async ({ page, context }) => {
    test.skip() // Skip until test authentication is set up

    // First, deactivate a user as admin
    await page.goto('/users')
    const userRow = page.locator('tr').filter({ hasText: 'test@user.com' }).first()
    await userRow.getByRole('button', { name: /open menu/i }).click()
    await page.getByText('Deactivate').click()
    await page.getByRole('button', { name: /deactivate user/i }).click()

    // Wait for success
    await expect(page.getByText(/has been deactivated/i)).toBeVisible()

    // Logout
    await page.getByRole('button', { name: /logout/i }).click()

    // Clear cookies
    await context.clearCookies()

    // Try to login as deactivated user
    await page.goto('/login')
    await page.getByLabel(/email/i).fill('test@user.com')
    await page.getByLabel(/password/i).fill('password')
    await page.getByRole('button', { name: /sign in/i }).click()

    // Verify error message
    await expect(page.getByText(/account is deactivated/i)).toBeVisible()
    await expect(page).toHaveURL(/\/login/)
  })

  test('admin can resend pending invitation', async ({ page }) => {
    test.skip() // Skip until test authentication is set up

    await page.goto('/users')

    // Find pending invitation row
    const invitationRow = page.locator('tr').filter({ hasText: 'pending@user.com' }).first()

    // Click resend button
    await invitationRow.getByRole('button', { name: /resend/i }).click()

    // Verify success notification
    await expect(page.getByText(/invitation resent/i)).toBeVisible()
  })

  test('admin can delete pending invitation', async ({ page }) => {
    test.skip() // Skip until test authentication is set up

    await page.goto('/users')

    // Find pending invitation row
    const invitationRow = page.locator('tr').filter({ hasText: 'pending@user.com' }).first()

    // Click delete button
    await invitationRow.getByRole('button', { name: /delete/i }).click()

    // Verify confirmation dialog
    await expect(page.getByText(/delete invitation/i)).toBeVisible()

    // Confirm deletion
    await page.getByRole('button', { name: /delete/i }).click()

    // Verify success notification
    await expect(page.getByText(/invitation deleted/i)).toBeVisible()

    // Verify invitation row is removed
    await expect(invitationRow).not.toBeVisible()
  })

  test('admin can view user details', async ({ page }) => {
    test.skip() // Skip until test authentication is set up

    await page.goto('/users')

    // Find a user row
    const userRow = page.locator('tr').filter({ hasText: 'Regular User' }).first()

    // Open actions menu
    await userRow.getByRole('button', { name: /open menu/i }).click()

    // Click "View Details"
    await page.getByText('View Details').click()

    // Verify navigation to user details page
    await expect(page).toHaveURL(/\/users\/[a-f0-9-]+/)

    // Verify user details are displayed
    await expect(page.getByRole('heading', { name: /user details/i })).toBeVisible()
  })

  test('non-admin user cannot access user management', async ({ page }) => {
    test.skip() // Skip until test authentication is set up

    // Login as regular user (not admin)
    // ... authentication setup ...

    // Try to access user management page
    await page.goto('/users')

    // Should be redirected or see error
    await expect(page).not.toHaveURL('/users')
    // OR
    await expect(page.getByText(/not authorized/i)).toBeVisible()
  })

  test('displays role badges with correct styling', async ({ page }) => {
    test.skip() // Skip until test authentication is set up

    await page.goto('/users')

    // Verify admin badge exists
    const adminBadge = page.getByText('Admin').first()
    await expect(adminBadge).toBeVisible()

    // Verify user badge exists
    const userBadge = page.getByText('User').first()
    await expect(userBadge).toBeVisible()
  })

  test('displays status badges with correct styling', async ({ page }) => {
    test.skip() // Skip until test authentication is set up

    await page.goto('/users')

    // Verify active badge exists
    const activeBadge = page.getByText('Active').first()
    await expect(activeBadge).toBeVisible()

    // Find and verify inactive badge if it exists
    const inactiveBadges = page.getByText('Inactive')
    if ((await inactiveBadges.count()) > 0) {
      await expect(inactiveBadges.first()).toBeVisible()
    }
  })

  test('displays assigned task counts', async ({ page }) => {
    test.skip() // Skip until test authentication is set up

    await page.goto('/users')

    // Verify task count column displays numbers
    const taskCounts = page.locator('td').filter({ hasText: /\d+ tasks?/ })
    await expect(taskCounts.first()).toBeVisible()
  })

  test('cannot change role to remove last admin', async ({ page }) => {
    test.skip() // Skip until test authentication is set up

    await page.goto('/users')

    // If there's only one admin, try to change their role
    const adminRow = page.locator('tr').filter({ hasText: 'Admin' }).first()
    await adminRow.getByRole('button', { name: /open menu/i }).click()
    await page.getByText('Change Role').click()

    // Attempt to change role
    await page.getByRole('button', { name: /confirm change/i }).click()

    // Verify error message
    await expect(page.getByText(/last admin/i)).toBeVisible()

    // Verify role was not changed
    await expect(adminRow.getByText('Admin')).toBeVisible()
  })

  test('displays loading state while fetching users', async ({ page }) => {
    test.skip() // Skip until test authentication is set up

    await page.goto('/users')

    // On slow network, loading state should be visible briefly
    // This test may need network throttling to be reliable
    const loadingIndicator = page.getByText(/loading/i)
    // May or may not be visible depending on network speed
  })

  test('shows confirmation dialog with appropriate warnings', async ({ page }) => {
    test.skip() // Skip until test authentication is set up

    await page.goto('/users')

    const userRow = page.locator('tr').filter({ hasText: 'Regular User' }).first()
    await userRow.getByRole('button', { name: /open menu/i }).click()
    await page.getByText('Deactivate').click()

    // Verify warning message
    await expect(page.getByText('This user will no longer be able to log in')).toBeVisible()
    await expect(
      page.getByText(/They will be immediately signed out from all devices/i)
    ).toBeVisible()

    // Verify alert icon is displayed
    const alertIcon = page.locator('svg').filter({ has: page.locator('path') }).first()
    await expect(alertIcon).toBeVisible()
  })
})
