import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@pleeno/database/server'
import { handleApiError, ValidationError } from '@pleeno/utils'
import { createClient } from '@supabase/supabase-js'

/**
 * POST /api/users/verify-email?token=...
 *
 * Verifies email change via token and completes the email update.
 * This endpoint:
 * - Validates the verification token exists
 * - Checks token is not expired (1 hour expiration)
 * - Updates user's email to pending_email
 * - Sets email_verified_at timestamp
 * - Clears pending_email and email_verification_token
 * - Updates email in Supabase Auth via Admin API
 * - Logs completed email change in audit trail (via trigger)
 *
 * Security:
 * - Token-based authentication (no user session required)
 * - Tokens are single-use (cleared after verification)
 * - Tokens expire after 1 hour
 * - Email change logged in audit trail automatically
 *
 * @param request - Next.js request object
 * @returns JSON response with success message or error
 */
export async function POST(request: NextRequest) {
  try {
    // Extract token from query params
    const { searchParams } = new URL(request.url)
    const token = searchParams.get('token')

    if (!token) {
      throw new ValidationError('Verification token is required')
    }

    const supabase = await createServerClient()

    // Find user by verification token
    const { data: user, error: findError } = await supabase
      .from('users')
      .select('id, email, pending_email, updated_at')
      .eq('email_verification_token', token)
      .single()

    if (findError || !user) {
      throw new ValidationError('Invalid verification token')
    }

    // Verify that pending_email exists (should always be true due to DB constraint)
    if (!user.pending_email) {
      throw new ValidationError('No pending email change found')
    }

    // Check token age (1 hour expiration)
    // Token timestamp is based on the updated_at field (when pending_email was set)
    const tokenAge = Date.now() - new Date(user.updated_at).getTime()
    const ONE_HOUR = 60 * 60 * 1000

    if (tokenAge > ONE_HOUR) {
      throw new ValidationError('Verification token has expired')
    }

    // Store the pending email for later use
    const newEmail = user.pending_email

    // Update user in database:
    // - Set email to pending_email
    // - Set email_verified_at to current timestamp
    // - Clear pending_email and email_verification_token
    const { error: updateError } = await supabase
      .from('users')
      .update({
        email: newEmail,
        email_verified_at: new Date().toISOString(),
        pending_email: null,
        email_verification_token: null,
      })
      .eq('id', user.id)

    if (updateError) {
      throw updateError
    }

    // Update email in Supabase Auth using Admin API
    // This requires service role key for admin privileges
    const adminSupabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      }
    )

    const { error: authUpdateError } = await adminSupabase.auth.admin.updateUserById(user.id, {
      email: newEmail,
    })

    if (authUpdateError) {
      // Log the error but don't fail the request since DB email is already updated
      console.error('Failed to update email in Supabase Auth:', authUpdateError)
      // In a production system, you might want to queue a retry or alert admins
    }

    // Note: Email change is automatically logged in audit_logs table
    // via the log_email_changes() trigger created in migration 006_email_verification.sql
    // The trigger logs 'email_changed' action when email field is updated

    return NextResponse.json({
      success: true,
      data: {
        message: 'Email verified successfully',
        redirect: '/profile',
      },
    })
  } catch (error) {
    return handleApiError(error)
  }
}
