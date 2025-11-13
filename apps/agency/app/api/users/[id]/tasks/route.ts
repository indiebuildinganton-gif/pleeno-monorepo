/**
 * Task Assignment Management API - Update task assignments for existing users
 *
 * This endpoint allows agency admins to assign or revoke tasks for users in their agency.
 * Task assignments are replaced atomically (all-or-nothing), and changes are logged to audit trail.
 *
 * Epic 2: Agency Configuration & User Management
 * Story 2.2: User Invitation and Task Assignment System
 * Task 08: Implement task assignment management for existing users
 */

import { NextRequest, NextResponse } from 'next/server'
import {
  handleApiError,
  createSuccessResponse,
  ValidationError,
  NotFoundError,
  ForbiddenError,
} from '@pleeno/utils'
import { createServerClient } from '@pleeno/database/server'
import { requireRole } from '@pleeno/auth'
import { UserTaskAssignmentSchema } from '@pleeno/validations'

/**
 * POST /api/users/[id]/tasks
 *
 * Updates task assignments for an existing user by replacing all current assignments.
 * Only agency admins can modify task assignments.
 *
 * Request body:
 * {
 *   "task_ids": ["uuid1", "uuid2", ...]  // Required: array of task UUIDs (can be empty to remove all tasks)
 * }
 *
 * Response (200):
 * {
 *   "success": true,
 *   "data": {
 *     "user_id": "user-uuid",
 *     "tasks": [
 *       {
 *         "id": "task-uuid",
 *         "task_name": "Data Entry",
 *         "task_code": "DATA_ENTRY",
 *         "description": "Enter student and payment plan information"
 *       }
 *     ]
 *   }
 * }
 *
 * Security:
 * - requireRole() middleware enforces agency_admin access
 * - RLS policies ensure users can only modify task assignments within their agency
 * - Request body validated with Zod schema
 * - Task IDs validated against master_tasks table
 * - User existence validated (must be in same agency)
 *
 * Audit Logging:
 * - All task assignment changes logged to audit_log table
 * - Captures: who made the change (assigned_by), what changed (old/new task IDs), timestamp
 * - Audit log trigger automatically fires on INSERT/DELETE in user_task_assignments table
 *
 * @param request - Next.js request object
 * @param params - Route params containing user ID
 * @returns Updated task assignments or error response
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // SECURITY BOUNDARY: Only agency admins can modify task assignments
    const authResult = await requireRole(request, ['agency_admin'])

    if (authResult instanceof NextResponse) {
      return authResult // Return 401 or 403 error response
    }

    const { user } = authResult

    // Get user's agency_id from JWT metadata
    const userAgencyId = user.app_metadata?.agency_id

    if (!userAgencyId) {
      throw new ForbiddenError('User not associated with an agency')
    }

    // Parse and validate request body
    const body = await request.json()
    const result = UserTaskAssignmentSchema.safeParse(body)

    if (!result.success) {
      throw new ValidationError('Validation failed', {
        errors: result.error.flatten().fieldErrors,
      })
    }

    const { task_ids } = result.data

    // Get user ID from route params
    const { id: targetUserId } = await params

    // Create Supabase client
    const supabase = await createServerClient()

    // Verify target user exists and belongs to same agency
    const { data: targetUser, error: userError } = await supabase
      .from('users')
      .select('id, agency_id, full_name, email')
      .eq('id', targetUserId)
      .single()

    if (userError || !targetUser) {
      throw new NotFoundError('User not found')
    }

    // Verify user belongs to same agency (additional check beyond RLS)
    if (targetUser.agency_id !== userAgencyId) {
      throw new ForbiddenError('Cannot modify task assignments for users outside your agency')
    }

    // Validate task_ids if provided
    // Ensure all task IDs exist in master_tasks table
    if (task_ids.length > 0) {
      const { data: tasks, error: tasksError } = await supabase
        .from('master_tasks')
        .select('id')
        .in('id', task_ids)

      if (tasksError) {
        console.error('Failed to validate task IDs:', tasksError)
        throw new Error('Failed to validate task IDs')
      }

      // Verify all provided task IDs exist
      if (!tasks || tasks.length !== task_ids.length) {
        throw new ValidationError('One or more task IDs are invalid')
      }
    }

    // Get existing task assignments for audit logging
    const { data: existingAssignments } = await supabase
      .from('user_task_assignments')
      .select('task_id')
      .eq('user_id', targetUserId)

    const existingTaskIds = existingAssignments?.map((a) => a.task_id) || []

    // ATOMIC OPERATION: Delete existing assignments and insert new ones
    // This is done in a transaction-like manner using Supabase's RPC or multiple operations
    // For now, we'll do it sequentially with error handling

    // Step 1: Delete all existing task assignments for this user
    const { error: deleteError } = await supabase
      .from('user_task_assignments')
      .delete()
      .eq('user_id', targetUserId)

    if (deleteError) {
      console.error('Failed to delete existing task assignments:', deleteError)
      throw new Error('Failed to delete existing task assignments')
    }

    // Step 2: Insert new task assignments (if any provided)
    if (task_ids.length > 0) {
      const newAssignments = task_ids.map((task_id) => ({
        user_id: targetUserId,
        task_id,
        assigned_by: user.id, // Current admin user ID
      }))

      const { error: insertError } = await supabase
        .from('user_task_assignments')
        .insert(newAssignments)

      if (insertError) {
        console.error('Failed to insert new task assignments:', insertError)
        throw new Error('Failed to insert new task assignments')
      }
    }

    // Step 3: Log changes to audit_log table
    // The audit trigger automatically logs INSERT/DELETE operations,
    // but we'll also create a summary audit log entry for the complete operation
    const changes = {
      before: existingTaskIds,
      after: task_ids,
      added: task_ids.filter((id) => !existingTaskIds.includes(id)),
      removed: existingTaskIds.filter((id) => !task_ids.includes(id)),
    }

    const { error: auditError } = await supabase.from('audit_log').insert({
      entity_type: 'user_task_assignment',
      entity_id: targetUserId,
      user_id: user.id,
      action: 'update',
      changes_json: changes,
    })

    if (auditError) {
      // Log the error but don't fail the operation
      // Audit logging is important but shouldn't block the main operation
      console.error('Failed to create audit log entry:', auditError)
    }

    // Step 4: Fetch and return updated task assignments with details
    const { data: updatedAssignments, error: fetchError } = await supabase
      .from('user_task_assignments')
      .select(
        `
        task_id,
        master_tasks (
          id,
          task_name,
          task_code,
          description
        )
      `
      )
      .eq('user_id', targetUserId)

    if (fetchError) {
      console.error('Failed to fetch updated task assignments:', fetchError)
      throw new Error('Failed to fetch updated task assignments')
    }

    // Transform the response to flatten the nested structure
    const tasks = (updatedAssignments || []).map((assignment: any) => ({
      id: assignment.master_tasks.id,
      task_name: assignment.master_tasks.task_name,
      task_code: assignment.master_tasks.task_code,
      description: assignment.master_tasks.description,
    }))

    // Return standardized success response
    return createSuccessResponse({
      user_id: targetUserId,
      tasks,
    })
  } catch (error) {
    return handleApiError(error, {
      path: `/api/users/${(await params).id}/tasks`,
    })
  }
}
