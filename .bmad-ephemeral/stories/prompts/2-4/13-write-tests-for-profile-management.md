# Story 2-4: User Profile Management
## Task 13: Write tests for profile management

**User Story Context:**
- As an Agency User or Admin
- I want to manage my own profile information
- So that my account information is accurate and I can change my password

**Previous Tasks:** Tasks 1-12 completed ✅ (All implementation complete!)

---

## Task Details

### Task Description
Write comprehensive tests for all profile management functionality including unit tests, integration tests, and E2E tests.

### Subtasks Checklist
- [ ] Test: User can update their full name (200)
- [ ] Test: User can view but not edit email, role, agency (read-only display)
- [ ] Test: User can change password with correct current password (200)
- [ ] Test: Password change fails with incorrect current password (401)
- [ ] Test: New password must meet requirements (400)
- [ ] Test: Regular user cannot change own email via API (403)
- [ ] Test: Admin can initiate email change for any user (200)
- [ ] Test: Email verification token generated correctly
- [ ] Test: Email verification succeeds with valid token (200)
- [ ] Test: Email verification fails with invalid token (400)
- [ ] Test: Email verification fails with expired token (400)
- [ ] Test: Email change logged in audit trail
- [ ] Test: Password change logged in audit trail (no password values)
- [ ] Test: RLS prevents users from changing other users' profiles

### Relevant Acceptance Criteria
- **All ACs (1-10):** Comprehensive test coverage validates all acceptance criteria

---

## Context

### Testing Strategy
1. **Unit Tests:** Validation schemas, utilities
2. **Integration Tests:** API endpoints with mocked Supabase
3. **E2E Tests:** Full user flows with Playwright

---

## 📋 MANIFEST UPDATE

Before starting implementation:
1. **Open:** `.bmad-ephemeral/stories/prompts/2-4/MANIFEST.md`
2. **Update Task 12:** Status → "Completed", add Completed date
3. **Update Task 13:** Status → "In Progress", add Started date

---

## Implementation

### 1. Unit Tests - Validation Schemas (Already in Task 12)

The validation schema tests were included in Task 12. Ensure they exist and pass:
```bash
cd packages/validations
npm test
```

### 2. Integration Tests - API Endpoints

```typescript
// __tests__/integration/profile-management.test.ts
import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { createClient } from '@supabase/supabase-js'

// Test setup
let supabase: any
let testUser: any
let testAdmin: any
let authToken: string
let adminToken: string

beforeAll(async () => {
  // Initialize test Supabase client
  supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  // Create test users
  const { data: userData } = await supabase.auth.admin.createUser({
    email: 'test-user@example.com',
    password: 'TestPass123!',
    email_confirm: true,
  })
  testUser = userData.user

  const { data: adminData } = await supabase.auth.admin.createUser({
    email: 'test-admin@example.com',
    password: 'AdminPass123!',
    email_confirm: true,
  })
  testAdmin = adminData.user

  // Insert into users table with roles
  await supabase.from('users').insert([
    {
      id: testUser.id,
      email: testUser.email,
      full_name: 'Test User',
      role: 'agency_user',
      agency_id: 'test-agency-id',
    },
    {
      id: testAdmin.id,
      email: testAdmin.email,
      full_name: 'Test Admin',
      role: 'agency_admin',
      agency_id: 'test-agency-id',
    },
  ])

  // Get auth tokens
  const { data: userSession } = await supabase.auth.signInWithPassword({
    email: 'test-user@example.com',
    password: 'TestPass123!',
  })
  authToken = userSession.session.access_token

  const { data: adminSession } = await supabase.auth.signInWithPassword({
    email: 'test-admin@example.com',
    password: 'AdminPass123!',
  })
  adminToken = adminSession.session.access_token
})

afterAll(async () => {
  // Cleanup test users
  await supabase.auth.admin.deleteUser(testUser.id)
  await supabase.auth.admin.deleteUser(testAdmin.id)
})

describe('Profile Update API', () => {
  it('should allow user to update their full name', async () => {
    const response = await fetch('http://localhost:3000/api/users/me/profile', {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${authToken}`,
      },
      body: JSON.stringify({ full_name: 'Updated Name' }),
    })

    expect(response.status).toBe(200)
    const data = await response.json()
    expect(data.success).toBe(true)
    expect(data.data.full_name).toBe('Updated Name')
  })

  it('should reject unauthenticated requests', async () => {
    const response = await fetch('http://localhost:3000/api/users/me/profile', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ full_name: 'Hacker' }),
    })

    expect(response.status).toBe(401)
  })
})

