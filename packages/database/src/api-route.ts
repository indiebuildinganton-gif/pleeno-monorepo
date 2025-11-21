/**
 * Supabase client for API Routes
 *
 * This creates a Supabase client specifically for Next.js API Route Handlers.
 * Unlike Server Components, API routes need to set cookies on the Response object.
 *
 * @module packages/database/src/api-route
 */

import { createServerClient as createSupabaseSSRClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'
import type { CookieOptions } from '@supabase/ssr'

/**
 * Creates a Supabase client for API Route Handlers
 *
 * This function handles cookies differently than Server Components:
 * - Reads cookies from the request
 * - Returns a cookiesToSet array that you must apply to the response
 *
 * @param request - Next.js request object
 * @returns Object with supabase client and cookies to set on response
 *
 * @example
 * ```typescript
 * export async function POST(request: NextRequest) {
 *   const { supabase, response } = createAPIRouteClient(request)
 *
 *   const { data, error } = await supabase.auth.signInWithPassword({
 *     email, password
 *   })
 *
 *   // Return the response object which has cookies set
 *   return response(NextResponse.json({ data }))
 * }
 * ```
 */
export function createAPIRouteClient(request: NextRequest) {
  const cookieStore: Map<string, { value: string; options: CookieOptions }> = new Map()

  const supabase = createSupabaseSSRClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          // Try to get from store first (newly set cookies)
          const stored = cookieStore.get(name)
          if (stored) return stored.value

          // Otherwise get from request
          return request.cookies.get(name)?.value
        },
        set(name: string, value: string, options: CookieOptions) {
          // Store cookies to be set on response
          const isDev = process.env.NODE_ENV === 'development'
          const cookieOptions = isDev
            ? { ...options, domain: 'localhost' }
            : options

          cookieStore.set(name, { value, options: cookieOptions })
        },
        remove(name: string, options: CookieOptions) {
          // Store cookie removal to be applied to response
          const isDev = process.env.NODE_ENV === 'development'
          const cookieOptions = isDev
            ? { ...options, domain: 'localhost' }
            : options

          cookieStore.set(name, { value: '', options: { ...cookieOptions, maxAge: 0 } })
        },
      },
    }
  )

  /**
   * Helper function to apply cookies to a response
   * Call this with your NextResponse to add auth cookies
   */
  const applyCookies = (response: NextResponse) => {
    console.log('🍪 [API Route Client] Setting cookies:')
    cookieStore.forEach(({ value, options }, name) => {
      // Explicitly set cookies using Set-Cookie header for better control
      // This ensures domain and other attributes are properly set
      const cookieString = serializeCookie(name, value, options)
      console.log(`  ${name}:`, {
        domain: options.domain || '(not set)',
        path: options.path || '/',
        httpOnly: options.httpOnly ?? false,
        sameSite: options.sameSite || 'lax'
      })
      response.headers.append('Set-Cookie', cookieString)
    })
    return response
  }

  /**
   * Serialize cookie to Set-Cookie header format
   */
  function serializeCookie(name: string, value: string, options: CookieOptions): string {
    let cookie = `${name}=${value}`

    if (options.maxAge) {
      cookie += `; Max-Age=${options.maxAge}`
    }
    if (options.expires) {
      cookie += `; Expires=${options.expires instanceof Date ? options.expires.toUTCString() : options.expires}`
    }
    if (options.domain) {
      cookie += `; Domain=${options.domain}`
    }
    if (options.path) {
      cookie += `; Path=${options.path}`
    }
    if (options.httpOnly) {
      cookie += '; HttpOnly'
    }
    if (options.secure) {
      cookie += '; Secure'
    }
    if (options.sameSite) {
      cookie += `; SameSite=${options.sameSite}`
    }

    return cookie
  }

  return {
    supabase,
    response: applyCookies,
  }
}

/**
 * Alternative simpler API using async cookies()
 * This works but cookies might not persist across different ports in dev
 * Use createAPIRouteClient instead for better control
 */
export async function createServerClientForAPI() {
  const cookieStore = await cookies()

  return createSupabaseSSRClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value
        },
        set(name: string, value: string, options: CookieOptions) {
          try {
            const isDev = process.env.NODE_ENV === 'development'
            const cookieOptions = isDev
              ? {
                  name,
                  value,
                  ...options,
                  domain: 'localhost',
                }
              : { name, value, ...options }

            cookieStore.set(cookieOptions)
          } catch {
            // Setting cookies in API routes via cookies() might fail
            // This is expected - cookies should be set on Response instead
          }
        },
        remove(name: string, options: CookieOptions) {
          try {
            cookieStore.set({ name, value: '', ...options })
          } catch {
            // Expected - see above
          }
        },
      },
    }
  )
}
