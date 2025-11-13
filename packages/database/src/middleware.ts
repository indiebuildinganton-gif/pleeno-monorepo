/**
 * Agency Context Middleware
 *
 * Epic 1: Foundation & Multi-Tenant Security
 * Story 1.3: Authentication & Authorization Framework
 * Task 6: Implement Agency Context Setting
 *
 * This module provides utilities for setting and managing agency context
 * for Row-Level Security (RLS) filtering in PostgreSQL.
 *
 * @packageDocumentation
 */

import { SupabaseClient } from '@supabase/supabase-js'

/**
 * Sets the agency context for RLS policies
 *
 * This function extracts the agency_id from JWT claims (app_metadata) and
 * sets a PostgreSQL session variable that RLS policies can use to filter data.
 *
 * The session variable is LOCAL to the current transaction, meaning it
 * automatically gets cleaned up when the transaction completes.
 *
 * **IMPORTANT**: Call this function at the start of any server-side data
 * fetching operation to ensure RLS policies filter data by the user's agency.
 *
 * @param supabase - Supabase client (server-side with valid JWT)
 * @throws Error if agency context cannot be set
 *
 * @example
 * ```typescript
 * import { createServerClient } from '@pleeno/database/server'
 * import { setAgencyContext } from '@pleeno/database'
 *
 * const supabase = createServerClient()
 * await setAgencyContext(supabase)
 *
 * // Now all queries will be filtered by the user's agency_id
 * const { data } = await supabase.from('entities').select('*')
 * ```
 */
export async function setAgencyContext(
  supabase: SupabaseClient
): Promise<void> {
  try {
    // Call the database function to set RLS context
    // This function extracts agency_id from JWT and sets session variable
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
      throw new Error(`Failed to set agency context: ${error.message}`)
    }
  } catch (err) {
    console.error('Error setting agency context:', err)
    throw err
  }
}

/**
 * Gets the current user's agency ID from JWT claims
 *
 * This function retrieves the agency_id directly from the authenticated
 * user's JWT app_metadata. This is useful for validation and debugging.
 *
 * @param supabase - Supabase client (server-side with valid JWT)
 * @returns agency_id as string or null if not found
 *
 * @example
 * ```typescript
 * const agencyId = await getCurrentAgencyId(supabase)
 * console.log('User belongs to agency:', agencyId)
 * ```
 */
export async function getCurrentAgencyId(
  supabase: SupabaseClient
): Promise<string | null> {
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return null
  }

  // Extract agency_id from app_metadata
  // app_metadata is set during signup and stored in JWT
  return (user.app_metadata?.agency_id as string) || null
}

/**
 * Verifies that agency context is correctly set in the session
 *
 * This function retrieves the current value of the PostgreSQL session
 * variable to verify that the agency context was set correctly.
 *
 * Useful for debugging RLS issues and ensuring the context matches
 * the expected agency_id from JWT claims.
 *
 * @param supabase - Supabase client (server-side)
 * @returns The current agency_id from session variable or null
 *
 * @example
 * ```typescript
 * // Verify context is set correctly
 * await setAgencyContext(supabase)
 * const contextValue = await getAgencyContextValue(supabase)
 * const jwtAgencyId = await getCurrentAgencyId(supabase)
 *
 * console.log('JWT agency_id:', jwtAgencyId)
 * console.log('Session agency_id:', contextValue)
 * // These should match!
 * ```
 */
export async function getAgencyContextValue(
  supabase: SupabaseClient
): Promise<string | null> {
  try {
    const { data, error } = await supabase.rpc('get_current_agency_id')

    if (error) {
      console.error('Failed to get agency context:', error)
      return null
    }

    return data as string | null
  } catch (err) {
    console.error('Error getting agency context:', err)
    return null
  }
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
