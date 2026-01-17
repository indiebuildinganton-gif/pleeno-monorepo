/**
 * Permissions Utilities - Role-based access control helpers
 *
 * Provides utility functions for checking user roles and permissions.
 * Implements two-tier RBAC with agency_admin and agency_user roles.
 *
 * SECURITY BOUNDARIES:
 * - Client-side functions (hasRole, isAgencyAdmin, etc.) are for UI rendering ONLY
 * - Server-side functions (requireRole) provide actual security enforcement
 * - Always use requireRole() in API routes and Server Actions
 * - RLS policies provide database-level security
 *
 * @module packages/auth/src/utils/permissions
 */

import { User } from '@supabase/supabase-js'
import { createServerClient as createSupabaseServerClient } from '@supabase/ssr'
import { NextRequest, NextResponse } from 'next/server'
import { redirect } from 'next/navigation'
import { createServerClient, createServerClientFromRequest } from '@pleeno/database/server'

/**
 * User role types in the system
 *
 * - agency_admin: Full access to all agency features including user management
 * - agency_user: Limited access to core features, cannot manage users
 */
export type UserRole = 'agency_admin' | 'agency_user'

/**
 * Client-side utility to check if user has a specific role
 *
 * ⚠️ WARNING: This is for UI rendering only, NOT a security boundary
 * Always use requireRole() on the server-side for actual authorization
 *
 * Features:
 * - Agency admins automatically pass all role checks
 * - Returns false for null/undefined users
 * - Reads role from JWT app_metadata
 *
 * @param user - User object from Supabase Auth
 * @param role - The role to check for
 * @returns True if user has the specified role (or is admin), false otherwise
 *
 * @example
 * ```typescript
 * import { useAuth } from '@pleeno/auth'
 * import { hasRole } from '@pleeno/auth'
 *
 * function MyComponent() {
 *   const { user } = useAuth()
 *
 *   if (hasRole(user, 'agency_admin')) {
 *     return <AdminPanel />
 *   }
 *   return <UserPanel />
 * }
 * ```
 */
export function hasRole(user: User | null, role: UserRole): boolean {
  if (!user) return false

  // Check both app_metadata and user_metadata for role
  const userRole = (user.app_metadata?.role || user.user_metadata?.role) as UserRole

  // Agency admin has access to everything
  if (userRole === 'agency_admin') return true

  // Check specific role
  return userRole === role
}

/**
 * Check if user has any of the specified roles
 *
 * ⚠️ WARNING: This is for UI rendering only, NOT a security boundary
 *
 * @param user - User object from Supabase Auth
 * @param roles - Array of roles to check
 * @returns True if user has any of the specified roles, false otherwise
 *
 * @example
 * ```typescript
 * if (hasAnyRole(user, ['agency_admin', 'agency_user'])) {
 *   return <Dashboard />
 * }
 * ```
 */
export function hasAnyRole(user: User | null, roles: UserRole[]): boolean {
  if (!user) return false

  // Check both app_metadata and user_metadata for role
  const userRole = (user.app_metadata?.role || user.user_metadata?.role) as UserRole
  return roles.includes(userRole)
}

/**
 * Server-side middleware to require specific role(s)
 *
 * ✅ SECURITY BOUNDARY: Use this in API routes and middleware for authorization
 *
 * Features:
 * - Returns 401 if user is not authenticated
 * - Returns 403 if user lacks required role
 * - Returns user and role data on success
 * - Reads role from JWT app_metadata
 *
 * @param request - Next.js request object
 * @param allowedRoles - Array of roles that are allowed access
 * @returns User and role data on success, error response on failure
 *
 * @example
 * ```typescript
 * import { requireRole } from '@pleeno/auth'
 *
 * export async function GET(request: NextRequest) {
 *   const authResult = await requireRole(request, ['agency_admin'])
 *
 *   if (authResult instanceof NextResponse) {
 *     return authResult // Return error response
 *   }
 *
 *   const { user, role } = authResult
 *   // Proceed with authorized logic
 * }
 * ```
 */
