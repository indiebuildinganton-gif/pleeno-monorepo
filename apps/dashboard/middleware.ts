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

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value
        },
        set(name: string, value: string, options: any) {
          // In development, set domain to 'localhost' to share cookies across ports
          const isDev = process.env.NODE_ENV === 'development'
          const cookieOptions = isDev
            ? { ...options, domain: 'localhost' }
            : options

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
          // In development, set domain to 'localhost' to remove cookies across ports
          const isDev = process.env.NODE_ENV === 'development'
          const cookieOptions = isDev
            ? { ...options, domain: 'localhost' }
            : options

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

  // Refresh session if expired - this will auto-refresh the token
  const {
    data: { user },
  } = await supabase.auth.getUser()

  // Skip auth check for API routes - they handle their own auth via requireRole
  const isApiRoute = request.nextUrl.pathname.startsWith('/dashboard/api')

  if (!isApiRoute && !user) {
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
    '/dashboard/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
