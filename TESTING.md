# Testing Guide

This document provides comprehensive information about the test suite for the Pleeno authentication system.

## Test Coverage

The authentication test suite includes:

1. **Permission Utilities Tests** (`packages/auth/src/__tests__/permissions.test.ts`)
   - Role-based access control (RBAC) functions
   - User role validation
   - Admin permission checks
   - Coverage: ~100%

2. **Auth API Route Tests** (`apps/shell/app/api/auth/__tests__/`)
   - Login endpoint (`login.test.ts`)
   - Signup endpoint (`signup.test.ts`)
   - Logout endpoint (`logout.test.ts`)
   - Coverage: ~90%

3. **Middleware Tests** (`apps/shell/__tests__/middleware.test.ts`)
   - Protected route authentication
   - Redirect logic
   - Session validation
   - Coverage: ~90%

4. **UI Component Tests** (`packages/ui/src/components/auth/__tests__/`)
   - LoginForm component (`login-form.test.tsx`)
   - SignupForm component (`signup-form.test.tsx`)
   - Form validation
   - User interactions
   - Coverage: ~85%

5. **E2E Tests** (`apps/shell/__tests__/e2e/auth.spec.ts`)
   - Complete authentication flows
   - Multi-page user journeys
   - Browser-based testing with Playwright

## Prerequisites

- Node.js 18+
- pnpm
- All dependencies installed (`pnpm install`)

## Running Tests

### All Unit/Integration Tests

```bash
# Run all unit and integration tests
pnpm test

# Run tests in watch mode
pnpm test:watch

# Run tests with UI
pnpm test:ui

# Generate coverage report
pnpm test:coverage
```

### Package-Specific Tests

```bash
# Auth package tests
cd packages/auth && pnpm test

# UI package tests
cd packages/ui && pnpm test

# Shell app tests
cd apps/shell && pnpm test
```

### E2E Tests

**Note**: E2E tests require Playwright browsers to be installed.

```bash
# Run E2E tests
pnpm test:e2e

# Run E2E tests with UI
pnpm test:e2e:ui

# Run E2E tests in debug mode
pnpm test:e2e:debug
```

## Test Structure

### Unit Tests

Unit tests are located alongside their source files in `__tests__` directories:

```
packages/auth/src/
├── utils/
│   └── permissions.ts
└── __tests__/
    └── permissions.test.ts
```

### Integration Tests

API route tests are located in the `__tests__` directory within the API route folder:

```
apps/shell/app/api/auth/
├── login/
│   └── route.ts
├── signup/
│   └── route.ts
├── logout/
│   └── route.ts
└── __tests__/
    ├── login.test.ts
    ├── signup.test.ts
    └── logout.test.ts
```

### E2E Tests

E2E tests are located in the `__tests__/e2e` directory:

```
apps/shell/__tests__/e2e/
└── auth.spec.ts
```

## Test Configuration

### Vitest Configuration

- **Root config**: `/vitest.config.ts` - Main vitest configuration
- **Package configs**: Individual packages have their own `vitest.config.ts` files
- **Setup files**:
  - `/vitest.setup.node.ts` - Setup for node environment tests
  - `/vitest.setup.jsdom.ts` - Setup for browser environment tests

### Playwright Configuration

- **Config file**: `/playwright.config.ts`
- **Test directory**: `apps/shell/__tests__/e2e`
- **Browsers**: Chromium, Firefox, WebKit, Mobile Chrome, Mobile Safari

## Mocking Strategy

### Supabase Client Mocking

Auth API route tests mock the Supabase client:

```typescript
vi.mock('@pleeno/database/server', () => ({
  createServerClient: vi.fn(() => ({
    auth: {
      signInWithPassword: mockSignInWithPassword,
    },
  })),
}))
```

### Next.js Mocking

Permission tests mock Next.js modules:

- `next/server` - Mocked in `packages/auth/__mocks__/next-server.ts`
- `@pleeno/database/server` - Mocked in `packages/auth/__mocks__/database-server.ts`

## Test Scenarios Covered

### Authentication Flow
- ✅ User can register with valid credentials
- ✅ User cannot register with weak password
- ✅ User can login with valid credentials
- ✅ User cannot login with invalid credentials
- ✅ User can logout successfully
- ✅ Session is cleared on logout

### Authorization
- ✅ Agency admin has full access
- ✅ Agency user has limited access
- ✅ Unauthenticated users are redirected to login
- ✅ Authenticated users cannot access auth pages

### Form Validation
- ✅ Email format validation
- ✅ Password strength validation
- ✅ Required field validation
- ✅ Password confirmation matching
- ✅ Error message display
- ✅ Loading state handling

### Middleware
- ✅ Protected routes require authentication
- ✅ Public routes are accessible
- ✅ Redirect URL is preserved
- ✅ Auth pages redirect authenticated users

## Continuous Integration

Tests are configured to run in CI/CD pipeline. The following commands are recommended for CI:

```bash
# Run all tests with coverage
pnpm test:coverage

# Run E2E tests in CI mode
CI=true pnpm test:e2e
```

## Troubleshooting

### React Version Mismatch

If you encounter React version mismatch errors, ensure all React packages are using the same version:

```bash
pnpm list react react-dom
```

### Playwright Browser Installation

If E2E tests fail due to missing browsers:

```bash
pnpm exec playwright install
```

### Test Timeouts

If tests are timing out, increase the timeout in `vitest.config.ts`:

```typescript
test: {
  testTimeout: 30000, // 30 seconds
  hookTimeout: 30000,
}
```

## Best Practices

1. **Keep tests isolated**: Each test should be independent and not rely on others
2. **Mock external dependencies**: Mock Supabase, Next.js, and other external services
3. **Test user behavior**: Focus on testing what users do, not implementation details
4. **Use descriptive test names**: Test names should clearly describe what is being tested
5. **Maintain test coverage**: Aim for >80% coverage on critical paths
6. **Update tests with code changes**: Keep tests in sync with code changes

## Adding New Tests

### Unit Test Example

```typescript
import { describe, it, expect } from 'vitest'
import { myFunction } from '../myFunction'

describe('myFunction', () => {
  it('should return expected result', () => {
    const result = myFunction('input')
    expect(result).toBe('expected')
  })
})
```

### Component Test Example

```typescript
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MyComponent } from '../MyComponent'

describe('MyComponent', () => {
  it('should render correctly', () => {
    render(<MyComponent />)
    expect(screen.getByRole('button')).toBeInTheDocument()
  })
})
```

### E2E Test Example

```typescript
import { test, expect } from '@playwright/test'

test('should complete user flow', async ({ page }) => {
  await page.goto('/login')
  await page.fill('[name="email"]', 'test@example.com')
  await page.fill('[name="password"]', 'Password123!')
  await page.click('button[type="submit"]')
  await expect(page).toHaveURL(/\/dashboard/)
})
```

## Resources

- [Vitest Documentation](https://vitest.dev/)
- [Testing Library Documentation](https://testing-library.com/)
- [Playwright Documentation](https://playwright.dev/)
- [React Testing Best Practices](https://kentcdodds.com/blog/common-mistakes-with-react-testing-library)
