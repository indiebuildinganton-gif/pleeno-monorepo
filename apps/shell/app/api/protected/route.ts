import { NextRequest } from 'next/server'
import {
  handleApiError,
  createSuccessResponse,
  getCurrentUser,
  logInfo,
  getRequestId,
} from '@pleeno/utils'

/**
 * Example protected endpoint that requires authentication
 *
 * GET /api/protected
 *
 * Demonstrates:
 * - Authentication check using getCurrentUser()
 * - Request ID tracking
 * - Logging with context
 * - UnauthorizedError (401) when not authenticated
 */
export async function GET(request: NextRequest) {
  const requestId = getRequestId(request.headers)

  try {
    logInfo('Accessing protected endpoint', {
      request_id: requestId,
      path: '/api/protected',
    })

    // Require authentication
    const user = await getCurrentUser(request)

    logInfo('Protected access granted', {
      request_id: requestId,
      user_id: user.id,
      path: '/api/protected',
    })

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
