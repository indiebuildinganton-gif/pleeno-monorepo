# Task 7: Write Error Handling Test Suite

## Story Context
**Story 1.4**: Error Handling & Logging Infrastructure
**As a** developer, **I want** standardized error handling and logging throughout the application, **so that** I can diagnose issues quickly and provide helpful error messages to users.

## Task Objective
Create comprehensive test coverage for the error handling infrastructure, including unit tests for error classes, API handler tests, logger tests, and Error Boundary component tests.

## Acceptance Criteria Addressed
- AC 1: All API errors return consistent JSON structure with appropriate HTTP status codes
- AC 2: Errors are logged with sufficient context (user_id, agency_id, timestamp, stack trace)
- AC 3: Sensitive data is never exposed in error messages
- AC 4: Client-side error boundaries catch React errors gracefully

## Subtasks
- [ ] Test: Custom error classes throw correct status codes
- [ ] Test: API errors return consistent JSON format
- [ ] Test: Sensitive data is filtered from error responses
- [ ] Test: Error context includes user_id, agency_id, timestamp
- [ ] Test: ErrorBoundary catches and displays errors
- [ ] Test: Monitoring service receives error reports
- [ ] Test: Server logs include structured context
- [ ] Test: 404 errors handled gracefully

## Prerequisites
- Tasks 1-6 completed (all error handling infrastructure implemented)
- Vitest installed for unit tests
- React Testing Library installed for component tests

## Implementation Guide

### 1. Install Test Dependencies
```bash
# From project root
pnpm add -D vitest @testing-library/react @testing-library/jest-dom @testing-library/user-event
```

### 2. Create Error Class Tests
Create `packages/utils/src/__tests__/errors.test.ts`:

```typescript
import { describe, it, expect } from 'vitest'
import {
  AppError,
  ValidationError,
  NotFoundError,
  UnauthorizedError,
  ForbiddenError,
  sanitizeError,
  createSafeErrorMessage,
} from '../errors'

describe('Error Classes', () => {
  describe('AppError', () => {
    it('creates error with code and message', () => {
      const error = new AppError('SERVER_ERROR', 'Something went wrong')
      expect(error.code).toBe('SERVER_ERROR')
      expect(error.message).toBe('Something went wrong')
      expect(error.name).toBe('AppError')
    })

    it('includes optional details', () => {
      const error = new AppError('VALIDATION_ERROR', 'Invalid input', {
        field: 'email',
      })
      expect(error.details).toEqual({ field: 'email' })
    })
  })

  describe('ValidationError', () => {
    it('creates validation error with correct code', () => {
      const error = new ValidationError('Invalid email')
      expect(error.code).toBe('VALIDATION_ERROR')
      expect(error.message).toBe('Invalid email')
      expect(error.name).toBe('ValidationError')
    })
  })

  describe('NotFoundError', () => {
    it('creates not found error with correct code', () => {
      const error = new NotFoundError('Resource not found')
      expect(error.code).toBe('NOT_FOUND')
      expect(error.message).toBe('Resource not found')
      expect(error.name).toBe('NotFoundError')
    })
  })

  describe('UnauthorizedError', () => {
    it('creates unauthorized error with correct code', () => {
      const error = new UnauthorizedError()
      expect(error.code).toBe('UNAUTHORIZED')
      expect(error.message).toBe('Authentication required')
      expect(error.name).toBe('UnauthorizedError')
    })

    it('accepts custom message', () => {
      const error = new UnauthorizedError('Invalid token')
      expect(error.message).toBe('Invalid token')
    })
  })

  describe('ForbiddenError', () => {
    it('creates forbidden error with correct code', () => {
      const error = new ForbiddenError()
      expect(error.code).toBe('FORBIDDEN')
      expect(error.message).toBe('Access denied')
      expect(error.name).toBe('ForbiddenError')
    })
  })
})

describe('Error Sanitization', () => {
  it('redacts sensitive field names', () => {
    const data = {
      username: 'john',
      password: 'secret123',
      token: 'abc123',
      apiKey: 'key123',
    }

    const sanitized = sanitizeError(data)

    expect(sanitized.username).toBe('john')
    expect(sanitized.password).toBe('[REDACTED]')
    expect(sanitized.token).toBe('[REDACTED]')
    expect(sanitized.apiKey).toBe('[REDACTED]')
  })

  it('handles nested objects', () => {
    const data = {
      user: {
        name: 'John',
        password: 'secret',
      },
    }

    const sanitized = sanitizeError(data)

    expect(sanitized.user.name).toBe('John')
    expect(sanitized.user.password).toBe('[REDACTED]')
  })

  it('handles arrays', () => {
    const data = [
      { name: 'John', password: 'secret1' },
      { name: 'Jane', password: 'secret2' },
    ]

    const sanitized = sanitizeError(data)

    expect(sanitized[0].name).toBe('John')
    expect(sanitized[0].password).toBe('[REDACTED]')
    expect(sanitized[1].name).toBe('Jane')
    expect(sanitized[1].password).toBe('[REDACTED]')
  })
})

describe('createSafeErrorMessage', () => {
  it('returns AppError message', () => {
    const error = new ValidationError('Invalid input')
    const message = createSafeErrorMessage(error)
    expect(message).toBe('Invalid input')
  })

  it('returns generic message for unknown errors', () => {
    const error = new Error('Unexpected error')
    const message = createSafeErrorMessage(error)
    expect(message).toBe('An unexpected error occurred')
  })
})
```

