/**
 * Dashboard Zone Middleware for Authentication
 *
 * This middleware:
 * - Validates JWT tokens and refreshes them automatically
 * - Handles authentication state across multi-zone setup
 * - Redirects unauthenticated users to login
 *
 * Important: In development, each zone runs on a separate port.
 * Access the dashboard through the shell app at http://localhost:3000/dashboard
 * to ensure cookies are properly shared.
 */

import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

  // Check if Supabase environment variables are configured
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    console.error("Supabase environment variables not configured")
    return response
  }

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value
        },
        set(name: string, value: string, options: any) {
          // Use custom domain for cookie sharing across subdomains
          const cookieDomain = process.env.NEXT_PUBLIC_COOKIE_DOMAIN
          const isDev = process.env.NODE_ENV === 'development'

          const cookieOptions = {
            ...options,
            ...(cookieDomain && { domain: cookieDomain }),
            ...(isDev && !cookieDomain && { domain: 'localhost' })
          }

          // Set cookie in request for current request
          request.cookies.set({
            name,
            value,
            ...cookieOptions,
          })
          // Set cookie in response for subsequent requests
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          })
          response.cookies.set({
            name,
            value,
            ...cookieOptions,
          })
        },
        remove(name: string, options: any) {
          // Use custom domain for cookie removal across subdomains
          const cookieDomain = process.env.NEXT_PUBLIC_COOKIE_DOMAIN
          const isDev = process.env.NODE_ENV === 'development'

          const cookieOptions = {
            ...options,
            ...(cookieDomain && { domain: cookieDomain }),
            ...(isDev && !cookieDomain && { domain: 'localhost' })
          }

          // Remove cookie in request
          request.cookies.set({
            name,
            value: '',
            ...cookieOptions,
          })
          // Remove cookie in response
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          })
          response.cookies.set({
            name,
            value: '',
            ...cookieOptions,
          })
        },
      },
    }
  )

  // Check if we're already authenticated via the shell proxy headers
  const isAuthenticatedViaShell = request.headers.get('x-authenticated') === 'true'
  const shellUserId = request.headers.get('x-user-id')
  const shellUserEmail = request.headers.get('x-user-email')

  // Refresh session if expired - this will auto-refresh the token
  const {
    data: { user },
  } = await supabase.auth.getUser()

  // Trust the shell's authentication headers if present
  const isAuthenticated = user || isAuthenticatedViaShell

  if (user || isAuthenticatedViaShell) {
    // Pass user info via headers to API routes to avoid double-refresh race condition
    const requestHeaders = new Headers(request.headers)

    // Use actual user data if available, otherwise use shell headers
    const userId = user?.id || shellUserId || ''
    const userEmail = user?.email || shellUserEmail || ''

    if (userId) {
      requestHeaders.set('x-user-id', userId)
    }
    if (userEmail) {
      requestHeaders.set('x-user-email', userEmail)
    }

    if (user) {
      const userRole = (user.app_metadata?.role || user.user_metadata?.role) as string
      if (userRole) {
        requestHeaders.set('x-user-role', userRole)
      }

      const agencyId = (user.app_metadata?.agency_id || user.user_metadata?.agency_id) as string
      if (agencyId) {
        requestHeaders.set('x-user-agency-id', agencyId)
      }
    }

    // Create a new response with the updated request headers
    // This ensures the API route receives these headers
    const newResponse = NextResponse.next({
      request: {
        headers: requestHeaders,
      },
    })

    // Copy cookies from the previous response (which may have been updated by Supabase)
    // to the new response
    response.cookies.getAll().forEach((cookie) => {
      newResponse.cookies.set(cookie)
    })

    console.log('[Middleware] Setting headers for user:', userId)
    console.log('[Middleware] Request path:', request.nextUrl.pathname)

    response = newResponse
  } else {
    console.log('[Middleware] No user found')
  }

  // Skip auth check for API routes - they handle their own auth via requireRole
  const isApiRoute = request.nextUrl.pathname.startsWith('/dashboard/api')

  if (!isApiRoute && !isAuthenticated) {
    // Redirect to shell zone login
    const isDev = process.env.NODE_ENV === 'development'
    const shellUrl = isDev
      ? 'http://localhost:3000'
      : process.env.NEXT_PUBLIC_SHELL_URL || 'https://app.pleeno.com'

    const redirectUrl = new URL('/login', shellUrl)
    // Store the original URL to redirect back after login
    // Remove the /dashboard basePath prefix for the redirect
    const originalPath = request.nextUrl.pathname.replace(/^\/dashboard/, '') || '/'
    redirectUrl.searchParams.set('redirectTo', `/dashboard${originalPath}`)

    return NextResponse.redirect(redirectUrl)
  }

  return response
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/dashboard/:path*',
    '/api/:path*',
  ],
}
