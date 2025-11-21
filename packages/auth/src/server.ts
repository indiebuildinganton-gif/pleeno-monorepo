/**
 * Server-only Auth Exports
 *
 * These utilities use next/headers and @pleeno/database/server,
 * so they can only be used in Server Components and API Routes.
 *
 * @example
 * ```typescript
 * import { requireRole, requireRoleForPage } from '@pleeno/auth/server'
 *
 * export async function GET(request: NextRequest) {
 *   await requireRole('agency_admin')
 *   // ... protected route logic
 * }
 * ```
 */

// Re-export client-safe utilities
export type { UserRole } from './utils/permissions-client'
export { hasRole, hasAnyRole, isAgencyAdmin, getUserRole } from './utils/permissions-client'

// Server-only exports
export { requireRole, requireRoleForPage, getUserAgencyId } from './utils/permissions'