export async function requireRole(
  request: NextRequest,
  allowedRoles: UserRole[]
): Promise<{ user: User; role: UserRole } | NextResponse> {
  console.log('========================================')
  console.log('requireRole called')
  console.log('NODE_ENV:', process.env.NODE_ENV)
  console.log('DISABLE_AUTH:', process.env.DISABLE_AUTH)
  console.log('Request URL:', request.url)
  console.log('Request cookies:', request.cookies.getAll())
  console.log('========================================')

  // BYPASS AUTH IN DEV MODE if DISABLE_AUTH=true
  if (process.env.NODE_ENV === 'development' && process.env.DISABLE_AUTH === 'true') {
    console.log('🔓 AUTH BYPASS ACTIVE - Returning mock user')
    // Return a mock user for development
    const mockUser = {
      id: 'dev-user',
      email: 'dev@test.local',
      app_metadata: { role: 'agency_admin', agency_id: '20000000-0000-0000-0000-000000000001' },
      user_metadata: { full_name: 'Dev User', role: 'agency_admin', agency_id: '20000000-0000-0000-0000-000000000001' },
      aud: 'authenticated',
      created_at: new Date().toISOString(),
    } as unknown as User

    return { user: mockUser, role: 'agency_admin' }
  }

  console.log('🔒 AUTH BYPASS NOT ACTIVE - Checking authentication')

  // Check for headers passed from middleware (Strategy A: Fix Race Condition)
  const headerUserId = request.headers.get('x-user-id')
  const headerUserRole = request.headers.get('x-user-role') as UserRole | null
  const headerAgencyId = request.headers.get('x-user-agency-id')

  if (headerUserId && headerUserRole) {
    console.log('✅ AUTH SUCCESS (via headers) - User authorized')
    // Construct a minimal user object
    const user = {
      id: headerUserId,
      email: request.headers.get('x-user-email') || undefined,
      app_metadata: { role: headerUserRole, agency_id: headerAgencyId },
      user_metadata: { role: headerUserRole, agency_id: headerAgencyId },
      aud: 'authenticated',
      created_at: new Date().toISOString(),
    } as unknown as User

    if (!allowedRoles.includes(headerUserRole)) {
      console.log('❌ INSUFFICIENT PERMISSIONS - Returning 403')
      return NextResponse.json({ error: 'Forbidden - insufficient permissions' }, { status: 403 })
    }

    return { user, role: headerUserRole }
  }

  // Use request-based client to properly read cross-subdomain cookies
  // cookies() from next/headers doesn't work for cross-subdomain cookies in Vercel
  const supabase = createServerClientFromRequest(request)

  // First, try getSession to see if cookie parsing works
  const { data: sessionData, error: sessionError } = await supabase.auth.getSession()
  console.log('🔐 [Auth Debug] getSession result:', {
    hasSession: !!sessionData.session,
    accessTokenPrefix: sessionData.session?.access_token?.substring(0, 30),
    expiresAt: sessionData.session?.expires_at,
    error: sessionError ? { message: sessionError.message, status: (sessionError as any).status } : null
  })

  // Then call getUser (validates with Supabase API)
  const { data, error: authError } = await supabase.auth.getUser()
  const user = data.user

  console.log('🔐 [Auth Debug] getUser result:', {
    hasUser: !!user,
    userEmail: user?.email,
    userId: user?.id,
    error: authError ? { message: authError.message, status: (authError as any).status } : null
  })

  console.log('User from Supabase:', user ? `${user.email} (${user.id})` : 'null')

  if (!user) {
    console.log('❌ NO USER - Returning 401')
    console.log('   Session exists:', !!sessionData.session)
    console.log('   Auth error:', authError?.message || 'none')
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Check both app_metadata and user_metadata for role
  // Some Supabase configurations store role in user_metadata instead of app_metadata
  const userRole = (user.app_metadata?.role || user.user_metadata?.role) as UserRole
  console.log('User role:', userRole)
  console.log('  - from app_metadata:', user.app_metadata?.role)
  console.log('  - from user_metadata:', user.user_metadata?.role)
  console.log('Allowed roles:', allowedRoles)

  if (!userRole || !allowedRoles.includes(userRole)) {
    console.log('❌ INSUFFICIENT PERMISSIONS - Returning 403')
    return NextResponse.json({ error: 'Forbidden - insufficient permissions' }, { status: 403 })
  }

  console.log('✅ AUTH SUCCESS - User authorized')
  return { user, role: userRole }
}

/**
 * Check if user is an agency admin
 *
 * ⚠️ WARNING: This is for UI rendering only, NOT a security boundary
 *
 * Convenience function that checks for agency_admin role.
 * Agency admins have full access to all features.
 *
 * @param user - User object from Supabase Auth
 * @returns True if user is an agency admin, false otherwise
 *
 * @example
 * ```typescript
 * const { user } = useAuth()
 *
 * if (isAgencyAdmin(user)) {
 *   return <AdminDashboard />
 * }
 * return <UserDashboard />
 * ```
 */
export function isAgencyAdmin(user: User | null): boolean {
  return hasRole(user, 'agency_admin')
}

/**
 * Get user's role from JWT metadata
 *
 * Returns the user's role as stored in JWT app_metadata or user_metadata.
 * Returns null if user is not authenticated or role is not set.
 *
 * @param user - User object from Supabase Auth
 * @returns The user's role, or null if not available
 *
 * @example
 * ```typescript
 * const { user } = useAuth()
 * const role = getUserRole(user)
 *
 * if (role === 'agency_admin') {
 *   console.log('User is an admin')
 * }
 * ```
 */
export function getUserRole(user: User | null): UserRole | null {
  if (!user) return null
  // Check both app_metadata and user_metadata for role
  return (user.app_metadata?.role || user.user_metadata?.role) as UserRole || null
}

/**
 * Get user's agency ID from JWT metadata
 *
 * Returns the user's agency_id as stored in JWT app_metadata or user_metadata.
 * Returns null if user is not authenticated or agency_id is not set.
 *
 * @param user - User object from Supabase Auth
 * @returns The user's agency ID, or null if not available
 *
 * @example
 * ```typescript
 * const { user } = authResult
 * const agencyId = getUserAgencyId(user)
 *
 * if (!agencyId) {
 *   throw new ForbiddenError('User not associated with an agency')
 * }
 * ```
 */
export function getUserAgencyId(user: User | null): string | null {
  if (!user) return null
  // Check both app_metadata and user_metadata for agency_id
  return (user.app_metadata?.agency_id || user.user_metadata?.agency_id) as string || null
}

/**
 * Server Component utility to require specific role(s)
 *
 * ✅ SECURITY BOUNDARY: Use this in Server Components for authorization
 *
 * Features:
 * - Redirects to /login if user is not authenticated
 * - Redirects to /dashboard?error=unauthorized if user lacks required role
 * - Returns user and role data on success
 * - Reads role from JWT app_metadata
 *
 * @param allowedRoles - Array of roles that are allowed access
 * @returns User and role data on success (never returns on failure - redirects instead)
 *
 * @example
 * ```typescript
 * import { requireRoleForPage } from '@pleeno/auth'
 *
 * export default async function SettingsPage() {
 *   const { user, role } = await requireRoleForPage(['agency_admin'])
 *
 *   return <div>Settings for {role}</div>
 * }
 * ```
 */
export async function requireRoleForPage(
  allowedRoles: UserRole[]
): Promise<{ user: User; role: UserRole }> {
  const supabase = await createServerClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
    // TypeScript doesn't know redirect throws, so this return is never reached
    throw new Error('Redirecting to login')
  }

  // Check both app_metadata and user_metadata for role
  const userRole = (user.app_metadata?.role || user.user_metadata?.role) as UserRole

  if (!userRole || !allowedRoles.includes(userRole)) {
    redirect('/dashboard?error=unauthorized')
    // TypeScript doesn't know redirect throws, so this return is never reached
    throw new Error('Redirecting to dashboard')
  }

  return { user, role: userRole }
}
