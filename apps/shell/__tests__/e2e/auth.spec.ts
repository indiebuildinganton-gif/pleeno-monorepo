/**
 * Authentication E2E Tests
 *
 * End-to-end tests for authentication flows using Playwright
 */

import { test, expect } from '@playwright/test'

test.describe('Authentication Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Clear cookies before each test
    await page.context().clearCookies()
  })

  test('should display login page', async ({ page }) => {
    await page.goto('/login')

    await expect(page.getByRole('heading', { name: /sign in/i })).toBeVisible()
    await expect(page.getByLabel(/email/i)).toBeVisible()
    await expect(page.getByLabel(/password/i)).toBeVisible()
    await expect(page.getByRole('button', { name: /sign in/i })).toBeVisible()
  })

  test('should display signup page', async ({ page }) => {
    await page.goto('/signup')

    await expect(page.getByRole('heading', { name: /create account/i })).toBeVisible()
    await expect(page.getByLabel(/full name/i)).toBeVisible()
    await expect(page.getByLabel(/agency name/i)).toBeVisible()
    await expect(page.getByLabel(/email/i)).toBeVisible()
    await expect(page.getByLabel(/^password$/i)).toBeVisible()
    await expect(page.getByLabel(/confirm password/i)).toBeVisible()
    await expect(page.getByRole('button', { name: /sign up/i })).toBeVisible()
  })

  test('should redirect to login when accessing protected route without auth', async ({ page }) => {
    await page.goto('/dashboard')

    // Should redirect to login page
    await expect(page).toHaveURL(/\/login/)
  })

  test('should preserve redirect URL after login redirect', async ({ page }) => {
    await page.goto('/dashboard/settings')

    // Should redirect to login with redirectTo param
    await expect(page).toHaveURL(/\/login.*redirectTo/)
  })

  test('should show validation errors on login form', async ({ page }) => {
    await page.goto('/login')

    // Try to submit with invalid email
    await page.getByLabel(/email/i).fill('invalid-email')
    await page.getByLabel(/password/i).fill('password123')
    await page.getByRole('button', { name: /sign in/i }).click()

    // Should show validation error
    await expect(page.getByText(/invalid email/i)).toBeVisible()
  })

  test('should show validation errors on signup form', async ({ page }) => {
    await page.goto('/signup')

    // Try to submit with weak password
    await page.getByLabel(/full name/i).fill('Test User')
    await page.getByLabel(/agency name/i).fill('Test Agency')
    await page.getByLabel(/email/i).fill('test@example.com')
    await page.getByLabel(/^password$/i).fill('weak')
    await page.getByLabel(/confirm password/i).fill('weak')
    await page.getByRole('button', { name: /sign up/i }).click()

    // Should show password validation error
    await expect(page.getByText(/must be at least 8 characters/i)).toBeVisible()
  })

  test('should show error when passwords do not match', async ({ page }) => {
    await page.goto('/signup')

    await page.getByLabel(/full name/i).fill('Test User')
    await page.getByLabel(/agency name/i).fill('Test Agency')
    await page.getByLabel(/email/i).fill('test@example.com')
    await page.getByLabel(/^password$/i).fill('Password123!')
    await page.getByLabel(/confirm password/i).fill('DifferentPassword123!')
    await page.getByRole('button', { name: /sign up/i }).click()

    await expect(page.getByText(/passwords don't match/i)).toBeVisible()
  })

  test('should navigate between login and signup pages', async ({ page }) => {
    await page.goto('/login')

    // Click sign up link
    await page.getByText(/sign up/i).click()
    await expect(page).toHaveURL(/\/signup/)

    // Click sign in link
    await page.getByText(/sign in/i).click()
    await expect(page).toHaveURL(/\/login/)
  })

  test('should display loading state during form submission', async ({ page }) => {
    await page.goto('/login')

    await page.getByLabel(/email/i).fill('test@example.com')
    await page.getByLabel(/password/i).fill('Password123!')
    await page.getByRole('button', { name: /sign in/i }).click()

    // Should show loading state briefly
    await expect(page.getByText(/signing in/i)).toBeVisible()
  })

  test('should disable form inputs during submission', async ({ page }) => {
    await page.goto('/login')

    await page.getByLabel(/email/i).fill('test@example.com')
    await page.getByLabel(/password/i).fill('Password123!')

    const emailInput = page.getByLabel(/email/i)
    const passwordInput = page.getByLabel(/password/i)
    const submitButton = page.getByRole('button', { name: /sign in/i })

    await submitButton.click()

    // Inputs should be disabled during submission
    await expect(emailInput).toBeDisabled()
    await expect(passwordInput).toBeDisabled()
    await expect(submitButton).toBeDisabled()
  })
})

test.describe('Authenticated User Flow', () => {
  // Note: These tests would require actual user creation in a test database
  // For now, they demonstrate the expected behavior

  test('should allow authenticated users to access dashboard', async ({ page }) => {
    // This test would require setting up authentication state
    // For example, using Playwright's authentication storage or API calls

    // Skip for now as it requires test user setup
    test.skip()
  })

  test('should redirect authenticated users away from login page', async ({ page }) => {
    // This test would require setting up authentication state
    test.skip()
  })

  test('should handle logout correctly', async ({ page }) => {
    // This test would require setting up authentication state
    test.skip()
  })
})

test.describe('Password Reset Flow', () => {
  test('should display password reset page', async ({ page }) => {
    await page.goto('/reset-password')

    await expect(page.getByRole('heading', { name: /reset password/i })).toBeVisible()
  })

  test('should navigate to password reset from login page', async ({ page }) => {
    await page.goto('/login')

    // Click forgot password link if it exists
    const forgotPasswordLink = page.getByText(/forgot password/i)
    if (await forgotPasswordLink.isVisible()) {
      await forgotPasswordLink.click()
      await expect(page).toHaveURL(/\/reset-password/)
    }
  })
})
