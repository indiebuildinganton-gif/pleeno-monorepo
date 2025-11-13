# Task 6: Testing

**Story:** 5.5 - Automated Email Notifications (Multi-Stakeholder)

**Acceptance Criteria Addressed:** All ACs

**Prerequisites:** All previous tasks (1-5) must be completed

## Objective

Create comprehensive tests covering all aspects of the notification system: email template rendering, notification rules API, duplicate prevention, and end-to-end notification flow.

## Background Context

Testing a notification system requires multiple layers:
1. **Unit Tests:** Individual functions (template rendering, recipient lookup)
2. **Integration Tests:** API routes, database operations
3. **Edge Function Tests:** Notification logic with mocked email service
4. **E2E Tests:** Complete flow from status update to email delivery

## Subtasks

### 6.1: Email Template Rendering Tests

**Location:** `packages/utils/src/__tests__/email-helpers.test.ts`

```typescript
import { describe, it, expect } from 'vitest'
import { renderTemplate, formatCurrency, formatDate } from '../email-helpers'

describe('renderTemplate', () => {
  it('should replace simple placeholders', () => {
    const template = 'Hello {{name}}, you owe {{amount}}'
    const variables = { name: 'John', amount: '$100' }
    const result = renderTemplate(template, variables)
    expect(result).toBe('Hello John, you owe $100')
  })

  it('should handle missing variables gracefully', () => {
    const template = 'Hello {{name}}, {{greeting}}'
    const variables = { name: 'John' }
    const result = renderTemplate(template, variables)
    expect(result).toBe('Hello John, ')
  })

  it('should handle conditional sections', () => {
    const template = 'Name: {{name}}{{#if premium}} (Premium){{/if}}'
    const result1 = renderTemplate(template, { name: 'John', premium: true })
    const result2 = renderTemplate(template, { name: 'Jane', premium: false })
    expect(result1).toBe('Name: John (Premium)')
    expect(result2).toBe('Name: Jane')
  })

  it('should handle loops', () => {
    const template = '{{#each items}}<li>{{name}}: {{price}}</li>{{/each}}'
    const variables = {
      items: [
        { name: 'Item 1', price: '$10' },
        { name: 'Item 2', price: '$20' }
      ]
    }
    const result = renderTemplate(template, variables)
    expect(result).toContain('<li>Item 1: $10</li>')
    expect(result).toContain('<li>Item 2: $20</li>')
  })

  it('should handle empty arrays in loops', () => {
    const template = '{{#each items}}<li>{{name}}</li>{{/each}}'
    const result = renderTemplate(template, { items: [] })
    expect(result).toBe('')
  })
})

describe('formatCurrency', () => {
  it('should format amount as AUD currency', () => {
    expect(formatCurrency(1500)).toBe('$1,500.00')
    expect(formatCurrency(10.5)).toBe('$10.50')
  })
})

describe('formatDate', () => {
  it('should format date in Australian format', () => {
    const date = '2025-05-15'
    const formatted = formatDate(date)
    expect(formatted).toBe('15 May 2025')
  })
})
```

### 6.2: Notification Rules API Tests

**Location:** `apps/agency/app/api/__tests__/notification-rules.test.ts`

