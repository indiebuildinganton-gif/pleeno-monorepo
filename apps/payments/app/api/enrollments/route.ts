/**
 * Enrollments API - List Operation
 *
 * This endpoint provides enrollment listing for payment plan creation.
 * Returns enrollments with student, college, and branch information.
 *
 * Epic 4: Payments Domain
 * Story 4.1: Payment Plan Creation
 * Task 4: Payment Plan Form Component
 */

import { NextRequest, NextResponse } from 'next/server'
import {
  handleApiError,
  createSuccessResponse,
  ValidationError,
  ForbiddenError,
} from '@pleeno/utils'
import { createServerClient } from '@pleeno/database/server'
import { requireRole } from '@pleeno/auth'
import { EnrollmentCreateSchema } from '@pleeno/validations'

/**
 * GET /api/enrollments
 *
 * Lists enrollments for the authenticated agency with student, college, and branch details.
 *
 * Response (200 OK):
 * {
 *   "success": true,
 *   "data": [
 *     {
 *       "id": "uuid",
 *       "student": {
 *         "first_name": "John",
 *         "last_name": "Doe"
 *       },
 *       "college": {
 *         "name": "University of Example"
 *       },
 *       "branch": {
 *         "name": "Main Campus",
 *         "program_name": "Computer Science",
 *         "commission_rate_percent": 15
 *       }
 *     }
 *   ]
 * }
 *
 * Security:
 * - Requires authentication with agency_admin or agency_user role
 * - RLS policies automatically filter by agency_id
 *
 * @param request - Next.js request object
 * @returns List of enrollments or error response
 */
export async function GET(request: NextRequest) {
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

    // Create Supabase client
    const supabase = await createServerClient()

    // Fetch enrollments with related data
    // RLS policies will automatically filter by agency_id
    const { data: enrollments, error: fetchError } = await supabase
      .from('enrollments')
      .select(
        `
        id,
        student:students (
          first_name,
          last_name
        ),
        college:colleges (
          name
        ),
        branch:branches (
          name,
          program_name,
          commission_rate_percent
        )
      `
      )
      .order('created_at', { ascending: false })

    if (fetchError) {
      console.error('Failed to fetch enrollments:', fetchError)
      throw new Error('Failed to fetch enrollments')
    }

    // Return standardized success response
    return NextResponse.json(
      {
        success: true,
        data: enrollments || [],
      },
      { status: 200 }
    )
  } catch (error) {
    return handleApiError(error, {
      path: '/api/enrollments',
    })
  }
}

/**
 * POST /api/enrollments
 *
 * Creates a new enrollment or returns existing active enrollment if duplicate is found.
 * Implements duplicate check logic: if (student_id, branch_id, program_name) exists
 * with status='active', reuse existing enrollment_id.
 *
 * Request body:
 * {
 *   "student_id": "uuid",           // Required
 *   "branch_id": "uuid",            // Required
 *   "program_name": "CS Degree",    // Required
 * }
 *
 * Response (200):
 * {
 *   "success": true,
 *   "data": {
 *     "id": "enrollment-uuid",
 *     ...enrollment fields...
 *   },
 *   "is_existing": false  // true if existing enrollment was reused
 * }
 *
 * Error responses:
 * - 400: Validation error or invalid foreign keys
 * - 401: Not authenticated
 * - 403: Not authorized
 *
 * Security:
 * - Requires authentication
 * - RLS policies automatically set and filter by agency_id
 * - Foreign key constraints ensure valid student_id and branch_id
 * - Audit logging for enrollment creation
 *
 * @param request - Next.js request object
 * @returns Created or existing enrollment object
 */
export async function POST(request: NextRequest) {
  try {
    // SECURITY BOUNDARY: Require authentication
    const authResult = await requireRole(request, ['agency_admin', 'agency_user'])

    if (authResult instanceof NextResponse) {
      return authResult // Return 401 or 403 error response
    }

    const { user } = authResult

    // Parse and validate request body
    const body = await request.json()
    const result = EnrollmentCreateSchema.safeParse(body)

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

    // DUPLICATE CHECK: Check if enrollment already exists with status='active'
    // Composite unique check: (student_id, branch_id, program_name)
    const { data: existingEnrollment, error: checkError } = await supabase
      .from('enrollments')
      .select('*')
      .eq('student_id', validatedData.student_id)
      .eq('branch_id', validatedData.branch_id)
      .eq('program_name', validatedData.program_name)
      .eq('status', 'active')
      .eq('agency_id', userAgencyId)
      .maybeSingle()

    if (checkError) {
      console.error('Failed to check for existing enrollment:', checkError)
      throw new Error('Failed to check for existing enrollment')
    }

    // If active enrollment exists, return it (reuse logic)
    if (existingEnrollment) {
      console.log('Reusing existing active enrollment:', existingEnrollment.id)

      // Log the reuse action to audit trail
      await supabase.from('audit_logs').insert({
        entity_type: 'enrollment',
        entity_id: existingEnrollment.id,
        user_id: user.id,
        action: 'reuse',
        changes_json: {
          student_id: validatedData.student_id,
          branch_id: validatedData.branch_id,
          program_name: validatedData.program_name,
          reason: 'Found existing active enrollment with same student, branch, and program',
        },
      })

      return NextResponse.json(
        {
          success: true,
          data: existingEnrollment,
          is_existing: true,
        },
        { status: 200 }
      )
    }

    // No existing active enrollment found - create new one
    const { data: enrollment, error: insertError } = await supabase
      .from('enrollments')
      .insert({
        agency_id: userAgencyId,
        student_id: validatedData.student_id,
        branch_id: validatedData.branch_id,
        program_name: validatedData.program_name,
        status: 'active',
      })
      .select()
      .single()

    if (insertError) {
      console.error('Failed to create enrollment:', insertError)

      // Check for foreign key constraint violations
      if (insertError.code === '23503') {
        throw new ValidationError(
          'Invalid student_id or branch_id. Please ensure the student and branch exist.'
        )
      }

      // Check for unique constraint violation (should be caught by duplicate check, but just in case)
      if (insertError.code === '23505') {
        throw new ValidationError(
          'An enrollment with this student, branch, and program combination already exists'
        )
      }

      throw new Error('Failed to create enrollment')
    }

    if (!enrollment) {
      throw new Error('Enrollment not found after creation')
    }

    // Log enrollment creation to audit trail
    await supabase.from('audit_logs').insert({
      entity_type: 'enrollment',
      entity_id: enrollment.id,
      user_id: user.id,
      action: 'create',
      changes_json: {
        student_id: enrollment.student_id,
        branch_id: enrollment.branch_id,
        program_name: enrollment.program_name,
        status: enrollment.status,
      },
    })

    // Return standardized success response
    return NextResponse.json(
      {
        success: true,
        data: enrollment,
        is_existing: false,
      },
      { status: 201 }
    )
  } catch (error) {
    return handleApiError(error, {
      path: '/api/enrollments',
    })
  }
}
