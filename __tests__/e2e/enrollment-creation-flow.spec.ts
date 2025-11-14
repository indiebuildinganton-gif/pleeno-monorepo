/**
 * E2E Test: Enrollment Creation via Payment Plan Flow
 *
 * Tests the complete user journey of creating a payment plan with enrollment:
 * - Navigate to payment plan creation form
 * - Select student, college/branch, program
 * - Upload offer letter
 * - Save payment plan
 * - Verify enrollment is created and visible
 *
 * Epic 3: Entities Domain
 * Story 3.3: Student-College Enrollment Linking
 * Task 12: Testing (Final Task)
 */

import { test, expect } from '@playwright/test'

test.describe('Enrollment Creation Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Login as agency admin
    await page.goto('/login')
    await page.fill('input[name="email"]', 'admin@testagency.com')
    await page.fill('input[name="password"]', 'testpassword')
    await page.click('button[type="submit"]')
    await page.waitForURL('/dashboard')
  })

  test('creates enrollment through payment plan creation', async ({ page }) => {
    // Navigate to payment plan creation
    await page.goto('/plans/new')
    await expect(page.locator('h1')).toContainText('Create Payment Plan')

    // Select student
    await page.click('[data-testid="student-select"]')
    await page.fill('[data-testid="student-search"]', 'John Doe')
    await page.click('[data-testid="student-option-john-doe"]')

    // Select college and branch
    await page.click('[data-testid="college-select"]')
    await page.click('[data-testid="college-option-university-of-toronto"]')
    await page.click('[data-testid="branch-select"]')
    await page.click('[data-testid="branch-option-main-campus"]')

    // Enter program name
    await page.fill('[data-testid="program-name-input"]', 'Bachelor of Computer Science')

    // Upload offer letter
    const fileInput = page.locator('input[type="file"]')
    await fileInput.setInputFiles({
      name: 'offer-letter.pdf',
      mimeType: 'application/pdf',
      buffer: Buffer.from('PDF content'),
    })

    // Verify file preview appears
    await expect(page.locator('[data-testid="offer-letter-preview"]')).toBeVisible()

    // Fill payment details
    await page.fill('[data-testid="total-fee-input"]', '50000')
    await page.fill('[data-testid="installment-count-input"]', '4')

    // Submit form
    await page.click('button[type="submit"]')

    // Wait for success toast
    await expect(page.locator('[role="status"]')).toContainText('Payment plan created successfully')

    // Navigate to student detail page
    await page.goto('/students')
    await page.click('text=John Doe')

    // Verify enrollment appears in enrollments section
    await expect(page.locator('[data-testid="enrollments-section"]')).toBeVisible()
    await expect(page.locator('[data-testid="enrollment-college-name"]')).toContainText(
      'University of Toronto'
    )
    await expect(page.locator('[data-testid="enrollment-program-name"]')).toContainText(
      'Bachelor of Computer Science'
    )
    await expect(page.locator('[data-testid="enrollment-status-badge"]')).toContainText('Active')
  })

  test('reuses existing enrollment when creating second payment plan', async ({ page }) => {
    // Create first payment plan (creates enrollment)
    await page.goto('/plans/new')
    await page.click('[data-testid="student-select"]')
    await page.click('[data-testid="student-option-jane-smith"]')
    await page.click('[data-testid="college-select"]')
    await page.click('[data-testid="college-option-tech-university"]')
    await page.click('[data-testid="branch-select"]')
    await page.click('[data-testid="branch-option-downtown-campus"]')
    await page.fill('[data-testid="program-name-input"]', 'Master of Business Administration')
    await page.fill('[data-testid="total-fee-input"]', '30000')
    await page.fill('[data-testid="installment-count-input"]', '3')
    await page.click('button[type="submit"]')
    await expect(page.locator('[role="status"]')).toContainText('Payment plan created successfully')

    // Create second payment plan with same student-branch-program
    await page.goto('/plans/new')
    await page.click('[data-testid="student-select"]')
    await page.click('[data-testid="student-option-jane-smith"]')
    await page.click('[data-testid="college-select"]')
    await page.click('[data-testid="college-option-tech-university"]')
    await page.click('[data-testid="branch-select"]')
    await page.click('[data-testid="branch-option-downtown-campus"]')
    await page.fill('[data-testid="program-name-input"]', 'Master of Business Administration')
    await page.fill('[data-testid="total-fee-input"]', '10000')
    await page.fill('[data-testid="installment-count-input"]', '2')
    await page.click('button[type="submit"]')

    // Verify duplicate enrollment detection toast
    await expect(page.locator('[role="status"]')).toContainText('Existing enrollment found')
    await expect(page.locator('[role="status"]')).toContainText('Payment plan created successfully')

    // Verify only one enrollment exists for student-branch-program combination
    await page.goto('/students')
    await page.click('text=Jane Smith')
    const enrollmentRows = page.locator('[data-testid="enrollment-row"]')
    const mbaEnrollments = enrollmentRows.filter({
      hasText: 'Master of Business Administration',
    })
    await expect(mbaEnrollments).toHaveCount(1)
  })

  test('allows multiple enrollments for same student at different programs', async ({ page }) => {
    const studentName = 'Multi Program Student'

    // Create enrollment for first program
    await page.goto('/plans/new')
    await page.click('[data-testid="student-select"]')
    await page.click(`[data-testid="student-option-${studentName.toLowerCase().replace(/\s+/g, '-')}"]`)
    await page.click('[data-testid="college-select"]')
    await page.click('[data-testid="college-option-example-college"]')
    await page.click('[data-testid="branch-select"]')
    await page.click('[data-testid="branch-option-branch-a"]')
    await page.fill('[data-testid="program-name-input"]', 'Program A')
    await page.fill('[data-testid="total-fee-input"]', '20000')
    await page.click('button[type="submit"]')
    await expect(page.locator('[role="status"]')).toContainText('created successfully')

    // Create enrollment for second program (different)
    await page.goto('/plans/new')
    await page.click('[data-testid="student-select"]')
    await page.click(`[data-testid="student-option-${studentName.toLowerCase().replace(/\s+/g, '-')}"]`)
    await page.click('[data-testid="college-select"]')
    await page.click('[data-testid="college-option-example-college"]')
    await page.click('[data-testid="branch-select"]')
    await page.click('[data-testid="branch-option-branch-a"]')
    await page.fill('[data-testid="program-name-input"]', 'Program B')
    await page.fill('[data-testid="total-fee-input"]', '25000')
    await page.click('button[type="submit"]')
    await expect(page.locator('[role="status"]')).toContainText('created successfully')

    // Verify both enrollments exist
    await page.goto('/students')
    await page.click(`text=${studentName}`)
    const enrollmentRows = page.locator('[data-testid="enrollment-row"]')
    await expect(enrollmentRows).toHaveCount(2)
    await expect(page.locator('text=Program A')).toBeVisible()
    await expect(page.locator('text=Program B')).toBeVisible()
  })
})

