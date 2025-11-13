/**
 * User Invitation API - Create new user invitations
 *
 * This endpoint allows agency admins to invite new users to their agency.
 * Invitations include a secure token, role assignment, and optional task assignments.
 *
 * Epic 2: Agency Configuration & User Management
 * Story 2.2: User Invitation and Task Assignment System
 * Task 04: Implement user invitation API route
 */

import { NextRequest, NextResponse } from 'next/server'
import { randomUUID } from 'crypto'
import {
  handleApiError,
  createSuccessResponse,
  ValidationError,
  ForbiddenError,
  sendInvitationEmail,
} from '@pleeno/utils'
import { createServerClient } from '@pleeno/database/server'
import { requireRole } from '@pleeno/auth'
import { InvitationCreateSchema } from '@pleeno/validations'

/**
 * POST /api/invitations
 *
 * Creates a new user invitation with a secure token and optional task assignments.
 * Only agency admins can create invitations.
 *
 * Request body:
 * {
 *   "email": "user@example.com",         // Required: valid email format
 *   "role": "agency_user",               // Required: 'agency_admin' | 'agency_user'
 *   "task_ids": ["uuid1", "uuid2"]       // Optional: array of task UUIDs
 * }
 *
 * Response (200):
 * {
 *   "success": true,
 *   "data": {
 *     "id": "invitation-uuid",
 *     "email": "user@example.com",
 *     "token": "secure-uuid-token",
 *     "expires_at": "2025-11-20T12:00:00Z"
 *   }
 * }
 *
 * Security:
 * - requireRole() middleware enforces agency_admin access
 * - Token generated using crypto.randomUUID() (cryptographically secure)
 * - Invitation expires after 7 days
 * - RLS policies provide database-level isolation (agency_id filtering)
 * - Request body validated with Zod schema
 *
 * Email Integration (Task 05):
 * - Sends invitation email via Resend API
 * - Email includes agency name, inviter name, and assigned tasks
 * - Link includes token and task IDs as URL parameters
 *
 * @param request - Next.js request object
 * @returns Invitation data with token or error response
 */
export async function POST(request: NextRequest) {
  try {
    // SECURITY BOUNDARY: Only agency admins can create invitations
    const authResult = await requireRole(request, ['agency_admin'])

    if (authResult instanceof NextResponse) {
      return authResult // Return 401 or 403 error response
    }

    const { user } = authResult

    // Parse and validate request body
    const body = await request.json()
    const result = InvitationCreateSchema.safeParse(body)

    if (!result.success) {
      throw new ValidationError('Validation failed', {
        errors: result.error.flatten().fieldErrors,
      })
    }

    const validatedData = result.data

    // Get user's agency_id from JWT metadata
    const userAgencyId = user.app_metadata?.agency_id

    if (!userAgencyId) {
      throw new ForbiddenError('User not associated with an agency')
    }

    // Create Supabase client
    const supabase = await createServerClient()

    // Get user's full name for invitation email (Task 05)
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('full_name')
      .eq('id', user.id)
      .single()

    if (userError) {
      console.error('Failed to fetch user data:', userError)
      throw new Error('Failed to fetch user data')
    }

    // Validate task_ids if provided
    // Ensure all task IDs exist in master_tasks table
    if (validatedData.task_ids && validatedData.task_ids.length > 0) {
      const { data: tasks, error: tasksError } = await supabase
        .from('master_tasks')
        .select('id')
        .in('id', validatedData.task_ids)

      if (tasksError) {
        console.error('Failed to validate task IDs:', tasksError)
        throw new Error('Failed to validate task IDs')
      }

      // Verify all provided task IDs exist
      if (!tasks || tasks.length !== validatedData.task_ids.length) {
        throw new ValidationError('One or more task IDs are invalid')
      }
    }

    // Generate secure invitation token using crypto.randomUUID()
    // This is cryptographically secure and guaranteed to be unique
    const token = randomUUID()

    // Calculate expiration: 7 days from now
    const expiresAt = new Date()
    expiresAt.setDate(expiresAt.getDate() + 7)

    // Create invitation record with task_ids
    // RLS policies will enforce agency_id filtering as additional security layer
    const { data: invitation, error: insertError } = await supabase
      .from('invitations')
      .insert({
        agency_id: userAgencyId,
        email: validatedData.email,
        role: validatedData.role,
        token,
        invited_by: user.id,
        expires_at: expiresAt.toISOString(),
        task_ids: validatedData.task_ids || [],
      })
      .select()
      .single()

    if (insertError) {
      console.error('Failed to create invitation:', insertError)

      // Check for duplicate email constraint violation
      if (insertError.code === '23505') {
        throw new ValidationError('An invitation for this email already exists')
      }

      throw new Error('Failed to create invitation')
    }

    if (!invitation) {
      throw new Error('Invitation not found after creation')
    }

    // Get agency name for email
    const { data: agency, error: agencyError } = await supabase
      .from('agencies')
      .select('name')
      .eq('id', userAgencyId)
      .single()

    if (agencyError) {
      console.error('Failed to fetch agency data:', agencyError)
      throw new Error('Failed to fetch agency data')
    }

    // Get task details if tasks were assigned
    let assignedTasks: Array<{ task_name: string; description: string }> = []
    if (validatedData.task_ids && validatedData.task_ids.length > 0) {
      const { data: tasks, error: tasksDetailError } = await supabase
        .from('master_tasks')
        .select('task_name, description')
        .in('id', validatedData.task_ids)

      if (tasksDetailError) {
        console.error('Failed to fetch task details:', tasksDetailError)
        // Don't fail the invitation, just log the error
        // We'll send the email without task details
      } else {
        assignedTasks = tasks || []
      }
    }

    // Send invitation email
    try {
      await sendInvitationEmail({
        to: validatedData.email,
        token: invitation.token,
        agencyName: agency?.name || 'Unknown Agency',
        inviterName: userData.full_name || 'Your colleague',
        assignedTasks,
        taskIds: validatedData.task_ids || [],
      })
    } catch (emailError) {
      // Log email error but don't fail the invitation
      // The invitation is already created in the database
      console.error('Failed to send invitation email:', emailError)
      console.warn(
        `Invitation created for ${validatedData.email} but email failed to send. Token: ${invitation.token}`
      )
      // In production, you might want to:
      // 1. Queue the email for retry
      // 2. Alert administrators
      // 3. Return a warning message to the user
    }

    // Return standardized success response
    // Including the token so it can be used for testing
    return createSuccessResponse({
      id: invitation.id,
      email: invitation.email,
      token: invitation.token,
      expires_at: invitation.expires_at,
    })
  } catch (error) {
    return handleApiError(error, {
      path: '/api/invitations',
    })
  }
}
