/**
 * Contact Detail API - Update and Delete Operations
 *
 * This endpoint provides contact update and deletion operations with
 * email/phone validation and audit logging.
 *
 * Epic 3: Entities Domain
 * Story 3.1: College Registry
 * Task 09: Implement Contacts API Endpoints
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
import { ContactUpdateSchema } from '@pleeno/validations'

/**
 * PATCH /api/contacts/[id]
 *
 * Updates a contact's information. Only agency admins can update contacts.
 * Email and phone formats are validated if provided.
 * All changes are logged to audit_logs for compliance tracking.
 *
 * Request body (all fields optional):
 * {
 *   "name": "John Smith",                       // Optional
 *   "role_department": "Admissions",            // Optional
 *   "position_title": "Director",               // Optional
 *   "email": "john.smith@college.edu",          // Optional (validated if provided)
 *   "phone": "+1234567890"                      // Optional (validated if provided)
 * }
 *
 * Response (200):
 * {
 *   "success": true,
 *   "data": {...updated contact object...}
 * }
 *
 * Error responses:
 * - 400: Validation error (invalid email/phone format, etc.)
 * - 401: Not authenticated
 * - 403: Not authorized (non-admin or different agency)
 * - 404: Contact not found
 *
 * Security:
 * - Requires authentication as agency_admin
 * - RLS policies automatically enforce agency_id filtering
 * - All changes logged to audit_logs
 *
 * @param request - Next.js request object
 * @param params - Route parameters containing contact id
 * @returns Updated contact object or error response
 */
export async function PATCH(
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
    const contactId = params.id
    if (
      !contactId ||
      !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
        contactId
      )
    ) {
      throw new ValidationError('Invalid contact ID format')
    }

    // Parse and validate request body
    const body = await request.json()
    const result = ContactUpdateSchema.safeParse(body)

    if (!result.success) {
      throw new ValidationError('Validation failed', {
        errors: result.error.flatten().fieldErrors,
      })
    }

    const validatedData = result.data

    // Check if there's anything to update
    if (Object.keys(validatedData).length === 0) {
      throw new ValidationError('No fields to update')
    }

    // Create Supabase client
    const supabase = await createServerClient()

    // First, fetch the current contact data for audit logging
    const { data: currentContact, error: fetchError } = await supabase
      .from('college_contacts')
      .select('*')
      .eq('id', contactId)
      .eq('agency_id', userAgencyId)
      .single()

    if (fetchError || !currentContact) {
      console.error('Failed to fetch contact:', fetchError)

      if (fetchError?.code === 'PGRST116') {
        throw new NotFoundError('Contact not found')
      }

      throw new Error('Failed to fetch contact')
    }

    // Update contact record
    // RLS policies will enforce agency_id filtering and admin-only access
    const { data: updatedContact, error: updateError } = await supabase
      .from('college_contacts')
      .update({
        name: validatedData.name,
        role_department: validatedData.role_department,
        position_title: validatedData.position_title,
        email: validatedData.email,
        phone: validatedData.phone,
      })
      .eq('id', contactId)
      .eq('agency_id', userAgencyId)
      .select()
      .single()

    if (updateError) {
      console.error('Failed to update contact:', updateError)
      throw new Error('Failed to update contact')
    }

    if (!updatedContact) {
      throw new Error('Contact not found after update')
    }

    // Log contact update to audit trail
    // Compare old and new values to track what changed
    const changes: Record<string, { old: any; new: any }> = {}

    Object.keys(validatedData).forEach((key) => {
      const oldValue = currentContact[key as keyof typeof currentContact]
      const newValue = updatedContact[key as keyof typeof updatedContact]

      if (oldValue !== newValue) {
        changes[key] = { old: oldValue, new: newValue }
      }
    })

    await supabase.from('audit_logs').insert({
      entity_type: 'college_contact',
      entity_id: updatedContact.id,
      user_id: user.id,
      action: 'update',
      changes_json: changes,
    })

    // Return standardized success response
    return createSuccessResponse(updatedContact)
  } catch (error) {
    return handleApiError(error, {
      path: `/api/contacts/${params.id}`,
    })
  }
}

/**
 * DELETE /api/contacts/[id]
 *
 * Deletes a contact. Only agency admins can delete contacts.
 * All deletions are logged to audit_logs for compliance tracking.
 *
 * Response (200):
 * {
 *   "success": true,
 *   "message": "Contact deleted successfully"
 * }
 *
 * Error responses:
 * - 401: Not authenticated
 * - 403: Not authorized (non-admin or different agency)
 * - 404: Contact not found
 *
 * Security:
 * - Requires authentication as agency_admin
 * - RLS policies automatically enforce agency_id filtering
 * - Deletion logged to audit_logs
 *
 * @param request - Next.js request object
 * @param params - Route parameters containing contact id
 * @returns Success message or error response
 */
export async function DELETE(
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
    const contactId = params.id
    if (
      !contactId ||
      !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
        contactId
      )
    ) {
      throw new ValidationError('Invalid contact ID format')
    }

    // Create Supabase client
    const supabase = await createServerClient()

    // First, verify the contact exists and belongs to the user's agency
    const { data: contact, error: fetchError } = await supabase
      .from('college_contacts')
      .select('id, name, college_id')
      .eq('id', contactId)
      .eq('agency_id', userAgencyId)
      .single()

    if (fetchError || !contact) {
      console.error('Failed to fetch contact:', fetchError)

      if (fetchError?.code === 'PGRST116') {
        throw new NotFoundError('Contact not found')
      }

      throw new Error('Failed to fetch contact')
    }

    // Delete the contact
    const { error: deleteError } = await supabase
      .from('college_contacts')
      .delete()
      .eq('id', contactId)
      .eq('agency_id', userAgencyId)

    if (deleteError) {
      console.error('Failed to delete contact:', deleteError)
      throw new Error('Failed to delete contact')
    }

    // Log contact deletion to audit trail
    await supabase.from('audit_logs').insert({
      entity_type: 'college_contact',
      entity_id: contactId,
      user_id: user.id,
      action: 'delete',
      changes_json: {
        name: contact.name,
        college_id: contact.college_id,
      },
    })

    // Return success response
    return NextResponse.json(
      {
        success: true,
        message: 'Contact deleted successfully',
      },
      { status: 200 }
    )
  } catch (error) {
    return handleApiError(error, {
      path: `/api/contacts/${params.id}`,
    })
  }
}
