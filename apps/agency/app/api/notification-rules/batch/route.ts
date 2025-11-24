/**
 * Notification Rules Batch Update API
 *
 * Allows agency admins to update multiple notification rules at once.
 * Used by the notification settings page to save all changes in a single request.
 *
 * Epic 5: Intelligent Status Automation & Notifications
 * Story 5.5: Automated Email Notifications (Multi-Stakeholder)
 * Task 2: Notification Settings UI
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
import { NotificationRulesBatchUpdateSchema } from '@pleeno/validations'

/**
 * POST /api/notification-rules/batch
 *
 * Updates multiple notification rules at once. Creates rules if they don't exist,
 * updates them if they do. This is the primary endpoint used by the notification
 * settings page.
 *
 * Request body:
 * {
 *   "rules": [
 *     {
 *       "recipient_type": "agency_user",
 *       "event_type": "overdue",
 *       "is_enabled": true
 *     },
 *     ...
 *   ]
 * }
 *
 * Security:
 * - requireRole() middleware enforces agency_admin access
 * - Validates user can only update their own agency's rules
 * - RLS policies provide database-level isolation
 *
 * @param request - Next.js request object
 * @returns Updated rules or error response
 */
export async function POST(request: NextRequest) {
  try {
    // SECURITY BOUNDARY: Only agency admins can update notification settings
    const authResult = await requireRole(request, ['agency_admin'])

    if (authResult instanceof NextResponse) {
      return authResult // Return 401 or 403 error response
    }

    const { user } = authResult

    // Parse and validate request body
    const body = await request.json()
    const result = NotificationRulesBatchUpdateSchema.safeParse(body)

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

    // Process each rule update
    const updates = []
    for (const rule of validatedData.rules) {
      // Use upsert to insert or update the rule
      // The UNIQUE constraint on (agency_id, recipient_type, event_type) ensures no duplicates
      const { data, error } = await supabase
        .from('notification_rules')
        .upsert(
          {
            agency_id: userAgencyId,
            recipient_type: rule.recipient_type,
            event_type: rule.event_type,
            is_enabled: rule.is_enabled,
            updated_at: new Date().toISOString(),
          },
          {
            onConflict: 'agency_id,recipient_type,event_type',
          }
        )
        .select()
        .single()

      if (error) {
        console.error('Failed to upsert notification rule:', error)
        throw new Error(`Failed to update rule for ${rule.recipient_type}:${rule.event_type}`)
      }

      updates.push(data)
    }

    // Return standardized success response
    return createSuccessResponse({
      message: 'Notification settings updated successfully',
      updated_count: updates.length,
      rules: updates,
    })
  } catch (error) {
    return handleApiError(error, {
      path: '/api/notification-rules/batch',
    })
  }
}
