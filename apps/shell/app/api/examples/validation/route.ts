import { NextRequest } from 'next/server'
import {
  handleApiError,
  createSuccessResponse,
  ValidationError,
  logInfo,
  getRequestId,
} from '@pleeno/utils'
import { z } from 'zod'

/**
 * Example schema using Zod for input validation
 */
const ExampleSchema = z.object({
  email: z.string().email('Invalid email address'),
  age: z.number().min(18, 'Must be at least 18 years old'),
  terms: z.boolean().refine((val) => val === true, 'Must accept terms'),
})

/**
 * Example validation endpoint demonstrating Zod schema validation
 *
 * POST /api/examples/validation
 *
 * Request body:
 * {
 *   "email": "user@example.com",
 *   "age": 25,
 *   "terms": true
 * }
 *
 * Demonstrates:
 * - Zod schema validation with safeParse()
 * - ValidationError (400) with field-level error details
 * - Structured error messages for client-side display
 * - Request ID tracking
 */
export async function POST(request: NextRequest) {
  const requestId = getRequestId(request.headers)

  try {
    logInfo('Validation example', {
      request_id: requestId,
      path: '/api/examples/validation',
    })

    const body = await request.json()
    const result = ExampleSchema.safeParse(body)

    if (!result.success) {
      throw new ValidationError('Validation failed', {
        errors: result.error.flatten().fieldErrors,
      })
    }

    logInfo('Validation passed', {
      request_id: requestId,
      path: '/api/examples/validation',
    })

    return createSuccessResponse({
      message: 'Validation passed',
      data: result.data,
    })
  } catch (error) {
    return handleApiError(error, {
      request_id: requestId,
      path: '/api/examples/validation',
    })
  }
}