```typescript
import { describe, it, expect, beforeEach } from 'vitest'
import { createMocks } from 'node-mocks-http'
import { GET, POST, PATCH, DELETE } from '../notification-rules/route'

describe('Notification Rules API', () => {
  let mockSupabase: any

  beforeEach(() => {
    // Mock Supabase client
    mockSupabase = {
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: { user: { id: 'user-123' } }
        })
      },
      from: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      insert: vi.fn().mockReturnThis(),
      update: vi.fn().mockReturnThis(),
      delete: vi.fn().mockReturnThis(),
      single: vi.fn()
    }
  })

  describe('GET /api/notification-rules', () => {
    it('should return rules for current agency only', async () => {
      mockSupabase.single.mockResolvedValue({
        data: { agency_id: 'agency-123' }
      })
      mockSupabase.select.mockResolvedValue({
        data: [
          { id: 'rule-1', recipient_type: 'student', is_enabled: true },
          { id: 'rule-2', recipient_type: 'agency_user', is_enabled: false }
        ],
        error: null
      })

      const { req, res } = createMocks({ method: 'GET' })
      await GET(req)

      expect(mockSupabase.from).toHaveBeenCalledWith('notification_rules')
      expect(mockSupabase.eq).toHaveBeenCalledWith('agency_id', 'agency-123')
    })

    it('should handle database errors', async () => {
      mockSupabase.select.mockResolvedValue({
        data: null,
        error: { message: 'Database error' }
      })

      const { req } = createMocks({ method: 'GET' })
      const response = await GET(req)
      const json = await response.json()

      expect(json.error).toBeTruthy()
    })
  })

  describe('POST /api/notification-rules', () => {
    it('should create new rule with correct data', async () => {
      const ruleData = {
        agency_id: 'agency-123',
        recipient_type: 'student',
        event_type: 'overdue',
        is_enabled: true
      }

      const { req } = createMocks({
        method: 'POST',
        body: ruleData
      })

      mockSupabase.insert.mockResolvedValue({
        data: { id: 'rule-123', ...ruleData },
        error: null
      })

      await POST(req)

      expect(mockSupabase.insert).toHaveBeenCalledWith(
        expect.objectContaining(ruleData)
      )
    })

    it('should validate recipient_type', async () => {
      const invalidData = {
        agency_id: 'agency-123',
        recipient_type: 'invalid_type',
        event_type: 'overdue'
      }

      const { req } = createMocks({
        method: 'POST',
        body: invalidData
      })

      const response = await POST(req)
      expect(response.status).toBe(400)
    })
  })
})
```

### 6.3: Email Template API Tests

**Location:** `apps/agency/app/api/__tests__/email-templates.test.ts`

```typescript
import { describe, it, expect } from 'vitest'
import { POST } from '../email-templates/route'
import { createMocks } from 'node-mocks-http'

describe('Email Templates API', () => {
  describe('POST /api/email-templates', () => {
    it('should sanitize HTML to prevent XSS', async () => {
      const maliciousTemplate = {
        agency_id: 'agency-123',
        template_type: 'student_overdue',
        subject: 'Test',
        body_html: '<p>Hello</p><script>alert("XSS")</script>'
      }

      const { req } = createMocks({
        method: 'POST',
        body: maliciousTemplate
      })

      const response = await POST(req)
      const json = await response.json()

      // Script tag should be stripped
      expect(json.data.body_html).not.toContain('<script>')
      expect(json.data.body_html).toContain('<p>Hello</p>')
    })

    it('should allow safe HTML tags', async () => {
      const safeTemplate = {
        agency_id: 'agency-123',
        template_type: 'student_overdue',
        subject: 'Test',
        body_html: '<p>Hello <strong>{{name}}</strong>, <a href="{{link}}">click here</a></p>'
      }

      const { req } = createMocks({
        method: 'POST',
        body: safeTemplate
      })

      const response = await POST(req)
      const json = await response.json()

      expect(json.data.body_html).toContain('<p>')
      expect(json.data.body_html).toContain('<strong>')
      expect(json.data.body_html).toContain('<a href')
    })
  })
})
```

### 6.4: Edge Function Tests

**Location:** `supabase/functions/notifications/__tests__/send-notifications.test.ts`

