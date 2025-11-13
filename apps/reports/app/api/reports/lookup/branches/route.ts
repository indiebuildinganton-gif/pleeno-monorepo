/**
 * Branches Lookup API Route
 *
 * Story 7.1: Payment Plans Report Generator with Contract Expiration Tracking
 * Task 7: Create Colleges/Branches/Students Lookup APIs
 *
 * This endpoint provides a list of branches for the current agency,
 * optionally filtered by college_id(s), to populate filter dropdowns
 * in the ReportBuilder component.
 *
 * Query Parameters:
 * - college_id (optional, repeatable): Filter branches by college ID(s)
 *
 * Returns: { id, name, college_id, contract_expiration_date }[]
 *
 * Security:
 * - Requires authentication (agency_admin or agency_user)
 * - RLS automatically filters by agency_id
 */

import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@pleeno/database/server'
import { requireRole } from '@pleeno/auth'
import { handleApiError, ForbiddenError } from '@pleeno/utils'

/**
 * GET /api/reports/lookup/branches?college_id=X
 *
 * Returns a list of branches for the current agency,
 * optionally filtered by college_id(s).
 *
 * @param request - Next.js request object
 * @returns Array of branches or error response
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
    const collegeIds = searchParams.getAll('college_id')

    // Create Supabase client
    const supabase = await createServerClient()

    // Build query for branches
    // RLS automatically filters by agency_id
    let query = supabase
      .from('branches')
      .select('id, name, college_id, enrollments(contract_expiration_date)')
      .eq('agency_id', userAgencyId)
      .order('name', { ascending: true })

    // Apply college_id filter if provided
    if (collegeIds.length > 0) {
      query = query.in('college_id', collegeIds)
    }

    const { data, error } = await query

    if (error) {
      console.error('Failed to fetch branches:', error)
      throw new Error('Failed to fetch branches')
    }

    // Transform data to include contract expiration date from enrollments
    // We'll use the most recent enrollment's contract_expiration_date
    const branches = (data || []).map((branch: any) => {
      // Find the most recent contract expiration date from enrollments
      let contractExpirationDate = null
      if (branch.enrollments && branch.enrollments.length > 0) {
        const validDates = branch.enrollments
          .map((e: any) => e.contract_expiration_date)
          .filter((date: any) => date !== null)
          .sort()
          .reverse()

        contractExpirationDate = validDates[0] || null
      }

      return {
        id: branch.id,
        name: branch.name,
        college_id: branch.college_id,
        contract_expiration_date: contractExpirationDate,
      }
    })

    return NextResponse.json(branches, { status: 200 })
  } catch (error) {
    return handleApiError(error, {
      path: '/api/reports/lookup/branches',
    })
  }
}
