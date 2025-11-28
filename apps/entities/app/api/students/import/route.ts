/**
 * Student Import API - CSV Import Operations
 *
 * This endpoint provides CSV import functionality with validation, error reporting,
 * and email notifications for incomplete student records.
 *
 * Epic 3: Entities Domain
 * Story 3.2: Student Registry
 * Task 06: CSV Import/Export API (bulk operations with validation)
 */

import { NextRequest, NextResponse } from 'next/server'
import {
  handleApiError,
  createSuccessResponse,
} from '@pleeno/utils/server'
import {
  ValidationError,
  ForbiddenError,
  sendStudentImportNotification,
} from '@pleeno/utils'
import { createServerClient } from '@pleeno/database/server'
import { requireRole } from '@pleeno/auth/server'
import { StudentCreateSchema } from '@pleeno/validations'
import * as Papa from 'papaparse'

/**
 * Interface for CSV row data
 */
interface CsvRow {
  full_name?: string
  passport_number?: string
  email?: string
  phone?: string
  visa_status?: string
  date_of_birth?: string
  nationality?: string
  [key: string]: string | undefined
}

/**
 * Interface for validation error
 */
interface ValidationErrorDetail {
  row: number
  data: CsvRow
  errors: string[]
}

/**
 * Interface for import result
 */
interface ImportResult {
  total_rows: number
  successful: number
  failed: number
  errors: ValidationErrorDetail[]
  incomplete_students: Array<{
    id: string
    full_name: string
    passport_number: string
    missing_fields: string[]
  }>
}

/**
 * POST /api/students/import
 *
 * Imports students from a CSV file with validation and error reporting.
 * Sends email notification to admin listing incomplete student records.
 *
 * Request:
 * - Content-Type: multipart/form-data
 * - Body: FormData with 'file' field containing CSV file
 *
 * CSV Format:
 * - Headers: full_name, passport_number, email, phone, visa_status, date_of_birth, nationality
 * - Required fields: full_name, passport_number
 * - Optional fields: email, phone, visa_status, date_of_birth, nationality
 *
 * Response (200):
 * {
 *   "success": true,
 *   "data": {
 *     "total_rows": 100,
 *     "successful": 95,
 *     "failed": 5,
 *     "errors": [...validation errors...],
 *     "incomplete_students": [...students missing phone/email...]
 *   }
 * }
 *
 * Features:
 * - Field mapping support (flexible column names)
 * - Data validation using StudentCreateSchema
 * - Duplicate passport number detection
 * - Partial data import (optional fields can be missing)
 * - Email notification for incomplete records with clickable edit links
 * - Audit logging for all imports
 *
 * Security:
 * - Requires authentication
 * - RLS policies automatically filter by agency_id
 * - All operations logged to audit_logs
 *
 * @param request - Next.js request object
 * @returns Import summary or error response
 */
