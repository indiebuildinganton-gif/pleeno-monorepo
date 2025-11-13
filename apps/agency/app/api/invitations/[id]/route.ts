/**
 * Delete Invitation API - Remove pending invitations
 *
 * This endpoint allows agency admins to delete pending invitations
 * that haven't been used yet.
 *
 * Epic 2: Agency Configuration & User Management
 * Story 2.3: User Management Interface
 * Task 05: Implement Invitation Management APIs (AC: 6)
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
 * DELETE /api/invitations/[id]
 *
 * Hard deletes a pending invitation from the database.
 * Used invitations cannot be deleted to maintain audit trail integrity.
 *
 * Security:
 * - Only agency admins can delete invitations
 * - RLS policies ensure invitations can only be accessed within the same agency
 * - Cannot delete invitations that have already been used
 * - Audit log entry created before deletion for accountability
 *
 * Request parameters:
 * - id: UUID of the invitation to delete
 *
 * Response (200):
 * {
 *   "success": true
 * }
 *
 * Error responses:
 * - 401: Not authenticated
 * - 403: Not an admin
 * - 400: Invitation not found or already used
 *
 * @param request - Next.js request object
 * @param params - Route parameters containing invitation ID
 * @returns Success response or error
 */
export async function DELETE(
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
      throw new ValidationError('Cannot delete used invitation')
    }

    // Log deletion before removing the record
    // This creates an immutable audit trail of the deletion
    await supabase.from('audit_log').insert({
      entity_type: 'invitation',
      entity_id: params.id,
      user_id: user.id,
      action: 'delete',
      changes_json: {
        email: invitation.email,
        role: invitation.role,
        created_at: invitation.created_at,
        expires_at: invitation.expires_at
      }
    })

    // Hard delete the invitation
    const { error: deleteError } = await supabase
      .from('invitations')
      .delete()
      .eq('id', params.id)

    if (deleteError) {
      console.error('Failed to delete invitation:', deleteError)
      throw new Error('Failed to delete invitation')
    }

    // Return success response
    return NextResponse.json({
      success: true
    })
  } catch (error) {
    return handleApiError(error)
  }
}
