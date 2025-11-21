/**
 * User Login API Route
 *
 * Handles user authentication with the following flow:
 * 1. Validates input data (email, password)
 * 2. Authenticates user via Supabase Auth
 * 3. Returns user and session data
 * 4. JWT tokens are stored in HTTP-only cookies with domain='localhost' for dev
 */

import { createAPIRouteClient } from '@pleeno/database/api-route'
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'

/**
 * Login validation schema
 * - Email: Valid email format
 * - Password: Required
 */
const loginSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z.string().min(1, 'Password is required'),
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, password } = loginSchema.parse(body)

    // Create Supabase client for API routes
    const { supabase, response: applyAuthCookies } = createAPIRouteClient(request)

    // Authenticate user with Supabase
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) {
      return NextResponse.json(
        { error: 'Invalid credentials' },
        { status: 401 }
      )
    }

    // Create response with user data
    const response = NextResponse.json({
      user: data.user,
      session: data.session,
    })

    // Apply auth cookies to the response (including domain='localhost' for dev)
    const finalResponse = applyAuthCookies(response)

    // Debug: Log all cookies being set
    console.log('🍪 Login - Cookies being set:')
    finalResponse.cookies.getAll().forEach(cookie => {
      console.log(`  ${cookie.name}: value length=${cookie.value.length}`)
    })

    return finalResponse
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues }, { status: 400 })
    }
    console.error('Login error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
