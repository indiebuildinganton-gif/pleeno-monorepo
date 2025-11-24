/**
 * Student Export API - CSV Export Operations
 *
 * This endpoint provides CSV export functionality for all students in an agency.
 *
 * Epic 3: Entities Domain
 * Story 3.2: Student Registry
 * Task 06: CSV Import/Export API (bulk operations with validation)
 */

import { NextRequest, NextResponse } from 'next/server'
import { ForbiddenError } from '@pleeno/utils'
import { handleApiError } from '@pleeno/utils/server'
import { createServerClient } from '@pleeno/database/server'
import { requireRole } from '@pleeno/auth/server'
import * as Papa from 'papaparse'

/**
 * GET /api/students/export
 *
 * Exports all students for the authenticated user's agency as a CSV file.
 * Returns all student fields including ID for re-import capability.
 *
 * Response (200):
 * Returns CSV file with headers:
 * - id: Student UUID
 * - full_name: Student's full name
 * - passport_number: Passport identifier
 * - email: Email address (nullable)
 * - phone: Phone number (nullable)
 * - visa_status: Current visa status (nullable)
 * - date_of_birth: Date of birth in YYYY-MM-DD format (nullable)
 * - nationality: Nationality (nullable)
 * - created_at: Timestamp of record creation
 * - updated_at: Timestamp of last update
 *
 * Security:
 * - Requires authentication
 * - RLS policies automatically filter by agency_id
 * - All queries are scoped to the user's agency
 *
 * @param request - Next.js request object
 * @returns CSV file download or error response
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

    // Fetch all students for the agency (no pagination for export)
    // RLS policies will enforce agency_id filtering
    const { data: students, error } = await supabase
      .from('students')
      .select('*')
      .eq('agency_id', userAgencyId)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Failed to fetch students for export:', error)
      throw new Error('Failed to fetch students for export')
    }

    // Map students to CSV-friendly format
    // Remove agency_id and assigned_user_id from export for clarity
    const csvData = (students || []).map((student: any) => ({
      id: student.id,
      full_name: student.full_name,
      passport_number: student.passport_number,
      email: student.email || '',
      phone: student.phone || '',
      visa_status: student.visa_status || '',
      date_of_birth: student.date_of_birth || '',
      nationality: student.nationality || '',
      created_at: student.created_at,
      updated_at: student.updated_at,
    }))

    // Convert to CSV using papaparse
    const csv = Papa.unparse(csvData, {
      header: true,
      columns: [
        'id',
        'full_name',
        'passport_number',
        'email',
        'phone',
        'visa_status',
        'date_of_birth',
        'nationality',
        'created_at',
        'updated_at',
      ],
    })

    // Generate filename with timestamp
    const timestamp = new Date().toISOString().split('T')[0] // YYYY-MM-DD
    const filename = `students-export-${timestamp}.csv`

    // Return CSV file as download
    return new NextResponse(csv, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Cache-Control': 'no-cache, no-store, must-revalidate',
      },
    })
  } catch (error) {
    return handleApiError(error, {
      path: '/api/students/export',
    })
  }
}
