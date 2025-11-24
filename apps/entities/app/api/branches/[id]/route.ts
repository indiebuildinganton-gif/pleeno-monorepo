/**
 * Branch Detail API - Update and Delete Operations
 *
 * This endpoint provides branch update and deletion operations with dependency
 * checks and audit logging.
 *
 * Epic 3: Entities Domain
 * Story 3.1: College Registry
 * Task 08: Implement Branches API Endpoints
 */

import { NextRequest, NextResponse } from 'next/server'
import {
  handleApiError,
  createSuccessResponse,
  ValidationError,
  ForbiddenError,
  NotFoundError,
} from '@pleeno/utils'
import { createServerClient } from '@pleeno/database/server'
import { requireRole } from '@pleeno/auth/server'
import { BranchUpdateSchema } from '@pleeno/validations'

/**
 * PATCH /api/branches/[id]
 *
 * Updates a branch's information. Only agency admins can update branches.
 * All changes are logged to audit_logs for compliance tracking.
 *
 * Request body (all fields optional):
 * {
 *   "name": "Main Campus",                    // Optional
 *   "city": "Sydney",                         // Optional
 *   "commission_rate_percent": 15             // Optional (0-100)
 * }
 *
 * Response (200):
 * {
 *   "success": true,
 *   "data": {...updated branch object...}
 * }
 *
 * Error responses:
 * - 400: Validation error
 * - 401: Not authenticated
 * - 403: Not authorized (non-admin or different agency)
 * - 404: Branch not found
 *
 * Security:
 * - Requires authentication as agency_admin
 * - RLS policies automatically enforce agency_id filtering
 * - All changes logged to audit_logs
 *
 * @param request - Next.js request object
 * @param params - Route parameters containing branch id
 * @returns Updated branch object or error response
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // SECURITY BOUNDARY: Require admin authentication
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

    // Validate UUID format
    const branchId = params.id
    if (
      !branchId ||
      !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
        branchId
      )
    ) {
      throw new ValidationError('Invalid branch ID format')
    }

    // Parse and validate request body
    const body = await request.json()
    const result = BranchUpdateSchema.safeParse(body)

    if (!result.success) {
      throw new ValidationError('Validation failed', {
        errors: result.error.flatten().fieldErrors,
      })
    }

    const validatedData = result.data

    // Check if there's anything to update
    if (Object.keys(validatedData).length === 0) {
      throw new ValidationError('No fields to update')
    }

    // Create Supabase client
    const supabase = await createServerClient()

    // First, fetch the current branch data for audit logging
    const { data: currentBranch, error: fetchError } = await supabase
      .from('branches')
      .select('*')
      .eq('id', branchId)
      .eq('agency_id', userAgencyId)
      .single()

    if (fetchError || !currentBranch) {
      console.error('Failed to fetch branch:', fetchError)

      if (fetchError?.code === 'PGRST116') {
        throw new NotFoundError('Branch not found')
      }

      throw new Error('Failed to fetch branch')
    }

    // Update branch record
    // RLS policies will enforce agency_id filtering and admin-only access
    const { data: updatedBranch, error: updateError } = await supabase
      .from('branches')
      .update({
        name: validatedData.name,
        city: validatedData.city,
        commission_rate_percent: validatedData.commission_rate_percent,
      })
      .eq('id', branchId)
      .eq('agency_id', userAgencyId)
      .select()
      .single()

    if (updateError) {
      console.error('Failed to update branch:', updateError)
      throw new Error('Failed to update branch')
    }

    if (!updatedBranch) {
      throw new Error('Branch not found after update')
    }

    // Log branch update to audit trail
    // Compare old and new values to track what changed
    const changes: Record<string, { old: any; new: any }> = {}

    Object.keys(validatedData).forEach((key) => {
      const oldValue = currentBranch[key as keyof typeof currentBranch]
      const newValue = updatedBranch[key as keyof typeof updatedBranch]

      if (oldValue !== newValue) {
        changes[key] = { old: oldValue, new: newValue }
      }
    })

    await supabase.from('audit_logs').insert({
      entity_type: 'branch',
      entity_id: updatedBranch.id,
      user_id: user.id,
      action: 'update',
      changes_json: changes,
    })

    // Return standardized success response
    return createSuccessResponse(updatedBranch)
  } catch (error) {
    return handleApiError(error, {
      path: `/api/branches/${params.id}`,
    })
  }
}

/**
 * DELETE /api/branches/[id]
 *
 * Deletes a branch if it has no associated enrollments.
 * Only agency admins can delete branches.
 * All deletions are logged to audit_logs for compliance tracking.
 *
 * Dependency Check:
 * - Checks for enrollments linked to this branch
 * - Prevents deletion if any enrollments exist
 *
 * Response (200):
 * {
 *   "success": true,
 *   "message": "Branch deleted successfully"
 * }
 *
 * Error responses:
 * - 400: Branch has associated enrollments (cannot delete)
 * - 401: Not authenticated
 * - 403: Not authorized (non-admin or different agency)
 * - 404: Branch not found
 *
 * Security:
 * - Requires authentication as agency_admin
 * - RLS policies automatically enforce agency_id filtering
 * - Deletion logged to audit_logs
 *
 * @param request - Next.js request object
 * @param params - Route parameters containing branch id
 * @returns Success message or error response
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // SECURITY BOUNDARY: Require admin authentication
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

    // Validate UUID format
    const branchId = params.id
    if (
      !branchId ||
      !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
        branchId
      )
    ) {
      throw new ValidationError('Invalid branch ID format')
    }

    // Create Supabase client
    const supabase = await createServerClient()

    // First, verify the branch exists and belongs to the user's agency
    const { data: branch, error: fetchError } = await supabase
      .from('branches')
      .select('id, name, college_id')
      .eq('id', branchId)
      .eq('agency_id', userAgencyId)
      .single()

    if (fetchError || !branch) {
      console.error('Failed to fetch branch:', fetchError)

      if (fetchError?.code === 'PGRST116') {
        throw new NotFoundError('Branch not found')
      }

      throw new Error('Failed to fetch branch')
    }

    // DEPENDENCY CHECK: Check for associated enrollments
    const { data: enrollments, error: enrollmentsError } = await supabase
      .from('enrollments')
      .select('id')
      .eq('branch_id', branchId)
      .eq('agency_id', userAgencyId)

    if (enrollmentsError) {
      console.error('Failed to check enrollments:', enrollmentsError)
      throw new Error('Failed to check for associated enrollments')
    }

    if (enrollments && enrollments.length > 0) {
      throw new ValidationError(
        `Cannot delete branch. There are ${enrollments.length} associated enrollment(s). Please remove or reassign enrollments before deleting the branch.`
      )
    }

    // Delete the branch
    const { error: deleteError } = await supabase
      .from('branches')
      .delete()
      .eq('id', branchId)
      .eq('agency_id', userAgencyId)

    if (deleteError) {
      console.error('Failed to delete branch:', deleteError)
      throw new Error('Failed to delete branch')
    }

    // Log branch deletion to audit trail
    await supabase.from('audit_logs').insert({
      entity_type: 'branch',
      entity_id: branchId,
      user_id: user.id,
      action: 'delete',
      changes_json: {
        name: branch.name,
        college_id: branch.college_id,
      },
    })

    // Return success response
    return NextResponse.json(
      {
        success: true,
        message: 'Branch deleted successfully',
      },
      { status: 200 }
    )
  } catch (error) {
    return handleApiError(error, {
      path: `/api/branches/${params.id}`,
    })
  }
}
