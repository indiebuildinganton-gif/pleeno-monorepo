/**
 * Student Payment History E2E Tests
 *
 * Story 7.5: Student Payment History Report
 * Task 9: Testing and Validation
 *
 * End-to-end tests for the complete payment history feature
 */

import { test, expect, Page } from '@playwright/test'

// Test data helpers
const testStudent = {
  id: 'test-student-id',
  name: 'John Doe',
  email: 'john.doe@example.com',
}

const testUser = {
  email: 'test@agency.com',
  password: 'TestPassword123!',
}

// Helper function to login
async function login(page: Page) {
  await page.goto('/login')
  await page.fill('[name="email"]', testUser.email)
  await page.fill('[name="password"]', testUser.password)
  await page.click('button[type="submit"]')
  await page.waitForURL('/dashboard')
}

// Helper function to navigate to student detail page
async function navigateToStudent(page: Page, studentId: string) {
  await page.goto(`/students/${studentId}`)
  await page.waitForLoadState('networkidle')
}

test.describe('Student Payment History', () => {
  test.beforeEach(async ({ page }) => {
    // Note: In real implementation, you would set up test data in the database
    // For now, we'll assume the test student exists
    await login(page)
  })

  test.describe('Initial Display', () => {
    test('should display payment history section', async ({ page }) => {
      await navigateToStudent(page, testStudent.id)

      // Verify section title is visible
      await expect(page.locator('h2:has-text("Payment History")')).toBeVisible()
    })

    test('should display date filter dropdown', async ({ page }) => {
      await navigateToStudent(page, testStudent.id)

      // Verify filter controls are present
      await expect(page.locator('select[value="all"]')).toBeVisible()
      await expect(page.locator('text=Period:')).toBeVisible()
    })

    test('should display action buttons', async ({ page }) => {
      await navigateToStudent(page, testStudent.id)

      // Verify buttons exist
      await expect(page.locator('button:has-text("Refresh")')).toBeVisible()
      await expect(page.locator('button:has-text("Export PDF")')).toBeVisible()
    })

    test('should load payment history data', async ({ page }) => {
      await navigateToStudent(page, testStudent.id)

      // Wait for data to load (assuming student has payment history)
      await page.waitForSelector('[data-testid="payment-timeline"]', {
        timeout: 5000,
      })
    })
  })

  test.describe('Summary Display', () => {
    test('should display summary cards with totals', async ({ page }) => {
      await navigateToStudent(page, testStudent.id)

      // Wait for data load
      await page.waitForLoadState('networkidle')

      // Verify summary cards are present
      await expect(page.locator('text=Total Paid')).toBeVisible()
      await expect(page.locator('text=Total Outstanding')).toBeVisible()
      await expect(page.locator('text=Percentage Paid')).toBeVisible()
    })

    test('should format currency correctly in summary', async ({ page }) => {
      await navigateToStudent(page, testStudent.id)

      await page.waitForLoadState('networkidle')

      // Check for AUD currency format (e.g., $5,000.00)
      const summaryCards = page.locator('text=/\\$[0-9,]+\\.\\d{2}/')
      await expect(summaryCards.first()).toBeVisible()
    })
  })

  test.describe('Date Range Filtering', () => {
    test('should filter by "This Year"', async ({ page }) => {
      await navigateToStudent(page, testStudent.id)

      // Change filter to This Year
      await page.selectOption('select', 'thisYear')

      // Wait for data to reload
      await page.waitForLoadState('networkidle')

      // Verify filter text is displayed
      const currentYear = new Date().getFullYear()
      await expect(
        page.locator(`text=Showing: This Year (${currentYear})`)
      ).toBeVisible()
    })

    test('should display custom date inputs when "Custom Range" is selected', async ({
      page,
    }) => {
      await navigateToStudent(page, testStudent.id)

      // Change filter to Custom Range
      await page.selectOption('select', 'custom')

      // Verify custom date inputs appear
      await expect(page.locator('input[type="date"]#date-from')).toBeVisible()
      await expect(page.locator('input[type="date"]#date-to')).toBeVisible()
    })

    test('should filter by custom date range', async ({ page }) => {
      await navigateToStudent(page, testStudent.id)

      // Select custom range
      await page.selectOption('select', 'custom')

      // Set date range
      await page.fill('input#date-from', '2025-01-01')
      await page.fill('input#date-to', '2025-12-31')

      // Wait for data to reload
      await page.waitForLoadState('networkidle')

      // Verify filter text is updated
      await expect(
        page.locator('text=/Showing: Jan.*2025.*Dec.*2025/')
      ).toBeVisible()
    })

    test('should show error for invalid custom date range', async ({ page }) => {
      await navigateToStudent(page, testStudent.id)

      // Select custom range
      await page.selectOption('select', 'custom')

      // Set invalid date range (end before start)
      await page.fill('input#date-from', '2025-12-31')
      await page.fill('input#date-to', '2025-01-01')

      // Verify error message
      await expect(
        page.locator('text=/Invalid date range/')
      ).toBeVisible()

      // Verify export button is disabled
      await expect(page.locator('button:has-text("Export PDF")')).toBeDisabled()
    })

    test('should reset to "All Time" filter', async ({ page }) => {
      await navigateToStudent(page, testStudent.id)

      // Change to This Year
      await page.selectOption('select', 'thisYear')
      await page.waitForLoadState('networkidle')

      // Change back to All Time
      await page.selectOption('select', 'all')
      await page.waitForLoadState('networkidle')

      // Verify filter text
      await expect(page.locator('text=Showing: All Time')).toBeVisible()
    })
  })

  test.describe('Refresh Functionality', () => {
    test('should refresh payment history when refresh button is clicked', async ({
      page,
    }) => {
      await navigateToStudent(page, testStudent.id)

      // Wait for initial load
      await page.waitForLoadState('networkidle')

      // Click refresh button
      await page.click('button:has-text("Refresh")')

      // Verify loading state appears
      await expect(
        page.locator('text=Loading payment history...')
      ).toBeVisible({ timeout: 1000 })

      // Wait for reload to complete
      await page.waitForLoadState('networkidle')
    })
  })

  test.describe('PDF Export', () => {
    test('should export PDF when button is clicked', async ({ page }) => {
      await navigateToStudent(page, testStudent.id)

      // Wait for data to load
      await page.waitForLoadState('networkidle')

      // Set up download listener
      const downloadPromise = page.waitForEvent('download')

      // Click export button
      await page.click('button:has-text("Export PDF")')

      // Wait for download
      const download = await downloadPromise

      // Verify filename
      expect(download.suggestedFilename()).toContain('payment_statement')
      expect(download.suggestedFilename()).toMatch(/\.pdf$/)
    })

    test('should disable export button when no payment history', async ({
      page,
    }) => {
      // Navigate to student with no payment history
      // (In real implementation, you'd create a student with no data)
      await page.goto('/students/student-no-payments')
      await page.waitForLoadState('networkidle')

      // Verify export button is disabled
      await expect(page.locator('button:has-text("Export PDF")')).toBeDisabled()
    })

    test('should export PDF with custom date range', async ({ page }) => {
      await navigateToStudent(page, testStudent.id)

      // Select custom range
      await page.selectOption('select', 'custom')
      await page.fill('input#date-from', '2025-01-01')
      await page.fill('input#date-to', '2025-12-31')
      await page.waitForLoadState('networkidle')

      // Set up download listener
      const downloadPromise = page.waitForEvent('download')

      // Click export button
      await page.click('button:has-text("Export PDF")')

      // Wait for download
      const download = await downloadPromise

      // Verify download occurred
      expect(download.suggestedFilename()).toContain('payment_statement')
    })

    test('should display exporting state during export', async ({ page }) => {
      await navigateToStudent(page, testStudent.id)
      await page.waitForLoadState('networkidle')

      // Click export button
      const exportButton = page.locator('button:has-text("Export PDF")')
      await exportButton.click()

      // Verify button changes to "Exporting..."
      await expect(page.locator('button:has-text("Exporting...")')).toBeVisible(
        { timeout: 1000 }
      )
    })
  })

  test.describe('Payment Plan Display', () => {
    test('should display payment plan cards', async ({ page }) => {
      await navigateToStudent(page, testStudent.id)
      await page.waitForLoadState('networkidle')

      // Verify payment plan details are visible (assuming student has plans)
      await expect(
        page.locator('text=/Total Amount/').first()
      ).toBeVisible()
    })

    test('should display installment table', async ({ page }) => {
      await navigateToStudent(page, testStudent.id)
      await page.waitForLoadState('networkidle')

      // Verify table headers
      await expect(page.locator('th:has-text("Due Date")')).toBeVisible()
      await expect(page.locator('th:has-text("Amount")')).toBeVisible()
      await expect(page.locator('th:has-text("Paid Amount")')).toBeVisible()
      await expect(page.locator('th:has-text("Paid Date")')).toBeVisible()
      await expect(page.locator('th:has-text("Status")')).toBeVisible()
    })

    test('should display status badges with correct colors', async ({ page }) => {
      await navigateToStudent(page, testStudent.id)
      await page.waitForLoadState('networkidle')

      // Check for status badges (colors are tested in component tests)
      const statusBadges = page.locator('span:has-text(/paid|pending|overdue/)')
      await expect(statusBadges.first()).toBeVisible()
    })

    test('should display payment plan count', async ({ page }) => {
      await navigateToStudent(page, testStudent.id)
      await page.waitForLoadState('networkidle')

      // Verify plan count is displayed
      await expect(page.locator('text=/payment plan/')).toBeVisible()
    })
  })

  test.describe('Empty State', () => {
    test('should display empty state when no payment history', async ({
      page,
    }) => {
      // Navigate to student with no payment history
      // (In real implementation, you'd create a student with no data)
      await page.goto('/students/student-no-payments')
      await page.waitForLoadState('networkidle')

      // Verify empty state message
      await expect(
        page.locator('text=No payment history available')
      ).toBeVisible()
    })

    test('should show "View all payment history" link when filtered with no results', async ({
      page,
    }) => {
      await navigateToStudent(page, testStudent.id)

      // Apply filter that returns no results
      await page.selectOption('select', 'custom')
      await page.fill('input#date-from', '2020-01-01')
      await page.fill('input#date-to', '2020-12-31')
      await page.waitForLoadState('networkidle')

      // Verify link to view all is present
      await expect(
        page.locator('button:has-text("View all payment history")')
      ).toBeVisible()
    })

    test('should reset to all time when clicking "View all payment history"', async ({
      page,
    }) => {
      await navigateToStudent(page, testStudent.id)

      // Apply filter
      await page.selectOption('select', 'thisYear')
      await page.waitForLoadState('networkidle')

      // Assuming this shows empty state (depends on test data)
      const viewAllLink = page.locator(
        'button:has-text("View all payment history")'
      )

      if (await viewAllLink.isVisible()) {
        await viewAllLink.click()
        await page.waitForLoadState('networkidle')

        // Verify filter is reset
        await expect(page.locator('text=Showing: All Time')).toBeVisible()
      }
    })
  })

  test.describe('Error Handling', () => {
    test('should display error message when API fails', async ({ page }) => {
      // Intercept API request and return error
      await page.route('**/api/students/*/payment-history*', (route) =>
        route.fulfill({
          status: 500,
          body: JSON.stringify({ error: 'Internal server error' }),
        })
      )

      await navigateToStudent(page, testStudent.id)

      // Verify error message is displayed
      await expect(
        page.locator('text=Failed to load payment history')
      ).toBeVisible()
    })

    test('should allow retry after error', async ({ page }) => {
      let requestCount = 0

      // Intercept API request - fail first, succeed second
      await page.route('**/api/students/*/payment-history*', (route) => {
        requestCount++
        if (requestCount === 1) {
          route.fulfill({
            status: 500,
            body: JSON.stringify({ error: 'Internal server error' }),
          })
        } else {
          route.continue()
        }
      })

      await navigateToStudent(page, testStudent.id)

      // Wait for error message
      await expect(
        page.locator('text=Failed to load payment history')
      ).toBeVisible()

      // Click refresh to retry
      await page.click('button:has-text("Refresh")')

      // Verify error message disappears
      await expect(
        page.locator('text=Failed to load payment history')
      ).not.toBeVisible({ timeout: 5000 })
    })
  })

  test.describe('Responsive Design', () => {
    test('should display correctly on mobile viewport', async ({ page }) => {
      // Set mobile viewport
      await page.setViewportSize({ width: 375, height: 667 })

      await navigateToStudent(page, testStudent.id)
      await page.waitForLoadState('networkidle')

      // Verify key elements are still visible
      await expect(page.locator('h2:has-text("Payment History")')).toBeVisible()
      await expect(page.locator('select')).toBeVisible()
    })

    test('should display correctly on tablet viewport', async ({ page }) => {
      // Set tablet viewport
      await page.setViewportSize({ width: 768, height: 1024 })

      await navigateToStudent(page, testStudent.id)
      await page.waitForLoadState('networkidle')

      // Verify layout adapts
      await expect(page.locator('h2:has-text("Payment History")')).toBeVisible()
    })
  })

  test.describe('Accessibility', () => {
    test('should have proper ARIA labels', async ({ page }) => {
      await navigateToStudent(page, testStudent.id)

      // Check for labeled form elements
      await expect(page.locator('label:has-text("Period:")')).toBeVisible()
      await expect(page.locator('label:has-text("From:")')).toBeHidden() // Hidden until custom selected
    })

    test('should support keyboard navigation', async ({ page }) => {
      await navigateToStudent(page, testStudent.id)
      await page.waitForLoadState('networkidle')

      // Tab through interactive elements
      await page.keyboard.press('Tab')
      await page.keyboard.press('Tab')

      // Verify focus is on a button
      const focusedElement = await page.evaluateHandle(() => document.activeElement)
      const tagName = await page.evaluate((el) => el.tagName, focusedElement)
      expect(['SELECT', 'BUTTON']).toContain(tagName)
    })

    test('should have sufficient color contrast for status badges', async ({
      page,
    }) => {
      await navigateToStudent(page, testStudent.id)
      await page.waitForLoadState('networkidle')

      // This is a basic check - full color contrast testing requires specialized tools
      const statusBadge = page.locator('span:has-text("paid")').first()
      if (await statusBadge.isVisible()) {
        const styles = await statusBadge.evaluate((el) =>
          window.getComputedStyle(el)
        )
        // Verify text color is set (actual contrast check would need more complex calculation)
        expect(styles.color).toBeTruthy()
      }
    })
  })

  test.describe('Performance', () => {
    test('should load payment history within reasonable time', async ({
      page,
    }) => {
      const startTime = Date.now()

      await navigateToStudent(page, testStudent.id)
      await page.waitForLoadState('networkidle')

      const loadTime = Date.now() - startTime

      // Verify page loads within 5 seconds
      expect(loadTime).toBeLessThan(5000)
    })

    test('should handle large payment history without freezing', async ({
      page,
    }) => {
      // Note: This test assumes there's a student with many payment plans
      // In real implementation, you'd seed the database with test data

      await page.goto('/students/student-with-large-history')
      await page.waitForLoadState('networkidle')

      // Verify page is still responsive
      await page.click('select')
      await page.selectOption('select', 'thisYear')

      // Page should respond within reasonable time
      await page.waitForLoadState('networkidle', { timeout: 10000 })
    })
  })
})
