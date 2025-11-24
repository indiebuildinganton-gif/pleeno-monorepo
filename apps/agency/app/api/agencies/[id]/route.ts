/**
 * Agency Profile API - Update agency information
 *
 * This endpoint allows agency admins to update their agency's profile information.
 * Multi-tenant security is enforced through role-based access control and RLS policies.
 *
 * Epic 2: Agency Configuration & User Management
 * Story 2-1: Agency Profile Setup
 * Task 2: Implement API Route for Agency Updates
 */

import { NextRequest, NextResponse } from 'next/server'
import {
  handleApiError,
  createSuccessResponse,
  ValidationError,
  ForbiddenError,
} from '@pleeno/utils'
import { createServerClient } from '@pleeno/database/server'
import { requireRole } from '@pleeno/auth/server'
import { AgencyUpdateSchema } from '@pleeno/validations'

/**
 * PATCH /api/agencies/[id]
 *
 * Updates an agency's profile information.
 * Only agency admins can update their own agency.
 *
 * Request body:
 * {
 *   "name": "Agency Name",
 *   "contact_email": "contact@agency.com",
 *   "contact_phone": "+1234567890",  // optional
 *   "currency": "USD",               // AUD, USD, EUR, GBP, NZD, CAD
 *   "timezone": "America/New_York"   // IANA timezone
 * }
 *
 * Security:
 * - requireRole() middleware enforces agency_admin access
 * - Validates user can only update their own agency
 * - RLS policies provide database-level isolation
 * - Request body validated with Zod schema
 *
 * @param request - Next.js request object
 * @param params - Route parameters containing agency ID
 * @returns Updated agency data or error response
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // SECURITY BOUNDARY: Only agency admins can update agency settings
    const authResult = await requireRole(request, ['agency_admin'])

    if (authResult instanceof NextResponse) {
      return authResult // Return 401 or 403 error response
    }

    const { user } = authResult

    // Parse and validate request body
    const body = await request.json()
    const result = AgencyUpdateSchema.safeParse(body)

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

    // SECURITY: Verify user is updating their own agency
    if (userAgencyId !== params.id) {
      throw new ForbiddenError('Cannot update other agencies')
    }

    // Create Supabase client
    const supabase = await createServerClient()

    // Update agency in database
    // RLS policies will enforce agency_id filtering as additional security layer
    const { data: agency, error: updateError } = await supabase
      .from('agencies')
      .update({
        name: validatedData.name,
        contact_email: validatedData.contact_email,
        contact_phone: validatedData.contact_phone,
        currency: validatedData.currency,
        timezone: validatedData.timezone,
        updated_at: new Date().toISOString(),
      })
      .eq('id', params.id)
      .select()
      .single()

    if (updateError) {
      console.error('Failed to update agency:', updateError)
      throw new Error('Failed to update agency')
    }

    if (!agency) {
      throw new Error('Agency not found after update')
    }

    // Return standardized success response
    return createSuccessResponse(agency)
  } catch (error) {
    return handleApiError(error, {
      path: `/api/agencies/${params.id}`,
    })
  }
}
