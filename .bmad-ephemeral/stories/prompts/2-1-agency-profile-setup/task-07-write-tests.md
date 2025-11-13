# Story 2-1: Agency Profile Setup - Task 7

## Story Context

**As an** Agency Admin,
**I want** to configure my agency's profile with basic information,
**So that** my agency identity is established in the system and my team knows which agency they're working in.

---

## Task 7: Write Tests for Agency Settings Feature

### Previous Tasks Completed
✅ Task 1: Created Agency Validation Schema
✅ Task 2: Implemented API Route for Agency Updates
✅ Task 3: Created Agency Settings Page and Form
✅ Task 4: Displayed Agency Name in Application Header
✅ Task 5: Implemented Timezone-Aware Date Formatting
✅ Task 6: Added Role-Based Access Control

### Description
Write comprehensive tests for the agency settings feature to ensure all acceptance criteria are met and the implementation is robust.

### Subtasks
- [ ] Test: Agency admin can view settings page
- [ ] Test: Agency user cannot access settings page (403)
- [ ] Test: Form validation works (required fields, email format)
- [ ] Test: API route updates agency successfully
- [ ] Test: API route rejects invalid data (400)
- [ ] Test: Agency name displays in header after save
- [ ] Test: Timezone conversion works correctly
- [ ] Test: RLS prevents cross-agency access

### Acceptance Criteria
This task validates **ALL ACs**:
- AC #1: Agency Admin can access and edit settings
- AC #2: Changes saved with proper validation
- AC #3: Agency name appears in header
- AC #4: Timestamps display in agency timezone

### Key Constraints
- **Testing**: Write unit tests for utilities, integration tests for API routes, E2E tests for critical flows
- **Test coverage**: Aim for 80%+ on business logic

---

## 📋 Update Implementation Manifest

1. Read `.bmad-ephemeral/stories/prompts/2-1-agency-profile-setup/manifest.md`
2. Update Task 6: Set status to "Completed" with today's date
3. Update Task 7: Set status to "In Progress" with today's date
4. Add notes about RBAC implementation

---

## Implementation Instructions

1. **Update manifest** as described above
2. **Write unit tests** for validation schema
3. **Write unit tests** for date helpers
4. **Write integration tests** for API route
5. **Write E2E test** for settings flow (optional but recommended)
6. **Run all tests** and ensure they pass

### Expected File Structure
```
packages/validations/src/
└── agency.schema.test.ts     # New test file

packages/utils/src/
└── date-helpers.test.ts      # Already created in Task 5

apps/agency/app/api/agencies/[id]/
└── route.test.ts             # New test file

__tests__/e2e/
└── agency-settings.spec.ts   # Optional E2E test
```

---

## Test Implementation Patterns

### 1. Validation Schema Tests

```typescript
// packages/validations/src/agency.schema.test.ts
import { describe, it, expect } from 'vitest'
import { AgencyUpdateSchema } from './agency.schema'

describe('AgencyUpdateSchema', () => {
  it('validates valid agency data', () => {
    const validData = {
      name: 'Test Agency',
      contact_email: 'admin@test.com',
      contact_phone: '+61 400 000 000',
      currency: 'AUD',
      timezone: 'Australia/Brisbane'
    }

    const result = AgencyUpdateSchema.safeParse(validData)
    expect(result.success).toBe(true)
  })

  it('rejects missing required fields', () => {
    const invalidData = {
      currency: 'AUD',
      timezone: 'Australia/Brisbane'
    }

    const result = AgencyUpdateSchema.safeParse(invalidData)
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.issues.some(i => i.path.includes('name'))).toBe(true)
      expect(result.error.issues.some(i => i.path.includes('contact_email'))).toBe(true)
    }
  })

  it('rejects invalid email format', () => {
    const invalidData = {
      name: 'Test',
      contact_email: 'not-an-email',
      currency: 'AUD',
      timezone: 'Australia/Brisbane'
    }

    const result = AgencyUpdateSchema.safeParse(invalidData)
    expect(result.success).toBe(false)
  })

  it('rejects invalid currency', () => {
    const invalidData = {
      name: 'Test',
      contact_email: 'test@test.com',
      currency: 'XXX',
      timezone: 'Australia/Brisbane'
    }

    const result = AgencyUpdateSchema.safeParse(invalidData)
    expect(result.success).toBe(false)
  })

  it('accepts optional phone number', () => {
    const validData = {
      name: 'Test',
      contact_email: 'test@test.com',
      currency: 'AUD',
      timezone: 'Australia/Brisbane'
      // phone omitted
    }

    const result = AgencyUpdateSchema.safeParse(validData)
    expect(result.success).toBe(true)
  })
})
```

### 2. API Route Integration Tests

