/**
 * Pleeno Auth Package
 *
 * Provides authentication utilities, hooks, and helpers for the Pleeno application.
 * This package is built on top of @pleeno/database and provides a higher-level
 * API for authentication and authorization.
 *
 * @example
 * ```typescript
 * import { useAuth } from '@pleeno/auth'
 *
 * function MyComponent() {
 *   const { user, isLoading } = useAuth()
 *   // ...
 * }
 * ```
 *
 * @packageDocumentation
 */

// Hooks
export * from './hooks/useAuth'

// Utilities - Export only client-safe functions (no server imports)
// Note: Server-side functions (requireRole, requireRoleForPage, etc.) should be imported from '@pleeno/auth/server'
export type { UserRole } from './utils/permissions-client'
export { hasRole, hasAnyRole, isAgencyAdmin, getUserRole } from './utils/permissions-client'
