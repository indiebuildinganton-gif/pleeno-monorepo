# Task 8: Write Authentication Test Suite

## Story Context
**Story 1.3**: Authentication & Authorization Framework
**As a** developer, **I want** an authentication system with role-based access control, **so that** users can securely log in and access features based on their roles.

## Task Objective
Write comprehensive tests for authentication flows, middleware protection, role-based access, and RLS context setting.

## Acceptance Criteria Addressed
- AC 1: Users can register, log in, and log out securely
- AC 2: User sessions managed with secure JWT tokens
- AC 3: Role-based access control distinguishes between roles
- AC 4: Authentication middleware protects API routes and pages

## Subtasks
- [ ] Test: Successful signup creates user and auth record
- [ ] Test: Successful login sets JWT cookie
- [ ] Test: Logout clears JWT cookie
- [ ] Test: Middleware redirects unauthenticated requests to /login
- [ ] Test: Agency Admin can access admin-only routes
- [ ] Test: Agency User cannot access admin-only routes
- [ ] Test: RLS context is set correctly on authenticated requests
- [ ] Test: Password reset sends email and updates password

## Implementation Guide

### 1. Setup Test Environment
```bash
# Install test dependencies
pnpm add -D vitest @vitest/ui @testing-library/react @testing-library/jest-dom
pnpm add -D @testing-library/user-event msw
```

**File**: `vitest.config.ts` (project root)

```typescript
import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    setupFiles: ['./vitest.setup.ts'],
    globals: true,
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
})
```

**File**: `vitest.setup.ts`

```typescript
import '@testing-library/jest-dom'
import { cleanup } from '@testing-library/react'
import { afterEach } from 'vitest'

// Cleanup after each test
afterEach(() => {
  cleanup()
})
```

### 2. Auth API Route Tests
**File**: `apps/shell/app/api/auth/__tests__/signup.test.ts`

```typescript
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { POST } from '../signup/route'

// Mock Supabase
vi.mock('@pleeno/database/server', () => ({
  createServerClient: vi.fn(() => ({
    auth: {
      signUp: vi.fn(),
      updateUser: vi.fn(),
    },
    from: vi.fn(() => ({
      insert: vi.fn(() => ({
        select: vi.fn(() => ({
          single: vi.fn(),
        })),
      })),
      select: vi.fn(() => ({
        eq: vi.fn(),
      })),
    })),
  })),
}))

describe('POST /api/auth/signup', () => {
  it('should create user with valid data', async () => {
    const request = new Request('http://localhost:3000/api/auth/signup', {
      method: 'POST',
      body: JSON.stringify({
        email: 'test@example.com',
        password: 'Password123!',
        full_name: 'Test User',
        agency_name: 'Test Agency',
      }),
    })

    const response = await POST(request)
    expect(response.status).toBe(200)
  })

  it('should reject weak password', async () => {
    const request = new Request('http://localhost:3000/api/auth/signup', {
      method: 'POST',
      body: JSON.stringify({
        email: 'test@example.com',
        password: 'weak',
        full_name: 'Test User',
        agency_name: 'Test Agency',
      }),
    })

    const response = await POST(request)
    expect(response.status).toBe(400)
  })

  it('should reject invalid email', async () => {
    const request = new Request('http://localhost:3000/api/auth/signup', {
      method: 'POST',
      body: JSON.stringify({
        email: 'invalid-email',
        password: 'Password123!',
        full_name: 'Test User',
        agency_name: 'Test Agency',
      }),
    })

    const response = await POST(request)
    expect(response.status).toBe(400)
  })
})
```

### 3. Login API Route Tests
**File**: `apps/shell/app/api/auth/__tests__/login.test.ts`

```typescript
import { describe, it, expect, vi } from 'vitest'
import { POST } from '../login/route'

vi.mock('@pleeno/database/server', () => ({
  createServerClient: vi.fn(() => ({
    auth: {
      signInWithPassword: vi.fn(({ email, password }) => {
        if (email === 'test@example.com' && password === 'Password123!') {
          return {
            data: {
              user: { id: '123', email },
              session: { access_token: 'token' },
            },
            error: null,
          }
        }
        return {
          data: null,
          error: { message: 'Invalid credentials' },
        }
      }),
    },
  })),
}))

describe('POST /api/auth/login', () => {
  it('should login with valid credentials', async () => {
    const request = new Request('http://localhost:3000/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({
        email: 'test@example.com',
        password: 'Password123!',
      }),
    })

    const response = await POST(request)
    expect(response.status).toBe(200)

    const data = await response.json()
    expect(data.user).toBeDefined()
    expect(data.session).toBeDefined()
  })

  it('should reject invalid credentials', async () => {
    const request = new Request('http://localhost:3000/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({
        email: 'test@example.com',
        password: 'WrongPassword',
      }),
    })

    const response = await POST(request)
    expect(response.status).toBe(401)
  })
})
```