test.describe('Document Viewer Functionality', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login')
    await page.fill('input[name="email"]', 'admin@testagency.com')
    await page.fill('input[name="password"]', 'testpassword')
    await page.click('button[type="submit"]')
    await page.waitForURL('/dashboard')
  })

  test('opens document viewer for offer letter', async ({ page }) => {
    // Navigate to student with enrollment
    await page.goto('/students')
    await page.click('text=Student With Enrollment')

    // Click "View Offer Letter" button
    await page.click('[data-testid="view-offer-letter-button"]')

    // Verify DocumentViewer modal opens
    await expect(page.locator('[data-testid="document-viewer-modal"]')).toBeVisible()
    await expect(page.locator('[data-testid="document-viewer-title"]')).toContainText(
      'offer-letter.pdf'
    )

    // Verify PDF iframe is visible
    await expect(page.locator('iframe[title="Document preview"]')).toBeVisible()
  })

  test('toggles fullscreen mode in document viewer', async ({ page }) => {
    await page.goto('/students')
    await page.click('text=Student With Enrollment')
    await page.click('[data-testid="view-offer-letter-button"]')

    // Click maximize button
    await page.click('[data-testid="maximize-button"]')

    // Verify modal is in fullscreen mode (check class or size)
    const modal = page.locator('[data-testid="document-viewer-modal"]')
    await expect(modal).toHaveClass(/max-w-full/)

    // Click again to restore
    await page.click('[data-testid="maximize-button"]')
    await expect(modal).not.toHaveClass(/max-w-full/)
  })

  test('downloads offer letter from document viewer', async ({ page }) => {
    await page.goto('/students')
    await page.click('text=Student With Enrollment')
    await page.click('[data-testid="view-offer-letter-button"]')

    // Set up download handler
    const downloadPromise = page.waitForEvent('download')

    // Click download button
    await page.click('[data-testid="download-button"]')

    // Verify download starts
    const download = await downloadPromise
    expect(download.suggestedFilename()).toContain('offer-letter.pdf')
  })

  test('closes document viewer on ESC key', async ({ page }) => {
    await page.goto('/students')
    await page.click('text=Student With Enrollment')
    await page.click('[data-testid="view-offer-letter-button"]')

    // Press ESC key
    await page.keyboard.press('Escape')

    // Verify modal is closed
    await expect(page.locator('[data-testid="document-viewer-modal"]')).not.toBeVisible()
  })

  test('closes document viewer on close button', async ({ page }) => {
    await page.goto('/students')
    await page.click('text=Student With Enrollment')
    await page.click('[data-testid="view-offer-letter-button"]')

    // Click close button
    await page.click('[data-testid="close-button"]')

    // Verify modal is closed
    await expect(page.locator('[data-testid="document-viewer-modal"]')).not.toBeVisible()
  })
})

