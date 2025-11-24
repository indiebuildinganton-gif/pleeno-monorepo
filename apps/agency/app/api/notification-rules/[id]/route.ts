/**
 * Notification Rules Individual API - PATCH and DELETE endpoints
 *
 * Allows agency admins to update or delete individual notification rules.
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
import { NotificationRuleUpdateSchema } from '@pleeno/validations'

/**
 * PATCH /api/notification-rules/[id]
 *
 * Updates a single notification rule.
 *
 * Request body:
 * {
 *   "is_enabled": true,
 *   "template_id": "uuid",
 *   "trigger_config": { "advance_hours": 36 }
 * }
 *
 * Security:
 * - requireRole() middleware enforces agency_admin access
 * - Validates user can only update their own agency's rules
 * - RLS policies provide database-level isolation
 *
 * @param request - Next.js request object
 * @param params - Route parameters containing rule ID
 * @returns Updated rule or error response
 */
export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    // SECURITY BOUNDARY: Only agency admins can update notification rules
    const authResult = await requireRole(request, ['agency_admin'])

    if (authResult instanceof NextResponse) {
      return authResult // Return 401 or 403 error response
    }

    const { user } = authResult

    // Parse and validate request body
    const body = await request.json()
    const result = NotificationRuleUpdateSchema.safeParse(body)

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

    // First, verify the rule belongs to the user's agency
    const { data: existingRule, error: fetchError } = await supabase
      .from('notification_rules')
      .select('agency_id')
      .eq('id', params.id)
      .single()

    if (fetchError || !existingRule) {
      return NextResponse.json(
        {
          success: false,
          error: {
            message: 'Notification rule not found',
            code: 'NOT_FOUND',
          },
        },
        { status: 404 }
      )
    }

    // SECURITY: Verify the rule belongs to the user's agency
    if (existingRule.agency_id !== userAgencyId) {
      throw new ForbiddenError('Cannot update notification rules from other agencies')
    }

    // Build update object with only provided fields
    const updateData: Record<string, any> = {
      updated_at: new Date().toISOString(),
    }

    if (validatedData.is_enabled !== undefined) {
      updateData.is_enabled = validatedData.is_enabled
    }

    if (validatedData.template_id !== undefined) {
      updateData.template_id = validatedData.template_id
    }

    if (validatedData.trigger_config !== undefined) {
      updateData.trigger_config = validatedData.trigger_config
    }

    // Update the notification rule
    const { data: rule, error: updateError } = await supabase
      .from('notification_rules')
      .update(updateData)
      .eq('id', params.id)
      .select()
      .single()

    if (updateError) {
      console.error('Failed to update notification rule:', updateError)
      throw new Error('Failed to update notification rule')
    }

    if (!rule) {
      throw new Error('Notification rule not found after update')
    }

    // Return standardized success response
    return createSuccessResponse(rule)
  } catch (error) {
    return handleApiError(error, {
      path: `/api/notification-rules/${params.id}`,
    })
  }
}

/**
 * DELETE /api/notification-rules/[id]
 *
 * Deletes a notification rule.
 *
 * Security:
 * - requireRole() middleware enforces agency_admin access
 * - Validates user can only delete their own agency's rules
 * - RLS policies provide database-level isolation
 *
 * @param request - Next.js request object
 * @param params - Route parameters containing rule ID
 * @returns Success message or error response
 */
export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    // SECURITY BOUNDARY: Only agency admins can delete notification rules
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

    // Create Supabase client
    const supabase = await createServerClient()

    // First, verify the rule belongs to the user's agency
    const { data: existingRule, error: fetchError } = await supabase
      .from('notification_rules')
      .select('agency_id')
      .eq('id', params.id)
      .single()

    if (fetchError || !existingRule) {
      return NextResponse.json(
        {
          success: false,
          error: {
            message: 'Notification rule not found',
            code: 'NOT_FOUND',
          },
        },
        { status: 404 }
      )
    }

    // SECURITY: Verify the rule belongs to the user's agency
    if (existingRule.agency_id !== userAgencyId) {
      throw new ForbiddenError('Cannot delete notification rules from other agencies')
    }

    // Delete the notification rule
    const { error: deleteError } = await supabase
      .from('notification_rules')
      .delete()
      .eq('id', params.id)

    if (deleteError) {
      console.error('Failed to delete notification rule:', deleteError)
      throw new Error('Failed to delete notification rule')
    }

    // Return standardized success response
    return createSuccessResponse({
      message: 'Notification rule deleted successfully',
    })
  } catch (error) {
    return handleApiError(error, {
      path: `/api/notification-rules/${params.id}`,
    })
  }
}
