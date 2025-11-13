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
import { handleApiError, ForbiddenError } from '@pleeno/utils'
import { createServerClient } from '@pleeno/database/server'
import { requireRole } from '@pleeno/auth'

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
