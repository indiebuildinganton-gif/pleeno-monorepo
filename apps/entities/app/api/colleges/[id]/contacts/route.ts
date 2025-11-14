/**
 * College Contacts API - List and Create Operations
 *
 * This endpoint provides contact listing and creation operations for a specific college
 * with email and phone validation.
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
  requireAdmin,
} from '@pleeno/utils'
import { createServerClient } from '@pleeno/database/server'
import { requireRole } from '@pleeno/auth'
import { ContactCreateSchema } from '@pleeno/validations'

/**
 * GET /api/colleges/[id]/contacts
 *
 * Returns all contacts for a specific college. All data is automatically filtered
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
 *       "name": "John Smith",
 *       "role_department": "Admissions",
 *       "position_title": "Director of International Admissions",
 *       "email": "john.smith@college.edu",
 *       "phone": "+1234567890",
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
 * @returns List of contacts or error response
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

    // Fetch all contacts for the college
    // RLS policies will enforce agency filtering
    const { data: contacts, error: contactsError } = await supabase
      .from('college_contacts')
      .select('*')
      .eq('college_id', collegeId)
      .eq('agency_id', userAgencyId)
      .order('created_at', { ascending: false })

    if (contactsError) {
      console.error('Failed to fetch contacts:', contactsError)
      throw new Error('Failed to fetch contacts')
    }

    // Return contacts list (may be empty array)
    return createSuccessResponse(contacts || [])
  } catch (error) {
    return handleApiError(error, {
      path: `/api/colleges/${params.id}/contacts`,
    })
  }
}

/**
 * POST /api/colleges/[id]/contacts
 *
 * Creates a new contact for a specific college. Only agency admins can create contacts.
 * Email and phone formats are validated if provided.
 * All changes are automatically logged to audit_logs via database trigger.
 *
 * Request body:
 * {
 *   "name": "John Smith",                          // Required
 *   "role_department": "Admissions",               // Optional
 *   "position_title": "Director",                  // Optional
 *   "email": "john.smith@college.edu",             // Optional (validated if provided)
 *   "phone": "+1234567890"                         // Optional (validated if provided)
 * }
 *
 * Response (201):
 * {
 *   "success": true,
 *   "data": {
 *     "id": "uuid",
 *     "college_id": "uuid",
 *     "agency_id": "uuid",
 *     "name": "John Smith",
 *     "role_department": "Admissions",
 *     "position_title": "Director",
 *     "email": "john.smith@college.edu",
 *     "phone": "+1234567890",
 *     "created_at": "2024-01-01T00:00:00Z",
 *     "updated_at": "2024-01-01T00:00:00Z"
 *   }
 * }
 *
 * Error responses:
 * - 400: Validation error (invalid email/phone format, missing name, etc.)
 * - 401: Not authenticated
 * - 403: Not authorized (non-admin or different agency)
 * - 404: College not found
 *
 * Security:
 * - Requires authentication as agency_admin
 * - RLS policies automatically enforce agency_id filtering
 * - Email and phone formats validated before insertion
 * - All changes logged to audit_logs via database trigger
 *
 * @param request - Next.js request object
 * @param params - Route parameters containing college id
 * @returns Created contact object or error response
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Create Supabase client
    const supabase = await createServerClient()

    // SECURITY BOUNDARY: Require admin authentication
    await requireAdmin(supabase)

    // Get authenticated user for audit logging
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      throw new ForbiddenError('User not authenticated')
    }

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
    const result = ContactCreateSchema.safeParse(body)

    if (!result.success) {
      throw new ValidationError('Validation failed', {
        errors: result.error.flatten().fieldErrors,
      })
    }

    const validatedData = result.data

    // First, verify that the college exists and belongs to the user's agency
    const { data: college, error: collegeError } = await supabase
      .from('colleges')
      .select('id, name')
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

    // Create the contact
    // RLS policies will enforce agency_id filtering and admin-only access
    // Database trigger will automatically log the change to audit_logs
    const { data: newContact, error: createError } = await supabase
      .from('college_contacts')
      .insert({
        college_id: collegeId,
        agency_id: userAgencyId,
        name: validatedData.name,
        role_department: validatedData.role_department,
        position_title: validatedData.position_title,
        email: validatedData.email,
        phone: validatedData.phone,
      })
      .select()
      .single()

    if (createError) {
      console.error('Failed to create contact:', createError)
      throw new Error('Failed to create contact')
    }

    if (!newContact) {
      throw new Error('Contact not created')
    }

    // Note: Audit logging is handled automatically by database trigger
    // The trigger logs to audit_logs with entity_type='college_contact' and action='contact_created'

    // Return standardized success response with 201 status
    return NextResponse.json(
      {
        success: true,
        data: newContact,
      },
      { status: 201 }
    )
  } catch (error) {
    return handleApiError(error, {
      path: `/api/colleges/${params.id}/contacts`,
    })
  }
}
