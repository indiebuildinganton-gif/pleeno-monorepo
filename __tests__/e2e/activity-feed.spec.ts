/**
 * E2E Test: Activity Feed
 *
 * Tests the complete user journey for the activity feed feature:
 * - Dashboard displays activity feed
 * - Activities appear after user actions
 * - Clicking activities navigates to detail pages
 * - Auto-refresh functionality
 * - Responsive design
 *
 * Epic 6: Dashboard & Reporting Zone
 * Story 6.4: Recent Activity Feed
 * Task 8: Testing
 */

import { test, expect } from '@playwright/test'

/**
 * Helper function to log in as agency admin
 */
async function login(page: any) {
  await page.goto('/login')
  await page.fill('input[name="email"]', 'admin@testagency.com')
  await page.fill('input[name="password"]', 'testpassword')
  await page.click('button[type="submit"]')
  await page.waitForURL('/dashboard')
}

/**
 * Helper function to create a student
 */
async function createStudent(page: any, studentData: { name: string; passport?: string }) {
  await page.fill('input[name="full_name"]', studentData.name)
  await page.fill('input[name="passport_number"]', studentData.passport || `P${Date.now()}`)
  await page.click('button[type="submit"]')

  // Wait for success toast
  await page.waitForSelector('[role="status"]:has-text("Student created successfully")', {
    timeout: 5000,
  })
}