### 4. Permission Utils Tests
**File**: `packages/auth/src/__tests__/permissions.test.ts`

```typescript
import { describe, it, expect } from 'vitest'
import { hasRole, hasAnyRole, isAgencyAdmin, getUserRole } from '../utils/permissions'
import { User } from '@supabase/supabase-js'

const createMockUser = (role: string): User => ({
  id: '123',
  email: 'test@example.com',
  app_metadata: { role, agency_id: 'agency-123' },
  user_metadata: {},
  aud: 'authenticated',
  created_at: new Date().toISOString(),
})

describe('Permission Utils', () => {
  describe('hasRole', () => {
    it('should return true for matching role', () => {
      const user = createMockUser('agency_admin')
      expect(hasRole(user, 'agency_admin')).toBe(true)
    })

    it('should return false for non-matching role', () => {
      const user = createMockUser('agency_user')
      expect(hasRole(user, 'agency_admin')).toBe(false)
    })

    it('should return false for null user', () => {
      expect(hasRole(null, 'agency_admin')).toBe(false)
    })

    it('should grant admin access to everything', () => {
      const admin = createMockUser('agency_admin')
      expect(hasRole(admin, 'agency_admin')).toBe(true)
      expect(hasRole(admin, 'agency_user')).toBe(true)
    })
  })

  describe('hasAnyRole', () => {
    it('should return true if user has any of the roles', () => {
      const user = createMockUser('agency_user')
      expect(hasAnyRole(user, ['agency_admin', 'agency_user'])).toBe(true)
    })

    it('should return false if user has none of the roles', () => {
      const user = createMockUser('agency_user')
      expect(hasAnyRole(user, ['agency_admin'])).toBe(false)
    })
  })

  describe('isAgencyAdmin', () => {
    it('should return true for admin', () => {
      const admin = createMockUser('agency_admin')
      expect(isAgencyAdmin(admin)).toBe(true)
    })

    it('should return false for non-admin', () => {
      const user = createMockUser('agency_user')
      expect(isAgencyAdmin(user)).toBe(false)
    })
  })

  describe('getUserRole', () => {
    it('should return user role', () => {
      const user = createMockUser('agency_admin')
      expect(getUserRole(user)).toBe('agency_admin')
    })

    it('should return null for no user', () => {
      expect(getUserRole(null)).toBe(null)
    })
  })
})
```

### 5. Middleware Tests
**File**: `apps/shell/__tests__/middleware.test.ts`

```typescript
import { describe, it, expect, vi } from 'vitest'
import { middleware } from '../middleware'
import { NextRequest } from 'next/server'

vi.mock('@supabase/ssr', () => ({
  createServerClient: vi.fn(() => ({
    auth: {
      getUser: vi.fn(() => ({
        data: { user: null },
      })),
    },
  })),
}))

describe('Middleware', () => {
  it('should redirect unauthenticated users to login', async () => {
    const request = new NextRequest('http://localhost:3000/dashboard')
    const response = await middleware(request)

    expect(response.status).toBe(307) // Redirect
    expect(response.headers.get('location')).toContain('/login')
  })

  it('should allow public routes', async () => {
    const request = new NextRequest('http://localhost:3000/login')
    const response = await middleware(request)

    expect(response.status).toBe(200)
  })
})
```

### 6. UI Component Tests
**File**: `packages/ui/src/components/auth/__tests__/login-form.test.tsx`

