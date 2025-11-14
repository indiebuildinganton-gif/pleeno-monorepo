/**
 * Notification System E2E Tests
 *
 * End-to-end tests for the complete notification system including:
 * - Configuring notification rules
 * - Creating custom email templates
 * - Sending notifications when payments become overdue
 * - Preventing duplicate notifications
 * - Assigning sales agents and notifying them
 *
 * Epic 5: Intelligent Status Automation & Notifications
 * Story 5.5: Automated Email Notifications (Multi-Stakeholder)
 * Task 6: Testing
 */

import { test, expect } from '@playwright/test'

test.describe('Notification System Configuration', () => {
  test.beforeEach(async ({ page }) => {
    // Note: These tests require:
    // 1. Authenticated admin user session
    // 2. Test agency setup
    // In a real implementation, you would set up authentication via API
  })

  test('should configure notification rules for different recipient types', async ({ page }) => {
    test.skip() // Skip until test authentication is configured

    // Login as agency admin
    await page.goto('/login')
    await page.fill('[name="email"]', 'admin@agency.com')
    await page.fill('[name="password"]', 'password123')
    await page.click('button[type="submit"]')
    await expect(page).toHaveURL('/dashboard')

    // Navigate to notification settings
    await page.goto('/settings/notifications')

    // ===================================================================
    // AC: Configure notification rules
    // ===================================================================

    // Verify page loaded
    await expect(page.locator('h1')).toContainText(/Notification Settings/i)

    // Enable student overdue notifications
    const studentToggle = page.locator('[data-testid="student-overdue-toggle"]')
    await expect(studentToggle).toBeVisible()
    await studentToggle.check()
    await expect(studentToggle).toBeChecked()

    // Enable agency user notifications
    const agencyUserToggle = page.locator('[data-testid="agency-user-overdue-toggle"]')
    await agencyUserToggle.check()
    await expect(agencyUserToggle).toBeChecked()

    // Enable college notifications
    const collegeToggle = page.locator('[data-testid="college-overdue-toggle"]')
    await collegeToggle.check()
    await expect(collegeToggle).toBeChecked()

    // Enable sales agent notifications
    const salesAgentToggle = page.locator('[data-testid="sales-agent-overdue-toggle"]')
    await salesAgentToggle.check()
    await expect(salesAgentToggle).toBeChecked()

    // Save settings
    await page.click('button[type="submit"]')

    // Verify success message
    const successMessage = page.locator('.success-message, [role="alert"]').filter({ hasText: /saved|success/i })
    await expect(successMessage).toBeVisible()

    // Reload page and verify settings persisted
    await page.reload()
    await expect(studentToggle).toBeChecked()
    await expect(agencyUserToggle).toBeChecked()
    await expect(collegeToggle).toBeChecked()
    await expect(salesAgentToggle).toBeChecked()
  })

  test('should configure different event types', async ({ page }) => {
    test.skip() // Skip until test authentication is configured

    await page.goto('/settings/notifications')

    // Configure overdue notifications
    await page.locator('[data-testid="student-overdue-toggle"]').check()

    // Configure due soon notifications
    await page.locator('[data-testid="student-due-soon-toggle"]').check()

    // Configure payment received notifications
    await page.locator('[data-testid="student-payment-received-toggle"]').check()

    // Save
    await page.click('button[type="submit"]')
    await expect(page.locator('.success-message')).toBeVisible()

    // Verify all event types are enabled
    await page.reload()
    await expect(page.locator('[data-testid="student-overdue-toggle"]')).toBeChecked()
    await expect(page.locator('[data-testid="student-due-soon-toggle"]')).toBeChecked()
    await expect(page.locator('[data-testid="student-payment-received-toggle"]')).toBeChecked()
  })

  test('should disable notification rules', async ({ page }) => {
    test.skip() // Skip until test authentication is configured

    await page.goto('/settings/notifications')

    // Enable then disable
    const toggle = page.locator('[data-testid="student-overdue-toggle"]')
    await toggle.check()
    await page.click('button[type="submit"]')
    await page.waitForResponse((response) => response.url().includes('/api/notification-rules'))

    // Disable
    await toggle.uncheck()
    await expect(toggle).not.toBeChecked()

    // Save
    await page.click('button[type="submit"]')
    await expect(page.locator('.success-message')).toBeVisible()

    // Verify disabled after reload
    await page.reload()
    await expect(toggle).not.toBeChecked()
  })
})

