/**
 * Email Templates API - PATCH and DELETE endpoints
 *
 * Handles update and delete operations for individual email templates.
 * - PATCH: Updates an existing email template
 * - DELETE: Deletes an email template
 *
 * Epic 5: Intelligent Status Automation & Notifications
 * Story 5.5: Automated Email Notifications (Multi-Stakeholder)
 * Task 3: Email Template Management UI
 * Acceptance Criteria: AC #2
 */

import { NextRequest, NextResponse } from 'next/server'
import { handleApiError, createSuccessResponse } from '@pleeno/utils'
import { createServerClient } from '@pleeno/database/server'
import { requireRole } from '@pleeno/auth/server'
import { sanitizeHtml, validateTemplate } from '../../../../lib/template-preview'

/**
 * PATCH /api/email-templates/[id]
 *
 * Updates an existing email template.
 * Sanitizes HTML to prevent XSS attacks.
 *
 * Security:
 * - requireRole(['agency_admin']) ensures only admins can update templates
 * - HTML sanitization prevents XSS attacks
 * - RLS policies ensure agency isolation
 *
 * Request body (all fields optional):
 * {
 *   template_type?: string,
 *   subject?: string,
 *   body_html?: string,
 *   variables?: Record<string, string>
 * }
 *
 * @param request - Next.js request object
 * @param params - Route parameters containing template ID
 * @returns Updated template or error response
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // SECURITY BOUNDARY: Require agency admin role
    const authResult = await requireRole(request, ['agency_admin'])

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

    // Get template ID from params
    const { id } = await params

    // Parse request body
    const body = await request.json()

    // Build update object with only provided fields
    const updates: Record<string, unknown> = {}

    if (body.template_type !== undefined) {
      updates.template_type = body.template_type
    }

    if (body.subject !== undefined) {
      updates.subject = body.subject
    }

    if (body.body_html !== undefined) {
      // Validate template syntax
      const validationErrors = validateTemplate(body.body_html)
      if (validationErrors.length > 0) {
        return NextResponse.json(
          {
            success: false,
            error: {
              message: `Template validation failed: ${validationErrors.join(', ')}`,
              code: 'VALIDATION_ERROR',
            },
          },
          { status: 400 }
        )
      }

      // Sanitize HTML to prevent XSS
      updates.body_html = sanitizeHtml(body.body_html)
    }

    if (body.variables !== undefined) {
      updates.variables = body.variables
    }

    // Check if there are any updates
    if (Object.keys(updates).length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: {
            message: 'No fields to update',
            code: 'VALIDATION_ERROR',
          },
        },
        { status: 400 }
      )
    }

    // Create Supabase client
    const supabase = await createServerClient()

    // Update template
    // RLS policies will ensure the template belongs to the user's agency
    const { data: template, error: updateError } = await supabase
      .from('email_templates')
      .update(updates)
      .eq('id', id)
      .eq('agency_id', userAgencyId) // Additional safety check
      .select()
      .single()

    if (updateError) {
      console.error('Failed to update email template:', updateError)

      // Check if template doesn't exist or doesn't belong to agency
      if (updateError.code === 'PGRST116') {
        return NextResponse.json(
          {
            success: false,
            error: {
              message: 'Template not found',
              code: 'NOT_FOUND',
            },
          },
          { status: 404 }
        )
      }

      throw new Error('Failed to update email template')
    }

    // Return standardized success response
    return createSuccessResponse(template)
  } catch (error) {
    return handleApiError(error, {
      path: `/api/email-templates/${(await params).id}`,
    })
  }
}

/**
 * DELETE /api/email-templates/[id]
 *
 * Deletes an email template.
 *
 * Security:
 * - requireRole(['agency_admin']) ensures only admins can delete templates
 * - RLS policies ensure agency isolation
 *
 * @param request - Next.js request object
 * @param params - Route parameters containing template ID
 * @returns Success response or error
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // SECURITY BOUNDARY: Require agency admin role
    const authResult = await requireRole(request, ['agency_admin'])

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

    // Get template ID from params
    const { id } = await params

    // Create Supabase client
    const supabase = await createServerClient()

    // Delete template
    // RLS policies will ensure the template belongs to the user's agency
    const { error: deleteError } = await supabase
      .from('email_templates')
      .delete()
      .eq('id', id)
      .eq('agency_id', userAgencyId) // Additional safety check

    if (deleteError) {
      console.error('Failed to delete email template:', deleteError)
      throw new Error('Failed to delete email template')
    }

    // Return success response
    return createSuccessResponse({ message: 'Template deleted successfully' })
  } catch (error) {
    return handleApiError(error, {
      path: `/api/email-templates/${(await params).id}`,
    })
  }
}