```typescript
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { assertEquals } from 'https://deno.land/std@0.168.0/testing/asserts.ts'

describe('Send Notifications Edge Function', () => {
  let mockResend: any
  let mockSupabase: any

  beforeEach(() => {
    // Mock Resend
    mockResend = {
      emails: {
        send: vi.fn().mockResolvedValue({ id: 'email-123' })
      }
    }

    // Mock Supabase
    mockSupabase = {
      from: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      in: vi.fn().mockReturnThis(),
      insert: vi.fn().mockReturnThis(),
      update: vi.fn().mockReturnThis(),
      single: vi.fn()
    }
  })

  it('should send emails to correct recipients', async () => {
    const mockInstallments = [
      {
        id: 'inst-1',
        agency_amount: 1500,
        student_due_date: '2025-05-15',
        payment_plan: {
          student: {
            id: 'student-1',
            name: 'John Doe',
            email: 'john@example.com',
            phone: '0400123456',
            assigned_user: null
          },
          branch: {
            name: 'Brisbane Campus',
            college: {
              id: 'college-1',
              name: 'Example University',
              contact_email: 'college@example.com'
            }
          },
          agency: {
            id: 'agency-1',
            name: 'Education Agency',
            contact_email: 'agency@example.com',
            contact_phone: '1300123456',
            payment_instructions: 'Bank transfer details...'
          }
        }
      }
    ]

    mockSupabase.select.mockResolvedValueOnce({
      data: mockInstallments,
      error: null
    })

    // Mock notification rules
    mockSupabase.select.mockResolvedValueOnce({
      data: [
        {
          recipient_type: 'student',
          is_enabled: true,
          email_templates: {
            subject: 'Payment Reminder',
            body_html: '<p>Dear {{student_name}}, you owe {{amount}}</p>'
          }
        }
      ],
      error: null
    })

    // Mock notification log check (not exists)
    mockSupabase.single.mockResolvedValue({
      data: null,
      error: { code: 'PGRST116' }
    })

    // Call function
    const request = new Request('http://localhost', {
      method: 'POST',
      body: JSON.stringify({
        installmentIds: ['inst-1'],
        eventType: 'overdue'
      })
    })

    // Verify email sent
    expect(mockResend.emails.send).toHaveBeenCalledWith(
      expect.objectContaining({
        to: 'john@example.com',
        subject: 'Payment Reminder',
        html: expect.stringContaining('Dear John Doe')
      })
    )
  })

  it('should prevent duplicate sends', async () => {
    // Mock notification log check (already exists)
    mockSupabase.single.mockResolvedValue({
      data: { id: 'log-123' },
      error: null
    })

    // Email should NOT be sent
    expect(mockResend.emails.send).not.toHaveBeenCalled()
  })

  it('should update last_notified_date after successful send', async () => {
    mockSupabase.single.mockResolvedValue({
      data: null,
      error: { code: 'PGRST116' }
    })

    mockResend.emails.send.mockResolvedValue({ id: 'email-123' })

    // After successful send
    expect(mockSupabase.update).toHaveBeenCalledWith(
      expect.objectContaining({
        last_notified_date: expect.any(String)
      })
    )
  })

  it('should handle email send failures gracefully', async () => {
    mockResend.emails.send.mockRejectedValue(new Error('Email service error'))

    const request = new Request('http://localhost', {
      method: 'POST',
      body: JSON.stringify({
        installmentIds: ['inst-1'],
        eventType: 'overdue'
      })
    })

    const response = await handleRequest(request)
    const json = await response.json()

    expect(json.results).toContainEqual(
      expect.objectContaining({
        status: 'failed',
        error: expect.stringContaining('Email service error')
      })
    )
  })
})
```

### 6.5: End-to-End Tests

**Location:** `apps/agency/e2e/notifications.spec.ts`

