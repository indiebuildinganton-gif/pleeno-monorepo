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
import { NextRequest, NextResponse } from 'next/server'
import { redirect } from 'next/navigation'
import { createServerClient } from '@pleeno/database/server'

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

  const userRole = user.app_metadata?.role as UserRole

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

  const userRole = user.app_metadata?.role as UserRole
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
  const supabase = await createServerClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const userRole = user.app_metadata?.role as UserRole

  if (!userRole || !allowedRoles.includes(userRole)) {
    return NextResponse.json({ error: 'Forbidden - insufficient permissions' }, { status: 403 })
  }

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
 * Returns the user's role as stored in JWT app_metadata.
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
  return (user.app_metadata?.role as UserRole) || null
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

  const userRole = user.app_metadata?.role as UserRole

  if (!userRole || !allowedRoles.includes(userRole)) {
    redirect('/dashboard?error=unauthorized')
    // TypeScript doesn't know redirect throws, so this return is never reached
    throw new Error('Redirecting to dashboard')
  }

  return { user, role: userRole }
}
