# Task 5: Implement Authentication Middleware

## Story Context
**Story 1.3**: Authentication & Authorization Framework
**As a** developer, **I want** an authentication system with role-based access control, **so that** users can securely log in and access features based on their roles.

## Task Objective
Create Next.js middleware to protect routes, validate JWT tokens, handle token refresh, and manage multi-zone cookie sharing.

## Acceptance Criteria Addressed
- AC 4: Authentication middleware protects API routes and pages

## Subtasks
- [ ] Create middleware.ts in apps/shell/
- [ ] Validate JWT on protected routes (/dashboard/*, /agency/*, /entities/*, /payments/*, /reports/*)
- [ ] Redirect unauthenticated users to /login
- [ ] Refresh expired tokens automatically
- [ ] Handle cookie updates across multi-zones (shared cookie domain)

## Implementation Guide

### 1. Create Middleware
**File**: `apps/shell/middleware.ts`

```typescript
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
          // Set cookie in request for current request
          request.cookies.set({
            name,
            value,
            ...options,
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
            ...options,
          })
        },
        remove(name: string, options: any) {
          // Remove cookie in request
          request.cookies.set({
            name,
            value: '',
            ...options,
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
            ...options,
          })
        },
      },
    }
  )

  // Refresh session if expired - this will auto-refresh the token
  const {
    data: { user },
  } = await supabase.auth.getUser()

  // Protected routes require authentication
  const isProtectedRoute =
    request.nextUrl.pathname.startsWith('/dashboard') ||
    request.nextUrl.pathname.startsWith('/agency') ||
    request.nextUrl.pathname.startsWith('/entities') ||
    request.nextUrl.pathname.startsWith('/payments') ||
    request.nextUrl.pathname.startsWith('/reports')

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

  if (isAuthRoute && user) {
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
```

### 2. Update Login to Handle Redirect
**File**: `apps/shell/app/(auth)/login/page.tsx` (update)

```typescript
'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
// ... rest of imports

export default function LoginPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const redirectTo = searchParams.get('redirectTo') || '/dashboard'

  // ... rest of component

  const onSubmit = async (data: LoginFormData) => {
    try {
      setLoading(true)
      setError(null)

      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Login failed')
      }

      // Redirect to original destination or dashboard
      router.push(redirectTo)
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  // ... rest of component
}
```

### 3. Create Root Redirect Page
**File**: `apps/shell/app/page.tsx`

```typescript
import { redirect } from 'next/navigation'
import { createServerClient } from '@pleeno/database/server'

export default async function RootPage() {
  const supabase = createServerClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (user) {
    redirect('/dashboard')
  } else {
    redirect('/login')
  }
}
```

### 4. Multi-Zone Cookie Configuration (Optional)
If using multi-zone routing (multiple Next.js apps), ensure cookies are shared:

**File**: `next.config.js` (in each zone)

```javascript
/** @type {import('next').NextConfig} */
const nextConfig = {
  // Ensure cookies work across subdomains
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'Set-Cookie',
            value: 'SameSite=Lax; Secure',
          },
        ],
      },
    ]
  },
}

module.exports = nextConfig
```

### 5. Environment Variables Check
Ensure `.env.local` has:

```bash
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

## Architecture Context
- Middleware runs on every request matching the config matcher
- JWT validation and refresh happen automatically via `supabase.auth.getUser()`
- Cookies are HTTP-only and SameSite=Lax for security
- Multi-zone apps share cookies via same domain

## Protected Routes
The middleware protects these route patterns:
- `/dashboard/*` - Main dashboard
- `/agency/*` - Agency management (admin only)
- `/entities/*` - Entity management
- `/payments/*` - Payment processing
- `/reports/*` - Reporting features

## Middleware Flow
1. Extract cookies from request
2. Create Supabase client with cookie handlers
3. Call `getUser()` to validate JWT and refresh if needed
4. Check if route requires authentication
5. Redirect to `/login` if unauthenticated
6. Allow request to proceed if authenticated
7. Update response cookies with any token changes

## Security Features
- ✅ JWT validation on every protected request
- ✅ Automatic token refresh for expired sessions
- ✅ HTTP-only cookies prevent XSS attacks
- ✅ SameSite=Lax prevents CSRF attacks
- ✅ Redirect loop prevention
- ✅ Original URL preservation for post-login redirect

## Prerequisites
- Task 1 completed (Supabase Auth integration)
- Task 3 completed (Login/logout flows)

## Validation
- [ ] Unauthenticated access to /dashboard redirects to /login
- [ ] Authenticated access to /dashboard is allowed
- [ ] All protected routes require authentication
- [ ] Token refresh works for expired sessions
- [ ] Cookies are set with HTTP-only and SameSite flags
- [ ] Login redirects to original requested URL
- [ ] No redirect loops between /login and /dashboard

## Testing Scenarios
1. **Test Unauthenticated Access**:
   - Navigate to /dashboard → Should redirect to /login

2. **Test Authenticated Access**:
   - Log in → Should access /dashboard
   - Navigate to /agency → Should work if admin

3. **Test Token Refresh**:
   - Wait for token to expire (1 hour default)
   - Navigate to protected route → Should refresh automatically

4. **Test Redirect After Login**:
   - Go to /entities while logged out → Redirects to /login?redirectTo=/entities
   - Log in → Should redirect to /entities

5. **Test Auth Page Access**:
   - While logged in, go to /login → Should redirect to /dashboard

## Next Steps
After completing this task, proceed to Task 6: Implement Agency Context Setting.
