# Task 6: Apply Error Handling to Existing API Routes

## Story Context
**Story 1.4**: Error Handling & Logging Infrastructure
**As a** developer, **I want** standardized error handling and logging throughout the application, **so that** I can diagnose issues quickly and provide helpful error messages to users.

## Task Objective
Apply the error handling infrastructure to all existing API routes, ensuring consistent error responses, proper validation, and comprehensive logging.

## Acceptance Criteria Addressed
- AC 1: All API errors return consistent JSON structure with appropriate HTTP status codes

## Subtasks
- [ ] Wrap API route handlers with try-catch
- [ ] Use handleApiError() in catch blocks
- [ ] Return standardized error responses
- [ ] Add input validation with Zod and return ValidationError
- [ ] Test error responses for each status code (400, 401, 403, 404, 500)

## Prerequisites
- Tasks 1-5 completed (error handling infrastructure in place)
- Existing API routes identified

## Implementation Guide

### 1. Create API Route Template
Standard template for all API routes (`apps/shell/app/api/[resource]/route.ts`):

```typescript
import { NextRequest } from 'next/server'
import {
  handleApiError,
  createSuccessResponse,
  ValidationError,
  NotFoundError,
  UnauthorizedError,
  logInfo,
  getRequestId,
} from '@pleeno/utils'
import { z } from 'zod'

// Input validation schema
const CreateResourceSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  description: z.string().optional(),
})

export async function GET(request: NextRequest) {
  const requestId = getRequestId(request.headers)

  try {
    logInfo('Fetching resources', {
      request_id: requestId,
      path: '/api/resource',
    })

    // TODO: Add authentication check
    // const user = await getCurrentUser(request)
    // if (!user) throw new UnauthorizedError()

    // TODO: Fetch data from database
    const data = []

    return createSuccessResponse(data)
  } catch (error) {
    return handleApiError(error, {
      request_id: requestId,
      path: '/api/resource',
    })
  }
}

export async function POST(request: NextRequest) {
  const requestId = getRequestId(request.headers)

  try {
    logInfo('Creating resource', {
      request_id: requestId,
      path: '/api/resource',
    })

    // Parse and validate request body
    const body = await request.json()
    const validationResult = CreateResourceSchema.safeParse(body)

    if (!validationResult.success) {
      throw new ValidationError('Invalid input', {
        errors: validationResult.error.flatten().fieldErrors,
      })
    }

    const validatedData = validationResult.data

    // TODO: Add authentication check
    // const user = await getCurrentUser(request)
    // if (!user) throw new UnauthorizedError()

    // TODO: Create resource in database
    const newResource = {
      id: 1,
      ...validatedData,
    }

    return createSuccessResponse(newResource, 201)
  } catch (error) {
    return handleApiError(error, {
      request_id: requestId,
      path: '/api/resource',
    })
  }
}

export async function PATCH(request: NextRequest) {
  const requestId = getRequestId(request.headers)

  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      throw new ValidationError('ID parameter is required')
    }

    logInfo('Updating resource', {
      request_id: requestId,
      path: '/api/resource',
      resource_id: id,
    })

    // TODO: Add authentication check
    // const user = await getCurrentUser(request)
    // if (!user) throw new UnauthorizedError()

    // Parse and validate request body
    const body = await request.json()
    const validationResult = CreateResourceSchema.partial().safeParse(body)

    if (!validationResult.success) {
      throw new ValidationError('Invalid input', {
        errors: validationResult.error.flatten().fieldErrors,
      })
    }

    // TODO: Check if resource exists
    // if (!resource) throw new NotFoundError('Resource not found')

    // TODO: Update resource in database
    const updatedResource = {
      id,
      ...validationResult.data,
    }

    return createSuccessResponse(updatedResource)
  } catch (error) {
    return handleApiError(error, {
      request_id: requestId,
      path: '/api/resource',
    })
  }
}

export async function DELETE(request: NextRequest) {
  const requestId = getRequestId(request.headers)

  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      throw new ValidationError('ID parameter is required')
    }

    logInfo('Deleting resource', {
      request_id: requestId,
      path: '/api/resource',
      resource_id: id,
    })

    // TODO: Add authentication check
    // const user = await getCurrentUser(request)
    // if (!user) throw new UnauthorizedError()

    // TODO: Check if resource exists
    // if (!resource) throw new NotFoundError('Resource not found')

    // TODO: Delete resource from database

    return createSuccessResponse({ message: 'Resource deleted successfully' })
  } catch (error) {
    return handleApiError(error, {
      request_id: requestId,
      path: '/api/resource',
    })
  }
}
```

### 2. Create Authentication Helper
Create `packages/utils/src/api-auth.ts`:

```typescript
import { NextRequest } from 'next/server'
import { createServerClient } from '@pleeno/database/server'
import { UnauthorizedError, ForbiddenError } from './errors'

/**
 * Get current authenticated user from request
 */
export async function getCurrentUser(request: NextRequest) {
  const supabase = createServerClient()

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser()

  if (error || !user) {
    throw new UnauthorizedError('Authentication required')
  }

  return user
}

/**
 * Require specific role
 */
export async function requireRole(request: NextRequest, role: 'agency_admin' | 'agency_user') {
  const user = await getCurrentUser(request)

  const userRole = user.user_metadata?.role

  if (userRole !== role && userRole !== 'agency_admin') {
    throw new ForbiddenError('Insufficient permissions')
  }

  return user
}

/**
 * Get agency ID from user context
 */
export async function getAgencyId(request: NextRequest): Promise<string> {
  const user = await getCurrentUser(request)

  const agencyId = user.user_metadata?.agency_id

  if (!agencyId) {
    throw new Error('User not associated with an agency')
  }

  return agencyId
}
```

