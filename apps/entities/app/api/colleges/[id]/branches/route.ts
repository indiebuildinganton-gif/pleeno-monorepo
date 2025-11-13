/**
 * College Branches API - List and Create Operations
 *
 * This endpoint provides branch listing and creation operations for a specific college
 * with automatic commission rate inheritance from the college's default rate.
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
import { requireRole } from '@pleeno/auth'
import { BranchCreateSchema } from '@pleeno/validations'

/**
 * GET /api/colleges/[id]/branches
 *
 * Returns all branches for a specific college. All data is automatically filtered
 * by RLS based on agency_id.
 *
 * Response (200):
 * {
 *   "success": true,
 *   "data": [
 *     {
 *       "id": "uuid",
 *       "college_id": "uuid",
 *       "agency_id": "uuid",
 *       "name": "Main Campus",
 *       "city": "Sydney",
 *       "commission_rate_percent": 15,
 *       "created_at": "2024-01-01T00:00:00Z",
 *       "updated_at": "2024-01-01T00:00:00Z"
 *     }
 *   ]
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
 * @returns List of branches or error response
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

    // First, verify that the college exists and belongs to the user's agency
    const { data: college, error: collegeError } = await supabase
      .from('colleges')
      .select('id')
      .eq('id', collegeId)
      .eq('agency_id', userAgencyId)
      .single()

    if (collegeError || !college) {
      console.error('Failed to fetch college:', collegeError)

      if (collegeError?.code === 'PGRST116') {
        throw new NotFoundError('College not found')
      }

      throw new Error('Failed to fetch college')
    }

    // Fetch all branches for the college
    // RLS policies will enforce agency filtering
    const { data: branches, error: branchesError } = await supabase
      .from('branches')
      .select('*')
      .eq('college_id', collegeId)
      .eq('agency_id', userAgencyId)
      .order('created_at', { ascending: false })

    if (branchesError) {
      console.error('Failed to fetch branches:', branchesError)
      throw new Error('Failed to fetch branches')
    }

    // Return branches list (may be empty array)
    return createSuccessResponse(branches || [])
  } catch (error) {
    return handleApiError(error, {
      path: `/api/colleges/${params.id}/branches`,
    })
  }
}

/**
 * POST /api/colleges/[id]/branches
 *
 * Creates a new branch for a specific college. Only agency admins can create branches.
 * Commission rate is automatically inherited from college default if not provided.
 * All changes are logged to audit_logs for compliance tracking.
 *
 * Request body:
 * {
 *   "name": "Main Campus",                           // Required
 *   "city": "Sydney",                                // Required
 *   "commission_rate_percent": 15                    // Optional (0-100), inherits from college if not provided
 * }
 *
 * Response (201):
 * {
 *   "success": true,
 *   "data": {
 *     "id": "uuid",
 *     "college_id": "uuid",
 *     "agency_id": "uuid",
 *     "name": "Main Campus",
 *     "city": "Sydney",
 *     "commission_rate_percent": 15,
 *     "created_at": "2024-01-01T00:00:00Z",
 *     "updated_at": "2024-01-01T00:00:00Z"
 *   }
 * }
 *
 * Error responses:
 * - 400: Validation error
 * - 401: Not authenticated
 * - 403: Not authorized (non-admin or different agency)
 * - 404: College not found
 *
 * Security:
 * - Requires authentication as agency_admin
 * - RLS policies automatically enforce agency_id filtering
 * - Commission rate auto-populated from college default via database trigger
 * - All changes logged to audit_logs
 *
 * @param request - Next.js request object
 * @param params - Route parameters containing college id
 * @returns Created branch object or error response
 */
export async function POST(
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
    const result = BranchCreateSchema.safeParse(body)

    if (!result.success) {
      throw new ValidationError('Validation failed', {
        errors: result.error.flatten().fieldErrors,
      })
    }

    const validatedData = result.data

    // Create Supabase client
    const supabase = await createServerClient()

    // First, verify that the college exists and belongs to the user's agency
    const { data: college, error: collegeError } = await supabase
      .from('colleges')
      .select('id, name, default_commission_rate_percent')
      .eq('id', collegeId)
      .eq('agency_id', userAgencyId)
      .single()

    if (collegeError || !college) {
      console.error('Failed to fetch college:', collegeError)

      if (collegeError?.code === 'PGRST116') {
        throw new NotFoundError('College not found')
      }

      throw new Error('Failed to fetch college')
    }

    // Create the branch
    // The database trigger will automatically populate commission_rate_percent
    // from the college's default_commission_rate_percent if not provided
    // RLS policies will enforce agency_id filtering and admin-only access
    const { data: newBranch, error: createError } = await supabase
      .from('branches')
      .insert({
        college_id: collegeId,
        agency_id: userAgencyId,
        name: validatedData.name,
        city: validatedData.city,
        commission_rate_percent: validatedData.commission_rate_percent,
      })
      .select()
      .single()

    if (createError) {
      console.error('Failed to create branch:', createError)
      throw new Error('Failed to create branch')
    }

    if (!newBranch) {
      throw new Error('Branch not created')
    }

    // Log branch creation to audit trail
    await supabase.from('audit_logs').insert({
      entity_type: 'branch',
      entity_id: newBranch.id,
      user_id: user.id,
      action: 'create',
      changes_json: {
        college_id: collegeId,
        college_name: college.name,
        name: newBranch.name,
        city: newBranch.city,
        commission_rate_percent: newBranch.commission_rate_percent,
        inherited_commission:
          validatedData.commission_rate_percent === null ||
          validatedData.commission_rate_percent === undefined,
      },
    })

    // Return standardized success response with 201 status
    return NextResponse.json(
      {
        success: true,
        data: newBranch,
      },
      { status: 201 }
    )
  } catch (error) {
    return handleApiError(error, {
      path: `/api/colleges/${params.id}/branches`,
    })
  }
}
