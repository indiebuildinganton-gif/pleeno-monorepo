# Task 13: Write Tests for User Management

**Story:** 2.3 User Management Interface
**AC:** 1-6

## Context

Write comprehensive tests covering all acceptance criteria for the user management feature.

## Task

Create unit, integration, and E2E tests for user management functionality.

## Test Files to Create

1. API Route Tests (Integration)
   - `__tests__/integration/api/users/role.test.ts`
   - `__tests__/integration/api/users/status.test.ts`
   - `__tests__/integration/api/invitations/resend.test.ts`
   - `__tests__/integration/api/invitations/delete.test.ts`

2. Component Tests (Unit)
   - `apps/agency/app/users/components/__tests__/UserTable.test.tsx`
   - `apps/agency/app/users/components/__tests__/UserActionsMenu.test.tsx`
   - `apps/agency/app/users/components/__tests__/ConfirmRoleChangeDialog.test.tsx`
   - `apps/agency/app/users/components/__tests__/ConfirmStatusChangeDialog.test.tsx`

3. E2E Tests
   - `__tests__/e2e/user-management.spec.ts`

## Implementation Examples

### API Route Test: Role Change

```typescript
// __tests__/integration/api/users/role.test.ts
import { describe, it, expect, beforeEach } from 'vitest'
import { createServerClient } from '@pleeno/database'
import { PATCH } from '@/app/api/users/[id]/role/route'

describe('PATCH /api/users/[id]/role', () => {
  let adminUser: any
  let regularUser: any
  let targetUser: any

  beforeEach(async () => {
    // Setup test users
    const supabase = await createServerClient()

    // Create admin user
    adminUser = await createTestUser({
      role: 'agency_admin',
      status: 'active'
    })

    // Create regular user
    regularUser = await createTestUser({
      role: 'agency_user',
      status: 'active'
    })

    // Create target user
    targetUser = await createTestUser({
      role: 'agency_user',
      status: 'active'
    })
  })

  it('admin can change user role', async () => {
    const request = new Request('http://localhost/api/users/123/role', {
      method: 'PATCH',
      body: JSON.stringify({ role: 'agency_admin' }),
      headers: {
        'Content-Type': 'application/json'
      }
    })

    // Mock auth to return admin user
    mockAuth(adminUser)

    const response = await PATCH(request, { params: { id: targetUser.id } })
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.success).toBe(true)
    expect(data.data.role).toBe('agency_admin')
  })

  it('regular user cannot change role (403)', async () => {
    const request = new Request('http://localhost/api/users/123/role', {
      method: 'PATCH',
      body: JSON.stringify({ role: 'agency_admin' })
    })

    mockAuth(regularUser)

    const response = await PATCH(request, { params: { id: targetUser.id } })
    const data = await response.json()

    expect(response.status).toBe(403)
    expect(data.success).toBe(false)
  })

  it('cannot remove last admin from agency (400)', async () => {
    // Make target user the only admin
    await updateUserRole(targetUser.id, 'agency_admin')
    await updateUserRole(adminUser.id, 'agency_user')

    const request = new Request('http://localhost/api/users/123/role', {
      method: 'PATCH',
      body: JSON.stringify({ role: 'agency_user' })
    })

    mockAuth(targetUser)

    const response = await PATCH(request, { params: { id: targetUser.id } })
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.error.message).toContain('last admin')
  })

  it('role change is logged in audit trail', async () => {
    // Test implementation
  })

  it('RLS prevents cross-agency role changes', async () => {
    // Test implementation
  })
})
```

### Component Test: UserTable

```typescript
// apps/agency/app/users/components/__tests__/UserTable.test.tsx
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { UserTable } from '../UserTable'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: false }
  }
})

function renderWithQuery(ui: React.ReactElement) {
  return render(
    <QueryClientProvider client={queryClient}>
      {ui}
    </QueryClientProvider>
  )
}

describe('UserTable', () => {
  const mockUsers = [
    {
      id: '1',
      email: 'admin@test.com',
      full_name: 'Admin User',
      role: 'agency_admin',
      status: 'active',
      agency_id: 'agency-1',
      created_at: '2024-01-01',
      updated_at: '2024-01-01'
    },
    {
      id: '2',
      email: 'user@test.com',
      full_name: 'Regular User',
      role: 'agency_user',
      status: 'inactive',
      agency_id: 'agency-1',
      created_at: '2024-01-01',
      updated_at: '2024-01-01'
    }
  ]

  it('renders user list with all columns', () => {
    renderWithQuery(
      <UserTable initialUsers={mockUsers} currentUserId="1" />
    )

    expect(screen.getByText('Admin User')).toBeInTheDocument()
    expect(screen.getByText('admin@test.com')).toBeInTheDocument()
    expect(screen.getByText('Admin')).toBeInTheDocument()
    expect(screen.getByText('Active')).toBeInTheDocument()
  })

  it('displays role badges with correct styling', () => {
    renderWithQuery(
      <UserTable initialUsers={mockUsers} currentUserId="1" />
    )

    const adminBadge = screen.getByText('Admin')
    const userBadge = screen.getByText('User')

    expect(adminBadge).toHaveClass('variant-default')
    expect(userBadge).toHaveClass('variant-secondary')
  })

  it('displays status badges with correct styling', () => {
    renderWithQuery(
      <UserTable initialUsers={mockUsers} currentUserId="1" />
    )

    const activeBadge = screen.getByText('Active')
    const inactiveBadge = screen.getByText('Inactive')

    expect(activeBadge).toHaveClass('variant-success')
    expect(inactiveBadge).toHaveClass('variant-destructive')
  })

  it('shows empty state when no users', () => {
    renderWithQuery(
      <UserTable initialUsers={[]} currentUserId="1" />
    )

    expect(screen.getByText('No users found')).toBeInTheDocument()
  })
})
```