test.describe('Email Template Management', () => {
  test.beforeEach(async ({ page }) => {
    // Authentication setup
  })

  test('should create custom email template with placeholders', async ({ page }) => {
    test.skip() // Skip until test authentication is configured

    // Navigate to email templates
    await page.goto('/settings/email-templates')

    // Click create template button
    await page.click('button:has-text("Create New Template"), button:has-text("New Template")')

    // Fill template form
    await page.selectOption('[name="template_type"]', 'student_overdue')
    await page.fill('[name="subject"]', 'Custom Payment Reminder for {{student_name}}')

    // Fill body with rich text
    const bodyField = page.locator('[name="body_html"], .editor')
    await bodyField.fill(`
      <p>Dear {{student_name}},</p>
      <p>This is a reminder that your payment of {{amount}} was due on {{due_date}}.</p>
      <p><strong>College:</strong> {{college_name}}</p>
      <p><strong>Branch:</strong> {{branch_name}}</p>
      <p>{{payment_instructions}}</p>
      <p><a href="{{view_link}}">View Details</a></p>
    `)

    // ===================================================================
    // AC: Insert placeholders via picker
    // ===================================================================

    // Click placeholder picker button
    await page.click('button:has-text("Insert Placeholder")')

    // Verify placeholder menu appears
    await expect(page.locator('text={{student_name}}')).toBeVisible()
    await expect(page.locator('text={{amount}}')).toBeVisible()
    await expect(page.locator('text={{due_date}}')).toBeVisible()

    // Click a placeholder
    await page.click('text={{student_name}}')

    // Verify placeholder inserted in template
    await expect(bodyField).toContainText('{{student_name}}')

    // ===================================================================
    // AC: Preview template with sample data
    // ===================================================================

    // Click preview button
    await page.click('button:has-text("Preview")')

    // Verify preview pane appears
    const previewPane = page.locator('.preview-pane, [data-testid="template-preview"]')
    await expect(previewPane).toBeVisible()

    // Verify placeholders are replaced with sample data
    await expect(previewPane).toContainText('Dear John Doe') // {{student_name}} replaced
    await expect(previewPane).toContainText('$1,500.00') // {{amount}} replaced
    await expect(previewPane).not.toContainText('{{student_name}}') // No unreplaced placeholders

    // ===================================================================
    // AC: Save template
    // ===================================================================

    // Click save button
    await page.click('button:has-text("Save Template"), button[type="submit"]')

    // Verify success message
    await expect(page.locator('.success-message')).toBeVisible()

    // Verify redirect to template list
    await expect(page).toHaveURL(/\/settings\/email-templates/)

    // Verify template appears in list
    await expect(page.locator('text=Custom Payment Reminder')).toBeVisible()
  })

  test('should validate template syntax', async ({ page }) => {
    test.skip() // Skip until test authentication is configured

    await page.goto('/settings/email-templates')
    await page.click('button:has-text("Create New Template")')

    // Fill with invalid template (unclosed placeholder)
    await page.selectOption('[name="template_type"]', 'student_overdue')
    await page.fill('[name="subject"]', 'Test')
    await page.fill('[name="body_html"]', '<p>Hello {{student_name</p>')

    // Try to save
    await page.click('button[type="submit"]')

    // Verify error message
    const errorMessage = page.locator('.error-message, [role="alert"]').filter({ hasText: /validation|invalid/i })
    await expect(errorMessage).toBeVisible()
    await expect(errorMessage).toContainText(/placeholder|brace/)
  })

  test('should prevent XSS in template HTML', async ({ page }) => {
    test.skip() // Skip until test authentication is configured

    await page.goto('/settings/email-templates')
    await page.click('button:has-text("Create New Template")')

    // Fill with malicious HTML
    await page.selectOption('[name="template_type"]', 'student_overdue')
    await page.fill('[name="subject"]', 'Test')
    await page.fill('[name="body_html"]', '<p>Hello</p><script>alert("XSS")</script>')

    // Save template
    await page.click('button[type="submit"]')

    // Verify success (HTML should be sanitized)
    await expect(page.locator('.success-message')).toBeVisible()

    // Click to edit template again
    await page.click('text=Test >> ..')

    // Verify script tag was stripped
    const bodyField = page.locator('[name="body_html"]')
    const bodyValue = await bodyField.inputValue()
    expect(bodyValue).toContain('<p>Hello</p>')
    expect(bodyValue).not.toContain('<script>')
  })

  test('should edit existing template', async ({ page }) => {
    test.skip() // Skip until test authentication is configured

    // Prerequisites: Template already exists

    await page.goto('/settings/email-templates')

    // Click edit on first template
    await page.click('button:has-text("Edit"), [aria-label="Edit template"]').first()

    // Modify subject
    const subjectField = page.locator('[name="subject"]')
    await subjectField.fill('Updated Subject: {{student_name}}')

    // Save
    await page.click('button[type="submit"]')
    await expect(page.locator('.success-message')).toBeVisible()

    // Verify update
    await expect(page.locator('text=Updated Subject')).toBeVisible()
  })

  test('should delete template', async ({ page }) => {
    test.skip() // Skip until test authentication is configured

    await page.goto('/settings/email-templates')

    // Get initial template count
    const initialCount = await page.locator('[data-testid="template-row"]').count()

    // Click delete on first template
    await page.click('button:has-text("Delete"), [aria-label="Delete template"]').first()

    // Confirm deletion
    await page.click('button:has-text("Confirm"), button:has-text("Yes")')

    // Wait for deletion
    await page.waitForResponse((response) => response.url().includes('/api/email-templates'))

    // Verify count decreased
    const newCount = await page.locator('[data-testid="template-row"]').count()
    expect(newCount).toBe(initialCount - 1)
  })
})

