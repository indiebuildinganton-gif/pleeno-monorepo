/**
 * College API - List and Create Operations
 *
 * This endpoint provides college listing with pagination and college creation.
 *
 * Epic 3: Entities Domain
 * Story 3.1: College Registry
 * Task 06: Implement Colleges API Endpoints (List & Create)
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
import { CollegeCreateSchema } from '@pleeno/validations'

/**
 * GET /api/colleges
 *
 * Returns a paginated list of colleges for the authenticated user's agency.
 * All colleges are automatically filtered by RLS based on agency_id.
 *
 * Query parameters:
 * - page: number (optional, default: 1) - Page number for pagination
 * - per_page: number (optional, default: 20) - Number of items per page
 *
 * Response (200):
 * {
 *   "success": true,
 *   "data": [...college objects...],
 *   "meta": {
 *     "total": 50,
 *     "page": 1,
 *     "per_page": 20,
 *     "total_pages": 3
 *   }
 * }
 *
 * Security:
 * - Requires authentication (agency_admin or agency_user)
 * - RLS policies automatically filter by agency_id
 * - All queries are scoped to the user's agency
 *
 * @param request - Next.js request object
 * @returns Paginated list of colleges or error response
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

    // Parse query parameters
    const searchParams = request.nextUrl.searchParams
    const page = parseInt(searchParams.get('page') || '1', 10)
    const perPage = parseInt(searchParams.get('per_page') || '20', 10)

    // Validate pagination parameters
    if (page < 1 || perPage < 1 || perPage > 100) {
      throw new ValidationError('Invalid pagination parameters')
    }

    // Calculate offset for pagination
    const offset = (page - 1) * perPage

    // Build query with RLS-enforced agency filtering
    let query = supabase
      .from('colleges')
      .select('*', { count: 'exact' })
      .eq('agency_id', userAgencyId)

    // Apply pagination and ordering
    query = query
      .order('name', { ascending: true })
      .range(offset, offset + perPage - 1)

    const { data: colleges, error, count } = await query

    if (error) {
      console.error('Failed to fetch colleges:', error)
      throw new Error('Failed to fetch colleges')
    }

    // Calculate total pages
    const totalPages = count ? Math.ceil(count / perPage) : 0

    // Return paginated response with metadata
    return NextResponse.json(
      {
        success: true,
        data: colleges || [],
        meta: {
          total: count || 0,
          page,
          per_page: perPage,
          total_pages: totalPages,
        },
      },
      { status: 200 }
    )
  } catch (error) {
    return handleApiError(error, {
      path: '/api/colleges',
    })
  }
}

/**
 * POST /api/colleges
 *
 * Creates a new college with the provided information.
 * Only agency admins can create colleges.
 * Validates commission rate (0-100%) and GST status.
 *
 * Request body:
 * {
 *   "name": "University of Example",                    // Required (unique per agency)
 *   "city": "Sydney",                                   // Optional
 *   "country": "Australia",                             // Optional
 *   "default_commission_rate_percent": 15,              // Required (0-100)
 *   "gst_status": "included",                           // Required: "included" or "excluded"
 *   "contract_expiration_date": "2025-12-31"            // Optional: YYYY-MM-DD format
 * }
 *
 * Response (200):
 * {
 *   "success": true,
 *   "data": {...college object...}
 * }
 *
 * Error responses:
 * - 400: Validation error or duplicate college name
 * - 401: Not authenticated
 * - 403: Not authorized (non-admin)
 *
 * Security:
 * - Requires authentication as agency_admin
 * - RLS policies automatically set agency_id
 * - College name must be unique within agency
 * - All operations logged to audit_logs (via trigger)
 *
 * @param request - Next.js request object
 * @returns Created college object or error response
 */
export async function POST(request: NextRequest) {
  try {
    // SECURITY BOUNDARY: Require admin authentication
    const authResult = await requireRole(request, ['agency_admin'])

    if (authResult instanceof NextResponse) {
      return authResult // Return 401 or 403 error response
    }

    const { user } = authResult

    // Parse and validate request body
    const body = await request.json()
    const result = CollegeCreateSchema.safeParse(body)

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

    // Create college record
    // RLS policies will enforce agency_id filtering
    const { data: college, error: insertError } = await supabase
      .from('colleges')
      .insert({
        agency_id: userAgencyId,
        name: validatedData.name,
        city: validatedData.city || null,
        country: validatedData.country || null,
        default_commission_rate_percent: validatedData.default_commission_rate_percent,
        gst_status: validatedData.gst_status,
        contract_expiration_date: validatedData.contract_expiration_date || null,
      })
      .select()
      .single()

    if (insertError) {
      console.error('Failed to create college:', insertError)

      // Check for duplicate college name constraint violation
      // PostgreSQL unique constraint violation code: 23505
      if (insertError.code === '23505') {
        throw new ValidationError(
          'A college with this name already exists in your agency'
        )
      }

      throw new Error('Failed to create college')
    }

    if (!college) {
      throw new Error('College not found after creation')
    }

    // Log college creation to audit trail
    // Note: This is handled by database trigger if configured
    await supabase.from('audit_logs').insert({
      entity_type: 'college',
      entity_id: college.id,
      user_id: user.id,
      action: 'create',
      changes_json: {
        name: college.name,
        city: college.city,
        country: college.country,
        default_commission_rate_percent: college.default_commission_rate_percent,
        gst_status: college.gst_status,
        contract_expiration_date: college.contract_expiration_date,
      },
    })

    // Return standardized success response
    return createSuccessResponse(college)
  } catch (error) {
    return handleApiError(error, {
      path: '/api/colleges',
    })
  }
}
