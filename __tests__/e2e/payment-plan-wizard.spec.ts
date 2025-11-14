/**
 * Payment Plan Wizard E2E Tests
 *
 * End-to-end tests for the complete 3-step payment plan wizard flow
 * Epic 4: Payments Domain
 * Story 4.2: Flexible Installment Structure
 * Task 13: Testing - E2E Tests
 */

import { test, expect } from '@playwright/test'

test.describe('Payment Plan Wizard - Complete Flow', () => {
  test.beforeEach(async ({ page }) => {
    // TODO: Set up authentication state
    // In production, you would authenticate here
    // For now, tests are documented but skipped until auth is configured
  })

  test('creates payment plan through complete 3-step wizard (happy path)', async ({ page }) => {
    test.skip() // Skip until authentication is configured

    // Navigate to wizard
    await page.goto('/payments/plans/new')
    await expect(page.locator('h1')).toContainText('Step 1: General Information')

    // ===== STEP 1: General Information =====

    // Wait for form to load
    await page.waitForSelector('[data-testid="student-select"]')

    // Select student
    await page.selectOption('[data-testid="student-select"]', { index: 1 })

    // Select branch (commission rate auto-populates)
    await page.selectOption('[data-testid="branch-select"]', { index: 1 })

    // Enter course name
    await page.fill('input[name="course_name"]', 'Bachelor of Business Administration')

    // Enter total course value
    await page.fill('input[name="total_course_value"]', '10000')

    // Verify commission rate was auto-filled (15% = 0.15)
    const commissionInput = page.locator('input[name="commission_rate"]')
    await expect(commissionInput).toHaveValue('0.15')

    // Verify commission percentage is displayed
    await expect(page.locator('text=/Currently: 15.0%/i')).toBeVisible()

    // Enter course dates
    await page.fill('input[name="course_start_date"]', '2025-02-01')
    await page.fill('input[name="course_end_date"]', '2025-12-31')

    // Click Next
    const nextButton = page.locator('button:has-text("Next: Configure Installments")')
    await expect(nextButton).toBeEnabled()
    await nextButton.click()

    // ===== STEP 2: Payment Structure =====

    await expect(page.locator('h1')).toContainText('Step 2: Payment Structure')

    // Enter initial payment amount
    await page.fill('input[name="initial_payment_amount"]', '2000')

    // Initial payment due date should now be enabled
    const initialDueDateInput = page.locator('input[name="initial_payment_due_date"]')
    await expect(initialDueDateInput).toBeEnabled()
    await initialDueDateInput.fill('2025-02-01')

    // Toggle "initial payment paid"
    await page.click('input[name="initial_payment_paid"]')

    // Enter number of installments
    await page.fill('input[name="number_of_installments"]', '4')

    // Select payment frequency (quarterly)
    await page.click('[role="combobox"]')
    await page.click('text=Quarterly')

    // Enter non-commissionable fees
    await page.fill('input[name="materials_cost"]', '500')
    await page.fill('input[name="admin_fees"]', '200')
    await page.fill('input[name="other_fees"]', '100')

    // Verify real-time summary updates
    // Commissionable value should be 10000 - 500 - 200 - 100 = 9200
    await expect(page.locator('text=/Commissionable Value: 9200/i')).toBeVisible()

    // Enter first college due date
    await page.fill('input[name="first_college_due_date"]', '2025-03-15')

    // Student lead time (default 7 days should be pre-filled)
    await expect(page.locator('input[name="student_lead_time_days"]')).toHaveValue('7')

    // Verify student due date preview is shown
    await expect(page.locator('text=/Preview: First Student Due Date/i')).toBeVisible()

    // GST inclusive should be toggled on by default
    await expect(page.locator('input[name="gst_inclusive"]')).toBeChecked()

    // Click Generate Installments
    const generateButton = page.locator('button:has-text("Generate Installments")')
    await expect(generateButton).toBeEnabled()
    await generateButton.click()

    // Wait for installments to be generated and Step 3 to load
    await page.waitForURL(/.*/) // Wait for any navigation
    await expect(page.locator('h1')).toContainText('Step 3: Review & Confirmation')

    // ===== STEP 3: Review & Confirmation =====

    // Verify student information is displayed
    await expect(page.locator('text=/John Doe/i')).toBeVisible()

    // Verify course name is displayed
    await expect(page.locator('text=/Bachelor of Business Administration/i')).toBeVisible()

    // Verify commission details are highlighted in green section
    await expect(page.locator('text=/Commission Details/i')).toBeVisible()
    await expect(page.locator('text=/Total Commission:/i')).toBeVisible()

    // Verify installment table is displayed
    await expect(page.locator('[data-testid="installment-table"]')).toBeVisible()

    // Verify installment count badge (5 total: 1 initial + 4 regular)
    await expect(page.locator('text=/5 installments/i')).toBeVisible()

    // Verify validation banner is green (amounts reconcile)
    await expect(page.locator('text=/Amounts reconcile correctly/i')).toBeVisible()

    // Verify Create button is enabled
    const createButton = page.locator('button:has-text("Create Payment Plan")')
    await expect(createButton).toBeEnabled()

    // Click Create Payment Plan
    await createButton.click()

    // Wait for redirect to payment plan detail page
    await page.waitForURL(/\/payments\/plans\/[a-z0-9-]+/)

    // Verify success message
    await expect(page.locator('text=/Payment plan created successfully/i')).toBeVisible()

    // Verify payment plan details are displayed on detail page
    await expect(page.locator('text=/\\$10,000/i')).toBeVisible()
    await expect(page.locator('text=/\\$9,200/i')).toBeVisible() // Commissionable value
    await expect(page.locator('text=/Bachelor of Business Administration/i')).toBeVisible()
  })

  test('allows editing and regenerating installments', async ({ page }) => {
    test.skip() // Skip until authentication is configured

    // Navigate through Steps 1 and 2 (abbreviated)
    await page.goto('/payments/plans/new')

    // Fill Step 1
    await page.selectOption('[data-testid="student-select"]', { index: 1 })
    await page.selectOption('[data-testid="branch-select"]', { index: 1 })
    await page.fill('input[name="course_name"]', 'Bachelor of Science')
    await page.fill('input[name="total_course_value"]', '15000')
    await page.fill('input[name="course_start_date"]', '2025-02-01')
    await page.fill('input[name="course_end_date"]', '2025-12-31')
    await page.click('button:has-text("Next")')

    // Fill Step 2
    await page.fill('input[name="number_of_installments"]', '5')
    await page.fill('input[name="materials_cost"]', '1000')
    await page.fill('input[name="first_college_due_date"]', '2025-03-01')
    await page.click('button:has-text("Generate Installments")')

    // Now in Step 3
    await expect(page.locator('h1')).toContainText('Step 3')

    // Click "Edit Payment Structure" to go back to Step 2
    await page.click('button:has-text("Edit Payment Structure")')

    // Verify we're back in Step 2
    await expect(page.locator('h1')).toContainText('Step 2')

    // Verify data is preserved
    await expect(page.locator('input[name="materials_cost"]')).toHaveValue('1000')

    // Change materials cost
    await page.fill('input[name="materials_cost"]', '2000')

    // Regenerate installments
    await page.click('button:has-text("Generate Installments")')

    // Back to Step 3
    await expect(page.locator('h1')).toContainText('Step 3')

    // Verify commissionable value was recalculated
    // 15000 - 2000 = 13000
    await expect(page.locator('text=/\\$13,000/i')).toBeVisible()
  })

  test('validates and prevents creation when installments do not reconcile', async ({ page }) => {
    test.skip() // Skip until authentication is configured

    // Navigate through wizard to Step 3 with invalid installments
    // This would require mocking the API to return invalid installments
    await page.goto('/payments/plans/new')

    // ... fill Steps 1 and 2 ...

    // In Step 3 with invalid installments
    await expect(page.locator('h1')).toContainText('Step 3')

    // Verify red error banner is shown
    await expect(
      page.locator('text=/Warning: Installments do not sum to commissionable value/i')
    ).toBeVisible()

    // Verify Create button is disabled
    const createButton = page.locator('button:has-text("Create Payment Plan")')
    await expect(createButton).toBeDisabled()

    // Verify help text is shown
    await expect(
      page.locator('text=/Please go back to Step 2 and regenerate the installments/i')
    ).toBeVisible()
  })

  test('navigates back and forth preserving form data', async ({ page }) => {
    test.skip() // Skip until authentication is configured

    await page.goto('/payments/plans/new')

    // Fill Step 1
    await page.selectOption('[data-testid="student-select"]', { index: 1 })
    await page.fill('input[name="course_name"]', 'Master of Business')
    await page.fill('input[name="total_course_value"]', '20000')
    await page.fill('input[name="course_start_date"]', '2025-03-01')
    await page.fill('input[name="course_end_date"]', '2026-02-28')
    await page.click('button:has-text("Next")')

    // In Step 2
    await expect(page.locator('h1')).toContainText('Step 2')

    // Click Back
    await page.click('button:has-text("Back")')

    // Verify we're back in Step 1
    await expect(page.locator('h1')).toContainText('Step 1')

    // Verify all data is preserved
    await expect(page.locator('input[name="course_name"]')).toHaveValue('Master of Business')
    await expect(page.locator('input[name="total_course_value"]')).toHaveValue('20000')

    // Modify data
    await page.fill('input[name="total_course_value"]', '25000')

    // Navigate forward again
    await page.click('button:has-text("Next")')

    // Verify updated data is available in Step 2 context
    // (real-time summary should reflect new value)
    await expect(page.locator('text=/25000/i')).toBeVisible()
  })

  test('displays validation errors for invalid form inputs', async ({ page }) => {
    test.skip() // Skip until authentication is configured

    await page.goto('/payments/plans/new')

    // ===== Step 1 Validation =====

    // Try to proceed without filling required fields
    const nextButton = page.locator('button:has-text("Next")')
    await expect(nextButton).toBeDisabled()

    // Enter invalid commission rate (> 1)
    await page.fill('input[name="commission_rate"]', '1.5')
    await expect(page.locator('text=/Must be between 0 and 1/i')).toBeVisible()

    // Fix and enter valid rate
    await page.fill('input[name="commission_rate"]', '0.15')

    // Enter end date before start date
    await page.fill('input[name="course_start_date"]', '2025-12-31')
    await page.fill('input[name="course_end_date"]', '2025-01-01')
    await expect(page.locator('text=/End date must be after start date/i')).toBeVisible()

    // Fix dates
    await page.fill('input[name="course_start_date"]', '2025-02-01')
    await page.fill('input[name="course_end_date"]', '2025-12-31')

    // Fill remaining required fields and proceed
    await page.selectOption('[data-testid="student-select"]', { index: 1 })
    await page.selectOption('[data-testid="branch-select"]', { index: 1 })
    await page.fill('input[name="course_name"]', 'Test Course')
    await page.fill('input[name="total_course_value"]', '10000')
    await page.click('button:has-text("Next")')

    // ===== Step 2 Validation =====

    await expect(page.locator('h1')).toContainText('Step 2')

    // Try to set fees that exceed course value
    await page.fill('input[name="materials_cost"]', '10000')
    await expect(
      page.locator('text=/Total fees cannot equal or exceed the total course value/i')
    ).toBeVisible()

    // Verify Generate button is disabled
    const generateButton = page.locator('button:has-text("Generate Installments")')
    await expect(generateButton).toBeDisabled()
  })

  test('handles network errors gracefully', async ({ page }) => {
    test.skip() // Skip until authentication is configured

    // Mock network failure for generate installments API
    await page.route('**/api/payment-plans/*/generate-installments', (route) => {
      route.abort('failed')
    })

    await page.goto('/payments/plans/new')

    // Fill Steps 1 and 2 and try to generate
    // ... fill forms ...
    await page.click('button:has-text("Generate Installments")')

    // Verify error message is displayed
    await expect(page.locator('text=/Failed to generate installments/i')).toBeVisible()

    // Verify we remain on Step 2
    await expect(page.locator('h1')).toContainText('Step 2')
  })
})

