/**
 * Pleeno Database Package
 *
 * Provides Supabase client setup for both server-side and client-side usage
 * with built-in authentication via HTTP-only cookies and multi-tenant RLS support.
 *
 * Epic 1: Foundation & Multi-Tenant Security
 * Story 1.2: Multi-Tenant Database Schema with RLS
 *
 * Epic 1: Foundation & Multi-Tenant Security
 * Story 1.3: Authentication & Authorization Framework
 *
 * @example Server-side usage
 * ```typescript
 * import { createServerClient, setAgencyContext } from '@pleeno/database/server'
 *
 * const supabase = await createServerClient()
 * await setAgencyContext(supabase)
 * const { data } = await supabase.from('users').select('*')
 * ```
 *
 * @example Client-side usage
 * ```typescript
 * import { createClient, getCurrentAgencyId } from '@pleeno/database/client'
 *
 * const supabase = createClient()
 * const agencyId = await getCurrentAgencyId(supabase)
 * const { data } = await supabase.from('users').select('*')
 * ```
 *
 * @example Agency context (server-side only)
 * ```typescript
 * import { createServerClient } from '@pleeno/database/server'
 * import { setAgencyContext } from '@pleeno/database'
 *
 * const supabase = createServerClient()
 * await setAgencyContext(supabase)  // Enable RLS filtering by agency
 * const { data } = await supabase.from('entities').select('*')
 * @example Middleware usage
 * ```typescript
 * import { withAgencyContext } from '@pleeno/database/middleware'
 *
 * export const GET = withAgencyContext(async (request) => {
 *   // RLS context is already set
 *   const supabase = await createServerClient()
 *   const { data } = await supabase.from('users').select('*')
 *   return Response.json(data)
 * })
 * ```
 *
 * @packageDocumentation
 */

// Note: Import from specific files to maintain tree-shaking
// Server-side: import from '@pleeno/database/server'
// Client-side: import from '@pleeno/database/client'
// Middleware: import from '@pleeno/database/middleware'

// Export only types from the main entry point
// Import server/client/middleware from their specific paths
export * from './types/database.types'

// Export activity logger types and functions
export * from './activity-logger'

// Export audit logger types and functions
export * from './audit-logger'
