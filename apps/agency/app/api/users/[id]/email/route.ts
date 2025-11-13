import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@pleeno/database'
import { handleApiError, UnauthorizedError, ForbiddenError, ValidationError } from '@pleeno/utils'
import { EmailUpdateSchema } from '@pleeno/validations'
import { Resend } from 'resend'
import { EmailVerificationEmail } from '../../../../../../../emails/email-verification'

const resend = new Resend(process.env.RESEND_API_KEY)

/**
 * PATCH /api/users/{id}/email
 *
 * Allows agency admins to initiate email changes for users.
 * This endpoint:
 * - Validates the requester is an agency_admin
 * - Validates the new email is not already in use
 * - Generates a unique verification token
 * - Stores pending_email and email_verification_token in database
 * - Sends verification email to the new email address
 * - Logs the email change request in audit trail
 *
 * Security:
 * - Only agency_admin can update user emails
 * - RLS policies enforce agency isolation
 * - Email verification required before change is complete
 * - Verification token expires after 1 hour
 * - Audit trail tracks all email change requests
 *
 * @param request - Next.js request object
 * @param params - Route params containing user ID
 * @returns JSON response with success message or error
 */
export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const supabase = await createServerClient()

    // Verify user is authenticated and is admin
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()
    if (authError || !user) {
      throw new UnauthorizedError('Not authenticated')
    }

    // Get current user's role and agency_id
    const { data: currentUser } = await supabase
      .from('users')
      .select('role, agency_id')
      .eq('id', user.id)
      .single()

    if (!currentUser || currentUser.role !== 'agency_admin') {
      throw new ForbiddenError('Admin access required')
    }

    // Validate request body
    const body = await request.json()
    const validatedData = EmailUpdateSchema.parse(body)

    // Check if email already exists
    const { data: existingUser } = await supabase
      .from('users')
      .select('id')
      .eq('email', validatedData.email)
      .single()

    if (existingUser) {
      throw new ValidationError('Email address is already in use')
    }

    // Generate verification token using crypto.randomUUID()
    const verificationToken = crypto.randomUUID()

    // Update user with pending email and token
    // RLS policies ensure admin can only update users in their agency
    const { data: targetUser, error: updateError } = await supabase
      .from('users')
      .update({
        pending_email: validatedData.email,
        email_verification_token: verificationToken,
      })
      .eq('id', params.id)
      .eq('agency_id', currentUser.agency_id) // RLS double-check
      .select('full_name, email, agencies(name)')
      .single()

    if (updateError) {
      throw updateError
    }

    if (!targetUser) {
      throw new ValidationError('User not found or not in your agency')
    }

    // Extract agency name from the join result
    const agencyName = (targetUser.agencies as { name: string })?.name || 'Your Agency'

    // Send verification email using React Email template
    const verificationUrl = `${process.env.NEXT_PUBLIC_APP_URL}/verify-email?token=${verificationToken}`

    await resend.emails.send({
      from: 'noreply@pleeno.com',
      to: validatedData.email,
      subject: 'Verify your new email address',
      react: EmailVerificationEmail({
        agencyName,
        userName: targetUser.full_name,
        verificationUrl,
      }),
    })

    // Audit logging is handled automatically by the log_email_changes() trigger
    // created in Task 1 (migration 006_email_verification.sql)
    // The trigger logs 'email_change_requested' action when pending_email is set

    return NextResponse.json({
      success: true,
      data: { message: 'Verification email sent' },
    })
  } catch (error) {
    return handleApiError(error)
  }
}
