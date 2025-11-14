/**
 * Admin Permission Utilities
 *
 * Provides utility functions for checking admin permissions by querying
 * the users table for the current user's role.
 *
 * SECURITY BOUNDARIES:
 * - requireAdmin() provides server-side authorization enforcement
 * - isAdmin() is for client-side UI rendering ONLY
 * - Always use requireAdmin() in API routes and Server Actions
 * - RLS policies provide database-level security
 *
 * @module packages/utils/src/require-admin
 */

import { SupabaseClient } from '@supabase/supabase-js'
import { ForbiddenError, UnauthorizedError } from './errors'

/**
 * Server-side utility to require agency_admin role
 *
 * ✅ SECURITY BOUNDARY: Use this in API routes and Server Actions for authorization
 *
 * Features:
 * - Checks if user is authenticated
 * - Queries users table for the current user's role
 * - Throws ForbiddenError if user is not an agency_admin
 * - Returns the current user data on success
 *
 * @param supabase - Supabase client instance
 * @returns Current user data with role
 * @throws UnauthorizedError if user is not authenticated
 * @throws ForbiddenError if user is not an agency_admin
 *
 * @example
 * ```typescript
 * import { createServerClient } from '@pleeno/database/server'
 * import { requireAdmin } from '@pleeno/utils'
 *
 * export async function POST(request: NextRequest) {
 *   const supabase = await createServerClient()
 *   const user = await requireAdmin(supabase) // Throws if not admin
 *
 *   // Proceed with admin-only logic
 *   return NextResponse.json({ success: true })
 * }
 * ```
 */
export async function requireAdmin(supabase: SupabaseClient) {
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    throw new UnauthorizedError('Authentication required')
  }

  const { data: currentUser, error } = await supabase
    .from('users')
    .select('role')
    .eq('id', user.id)
    .single()

  if (error) {
    throw new UnauthorizedError('Unable to verify user permissions')
  }

  if (currentUser?.role !== 'agency_admin') {
    throw new ForbiddenError('Admin access required')
  }

  return currentUser
}

/**
 * Client-side helper to check if user is an admin
 *
 * ⚠️ WARNING: This is for UI rendering only, NOT a security boundary
 * Always use requireAdmin() on the server-side for actual authorization
 *
 * Features:
 * - Checks if user is authenticated
 * - Queries users table for the current user's role
 * - Returns boolean indicating admin status
 * - Never throws errors (returns false on any error)
 *
 * @param supabase - Supabase client instance
 * @returns True if user is an agency_admin, false otherwise
 *
 * @example
 * ```typescript
 * import { createBrowserClient } from '@pleeno/database/client'
 * import { isAdmin } from '@pleeno/utils'
 *
 * function AdminButton() {
 *   const [userIsAdmin, setUserIsAdmin] = useState(false)
 *   const supabase = createBrowserClient()
 *
 *   useEffect(() => {
 *     isAdmin(supabase).then(setUserIsAdmin)
 *   }, [])
 *
 *   if (!userIsAdmin) return null
 *
 *   return <button>+ Add College</button>
 * }
 * ```
 */
export async function isAdmin(supabase: SupabaseClient): Promise<boolean> {
  try {
    await requireAdmin(supabase)
    return true
  } catch {
    return false
  }
}