test.describe('Payment Plan Wizard - Edge Cases', () => {
  test('handles payment plan with no initial payment', async ({ page }) => {
    test.skip() // Skip until authentication is configured

    await page.goto('/payments/plans/new')

    // Fill Step 1
    // ... (abbreviated) ...

    // In Step 2, leave initial payment at 0
    await page.fill('input[name="initial_payment_amount"]', '0')

    // Verify initial payment fields are disabled
    await expect(page.locator('input[name="initial_payment_due_date"]')).toBeDisabled()
    await expect(page.locator('input[name="initial_payment_paid"]')).toBeDisabled()

    // Generate installments
    await page.fill('input[name="number_of_installments"]', '10')
    await page.fill('input[name="first_college_due_date"]', '2025-03-01')
    await page.click('button:has-text("Generate Installments")')

    // In Step 3, verify no initial payment row
    await expect(page.locator('h1')).toContainText('Step 3')

    // Should have exactly 10 installments (no initial)
    await expect(page.locator('text=/10 installments/i')).toBeVisible()
  })

  test('handles custom payment frequency', async ({ page }) => {
    test.skip() // Skip until authentication is configured

    await page.goto('/payments/plans/new')

    // Fill Step 1
    // ... (abbreviated) ...

    // In Step 2, select Custom frequency
    await page.click('[role="combobox"]')
    await page.click('text=Custom')

    // Generate installments with custom frequency
    await page.fill('input[name="number_of_installments"]', '3')
    await page.fill('input[name="first_college_due_date"]', '2025-03-01')
    await page.click('button:has-text("Generate Installments")')

    // In Step 3, verify custom frequency is shown
    await expect(page.locator('text=/Custom/i')).toBeVisible()
  })

  test('displays loading states during API calls', async ({ page }) => {
    test.skip() // Skip until authentication is configured

    // Mock slow API response
    await page.route('**/api/payment-plans/*/generate-installments', async (route) => {
      await new Promise((resolve) => setTimeout(resolve, 2000))
      route.continue()
    })

    await page.goto('/payments/plans/new')

    // Fill Steps 1 and 2
    // ... (abbreviated) ...
    await page.click('button:has-text("Generate Installments")')

    // Verify loading state
    await expect(page.locator('text=/Generating.../i')).toBeVisible()
    await expect(page.locator('button:has-text("Generating")')).toBeDisabled()
  })
})