```typescript
// apps/agency/app/api/agencies/[id]/route.test.ts
import { describe, it, expect, beforeEach } from 'vitest'
import { PATCH } from './route'
import { createMockRequest } from '@/test/utils'

describe('PATCH /api/agencies/[id]', () => {
  it('updates agency with valid data for admin', async () => {
    const request = createMockRequest({
      method: 'PATCH',
      body: {
        name: 'Updated Agency',
        contact_email: 'new@agency.com',
        currency: 'AUD',
        timezone: 'Australia/Brisbane'
      },
      user: { id: 'admin-user-id', role: 'agency_admin' }
    })

    const response = await PATCH(request, { params: { id: 'agency-id' } })
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.success).toBe(true)
    expect(data.data.name).toBe('Updated Agency')
  })

  it('rejects request from non-admin user', async () => {
    const request = createMockRequest({
      method: 'PATCH',
      body: { name: 'Updated' },
      user: { id: 'user-id', role: 'agency_user' }
    })

    const response = await PATCH(request, { params: { id: 'agency-id' } })
    const data = await response.json()

    expect(response.status).toBe(403)
    expect(data.success).toBe(false)
  })

  it('rejects invalid data', async () => {
    const request = createMockRequest({
      method: 'PATCH',
      body: {
        name: '', // Invalid: empty
        contact_email: 'not-an-email',
        currency: 'INVALID'
      },
      user: { id: 'admin-id', role: 'agency_admin' }
    })

    const response = await PATCH(request, { params: { id: 'agency-id' } })
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.success).toBe(false)
  })

  it('prevents cross-agency updates (RLS)', async () => {
    const request = createMockRequest({
      method: 'PATCH',
      body: { name: 'Hacked' },
      user: { id: 'admin-id', role: 'agency_admin', agency_id: 'agency-1' }
    })

    // Trying to update agency-2 (different agency)
    const response = await PATCH(request, { params: { id: 'agency-2' } })
    const data = await response.json()

    expect(response.status).toBe(403)
    expect(data.success).toBe(false)
  })
})
```

### 3. E2E Test (Optional)

```typescript
// __tests__/e2e/agency-settings.spec.ts
import { test, expect } from '@playwright/test'

test.describe('Agency Settings', () => {
  test('admin can update agency settings', async ({ page }) => {
    // Login as admin
    await page.goto('/login')
    await page.fill('[name="email"]', 'admin@test.com')
    await page.fill('[name="password"]', 'password')
    await page.click('button[type="submit"]')

    // Navigate to settings
    await page.goto('/agency/settings')

    // Check page loaded
    await expect(page.locator('h1')).toContainText('Agency Settings')

    // Update agency name
    await page.fill('[name="name"]', 'Updated Agency Name')
    await page.click('button[type="submit"]')

    // Check success message
    await expect(page.locator('.success-message')).toBeVisible()

    // Verify header updated
    await expect(page.locator('header')).toContainText('Updated Agency Name')
  })

  test('regular user cannot access settings', async ({ page }) => {
    // Login as regular user
    await page.goto('/login')
    await page.fill('[name="email"]', 'user@test.com')
    await page.fill('[name="password"]', 'password')
    await page.click('button[type="submit"]')

    // Try to access settings
    await page.goto('/agency/settings')

    // Should be redirected to dashboard with error
    await expect(page).toHaveURL(/\/dashboard/)
    await expect(page.locator('.error-message')).toBeVisible()
  })
})
```

---

## Running Tests

```bash
# Run unit tests
npm run test

# Run specific test file
npm run test packages/validations/src/agency.schema.test.ts

# Run with coverage
npm run test:coverage

# Run E2E tests (if implemented)
npm run test:e2e
```

---

## After Completion

1. ✅ Update manifest.md:
   - Mark Task 7 completed with date
   - Mark Story 2-1 as "Completed"
   - Add final implementation notes
   - List all files created/modified

2. 🎉 Story Complete! Review checklist:
   - [ ] All 7 tasks completed
   - [ ] All tests passing
   - [ ] All acceptance criteria met
   - [ ] Code reviewed (if working with team)
   - [ ] Ready to move to next story

---

## Testing Checklist

Before marking complete:
- [ ] Validation schema tests written and passing
- [ ] Date helper tests written and passing (from Task 5)
- [ ] API route integration tests written and passing
- [ ] Role-based access tests passing
- [ ] RLS policy tests passing (cross-agency prevention)
- [ ] E2E test written (optional) and passing
- [ ] Test coverage > 80% for business logic
- [ ] All tests run successfully: `npm run test`
- [ ] Manifest updated with Task 7 completion
- [ ] Story marked as COMPLETED in manifest

---

## Final Verification

Run through all acceptance criteria:

✅ **AC #1**: Agency Admin can access settings page and edit information
- Tested: Admin access granted, user access denied

✅ **AC #2**: Changes saved to database with proper validation
- Tested: Valid data saves, invalid data rejected

✅ **AC #3**: Agency name appears in application header
- Tested: Header displays agency name after save

✅ **AC #4**: Timestamps display in agency timezone
- Tested: Timezone conversion works correctly

**Congratulations! Story 2-1 is complete!** 🎉
