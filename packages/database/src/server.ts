/**
 * Server-side Supabase client for Next.js Server Components and API Routes
 *
 * This client handles authentication via HTTP-only cookies and is designed
 * for server-side usage only. It supports JWT token management and automatic
 * cookie handling for authentication state.
 *
 * @module packages/database/src/server
 */

import { createServerClient as createSupabaseServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import type { CookieOptions } from '@supabase/ssr'

/**
 * Creates a Supabase client for server-side usage in Next.js
 *
 * This function creates a Supabase client that:
 * - Reads authentication state from HTTP-only cookies
 * - Handles JWT token refresh automatically
 * - Works with Next.js Server Components and API Routes
 * - Integrates with Row-Level Security (RLS) policies
 *
 * Usage in Server Components:
 * - Import this function in a Server Component
 * - Call await createServerClient() to get a Supabase instance
 * - Use async/await to query data
 * - RLS policies will automatically filter by user's agency_id
 *
 * Usage in API Routes:
 * - Import this function in a route handler
 * - Call await createServerClient() to get a Supabase instance
 * - Check authentication with supabase.auth.getUser()
 * - Query data with RLS applied automatically
 *
 * @returns A configured Supabase client for server-side usage
 */
export async function createServerClient() {
  const cookieStore = await cookies()

  return createSupabaseServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        /**
         * Gets a cookie value by name
         * Used by Supabase to read authentication state
         */
        get(name: string) {
          return cookieStore.get(name)?.value
        },
        /**
         * Sets a cookie with the specified name, value, and options
         * Used by Supabase to store JWT tokens and session data
         */
        set(name: string, value: string, options: CookieOptions) {
          try {
            cookieStore.set({ name, value, ...options })
          } catch (error) {
            // Handle cookie setting errors in middleware
            // This can happen when cookies are set after headers are sent
            console.error('Error setting cookie:', error)
          }
        },
        /**
         * Removes a cookie by name
         * Used by Supabase to clear authentication state on logout
         */
        remove(name: string, options: CookieOptions) {
          try {
            cookieStore.set({ name, value: '', ...options })
          } catch (error) {
            // Handle cookie removal errors in middleware
            console.error('Error removing cookie:', error)
          }
        },
      },
    }
  )
}

/**
 * Type helper to extract the Supabase client type
 * Use this when you need to type a Supabase client instance
 */
export type ServerClient = Awaited<ReturnType<typeof createServerClient>>
