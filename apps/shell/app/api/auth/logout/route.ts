/**
 * User Logout API Route
 *
 * Handles user logout with the following flow:
 * 1. Signs out user via Supabase Auth
 * 2. Clears JWT tokens from HTTP-only cookies
 * 3. Invalidates the current session
 */

import { createServerClient } from '@pleeno/database/server'
import { NextResponse } from 'next/server'

export async function POST() {
  try {
    const supabase = await createServerClient()

    // Sign out user and clear cookies
    const { error } = await supabase.auth.signOut()

    if (error) {
      console.error('Logout error:', error)
      return NextResponse.json(
        { error: 'Logout failed' },
        { status: 500 }
      )
    }

    // HTTP-only cookies are automatically cleared by Supabase
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Logout error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
