/**
 * Payments Zone Middleware for Authentication
 *
 * This middleware:
 * - Validates JWT tokens and refreshes them automatically
 * - Handles authentication state across multi-zone setup
 * - Redirects unauthenticated users to login
 *
 * Important: In development, each zone runs on a separate port.
 * Access the payments zone through the shell app at http://localhost:3005/payments
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
          const isDev = process.env.NODE_ENV === 'development'
          const cookieOptions = isDev ? { ...options, domain: 'localhost' } : options

          request.cookies.set({ name, value, ...cookieOptions })
          response = NextResponse.next({ request: { headers: request.headers } })
          response.cookies.set({ name, value, ...cookieOptions })
        },
        remove(name: string, options: any) {
          const isDev = process.env.NODE_ENV === 'development'
          const cookieOptions = isDev ? { ...options, domain: 'localhost' } : options

          request.cookies.set({ name, value: '', ...cookieOptions })
          response = NextResponse.next({ request: { headers: request.headers } })
          response.cookies.set({ name, value: '', ...cookieOptions })
        },
      },
    }
  )

  // Refresh session if expired
  const {
    data: { user },
  } = await supabase.auth.getUser()

  // Skip auth check for API routes
  const isStandalone = process.env.STANDALONE_MODE === 'true'
  const isApiRoute = isStandalone
    ? request.nextUrl.pathname.startsWith('/api')
    : request.nextUrl.pathname.startsWith('/payments/api')

  // In standalone mode, skip auth entirely for development
  if (isStandalone) {
    // Allow development without authentication
    // In production, standalone mode should not be used
    return response
  }

  if (!isApiRoute && !user) {
    const isDev = process.env.NODE_ENV === 'development'
    const shellUrl = isDev
      ? 'http://localhost:3005'
      : process.env.NEXT_PUBLIC_SHELL_URL || 'https://app.pleeno.com'

    const redirectUrl = new URL('/login', shellUrl)
    const originalPath = request.nextUrl.pathname.replace(/^\/payments/, '') || '/'
    redirectUrl.searchParams.set('redirectTo', `/payments${originalPath}`)

    return NextResponse.redirect(redirectUrl)
  }

  return response
}

// Support both standalone mode (root paths) and multi-zone mode (/payments paths)
export const config = {
  matcher: [
    // Standalone mode: match root paths
    '/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
    // Multi-zone mode: match /payments paths
    '/payments/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
