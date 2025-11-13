/**
 * Client-side Supabase client for React components and browser usage
 *
 * This client handles authentication via browser cookies and is designed
 * for client-side usage in React components. It works with the Supabase
 * browser client and automatically manages authentication state.
 *
 * @module packages/database/src/client
 */

import { createBrowserClient } from '@supabase/ssr'

/**
 * Creates a Supabase client for client-side usage in React components
 *
 * This function creates a Supabase client that:
 * - Reads authentication state from browser cookies
 * - Handles JWT token refresh automatically in the browser
 * - Works with React Client Components and hooks
 * - Integrates with Row-Level Security (RLS) policies
 * - Supports real-time subscriptions
 *
 * Usage in a Client Component:
 * - Import this function in a 'use client' component
 * - Call createClient() to get a Supabase instance
 * - Use the instance to query data or manage auth
 *
 * Usage with TanStack Query (recommended):
 * - Create a hook that uses createClient()
 * - Use useQuery or useMutation to handle data fetching
 * - RLS policies will automatically filter data by agency_id
 *
 * @returns A configured Supabase client for browser/client-side usage
 */
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}

/**
 * Type helper to extract the Supabase client type
 * Use this when you need to type a Supabase client instance
 */
export type BrowserClient = ReturnType<typeof createClient>

/**
 * Get current user's agency_id from Supabase session
 * Returns null if user not authenticated or no agency assigned
 *
 * @param client - The Supabase browser client instance
 * @returns The agency_id as a string, or null if not found
 *
 * @example
 * ```typescript
 * const supabase = createClient()
 * const agencyId = await getCurrentAgencyId(supabase)
 * if (agencyId) {
 *   console.log('User belongs to agency:', agencyId)
 * }
 * ```
 */
export async function getCurrentAgencyId(
  client: BrowserClient
): Promise<string | null> {
  const {
    data: { session },
  } = await client.auth.getSession()

  if (!session?.user) {
    return null
  }

  // Get agency_id from users table
  const { data: user, error } = await client
    .from('users')
    .select('agency_id')
    .eq('id', session.user.id)
    .single()

  if (error || !user) {
    console.error('Failed to get agency_id:', error)
    return null
  }

  return user.agency_id
}