### E2E Test: User Management Flow

```typescript
// __tests__/e2e/user-management.spec.ts
import { test, expect } from '@playwright/test'

test.describe('User Management', () => {
  test.beforeEach(async ({ page }) => {
    // Login as admin
    await page.goto('/auth/login')
    await page.fill('[name="email"]', 'admin@test.com')
    await page.fill('[name="password"]', 'password')
    await page.click('button[type="submit"]')
    await page.waitForURL('/dashboard')
  })

  test('admin can change user role', async ({ page }) => {
    // Navigate to user management
    await page.click('a[href="/users"]')
    await page.waitForURL('/users')

    // Find user row
    const userRow = page.locator('tr:has-text("Regular User")')

    // Open actions menu
    await userRow.locator('button[aria-label="Open menu"]').click()

    // Click "Change Role"
    await page.click('text=Change Role')

    // Confirm role change
    await expect(page.locator('text=Change User Role')).toBeVisible()
    await page.click('button:has-text("Confirm Change")')

    // Verify success toast
    await expect(page.locator('text=Role updated')).toBeVisible()

    // Verify role badge updated
    await expect(userRow.locator('text=Admin')).toBeVisible()
  })

  test('admin can deactivate user', async ({ page }) => {
    await page.goto('/users')

    const userRow = page.locator('tr:has-text("Regular User")')
    await userRow.locator('button[aria-label="Open menu"]').click()
    await page.click('text=Deactivate')

    // Confirm deactivation
    await expect(page.locator('text=Deactivate User')).toBeVisible()
    await page.click('button:has-text("Deactivate User")')

    // Verify success
    await expect(page.locator('text=has been deactivated')).toBeVisible()
    await expect(userRow.locator('text=Inactive')).toBeVisible()
  })

  test('deactivated user cannot log in', async ({ page, context }) => {
    // Deactivate user first
    await page.goto('/users')
    const userRow = page.locator('tr:has-text("test@user.com")')
    await userRow.locator('button[aria-label="Open menu"]').click()
    await page.click('text=Deactivate')
    await page.click('button:has-text("Deactivate User")')

    // Logout
    await page.click('button:has-text("Logout")')

    // Try to login as deactivated user
    await page.goto('/auth/login')
    await page.fill('[name="email"]', 'test@user.com')
    await page.fill('[name="password"]', 'password')
    await page.click('button[type="submit"]')

    // Verify error message
    await expect(page.locator('text=account is deactivated')).toBeVisible()
  })

  test('admin can resend invitation', async ({ page }) => {
    await page.goto('/users')

    // Find pending invitation
    const invitationRow = page.locator('tr:has-text("pending@user.com")')

    // Click resend
    await invitationRow.locator('button:has-text("Resend")').click()

    // Verify success
    await expect(page.locator('text=Invitation resent')).toBeVisible()
  })

  test('admin cannot deactivate themselves', async ({ page }) => {
    await page.goto('/users')

    // Find own user row (logged in as admin@test.com)
    const ownRow = page.locator('tr:has-text("admin@test.com")')
    await ownRow.locator('button[aria-label="Open menu"]').click()

    // Verify deactivate option is disabled
    const deactivateButton = page.locator('text=Deactivate')
    await expect(deactivateButton).toBeDisabled()
  })
})
```

## Test Coverage Requirements

### API Routes (AC: 1-6)
- [ ] Admin can view all users in their agency (200)
- [ ] User cannot access user management (403)
- [ ] Admin can change user role (200)
- [ ] Cannot remove last admin from agency (400)
- [ ] Admin can deactivate user (200)
- [ ] Admin cannot deactivate themselves (400)
- [ ] Inactive user cannot log in (401)
- [ ] Admin can reactivate user (200)
- [ ] Admin can resend pending invitation (200)
- [ ] Admin can delete pending invitation (200)
- [ ] Cannot resend/delete used invitation (400)
- [ ] RLS prevents cross-agency user management

### Components
- [ ] UserTable renders correctly
- [ ] UserTable shows badges with correct colors
- [ ] UserTable handles empty state
- [ ] UserActionsMenu renders all options
- [ ] UserActionsMenu disables self-deactivation
- [ ] Role change dialog shows confirmation
- [ ] Status change dialog shows warning
- [ ] Invitations table calculates expiration correctly

### E2E Flows
- [ ] Complete role change flow
- [ ] Complete status change flow
- [ ] Login blocked for inactive user
- [ ] Invitation resend flow
- [ ] Invitation delete flow

## Acceptance Criteria

- [ ] All test files created
- [ ] All API routes tested
- [ ] All components tested
- [ ] E2E tests cover critical paths
- [ ] Tests pass consistently
- [ ] Code coverage > 80%
- [ ] Edge cases covered
- [ ] Error cases tested

## Next Steps

After completing this task:
1. Run all tests: `npm test`
2. Check coverage: `npm run test:coverage`
3. Fix any failing tests
4. Verify E2E tests in Playwright UI
5. Mark story as complete!
