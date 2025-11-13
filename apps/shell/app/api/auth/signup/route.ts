/**
 * User Registration API Route
 *
 * Handles new user registration with the following flow:
 * 1. Validates input data (email, password, full_name, agency_name)
 * 2. Creates auth.users record via Supabase Auth
 * 3. Determines if this is the first user (becomes agency_admin)
 * 4. Creates agency record if first user
 * 5. Creates public.users record with role assignment
 * 6. Updates JWT metadata with agency_id and role
 */

import { createServerClient } from '@pleeno/database/server'
import { NextResponse } from 'next/server'
import { z } from 'zod'

/**
 * Signup validation schema
 * - Email: Valid email format
 * - Password: Minimum 8 chars, must contain uppercase, lowercase, and number
 * - Full name: Required
 * - Agency name: Required (creates agency if first user)
 */
const signupSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z.string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password must contain uppercase letter')
    .regex(/[a-z]/, 'Password must contain lowercase letter')
    .regex(/[0-9]/, 'Password must contain number'),
  full_name: z.string().min(1, 'Full name is required'),
  agency_name: z.string().min(1, 'Agency name is required'),
})

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { email, password, full_name, agency_name } = signupSchema.parse(body)

    const supabase = await createServerClient()

    // 1. Create auth user
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name,
        },
      },
    })

    if (authError) {
      return NextResponse.json({ error: authError.message }, { status: 400 })
    }

    if (!authData.user) {
      return NextResponse.json({ error: 'Failed to create user' }, { status: 500 })
    }

    // 2. Check if this is first user (agency admin)
    const { count: userCount } = await supabase
      .from('users')
      .select('*', { count: 'exact', head: true })

    const isFirstUser = userCount === 0

    // 3. Create agency if first user
    let agencyId: string

    if (isFirstUser) {
      const { data: agencyData, error: agencyError } = await supabase
        .from('agencies')
        .insert({ name: agency_name })
        .select()
        .single()

      if (agencyError || !agencyData) {
        return NextResponse.json({ error: 'Failed to create agency' }, { status: 500 })
      }
      agencyId = agencyData.id
    } else {
      // For non-first users, we would need to get the agency_id from context
      // For now, this is a limitation - subsequent users would need an invite flow
      return NextResponse.json({
        error: 'Public signup is disabled. Please contact your agency administrator for an invite.'
      }, { status: 403 })
    }

    // 4. Create user record
    const { error: userError } = await supabase
      .from('users')
      .insert({
        id: authData.user.id,
        email,
        full_name,
        agency_id: agencyId,
        role: isFirstUser ? 'agency_admin' : 'agency_user',
      })

    if (userError) {
      return NextResponse.json({ error: 'Failed to create user record' }, { status: 500 })
    }

    // 5. Update JWT metadata with agency_id and role
    const { error: updateError } = await supabase.auth.updateUser({
      data: {
        agency_id: agencyId,
        role: isFirstUser ? 'agency_admin' : 'agency_user',
      },
    })

    if (updateError) {
      console.error('Failed to update user metadata:', updateError)
    }

    return NextResponse.json({
      user: authData.user,
      session: authData.session,
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues }, { status: 400 })
    }
    console.error('Signup error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
