/**
 * Students Lookup API Route
 *
 * Story 7.1: Payment Plans Report Generator with Contract Expiration Tracking
 * Task 7: Create Colleges/Branches/Students Lookup APIs
 *
 * This endpoint provides a typeahead search for students in the current agency
 * to populate filter dropdowns in the ReportBuilder component.
 *
 * Query Parameters:
 * - search (required): Search term (minimum 2 characters)
 *
 * Returns: { id, name, college_name }[] (max 50 results)
 *
 * Security:
 * - Requires authentication (agency_admin or agency_user)
 * - RLS automatically filters by agency_id
 */

import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@pleeno/database/server'
import { requireRole } from '@pleeno/auth'
import { handleApiError, ForbiddenError, ValidationError } from '@pleeno/utils'

/**
 * GET /api/reports/lookup/students?search=X
 *
 * Returns a list of students matching the search query (typeahead),
 * limited to 50 results.
 *
 * @param request - Next.js request object
 * @returns Array of students with college names or error response
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

    // Parse query parameters
    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search') || ''

    // Validate search query
    if (search.length < 2) {
      throw new ValidationError('Search must be at least 2 characters')
    }

    // Create Supabase client
    const supabase = await createServerClient()

    // Query students with enrollments and colleges
    // RLS automatically filters by agency_id
    const { data, error } = await supabase
      .from('students')
      .select(
        `
        id,
        name,
        enrollments(
          branches(
            colleges(
              name
            )
          )
        )
      `
      )
      .eq('agency_id', userAgencyId)
      .ilike('name', `%${search}%`)
      .limit(50)
      .order('name', { ascending: true })

    if (error) {
      console.error('Failed to fetch students:', error)
      throw new Error('Failed to fetch students')
    }

    // Transform data to include college name
    const students = (data || []).map((student: any) => {
      // Get the first enrollment's college name, or 'N/A' if none
      let collegeName = 'N/A'

      if (
        student.enrollments &&
        student.enrollments.length > 0 &&
        student.enrollments[0].branches &&
        student.enrollments[0].branches.colleges
      ) {
        collegeName = student.enrollments[0].branches.colleges.name
      }

      return {
        id: student.id,
        name: student.name,
        college_name: collegeName,
      }
    })

    return NextResponse.json(students, { status: 200 })
  } catch (error) {
    return handleApiError(error, {
      path: '/api/reports/lookup/students',
    })
  }
}
