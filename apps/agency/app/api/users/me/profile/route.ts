import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@pleeno/database'
import { handleApiError, UnauthorizedError } from '@pleeno/utils'
import { ProfileUpdateSchema } from '@pleeno/validations'

/**
 * PATCH /api/users/me/profile
 *
 * Updates the authenticated user's profile information (full_name).
 *
 * Request body:
 * {
 *   full_name: string
 * }
 *
 * Response:
 * {
 *   success: true,
 *   data: User
 * }
 *
 * Auth: Required - any authenticated user
 *
 * Security: User can only update their own profile (enforced by RLS)
 */
export async function PATCH(request: NextRequest) {
  try {
    const supabase = await createServerClient()

    // Verify authentication
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      throw new UnauthorizedError('Not authenticated')
    }

    // Parse and validate request body
    const body = await request.json()
    const validatedData = ProfileUpdateSchema.parse(body)

    // Update user profile
    // RLS policies ensure user can only update their own profile
    const { data: updatedUser, error } = await supabase
      .from('users')
      .update({
        full_name: validatedData.full_name,
        updated_at: new Date().toISOString(),
      })
      .eq('id', user.id)
      .select()
      .single()

    if (error) {
      throw error
    }

    return NextResponse.json({
      success: true,
      data: updatedUser,
    })
  } catch (error) {
    return handleApiError(error)
  }
}
