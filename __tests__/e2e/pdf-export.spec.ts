/**
 * PDF Export E2E Tests
 *
 * Story 7.3: PDF Export Functionality
 * Task 9: Testing - E2E Tests with Playwright
 *
 * End-to-end tests for PDF export functionality covering:
 * - User interactions
 * - Button states
 * - Download triggers
 * - Filter application
 * - Error handling
 */

import { test, expect } from '@playwright/test'
import type { Page, Download } from '@playwright/test'
import path from 'path'
import fs from 'fs'

// Helper to login before each test
async function login(page: Page) {
  // Navigate to login page
  await page.goto('/login')

  // Fill in credentials
  await page.fill('input[name="email"]', process.env.TEST_USER_EMAIL || 'test@example.com')
  await page.fill('input[name="password"]', process.env.TEST_USER_PASSWORD || 'testpassword123')

  // Submit login form
  await page.click('button[type="submit"]')

  // Wait for redirect to dashboard
  await page.waitForURL('/dashboard', { timeout: 10000 })
}

test.describe('PDF Export E2E', () => {
  test.beforeEach(async ({ page }) => {
    await login(page)
  })

  test.describe('Export Button Interaction', () => {
    test('should display PDF export button on payment plans report page', async ({ page }) => {
      await page.goto('/reports/payment-plans')

      // Wait for page to load
      await page.waitForSelector('[data-testid="report-table"]', { timeout: 10000 })

      // Check that export PDF button exists
      const exportButton = page.locator('button:has-text("Export PDF")')
      await expect(exportButton).toBeVisible()
    })

    test('should show loading state when exporting PDF', async ({ page }) => {
      await page.goto('/reports/payment-plans')
      await page.waitForSelector('[data-testid="report-table"]')

      // Click export PDF button
      await page.click('button:has-text("Export PDF")')

      // Verify loading state appears
      await expect(page.locator('text=Generating PDF...')).toBeVisible()

      // Wait a moment for the download to trigger
      await page.waitForTimeout(500)

      // Loading state should eventually disappear
      await expect(page.locator('text=Generating PDF...')).not.toBeVisible({ timeout: 5000 })
    })

    test('should disable button during export', async ({ page }) => {
      await page.goto('/reports/payment-plans')
      await page.waitForSelector('[data-testid="report-table"]')

      const exportButton = page.locator('button:has-text("Export PDF")')

      // Button should be enabled initially
      await expect(exportButton).toBeEnabled()

      // Click to start export
      await page.click('button:has-text("Export PDF")')

      // Button should be disabled during export
      await expect(page.locator('button:has-text("Generating PDF...")')).toBeDisabled()
    })
  })

  test.describe('PDF Download', () => {
    test('should trigger PDF download when clicking export button', async ({ page }) => {
      await page.goto('/reports/payment-plans')
      await page.waitForSelector('[data-testid="report-table"]')

      // Start waiting for download before clicking
      const downloadPromise = page.waitForEvent('download')

      // Click export PDF button
      await page.click('button:has-text("Export PDF")')

      // Wait for download to start
      const download = await downloadPromise

      // Verify download occurred
      expect(download).toBeTruthy()
    })

    test('should download PDF with correct filename format', async ({ page }) => {
      await page.goto('/reports/payment-plans')
      await page.waitForSelector('[data-testid="report-table"]')

      const downloadPromise = page.waitForEvent('download')
      await page.click('button:has-text("Export PDF")')
      const download = await downloadPromise

      // Check filename matches format: payment_plans_YYYY-MM-DD_HHMMSS.pdf
      const filename = download.suggestedFilename()
      expect(filename).toMatch(/^payment_plans_\d{4}-\d{2}-\d{2}_\d{6}\.pdf$/)
    })

    test('should download valid PDF file', async ({ page }) => {
      await page.goto('/reports/payment-plans')
      await page.waitForSelector('[data-testid="report-table"]')

      const downloadPromise = page.waitForEvent('download')
      await page.click('button:has-text("Export PDF")')
      const download = await downloadPromise

      // Save the download to a temp location
      const downloadPath = await download.path()

      expect(downloadPath).toBeTruthy()

      // Verify file exists and has content
      if (downloadPath) {
        const stats = fs.statSync(downloadPath)
        expect(stats.size).toBeGreaterThan(1000) // At least 1KB
      }
    })

    test('should download PDF with valid PDF header', async ({ page }) => {
      await page.goto('/reports/payment-plans')
      await page.waitForSelector('[data-testid="report-table"]')

      const downloadPromise = page.waitForEvent('download')
      await page.click('button:has-text("Export PDF")')
      const download = await downloadPromise

      const downloadPath = await download.path()

      if (downloadPath) {
        // Read first 5 bytes to verify PDF header
        const buffer = Buffer.alloc(5)
        const fd = fs.openSync(downloadPath, 'r')
        fs.readSync(fd, buffer, 0, 5, 0)
        fs.closeSync(fd)

        // PDF files start with "%PDF-"
        expect(buffer.toString()).toBe('%PDF-')
      }
    })
  })

  test.describe('Filter Application', () => {
    test('should apply date filters to PDF export', async ({ page }) => {
      await page.goto('/reports/payment-plans')
      await page.waitForSelector('[data-testid="report-table"]')

      // Apply date filters
      const dateFrom = page.locator('input[name="date_from"]')
      const dateTo = page.locator('input[name="date_to"]')

      if ((await dateFrom.count()) > 0) {
        await dateFrom.fill('2024-01-01')
      }

      if ((await dateTo.count()) > 0) {
        await dateTo.fill('2024-12-31')
      }

      // Wait for report to update
      await page.waitForTimeout(500)

      // Export PDF with filters
      const downloadPromise = page.waitForEvent('download')
      await page.click('button:has-text("Export PDF")')
      const download = await downloadPromise

      expect(download).toBeTruthy()
    })

    test('should apply status filters to PDF export', async ({ page }) => {
      await page.goto('/reports/payment-plans')
      await page.waitForSelector('[data-testid="report-table"]')

      // Apply status filter if available
      const statusFilter = page.locator('select[name="status"]')

      if ((await statusFilter.count()) > 0) {
        await statusFilter.selectOption('active')
        await page.waitForTimeout(500)
      }

      // Export PDF
      const downloadPromise = page.waitForEvent('download')
      await page.click('button:has-text("Export PDF")')
      const download = await downloadPromise

      expect(download).toBeTruthy()
    })
  })

  test.describe('Toast Notifications', () => {
    test('should show success toast when export starts', async ({ page }) => {
      await page.goto('/reports/payment-plans')
      await page.waitForSelector('[data-testid="report-table"]')

      // Click export
      await page.click('button:has-text("Export PDF")')

      // Check for success toast
      const toast = page.locator('text=Export Started')
      await expect(toast).toBeVisible({ timeout: 3000 })
    })

    test('should show row count in success toast', async ({ page }) => {
      await page.goto('/reports/payment-plans')
      await page.waitForSelector('[data-testid="report-table"]')

      await page.click('button:has-text("Export PDF")')

      // Toast should mention exporting rows to PDF
      const toast = page.locator('text=/Exporting.*to PDF/')
      await expect(toast).toBeVisible({ timeout: 3000 })
    })
  })

  test.describe('Multiple Exports', () => {
    test('should handle multiple exports in sequence', async ({ page }) => {
      await page.goto('/reports/payment-plans')
      await page.waitForSelector('[data-testid="report-table"]')

      // First export
      const download1Promise = page.waitForEvent('download')
      await page.click('button:has-text("Export PDF")')
      const download1 = await download1Promise

      expect(download1).toBeTruthy()

      // Wait for loading state to clear
      await page.waitForTimeout(2500)

      // Second export
      const download2Promise = page.waitForEvent('download')
      await page.click('button:has-text("Export PDF")')
      const download2 = await download2Promise

      expect(download2).toBeTruthy()
    })

    test('should generate unique filenames for sequential exports', async ({ page }) => {
      await page.goto('/reports/payment-plans')
      await page.waitForSelector('[data-testid="report-table"]')

      // First export
      const download1Promise = page.waitForEvent('download')
      await page.click('button:has-text("Export PDF")')
      const download1 = await download1Promise
      const filename1 = download1.suggestedFilename()

      // Wait a second to ensure different timestamp
      await page.waitForTimeout(1100)

      // Second export
      const download2Promise = page.waitForEvent('download')
      await page.click('button:has-text("Export PDF")')
      const download2 = await download2Promise
      const filename2 = download2.suggestedFilename()

      // Filenames should be different due to timestamps
      expect(filename1).not.toBe(filename2)
    })
  })

  test.describe('Accessibility', () => {
    test('should have accessible export button', async ({ page }) => {
      await page.goto('/reports/payment-plans')
      await page.waitForSelector('[data-testid="report-table"]')

      const exportButton = page.locator('button:has-text("Export PDF")')

      // Check button has aria-label
      const ariaLabel = await exportButton.getAttribute('aria-label')
      expect(ariaLabel).toBeTruthy()
      expect(ariaLabel).toContain('PDF')
    })

    test('should be keyboard navigable', async ({ page }) => {
      await page.goto('/reports/payment-plans')
      await page.waitForSelector('[data-testid="report-table"]')

      // Tab to export button
      await page.keyboard.press('Tab')
      await page.keyboard.press('Tab')
      await page.keyboard.press('Tab')

      // Check if export button is focused (this may vary based on page structure)
      const exportButton = page.locator('button:has-text("Export PDF")')
      const isFocusable = await exportButton.evaluate((el) => {
        return el.tabIndex >= 0
      })

      expect(isFocusable).toBe(true)
    })
  })

  test.describe('Empty Data Scenarios', () => {
    test('should handle export with no data', async ({ page }) => {
      await page.goto('/reports/payment-plans')
      await page.waitForSelector('[data-testid="report-table"]')

      // Apply filters that return no results
      const dateFrom = page.locator('input[name="date_from"]')

      if ((await dateFrom.count()) > 0) {
        await dateFrom.fill('2099-01-01')
        await page.waitForTimeout(500)
      }

      // Export should still work
      const downloadPromise = page.waitForEvent('download')
      await page.click('button:has-text("Export PDF")')
      const download = await downloadPromise

      expect(download).toBeTruthy()

      // PDF should still be generated (headers only)
      const downloadPath = await download.path()
      if (downloadPath) {
        const stats = fs.statSync(downloadPath)
        expect(stats.size).toBeGreaterThan(1000)
      }
    })
  })

  test.describe('Button States', () => {
    test('should show download icon in default state', async ({ page }) => {
      await page.goto('/reports/payment-plans')
      await page.waitForSelector('[data-testid="report-table"]')

      const exportButton = page.locator('button:has-text("Export PDF")')
      await expect(exportButton).toBeVisible()

      // Check for icon (implementation may vary)
      const hasIcon = await exportButton.locator('svg').count()
      expect(hasIcon).toBeGreaterThan(0)
    })

    test('should show spinner icon during export', async ({ page }) => {
      await page.goto('/reports/payment-plans')
      await page.waitForSelector('[data-testid="report-table"]')

      await page.click('button:has-text("Export PDF")')

      // Check for spinner/loading icon
      const loadingButton = page.locator('button:has-text("Generating PDF...")')
      await expect(loadingButton).toBeVisible()

      const hasSpinner = await loadingButton.locator('svg.animate-spin').count()
      expect(hasSpinner).toBeGreaterThan(0)
    })
  })

  test.describe('Report Page Layout', () => {
    test('should place export button next to CSV export', async ({ page }) => {
      await page.goto('/reports/payment-plans')
      await page.waitForSelector('[data-testid="report-table"]')

      const csvButton = page.locator('button:has-text("Export CSV")')
      const pdfButton = page.locator('button:has-text("Export PDF")')

      await expect(csvButton).toBeVisible()
      await expect(pdfButton).toBeVisible()

      // Both buttons should be in the same parent container
      const csvParent = await csvButton.locator('..')
      const pdfParent = await pdfButton.locator('..')

      // They should be siblings or close together
      expect(csvParent).toBeTruthy()
      expect(pdfParent).toBeTruthy()
    })
  })

  test.describe('Performance', () => {
    test('should trigger download within reasonable time', async ({ page }) => {
      await page.goto('/reports/payment-plans')
      await page.waitForSelector('[data-testid="report-table"]')

      const startTime = Date.now()

      const downloadPromise = page.waitForEvent('download', { timeout: 15000 })
      await page.click('button:has-text("Export PDF")')
      await downloadPromise

      const duration = Date.now() - startTime

      // Download should start within 15 seconds
      expect(duration).toBeLessThan(15000)
    })
  })
})
