/**
 * Pleeno Database Package
 *
 * Provides Supabase client setup for both server-side and client-side usage
 * with built-in authentication via HTTP-only cookies.
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
 * @packageDocumentation
 */

// Note: Import from specific files to maintain tree-shaking
// Server-side: import from '@pleeno/database/server'
// Client-side: import from '@pleeno/database/client'

export * from './server'
export * from './client'
