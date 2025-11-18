# Story 1.4: Error Handling & Logging Infrastructure

Status: done

## Story

As a **developer**,
I want **standardized error handling and logging throughout the application**,
so that **I can diagnose issues quickly and provide helpful error messages to users**.

## Acceptance Criteria

1. **Given** the authentication framework is in place, **When** I implement error handling and logging, **Then** all API errors return consistent JSON structure with appropriate HTTP status codes

2. **And** errors are logged with sufficient context (user_id, agency_id, timestamp, stack trace)

3. **And** sensitive data is never exposed in error messages

4. **And** client-side error boundaries catch React errors gracefully

5. **And** logging integrates with monitoring service (e.g., Sentry, LogRocket)

## Tasks / Subtasks

- [ ] Create custom error classes and error utilities (AC: 1, 3)
  - [ ] Create packages/utils/src/errors.ts with custom error classes
  - [ ] Implement AppError base class with code, message, details
  - [ ] Implement ValidationError, NotFoundError, UnauthorizedError, ForbiddenError classes
  - [ ] Create ApiResponse type definitions (SuccessResponse, ErrorResponse, PaginatedResponse)
  - [ ] Add error sanitization function to strip sensitive data

- [ ] Implement API route error handler middleware (AC: 1, 2, 3)
  - [ ] Create packages/utils/src/api-error-handler.ts
  - [ ] Implement handleApiError() function with status code mapping
  - [ ] Add error logging with context (user_id, agency_id, timestamp)
  - [ ] Create error response formatter
  - [ ] Add stack trace logging for unexpected errors
  - [ ] Implement sensitive data filtering (passwords, tokens, etc.)

- [ ] Create server-side logging utility (AC: 2)
  - [ ] Create packages/utils/src/logger.ts with structured logging
  - [ ] Implement log levels (info, warn, error, debug)
  - [ ] Add context enrichment (user_id, agency_id, request_id)
  - [ ] Format logs as JSON for production
  - [ ] Add human-readable formatting for development
  - [ ] Create helper functions: logInfo(), logWarn(), logError(), logDebug()

- [ ] Implement React Error Boundaries (AC: 4)
  - [ ] Create packages/ui/src/components/ErrorBoundary.tsx
  - [ ] Implement error state and fallback UI
  - [ ] Add error logging to boundary component
  - [ ] Create user-friendly error messages
  - [ ] Add "Report Error" and "Retry" buttons
  - [ ] Wrap zone layouts with ErrorBoundary

- [ ] Integrate error monitoring service (AC: 5)
  - [ ] Choose monitoring service: Sentry or LogRocket
  - [ ] Install and configure SDK in root layout
  - [ ] Set up error tracking initialization
  - [ ] Configure source maps for production builds
  - [ ] Add user context to error reports (agency_id, user_id)
  - [ ] Set up error alerting for critical issues
  - [ ] Test error reporting end-to-end

- [ ] Apply error handling to existing API routes (AC: 1)
  - [ ] Wrap API route handlers with try-catch
  - [ ] Use handleApiError() in catch blocks
  - [ ] Return standardized error responses
  - [ ] Add input validation with Zod and return ValidationError
  - [ ] Test error responses for each status code (400, 401, 403, 404, 500)

- [ ] Write error handling test suite (AC: 1, 2, 3, 4)
  - [ ] Test: Custom error classes throw correct status codes
  - [ ] Test: API errors return consistent JSON format
  - [ ] Test: Sensitive data is filtered from error responses
  - [ ] Test: Error context includes user_id, agency_id, timestamp
  - [ ] Test: ErrorBoundary catches and displays errors
  - [ ] Test: Monitoring service receives error reports
  - [ ] Test: Server logs include structured context
  - [ ] Test: 404 errors handled gracefully

## Dev Notes

### Error Handling Architecture

**Custom Error Classes:**
- Base `AppError` class with code, message, and details
- Specific error types: `ValidationError`, `NotFoundError`, `UnauthorizedError`, `ForbiddenError`
- Server-side errors never expose stack traces or sensitive data to clients
- Client-side error boundaries provide fallback UI with recovery options

**API Error Response Format:**
```typescript
// Success Response
{
  success: true,
  data: T
}

// Error Response
{
  success: false,
  error: {
    code: 'VALIDATION_ERROR' | 'NOT_FOUND' | 'UNAUTHORIZED' | 'FORBIDDEN' | 'SERVER_ERROR',
    message: string,
    details?: any  // Only non-sensitive validation details
  }
}
```

**Logging Strategy:**
- Structured JSON logs in production (machine-parseable)
- Human-readable logs in development (easier debugging)
- All logs include: timestamp, level, message, context (user_id, agency_id, request_id)
- Error logs include full stack traces server-side only
- Sensitive data (passwords, tokens, keys) always filtered