test.describe('Notification Sending Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Authentication setup
  })

  test('should send notifications when payment becomes overdue', async ({ page }) => {
    test.skip() // Skip until test authentication and data setup is configured

    // ===================================================================
    // Prerequisites:
    // - Create student with payment plan
    // - Set installment due date to yesterday
    // - Enable student notifications
    // ===================================================================

    // Trigger status update job
    await page.goto('/admin/jobs')
    await page.click('button:has-text("Run Status Update"), button:has-text("Trigger Job")')

    // Wait for job completion
    await page.waitForSelector('.job-status:has-text("Completed"), [data-status="completed"]')

    // Navigate to notification logs
    await page.goto('/admin/notification-logs')

    // ===================================================================
    // AC: Verify notification sent
    // ===================================================================

    // Verify log entry shows sent email
    await expect(page.locator('table, [data-testid="notification-log"]')).toContainText('student@example.com')
    await expect(page.locator('text=sent, text=success')).toBeVisible()

    // Verify recipient type
    await expect(page.locator('table, [data-testid="notification-log"]')).toContainText('student')

    // Verify event type
    await expect(page.locator('table, [data-testid="notification-log"]')).toContainText('overdue')
  })

  test('should not send duplicate notifications', async ({ page }) => {
    test.skip() // Skip until test authentication is configured

    // Trigger job first time
    await page.goto('/admin/jobs')
    await page.click('button:has-text("Run Status Update")')
    await page.waitForSelector('[data-status="completed"]')

    // Trigger job second time
    await page.click('button:has-text("Run Status Update")')
    await page.waitForSelector('[data-status="completed"]')

    // Check notification logs
    await page.goto('/admin/notification-logs')

    // ===================================================================
    // AC: Only one notification sent per recipient
    // ===================================================================

    // Count rows for same installment
    const rows = page.locator('table tbody tr').filter({ hasText: 'student@example.com' })
    expect(await rows.count()).toBe(1)
  })

  test('should send to multiple recipient types', async ({ page }) => {
    test.skip() // Skip until test authentication is configured

    // ===================================================================
    // Prerequisites:
    // - Enable notifications for: student, agency_user, college
    // - Create overdue installment
    // ===================================================================

    // Trigger status update
    await page.goto('/admin/jobs')
    await page.click('button:has-text("Run Status Update")')
    await page.waitForSelector('[data-status="completed"]')

    // Check logs
    await page.goto('/admin/notification-logs')

    // Verify multiple recipients
    await expect(page.locator('text=student@example.com')).toBeVisible()
    await expect(page.locator('text=user@agency.com')).toBeVisible()
    await expect(page.locator('text=college@example.com')).toBeVisible()
  })

  test('should assign sales agent and notify them', async ({ page }) => {
    test.skip() // Skip until test authentication is configured

    // Navigate to student edit page
    await page.goto('/students/123/edit')

    // ===================================================================
    // AC: Assign sales agent
    // ===================================================================

    // Select sales agent from dropdown
    await page.selectOption('[name="assigned_user_id"]', 'agent-456')

    // Save
    await page.click('button[type="submit"]')
    await expect(page.locator('.success-message')).toBeVisible()

    // Make payment overdue (set due date to past)
    // (This would be done via API in real implementation)

    // Trigger notification job
    await page.goto('/admin/jobs')
    await page.click('button:has-text("Run Status Update")')
    await page.waitForSelector('[data-status="completed"]')

    // ===================================================================
    // AC: Verify agent received email
    // ===================================================================

    await page.goto('/admin/notification-logs')
    await expect(page.locator('table')).toContainText('agent@agency.com')
    await expect(page.locator('table')).toContainText('sales_agent')
  })

  test('should respect notification rules when sending', async ({ page }) => {
    test.skip() // Skip until test authentication is configured

    // Disable student notifications
    await page.goto('/settings/notifications')
    await page.locator('[data-testid="student-overdue-toggle"]').uncheck()
    await page.click('button[type="submit"]')

    // Enable only agency user notifications
    await page.locator('[data-testid="agency-user-overdue-toggle"]').check()
    await page.click('button[type="submit"]')

    // Make payment overdue and trigger job
    await page.goto('/admin/jobs')
    await page.click('button:has-text("Run Status Update")')
    await page.waitForSelector('[data-status="completed"]')

    // Check logs
    await page.goto('/admin/notification-logs')

    // ===================================================================
    // AC: Only agency users notified, not students
    // ===================================================================

    await expect(page.locator('table')).toContainText('user@agency.com')
    await expect(page.locator('table')).not.toContainText('student@example.com')
  })

  test('should handle email send failures gracefully', async ({ page }) => {
    test.skip() // Skip until test authentication is configured

    // ===================================================================
    // Prerequisites:
    // - Student with invalid email address
    // - Enable student notifications
    // ===================================================================

    // Trigger job
    await page.goto('/admin/jobs')
    await page.click('button:has-text("Run Status Update")')
    await page.waitForSelector('[data-status="completed"]')

    // Check logs
    await page.goto('/admin/notification-logs')

    // Verify failed status shown
    await expect(page.locator('text=failed, text=error')).toBeVisible()

    // Verify error message displayed
    await expect(page.locator('table')).toContainText(/invalid email|send failed/i)
  })

  test('should use custom template when configured', async ({ page }) => {
    test.skip() // Skip until test authentication is configured

    // Create custom template
    await page.goto('/settings/email-templates')
    await page.click('button:has-text("Create New Template")')
    await page.selectOption('[name="template_type"]', 'student_overdue')
    await page.fill('[name="subject"]', 'Custom Subject')
    await page.fill('[name="body_html"]', '<p>Custom body</p>')
    await page.click('button[type="submit"]')

    // Make payment overdue and trigger job
    await page.goto('/admin/jobs')
    await page.click('button:has-text("Run Status Update")')
    await page.waitForSelector('[data-status="completed"]')

    // Check logs
    await page.goto('/admin/notification-logs')

    // Verify custom template used
    await expect(page.locator('table')).toContainText('Custom Subject')
  })

  test('should show notification log with details', async ({ page }) => {
    test.skip() // Skip until test authentication is configured

    await page.goto('/admin/notification-logs')

    // Verify columns present
    await expect(page.locator('th:has-text("Recipient")')).toBeVisible()
    await expect(page.locator('th:has-text("Type")')).toBeVisible()
    await expect(page.locator('th:has-text("Event")')).toBeVisible()
    await expect(page.locator('th:has-text("Status")')).toBeVisible()
    await expect(page.locator('th:has-text("Sent At")')).toBeVisible()

    // Click on log entry for details
    await page.click('table tbody tr').first()

    // Verify detail modal/panel shows
    await expect(page.locator('.modal, .drawer, .details-panel')).toBeVisible()

    // Verify details shown
    await expect(page.locator('text=Recipient Email')).toBeVisible()
    await expect(page.locator('text=Email Subject')).toBeVisible()
    await expect(page.locator('text=Sent At')).toBeVisible()
    await expect(page.locator('text=Template Used')).toBeVisible()
  })
})

test.describe('Notification System Error Handling', () => {
  test('should handle missing email addresses', async ({ page }) => {
    test.skip() // Skip until test authentication is configured

    // Prerequisites: Student without email address

    await page.goto('/admin/jobs')
    await page.click('button:has-text("Run Status Update")')
    await page.waitForSelector('[data-status="completed"]')

    // Check logs
    await page.goto('/admin/notification-logs')

    // Should not crash, but show skipped or failed status
    await expect(page.locator('text=skipped, text=no email')).toBeVisible()
  })

  test('should handle Resend API errors', async ({ page }) => {
    test.skip() // Skip until test authentication is configured

    // Prerequisites: Resend API configured to fail

    await page.goto('/admin/jobs')
    await page.click('button:has-text("Run Status Update")')

    // Job should complete but show errors
    await page.waitForSelector('[data-status="completed"]')

    // Check logs for error details
    await page.goto('/admin/notification-logs')
    await expect(page.locator('text=failed')).toBeVisible()
    await expect(page.locator('table')).toContainText(/api error|service error/i)
  })
})
