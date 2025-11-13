import { NextResponse } from 'next/server'
import { ZodError } from 'zod'
import { AppError, ErrorResponse, SuccessResponse, sanitizeError } from './errors'

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

  // Handle JSON parsing errors
  if (error instanceof SyntaxError && error.message.includes('JSON')) {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid JSON in request body',
        },
      },
      { status: 400 }
    )
  }

  // Handle Zod validation errors
  if (error instanceof ZodError) {
    const formattedErrors = error.errors.map((err) => ({
      path: err.path.join('.'),
      message: err.message,
    }))

    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: formattedErrors[0]?.message || 'Validation failed',
          details: formattedErrors,
        },
      },
      { status: 400 }
    )
  }

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
        message:
          process.env.NODE_ENV === 'production' ? 'An unexpected error occurred' : String(error),
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
export async function getUserContext(_request: Request): Promise<{
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
export function withErrorHandling<T>(handler: (req: Request) => Promise<NextResponse<T>>) {
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
