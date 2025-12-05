/**
 * Next.js Middleware for Authentication
 *
 * This middleware:
 * - Validates JWT tokens on protected routes
 * - Automatically refreshes expired tokens
 * - Redirects unauthenticated users to login
 * - Redirects authenticated users away from auth pages
 * - Preserves original URL for post-login redirect
 * - Handles cookie updates across multi-zone routing
 *
 * Protected Routes:
 * - /dashboard/* - Main dashboard
 * - /agency/* - Agency management (admin only)
 * - /entities/* - Entity management
 * - /payments/* - Payment processing
 * - /reports/* - Reporting features
 *
 * Security Features:
 * - HTTP-only cookies prevent XSS attacks
 * - SameSite=Lax prevents CSRF attacks
 * - Automatic token refresh for expired sessions
 * - Redirect loop prevention
 */

import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  // Clone headers to modify them
  const requestHeaders = new Headers(request.headers)

  let response = NextResponse.next({
    request: {
      headers: requestHeaders,
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

  // If user is authenticated, add headers that zones can use
  // This allows zones to trust the authentication from the shell
  if (user) {
    requestHeaders.set('x-user-id', user.id)
    requestHeaders.set('x-user-email', user.email || '')
    requestHeaders.set('x-authenticated', 'true')

    // Update response with new headers
    response = NextResponse.next({
      request: {
        headers: requestHeaders,
      },
    })
  }

  // Protected routes require authentication
  // API routes are excluded from auth checks as they handle auth internally
  const isApiRoute =
    request.nextUrl.pathname.startsWith('/api/') ||
    request.nextUrl.pathname.startsWith('/entities/api/') ||
    request.nextUrl.pathname.startsWith('/payments/api/')

  const isProtectedRoute = !isApiRoute && (
    request.nextUrl.pathname.startsWith('/dashboard') ||
    request.nextUrl.pathname.startsWith('/agency') ||
    request.nextUrl.pathname.startsWith('/entities') ||
    request.nextUrl.pathname.startsWith('/payments') ||
    request.nextUrl.pathname.startsWith('/reports')
  )

  // Redirect to login if accessing protected route without auth
  if (isProtectedRoute && !user) {
    const redirectUrl = new URL('/login', request.url)
    // Store the original URL to redirect back after login
    redirectUrl.searchParams.set('redirectTo', request.nextUrl.pathname)
    return NextResponse.redirect(redirectUrl)
  }

  // Redirect to dashboard if accessing auth pages while authenticated
  // BUT: Don't redirect if we're on login page with a redirectTo parameter
  // This prevents redirect loops when dashboard redirects back to login
  const isAuthRoute =
    request.nextUrl.pathname.startsWith('/login') ||
    request.nextUrl.pathname.startsWith('/signup')

  // Check if we have a redirectTo parameter (indicating we came from a protected route)
  const hasRedirectTo = request.nextUrl.searchParams.has('redirectTo')

  // Only redirect away from auth pages if user is authenticated AND
  // we're not in the middle of a redirect flow
  if (isAuthRoute && user && !hasRedirectTo) {
    return NextResponse.redirect(new URL('/dashboard', request.url))
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
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
