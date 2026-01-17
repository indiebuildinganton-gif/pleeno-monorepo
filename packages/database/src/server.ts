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
 * Interface for request objects with cookies
 * Uses structural typing to avoid Next.js version conflicts between packages
 */
interface RequestWithCookies {
  cookies: {
    get(name: string): { value: string } | undefined
  }
}

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
          const value = cookieStore.get(name)?.value
          // Debug logging for auth cookie reads
          if (name.includes('auth-token')) {
            console.log(`🍪 [Server Client] Reading cookie ${name}:`, {
              found: !!value,
              valueLength: value?.length || 0,
              valuePrefix: value?.substring(0, 40),
              hasBase64Prefix: value?.startsWith('base64-')
            })
          }
          return value
        },
        /**
         * Sets a cookie with the specified name, value, and options
         * Used by Supabase to store JWT tokens and session data
         */
        set(name: string, value: string, options: CookieOptions) {
          try {
            // Set cookie domain to allow cross-zone/cross-port sharing
            const isProd = process.env.NODE_ENV === 'production'
            const isDev = process.env.NODE_ENV === 'development'

            const cookieOptions = isProd
              ? {
                  name,
                  value,
                  ...options,
                  domain: process.env.NEXT_PUBLIC_COOKIE_DOMAIN || process.env.COOKIE_DOMAIN || '.plenno.com.au',
                }
              : isDev
              ? {
                  name,
                  value,
                  ...options,
                  // In development, set domain to 'localhost' (without port)
                  // This allows cookies to be shared across all localhost ports
                  domain: 'localhost',
                }
              : { name, value, ...options }

            cookieStore.set(cookieOptions)
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
            const isProd = process.env.NODE_ENV === 'production'
            const isDev = process.env.NODE_ENV === 'development'

            const cookieOptions = isProd
              ? {
                  name,
                  value: '',
                  ...options,
                  domain: process.env.NEXT_PUBLIC_COOKIE_DOMAIN || process.env.COOKIE_DOMAIN || '.plenno.com.au',
                }
              : isDev
              ? {
                  name,
                  value: '',
                  ...options,
                  domain: 'localhost',
                }
              : { name, value: '', ...options }

            cookieStore.set(cookieOptions)
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
 * Creates a Supabase client for API routes using request.cookies
 *
 * IMPORTANT: Use this in API routes instead of createServerClient() when handling
 * cross-subdomain authentication, because cookies() from next/headers doesn't work
 * for cross-subdomain cookies in Vercel deployments.
 *
 * The issue:
 * - cookies() from next/headers doesn't find cross-subdomain cookies in Vercel
 * - request.cookies (from NextRequest) DOES find the cookies
 * - This function bridges that gap for API route handlers
 *
 * @param request - A request object with cookies (NextRequest or similar)
 * @returns A configured Supabase client that reads cookies from the request
 *
 * @example
 * ```typescript
 * import { createServerClientFromRequest } from '@pleeno/database/server'
 *
 * export async function GET(request: NextRequest) {
 *   const supabase = createServerClientFromRequest(request)
 *   const { data: { user } } = await supabase.auth.getUser()
 *   // ...
 * }
 * ```
 */
export function createServerClientFromRequest(request: RequestWithCookies) {
  return createSupabaseServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        /**
         * Gets a cookie value by name from the request
         * Used by Supabase to read authentication state
         */
        get(name: string) {
          const value = request.cookies.get(name)?.value
          // Debug logging for auth cookie reads
          if (name.includes('auth-token')) {
            console.log(`🍪 [Server Client From Request] Reading cookie ${name}:`, {
              found: !!value,
              valueLength: value?.length || 0,
              valuePrefix: value?.substring(0, 40),
              hasBase64Prefix: value?.startsWith('base64-')
            })
          }
          return value
        },
        /**
         * Sets a cookie - no-op for request-based client
         * Cookie setting must be handled by the response
         */
        set(_name: string, _value: string, _options: CookieOptions) {
          // Cannot set cookies on request, this is handled by response
          // This is expected behavior for read-only request cookie access
        },
        /**
         * Removes a cookie - no-op for request-based client
         * Cookie removal must be handled by the response
         */
        remove(_name: string, _options: CookieOptions) {
          // Cannot remove cookies on request, this is handled by response
          // This is expected behavior for read-only request cookie access
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

/**
 * Set agency context in database session
 * Call this before executing RLS-protected queries to ensure proper filtering
 *
 * This function calls the database function `set_agency_context()` which:
 * - Extracts the current user's agency_id from the users table
 * - Sets a PostgreSQL session variable `app.current_agency_id`
 * - Makes the agency_id available to RLS policies
 *
 * @param client - The Supabase server client instance
 *
 * @example
 * ```typescript
 * const supabase = await createServerClient()
 * await setAgencyContext(supabase)
 * // Now RLS policies can use the agency context
 * const { data } = await supabase.from('users').select('*')
 * ```
 */
export async function setAgencyContext(
  client: ServerClient
): Promise<void> {
  try {
    // Call database function to set session variable
    const { error } = await client.rpc('set_agency_context')

    if (error) {
      console.error('Failed to set agency context:', error)
    }
  } catch (err) {
    console.error('Error setting agency context:', err)
  }
}
