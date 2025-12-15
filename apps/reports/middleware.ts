/**
 * Reports Zone Middleware for Authentication
 *
 * This middleware:
 * - Validates JWT tokens and refreshes them automatically
 * - Handles authentication state across multi-zone setup
 * - Redirects unauthenticated users to login
 *
 * Important: In development, each zone runs on a separate port.
 * Access the reports zone through the shell app at http://localhost:3005/reports
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
  const isApiRoute = request.nextUrl.pathname.startsWith('/reports/api')

  if (!isApiRoute && !user) {
    const isDev = process.env.NODE_ENV === 'development'
    const shellUrl = isDev
      ? 'http://localhost:3005'
      : process.env.NEXT_PUBLIC_SHELL_URL || 'https://app.pleeno.com'

    const redirectUrl = new URL('/login', shellUrl)
    const originalPath = request.nextUrl.pathname.replace(/^\/reports/, '') || '/'
    redirectUrl.searchParams.set('redirectTo', `/reports${originalPath}`)

    return NextResponse.redirect(redirectUrl)
  }

  return response
}

export const config = {
  matcher: [
    '/reports/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
