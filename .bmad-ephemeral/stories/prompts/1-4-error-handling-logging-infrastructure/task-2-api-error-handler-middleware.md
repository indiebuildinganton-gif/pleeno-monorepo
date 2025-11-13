# Task 2: Implement API Route Error Handler Middleware

## Story Context
**Story 1.4**: Error Handling & Logging Infrastructure
**As a** developer, **I want** standardized error handling and logging throughout the application, **so that** I can diagnose issues quickly and provide helpful error messages to users.

## Task Objective
Create a centralized API error handler middleware that maps custom error classes to HTTP status codes, logs errors with context, and formats error responses consistently.

## Acceptance Criteria Addressed
- AC 1: All API errors return consistent JSON structure with appropriate HTTP status codes
- AC 2: Errors are logged with sufficient context (user_id, agency_id, timestamp, stack trace)
- AC 3: Sensitive data is never exposed in error messages

## Subtasks
- [ ] Create packages/utils/src/api-error-handler.ts
- [ ] Implement handleApiError() function with status code mapping
- [ ] Add error logging with context (user_id, agency_id, timestamp)
- [ ] Create error response formatter
- [ ] Add stack trace logging for unexpected errors
- [ ] Implement sensitive data filtering (passwords, tokens, etc.)

## Prerequisites
- Task 1 completed (custom error classes created)

## Implementation Guide

### 1. Create API Error Handler
Create `packages/utils/src/api-error-handler.ts`:

```typescript
import { NextResponse } from 'next/server'
import {
  AppError,
  ErrorResponse,
  sanitizeError,
  ValidationError,
  NotFoundError,
  UnauthorizedError,
  ForbiddenError
} from './errors'

// Status code mapping
const STATUS_CODE_MAP: Record<string, number> = {
  VALIDATION_ERROR: 400,
  NOT_FOUND: 404,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  SERVER_ERROR: 500,
}

/**
 * Handles API errors and returns standardized NextResponse
 */
export async function handleApiError(
  error: unknown,
  context?: {
    user_id?: string
    agency_id?: string
    request_id?: string
    path?: string
  }
): Promise<NextResponse<ErrorResponse>> {
  // Log the error with context
  logError(error, context)

  // Handle known AppError types
  if (error instanceof AppError) {
    const statusCode = STATUS_CODE_MAP[error.code] || 500

    // Sanitize error details before sending to client
    const sanitizedDetails = error.details ? sanitizeError(error.details) : undefined

    return NextResponse.json(
      {
        success: false,
        error: {
          code: error.code,
          message: error.message,
          details: sanitizedDetails,
        },
      },
      { status: statusCode }
    )
  }

  // Handle unexpected errors - never expose details to client
  return NextResponse.json(
    {
      success: false,
      error: {
        code: 'SERVER_ERROR',
        message: process.env.NODE_ENV === 'production'
          ? 'An unexpected error occurred'
          : String(error),
      },
    },
    { status: 500 }
  )
}

/**
 * Logs error with context for monitoring and debugging
 */
function logError(
  error: unknown,
  context?: {
    user_id?: string
    agency_id?: string
    request_id?: string
    path?: string
  }
) {
  const timestamp = new Date().toISOString()
  const errorInfo: any = {
    timestamp,
    context,
  }

  if (error instanceof Error) {
    errorInfo.name = error.name
    errorInfo.message = error.message
    errorInfo.stack = error.stack
  } else {
    errorInfo.error = error
  }

  // Log as JSON in production, pretty-print in development
  if (process.env.NODE_ENV === 'production') {
    console.error(JSON.stringify(errorInfo))
  } else {
    console.error('API Error:', JSON.stringify(errorInfo, null, 2))
  }
}

/**
 * Helper to extract user context from Supabase auth
 */
export async function getUserContext(request: Request): Promise<{
  user_id?: string
  agency_id?: string
}> {
  try {
    // This will be implemented after auth is set up
    // For now, return empty context
    return {}
  } catch {
    return {}
  }
}

/**
 * Wrapper for API route handlers with automatic error handling
 */
export function withErrorHandling<T>(
  handler: (req: Request) => Promise<NextResponse<T>>
) {
  return async (req: Request): Promise<NextResponse<T | ErrorResponse>> => {
    try {
      return await handler(req)
    } catch (error) {
      const context = await getUserContext(req)
      return handleApiError(error, {
        ...context,
        path: new URL(req.url).pathname,
      })
    }
  }
}
```

### 2. Create Success Response Helper
Add to `packages/utils/src/api-error-handler.ts`:

```typescript
import { SuccessResponse } from './errors'

/**
 * Creates a standardized success response
 */
export function createSuccessResponse<T>(
  data: T,
  status: number = 200
): NextResponse<SuccessResponse<T>> {
  return NextResponse.json(
    {
      success: true,
      data,
    },
    { status }
  )
}
```

### 3. Export from Package Index
Update `packages/utils/src/index.ts`:

```typescript
export * from './errors'
export * from './api-error-handler'
```

### 4. Example Usage in API Route
Example of how to use in an API route (apps/shell/app/api/example/route.ts):

```typescript
import { NextRequest } from 'next/server'
import { handleApiError, createSuccessResponse, ValidationError } from '@pleeno/utils'

export async function GET(request: NextRequest) {
  try {
    // Your API logic here
    const data = { message: 'Success' }
    return createSuccessResponse(data)
  } catch (error) {
    return handleApiError(error, {
      path: '/api/example',
    })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    // Validation example
    if (!body.name) {
      throw new ValidationError('Name is required', { field: 'name' })
    }

    const data = { id: 1, name: body.name }
    return createSuccessResponse(data, 201)
  } catch (error) {
    return handleApiError(error, {
      path: '/api/example',
    })
  }
}
```

## Architecture Context
- Centralized error handling for all API routes
- Consistent error response format across entire application
- Automatic logging with context for debugging
- Status code mapping follows REST conventions
- Sensitive data filtering prevents security leaks

## References
- [Architecture: Error Handling Pattern](docs/architecture.md#error-handling)
- [Story File](../../1-4-error-handling-logging-infrastructure.md)
- Context XML: `.bmad-ephemeral/stories/1-4-error-handling-logging-infrastructure.context.xml`

## Validation
- [ ] handleApiError() correctly maps error types to status codes
- [ ] ValidationError returns 400 with error details
- [ ] NotFoundError returns 404 with message
- [ ] UnauthorizedError returns 401
- [ ] ForbiddenError returns 403
- [ ] Unknown errors return 500 with generic message
- [ ] Errors logged with timestamp and context
- [ ] Stack traces only logged server-side, never sent to client
- [ ] Sensitive data filtered from error responses
- [ ] createSuccessResponse() returns proper format
- [ ] withErrorHandling() wrapper catches all errors

## Security Considerations
- Stack traces never exposed to client in production
- Sensitive data filtered before sending to client
- Generic error messages for unexpected errors
- Detailed logging server-side only
- User context logged for audit trail

## Next Steps
After completing this task, proceed to Task 3: Create Server-Side Logging Utility.
