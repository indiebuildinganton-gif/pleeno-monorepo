/**
 * E2E Test: Student Creation Flow
 *
 * Tests the complete user journey of creating a new student:
 * - Navigate to student creation form
 * - Fill in required and optional fields
 * - Validate form fields
 * - Submit and verify creation
 * - View created student in table
 *
 * Epic 3: Entities Domain
 * Story 3.2: Student Registry
 * Task 17: Testing - E2E Tests
 */

import { test, expect } from '@playwright/test'

test.describe('Student Creation Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Login as agency admin
    await page.goto('/login')
    await page.fill('input[name="email"]', 'admin@testagency.com')
    await page.fill('input[name="password"]', 'testpassword')
    await page.click('button[type="submit"]')
    await page.waitForURL('/dashboard')
  })

  test('creates a new student with all fields', async ({ page }) => {
    // Navigate to student creation page
    await page.goto('/students/new')
    await expect(page.locator('h1')).toContainText('Add New Student')

    // Fill in all form fields
    await page.fill('input[name="full_name"]', 'Test Student')
    await page.fill('input[name="passport_number"]', 'TS123456')
    await page.fill('input[name="email"]', 'test.student@email.com')
    await page.fill('input[name="phone"]', '+1-416-555-0999')
    await page.fill('input[name="date_of_birth"]', '1995-06-15')
    await page.fill('input[name="nationality"]', 'Canadian')
    await page.selectOption('select[name="visa_status"]', 'in_process')

    // Submit form
    await page.click('button[type="submit"]')

    // Wait for success toast
    await expect(page.locator('[role="status"]')).toContainText('Student created successfully')

    // Verify redirect to student list
    await page.waitForURL('/students')

    // Search for the created student
    await page.fill('input[placeholder*="Search"]', 'Test Student')
    await page.keyboard.press('Enter')

    // Verify student appears in table
    await expect(page.locator('text=Test Student')).toBeVisible()
    await expect(page.locator('text=TS123456')).toBeVisible()
    await expect(page.locator('text=test.student@email.com')).toBeVisible()
  })

  test('creates a student with only required fields', async ({ page }) => {
    await page.goto('/students/new')

    // Fill only required fields
    await page.fill('input[name="full_name"]', 'Minimal Student')
    await page.fill('input[name="passport_number"]', 'MIN123456')

    // Submit form
    await page.click('button[type="submit"]')

    // Wait for success
    await expect(page.locator('[role="status"]')).toContainText('Student created successfully')

    // Verify student was created
    await page.waitForURL('/students')
    await page.fill('input[placeholder*="Search"]', 'Minimal Student')
    await page.keyboard.press('Enter')

    await expect(page.locator('text=Minimal Student')).toBeVisible()
  })

  test('validates required fields', async ({ page }) => {
    await page.goto('/students/new')

    // Try to submit without filling required fields
    await page.click('button[type="submit"]')

    // Should show validation errors
    await expect(page.locator('text=Full name is required')).toBeVisible()
    await expect(page.locator('text=Passport number is required')).toBeVisible()
  })

  test('validates email format', async ({ page }) => {
    await page.goto('/students/new')

    await page.fill('input[name="full_name"]', 'Test Student')
    await page.fill('input[name="passport_number"]', 'TS123456')
    await page.fill('input[name="email"]', 'not-an-email')

    await page.click('button[type="submit"]')

    await expect(page.locator('text=Invalid email')).toBeVisible()
  })

  test('validates date of birth format', async ({ page }) => {
    await page.goto('/students/new')

    await page.fill('input[name="full_name"]', 'Test Student')
    await page.fill('input[name="passport_number"]', 'TS123456')
    await page.fill('input[name="date_of_birth"]', '15/06/1995') // Wrong format

    await page.click('button[type="submit"]')

    await expect(page.locator('text=Invalid date')).toBeVisible()
  })

  test('shows duplicate passport error', async ({ page }) => {
    // Create first student
    await page.goto('/students/new')
    await page.fill('input[name="full_name"]', 'First Student')
    await page.fill('input[name="passport_number"]', 'DUP123456')
    await page.click('button[type="submit"]')
    await page.waitForURL('/students')

    // Try to create second student with same passport
    await page.goto('/students/new')
    await page.fill('input[name="full_name"]', 'Second Student')
    await page.fill('input[name="passport_number"]', 'DUP123456')
    await page.click('button[type="submit"]')

    // Should show duplicate error
    await expect(page.locator('text=passport number already exists')).toBeVisible()
  })

  test('shows visa status badge with correct color', async ({ page }) => {
    // Create student with approved visa
    await page.goto('/students/new')
    await page.fill('input[name="full_name"]', 'Approved Student')
    await page.fill('input[name="passport_number"]', 'APP123456')
    await page.selectOption('select[name="visa_status"]', 'approved')
    await page.click('button[type="submit"]')
    await page.waitForURL('/students')

    // Find the student row
    await page.fill('input[placeholder*="Search"]', 'Approved Student')
    await page.keyboard.press('Enter')

    // Verify approved badge (green)
    const approvedBadge = page.locator('text=Approved').first()
    await expect(approvedBadge).toBeVisible()
    await expect(approvedBadge).toHaveClass(/success/)
  })

  test('can navigate to student detail after creation', async ({ page }) => {
    // Create student
    await page.goto('/students/new')
    await page.fill('input[name="full_name"]', 'Detail Test Student')
    await page.fill('input[name="passport_number"]', 'DET123456')
    await page.click('button[type="submit"]')
    await page.waitForURL('/students')

    // Click on student row
    await page.fill('input[placeholder*="Search"]', 'Detail Test Student')
    await page.keyboard.press('Enter')
    await page.click('text=Detail Test Student')

    // Should navigate to detail page
    await expect(page).toHaveURL(/\/students\/[a-f0-9-]+/)
    await expect(page.locator('h1')).toContainText('Detail Test Student')
  })

  test('displays activity log entry for student creation', async ({ page }) => {
    // Create student
    await page.goto('/students/new')
    await page.fill('input[name="full_name"]', 'Activity Test Student')
    await page.fill('input[name="passport_number"]', 'ACT123456')
    await page.click('button[type="submit"]')
    await page.waitForURL('/students')

    // Navigate to student detail
    await page.fill('input[placeholder*="Search"]', 'Activity Test Student')
    await page.keyboard.press('Enter')
    await page.click('text=Activity Test Student')

    // Check activity feed
    await page.click('text=Activity')
    await expect(page.locator('text=added new student')).toBeVisible()
  })

  test('cancels creation and returns to list', async ({ page }) => {
    await page.goto('/students/new')

    await page.fill('input[name="full_name"]', 'Cancel Test')
    await page.fill('input[name="passport_number"]', 'CAN123456')

    // Click cancel button
    await page.click('text=Cancel')

    // Should navigate back to list
    await expect(page).toHaveURL('/students')

    // Student should not be created
    await page.fill('input[placeholder*="Search"]', 'Cancel Test')
    await page.keyboard.press('Enter')
    await expect(page.locator('text=Cancel Test')).not.toBeVisible()
  })

  test('form fields accept various input formats', async ({ page }) => {
    await page.goto('/students/new')

    // Test various phone formats
    const phoneFormats = [
      '+1-416-555-0123',
      '4165550123',
      '(416) 555-0123',
      '+61 3 5555 0123',
    ]

    for (const phone of phoneFormats) {
      await page.fill('input[name="full_name"]', 'Phone Test')
      await page.fill('input[name="passport_number"]', `PH${Date.now()}`)
      await page.fill('input[name="phone"]', phone)

      await page.click('button[type="submit"]')
      await expect(page.locator('[role="status"]')).toContainText('Student created successfully')
      await page.waitForURL('/students')

      // Go back to create another
      if (phoneFormats.indexOf(phone) < phoneFormats.length - 1) {
        await page.goto('/students/new')
      }
    }
  })

  test('clears form after successful creation when staying on page', async ({ page }) => {
    await page.goto('/students/new')

    await page.fill('input[name="full_name"]', 'Clear Test')
    await page.fill('input[name="passport_number"]', 'CLR123456')
    await page.fill('input[name="email"]', 'clear@test.com')

    // Submit and stay on page (if there's a "Save & Add Another" button)
    const saveAndAddButton = page.locator('text=Save & Add Another')
    if (await saveAndAddButton.isVisible()) {
      await saveAndAddButton.click()

      // Form should be cleared
      await expect(page.locator('input[name="full_name"]')).toHaveValue('')
      await expect(page.locator('input[name="passport_number"]')).toHaveValue('')
      await expect(page.locator('input[name="email"]')).toHaveValue('')
    }
  })
})