**Error Monitoring:**
- Sentry or LogRocket for real-time error tracking
- Source maps uploaded for readable stack traces
- User context attached to all error reports
- Alert notifications for high-severity errors
- Performance monitoring integrated

### Project Structure Notes

**Error Utilities Location:**
```
packages/utils/
├── src/
│   ├── errors.ts              # Custom error classes
│   ├── api-error-handler.ts   # API route error middleware
│   └── logger.ts              # Structured logging utility
```

**Error Boundary Location:**
```
packages/ui/
└── src/
    └── components/
        └── ErrorBoundary.tsx  # React error boundary component
```

**Integration Points:**
- All API routes use handleApiError() in catch blocks
- All zone layouts wrapped with ErrorBoundary
- Logger used throughout server-side code
- Monitoring SDK initialized in root layout

### Architecture Alignment

**From Architecture Document (architecture.md):**

**Error Handling Pattern (Section: Error Handling):**
- Custom error classes extend base AppError
- Status code mapping: ValidationError → 400, NotFoundError → 404, etc.
- API routes return consistent JSON format
- Sensitive data filtering in production

**Custom Error Classes:**
```typescript
// packages/utils/src/errors.ts
export class AppError extends Error {
  constructor(
    public code: 'VALIDATION_ERROR' | 'NOT_FOUND' | 'UNAUTHORIZED' | 'FORBIDDEN' | 'SERVER_ERROR',
    message: string,
    public details?: any
  ) {
    super(message)
    this.name = 'AppError'
  }
}

export class ValidationError extends AppError {
  constructor(message: string, details?: any) {
    super('VALIDATION_ERROR', message, details)
  }
}

export class NotFoundError extends AppError {
  constructor(message: string) {
    super('NOT_FOUND', message)
  }
}
```

**API Error Handler (from architecture.md):**
```typescript
// packages/utils/src/api-error-handler.ts
export async function handleApiError(error: unknown): Promise<NextResponse> {
  if (error instanceof AppError) {
    const statusCode = {
      VALIDATION_ERROR: 400,
      NOT_FOUND: 404,
      UNAUTHORIZED: 401,
      FORBIDDEN: 403,
      SERVER_ERROR: 500
    }[error.code]

    return NextResponse.json({
      success: false,
      error: {
        code: error.code,
        message: error.message,
        details: error.details
      }
    }, { status: statusCode })
  }

  // Unexpected errors - log but don't expose details
  console.error('Unexpected error:', error)
  return NextResponse.json({
    success: false,
    error: {
      code: 'SERVER_ERROR',
      message: 'An unexpected error occurred'
    }
  }, { status: 500 })
}
```

**Logging Pattern (from architecture.md):**
```typescript
// packages/utils/src/logger.ts
type LogLevel = 'info' | 'warn' | 'error' | 'debug'

interface LogContext {
  user_id?: string
  agency_id?: string
  request_id?: string
  action?: string
  [key: string]: any
}

export function log(
  level: LogLevel,
  message: string,
  context?: LogContext,
  error?: Error
) {
  const logEntry = {
    level,
    timestamp: new Date().toISOString(),
    message,
    context,
    ...(error && {
      error: {
        name: error.name,
        message: error.message,
        stack: error.stack
      }
    })
  }

  if (process.env.NODE_ENV === 'development') {
    console[level](JSON.stringify(logEntry, null, 2))
  } else {
    console[level](JSON.stringify(logEntry))
  }
}
```

**React Error Boundary:**
```typescript
// packages/ui/src/components/ErrorBoundary.tsx
'use client'

import { Component, ReactNode } from 'react'
import { log } from '@pleeno/utils'

interface Props {
  children: ReactNode
  fallback?: ReactNode
}

interface State {
  hasError: boolean
  error?: Error
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: any) {
    log('error', 'React Error Boundary caught error', {
      action: 'react_error_boundary',
      componentStack: errorInfo.componentStack
    }, error)

    // Send to monitoring service
    if (typeof window !== 'undefined' && window.Sentry) {
      window.Sentry.captureException(error, {
        contexts: { react: { componentStack: errorInfo.componentStack } }
      })
    }
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback || (
        <div className="flex min-h-screen items-center justify-center">
          <div className="text-center">
            <h2 className="text-2xl font-bold">Something went wrong</h2>
            <p className="mt-2 text-gray-600">
              We've been notified and are working on it.
            </p>
            <button
              onClick={() => this.setState({ hasError: false })}
              className="mt-4 rounded bg-blue-500 px-4 py-2 text-white"
            >
              Try again
            </button>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}
```

### Learnings from Previous Story

**From Story 1.3 (Status: ready-for-dev)**

