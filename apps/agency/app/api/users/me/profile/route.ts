import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@pleeno/database'
import { handleApiError, UnauthorizedError } from '@pleeno/utils'
import { ProfileUpdateSchema } from '@pleeno/validations'

/**
 * PATCH /api/users/me/profile
 *
 * Updates the authenticated user's profile information (full_name, email_notifications_enabled).
 *
 * Request body:
 * {
 *   full_name?: string
 *   email_notifications_enabled?: boolean
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

    // Build update object with only provided fields
    const updateData: Record<string, any> = {
      updated_at: new Date().toISOString(),
    }

    if (validatedData.full_name !== undefined) {
      updateData.full_name = validatedData.full_name
    }

    if (validatedData.email_notifications_enabled !== undefined) {
      updateData.email_notifications_enabled = validatedData.email_notifications_enabled
    }

    // Update user profile
    // RLS policies ensure user can only update their own profile
    const { data: updatedUser, error } = await supabase
      .from('users')
      .update(updateData)
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
