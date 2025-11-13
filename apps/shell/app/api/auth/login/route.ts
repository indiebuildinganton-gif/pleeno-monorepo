/**
 * User Login API Route
 *
 * Handles user authentication with the following flow:
 * 1. Validates input data (email, password)
 * 2. Authenticates user via Supabase Auth
 * 3. Returns user and session data
 * 4. JWT tokens are automatically stored in HTTP-only cookies by Supabase
 */

import { createServerClient } from '@pleeno/database/server'
import { NextResponse } from 'next/server'
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

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { email, password } = loginSchema.parse(body)

    const supabase = await createServerClient()

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

    // JWT tokens are automatically stored in HTTP-only cookies
    // by the Supabase client cookie handlers
    return NextResponse.json({
      user: data.user,
      session: data.session,
    })
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
