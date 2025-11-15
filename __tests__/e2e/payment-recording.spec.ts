/**
 * Payment Recording E2E Tests
 *
 * End-to-end tests for the manual payment recording feature
 * Epic 4: Payments Domain
 * Story 4.4: Manual Payment Recording
 * Task 9: Testing - E2E Tests
 */

import { test, expect } from '@playwright/test'

test.describe('Payment Recording - Manual Payment Flow', () => {
  test.beforeEach(async ({ page }) => {
    // TODO: Set up authentication state
    // In production, you would authenticate here
    // For now, tests are documented but skipped until auth is configured
  })

  test('complete payment recording flow from payment plan detail', async ({ page }) => {
    test.skip() // Skip until authentication is configured

    // Navigate to payment plan detail page
    await page.goto('/payments/plans/plan-123')

    // Wait for page to load
    await page.waitForSelector('[data-testid="payment-plan-detail"]')

    // Verify payment plan information is displayed
    await expect(page.locator('h1')).toContainText('Payment Plan')

    // Find the first pending installment
    const firstPendingInstallment = page.locator('[data-testid^="installment-"][data-status="pending"]').first()
    await expect(firstPendingInstallment).toBeVisible()

    // Click "Mark as Paid" button
    const markAsPaidButton = firstPendingInstallment.locator('[data-testid="mark-paid-button"]')
    await markAsPaidButton.click()

    // Modal should open
    await expect(page.locator('text=Mark Installment as Paid')).toBeVisible()

    // Verify installment details are shown in modal
    await expect(page.locator('text=/Installment #\\d+/')).toBeVisible()
    await expect(page.locator('text=/Amount:/')).toBeVisible()

    // Fill in payment details
    const today = new Date().toISOString().split('T')[0]
    const paidDateInput = page.locator('input[id="paid_date"]')
    await expect(paidDateInput).toHaveValue(today) // Should be pre-filled with today

    const paidAmountInput = page.locator('input[id="paid_amount"]')
    await paidAmountInput.clear()
    await paidAmountInput.fill('1000')

    const notesInput = page.locator('textarea[id="notes"]')
    await notesInput.fill('Payment received via bank transfer')

    // Verify character counter
    await expect(page.locator('text=37/500')).toBeVisible()

    // Submit payment
    const submitButton = page.locator('button:has-text("Mark as Paid")')
    await submitButton.click()

    // Modal should close
    await expect(page.locator('text=Mark Installment as Paid')).not.toBeVisible()

    // Verify optimistic update - status should change immediately
    await expect(firstPendingInstallment).toHaveAttribute('data-status', 'paid')

    // Verify success toast notification
    await expect(page.locator('text=/Payment recorded successfully/')).toBeVisible()
    await expect(page.locator('text=/has been marked as paid/')).toBeVisible()

    // Verify payment plan progress is updated
    const progressText = page.locator('[data-testid="payment-progress-text"]')
    await expect(progressText).toContainText('of')
    await expect(progressText).toContainText('installments paid')

    // Verify commission tracking is updated
    const earnedCommission = page.locator('[data-testid="earned-commission"]')
    await expect(earnedCommission).toBeVisible()
  })

  test('partial payment recording flow', async ({ page }) => {
    test.skip() // Skip until authentication is configured

    await page.goto('/payments/plans/plan-123')

    // Click "Mark as Paid" on first pending installment
    const markAsPaidButton = page.locator('[data-testid="mark-paid-button"]').first()
    await markAsPaidButton.click()

    // Modal opens
    await expect(page.locator('text=Mark Installment as Paid')).toBeVisible()

    // Enter partial payment amount
    const paidAmountInput = page.locator('input[id="paid_amount"]')
    await paidAmountInput.clear()
    await paidAmountInput.fill('500')

    // Partial payment warning should appear
    await expect(page.locator('text=/This is a partial payment/')).toBeVisible()
    await expect(page.locator('text=/Outstanding balance after this payment:/')).toBeVisible()
    await expect(page.locator('text=/\\$500\\.00/')).toBeVisible()

    // Add notes
    const notesInput = page.locator('textarea[id="notes"]')
    await notesInput.fill('First partial payment')

    // Submit
    await page.locator('button:has-text("Mark as Paid")').click()

    // Modal closes
    await expect(page.locator('text=Mark Installment as Paid')).not.toBeVisible()

    // Verify installment status is 'partial'
    const installmentRow = page.locator('[data-testid^="installment-"]').first()
    await expect(installmentRow).toHaveAttribute('data-status', 'partial')

    // Verify partial payment indicator is shown
    await expect(page.locator('text=/partial/i')).toBeVisible()

    // Verify progress bar shows partial payment
    const progressBar = installmentRow.locator('[role="progressbar"]')
    await expect(progressBar).toBeVisible()
    await expect(progressBar).toHaveAttribute('aria-valuenow', '50') // 500/1000 = 50%

    // Verify outstanding balance is displayed
    await expect(page.locator('text=/\\$500\\.00.*of.*\\$1,000\\.00/')).toBeVisible()

    // "Mark as Paid" button should still be available to complete payment
    await expect(installmentRow.locator('[data-testid="mark-paid-button"]')).toBeVisible()

    // Complete the payment
    await installmentRow.locator('[data-testid="mark-paid-button"]').click()

    // Modal opens again with outstanding balance pre-filled
    await expect(page.locator('text=Mark Installment as Paid')).toBeVisible()
    await expect(page.locator('text=/Outstanding:.*\\$500\\.00/')).toBeVisible()

    const paidAmountInput2 = page.locator('input[id="paid_amount"]')
    await expect(paidAmountInput2).toHaveValue('500') // Outstanding balance pre-filled

    // Submit to complete
    await page.locator('button:has-text("Mark as Paid")').click()

    // Verify installment is now fully paid
    await expect(installmentRow).toHaveAttribute('data-status', 'paid')
    await expect(page.locator('text=/partial/i')).not.toBeVisible()
  })

  test('dashboard updates after payment recording', async ({ page }) => {
    test.skip() // Skip until authentication is configured

    // Start on dashboard
    await page.goto('/dashboard')

    // Wait for dashboard widgets to load
    await page.waitForSelector('[data-testid="payment-status-widget"]')
    await page.waitForSelector('[data-testid="commission-breakdown-widget"]')

    // Get initial values
    const initialPendingCount = await page.locator('[data-testid="pending-count"]').textContent()
    const initialPaidCount = await page.locator('[data-testid="paid-count"]').textContent()
    const initialEarnedCommission = await page.locator('[data-testid="earned-commission-value"]').textContent()

    // Navigate to payment plan
    await page.goto('/payments/plans/plan-123')

    // Record a payment
    await page.locator('[data-testid="mark-paid-button"]').first().click()
    await page.locator('button:has-text("Mark as Paid")').click()

    // Wait for success notification
    await expect(page.locator('text=/Payment recorded successfully/')).toBeVisible()

    // Navigate back to dashboard
    await page.goto('/dashboard')

    // Wait for widgets to refresh
    await page.waitForSelector('[data-testid="payment-status-widget"]')

    // Verify pending count decreased
    const newPendingCount = await page.locator('[data-testid="pending-count"]').textContent()
    expect(Number(newPendingCount)).toBeLessThan(Number(initialPendingCount))

    // Verify paid count increased
    const newPaidCount = await page.locator('[data-testid="paid-count"]').textContent()
    expect(Number(newPaidCount)).toBeGreaterThan(Number(initialPaidCount))

    // Verify earned commission increased
    const newEarnedCommission = await page.locator('[data-testid="earned-commission-value"]').textContent()
    expect(newEarnedCommission).not.toBe(initialEarnedCommission)
  })

  test('commission tracking updates after payment', async ({ page }) => {
    test.skip() // Skip until authentication is configured

    await page.goto('/payments/plans/plan-123')

    // Get initial commission values
    const initialEarnedCommission = await page.locator('[data-testid="earned-commission"]').textContent()
    const initialCommissionProgress = await page.locator('[data-testid="commission-progress"]')

    // Record a payment
    await page.locator('[data-testid="mark-paid-button"]').first().click()
    await page.locator('input[id="paid_amount"]').fill('1000')
    await page.locator('button:has-text("Mark as Paid")').click()

    // Wait for optimistic update
    await page.waitForTimeout(100)

    // Verify earned commission increased
    const newEarnedCommission = await page.locator('[data-testid="earned-commission"]').textContent()
    expect(newEarnedCommission).not.toBe(initialEarnedCommission)

    // Verify commission progress bar updated
    await expect(initialCommissionProgress).toBeVisible()
  })

  test('multiple payments on same plan', async ({ page }) => {
    test.skip() // Skip until authentication is configured

    await page.goto('/payments/plans/plan-123')

    // Get initial count of pending installments
    const initialPendingInstallments = await page.locator('[data-status="pending"]').count()

    // Record first payment
    await page.locator('[data-testid="mark-paid-button"]').first().click()
    await page.locator('button:has-text("Mark as Paid")').click()
    await expect(page.locator('text=/Payment recorded successfully/')).toBeVisible()

    // Verify one less pending installment
    await expect(page.locator('[data-status="pending"]')).toHaveCount(initialPendingInstallments - 1)

    // Record second payment
    await page.locator('[data-testid="mark-paid-button"]').first().click()
    await page.locator('button:has-text("Mark as Paid")').click()
    await expect(page.locator('text=/Payment recorded successfully/')).toBeVisible()

    // Verify another one less
    await expect(page.locator('[data-status="pending"]')).toHaveCount(initialPendingInstallments - 2)

    // Verify payment progress updated
    const progressText = await page.locator('[data-testid="payment-progress-text"]').textContent()
    expect(progressText).toContain('2')
  })

  test('payment plan completion when all installments paid', async ({ page }) => {
    test.skip() // Skip until authentication is configured

    await page.goto('/payments/plans/plan-123')

    // Get total number of installments
    const totalInstallments = await page.locator('[data-testid^="installment-"]').count()
    const pendingInstallments = await page.locator('[data-status="pending"]').count()

    // Pay all pending installments
    for (let i = 0; i < pendingInstallments; i++) {
      await page.locator('[data-testid="mark-paid-button"]').first().click()
      await page.locator('button:has-text("Mark as Paid")').click()
      await page.waitForSelector('text=/Payment recorded successfully/')
      await page.waitForTimeout(500) // Wait for UI to update
    }

    // Verify payment plan status is "completed"
    await expect(page.locator('[data-testid="payment-plan-status"]')).toHaveText(/completed/i)

    // Verify all installments show as paid
    await expect(page.locator('[data-status="paid"]')).toHaveCount(totalInstallments)

    // Verify progress is 100%
    const progressBar = page.locator('[data-testid="payment-progress-bar"]')
    await expect(progressBar).toHaveAttribute('aria-valuenow', '100')

    // Verify completion message or badge
    await expect(page.locator('text=/All installments paid/i')).toBeVisible()
  })

  test('cancel payment recording', async ({ page }) => {
    test.skip() // Skip until authentication is configured

    await page.goto('/payments/plans/plan-123')

    // Get initial status
    const initialStatus = await page.locator('[data-testid^="installment-"]').first().getAttribute('data-status')

    // Open modal
    await page.locator('[data-testid="mark-paid-button"]').first().click()
    await expect(page.locator('text=Mark Installment as Paid')).toBeVisible()

    // Fill in some data
    await page.locator('input[id="paid_amount"]').fill('500')
    await page.locator('textarea[id="notes"]').fill('Test note')

    // Click cancel
    await page.locator('button:has-text("Cancel")').click()

    // Modal should close
    await expect(page.locator('text=Mark Installment as Paid')).not.toBeVisible()

    // Verify no changes were made
    const currentStatus = await page.locator('[data-testid^="installment-"]').first().getAttribute('data-status')
    expect(currentStatus).toBe(initialStatus)
  })

  test('validation errors prevent submission', async ({ page }) => {
    test.skip() // Skip until authentication is configured

    await page.goto('/payments/plans/plan-123')

    // Open modal
    await page.locator('[data-testid="mark-paid-button"]').first().click()

    // Clear paid amount (invalid)
    const paidAmountInput = page.locator('input[id="paid_amount"]')
    await paidAmountInput.clear()

    // Try to submit
    const submitButton = page.locator('button:has-text("Mark as Paid")')

    // Button should be disabled
    await expect(submitButton).toBeDisabled()

    // Enter invalid amount (negative)
    await paidAmountInput.fill('-100')

    // Validation error should appear
    await expect(page.locator('text=/must be positive/i')).toBeVisible()

    // Button should still be disabled
    await expect(submitButton).toBeDisabled()

    // Enter valid amount
    await paidAmountInput.fill('1000')

    // Button should be enabled now
    await expect(submitButton).toBeEnabled()
  })

  test('loading state during payment recording', async ({ page }) => {
    test.skip() // Skip until authentication is configured

    await page.goto('/payments/plans/plan-123')

    // Open modal
    await page.locator('[data-testid="mark-paid-button"]').first().click()

    // Submit payment
    await page.locator('button:has-text("Mark as Paid")').click()

    // Loading state should be shown briefly
    await expect(page.locator('button:has-text("Recording...")')).toBeVisible()

    // All inputs should be disabled during loading
    await expect(page.locator('input[id="paid_date"]')).toBeDisabled()
    await expect(page.locator('input[id="paid_amount"]')).toBeDisabled()
    await expect(page.locator('textarea[id="notes"]')).toBeDisabled()
    await expect(page.locator('button:has-text("Cancel")')).toBeDisabled()

    // Wait for completion
    await expect(page.locator('text=/Payment recorded successfully/')).toBeVisible()
  })

  test('audit trail records payment action', async ({ page }) => {
    test.skip() // Skip until authentication is configured

    await page.goto('/payments/plans/plan-123')

    // Record a payment
    await page.locator('[data-testid="mark-paid-button"]').first().click()
    await page.locator('textarea[id="notes"]').fill('Payment received - audit test')
    await page.locator('button:has-text("Mark as Paid")').click()

    // Wait for success
    await expect(page.locator('text=/Payment recorded successfully/')).toBeVisible()

    // Navigate to activity feed or audit log
    await page.goto('/activity')

    // Verify payment recording activity is logged
    await expect(page.locator('text=/recorded payment/i')).toBeVisible()
    await expect(page.locator('text=/Payment received - audit test/i')).toBeVisible()
  })
})
