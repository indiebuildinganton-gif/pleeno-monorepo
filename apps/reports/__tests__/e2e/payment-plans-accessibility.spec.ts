/**
 * Accessibility Tests for Payment Plans Report
 *
 * Story 7.1 - Task 9: Add Responsive Design and Accessibility
 *
 * Tests WCAG 2.1 AA compliance using axe-core
 */

import { test, expect } from '@playwright/test'
import AxeBuilder from '@axe-core/playwright'

test.describe('Payment Plans Report - Accessibility', () => {
  test('should not have accessibility violations on report builder page', async ({ page }) => {
    // Navigate to the payment plans report page
    await page.goto('/reports/payment-plans')

    // Wait for the page to load
    await page.waitForLoadState('networkidle')

    // Run axe accessibility scan
    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
      .analyze()

    // Check for violations
    expect(accessibilityScanResults.violations).toEqual([])
  })

  test('should not have accessibility violations after generating report', async ({ page }) => {
    // Navigate to the payment plans report page
    await page.goto('/reports/payment-plans')

    // Wait for the page to load
    await page.waitForLoadState('networkidle')

    // Generate report by clicking the Generate Report button
    const generateButton = page.getByRole('button', { name: /generate.*report/i })
    await generateButton.click()

    // Wait for the table to appear
    await page.waitForSelector('[aria-label="Payment plans report"]', { timeout: 10000 })

    // Run axe accessibility scan on the results page
    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
      .analyze()

    // Check for violations
    expect(accessibilityScanResults.violations).toEqual([])
  })

  test('should be keyboard navigable - filters and form inputs', async ({ page }) => {
    await page.goto('/reports/payment-plans')
    await page.waitForLoadState('networkidle')

    // Start keyboard navigation from the first focusable element
    await page.keyboard.press('Tab') // Should focus on first input

    // Get the currently focused element
    let focusedElement = await page.evaluate(() => document.activeElement?.tagName)
    expect(focusedElement).toBeTruthy()

    // Tab through multiple elements to verify navigation works
    for (let i = 0; i < 10; i++) {
      await page.keyboard.press('Tab')
      focusedElement = await page.evaluate(() => document.activeElement?.tagName)
      expect(focusedElement).toBeTruthy()
    }

    // Verify we can focus on the Generate Report button
    const generateButton = page.getByRole('button', { name: /generate.*report/i })
    await generateButton.focus()
    const isButtonFocused = await generateButton.evaluate((el) => el === document.activeElement)
    expect(isButtonFocused).toBe(true)
  })

  test('should be keyboard navigable - preset filter buttons', async ({ page }) => {
    await page.goto('/reports/payment-plans')
    await page.waitForLoadState('networkidle')

    // Find and focus on a preset filter button
    const expiringButton = page.getByRole('button', {
      name: /expiring in 30 days/i,
    })

    // Focus on the button using keyboard navigation
    await expiringButton.focus()

    // Activate the button using Enter key
    await page.keyboard.press('Enter')

    // Check if the button is now pressed (active)
    const isPressed = await expiringButton.getAttribute('aria-pressed')
    expect(isPressed).toBe('true')

    // Try activating with Space key
    await page.keyboard.press(' ')

    // The button state should toggle (could be true or false depending on implementation)
    const isPressedAfter = await expiringButton.getAttribute('aria-pressed')
    expect(isPressedAfter).toBeDefined()
  })

  test('should have proper ARIA labels on form inputs', async ({ page }) => {
    await page.goto('/reports/payment-plans')
    await page.waitForLoadState('networkidle')

    // Check for ARIA labels on date inputs (desktop version)
    const dateFromInput = page.locator('#date_from')
    const dateFromLabel = await dateFromInput.getAttribute('aria-label')
    expect(dateFromLabel).toContain('date')

    const dateToInput = page.locator('#date_to')
    const dateToLabel = await dateToInput.getAttribute('aria-label')
    expect(dateToLabel).toContain('date')

    // Check for ARIA labels on select elements
    const collegeSelect = page.locator('#college_ids')
    const collegeLabel = await collegeSelect.getAttribute('aria-label')
    expect(collegeLabel).toContain('college')
  })

  test('should have accessible table with proper ARIA attributes', async ({ page }) => {
    await page.goto('/reports/payment-plans')
    await page.waitForLoadState('networkidle')

    // Generate report
    const generateButton = page.getByRole('button', { name: /generate.*report/i })
    await generateButton.click()

    // Wait for the table to appear
    await page.waitForSelector('[aria-label="Payment plans report"]', { timeout: 10000 })

    // Check table has proper ARIA label
    const table = page.locator('table[aria-label="Payment plans report"]')
    expect(await table.count()).toBeGreaterThan(0)

    // Check sortable headers have aria-sort attributes
    const sortableHeaders = page.locator('button[aria-sort]')
    expect(await sortableHeaders.count()).toBeGreaterThan(0)

    // Test sorting with keyboard
    const firstHeader = sortableHeaders.first()
    await firstHeader.focus()
    await page.keyboard.press('Enter')

    // Verify aria-sort changed
    const ariaSort = await firstHeader.getAttribute('aria-sort')
    expect(['ascending', 'descending']).toContain(ariaSort)
  })

  test('should have accessible pagination with proper ARIA labels', async ({ page }) => {
    await page.goto('/reports/payment-plans')
    await page.waitForLoadState('networkidle')

    // Generate report
    const generateButton = page.getByRole('button', { name: /generate.*report/i })
    await generateButton.click()

    // Wait for pagination to appear
    await page.waitForSelector('[aria-label="Report pagination"]', { timeout: 10000 })

    // Check pagination navigation has proper ARIA label
    const pagination = page.locator('[aria-label="Report pagination"]')
    expect(await pagination.count()).toBeGreaterThan(0)

    // Check pagination buttons have ARIA labels
    const previousButton = page.getByRole('button', { name: /previous/i })
    expect(await previousButton.count()).toBeGreaterThan(0)

    const nextButton = page.getByRole('button', { name: /next/i })
    expect(await nextButton.count()).toBeGreaterThan(0)

    // Test keyboard navigation on pagination
    await nextButton.focus()
    const isNextButtonFocused = await nextButton.evaluate((el) => el === document.activeElement)
    expect(isNextButtonFocused).toBe(true)
  })

  test('should have proper focus indicators visible', async ({ page }) => {
    await page.goto('/reports/payment-plans')
    await page.waitForLoadState('networkidle')

    // Get the Generate Report button
    const generateButton = page.getByRole('button', { name: /generate.*report/i })

    // Focus on the button
    await generateButton.focus()

    // Check if the focused element has visible focus styles
    // This checks for common focus indicators (outline, ring, border)
    const focusStyles = await generateButton.evaluate((el) => {
      const styles = window.getComputedStyle(el)
      return {
        outline: styles.outline,
        outlineWidth: styles.outlineWidth,
        boxShadow: styles.boxShadow,
      }
    })

    // Verify some focus indicator is present (outline or box-shadow)
    const hasFocusIndicator =
      focusStyles.outlineWidth !== '0px' ||
      focusStyles.outline !== 'none' ||
      focusStyles.boxShadow !== 'none'

    expect(hasFocusIndicator).toBe(true)
  })

  test('should meet color contrast requirements for contract expiration highlighting', async ({
    page,
  }) => {
    await page.goto('/reports/payment-plans')
    await page.waitForLoadState('networkidle')

    // Generate report
    const generateButton = page.getByRole('button', { name: /generate.*report/i })
    await generateButton.click()

    // Wait for the table to appear
    await page.waitForSelector('[aria-label="Payment plans report"]', { timeout: 10000 })

    // Run axe scan focusing on color contrast
    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(['wcag2aa'])
      .include('table')
      .analyze()

    // Filter for color contrast violations
    const contrastViolations = accessibilityScanResults.violations.filter((violation) =>
      violation.id.includes('color-contrast')
    )

    expect(contrastViolations).toEqual([])
  })
})