```typescript
import { describe, it, expect, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { LoginForm } from '../login-form'

describe('LoginForm', () => {
  it('should render login form', () => {
    render(<LoginForm onSubmit={vi.fn()} />)

    expect(screen.getByLabelText(/email/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument()
  })

  it('should validate email format', async () => {
    const user = userEvent.setup()
    render(<LoginForm onSubmit={vi.fn()} />)

    const emailInput = screen.getByLabelText(/email/i)
    await user.type(emailInput, 'invalid-email')
    await user.click(screen.getByRole('button', { name: /sign in/i }))

    await waitFor(() => {
      expect(screen.getByText(/invalid email/i)).toBeInTheDocument()
    })
  })

  it('should call onSubmit with form data', async () => {
    const user = userEvent.setup()
    const onSubmit = vi.fn().mockResolvedValue(undefined)

    render(<LoginForm onSubmit={onSubmit} />)

    await user.type(screen.getByLabelText(/email/i), 'test@example.com')
    await user.type(screen.getByLabelText(/password/i), 'Password123!')
    await user.click(screen.getByRole('button', { name: /sign in/i }))

    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledWith({
        email: 'test@example.com',
        password: 'Password123!',
      })
    })
  })

  it('should show loading state', async () => {
    const user = userEvent.setup()
    const onSubmit = vi.fn(() => new Promise(() => {})) // Never resolves

    render(<LoginForm onSubmit={onSubmit} />)

    await user.type(screen.getByLabelText(/email/i), 'test@example.com')
    await user.type(screen.getByLabelText(/password/i), 'Password123!')
    await user.click(screen.getByRole('button', { name: /sign in/i }))

    await waitFor(() => {
      expect(screen.getByText(/signing in/i)).toBeInTheDocument()
    })
  })
})
```

### 7. E2E Tests (Playwright)
**File**: `apps/shell/__tests__/e2e/auth.spec.ts`

```typescript
import { test, expect } from '@playwright/test'

test.describe('Authentication Flow', () => {
  test('should complete full signup flow', async ({ page }) => {
    await page.goto('http://localhost:3000/signup')

    await page.fill('[name="full_name"]', 'Test User')
    await page.fill('[name="agency_name"]', 'Test Agency')
    await page.fill('[name="email"]', 'test@example.com')
    await page.fill('[name="password"]', 'Password123!')
    await page.fill('[name="confirmPassword"]', 'Password123!')

    await page.click('button[type="submit"]')

    await expect(page).toHaveURL(/\/dashboard/)
  })

  test('should complete login flow', async ({ page }) => {
    await page.goto('http://localhost:3000/login')

    await page.fill('[name="email"]', 'test@example.com')
    await page.fill('[name="password"]', 'Password123!')

    await page.click('button[type="submit"]')

    await expect(page).toHaveURL(/\/dashboard/)
  })

  test('should redirect unauthenticated users', async ({ page }) => {
    await page.goto('http://localhost:3000/dashboard')

    await expect(page).toHaveURL(/\/login/)
  })

  test('should handle logout', async ({ page, context }) => {
    // Login first
    await page.goto('http://localhost:3000/login')
    await page.fill('[name="email"]', 'test@example.com')
    await page.fill('[name="password"]', 'Password123!')
    await page.click('button[type="submit"]')

    await expect(page).toHaveURL(/\/dashboard/)

    // Logout
    await page.click('button:has-text("Sign Out")')

    await expect(page).toHaveURL(/\/login/)
  })
})
```

### 8. Test Script in package.json
**File**: `package.json` (add scripts)

```json
{
  "scripts": {
    "test": "vitest",
    "test:ui": "vitest --ui",
    "test:e2e": "playwright test",
    "test:coverage": "vitest --coverage"
  }
}
```

## Architecture Context
- Unit tests for utilities and components
- Integration tests for API routes
- E2E tests for complete user flows
- Mock Supabase client in tests
- Use Vitest for unit/integration, Playwright for E2E

## Test Coverage Goals
- Auth API routes: 90%+
- Permission utilities: 100%
- UI components: 80%+
- Middleware: 90%+
- Critical paths: 100% (signup, login, logout)

## Prerequisites
- All previous tasks completed
- Test dependencies installed
- Playwright configured for E2E tests

## Validation
- [ ] All unit tests pass
- [ ] All integration tests pass
- [ ] All E2E tests pass
- [ ] Test coverage meets goals
- [ ] No flaky tests
- [ ] Tests run in CI/CD pipeline

## Running Tests
```bash
# Run all unit tests
pnpm test

# Run with UI
pnpm test:ui

# Run E2E tests
pnpm test:e2e

# Generate coverage report
pnpm test:coverage
```

## Next Steps
After completing this task, Story 1.3 is complete! 🎉
- All acceptance criteria validated
- Authentication system fully implemented
- Tests ensure reliability and prevent regressions
- Ready to integrate with other stories