describe('Password Change API', () => {
  it('should allow user to change password with correct current password', async () => {
    const response = await fetch('http://localhost:3000/api/users/me/password', {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${authToken}`,
      },
      body: JSON.stringify({
        current_password: 'TestPass123!',
        new_password: 'NewTestPass123!',
        confirm_password: 'NewTestPass123!',
      }),
    })

    expect(response.status).toBe(200)
    const data = await response.json()
    expect(data.success).toBe(true)

    // Verify audit log entry
    const { data: auditLogs } = await supabase
      .from('audit_log')
      .select('*')
      .eq('entity_id', testUser.id)
      .eq('action', 'password_changed')
      .order('created_at', { ascending: false })
      .limit(1)

    expect(auditLogs).toHaveLength(1)
    expect(auditLogs[0].changes_json).not.toHaveProperty('password')
  })

  it('should reject incorrect current password', async () => {
    const response = await fetch('http://localhost:3000/api/users/me/password', {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${authToken}`,
      },
      body: JSON.stringify({
        current_password: 'WrongPassword123!',
        new_password: 'NewPass123!',
        confirm_password: 'NewPass123!',
      }),
    })

    expect(response.status).toBe(401)
  })

  it('should reject weak password', async () => {
    const response = await fetch('http://localhost:3000/api/users/me/password', {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${authToken}`,
      },
      body: JSON.stringify({
        current_password: 'NewTestPass123!',
        new_password: 'weak',
        confirm_password: 'weak',
      }),
    })

    expect(response.status).toBe(400)
  })
})

describe('Email Change API', () => {
  it('should reject regular user from changing email', async () => {
    const response = await fetch(`http://localhost:3000/api/users/${testUser.id}/email`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${authToken}`,
      },
      body: JSON.stringify({ email: 'newemail@example.com' }),
    })

    expect(response.status).toBe(403)
  })

  it('should allow admin to initiate email change', async () => {
    const response = await fetch(`http://localhost:3000/api/users/${testAdmin.id}/email`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({ email: 'admin-new@example.com' }),
    })

    expect(response.status).toBe(200)
    const data = await response.json()
    expect(data.success).toBe(true)

    // Verify pending email and token set
    const { data: user } = await supabase
      .from('users')
      .select('pending_email, email_verification_token')
      .eq('id', testAdmin.id)
      .single()

    expect(user.pending_email).toBe('admin-new@example.com')
    expect(user.email_verification_token).toBeTruthy()

    // Verify audit log
    const { data: auditLogs } = await supabase
      .from('audit_log')
      .select('*')
      .eq('entity_id', testAdmin.id)
      .eq('action', 'email_change_requested')
      .order('created_at', { ascending: false })
      .limit(1)

    expect(auditLogs).toHaveLength(1)
  })
})

describe('Email Verification API', () => {
  let verificationToken: string

  beforeAll(async () => {
    // Setup: Create verification token
    verificationToken = crypto.randomUUID()
    await supabase
      .from('users')
      .update({
        pending_email: 'verified@example.com',
        email_verification_token: verificationToken,
      })
      .eq('id', testAdmin.id)
  })

  it('should verify email with valid token', async () => {
    const response = await fetch(
      `http://localhost:3000/api/users/verify-email?token=${verificationToken}`,
      { method: 'POST' }
    )

    expect(response.status).toBe(200)
    const data = await response.json()
    expect(data.success).toBe(true)

    // Verify email updated
    const { data: user } = await supabase
      .from('users')
      .select('email, pending_email, email_verification_token, email_verified_at')
      .eq('id', testAdmin.id)
      .single()

    expect(user.email).toBe('verified@example.com')
    expect(user.pending_email).toBeNull()
    expect(user.email_verification_token).toBeNull()
    expect(user.email_verified_at).toBeTruthy()

    // Verify audit log
    const { data: auditLogs } = await supabase
      .from('audit_log')
      .select('*')
      .eq('entity_id', testAdmin.id)
      .eq('action', 'email_changed')
      .order('created_at', { ascending: false })
      .limit(1)

    expect(auditLogs).toHaveLength(1)
  })

  it('should reject invalid token', async () => {
    const response = await fetch(
      `http://localhost:3000/api/users/verify-email?token=invalid-token`,
      { method: 'POST' }
    )

    expect(response.status).toBe(400)
  })

  it('should reject expired token', async () => {
    // Create expired token (>1 hour old)
    const expiredToken = crypto.randomUUID()
    await supabase
      .from('users')
      .update({
        pending_email: 'expired@example.com',
        email_verification_token: expiredToken,
        updated_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), // 2 hours ago
      })
      .eq('id', testAdmin.id)

    const response = await fetch(
      `http://localhost:3000/api/users/verify-email?token=${expiredToken}`,
      { method: 'POST' }
    )

    expect(response.status).toBe(400)
  })
})
```

### 3. E2E Tests - Full User Flows

```typescript
// __tests__/e2e/profile-management.spec.ts
import { test, expect } from '@playwright/test'