### 3. Create API Error Handler Tests
Create `packages/utils/src/__tests__/api-error-handler.test.ts`:

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextResponse } from 'next/server'
import {
  handleApiError,
  createSuccessResponse,
} from '../api-error-handler'
import {
  ValidationError,
  NotFoundError,
  UnauthorizedError,
  ForbiddenError,
  AppError,
} from '../errors'

describe('API Error Handler', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('handleApiError', () => {
    it('returns 400 for ValidationError', async () => {
      const error = new ValidationError('Invalid input', { field: 'email' })
      const response = await handleApiError(error)

      expect(response.status).toBe(400)
      const body = await response.json()
      expect(body.success).toBe(false)
      expect(body.error.code).toBe('VALIDATION_ERROR')
      expect(body.error.message).toBe('Invalid input')
      expect(body.error.details).toEqual({ field: 'email' })
    })

    it('returns 404 for NotFoundError', async () => {
      const error = new NotFoundError('Resource not found')
      const response = await handleApiError(error)

      expect(response.status).toBe(404)
      const body = await response.json()
      expect(body.success).toBe(false)
      expect(body.error.code).toBe('NOT_FOUND')
    })

    it('returns 401 for UnauthorizedError', async () => {
      const error = new UnauthorizedError()
      const response = await handleApiError(error)

      expect(response.status).toBe(401)
      const body = await response.json()
      expect(body.success).toBe(false)
      expect(body.error.code).toBe('UNAUTHORIZED')
    })

    it('returns 403 for ForbiddenError', async () => {
      const error = new ForbiddenError()
      const response = await handleApiError(error)

      expect(response.status).toBe(403)
      const body = await response.json()
      expect(body.success).toBe(false)
      expect(body.error.code).toBe('FORBIDDEN')
    })

    it('returns 500 for unknown errors', async () => {
      const error = new Error('Unexpected error')
      const response = await handleApiError(error)

      expect(response.status).toBe(500)
      const body = await response.json()
      expect(body.success).toBe(false)
      expect(body.error.code).toBe('SERVER_ERROR')
      expect(body.error.message).toBe('An unexpected error occurred')
    })

    it('sanitizes sensitive data in error details', async () => {
      const error = new ValidationError('Invalid input', {
        email: 'test@example.com',
        password: 'secret123',
      })
      const response = await handleApiError(error)

      const body = await response.json()
      expect(body.error.details.email).toBe('test@example.com')
      expect(body.error.details.password).toBe('[REDACTED]')
    })

    it('includes context in logs', async () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation()
      const error = new ValidationError('Invalid input')

      await handleApiError(error, {
        user_id: 'user123',
        agency_id: 'agency456',
        path: '/api/test',
      })

      expect(consoleSpy).toHaveBeenCalled()
      consoleSpy.mockRestore()
    })
  })

  describe('createSuccessResponse', () => {
    it('returns success response with data', () => {
      const data = { id: 1, name: 'Test' }
      const response = createSuccessResponse(data)

      expect(response.status).toBe(200)
    })

    it('accepts custom status code', () => {
      const data = { id: 1 }
      const response = createSuccessResponse(data, 201)

      expect(response.status).toBe(201)
    })
  })
})
```

### 4. Create Logger Tests
Create `packages/utils/src/__tests__/logger.test.ts`:

```typescript
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import {
  log,
  logInfo,
  logWarn,
  logError,
  logDebug,
  createLogger,
} from '../logger'

