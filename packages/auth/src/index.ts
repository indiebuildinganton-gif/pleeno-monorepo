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

// Utilities
export * from './utils/permissions'
