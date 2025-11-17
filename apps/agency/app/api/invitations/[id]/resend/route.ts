/**
 * Resend Invitation API - Extend expiration and resend invitation email
 *
 * This endpoint allows agency admins to resend pending invitations with
 * an extended expiration date (7 days from current time).
 *
 * Epic 2: Agency Configuration & User Management
 * Story 2.2: User Invitation and Task Assignment System
 * Task 11: Display pending invitations in user management (AC: 1)
 */

import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@pleeno/database/server'
import {
  handleApiError,
  UnauthorizedError,
  ForbiddenError,
  ValidationError,
  sendInvitationEmail,
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
 * Email Integration:
 * - Sends invitation email via Resend API with same task assignments as original
 * - Email includes agency name, inviter name, and assigned tasks
 * - Link includes token and task IDs as URL parameters
 *
 * @param request - Next.js request object
 * @param params - Route parameters containing invitation ID
 * @returns Updated invitation data or error response
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
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

    // Fetch the invitation with invited_by user details
    // RLS policies automatically filter by agency_id for additional security
    const { data: invitation, error: invitationError } = await supabase
      .from('invitations')
      .select('*, invited_by_user:users!invitations_invited_by_fkey(full_name)')
      .eq('id', id)
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
      .eq('id', id)
      .select()
      .single()

    if (updateError) {
      console.error('Failed to update invitation:', updateError)
      throw new Error('Failed to update invitation expiration')
    }

    // Get agency name for email
    const { data: agency, error: agencyError } = await supabase
      .from('agencies')
      .select('name')
      .eq('id', currentUser.agency_id)
      .single()

    if (agencyError) {
      console.error('Failed to fetch agency data:', agencyError)
      throw new Error('Failed to fetch agency data')
    }

    // Get task details if tasks were assigned
    let assignedTasks: Array<{ task_name: string; description: string }> = []
    const taskIds = (invitation.task_ids as string[]) || []

    if (taskIds.length > 0) {
      const { data: tasks, error: tasksDetailError } = await supabase
        .from('master_tasks')
        .select('task_name, description')
        .in('id', taskIds)

      if (tasksDetailError) {
        console.error('Failed to fetch task details:', tasksDetailError)
        // Don't fail the resend, just log the error
      } else {
        assignedTasks = tasks || []
      }
    }

    // Resend invitation email
    try {
      await sendInvitationEmail({
        to: invitation.email,
        token: invitation.token,
        agencyName: agency?.name || 'Unknown Agency',
        inviterName: (invitation.invited_by_user as any)?.full_name || 'Your colleague',
        assignedTasks,
        taskIds,
      })
    } catch (emailError) {
      // Log email error but don't fail the resend
      console.error('Failed to send invitation email:', emailError)
      console.warn(
        `Invitation resent for ${invitation.email} but email failed to send. Token: ${invitation.token}`
      )
    }

    // Log resend action in audit trail
    // This creates an immutable record for security auditing
    await supabase.from('audit_log').insert({
      entity_type: 'invitation',
      entity_id: id,
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