```typescript
import { test, expect } from '@playwright/test'

test.describe('Notification System E2E', () => {
  test.beforeEach(async ({ page }) => {
    // Login as agency admin
    await page.goto('/login')
    await page.fill('[name="email"]', 'admin@agency.com')
    await page.fill('[name="password"]', 'password123')
    await page.click('button[type="submit"]')
    await expect(page).toHaveURL('/dashboard')
  })

  test('should configure notification rules', async ({ page }) => {
    await page.goto('/settings/notifications')

    // Enable student overdue notifications
    await page.check('[data-testid="student-overdue-toggle"]')

    // Enable agency user notifications
    await page.check('[data-testid="agency-user-overdue-toggle"]')

    // Save settings
    await page.click('button[type="submit"]')

    // Verify success message
    await expect(page.locator('.success-message')).toBeVisible()

    // Reload page and verify settings persisted
    await page.reload()
    await expect(page.locator('[data-testid="student-overdue-toggle"]')).toBeChecked()
    await expect(page.locator('[data-testid="agency-user-overdue-toggle"]')).toBeChecked()
  })

  test('should create custom email template', async ({ page }) => {
    await page.goto('/settings/email-templates')

    // Click create template
    await page.click('button:has-text("Create New Template")')

    // Fill template form
    await page.selectOption('[name="template_type"]', 'student_overdue')
    await page.fill('[name="subject"]', 'Custom Payment Reminder')
    await page.fill('[name="body_html"]', '<p>Dear {{student_name}}, you owe {{amount}}.</p>')

    // Insert placeholder
    await page.click('text={{student_name}}')
    await expect(page.locator('[name="body_html"]')).toContainText('{{student_name}}')

    // Preview template
    await page.click('button:has-text("Preview")')
    await expect(page.locator('.preview-pane')).toContainText('Dear John Doe')

    // Save template
    await page.click('button:has-text("Save Template")')

    // Verify success
    await expect(page.locator('.success-message')).toBeVisible()
  })

  test('should send notifications when payment becomes overdue', async ({ page }) => {
    // Create a student with upcoming payment
    await page.goto('/students/new')
    // ... fill student form ...

    // Create payment plan with installment due yesterday
    await page.goto('/students/123/payment-plan')
    // ... set installment due date to yesterday ...

    // Trigger status update job (via API or manual button)
    await page.goto('/admin/jobs')
    await page.click('button:has-text("Run Status Update")')

    // Wait for job completion
    await expect(page.locator('.job-status')).toHaveText('Completed')

    // Verify notification sent (check logs or UI indicator)
    await page.goto('/admin/notification-logs')
    await expect(page.locator('table')).toContainText('student@example.com')
    await expect(page.locator('table')).toContainText('sent')
  })

  test('should not send duplicate notifications', async ({ page }) => {
    // Run status update job twice
    await page.goto('/admin/jobs')
    await page.click('button:has-text("Run Status Update")')
    await page.click('button:has-text("Run Status Update")')

    // Check notification logs - should only have one entry per recipient
    await page.goto('/admin/notification-logs')
    const rows = await page.locator('table tbody tr').count()
    expect(rows).toBe(1) // Only one notification sent, not two
  })

  test('should assign sales agent and notify them', async ({ page }) => {
    // Assign sales agent to student
    await page.goto('/students/123/edit')
    await page.selectOption('[name="assigned_user_id"]', 'agent-456')
    await page.click('button[type="submit"]')

    // Make payment overdue
    // Trigger notification job
    // Verify agent received email
    await page.goto('/admin/notification-logs')
    await expect(page.locator('table')).toContainText('agent@agency.com')
  })
})
```

### 6.6: Test Configuration

**Location:** `vitest.config.ts`

```typescript
import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    setupFiles: ['./test/setup.ts'],
    coverage: {
      reporter: ['text', 'json', 'html'],
      include: ['src/**/*.ts', 'app/api/**/*.ts'],
      exclude: ['**/__tests__/**', '**/node_modules/**']
    }
  }
})
```

## Testing Checklist

- [ ] All unit tests pass
- [ ] All integration tests pass
- [ ] All Edge Function tests pass
- [ ] All E2E tests pass
- [ ] Test coverage > 80% for email helpers
- [ ] Test coverage > 70% for API routes
- [ ] Test coverage > 60% for Edge Functions
- [ ] Duplicate prevention verified
- [ ] HTML sanitization verified
- [ ] Error handling tested (failed sends, DB errors)

## Files to Create/Modify

**Create:**
- `packages/utils/src/__tests__/email-helpers.test.ts`
- `apps/agency/app/api/__tests__/notification-rules.test.ts`
- `apps/agency/app/api/__tests__/email-templates.test.ts`
- `supabase/functions/notifications/__tests__/send-notifications.test.ts`
- `apps/agency/e2e/notifications.spec.ts`
- `vitest.config.ts` (if not exists)

## Definition of Done

- [ ] All test files created and passing
- [ ] Unit tests cover email template rendering
- [ ] Integration tests cover API routes
- [ ] Edge Function tests cover notification logic
- [ ] E2E tests cover complete notification flow
- [ ] Duplicate prevention tested and working
- [ ] HTML sanitization tested and working
- [ ] Error handling tested for all failure scenarios
- [ ] Test coverage meets minimum thresholds

## References

- [Source: .bmad-ephemeral/stories/5-5-automated-email-notifications-multi-stakeholder.md#Task 6]
- [Source: .bmad-ephemeral/stories/5-5-automated-email-notifications-multi-stakeholder.md#Testing Standards]
- [Vitest Documentation](https://vitest.dev/)
- [Playwright Documentation](https://playwright.dev/)

---

**Previous Task:** Task 5 - Notification Job Extension
**Next Task:** Task 7 - Documentation and Configuration
