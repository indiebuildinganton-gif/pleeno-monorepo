/**
 * Notification Rules API - GET endpoint
 *
 * Fetches all notification rules for the current user's agency.
 * Returns rules for all recipient types and event types.
 *
 * Epic 5: Intelligent Status Automation & Notifications
 * Story 5.5: Automated Email Notifications (Multi-Stakeholder)
 * Task 2: Notification Settings UI
 */

import { NextRequest, NextResponse } from 'next/server'
import { handleApiError, createSuccessResponse } from '@pleeno/utils'
import { createServerClient } from '@pleeno/database/server'
import { requireRole } from '@pleeno/auth/server'

/**
 * GET /api/notification-rules
 *
 * Fetches all notification rules for the authenticated user's agency.
 * Rules control when and to whom notifications are sent.
 *
 * Security:
 * - requireRole() enforces authentication
 * - RLS policies ensure agency isolation
 *
 * @param request - Next.js request object
 * @returns Array of notification rules or error response
 */
export async function GET(request: NextRequest) {
  try {
    // SECURITY BOUNDARY: Require authenticated user
    const authResult = await requireRole(request, ['agency_admin', 'agency_user'])

    if (authResult instanceof NextResponse) {
      return authResult // Return 401 or 403 error response
    }

    const { user } = authResult

    // Get user's agency_id from JWT metadata
    const userAgencyId = user.app_metadata?.agency_id

    if (!userAgencyId) {
      return NextResponse.json(
        {
          success: false,
          error: {
            message: 'User not associated with an agency',
            code: 'FORBIDDEN',
          },
        },
        { status: 403 }
      )
    }

    // Create Supabase client
    const supabase = await createServerClient()

    // Fetch notification rules for this agency
    // RLS policies will enforce agency_id filtering as additional security layer
    const { data: rules, error: fetchError } = await supabase
      .from('notification_rules')
      .select('*')
      .eq('agency_id', userAgencyId)
      .order('recipient_type', { ascending: true })
      .order('event_type', { ascending: true })

    if (fetchError) {
      console.error('Failed to fetch notification rules:', fetchError)
      throw new Error('Failed to fetch notification rules')
    }

    // Return standardized success response
    return createSuccessResponse(rules || [])
  } catch (error) {
    return handleApiError(error, {
      path: '/api/notification-rules',
    })
  }
}
