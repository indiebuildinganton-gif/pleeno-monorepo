/**
 * Colleges API - List all colleges for the current agency
 *
 * This endpoint provides a list of all colleges associated with the current agency.
 * Used for populating college filter dropdowns in dashboard widgets.
 *
 * Epic 6: Dashboard & Reporting Zone
 * Story 6.3: Commission Breakdown by College
 * Task 3: Implement Filter Controls
 */

import { NextRequest, NextResponse } from 'next/server'
import { handleApiError, createSuccessResponse, ForbiddenError } from '@pleeno/utils/server'
import { createServerClient } from '@pleeno/database/server'
import { requireRole, getUserAgencyId } from '@pleeno/auth/server'

// Cache configuration: 10 minutes (colleges rarely change)
export const revalidate = 600

/**
 * College data structure
 */
interface College {
  id: string
  name: string
  country?: string
  gst_status?: string
}

/**
 * GET /api/entities/colleges
 *
 * Returns all colleges associated with the current agency.
 * Results are filtered by RLS policies based on agency_id.
 *
 * Response (200):
 * {
 *   "success": true,
 *   "data": [
 *     {
 *       "id": "uuid",
 *       "name": "University of Sydney",
 *       "country": "Australia",
 *       "gst_status": "registered"
 *     }
 *   ]
 * }
 *
 * Security:
 * - Requires authentication (agency_admin or agency_user)
 * - RLS policies automatically filter by agency_id
 * - Only returns colleges associated with user's agency
 *
 * Performance:
 * - 10-minute cache via Next.js revalidate
 * - Simple query with no joins
 * - Results ordered alphabetically by name
 *
 * @param request - Next.js request object
 * @returns List of colleges or error response
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
    const userAgencyId = getUserAgencyId(user)

    if (!userAgencyId) {
      throw new ForbiddenError('User not associated with an agency')
    }

    // Create Supabase client
    const supabase = await createServerClient()

    // Query colleges that have branches with payment plans for this agency
    // We need to query through payment_plans to ensure only relevant colleges are returned
    const { data: relevantColleges, error: relevantError } = await supabase
      .from('payment_plans')
      .select(
        `
        id,
        enrollments!inner(
          id,
          branches!inner(
            id,
            colleges!inner(
              id,
              name,
              country,
              gst_status
            )
          )
        )
      `
      )
      .eq('agency_id', userAgencyId)

    if (relevantError) {
      console.error('Failed to fetch relevant colleges:', relevantError)
      throw new Error('Failed to fetch colleges')
    }

    // Extract unique colleges from the nested data
    const collegeMap = new Map<string, College>()

    for (const plan of relevantColleges || []) {
      const enrollment = Array.isArray(plan.enrollments) ? plan.enrollments[0] : plan.enrollments

      if (!enrollment) continue

      const branch = Array.isArray(enrollment.branches)
        ? enrollment.branches[0]
        : enrollment.branches

      if (!branch) continue

      const college = Array.isArray(branch.colleges) ? branch.colleges[0] : branch.colleges

      if (!college) continue

      if (!collegeMap.has(college.id)) {
        collegeMap.set(college.id, {
          id: college.id,
          name: college.name,
          country: college.country || undefined,
          gst_status: college.gst_status || undefined,
        })
      }
    }

    // Convert to array and sort by name
    const result = Array.from(collegeMap.values()).sort((a, b) => a.name.localeCompare(b.name))

    // Return standardized success response
    return createSuccessResponse(result)
  } catch (error) {
    return handleApiError(error, {
      path: '/api/entities/colleges',
    })
  }
}