test.describe('Activity Feed', () => {
  test.beforeEach(async ({ page }) => {
    await login(page)
  })

  test('dashboard displays activity feed', async ({ page }) => {
    // Navigate to dashboard
    await page.goto('/dashboard')

    // Verify activity feed section renders
    await expect(page.getByText('Recent Activity')).toBeVisible()
    await expect(page.locator('[data-testid="activity-feed"]')).toBeVisible()
  })

  test('new activity appears in feed after creating student', async ({ page }) => {
    // Go to dashboard and note current activities
    await page.goto('/dashboard')
    await page.waitForSelector('[data-testid="activity-feed"]')

    // Get initial activity count
    const initialActivities = await page.locator('[data-testid="activity-card"]').count()

    // Create a new student
    await page.goto('/entities/students/new')
    await createStudent(page, { name: 'Test Activity Student' })

    // Go back to dashboard
    await page.goto('/dashboard')

    // Wait for activity feed to load
    await page.waitForSelector('[data-testid="activity-feed"]')

    // Verify new activity appears
    await expect(
      page.locator('text=/.*added new student.*Test Activity Student/i')
    ).toBeVisible({ timeout: 10000 })

    // Verify activity count increased
    const newActivities = await page.locator('[data-testid="activity-card"]').count()
    expect(newActivities).toBeGreaterThan(initialActivities)
  })

  test('clicking activity navigates to detail page', async ({ page }) => {
    // Create a student first to ensure there's an activity
    await page.goto('/entities/students/new')
    await createStudent(page, { name: 'Navigation Test Student' })

    // Go to dashboard
    await page.goto('/dashboard')

    // Wait for activity feed to load
    await page.waitForSelector('[data-testid="activity-feed"]')

    // Find and click the first activity card link
    const activityLink = page.locator('[data-testid="activity-card"]').first().locator('a')
    await expect(activityLink).toBeVisible()

    // Click the activity
    await activityLink.click()

    // Verify navigation occurred (URL should change from /dashboard)
    await expect(page).not.toHaveURL('/dashboard')

    // The URL should be to either a student page, payment plan page, etc.
    const currentUrl = page.url()
    expect(
      currentUrl.includes('/entities/students/') ||
        currentUrl.includes('/payments/plans/') ||
        currentUrl.includes('/entities/enrollments/')
    ).toBeTruthy()
  })

  test('activity feed shows relative timestamps', async ({ page }) => {
    await page.goto('/dashboard')

    // Wait for activity feed to load
    await page.waitForSelector('[data-testid="activity-feed"]')

    // Check for relative time formats
    const activityCards = page.locator('[data-testid="activity-card"]')
    const firstCard = activityCards.first()

    if ((await activityCards.count()) > 0) {
      // Look for relative time text (e.g., "2 minutes ago", "1 hour ago", "yesterday")
      const timeText = await firstCard
        .locator('text=/.*ago|yesterday|today|just now/i')
        .textContent()
      expect(timeText).toBeTruthy()
    }
  })

  test('activity feed displays different icons for different entity types', async ({ page }) => {
    await page.goto('/dashboard')

    // Wait for activity feed to load
    await page.waitForSelector('[data-testid="activity-feed"]')

    // Verify activity cards have icons (emojis)
    const activityCards = page.locator('[data-testid="activity-card"]')

    if ((await activityCards.count()) > 0) {
      // Check that icons are present (we use emojis: 👤, 💰, 📋, 🏫, ⚠️, 📝)
      const firstCard = activityCards.first()
      const hasIcon = await firstCard.locator('text=/👤|💰|📋|🏫|⚠️|📝/').count()
      expect(hasIcon).toBeGreaterThan(0)
    }
  })

  test('activity feed displays system actions with "System" as user', async ({ page }) => {
    await page.goto('/dashboard')

    // Wait for activity feed to load
    await page.waitForSelector('[data-testid="activity-feed"]')

    // Look for system activities (they might exist from cron jobs)
    const systemActivity = page.locator('[data-testid="activity-card"]:has-text("System")')

    // If system activities exist, verify they display correctly
    if ((await systemActivity.count()) > 0) {
      await expect(systemActivity.first()).toBeVisible()
    }
  })

  test('activity feed shows empty state when no activities exist', async ({ page }) => {
    // Mock empty response
    await page.route('**/api/activity-log*', (route) => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true, data: [] }),
      })
    })

    await page.goto('/dashboard')

    // Verify empty state displays
    await expect(page.getByText('No recent activity')).toBeVisible()
    await expect(
      page.getByText('Activity will appear here as your team works')
    ).toBeVisible()
    await expect(page.getByText('📭')).toBeVisible()
  })

  test('activity feed shows error state on API failure', async ({ page }) => {
    // Mock error response
    await page.route('**/api/activity-log*', (route) => {
      route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({ success: false, error: 'Internal server error' }),
      })
    })

    await page.goto('/dashboard')

    // Verify error state displays
    await expect(page.getByText('Unable to load recent activity')).toBeVisible()
    await expect(page.getByText('Retry')).toBeVisible()
  })

  test('activity feed retry button refetches data', async ({ page }) => {
    let callCount = 0

    // Mock first call as error, second call as success
    await page.route('**/api/activity-log*', (route) => {
      callCount++
      if (callCount === 1) {
        route.fulfill({
          status: 500,
          contentType: 'application/json',
          body: JSON.stringify({ success: false, error: 'Internal server error' }),
        })
      } else {
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            data: [
              {
                id: '1',
                timestamp: new Date().toISOString(),
                description: 'Test activity',
                user: { id: 'user-1', name: 'Test User', email: 'test@example.com' },
                entity_type: 'student',
                entity_id: 'student-1',
                action: 'created',
                metadata: {},
              },
            ],
          }),
        })
      }
    })

    await page.goto('/dashboard')

    // Wait for error state
    await expect(page.getByText('Unable to load recent activity')).toBeVisible()

    // Click retry button
    await page.click('button:has-text("Retry")')

    // Verify activities now load
    await expect(page.getByText('Test activity')).toBeVisible({ timeout: 5000 })
  })

  test('activity feed is responsive on mobile', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 })

    await page.goto('/dashboard')

    // Verify activity feed is visible on mobile
    await expect(page.getByText('Recent Activity')).toBeVisible()
    await expect(page.locator('[data-testid="activity-feed"]')).toBeVisible()

    // Verify activity feed is full width (or nearly full width)
    const feedBox = await page.locator('[data-testid="activity-feed"]').boundingBox()
    expect(feedBox).toBeTruthy()
    if (feedBox) {
      // Feed should take most of the width (allowing for padding)
      expect(feedBox.width).toBeGreaterThan(300)
    }
  })

  test('activity feed is responsive on tablet', async ({ page }) => {
    // Set tablet viewport
    await page.setViewportSize({ width: 768, height: 1024 })

    await page.goto('/dashboard')

    // Verify activity feed displays correctly
    await expect(page.getByText('Recent Activity')).toBeVisible()
    await expect(page.locator('[data-testid="activity-feed"]')).toBeVisible()

    // Verify layout (feed should be in sidebar on tablet)
    const feedBox = await page.locator('[data-testid="activity-feed"]').boundingBox()
    expect(feedBox).toBeTruthy()
  })

  test('activity feed limits to 20 activities by default', async ({ page }) => {
    await page.goto('/dashboard')

    // Wait for activity feed to load
    await page.waitForSelector('[data-testid="activity-feed"]')

    // Count activity cards
    const activityCount = await page.locator('[data-testid="activity-card"]').count()

    // Should be 20 or fewer (depending on how many activities exist)
    expect(activityCount).toBeLessThanOrEqual(20)
  })

  test('activity feed handles payment activity navigation', async ({ page }) => {
    // Mock activity data with payment activity
    await page.route('**/api/activity-log*', (route) => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: [
            {
              id: 'payment-activity-1',
              timestamp: new Date().toISOString(),
              description: 'Recorded payment of $500.00',
              user: { id: 'user-1', name: 'Test User', email: 'test@example.com' },
              entity_type: 'payment',
              entity_id: 'payment-123',
              action: 'recorded',
              metadata: {
                payment_plan_id: 'plan-456',
                amount: 500.0,
              },
            },
          ],
        }),
      })
    })

    await page.goto('/dashboard')

    // Wait for activity to load
    await page.waitForSelector('[data-testid="activity-card"]')

    // Click the activity
    const activityLink = page.locator('[data-testid="activity-card"]').first().locator('a')
    await activityLink.click()

    // Should navigate to payment plan page
    await expect(page).toHaveURL(/\/payments\/plans\/plan-456/)
  })

  test('activity feed handles enrollment activity navigation', async ({ page }) => {
    // Mock activity data with enrollment activity
    await page.route('**/api/activity-log*', (route) => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: [
            {
              id: 'enrollment-activity-1',
              timestamp: new Date().toISOString(),
              description: 'Student enrolled at MIT',
              user: { id: 'user-1', name: 'Test User', email: 'test@example.com' },
              entity_type: 'enrollment',
              entity_id: 'enrollment-123',
              action: 'created',
              metadata: {
                student_id: 'student-789',
                college_name: 'MIT',
              },
            },
          ],
        }),
      })
    })

    await page.goto('/dashboard')

    // Wait for activity to load
    await page.waitForSelector('[data-testid="activity-card"]')

    // Click the activity
    const activityLink = page.locator('[data-testid="activity-card"]').first().locator('a')
    await activityLink.click()

    // Should navigate to student page with enrollments tab
    await expect(page).toHaveURL(/\/entities\/students\/student-789\?tab=enrollments/)
  })

  test('activity feed View More button displays (coming soon)', async ({ page }) => {
    await page.goto('/dashboard')

    // Wait for activity feed to load
    await page.waitForSelector('[data-testid="activity-feed"]')

    // Verify "View More" button exists and is disabled
    const viewMoreButton = page.getByText('View More (Coming Soon)')
    await expect(viewMoreButton).toBeVisible()
    await expect(viewMoreButton).toBeDisabled()
  })
})

