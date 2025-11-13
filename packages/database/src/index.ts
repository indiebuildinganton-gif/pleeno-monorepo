/**
 * Pleeno Database Package
 *
 * Provides Supabase client setup for both server-side and client-side usage
 * with built-in authentication via HTTP-only cookies.
 *
 * Epic 1: Foundation & Multi-Tenant Security
 * Story 1.3: Authentication & Authorization Framework
 *
 * @example Server-side usage
 * ```typescript
 * import { createServerClient } from '@pleeno/database/server'
 *
 * const supabase = createServerClient()
 * const { data } = await supabase.from('users').select('*')
 * ```
 *
 * @example Client-side usage
 * ```typescript
 * import { createClient } from '@pleeno/database/client'
 *
 * const supabase = createClient()
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
 * ```
 *
 * @packageDocumentation
 */

// Note: Import from specific files to maintain tree-shaking
// Server-side: import from '@pleeno/database/server'
// Client-side: import from '@pleeno/database/client'

export * from './types/database.types'
export * from './server'
export * from './client'
export * from './middleware'
