/**
 * Email Templates API - GET and POST endpoints
 *
 * Handles CRUD operations for email templates.
 * - GET: Fetches all templates for the current user's agency
 * - POST: Creates a new email template
 *
 * Epic 5: Intelligent Status Automation & Notifications
 * Story 5.5: Automated Email Notifications (Multi-Stakeholder)
 * Task 3: Email Template Management UI
 * Acceptance Criteria: AC #2
 */

import { NextRequest, NextResponse } from 'next/server'
import { handleApiError, createSuccessResponse } from '@pleeno/utils'
import { createServerClient } from '@pleeno/database/server'
import { requireRole } from '@pleeno/auth'
import { sanitizeHtml, validateTemplate } from '../../../lib/template-preview'

/**
 * GET /api/email-templates
 *
 * Fetches all email templates for the authenticated user's agency.
 * Templates are ordered by template_type.
 *
 * Security:
 * - requireRole() enforces authentication
 * - RLS policies ensure agency isolation
 *
 * @param request - Next.js request object
 * @returns Array of email templates or error response
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

    // Fetch email templates for this agency
    // RLS policies will enforce agency_id filtering as additional security layer
    const { data: templates, error: fetchError } = await supabase
      .from('email_templates')
      .select('*')
      .eq('agency_id', userAgencyId)
      .order('template_type', { ascending: true })

    if (fetchError) {
      console.error('Failed to fetch email templates:', fetchError)
      throw new Error('Failed to fetch email templates')
    }

    // Return standardized success response
    return createSuccessResponse(templates || [])
  } catch (error) {
    return handleApiError(error, {
      path: '/api/email-templates',
    })
  }
}

/**
 * POST /api/email-templates
 *
 * Creates a new email template for the authenticated user's agency.
 * Sanitizes HTML to prevent XSS attacks.
 *
 * Security:
 * - requireRole(['agency_admin']) ensures only admins can create templates
 * - HTML sanitization prevents XSS attacks
 * - RLS policies ensure agency isolation
 *
 * Request body:
 * {
 *   template_type: string,
 *   subject: string,
 *   body_html: string,
 *   variables?: Record<string, string>
 * }
 *
 * @param request - Next.js request object
 * @returns Created template or error response
 */
export async function POST(request: NextRequest) {
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

    // Parse request body
    const body = await request.json()

    // Validate required fields
    if (!body.template_type || !body.subject || !body.body_html) {
      return NextResponse.json(
        {
          success: false,
          error: {
            message: 'Missing required fields: template_type, subject, body_html',
            code: 'VALIDATION_ERROR',
          },
        },
        { status: 400 }
      )
    }

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
    const cleanHtml = sanitizeHtml(body.body_html)

    // Create Supabase client
    const supabase = await createServerClient()

    // Insert new template
    const { data: template, error: insertError } = await supabase
      .from('email_templates')
      .insert({
        agency_id: userAgencyId,
        template_type: body.template_type,
        subject: body.subject,
        body_html: cleanHtml,
        variables: body.variables || {},
      })
      .select()
      .single()

    if (insertError) {
      console.error('Failed to create email template:', insertError)
      throw new Error('Failed to create email template')
    }

    // Return standardized success response
    return createSuccessResponse(template, 201)
  } catch (error) {
    return handleApiError(error, {
      path: '/api/email-templates',
    })
  }
}