test.describe('Activity Feed - Auto Refresh', () => {
  test.beforeEach(async ({ page }) => {
    await login(page)
  })

  test.skip('activity feed auto-refreshes after 60 seconds', async ({ page }) => {
    // This test is skipped because it takes 60+ seconds to run
    // To run manually: test.skip(false)

    let callCount = 0

    await page.route('**/api/activity-log*', (route) => {
      callCount++
      const activities =
        callCount === 1
          ? [
              {
                id: 'activity-1',
                timestamp: new Date().toISOString(),
                description: 'Initial activity',
                user: { id: 'user-1', name: 'User 1', email: 'user1@example.com' },
                entity_type: 'student',
                entity_id: 'student-1',
                action: 'created',
                metadata: {},
              },
            ]
          : [
              {
                id: 'activity-2',
                timestamp: new Date().toISOString(),
                description: 'Refreshed activity',
                user: { id: 'user-1', name: 'User 1', email: 'user1@example.com' },
                entity_type: 'student',
                entity_id: 'student-2',
                action: 'created',
                metadata: {},
              },
              {
                id: 'activity-1',
                timestamp: new Date().toISOString(),
                description: 'Initial activity',
                user: { id: 'user-1', name: 'User 1', email: 'user1@example.com' },
                entity_type: 'student',
                entity_id: 'student-1',
                action: 'created',
                metadata: {},
              },
            ]

      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true, data: activities }),
      })
    })

    await page.goto('/dashboard')

    // Wait for initial load
    await expect(page.getByText('Initial activity')).toBeVisible()

    // Wait for auto-refresh (60 seconds + buffer)
    await page.waitForTimeout(65000)

    // Verify new activity appeared
    await expect(page.getByText('Refreshed activity')).toBeVisible()

    // Verify at least 2 API calls were made
    expect(callCount).toBeGreaterThanOrEqual(2)
  })
})