describe('Logger', () => {
  let consoleInfoSpy: any
  let consoleWarnSpy: any
  let consoleErrorSpy: any
  let consoleDebugSpy: any

  beforeEach(() => {
    consoleInfoSpy = vi.spyOn(console, 'info').mockImplementation()
    consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation()
    consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation()
    consoleDebugSpy = vi.spyOn(console, 'debug').mockImplementation()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('log', () => {
    it('logs with correct level', () => {
      log('info', 'Test message')
      expect(consoleInfoSpy).toHaveBeenCalled()

      log('warn', 'Test warning')
      expect(consoleWarnSpy).toHaveBeenCalled()

      log('error', 'Test error')
      expect(consoleErrorSpy).toHaveBeenCalled()
    })

    it('includes context in log entry', () => {
      log('info', 'Test message', {
        user_id: 'user123',
        agency_id: 'agency456',
      })

      const loggedData = JSON.parse(consoleInfoSpy.mock.calls[0][0])
      expect(loggedData.context.user_id).toBe('user123')
      expect(loggedData.context.agency_id).toBe('agency456')
    })

    it('includes error details', () => {
      const error = new Error('Test error')
      log('error', 'Error occurred', undefined, error)

      const loggedData = JSON.parse(consoleErrorSpy.mock.calls[0][0])
      expect(loggedData.error.name).toBe('Error')
      expect(loggedData.error.message).toBe('Test error')
      expect(loggedData.error.stack).toBeDefined()
    })

    it('includes timestamp', () => {
      log('info', 'Test message')

      const loggedData = JSON.parse(consoleInfoSpy.mock.calls[0][0])
      expect(loggedData.timestamp).toBeDefined()
      expect(new Date(loggedData.timestamp).getTime()).toBeGreaterThan(0)
    })
  })

  describe('Helper Functions', () => {
    it('logInfo calls log with info level', () => {
      logInfo('Info message')
      expect(consoleInfoSpy).toHaveBeenCalled()
    })

    it('logWarn calls log with warn level', () => {
      logWarn('Warning message')
      expect(consoleWarnSpy).toHaveBeenCalled()
    })

    it('logError calls log with error level', () => {
      const error = new Error('Test error')
      logError('Error message', undefined, error)
      expect(consoleErrorSpy).toHaveBeenCalled()
    })

    it('logDebug only logs in development', () => {
      const originalEnv = process.env.NODE_ENV

      process.env.NODE_ENV = 'development'
      logDebug('Debug message')
      expect(consoleDebugSpy).toHaveBeenCalled()

      consoleDebugSpy.mockClear()

      process.env.NODE_ENV = 'production'
      logDebug('Debug message')
      expect(consoleDebugSpy).not.toHaveBeenCalled()

      process.env.NODE_ENV = originalEnv
    })
  })

  describe('createLogger', () => {
    it('creates logger with base context', () => {
      const logger = createLogger({
        user_id: 'user123',
        request_id: 'req123',
      })

      logger.info('Test message')

      const loggedData = JSON.parse(consoleInfoSpy.mock.calls[0][0])
      expect(loggedData.context.user_id).toBe('user123')
      expect(loggedData.context.request_id).toBe('req123')
    })

    it('merges additional context', () => {
      const logger = createLogger({ user_id: 'user123' })

      logger.info('Test message', { action: 'test_action' })

      const loggedData = JSON.parse(consoleInfoSpy.mock.calls[0][0])
      expect(loggedData.context.user_id).toBe('user123')
      expect(loggedData.context.action).toBe('test_action')
    })
  })
})
```

### 5. Create Error Boundary Tests
Create `packages/ui/src/components/__tests__/ErrorBoundary.test.tsx`:

```typescript
import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { userEvent } from '@testing-library/user-event'
import { ErrorBoundary } from '../ErrorBoundary'

const ThrowError = ({ shouldThrow = true }: { shouldThrow?: boolean }) => {
  if (shouldThrow) {
    throw new Error('Test error')
  }
  return <div>No error</div>
}

describe('ErrorBoundary', () => {
  it('renders children when no error occurs', () => {
    render(
      <ErrorBoundary>
        <div>Test content</div>
      </ErrorBoundary>
    )

    expect(screen.getByText('Test content')).toBeInTheDocument()
  })

  it('renders fallback UI when error occurs', () => {
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation()

    render(
      <ErrorBoundary>
        <ThrowError />
      </ErrorBoundary>
    )

    expect(screen.getByText('Something went wrong')).toBeInTheDocument()
    expect(screen.getByText('Try again')).toBeInTheDocument()

    consoleErrorSpy.mockRestore()
  })

  it('renders custom fallback if provided', () => {
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation()

    render(
      <ErrorBoundary fallback={<div>Custom error message</div>}>
        <ThrowError />
      </ErrorBoundary>
    )

    expect(screen.getByText('Custom error message')).toBeInTheDocument()

    consoleErrorSpy.mockRestore()
  })

  it('calls onError callback when error occurs', () => {
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation()
    const onErrorMock = vi.fn()

    render(
      <ErrorBoundary onError={onErrorMock}>
        <ThrowError />
      </ErrorBoundary>
    )

    expect(onErrorMock).toHaveBeenCalled()
    expect(onErrorMock.mock.calls[0][0].message).toBe('Test error')

    consoleErrorSpy.mockRestore()
  })

  it('resets error state when Try again button clicked', async () => {
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation()
    const user = userEvent.setup()

    const { rerender } = render(
      <ErrorBoundary>
        <ThrowError />
      </ErrorBoundary>
    )

    expect(screen.getByText('Something went wrong')).toBeInTheDocument()

    const tryAgainButton = screen.getByText('Try again')
    await user.click(tryAgainButton)

    // After reset, render without error
    rerender(
      <ErrorBoundary>
        <ThrowError shouldThrow={false} />
      </ErrorBoundary>
    )

    expect(screen.getByText('No error')).toBeInTheDocument()

    consoleErrorSpy.mockRestore()
  })
})
```

### 6. Create Integration Tests
Create `__tests__/integration/error-handling.spec.ts`:

```typescript
import { test, expect } from '@playwright/test'

test.describe('Error Handling Integration', () => {
  test('health check returns 200', async ({ request }) => {
    const response = await request.get('/api/health')
    expect(response.status()).toBe(200)

    const body = await response.json()
    expect(body.success).toBe(true)
    expect(body.data.status).toBe('healthy')
  })

  test('validation error returns 400', async ({ request }) => {
    const response = await request.post('/api/examples/validation', {
      data: {
        email: 'invalid-email',
        age: 10,
        terms: false,
      },
    })

    expect(response.status()).toBe(400)

    const body = await response.json()
    expect(body.success).toBe(false)
    expect(body.error.code).toBe('VALIDATION_ERROR')
    expect(body.error.details).toBeDefined()
  })

  test('protected route returns 401 when not authenticated', async ({ request }) => {
    const response = await request.get('/api/protected')
    expect(response.status()).toBe(401)

    const body = await response.json()
    expect(body.success).toBe(false)
    expect(body.error.code).toBe('UNAUTHORIZED')
  })

  test('404 for non-existent route', async ({ request }) => {
    const response = await request.get('/api/does-not-exist')
    expect(response.status()).toBe(404)
  })

  test('React error boundary catches errors', async ({ page }) => {
    await page.goto('/test-error-boundary')

    await page.click('button[data-testid="throw-error"]')

    await expect(page.locator('text=Something went wrong')).toBeVisible()
    await expect(page.locator('text=Try again')).toBeVisible()
  })
})
```

### 7. Configure Vitest
Create `vitest.config.ts` in project root:

```typescript
import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    setupFiles: ['./vitest.setup.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
    },
  },
})
```

Create `vitest.setup.ts`:

```typescript
import '@testing-library/jest-dom'
```

## Architecture Context
- Comprehensive test coverage for error handling infrastructure
- Unit tests for error classes and utilities
- Integration tests for API routes
- Component tests for Error Boundaries
- E2E tests for user-facing error scenarios

## References
- [Vitest Documentation](https://vitest.dev/)
- [React Testing Library](https://testing-library.com/react)
- [Story File](../../1-4-error-handling-logging-infrastructure.md)
- Context XML: `.bmad-ephemeral/stories/1-4-error-handling-logging-infrastructure.context.xml`

## Validation
- [ ] All error class tests pass
- [ ] API error handler tests pass
- [ ] Logger tests pass
- [ ] Error Boundary tests pass
- [ ] Integration tests pass
- [ ] Test coverage > 80%
- [ ] All status codes tested (400, 401, 403, 404, 500)
- [ ] Sensitive data filtering tested
- [ ] Context enrichment tested
- [ ] Error boundary recovery tested

## Running Tests
```bash
# Run all tests
pnpm test

# Run tests in watch mode
pnpm test:watch

# Run tests with coverage
pnpm test:coverage

# Run specific test file
pnpm test packages/utils/src/__tests__/errors.test.ts
```

## Next Steps
After completing this task, all Story 1.4 tasks are complete! Update the story status to "done" and proceed to the next story.