### 3. Apply to Health Check Route
Create/Update `apps/shell/app/api/health/route.ts`:

```typescript
import { NextRequest } from 'next/server'
import { createSuccessResponse, handleApiError, logInfo } from '@pleeno/utils'

export async function GET(request: NextRequest) {
  try {
    logInfo('Health check', {
      path: '/api/health',
    })

    return createSuccessResponse({
      status: 'healthy',
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    return handleApiError(error, {
      path: '/api/health',
    })
  }
}
```

### 4. Create Example Protected Route
Create `apps/shell/app/api/protected/route.ts`:

```typescript
import { NextRequest } from 'next/server'
import {
  handleApiError,
  createSuccessResponse,
  getCurrentUser,
  logInfo,
  getRequestId,
} from '@pleeno/utils'

export async function GET(request: NextRequest) {
  const requestId = getRequestId(request.headers)

  try {
    logInfo('Accessing protected endpoint', {
      request_id: requestId,
      path: '/api/protected',
    })

    // Require authentication
    const user = await getCurrentUser(request)

    return createSuccessResponse({
      message: 'Access granted',
      user: {
        id: user.id,
        email: user.email,
      },
    })
  } catch (error) {
    return handleApiError(error, {
      request_id: requestId,
      path: '/api/protected',
    })
  }
}
```

### 5. Create Example Admin Route
Create `apps/shell/app/api/admin/route.ts`:

```typescript
import { NextRequest } from 'next/server'
import {
  handleApiError,
  createSuccessResponse,
  requireRole,
  logInfo,
  getRequestId,
} from '@pleeno/utils'

export async function GET(request: NextRequest) {
  const requestId = getRequestId(request.headers)

  try {
    logInfo('Accessing admin endpoint', {
      request_id: requestId,
      path: '/api/admin',
    })

    // Require admin role
    const user = await requireRole(request, 'agency_admin')

    return createSuccessResponse({
      message: 'Admin access granted',
      user: {
        id: user.id,
        email: user.email,
        role: user.user_metadata?.role,
      },
    })
  } catch (error) {
    return handleApiError(error, {
      request_id: requestId,
      path: '/api/admin',
    })
  }
}
```

### 6. Create Validation Examples
Create `apps/shell/app/api/examples/validation/route.ts`:

```typescript
import { NextRequest } from 'next/server'
import {
  handleApiError,
  createSuccessResponse,
  ValidationError,
  NotFoundError,
  logInfo,
} from '@pleeno/utils'
import { z } from 'zod'

const ExampleSchema = z.object({
  email: z.string().email('Invalid email address'),
  age: z.number().min(18, 'Must be at least 18 years old'),
  terms: z.boolean().refine(val => val === true, 'Must accept terms'),
})

export async function POST(request: NextRequest) {
  try {
    logInfo('Validation example', {
      path: '/api/examples/validation',
    })

    const body = await request.json()
    const result = ExampleSchema.safeParse(body)

    if (!result.success) {
      throw new ValidationError('Validation failed', {
        errors: result.error.flatten().fieldErrors,
      })
    }

    return createSuccessResponse({
      message: 'Validation passed',
      data: result.data,
    })
  } catch (error) {
    return handleApiError(error, {
      path: '/api/examples/validation',
    })
  }
}
```

### 7. Update Package Exports
Update `packages/utils/src/index.ts`:

```typescript
export * from './errors'
export * from './api-error-handler'
export * from './logger'
export * from './sentry'
export * from './api-auth'
```

## Architecture Context
- All API routes follow consistent error handling pattern
- Zod validation for input validation
- Custom error types for different failure scenarios
- Request ID tracking for debugging
- User context logging for audit trail

## References
- [Architecture: API Route Pattern](docs/architecture.md#api-routes)
- [Story File](../../1-4-error-handling-logging-infrastructure.md)
- Context XML: `.bmad-ephemeral/stories/1-4-error-handling-logging-infrastructure.context.xml`

## Validation
- [ ] All API routes wrapped with try-catch
- [ ] handleApiError() used in all catch blocks
- [ ] Validation errors return 400 with field details
- [ ] Not found errors return 404
- [ ] Unauthorized errors return 401
- [ ] Forbidden errors return 403
- [ ] Unknown errors return 500 with generic message
- [ ] Request IDs tracked in all routes
- [ ] User context logged where applicable
- [ ] Input validation using Zod schemas
- [ ] Success responses use createSuccessResponse()

## Testing
Test each error scenario:

```bash
# Health check (should succeed)
curl http://localhost:3000/api/health

# Protected route (should fail with 401 if not authenticated)
curl http://localhost:3000/api/protected

# Validation error (should return 400)
curl -X POST http://localhost:3000/api/examples/validation \
  -H "Content-Type: application/json" \
  -d '{"email": "invalid", "age": 10, "terms": false}'

# Valid request (should succeed)
curl -X POST http://localhost:3000/api/examples/validation \
  -H "Content-Type: application/json" \
  -d '{"email": "test@example.com", "age": 25, "terms": true}'
```

## Next Steps
After completing this task, proceed to Task 7: Write Error Handling Test Suite.
