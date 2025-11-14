/**
 * College Detail API - Get, Update, and Delete Operations
 *
 * This endpoint provides college detail operations including viewing, updating,
 * and deletion with dependency checks and audit logging.
 *
 * Epic 3: Entities Domain
 * Story 3.1: College Registry
 * Task 07: Implement College Detail API Endpoint
 */

import { NextRequest, NextResponse } from 'next/server'
import {
  handleApiError,
  createSuccessResponse,
  ValidationError,
  ForbiddenError,
  NotFoundError,
  requireAdmin,
} from '@pleeno/utils'
import { createServerClient } from '@pleeno/database/server'
import { requireRole } from '@pleeno/auth'
import { CollegeUpdateSchema } from '@pleeno/validations'

/**
 * GET /api/colleges/[id]
 *
 * Returns detailed information about a specific college including its branches
 * and contact persons. All data is automatically filtered by RLS based on agency_id.
 *
 * Response (200):
 * {
 *   "success": true,
 *   "data": {
 *     "id": "uuid",
 *     "name": "University of Example",
 *     "city": "Sydney",
 *     "country": "Australia",
 *     "default_commission_rate_percent": 15,
 *     "gst_status": "included",
 *     "contract_expiration_date": "2025-12-31",
 *     "created_at": "2024-01-01T00:00:00Z",
 *     "updated_at": "2024-01-01T00:00:00Z",
 *     "branches": [
 *       {
 *         "id": "uuid",
 *         "name": "Main Campus",
 *         "city": "Sydney",
 *         "commission_rate_percent": 15,
 *         "created_at": "2024-01-01T00:00:00Z",
 *         "updated_at": "2024-01-01T00:00:00Z"
 *       }
 *     ],
 *     "college_contacts": [
 *       {
 *         "id": "uuid",
 *         "name": "John Smith",
 *         "role_department": "Admissions",
 *         "position_title": "Director",
 *         "email": "john@example.edu",
 *         "phone": "+61 2 1234 5678",
 *         "created_at": "2024-01-01T00:00:00Z",
 *         "updated_at": "2024-01-01T00:00:00Z"
 *       }
 *     ]
 *   }
 * }
 *
 * Error responses:
 * - 401: Not authenticated
 * - 403: Not authorized (college belongs to different agency)
 * - 404: College not found
 *
 * Security:
 * - Requires authentication (agency_admin or agency_user)
 * - RLS policies automatically filter by agency_id
 * - College must belong to user's agency
 *
 * @param request - Next.js request object
 * @param params - Route parameters containing college id
 * @returns College details with branches and contacts or error response
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // SECURITY BOUNDARY: Require authentication
    const authResult = await requireRole(request, ['agency_admin', 'agency_user'])

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
    const collegeId = params.id
    if (
      !collegeId ||
      !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
        collegeId
      )
    ) {
      throw new ValidationError('Invalid college ID format')
    }

    // Create Supabase client
    const supabase = await createServerClient()

    // Fetch college with branches and contacts using single query
    // RLS policies will enforce agency filtering
    const { data: college, error } = await supabase
      .from('colleges')
      .select(
        `
        *,
        branches (
          id,
          name,
          city,
          commission_rate_percent,
          created_at,
          updated_at
        ),
        college_contacts (
          id,
          name,
          role_department,
          position_title,
          email,
          phone,
          created_at,
          updated_at
        )
      `
      )
      .eq('id', collegeId)
      .eq('agency_id', userAgencyId)
      .single()

    if (error) {
      console.error('Failed to fetch college:', error)

      // Handle not found case
      if (error.code === 'PGRST116') {
        throw new NotFoundError('College not found')
      }

      throw new Error('Failed to fetch college')
    }

    if (!college) {
      throw new NotFoundError('College not found')
    }

    // Return college with related data
    return createSuccessResponse(college)
  } catch (error) {
    return handleApiError(error, {
      path: `/api/colleges/${params.id}`,
    })
  }
}

/**
 * PATCH /api/colleges/[id]
 *
 * Updates a college's information. Only agency admins can update colleges.
 * All changes are logged to audit_logs for compliance tracking.
 *
 * Request body (all fields optional):
 * {
 *   "name": "University of Example",                    // Optional (unique per agency)
 *   "city": "Sydney",                                   // Optional
 *   "country": "Australia",                             // Optional
 *   "default_commission_rate_percent": 15,              // Optional (0-100)
 *   "gst_status": "included",                           // Optional: "included" or "excluded"
 *   "contract_expiration_date": "2025-12-31"            // Optional: YYYY-MM-DD format
 * }
 *
 * Response (200):
 * {
 *   "success": true,
 *   "data": {...updated college object...}
 * }
 *
 * Error responses:
 * - 400: Validation error or duplicate college name
 * - 401: Not authenticated
 * - 403: Not authorized (non-admin or different agency)
 * - 404: College not found
 *
 * Security:
 * - Requires authentication as agency_admin
 * - RLS policies automatically enforce agency_id filtering
 * - College name must remain unique within agency
 * - All changes logged to audit_logs
 *
 * @param request - Next.js request object
 * @param params - Route parameters containing college id
 * @returns Updated college object or error response
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Create Supabase client
    const supabase = await createServerClient()

    // SECURITY BOUNDARY: Require admin authentication
    await requireAdmin(supabase)

    // Get authenticated user for audit logging
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      throw new ForbiddenError('User not authenticated')
    }

    // Get user's agency_id from JWT metadata
    const userAgencyId = user.app_metadata?.agency_id

    if (!userAgencyId) {
      throw new ForbiddenError('User not associated with an agency')
    }

    // Validate UUID format
    const collegeId = params.id
    if (
      !collegeId ||
      !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
        collegeId
      )
    ) {
      throw new ValidationError('Invalid college ID format')
    }

    // Parse and validate request body
    const body = await request.json()
    const result = CollegeUpdateSchema.safeParse(body)

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

    // First, fetch the current college data for audit logging
    const { data: currentCollege, error: fetchError } = await supabase
      .from('colleges')
      .select('*')
      .eq('id', collegeId)
      .eq('agency_id', userAgencyId)
      .single()

    if (fetchError || !currentCollege) {
      console.error('Failed to fetch college:', fetchError)

      if (fetchError?.code === 'PGRST116') {
        throw new NotFoundError('College not found')
      }

      throw new Error('Failed to fetch college')
    }

    // Update college record
    // RLS policies will enforce agency_id filtering and admin-only access
    const { data: updatedCollege, error: updateError } = await supabase
      .from('colleges')
      .update({
        name: validatedData.name,
        city: validatedData.city,
        country: validatedData.country,
        default_commission_rate_percent:
          validatedData.default_commission_rate_percent,
        gst_status: validatedData.gst_status,
        contract_expiration_date: validatedData.contract_expiration_date,
      })
      .eq('id', collegeId)
      .eq('agency_id', userAgencyId)
      .select()
      .single()

    if (updateError) {
      console.error('Failed to update college:', updateError)

      // Check for duplicate college name constraint violation
      // PostgreSQL unique constraint violation code: 23505
      if (updateError.code === '23505') {
        throw new ValidationError(
          'A college with this name already exists in your agency'
        )
      }

      throw new Error('Failed to update college')
    }

    if (!updatedCollege) {
      throw new Error('College not found after update')
    }

    // Log college update to audit trail
    // Compare old and new values to track what changed
    const changes: Record<string, { old: any; new: any }> = {}

    Object.keys(validatedData).forEach((key) => {
      const oldValue = currentCollege[key as keyof typeof currentCollege]
      const newValue = updatedCollege[key as keyof typeof updatedCollege]

      if (oldValue !== newValue) {
        changes[key] = { old: oldValue, new: newValue }
      }
    })

    await supabase.from('audit_logs').insert({
      entity_type: 'college',
      entity_id: updatedCollege.id,
      user_id: user.id,
      action: 'update',
      changes_json: changes,
    })

    // Return standardized success response
    return createSuccessResponse(updatedCollege)
  } catch (error) {
    return handleApiError(error, {
      path: `/api/colleges/${params.id}`,
    })
  }
}

/**
 * DELETE /api/colleges/[id]
 *
 * Deletes a college if it has no associated payment plans.
 * Only agency admins can delete colleges.
 * All deletions are logged to audit_logs for compliance tracking.
 *
 * Dependency Check:
 * - Checks for payment plans linked via enrollments → branches → college
 * - Prevents deletion if any payment plans exist
 * - Branches and contacts are cascade deleted automatically
 *
 * Response (200):
 * {
 *   "success": true,
 *   "message": "College deleted successfully"
 * }
 *
 * Error responses:
 * - 400: College has associated payment plans (cannot delete)
 * - 401: Not authenticated
 * - 403: Not authorized (non-admin or different agency)
 * - 404: College not found
 *
 * Security:
 * - Requires authentication as agency_admin
 * - RLS policies automatically enforce agency_id filtering
 * - Deletion logged to audit_logs
 * - Cascade deletes branches and contacts
 *
 * @param request - Next.js request object
 * @param params - Route parameters containing college id
 * @returns Success message or error response
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Create Supabase client
    const supabase = await createServerClient()

    // SECURITY BOUNDARY: Require admin authentication
    await requireAdmin(supabase)

    // Get authenticated user for audit logging
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      throw new ForbiddenError('User not authenticated')
    }

    // Get user's agency_id from JWT metadata
    const userAgencyId = user.app_metadata?.agency_id

    if (!userAgencyId) {
      throw new ForbiddenError('User not associated with an agency')
    }

    // Validate UUID format
    const collegeId = params.id
    if (
      !collegeId ||
      !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
        collegeId
      )
    ) {
      throw new ValidationError('Invalid college ID format')
    }

    // First, verify the college exists and belongs to the user's agency
    const { data: college, error: fetchError } = await supabase
      .from('colleges')
      .select('id, name')
      .eq('id', collegeId)
      .eq('agency_id', userAgencyId)
      .single()

    if (fetchError || !college) {
      console.error('Failed to fetch college:', fetchError)

      if (fetchError?.code === 'PGRST116') {
        throw new NotFoundError('College not found')
      }

      throw new Error('Failed to fetch college')
    }

    // DEPENDENCY CHECK: Check for associated payment plans
    // Payment plans are linked via: payment_plans → enrollments → branches → colleges
    const { data: paymentPlans, error: paymentPlanError } = await supabase
      .from('payment_plans')
      .select('id, enrollment:enrollments(id, branch:branches(id, college_id))')
      .eq('agency_id', userAgencyId)

    if (paymentPlanError) {
      console.error('Failed to check payment plans:', paymentPlanError)
      throw new Error('Failed to check for associated payment plans')
    }

    // Filter payment plans that are associated with this college's branches
    const associatedPaymentPlans = (paymentPlans || []).filter((plan: any) => {
      return plan.enrollment?.branch?.college_id === collegeId
    })

    if (associatedPaymentPlans.length > 0) {
      throw new ValidationError(
        `Cannot delete college. There are ${associatedPaymentPlans.length} associated payment plan(s). Please remove or reassign payment plans before deleting the college.`
      )
    }

    // Delete the college
    // Cascade delete will automatically remove branches and contacts
    const { error: deleteError } = await supabase
      .from('colleges')
      .delete()
      .eq('id', collegeId)
      .eq('agency_id', userAgencyId)

    if (deleteError) {
      console.error('Failed to delete college:', deleteError)
      throw new Error('Failed to delete college')
    }

    // Log college deletion to audit trail
    await supabase.from('audit_logs').insert({
      entity_type: 'college',
      entity_id: collegeId,
      user_id: user.id,
      action: 'delete',
      changes_json: {
        name: college.name,
      },
    })

    // Return success response
    return NextResponse.json(
      {
        success: true,
        message: 'College deleted successfully',
      },
      { status: 200 }
    )
  } catch (error) {
    return handleApiError(error, {
      path: `/api/colleges/${params.id}`,
    })
  }
}
