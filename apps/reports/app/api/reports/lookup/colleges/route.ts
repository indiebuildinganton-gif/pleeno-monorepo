/**
 * Colleges Lookup API Route
 *
 * Story 7.1: Payment Plans Report Generator with Contract Expiration Tracking
 * Task 7: Create Colleges/Branches/Students Lookup APIs
 *
 * This endpoint provides a list of colleges for the current agency
 * to populate filter dropdowns in the ReportBuilder component.
 *
 * Returns: { id, name, branch_count }[]
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
 * GET /api/reports/lookup/colleges
 *
 * Returns a list of colleges for the current agency with branch counts.
 *
 * @param request - Next.js request object
 * @returns Array of colleges with branch counts or error response
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

    // Query colleges with branch count
    // RLS automatically filters by agency_id
    const { data, error } = await supabase
      .from('colleges')
      .select('id, name, branches(count)')
      .eq('agency_id', userAgencyId)
      .order('name', { ascending: true })

    if (error) {
      console.error('Failed to fetch colleges:', error)
      throw new Error('Failed to fetch colleges')
    }

    // Transform data to include branch count
    const colleges = (data || []).map((c: any) => ({
      id: c.id,
      name: c.name,
      branch_count: c.branches[0]?.count || 0,
    }))

    return NextResponse.json(colleges, { status: 200 })
  } catch (error) {
    return handleApiError(error, {
      path: '/api/reports/lookup/colleges',
    })
  }
}