Story 1.3 has not yet been implemented, but it establishes critical integration points for error handling:

**Expected Outputs from Story 1.3:**
- **Authentication middleware:** Will throw UnauthorizedError when JWT validation fails
- **Role checks:** Will throw ForbiddenError when user lacks required permissions
- **API routes:** Need standardized error handling for auth failures
- **Shared packages:** packages/auth and packages/database established

**Integration Points:**
- Error handling must integrate with auth middleware (apps/shell/middleware.ts)
- UnauthorizedError thrown when no valid JWT found
- ForbiddenError thrown when requireRole() check fails
- Auth errors should trigger specific user feedback ("Please log in" vs "Access denied")

**Key Dependencies:**
- **Middleware:** Auth middleware uses error classes to signal failures
- **API Routes:** All protected routes need error handling
- **Shared packages:** packages/utils/src/errors.ts imported by packages/auth
- **User context:** Logger uses user_id and agency_id from JWT claims

**What This Story Adds:**
- Standardized error response format for all API routes (including auth endpoints)
- Custom error classes used by auth middleware
- Logging infrastructure for tracking auth failures
- Error boundaries to catch auth-related rendering errors
- Monitoring integration for production error tracking

**Validation Before Starting:**
- Confirm Story 1.3 is complete:
  - [ ] Middleware exists at apps/shell/middleware.ts
  - [ ] packages/auth created with auth utilities
  - [ ] JWT validation implemented
  - [ ] requireRole() utility available
- Verify shared packages structure ready for error utilities
- Check that Supabase client setup complete (needed for logger context)

[Source: .bmad-ephemeral/stories/1-3-authentication-authorization-framework.md]

### Security Considerations

**Error Message Security:**
- **Production:** Never expose stack traces, database queries, or internal paths
- **Development:** Full error details for debugging
- **Sensitive Data:** Filter passwords, tokens, API keys, session IDs from all logs
- **User Feedback:** Friendly, generic messages ("Something went wrong") in production

**Logging Security:**
- **PII Protection:** Hash or redact user emails, phone numbers before logging
- **Token Safety:** Never log JWT tokens, API keys, or credentials
- **Query Safety:** Sanitize database queries to prevent SQL injection visibility
- **Storage:** Logs stored securely with restricted access

**Error Monitoring Security:**
- **Data Scrubbing:** Configure Sentry/LogRocket to filter sensitive fields
- **User Privacy:** Don't send PII to third-party services
- **Access Control:** Monitoring dashboard access restricted to admins
- **Compliance:** Ensure error tracking complies with GDPR, CCPA

### Testing Strategy

**Error Class Tests:**
1. **Custom Errors:**
   - ValidationError creates correct status code (400)
   - NotFoundError creates correct status code (404)
   - UnauthorizedError creates correct status code (401)
   - ForbiddenError creates correct status code (403)

2. **API Error Handler:**
   - Known errors return correct JSON structure
   - Unknown errors return generic SERVER_ERROR
   - Status codes mapped correctly
   - Sensitive data filtered from responses
   - Stack traces only in development mode

**Logging Tests:**
1. **Logger Utility:**
   - Logs include timestamp, level, message
   - Context properly attached (user_id, agency_id)
   - JSON format in production, readable in development
   - Error objects formatted with name, message, stack

**Error Boundary Tests:**
1. **React Component:**
   - Catches render errors and displays fallback
   - Logs errors with component stack
   - Retry button resets error state
   - Integrates with monitoring service

**Integration Tests:**
1. **API Routes:**
   - Invalid input returns ValidationError (400)
   - Missing resource returns NotFoundError (404)
   - Unauthenticated request returns UnauthorizedError (401)
   - Forbidden action returns ForbiddenError (403)
   - Unexpected error returns SERVER_ERROR (500)

### References

- [Source: docs/epics.md#Story-1.4-Error-Handling-&-Logging-Infrastructure]
- [Source: docs/architecture.md#Error-Handling - Custom error classes and API response format]
- [Source: docs/architecture.md#Logging-Pattern - Structured logging implementation]
- [Source: docs/architecture.md#Implementation-Patterns - Error handling conventions]
- [Source: docs/PRD.md#Technical-Requirements - Error handling and monitoring requirements]
- [Source: .bmad-ephemeral/stories/1-3-authentication-authorization-framework.md - Auth integration points]

## Dev Agent Record

### Context Reference

- [1-4-error-handling-logging-infrastructure.context.xml](.bmad-ephemeral/stories/1-4-error-handling-logging-infrastructure.context.xml)

### Agent Model Used

{{agent_model_name_version}}

### Debug Log References

### Completion Notes List

### File List

## Change Log

- **2025-11-13:** Story created from epics.md via create-story workflow
