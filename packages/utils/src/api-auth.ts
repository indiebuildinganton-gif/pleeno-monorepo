import { NextRequest } from 'next/server'
import { createServerClient } from '@pleeno/database/server'
import { UnauthorizedError, ForbiddenError } from './errors'

/**
 * Get current authenticated user from request
 *
 * @throws UnauthorizedError if user is not authenticated
 */
export async function getCurrentUser(_request: NextRequest) {
  const supabase = await createServerClient()

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
 *
 * @throws UnauthorizedError if user is not authenticated
 * @throws ForbiddenError if user does not have required role
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
 *
 * @throws UnauthorizedError if user is not authenticated
 * @throws Error if user is not associated with an agency
 */
export async function getAgencyId(request: NextRequest): Promise<string> {
  const user = await getCurrentUser(request)

  const agencyId = user.user_metadata?.agency_id

  if (!agencyId) {
    throw new Error('User not associated with an agency')
  }

  return agencyId
}
