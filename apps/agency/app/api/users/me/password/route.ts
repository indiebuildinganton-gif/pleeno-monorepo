import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@pleeno/database'
import { handleApiError, UnauthorizedError, ValidationError } from '@pleeno/utils'
import { PasswordChangeSchema } from '@pleeno/validations'

/**
 * PATCH /api/users/me/password
 *
 * Allows authenticated users to change their password.
 *
 * Security requirements:
 * - Verifies current password before allowing change
 * - Enforces password strength requirements (min 8 chars, uppercase, lowercase, number, special char)
 * - Logs password change in audit trail (without password values)
 *
 * @param request - Next.js request object
 * @returns JSON response with success message or error
 */
export async function PATCH(request: NextRequest) {
  try {
    const supabase = await createServerClient()

    // Verify authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      throw new UnauthorizedError('Not authenticated')
    }

    // Validate request body
    const body = await request.json()
    const validatedData = PasswordChangeSchema.parse(body)

    // Verify current password by attempting to sign in
    // This ensures the user knows their current password before changing it
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: user.email!,
      password: validatedData.current_password
    })

    if (signInError) {
      throw new ValidationError('Current password is incorrect')
    }

    // Update password using Supabase Auth
    // Supabase handles password hashing (bcrypt) automatically
    const { error: updateError } = await supabase.auth.updateUser({
      password: validatedData.new_password
    })

    if (updateError) {
      throw updateError
    }

    // Log password change in audit trail (without password values)
    // This creates an immutable record of the password change for security auditing
    await supabase.from('audit_log').insert({
      entity_type: 'user',
      entity_id: user.id,
      user_id: user.id,
      action: 'password_changed',
      changes_json: { timestamp: new Date().toISOString() }
    })

    return NextResponse.json({
      success: true,
      data: { message: 'Password changed successfully' }
    })
  } catch (error) {
    return handleApiError(error)
  }
}
