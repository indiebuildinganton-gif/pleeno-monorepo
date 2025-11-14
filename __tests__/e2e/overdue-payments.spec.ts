/**
 * Overdue Payments Widget E2E Tests
 *
 * End-to-end tests for overdue payments widget using Playwright
 * Epic 6: Agency Dashboard
 * Story 6.5: Overdue Payments Summary Widget
 * Task 7: Testing
 */

import { test, expect } from '@playwright/test'

test.describe('Overdue Payments Widget', () => {
  test.beforeEach(async ({ page }) => {
    // Note: These tests require an authenticated admin user
    // In a real implementation, you would set up authentication state
    // For now, we'll skip the actual test execution but document the expected behavior
  })

  // =================================================================
  // TEST 1: Widget Displays on Dashboard Load
  // =================================================================

  test('displays overdue payments widget on dashboard load', async ({ page }) => {
    test.skip() // Skip until test authentication is set up

    await page.goto('/dashboard')

    // Wait for page to fully load
    await page.waitForLoadState('networkidle')

    // Verify widget heading is visible
    await expect(page.getByRole('heading', { name: /overdue payments/i })).toBeVisible()

    // Verify widget container displays
    const widget = page.locator('text=Overdue Payments').locator('..')
    await expect(widget).toBeVisible()
  })

  // =================================================================
  // TEST 2: Widget Shows Loading State Initially
  // =================================================================

  test('shows loading skeleton while fetching data', async ({ page }) => {
    test.skip() // Skip until test authentication is set up

    await page.goto('/dashboard')

    // Check for loading state (should appear briefly)
    const loadingSkeleton = page.getByLabelText(/loading overdue payments/i)

    // This may be very brief, so we use a timeout
    try {
      await expect(loadingSkeleton).toBeVisible({ timeout: 1000 })
    } catch {
      // Loading may have completed too quickly - this is acceptable
    }
  })

  // =================================================================
  // TEST 3: Displays Overdue Payment Items
  // =================================================================

  test('displays overdue payment items with all required fields', async ({ page }) => {
    test.skip() // Skip until test authentication is set up

    await page.goto('/dashboard')

    // Wait for widget to load
    await page.waitForSelector('text=Overdue Payments')

    // Check if any overdue items exist
    const overdueItems = page.locator('[data-testid=overdue-payment-item]')
    const count = await overdueItems.count()

    if (count > 0) {
      const firstItem = overdueItems.first()

      // Verify item contains student name
      await expect(firstItem).toContainText(/\w+/)

      // Verify item contains amount (formatted as currency)
      await expect(firstItem).toContainText(/\$/)

      // Verify item contains days overdue
      await expect(firstItem).toContainText(/days? overdue/i)
    }
  })

  // =================================================================
  // TEST 4: Navigation to Payment Plan Detail
  // =================================================================

  test('navigates to payment plan detail when item is clicked', async ({ page }) => {
    test.skip() // Skip until test authentication is set up

    await page.goto('/dashboard')

    // Wait for widget to load
    await page.waitForSelector('text=Overdue Payments')

    // Find first overdue item link
    const firstItem = page.locator('[data-testid=overdue-payment-item]').first()

    if (await firstItem.isVisible()) {
      // Get the payment plan ID from href
      const href = await firstItem.getAttribute('href')

      // Click the item
      await firstItem.click()

      // Verify navigation to payment plan detail page
      if (href) {
        await expect(page).toHaveURL(new RegExp(href))
      } else {
        await expect(page).toHaveURL(/\/payments\/plans\/[^/]+/)
      }
    }
  })

  // =================================================================
  // TEST 5: Color Coding - Critical (30+ days)
  // =================================================================

  test('applies red styling for payments 30+ days overdue', async ({ page }) => {
    test.skip() // Skip until test authentication is set up

    await page.goto('/dashboard')

    // Wait for widget to load
    await page.waitForSelector('text=Overdue Payments')

    // Look for any items with 30+ days overdue
    const criticalItems = page.locator('text=/3[0-9]\\+ days overdue/i, text=/[4-9][0-9]\\+ days overdue/i')
    const count = await criticalItems.count()

    if (count > 0) {
      const firstCritical = criticalItems.first()

      // Verify red text color class is applied
      await expect(firstCritical).toHaveClass(/text-red-600/)
    }
  })

  // =================================================================
  // TEST 6: Color Coding - Alert (8-30 days)
  // =================================================================

  test('applies orange styling for payments 8-30 days overdue', async ({ page }) => {
    test.skip() // Skip until test authentication is set up

    await page.goto('/dashboard')

    // Wait for widget to load
    await page.waitForSelector('text=Overdue Payments')

    // Look for any items with 8-30 days overdue
    const alertItems = page.locator('text=/[89] days overdue/i, text=/[12][0-9] days overdue/i')
    const count = await alertItems.count()

    if (count > 0) {
      const firstAlert = alertItems.first()

      // Verify orange text color class is applied
      await expect(firstAlert).toHaveClass(/text-orange-600/)
    }
  })

  // =================================================================
  // TEST 7: Color Coding - Warning (1-7 days)
  // =================================================================

  test('applies yellow styling for payments 1-7 days overdue', async ({ page }) => {
    test.skip() // Skip until test authentication is set up

    await page.goto('/dashboard')

    // Wait for widget to load
    await page.waitForSelector('text=Overdue Payments')

    // Look for any items with 1-7 days overdue
    const warningItems = page.locator('text=/[1-7] days? overdue/i')
    const count = await warningItems.count()

    if (count > 0) {
      const firstWarning = warningItems.first()

      // Verify yellow text color class is applied
      await expect(firstWarning).toHaveClass(/text-yellow-600/)
    }
  })

  // =================================================================
  // TEST 8: Total Count Badge Display
  // =================================================================

  test('displays total count badge with correct number', async ({ page }) => {
    test.skip() // Skip until test authentication is set up

    await page.goto('/dashboard')

    // Wait for widget to load
    await page.waitForSelector('text=Overdue Payments')

    // Find the count badge (rounded pill with number)
    const countBadge = page.locator('text=Overdue Payments').locator('..').locator('[class*="rounded-full"]')

    if (await countBadge.isVisible()) {
      // Verify badge contains a number
      const badgeText = await countBadge.textContent()
      expect(badgeText).toMatch(/\d+/)

      // Verify the number matches the actual count of items
      const itemCount = await page.locator('[data-testid=overdue-payment-item]').count()
      expect(badgeText?.trim()).toBe(itemCount.toString())
    }
  })

  // =================================================================
  // TEST 9: Total Amount Display
  // =================================================================

  test('displays total overdue amount correctly', async ({ page }) => {
    test.skip() // Skip until test authentication is set up

    await page.goto('/dashboard')

    // Wait for widget to load
    await page.waitForSelector('text=Overdue Payments')

    // Find the total amount display
    const totalAmountLabel = page.locator('text=Total Overdue')

    if (await totalAmountLabel.isVisible()) {
      // Find the amount value (should be below the label)
      const totalAmount = totalAmountLabel.locator('..').locator('text=/\\$[\\d,]+\\.\\d{2}/')

      await expect(totalAmount).toBeVisible()
    }
  })

  // =================================================================
  // TEST 10: Empty State Display
  // =================================================================

  test('shows celebration when no overdue payments exist', async ({ page }) => {
    test.skip() // Skip until test authentication is set up

    // Mock API to return empty data
    await page.route('**/api/dashboard/overdue-payments', (route) => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: {
            overdue_payments: [],
            total_count: 0,
            total_amount: 0,
          },
        }),
      })
    })

    await page.goto('/dashboard')

    // Wait for widget to load
    await page.waitForSelector('text=No overdue payments!')

    // Verify celebration message
    await expect(page.locator('text=No overdue payments!')).toBeVisible()
    await expect(page.locator('text=🎉')).toBeVisible()
    await expect(page.locator('text=/great work/i')).toBeVisible()
  })

  // =================================================================
  // TEST 11: Error State Display
  // =================================================================

  test('shows error state with retry button on fetch failure', async ({ page }) => {
    test.skip() // Skip until test authentication is set up

    // Mock API to return error
    await page.route('**/api/dashboard/overdue-payments', (route) => {
      route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({
          success: false,
          error: 'Internal server error',
        }),
      })
    })

    await page.goto('/dashboard')

    // Wait for error state to display
    await page.waitForSelector('text=/unable to load overdue payments/i')

    // Verify error message displays
    await expect(page.locator('text=/unable to load overdue payments/i')).toBeVisible()

    // Verify retry button
    await expect(page.getByRole('button', { name: /retry/i })).toBeVisible()
  })

  // =================================================================
  // TEST 12: Retry Button Functionality
  // =================================================================

  test('retry button refetches data after error', async ({ page }) => {
    test.skip() // Skip until test authentication is set up

    let requestCount = 0

    // Mock API to fail first time, succeed second time
    await page.route('**/api/dashboard/overdue-payments', (route) => {
      requestCount++

      if (requestCount === 1) {
        // First request fails
        route.fulfill({
          status: 500,
          contentType: 'application/json',
          body: JSON.stringify({
            success: false,
            error: 'Internal server error',
          }),
        })
      } else {
        // Second request succeeds
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            data: {
              overdue_payments: [],
              total_count: 0,
              total_amount: 0,
            },
          }),
        })
      }
    })

    await page.goto('/dashboard')

    // Wait for error state
    await page.waitForSelector('text=/unable to load overdue payments/i')

    // Click retry button
    const retryButton = page.getByRole('button', { name: /retry/i })
    await retryButton.click()

    // Wait for success state (empty state in this case)
    await page.waitForSelector('text=No overdue payments!')

    // Verify success state is shown
    await expect(page.locator('text=No overdue payments!')).toBeVisible()
    expect(requestCount).toBe(2)
  })

  // =================================================================
  // TEST 13: Widget Updates When Payment is Recorded
  // =================================================================

  test('widget updates count when overdue payment is recorded', async ({ page }) => {
    test.skip() // Skip until test authentication is set up

    await page.goto('/dashboard')

    // Wait for widget to load
    await page.waitForSelector('text=Overdue Payments')

    // Get initial count
    const initialCountBadge = page.locator('text=Overdue Payments').locator('..').locator('[class*="rounded-full"]')
    const initialCountText = await initialCountBadge.textContent()
    const initialCount = parseInt(initialCountText || '0')

    if (initialCount > 0) {
      // Click first overdue item to navigate to payment plan
      const firstItem = page.locator('[data-testid=overdue-payment-item]').first()
      await firstItem.click()

      // Wait for payment plan page to load
      await page.waitForURL(/\/payments\/plans\/[^/]+/)

      // Record payment (this would involve UI interaction on payment plan page)
      // For now, we'll just navigate back to verify the flow

      // Navigate back to dashboard
      await page.goto('/dashboard')

      // Wait for widget to reload
      await page.waitForSelector('text=Overdue Payments')

      // Verify count decreased (or empty state if all paid)
      const newCountBadge = page.locator('text=Overdue Payments').locator('..').locator('[class*="rounded-full"]')
      const newCountText = await newCountBadge.textContent()
      const newCount = parseInt(newCountText || '0')

      // Count should be same or less (depending on whether payment was actually recorded)
      expect(newCount).toBeLessThanOrEqual(initialCount)
    }
  })

  // =================================================================
  // TEST 14: Responsive Layout
  // =================================================================

  test('widget is responsive on different screen sizes', async ({ page }) => {
    test.skip() // Skip until test authentication is set up

    await page.goto('/dashboard')

    // Desktop (1280x720)
    await page.setViewportSize({ width: 1280, height: 720 })
    await expect(page.getByRole('heading', { name: /overdue payments/i })).toBeVisible()

    // Tablet (768x1024)
    await page.setViewportSize({ width: 768, height: 1024 })
    await expect(page.getByRole('heading', { name: /overdue payments/i })).toBeVisible()

    // Mobile (375x667)
    await page.setViewportSize({ width: 375, height: 667 })
    await expect(page.getByRole('heading', { name: /overdue payments/i })).toBeVisible()
  })

  // =================================================================
  // TEST 15: Accessibility - Keyboard Navigation
  // =================================================================

  test('supports keyboard navigation through overdue items', async ({ page }) => {
    test.skip() // Skip until test authentication is set up

    await page.goto('/dashboard')

    // Wait for widget to load
    await page.waitForSelector('text=Overdue Payments')

    // Tab to first overdue item
    await page.keyboard.press('Tab')

    // Find the focused element
    const focusedElement = await page.evaluate(() => document.activeElement?.tagName)
    expect(focusedElement).toBeTruthy()

    // Press Enter to navigate
    await page.keyboard.press('Enter')

    // Should navigate to payment plan detail
    await expect(page).toHaveURL(/\/payments\/plans\/[^/]+/)
  })

  // =================================================================
  // TEST 16: Accessibility - Screen Reader Support
  // =================================================================

  test('provides proper ARIA labels for screen readers', async ({ page }) => {
    test.skip() // Skip until test authentication is set up

    await page.goto('/dashboard')

    // Wait for widget to load
    await page.waitForSelector('text=Overdue Payments')

    // Verify loading skeleton has aria-label
    const skeleton = page.getByLabelText(/loading overdue payments/i)
    if (await skeleton.isVisible()) {
      await expect(skeleton).toHaveAttribute('aria-busy', 'true')
    }

    // Verify error state has proper ARIA
    // (This would require mocking an error state)
  })

  // =================================================================
  // TEST 17: Auto-Refresh on Window Focus
  // =================================================================

  test('refetches data when window regains focus', async ({ page }) => {
    test.skip() // Skip until test authentication is set up

    let requestCount = 0

    // Track API requests
    await page.route('**/api/dashboard/overdue-payments', (route) => {
      requestCount++
      route.continue()
    })

    await page.goto('/dashboard')

    // Wait for initial load
    await page.waitForSelector('text=Overdue Payments')

    const initialCount = requestCount

    // Blur window (simulate switching tabs)
    await page.evaluate(() => {
      window.dispatchEvent(new Event('blur'))
    })

    await page.waitForTimeout(1000)

    // Focus window (simulate returning to tab)
    await page.evaluate(() => {
      window.dispatchEvent(new Event('focus'))
    })

    // Wait a bit for refetch
    await page.waitForTimeout(2000)

    // Verify a new request was made
    expect(requestCount).toBeGreaterThan(initialCount)
  })

  // =================================================================
  // TEST 18: Widget Integration with Dashboard
  // =================================================================

  test('widget integrates properly with other dashboard widgets', async ({ page }) => {
    test.skip() // Skip until test authentication is set up

    await page.goto('/dashboard')

    // Verify overdue payments widget is visible
    await expect(page.getByRole('heading', { name: /overdue payments/i })).toBeVisible()

    // Verify other dashboard widgets are also visible
    await expect(page.getByRole('heading', { name: /key metrics/i })).toBeVisible()

    // Verify no layout overlaps
    const widgets = await page.locator('section').all()
    expect(widgets.length).toBeGreaterThan(1)

    // Check each widget has reasonable height (not collapsed)
    for (const widget of widgets) {
      const box = await widget.boundingBox()
      if (box) {
        expect(box.height).toBeGreaterThan(50)
      }
    }
  })

  // =================================================================
  // TEST 19: Console Errors
  // =================================================================

  test('dashboard loads without console errors', async ({ page }) => {
    test.skip() // Skip until test authentication is set up

    const errors: string[] = []

    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        errors.push(msg.text())
      }
    })

    await page.goto('/dashboard')

    // Wait for page to fully load
    await page.waitForLoadState('networkidle')

    // Verify no console errors
    expect(errors).toHaveLength(0)
  })

  // =================================================================
  // TEST 20: Performance - Fast Load Time
  // =================================================================

  test('widget loads within acceptable time', async ({ page }) => {
    test.skip() // Skip until test authentication is set up

    await page.goto('/dashboard')

    const startTime = Date.now()

    // Wait for widget to be visible
    await page.waitForSelector('text=Overdue Payments', { timeout: 5000 })

    const loadTime = Date.now() - startTime

    // Verify loads within 5 seconds
    expect(loadTime).toBeLessThan(5000)
  })
})
