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
    const isSensitive = SENSITIVE_FIELDS.some((field) =>
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
