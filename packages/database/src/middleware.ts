/**
 * Middleware utilities for agency context management
 * Epic 1: Foundation & Multi-Tenant Security
 * Story 1.2: Multi-Tenant Database Schema with RLS
 */

import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from './server'

/**
 * Middleware to set agency context for API routes
 * Add this to your API route handlers to ensure RLS context is set
 *
 * This middleware:
 * - Creates a Supabase server client
 * - Calls set_agency_context() to initialize the database session
 * - Sets the PostgreSQL session variable for RLS policies
 * - Calls your route handler with the initialized context
 *
 * @param handler - The API route handler function
 * @returns A wrapped handler with agency context initialized
 *
 * @example
 * ```typescript
 * import { withAgencyContext } from '@pleeno/database/middleware'
 *
 * export const GET = withAgencyContext(async (request) => {
 *   const supabase = await createServerClient()
 *   // RLS context is already set
 *   const { data } = await supabase.from('users').select('*')
 *   return Response.json(data)
 * })
 * ```
 */
export function withAgencyContext(
  handler: (request: NextRequest) => Promise<Response>
) {
  return async function (request: NextRequest): Promise<Response> {
    const supabase = await createServerClient()

    // Set agency context from JWT
    const { error } = await supabase.rpc('set_agency_context')

    if (error) {
      console.error('Failed to set agency context:', error)
      return NextResponse.json(
        { error: 'Failed to initialize agency context' },
        { status: 500 }
      )
    }

    // Call the actual handler
    return handler(request)
  }
}

/**
 * Get current user's agency_id on server side
 *
 * This function:
 * - Gets the current authenticated session
 * - Queries the users table for the user's agency_id
 * - Returns the agency_id or null if not found
 *
 * @returns The agency_id as a string, or null if not found
 *
 * @example
 * ```typescript
 * import { getServerAgencyId } from '@pleeno/database/middleware'
 *
 * const agencyId = await getServerAgencyId()
 * if (agencyId) {
 *   console.log('User belongs to agency:', agencyId)
 * }
 * ```
 */
export async function getServerAgencyId(): Promise<string | null> {
  const supabase = await createServerClient()

  const {
    data: { session },
  } = await supabase.auth.getSession()

  if (!session?.user) {
    return null
  }

  const { data: user } = await supabase
    .from('users')
    .select('agency_id')
    .eq('id', session.user.id)
    .single()

  return user?.agency_id || null
}