test.describe('Profile Management', () => {
  test.beforeEach(async ({ page }) => {
    // Login as test user
    await page.goto('http://localhost:3000/login')
    await page.fill('input[name="email"]', 'test-user@example.com')
    await page.fill('input[name="password"]', 'TestPass123!')
    await page.click('button[type="submit"]')
    await page.waitForURL('http://localhost:3000/dashboard')
  })

  test('should update full name successfully', async ({ page }) => {
    // Navigate to profile
    await page.goto('http://localhost:3000/profile')

    // Update full name
    await page.fill('input[name="fullName"]', 'New Name')
    await page.click('button:has-text("Save Changes")')

    // Verify success toast
    await expect(page.locator('text=Profile updated successfully')).toBeVisible()

    // Reload and verify persistence
    await page.reload()
    await expect(page.locator('input[name="fullName"]')).toHaveValue('New Name')
  })

  test('should change password successfully', async ({ page }) => {
    await page.goto('http://localhost:3000/profile')

    // Open password dialog
    await page.click('button:has-text("Change Password")')

    // Fill form
    await page.fill('input[name="currentPassword"]', 'TestPass123!')
    await page.fill('input[name="newPassword"]', 'NewPassword123!')
    await page.fill('input[name="confirmPassword"]', 'NewPassword123!')

    // Verify password strength indicator
    await expect(page.locator('text=At least 8 characters')).toHaveClass(/text-green/)

    // Submit
    await page.click('button:has-text("Change Password")')

    // Verify success
    await expect(page.locator('text=Password changed successfully')).toBeVisible()

    // Logout
    await page.click('button:has-text("Logout")')

    // Login with new password
    await page.goto('http://localhost:3000/login')
    await page.fill('input[name="email"]', 'test-user@example.com')
    await page.fill('input[name="password"]', 'NewPassword123!')
    await page.click('button[type="submit"]')

    // Verify login successful
    await page.waitForURL('http://localhost:3000/dashboard')
  })

  test('should show request email dialog for regular user', async ({ page }) => {
    await page.goto('http://localhost:3000/profile')

    // Click request change button
    await page.click('button:has-text("Request Change")')

    // Verify informational message
    await expect(
      page.locator('text=Email changes must be approved by an Agency Admin')
    ).toBeVisible()
  })
})

test.describe('Admin Email Change', () => {
  test.beforeEach(async ({ page }) => {
    // Login as admin
    await page.goto('http://localhost:3000/login')
    await page.fill('input[name="email"]', 'test-admin@example.com')
    await page.fill('input[name="password"]', 'AdminPass123!')
    await page.click('button[type="submit"]')
    await page.waitForURL('http://localhost:3000/dashboard')
  })

  test('should complete email change flow', async ({ page, context }) => {
    await page.goto('http://localhost:3000/profile')

    // Open email dialog
    await page.click('button:has-text("Update Email")')

    // Enter new email
    await page.fill('input[name="email"]', 'admin-updated@example.com')
    await page.click('button:has-text("Send Verification Email")')

    // Verify success toast
    await expect(page.locator('text=Verification email sent')).toBeVisible()

    // Note: In real test, would check email inbox (use Mailinator or similar)
    // For now, manually extract token from database

    // Simulate clicking verification link
    // await page.goto(`http://localhost:3000/verify-email?token=${token}`)

    // Verify success message
    // await expect(page.locator('text=Email verified successfully')).toBeVisible()

    // Verify redirect to profile
    // await page.waitForURL('http://localhost:3000/profile')
  })
})
```

---

## Running Tests

### Unit Tests
```bash
cd packages/validations
npm test
```

### Integration Tests
```bash
# Start dev server
npm run dev

# Run integration tests
npm run test:integration
```

### E2E Tests
```bash
# Start dev server
npm run dev

# Run E2E tests
npm run test:e2e

# Run E2E tests in UI mode
npm run test:e2e:ui
```

---

## Test Coverage Goals

- **Unit Tests:** 100% coverage for validation schemas
- **Integration Tests:** All API endpoints covered
- **E2E Tests:** All user flows covered
- **Overall:** >80% code coverage

Check coverage:
```bash
npm run test:coverage
```

---

## 📋 FINAL MANIFEST UPDATE

After completing all tests:
1. **Open:** `.bmad-ephemeral/stories/prompts/2-4/MANIFEST.md`
2. **Update Task 13:** Status → "Completed", add Completed date
3. **Update Story Status:** Change to "Completed"
4. **Add final notes:** Summary of implementation and any learnings

**Congratulations! Story 2-4 is complete! 🎉**

---

## Reference Documents
- Story context: [.bmad-ephemeral/stories/2-4-user-profile-management.context.xml](.bmad-ephemeral/stories/2-4-user-profile-management.context.xml)
- Testing docs: Vitest, Playwright documentation
