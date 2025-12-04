/**
 * Debug endpoint for UAT authentication issues
 * This endpoint provides detailed information about the Supabase configuration
 * and attempts to diagnose authentication issues.
 */

import { createAPIRouteClient } from '@pleeno/database/api-route'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email = 'admin@test.local', password = 'password' } = body

    // Collect configuration information
    const config = {
      environment: {
        NODE_ENV: process.env.NODE_ENV,
        VERCEL_ENV: process.env.VERCEL_ENV,
        VERCEL_URL: process.env.VERCEL_URL,
      },
      supabase: {
        url: process.env.NEXT_PUBLIC_SUPABASE_URL,
        anon_key_present: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
        anon_key_prefix: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.substring(0, 30) + '...',
        anon_key_suffix: '...' + process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.substring(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY.length - 30),
        service_role_present: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
      },
      app: {
        app_url: process.env.NEXT_PUBLIC_APP_URL,
      }
    }

    // Create Supabase client
    const { supabase } = createAPIRouteClient(request)

    // Test 1: Check if we can query public.users
    let publicUserTest = { success: false, data: null, error: null }
    try {
      const { data, error } = await supabase
        .from('users')
        .select('id, email, role, agency_id, status')
        .eq('email', email)
        .single()

      publicUserTest = {
        success: !error,
        data: data,
        error: error?.message || null
      }
    } catch (e) {
      publicUserTest.error = e instanceof Error ? e.message : 'Unknown error'
    }

    // Test 2: Attempt authentication
    let authTest = { success: false, user: null, error: null, details: null }
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      authTest = {
        success: !error,
        user: data?.user ? {
          id: data.user.id,
          email: data.user.email,
          app_metadata: data.user.app_metadata,
          user_metadata: data.user.user_metadata,
        } : null,
        error: error?.message || null,
        details: error ? {
          name: error.name,
          status: error.status,
          code: error.code,
          // @ts-ignore - error might have additional properties
          __isAuthError: error.__isAuthError,
        } : null
      }
    } catch (e) {
      authTest.error = e instanceof Error ? e.message : 'Unknown error'
    }

    // Test 3: Check if we can get the current session (in case there's already one)
    let sessionTest = { success: false, session: null, error: null }
    try {
      const { data: { session }, error } = await supabase.auth.getSession()
      sessionTest = {
        success: !error,
        session: session ? {
          access_token_present: !!session.access_token,
          refresh_token_present: !!session.refresh_token,
          expires_at: session.expires_at,
          user_email: session.user?.email,
        } : null,
        error: error?.message || null
      }
    } catch (e) {
      sessionTest.error = e instanceof Error ? e.message : 'Unknown error'
    }

    // Test 4: Check agencies table (to verify foreign key constraint)
    let agencyTest = { success: false, data: null, error: null }
    try {
      const { data, error } = await supabase
        .from('agencies')
        .select('id, name')
        .eq('id', '20000000-0000-0000-0000-000000000001')
        .single()

      agencyTest = {
        success: !error,
        data: data,
        error: error?.message || null
      }
    } catch (e) {
      agencyTest.error = e instanceof Error ? e.message : 'Unknown error'
    }

    // Test 5: Raw RPC call to check auth.users (if we have service role key)
    let authUsersTest = { success: false, data: null, error: null, skipped: false }
    if (process.env.SUPABASE_SERVICE_ROLE_KEY) {
      try {
        // This would require creating a custom RPC function in Supabase
        // For now, we'll mark it as skipped
        authUsersTest.skipped = true
        authUsersTest.error = 'Service role key present but direct auth.users query not implemented'
      } catch (e) {
        authUsersTest.error = e instanceof Error ? e.message : 'Unknown error'
      }
    } else {
      authUsersTest.skipped = true
      authUsersTest.error = 'No service role key available'
    }

    const results = {
      timestamp: new Date().toISOString(),
      config,
      tests: {
        publicUserTest,
        authTest,
        sessionTest,
        agencyTest,
        authUsersTest,
      },
      summary: {
        user_exists_in_public: publicUserTest.success,
        auth_successful: authTest.success,
        likely_issue: determineIssue(publicUserTest, authTest, agencyTest),
      }
    }

    return NextResponse.json(results)
  } catch (error) {
    console.error('Debug endpoint error:', error)
    return NextResponse.json(
      {
        error: 'Debug endpoint failed',
        details: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined
      },
      { status: 500 }
    )
  }
}

function determineIssue(publicUserTest: any, authTest: any, agencyTest: any): string {
  if (!publicUserTest.success) {
    return 'User does not exist in public.users table or RLS policy is blocking access'
  }

  if (publicUserTest.success && !authTest.success) {
    if (authTest.error?.includes('Invalid login credentials')) {
      return 'User exists in public.users but auth.users record is missing or password mismatch'
    }
    if (authTest.error?.includes('Email not confirmed')) {
      return 'Email confirmation required - check email_confirmed_at in auth.users'
    }
    return `Authentication failed: ${authTest.error}`
  }

  if (!agencyTest.success) {
    return 'Agency record missing - this might cause foreign key constraint issues'
  }

  if (authTest.success) {
    return 'No issues detected - authentication should be working'
  }

  return 'Unable to determine specific issue'
}

export async function GET() {
  return NextResponse.json({
    message: 'Debug Auth Endpoint',
    usage: 'POST to this endpoint with optional { email, password } to test authentication',
    default_credentials: 'admin@test.local / password',
    endpoints: {
      debug: '/api/debug-auth',
      login: '/api/auth/login',
      config: '/api/check-config',
    }
  })
}