export async function POST(request: NextRequest) {
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

    // Parse multipart form data
    const formData = await request.formData()
    const file = formData.get('file') as File | null

    if (!file) {
      throw new ValidationError('No file provided. Please upload a CSV file.')
    }

    // Validate file type
    if (!file.name.endsWith('.csv')) {
      throw new ValidationError('Invalid file type. Please upload a CSV file.')
    }

    // Read file content
    const fileContent = await file.text()

    // Parse CSV with papaparse
    const parseResult = Papa.parse<CsvRow>(fileContent, {
      header: true,
      skipEmptyLines: true,
      transformHeader: (header) => {
        // Normalize header names (lowercase, trim spaces)
        return header.toLowerCase().trim().replace(/\s+/g, '_')
      },
    })

    if (parseResult.errors.length > 0) {
      throw new ValidationError('Failed to parse CSV file', {
        errors: parseResult.errors,
      })
    }

    const rows = parseResult.data
    const totalRows = rows.length

    if (totalRows === 0) {
      throw new ValidationError('CSV file is empty. Please provide data to import.')
    }

    // Create Supabase client
    const supabase = await createServerClient()

    // Get agency name for email notification
    const { data: agency } = await supabase
      .from('agencies')
      .select('name')
      .eq('id', userAgencyId)
      .single()

    const agencyName = agency?.name || 'Your Agency'

    // Prepare result tracking
    const errors: ValidationErrorDetail[] = []
    const importedStudents: Array<{
      id: string
      full_name: string
      passport_number: string
      phone: string | null
      email: string | null
    }> = []

    // Process each row
    for (let i = 0; i < rows.length; i++) {
      const row = rows[i]
      const rowNumber = i + 1

      try {
        // Prepare student data with field mapping
        const studentData = {
          full_name: row.full_name?.trim(),
          passport_number: row.passport_number?.trim(),
          email: row.email?.trim() || null,
          phone: row.phone?.trim() || null,
          visa_status: row.visa_status?.trim() || null,
          date_of_birth: row.date_of_birth?.trim() || null,
          nationality: row.nationality?.trim() || null,
        }

        // Validate using StudentCreateSchema
        const validationResult = StudentCreateSchema.safeParse(studentData)

        if (!validationResult.success) {
          const fieldErrors = validationResult.error.flatten().fieldErrors
          const errorMessages = Object.entries(fieldErrors).map(
            ([field, messages]: [string, string[] | undefined]) =>
              `${field}: ${messages?.join(', ') || 'Invalid value'}`
          )

          errors.push({
            row: rowNumber,
            data: row,
            errors: errorMessages,
          })
          continue
        }

        const validatedData = validationResult.data

        // Insert student record
        const { data: student, error: insertError } = await supabase
          .from('students')
          .insert({
            agency_id: userAgencyId,
            full_name: validatedData.full_name,
            passport_number: validatedData.passport_number,
            email: validatedData.email,
            phone: validatedData.phone,
            visa_status: validatedData.visa_status,
            date_of_birth: validatedData.date_of_birth,
            nationality: validatedData.nationality,
          })
          .select()
          .single()

        if (insertError) {
          console.error(`Failed to insert student at row ${rowNumber}:`, insertError)

          // Handle duplicate passport number
          if (insertError.code === '23505') {
            errors.push({
              row: rowNumber,
              data: row,
              errors: [
                `Duplicate passport number: ${validatedData.passport_number} already exists`,
              ],
            })
          } else {
            errors.push({
              row: rowNumber,
              data: row,
              errors: [insertError.message],
            })
          }
          continue
        }

        if (!student) {
          errors.push({
            row: rowNumber,
            data: row,
            errors: ['Student not found after creation'],
          })
          continue
        }

        // Track successfully imported student
        importedStudents.push({
          id: student.id,
          full_name: student.full_name,
          passport_number: student.passport_number,
          phone: student.phone,
          email: student.email,
        })

        // Log to audit trail
        await supabase.from('audit_logs').insert({
          entity_type: 'student',
          entity_id: student.id,
          user_id: user.id,
          action: 'import',
          changes_json: {
            source: 'csv_import',
            full_name: student.full_name,
            passport_number: student.passport_number,
            email: student.email,
            phone: student.phone,
            visa_status: student.visa_status,
          },
        })
      } catch (error) {
        console.error(`Unexpected error processing row ${rowNumber}:`, error)
        errors.push({
          row: rowNumber,
          data: row,
          errors: [error instanceof Error ? error.message : 'Unexpected error during import'],
        })
      }
    }

    // Identify incomplete students (missing phone - critical field)
    const incompleteStudents = importedStudents
      .filter((student) => {
        const missingFields = []
        if (!student.phone) missingFields.push('phone')
        if (!student.email) missingFields.push('email')
        return missingFields.length > 0
      })
      .map((student) => {
        const missingFields = []
        if (!student.phone) missingFields.push('phone')
        if (!student.email) missingFields.push('email')
        return {
          id: student.id,
          full_name: student.full_name,
          passport_number: student.passport_number,
          missing_fields: missingFields,
        }
      })

    // Send email notification to admin if there are incomplete students or import completed
    // Get admin email from user profile
    const { data: userProfile } = await supabase
      .from('users')
      .select('email')
      .eq('id', user.id)
      .single()

    const adminEmail = userProfile?.email || user.email

    if (adminEmail) {
      try {
        await sendStudentImportNotification({
          to: adminEmail,
          agencyName,
          totalImported: importedStudents.length,
          incompleteStudents,
        })
      } catch (emailError) {
        console.error('Failed to send import notification email:', emailError)
        // Don't fail the import if email fails, just log it
      }
    }

    // Prepare response
    const result: ImportResult = {
      total_rows: totalRows,
      successful: importedStudents.length,
      failed: errors.length,
      errors,
      incomplete_students: incompleteStudents,
    }

    return createSuccessResponse(result)
  } catch (error) {
    return handleApiError(error, {
      path: '/api/students/import',
    })
  }
}
