# Task 1: Create Custom Error Classes and Error Utilities

## Story Context
**Story 1.4**: Error Handling & Logging Infrastructure
**As a** developer, **I want** standardized error handling and logging throughout the application, **so that** I can diagnose issues quickly and provide helpful error messages to users.

## Task Objective
Create custom error classes extending a base AppError class, define API response type structures, and implement error sanitization functions to strip sensitive data from error messages.

## Acceptance Criteria Addressed
- AC 1: All API errors return consistent JSON structure with appropriate HTTP status codes
- AC 3: Sensitive data is never exposed in error messages

## Subtasks
- [ ] Create packages/utils/src/errors.ts with custom error classes
- [ ] Implement AppError base class with code, message, details
- [ ] Implement ValidationError, NotFoundError, UnauthorizedError, ForbiddenError classes
- [ ] Create ApiResponse type definitions (SuccessResponse, ErrorResponse, PaginatedResponse)
- [ ] Add error sanitization function to strip sensitive data

## Implementation Guide

### 1. Create Error Classes File
Create `packages/utils/src/errors.ts`:

```typescript
// Base error class
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

// Specific error types
export class ValidationError extends AppError {
  constructor(message: string, details?: any) {
    super('VALIDATION_ERROR', message, details)
    this.name = 'ValidationError'
  }
}

export class NotFoundError extends AppError {
  constructor(message: string) {
    super('NOT_FOUND', message)
    this.name = 'NotFoundError'
  }
}

export class UnauthorizedError extends AppError {
  constructor(message: string = 'Authentication required') {
    super('UNAUTHORIZED', message)
    this.name = 'UnauthorizedError'
  }
}

export class ForbiddenError extends AppError {
  constructor(message: string = 'Access denied') {
    super('FORBIDDEN', message)
    this.name = 'ForbiddenError'
  }
}
```

### 2. Create API Response Types
Add to `packages/utils/src/errors.ts`:

```typescript
// Success response
export type SuccessResponse<T> = {
  success: true
  data: T
}

// Error response
export type ErrorResponse = {
  success: false
  error: {
    code: 'VALIDATION_ERROR' | 'NOT_FOUND' | 'UNAUTHORIZED' | 'FORBIDDEN' | 'SERVER_ERROR'
    message: string
    details?: any
  }
}

// Paginated response
export type PaginatedResponse<T> = {
  success: true
  data: T[]
  pagination: {
    page: number
    pageSize: number
    totalPages: number
    totalItems: number
  }
}

// Combined response type
export type ApiResponse<T> = SuccessResponse<T> | ErrorResponse
```

### 3. Implement Error Sanitization
Add to `packages/utils/src/errors.ts`:

```typescript
// Sensitive fields to filter from error messages and logs
const SENSITIVE_FIELDS = [
  'password',
  'token',
  'secret',
  'apiKey',
  'api_key',
  'accessToken',
  'refreshToken',
  'sessionId',
  'authorization',
  'cookie',
  'creditCard',
  'ssn',
  'privateKey',
]

/**
 * Sanitizes error details by removing sensitive data
 */
export function sanitizeError(error: any): any {
  if (typeof error !== 'object' || error === null) {
    return error
  }

  if (Array.isArray(error)) {
    return error.map(sanitizeError)
  }

  const sanitized: any = {}
  for (const [key, value] of Object.entries(error)) {
    // Check if key contains sensitive field name (case-insensitive)
    const isSensitive = SENSITIVE_FIELDS.some(field =>
      key.toLowerCase().includes(field.toLowerCase())
    )

    if (isSensitive) {
      sanitized[key] = '[REDACTED]'
    } else if (typeof value === 'object' && value !== null) {
      sanitized[key] = sanitizeError(value)
    } else {
      sanitized[key] = value
    }
  }

  return sanitized
}

/**
 * Creates a safe error message for production (no sensitive data, no stack traces)
 */
export function createSafeErrorMessage(error: unknown): string {
  if (error instanceof AppError) {
    return error.message
  }

  // For unexpected errors, return generic message
  return 'An unexpected error occurred'
}
```

### 4. Export from Package Index
Update `packages/utils/src/index.ts`:

```typescript
export * from './errors'
```

### 5. Update Package.json
Ensure `packages/utils/package.json` has proper configuration:

```json
{
  "name": "@pleeno/utils",
  "version": "0.0.0",
  "private": true,
  "main": "./src/index.ts",
  "types": "./src/index.ts",
  "scripts": {
    "lint": "eslint .",
    "type-check": "tsc --noEmit"
  }
}
```

## Architecture Context
- Uses Turborepo monorepo structure
- Error utilities located in packages/utils/ for sharing across all zones
- Custom error classes follow standardized HTTP status code mapping
- Error sanitization prevents leaking sensitive data in production
- TypeScript strict mode enabled

## References
- [Architecture: Error Handling Pattern](docs/architecture.md#error-handling)
- [Story File](../../1-4-error-handling-logging-infrastructure.md)
- Context XML: `.bmad-ephemeral/stories/1-4-error-handling-logging-infrastructure.context.xml`

## Validation
- [ ] All error classes extend AppError with correct code values
- [ ] API response types defined with proper TypeScript generics
- [ ] sanitizeError() successfully filters sensitive fields
- [ ] createSafeErrorMessage() returns safe messages for production
- [ ] No TypeScript errors in packages/utils
- [ ] Error classes can be imported from @pleeno/utils

## Security Considerations
- Never expose stack traces in error responses (production)
- Filter all sensitive fields (passwords, tokens, keys)
- Generic error messages for unexpected errors
- Detailed error information only in development mode

## Next Steps
After completing this task, proceed to Task 2: Implement API Route Error Handler Middleware.
