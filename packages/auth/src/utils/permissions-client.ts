/**
 * Client-Side Permissions Utilities
 *
 * These functions are safe for use in client components as they don't import server-only modules.
 * Use these for UI rendering and client-side role checks.
 *
 * ⚠️ WARNING: These are for UI rendering only, NOT security boundaries.
 * Always use server-side functions for actual authorization.
 *
 * @module packages/auth/src/utils/permissions-client
 */

import { User } from '@supabase/supabase-js'

/**
 * User role types in the system
 */
export type UserRole = 'agency_admin' | 'agency_user'

/**
 * Client-side utility to check if user has a specific role
 *
 * ⚠️ WARNING: This is for UI rendering only, NOT a security boundary.
 * Always use requireRole() on the server-side for actual authorization.
 *
 * @param user - User object from Supabase Auth
 * @param role - The role to check for
 * @returns True if user has the specified role (or is admin), false otherwise
 */
export function hasRole(user: User | null, role: UserRole): boolean {
  if (!user) return false

  // Agency admins have all permissions
  const userRole = user.app_metadata?.role as UserRole | undefined
  if (userRole === 'agency_admin') return true

  return userRole === role
}

/**
 * Client-side utility to check if user has any of the specified roles
 *
 * @param user - User object from Supabase Auth
 * @param roles - Array of roles to check
 * @returns True if user has any of the roles, false otherwise
 */
export function hasAnyRole(user: User | null, roles: UserRole[]): boolean {
  return roles.some((role) => hasRole(user, role))
}

/**
 * Client-side utility to check if user is an agency admin
 *
 * @param user - User object from Supabase Auth
 * @returns True if user is an agency admin, false otherwise
 */
export function isAgencyAdmin(user: User | null): boolean {
  return hasRole(user, 'agency_admin')
}

/**
 * Get the user's current role
 *
 * @param user - User object from Supabase Auth
 * @returns The user's role, or null if no user
 */
export function getUserRole(user: User | null): UserRole | null {
  if (!user) return null
  return (user.app_metadata?.role as UserRole) || null
}
