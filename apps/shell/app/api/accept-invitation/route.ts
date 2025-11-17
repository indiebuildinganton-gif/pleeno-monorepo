/**
 * Invitation Acceptance API Route
 *
 * Handles the invitation acceptance flow when an invited user signs up.
 * Flow:
 * 1. Validates invitation token (not expired, not used)
 * 2. Creates user with Supabase Auth
 * 3. Marks invitation as used
 * 4. Sets user's agency_id and role from invitation
 * 5. Creates user_task_assignments for assigned tasks
 * 6. Returns success with user data
 *
 * Epic 2: Agency Configuration & User Management
 * Story 2.2: User Invitation and Task Assignment System
 * Task 06: Create invitation acceptance page and flow
 */

import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@pleeno/database/server'
import { handleApiError, ValidationError, NotFoundError, isInvitationExpired } from '@pleeno/utils/server'
import { InvitationAcceptanceSchema } from '@pleeno/validations'

export async function POST(request: NextRequest) {
  try {
    // 1. Parse and validate request body
    const body = await request.json()
    const validatedData = InvitationAcceptanceSchema.parse(body)

    const supabase = await createServerClient()

    // 2. Fetch invitation and validate token
    const { data: invitation, error: invitationError } = await supabase
      .from('invitations')
      .select('*, agencies(name)')
      .eq('token', validatedData.token)
      .single()

    if (invitationError || !invitation) {
      throw new NotFoundError('Invalid invitation token')
    }

    // 3. Validate invitation not expired
    if (isInvitationExpired(invitation)) {
      throw new ValidationError(
        'This invitation has expired. Please request a new invitation from your agency admin.'
      )
    }

    // 4. Validate invitation not already used
    if (invitation.used_at) {
      throw new ValidationError(
        'This invitation has already been used and cannot be reused.'
      )
    }

    // 5. Create user with Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: invitation.email,
      password: validatedData.password,
      options: {
        data: {
          full_name: validatedData.full_name,
          agency_id: invitation.agency_id,
          role: invitation.role,
        },
      },
    })

    if (authError) {
      throw new ValidationError(authError.message)
    }

    if (!authData.user) {
      throw new Error('Failed to create user')
    }

    // 6. Create user record in public.users table
    const { error: userError } = await supabase.from('users').insert({
      id: authData.user.id,
      email: invitation.email,
      full_name: validatedData.full_name,
      agency_id: invitation.agency_id,
      role: invitation.role,
    })

    if (userError) {
      console.error('Failed to create user record:', userError)
      // Note: User was created in auth.users but not in public.users
      // This will be handled by the auth trigger or manually
      throw new Error('Failed to create user profile')
    }

    // 7. Mark invitation as used
    const { error: updateError } = await supabase
      .from('invitations')
      .update({ used_at: new Date().toISOString() })
      .eq('id', invitation.id)

    if (updateError) {
      console.error('Failed to mark invitation as used:', updateError)
      // Non-critical error - user was created successfully
    }

    // 8. Create user_task_assignments for assigned tasks
    // Fetch task_ids from query parameter (passed from invitation email)
    const url = new URL(request.url)
    const tasksParam = url.searchParams.get('tasks')
    let taskIds: string[] = []

    if (tasksParam) {
      try {
        taskIds = JSON.parse(decodeURIComponent(tasksParam))
      } catch {
        console.warn('Failed to parse tasks parameter')
      }
    }

    // If we have task IDs, create task assignments
    if (taskIds.length > 0) {
      const taskAssignments = taskIds.map((taskId) => ({
        user_id: authData.user!.id,
        task_id: taskId,
        assigned_by: invitation.invited_by,
      }))

      const { error: assignmentError } = await supabase
        .from('user_task_assignments')
        .insert(taskAssignments)

      if (assignmentError) {
        console.error('Failed to create task assignments:', assignmentError)
        // Non-critical error - user was created successfully
      }
    }

    // 9. Return success response with agency name for welcome message
    return NextResponse.json({
      success: true,
      data: {
        user: {
          id: authData.user.id,
          email: invitation.email,
          full_name: validatedData.full_name,
          role: invitation.role,
        },
        agency_name: (invitation.agencies as any)?.name || 'your agency',
      },
    })
  } catch (error) {
    return handleApiError(error)
  }
}
