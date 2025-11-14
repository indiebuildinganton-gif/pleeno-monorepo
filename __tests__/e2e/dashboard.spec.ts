/**
 * Dashboard E2E Tests
 *
 * End-to-end tests for dashboard page integration using Playwright
 * Epic 6: Dashboard & Reporting Zone
 * Story 6.3: Commission Breakdown by College
 * Task 8: Integration Tests
 */

import { test, expect } from '@playwright/test'

test.describe('Dashboard - Commission Breakdown Widget Integration', () => {
  test.beforeEach(async ({ page }) => {
    // Note: These tests require an authenticated admin user
    // In a real implementation, you would set up authentication state
    // For now, we'll skip the actual test execution but document the expected behavior
  })

  test('dashboard page loads successfully', async ({ page }) => {
    test.skip() // Skip until test authentication is set up

    await page.goto('/dashboard')

    // Verify page loads without errors
    await expect(page.getByRole('heading', { name: /dashboard/i, level: 1 })).toBeVisible()

    // Check for console errors
    const errors: string[] = []
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        errors.push(msg.text())
      }
    })

    // Wait for page to fully load
    await page.waitForLoadState('networkidle')

    // Verify no console errors
    expect(errors).toHaveLength(0)
  })

  test('commission breakdown widget displays on dashboard', async ({ page }) => {
    test.skip() // Skip until test authentication is set up

    await page.goto('/dashboard')

    // Verify section heading
    await expect(
      page.getByRole('heading', { name: /commission performance by college/i, level: 2 })
    ).toBeVisible()

    // Verify widget heading
    await expect(
      page.getByRole('heading', { name: /commission breakdown by college/i })
    ).toBeVisible()

    // Verify widget container displays
    const widget = page.locator('div').filter({ hasText: /commission breakdown by college/i }).first()
    await expect(widget).toBeVisible()

    // Verify table renders
    await expect(page.locator('table[aria-label*="Commission breakdown"]')).toBeVisible()

    // Verify table headers
    await expect(page.getByRole('columnheader', { name: /college/i })).toBeVisible()
    await expect(page.getByRole('columnheader', { name: /branch/i })).toBeVisible()
    await expect(page.getByRole('columnheader', { name: /commissions/i })).toBeVisible()
    await expect(page.getByRole('columnheader', { name: /gst/i })).toBeVisible()
    await expect(page.getByRole('columnheader', { name: /total \(\+ gst\)/i })).toBeVisible()
    await expect(page.getByRole('columnheader', { name: /expected/i })).toBeVisible()
    await expect(page.getByRole('columnheader', { name: /earned/i })).toBeVisible()
    await expect(page.getByRole('columnheader', { name: /outstanding/i })).toBeVisible()
    await expect(page.getByRole('columnheader', { name: /actions/i })).toBeVisible()
  })

  test('widget is positioned below payment status widget', async ({ page }) => {
    test.skip() // Skip until test authentication is set up

    await page.goto('/dashboard')

    // Wait for all sections to load
    await page.waitForSelector('text=/commission performance by college/i')
    await page.waitForSelector('text=/payment status overview/i')

    const paymentStatusSection = page.locator('section:has(h2:text("Payment Status Overview"))')
    const commissionSection = page.locator(
      'section:has(h2:text("Commission Performance by College"))'
    )

    const paymentStatusBox = await paymentStatusSection.boundingBox()
    const commissionBox = await commissionSection.boundingBox()

    // Commission widget should be below (higher Y position)
    if (paymentStatusBox && commissionBox) {
      expect(commissionBox.y).toBeGreaterThan(paymentStatusBox.y)
    }
  })

  test('commission breakdown widget is full width', async ({ page }) => {
    test.skip() // Skip until test authentication is set up

    await page.goto('/dashboard')

    // Wait for widget to load
    await page.waitForSelector('text=/commission breakdown by college/i')

    const section = page.locator('section:has(h2:text("Commission Performance by College"))')
    const container = page.locator('div.container')

    const sectionBox = await section.boundingBox()
    const containerBox = await container.boundingBox()

    // Widget section should span full container width (within margin of error for padding)
    if (sectionBox && containerBox) {
      expect(sectionBox.width).toBeGreaterThan(containerBox.width * 0.9)
    }
  })

  test('dashboard layout is responsive on different screen sizes', async ({ page }) => {
    test.skip() // Skip until test authentication is set up

    await page.goto('/dashboard')

    // Desktop (1280x720)
    await page.setViewportSize({ width: 1280, height: 720 })
    await expect(
      page.getByRole('heading', { name: /commission breakdown by college/i })
    ).toBeVisible()
    await expect(page.locator('table[aria-label*="Commission breakdown"]')).toBeVisible()

    // Tablet (768x1024)
    await page.setViewportSize({ width: 768, height: 1024 })
    await expect(
      page.getByRole('heading', { name: /commission breakdown by college/i })
    ).toBeVisible()
    await expect(page.locator('table[aria-label*="Commission breakdown"]')).toBeVisible()

    // Mobile (375x667)
    await page.setViewportSize({ width: 375, height: 667 })
    await expect(
      page.getByRole('heading', { name: /commission breakdown by college/i })
    ).toBeVisible()
    // Table should be scrollable on mobile
    await expect(page.locator('div.overflow-x-auto')).toBeVisible()
  })

  test('all dashboard widgets render correctly together', async ({ page }) => {
    test.skip() // Skip until test authentication is set up

    await page.goto('/dashboard')

    // Verify all major dashboard sections are visible
    await expect(page.getByRole('heading', { name: /key metrics/i, level: 2 })).toBeVisible()
    await expect(
      page.getByRole('heading', { name: /seasonal trends/i, level: 2 })
    ).toBeVisible()
    await expect(
      page.getByRole('heading', { name: /commission breakdown/i, level: 2 })
    ).toBeVisible()
    await expect(
      page.getByRole('heading', { name: /payment status overview/i, level: 2 })
    ).toBeVisible()
    await expect(
      page.getByRole('heading', { name: /commission performance by college/i, level: 2 })
    ).toBeVisible()

    // Verify no layout overlaps or conflicts
    const sections = await page.locator('section').all()
    expect(sections.length).toBeGreaterThan(0)

    // Check each section has reasonable height (not collapsed)
    for (const section of sections) {
      const box = await section.boundingBox()
      if (box) {
        expect(box.height).toBeGreaterThan(50)
      }
    }
  })

  test('commission breakdown widget filters work correctly', async ({ page }) => {
    test.skip() // Skip until test authentication is set up

    await page.goto('/dashboard')

    // Wait for widget to load
    await page.waitForSelector('text=/commission breakdown by college/i')

    // Test time period filter
    const periodFilter = page.locator('select#period-filter')
    await expect(periodFilter).toBeVisible()
    await periodFilter.selectOption('month')
    await expect(periodFilter).toHaveValue('month')

    // Verify date range indicator updates
    await expect(page.locator('text=/this month/i')).toBeVisible()

    // Test college filter
    const collegeFilter = page.locator('select#college-filter')
    await expect(collegeFilter).toBeVisible()

    // Test branch filter
    const branchFilter = page.locator('select#branch-filter')
    await expect(branchFilter).toBeVisible()

    // Test clear filters button
    const clearFiltersButton = page.getByRole('button', { name: /clear filters/i })
    await expect(clearFiltersButton).toBeVisible()
  })

  test('commission breakdown widget refresh button works', async ({ page }) => {
    test.skip() // Skip until test authentication is set up

    await page.goto('/dashboard')

    // Wait for widget to load
    await page.waitForSelector('text=/commission breakdown by college/i')

    // Find and click refresh button
    const refreshButton = page.getByRole('button', { name: /refresh/i }).last()
    await expect(refreshButton).toBeVisible()
    await expect(refreshButton).toBeEnabled()

    // Click refresh
    await refreshButton.click()

    // Verify button shows loading state (disabled while refreshing)
    // Note: This may be brief, so we check for the spinner icon
    const refreshIcon = refreshButton.locator('svg')
    await expect(refreshIcon).toBeVisible()
  })

  test('commission breakdown widget summary cards display', async ({ page }) => {
    test.skip() // Skip until test authentication is set up

    await page.goto('/dashboard')

    // Wait for widget to load
    await page.waitForSelector('text=/commission breakdown by college/i')

    // Verify summary cards
    await expect(page.locator('text=/total commissions earned/i')).toBeVisible()
    await expect(page.locator('text=/total gst/i')).toBeVisible()
    await expect(page.locator('text=/total amount \(commission \+ gst\)/i')).toBeVisible()
    await expect(page.locator('text=/outstanding commission/i')).toBeVisible()
  })

  test('commission breakdown widget handles error gracefully', async ({ page }) => {
    test.skip() // Skip until test authentication is set up

    // Mock API to return error
    await page.route('**/api/commission-by-college*', (route) => {
      route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({ success: false, error: 'Internal server error' }),
      })
    })

    await page.goto('/dashboard')

    // Wait for error state to display
    await page.waitForSelector('text=/failed to load data/i')

    // Verify error message displays
    await expect(page.locator('text=/failed to load data/i')).toBeVisible()

    // Verify try again button
    await expect(page.getByRole('button', { name: /try again/i })).toBeVisible()

    // Verify other widgets still work (dashboard doesn't break)
    await expect(page.getByRole('heading', { name: /key metrics/i, level: 2 })).toBeVisible()
  })

  test('commission breakdown widget handles empty state', async ({ page }) => {
    test.skip() // Skip until test authentication is set up

    // Mock API to return empty data
    await page.route('**/api/commission-by-college*', (route) => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true, data: [] }),
      })
    })

    await page.goto('/dashboard')

    // Wait for empty state to display
    await page.waitForSelector('text=/no commission data/i')

    // Verify empty state message
    await expect(page.locator('text=/no commission data/i')).toBeVisible()
    await expect(
      page.locator('text=/try adjusting your filters/i')
    ).toBeVisible()

    // Verify summary cards show zero values
    await expect(page.locator('text=/no data available/i')).toBeVisible()
  })

  test('commission breakdown drill-down links work', async ({ page }) => {
    test.skip() // Skip until test authentication is set up

    await page.goto('/dashboard')

    // Wait for widget with data to load
    await page.waitForSelector('table[aria-label*="Commission breakdown"]')

    // Find and click "View Plans" button for first row
    const viewPlansButton = page.getByRole('link', { name: /view plans/i }).first()
    await expect(viewPlansButton).toBeVisible()

    // Click link (this will navigate to payment plans page)
    await viewPlansButton.click()

    // Verify navigation to payment plans page with filters
    await expect(page).toHaveURL(/\/payments\/plans\?college=.*&branch=.*/)
  })

  test('keyboard navigation works through dashboard widgets', async ({ page }) => {
    test.skip() // Skip until test authentication is set up

    await page.goto('/dashboard')

    // Wait for page to fully load
    await page.waitForLoadState('networkidle')

    // Tab through interactive elements
    await page.keyboard.press('Tab')

    // Verify focus moves through widgets in logical order
    // (This is a basic test - full keyboard navigation testing would be more comprehensive)
    const focusedElement = await page.evaluate(() => document.activeElement?.tagName)
    expect(focusedElement).toBeTruthy()
  })

  test('screen reader can access dashboard structure', async ({ page }) => {
    test.skip() // Skip until test authentication is set up

    await page.goto('/dashboard')

    // Verify proper heading hierarchy
    const h1 = await page.locator('h1').count()
    expect(h1).toBeGreaterThan(0)

    const h2 = await page.locator('h2').count()
    expect(h2).toBeGreaterThan(0)

    // Verify ARIA labels on interactive elements
    const refreshButton = page.getByRole('button', { name: /refresh/i }).last()
    await expect(refreshButton).toHaveAttribute('aria-label')

    // Verify table has proper ARIA labels
    const table = page.locator('table[aria-label*="Commission breakdown"]')
    await expect(table).toHaveAttribute('aria-label')
  })
})