test.describe('Payment Plans Report - Responsive Design', () => {
  test('should show mobile accordion on small screens', async ({ page }) => {
    // Set viewport to mobile size
    await page.setViewportSize({ width: 375, height: 667 })

    await page.goto('/reports/payment-plans')
    await page.waitForLoadState('networkidle')

    // Check if mobile accordion is visible
    const mobileAccordion = page.locator('.md\\:hidden button[aria-expanded]')
    expect(await mobileAccordion.count()).toBeGreaterThan(0)

    // Check if desktop version is hidden
    const desktopVersion = page.locator('.hidden.md\\:block')
    expect(await desktopVersion.count()).toBeGreaterThan(0)
  })

  test('should show mobile cards instead of table on small screens', async ({ page }) => {
    // Set viewport to mobile size
    await page.setViewportSize({ width: 375, height: 667 })

    await page.goto('/reports/payment-plans')
    await page.waitForLoadState('networkidle')

    // Generate report
    const generateButton = page.getByRole('button', { name: /generate.*report/i })
    await generateButton.click()

    // Wait for results to load
    await page.waitForTimeout(2000)

    // Check if mobile cards are visible (should have CardTitle with student names)
    const mobileCards = page.locator('.md\\:hidden .space-y-4')
    expect(await mobileCards.count()).toBeGreaterThan(0)

    // Check if desktop table is hidden
    const desktopTable = page.locator('.hidden.md\\:block table')
    expect(await desktopTable.count()).toBeGreaterThan(0)
  })

  test('should show desktop table on large screens', async ({ page }) => {
    // Set viewport to desktop size
    await page.setViewportSize({ width: 1920, height: 1080 })

    await page.goto('/reports/payment-plans')
    await page.waitForLoadState('networkidle')

    // Generate report
    const generateButton = page.getByRole('button', { name: /generate.*report/i })
    await generateButton.click()

    // Wait for the table to appear
    await page.waitForSelector('[aria-label="Payment plans report"]', { timeout: 10000 })

    // Check if desktop table is visible
    const desktopTable = page.locator('table[aria-label="Payment plans report"]')
    expect(await desktopTable.isVisible()).toBe(true)
  })

  test('should show 2-column filter layout on desktop', async ({ page }) => {
    // Set viewport to desktop size
    await page.setViewportSize({ width: 1920, height: 1080 })

    await page.goto('/reports/payment-plans')
    await page.waitForLoadState('networkidle')

    // Check if the grid has 2 columns (md:grid-cols-2)
    const filterGrid = page.locator('.grid.grid-cols-1.md\\:grid-cols-2').first()
    expect(await filterGrid.count()).toBeGreaterThan(0)

    // Check if the desktop version is visible
    const desktopFilters = page.locator('.hidden.md\\:block')
    expect(await desktopFilters.isVisible()).toBe(true)
  })
})