test.describe('Enrollment Status Management', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login')
    await page.fill('input[name="email"]', 'admin@testagency.com')
    await page.fill('input[name="password"]', 'testpassword')
    await page.click('button[type="submit"]')
    await page.waitForURL('/dashboard')
  })

  test('updates enrollment status from active to completed', async ({ page }) => {
    await page.goto('/students')
    await page.click('text=Student With Active Enrollment')

    // Open status menu
    await page.click('[data-testid="enrollment-status-menu"]')

    // Click "Mark as Completed"
    await page.click('text=Mark as Completed')

    // Confirm in dialog
    await page.click('[data-testid="confirm-status-change"]')

    // Verify success toast
    await expect(page.locator('[role="status"]')).toContainText('Enrollment status updated')

    // Verify badge updated
    await expect(page.locator('[data-testid="enrollment-status-badge"]')).toContainText('Completed')
  })

  test('updates enrollment status from active to cancelled', async ({ page }) => {
    await page.goto('/students')
    await page.click('text=Student For Cancellation')

    await page.click('[data-testid="enrollment-status-menu"]')
    await page.click('text=Mark as Cancelled')
    await page.click('[data-testid="confirm-status-change"]')

    await expect(page.locator('[role="status"]')).toContainText('Enrollment status updated')
    await expect(page.locator('[data-testid="enrollment-status-badge"]')).toContainText('Cancelled')
  })

  test('prevents selecting current status in menu', async ({ page }) => {
    await page.goto('/students')
    await page.click('text=Student With Active Enrollment')

    await page.click('[data-testid="enrollment-status-menu"]')

    // Verify "Mark as Active" option is not present (already active)
    await expect(page.locator('text=Mark as Active')).not.toBeVisible()
    // But other options should be visible
    await expect(page.locator('text=Mark as Completed')).toBeVisible()
    await expect(page.locator('text=Mark as Cancelled')).toBeVisible()
  })
})
