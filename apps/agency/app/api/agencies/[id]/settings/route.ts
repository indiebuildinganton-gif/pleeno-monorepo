/**
 * Agency Settings API - Update agency configuration settings
 *
 * This endpoint allows agency admins to update configuration settings like
 * notification thresholds and other agency-specific preferences.
 * Multi-tenant security is enforced through role-based access control and RLS policies.
 *
 * Epic 5: Automated Installment Status Management
 * Story 5.2: Due Soon Notification Flags
 * Task 1: Implement "due soon" computed field logic
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
import { AgencySettingsUpdateSchema } from '@pleeno/validations'

/**
 * PATCH /api/agencies/[id]/settings
 *
 * Updates an agency's configuration settings.
 * Only agency admins can update their own agency settings.
 *
 * Request body:
 * {
 *   "due_soon_threshold_days": 4  // Number of days (1-30)
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
export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    // SECURITY BOUNDARY: Only agency admins can update agency settings
    const authResult = await requireRole(request, ['agency_admin'])

    if (authResult instanceof NextResponse) {
      return authResult // Return 401 or 403 error response
    }

    const { user } = authResult

    // Parse and validate request body
    const body = await request.json()
    const result = AgencySettingsUpdateSchema.safeParse(body)

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

    // Build update object with only provided fields
    const updateData: Record<string, any> = {
      updated_at: new Date().toISOString(),
    }

    if (validatedData.due_soon_threshold_days !== undefined) {
      updateData.due_soon_threshold_days = validatedData.due_soon_threshold_days
    }

    // Update agency settings in database
    // RLS policies will enforce agency_id filtering as additional security layer
    const { data: agency, error: updateError } = await supabase
      .from('agencies')
      .update(updateData)
      .eq('id', params.id)
      .select()
      .single()

    if (updateError) {
      console.error('Failed to update agency settings:', updateError)
      throw new Error('Failed to update agency settings')
    }

    if (!agency) {
      throw new Error('Agency not found after update')
    }

    // Return standardized success response
    return createSuccessResponse(agency)
  } catch (error) {
    return handleApiError(error, {
      path: `/api/agencies/${params.id}/settings`,
    })
  }
}
