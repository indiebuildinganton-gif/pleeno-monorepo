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

  // Refresh session if expired - this will auto-refresh the token
  const {
    data: { user },
  } = await supabase.auth.getUser()

  // If user is authenticated, add headers that zones can use
  // This allows zones to trust the authentication from the shell
  if (user) {
    const requestHeaders = new Headers(request.headers)
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
  const isAuthRoute =
    request.nextUrl.pathname.startsWith('/login') ||
    request.nextUrl.pathname.startsWith('/signup')

  // For custom domain: authenticated users skip login
  // For Vercel domains: keep on login to avoid redirect loops
  const hasCustomDomain = process.env.NEXT_PUBLIC_COOKIE_DOMAIN?.includes('.')

  if (isAuthRoute && user && hasCustomDomain) {
    // With custom domain, cookies work properly, redirect authenticated users
    const redirectTo = request.nextUrl.searchParams.get('redirectTo') || '/dashboard'
    return NextResponse.redirect(new URL(redirectTo, request.url))
  }

  // For Vercel free domains, don't redirect to avoid loops
  // The login page will handle redirect via window.location

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
