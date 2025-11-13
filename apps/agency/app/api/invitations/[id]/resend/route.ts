/**
 * Resend Invitation API - Extend expiration and resend invitation email
 *
 * This endpoint allows agency admins to resend pending invitations with
 * an extended expiration date (7 days from current time).
 *
 * Epic 2: Agency Configuration & User Management
 * Story 2.3: User Management Interface
 * Task 05: Implement Invitation Management APIs (AC: 5)
 */

import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@pleeno/database'
import {
  handleApiError,
  UnauthorizedError,
  ForbiddenError,
  ValidationError
} from '@pleeno/utils'

/**
 * POST /api/invitations/[id]/resend
 *
 * Extends the expiration date of a pending invitation by 7 days from the current time
 * and resends the invitation email.
 *
 * Security:
 * - Only agency admins can resend invitations
 * - RLS policies ensure invitations can only be accessed within the same agency
 * - Cannot resend invitations that have already been used
 *
 * Request parameters:
 * - id: UUID of the invitation to resend
 *
 * Response (200):
 * {
 *   "success": true,
 *   "data": {
 *     "id": "invitation-uuid",
 *     "email": "user@example.com",
 *     "expires_at": "2025-11-20T12:00:00Z",
 *     ...
 *   }
 * }
 *
 * Error responses:
 * - 401: Not authenticated
 * - 403: Not an admin
 * - 400: Invitation not found or already used
 *
 * TODO: Implement email sending with sendInvitationEmail() when email utility is available
 *
 * @param request - Next.js request object
 * @param params - Route parameters containing invitation ID
 * @returns Updated invitation data or error response
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createServerClient()

    // SECURITY BOUNDARY: Verify user is authenticated
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      throw new UnauthorizedError('Not authenticated')
    }

    // SECURITY BOUNDARY: Verify user is an agency admin
    const { data: currentUser } = await supabase
      .from('users')
      .select('role, agency_id')
      .eq('id', user.id)
      .single()

    if (currentUser?.role !== 'agency_admin') {
      throw new ForbiddenError('Admin access required')
    }

    // Fetch the invitation
    // RLS policies automatically filter by agency_id for additional security
    const { data: invitation, error: invitationError } = await supabase
      .from('invitations')
      .select('*')
      .eq('id', params.id)
      .eq('agency_id', currentUser.agency_id) // Explicit agency check
      .single()

    if (invitationError || !invitation) {
      throw new ValidationError('Invitation not found')
    }

    // Validate invitation is still pending (not used)
    if (invitation.used_at) {
      throw new ValidationError('Cannot resend used invitation')
    }

    // Calculate new expiration: 7 days from now
    const newExpiresAt = new Date()
    newExpiresAt.setDate(newExpiresAt.getDate() + 7)

    // Update invitation expiration
    const { data: updatedInvitation, error: updateError } = await supabase
      .from('invitations')
      .update({ expires_at: newExpiresAt.toISOString() })
      .eq('id', params.id)
      .select()
      .single()

    if (updateError) {
      console.error('Failed to update invitation:', updateError)
      throw new Error('Failed to update invitation expiration')
    }

    // TODO: Resend invitation email when email utility is available
    // await sendInvitationEmail({
    //   email: invitation.email,
    //   invitationToken: invitation.token,
    //   agencyName: invitation.agency_name,
    //   expiresAt: newExpiresAt
    // })

    // Log resend action in audit trail
    // This creates an immutable record for security auditing
    await supabase.from('audit_log').insert({
      entity_type: 'invitation',
      entity_id: params.id,
      user_id: user.id,
      action: 'resend',
      changes_json: {
        old_expires_at: invitation.expires_at,
        new_expires_at: newExpiresAt.toISOString(),
        email: invitation.email
      }
    })

    // Return updated invitation
    return NextResponse.json({
      success: true,
      data: updatedInvitation
    })
  } catch (error) {
    return handleApiError(error)
  }
}
