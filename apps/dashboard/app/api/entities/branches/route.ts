/**
 * Branches API - List all branches for the current agency
 *
 * This endpoint provides a list of all branches associated with the current agency.
 * Can optionally filter by college_id.
 * Used for populating branch filter dropdowns in dashboard widgets.
 *
 * Epic 6: Dashboard & Reporting Zone
 * Story 6.3: Commission Breakdown by College
 * Task 3: Implement Filter Controls
 */

import { NextRequest, NextResponse } from 'next/server'
import { handleApiError, createSuccessResponse, ForbiddenError } from '@pleeno/utils/server'
import { createServerClient } from '@pleeno/database/server'
import { requireRole } from '@pleeno/auth/server'

// Cache configuration: 10 minutes (branches rarely change)
export const revalidate = 600

/**
 * Branch data structure
 */
interface Branch {
  id: string
  name: string
  city?: string
  college_id: string
  college_name?: string
}

/**
 * GET /api/entities/branches
 *
 * Returns all branches associated with the current agency.
 * Results are filtered by RLS policies based on agency_id.
 *
 * Query Parameters:
 * - college_id (optional): Filter branches by college ID
 *
 * Response (200):
 * {
 *   "success": true,
 *   "data": [
 *     {
 *       "id": "uuid",
 *       "name": "Sydney Campus",
 *       "city": "Sydney",
 *       "college_id": "uuid",
 *       "college_name": "University of Sydney"
 *     }
 *   ]
 * }
 *
 * Security:
 * - Requires authentication (agency_admin or agency_user)
 * - RLS policies automatically filter by agency_id
 * - Only returns branches from colleges with payment plans for user's agency
 *
 * Performance:
 * - 10-minute cache via Next.js revalidate
 * - Query with college join for name
 * - Results ordered alphabetically by branch name
 *
 * @param request - Next.js request object
 * @returns List of branches or error response
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

    // Get optional college_id filter from query params
    const { searchParams } = new URL(request.url)
    const collegeId = searchParams.get('college_id')

    // Create Supabase client
    const supabase = await createServerClient()

    // Query branches that have payment plans for this agency
    const query = supabase
      .from('payment_plans')
      .select(
        `
        id,
        enrollments!inner(
          id,
          branches!inner(
            id,
            name,
            city,
            college_id,
            colleges!inner(
              id,
              name
            )
          )
        )
      `
      )
      .eq('agency_id', userAgencyId)

    const { data: relevantBranches, error: relevantError } = await query

    if (relevantError) {
      console.error('Failed to fetch relevant branches:', relevantError)
      throw new Error('Failed to fetch branches')
    }

    // Extract unique branches from the nested data
    const branchMap = new Map<string, Branch>()

    for (const plan of relevantBranches || []) {
      const enrollment = Array.isArray(plan.enrollments) ? plan.enrollments[0] : plan.enrollments

      if (!enrollment) continue

      const branch = Array.isArray(enrollment.branches)
        ? enrollment.branches[0]
        : enrollment.branches

      if (!branch) continue

      const college = Array.isArray(branch.colleges) ? branch.colleges[0] : branch.colleges

      if (!college) continue

      // Apply college_id filter if provided
      if (collegeId && branch.college_id !== collegeId) {
        continue
      }

      if (!branchMap.has(branch.id)) {
        branchMap.set(branch.id, {
          id: branch.id,
          name: branch.name,
          city: branch.city || undefined,
          college_id: branch.college_id,
          college_name: college.name,
        })
      }
    }

    // Convert to array and sort by branch name
    const result = Array.from(branchMap.values()).sort((a, b) => a.name.localeCompare(b.name))

    // Return standardized success response
    return createSuccessResponse(result)
  } catch (error) {
    return handleApiError(error, {
      path: '/api/entities/branches',
    })
  }
}
