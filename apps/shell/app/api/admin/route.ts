import { NextRequest } from 'next/server'
import {
  handleApiError,
  createSuccessResponse,
  requireRole,
  logInfo,
  getRequestId,
} from '@pleeno/utils'

/**
 * Example admin-only endpoint that requires agency_admin role
 *
 * GET /api/admin
 *
 * Demonstrates:
 * - Role-based access control using requireRole()
 * - Request ID tracking
 * - Logging with context
 * - UnauthorizedError (401) when not authenticated
 * - ForbiddenError (403) when insufficient permissions
 */
export async function GET(request: NextRequest) {
  const requestId = getRequestId(request.headers)

  try {
    logInfo('Accessing admin endpoint', {
      request_id: requestId,
      path: '/api/admin',
    })

    // Require admin role
    const user = await requireRole(request, 'agency_admin')

    logInfo('Admin access granted', {
      request_id: requestId,
      user_id: user.id,
      role: user.user_metadata?.role,
      path: '/api/admin',
    })

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
