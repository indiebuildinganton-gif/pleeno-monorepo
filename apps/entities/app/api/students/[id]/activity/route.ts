/**
 * Student Activity Feed API
 *
 * This endpoint provides activity feed for students from audit logs.
 * Includes student updates, notes, documents, and enrollment changes.
 *
 * Epic 3: Entities Domain
 * Story 3.2: Student Registry
 * Task 05: Activity Feed API
 */

import { NextRequest, NextResponse } from 'next/server'
import {
  handleApiError,
  createSuccessResponse,
  UnauthorizedError,
  ForbiddenError,
  ValidationError,
} from '@pleeno/utils'
import { createServerClient } from '@pleeno/database/server'

/**
 * Time period filter options
 */
const TIME_PERIODS = {
  'last-7-days': 7,
  'last-30-days': 30,
  'last-90-days': 90,
  'all-time': null,
} as const

type TimePeriod = keyof typeof TIME_PERIODS

/**
 * Activity entry type definition
 */
interface ActivityEntry {
  id: string
  event_type: 'Update' | 'Note' | 'Document' | 'Enrollment'
  description: string
  timestamp: string
  user_id: string | null
  user_name: string | null
  old_value?: any
  new_value?: any
  action: string
  entity_type: string
}

/**
 * Format field name to human-readable label
 */
function formatFieldName(field: string): string {
  const fieldMap: Record<string, string> = {
    full_name: 'Full Name',
    email: 'Email',
    phone: 'Phone',
    passport_number: 'Passport Number',
    visa_status: 'Visa Status',
    date_of_birth: 'Date of Birth',
    nationality: 'Nationality',
    program_name: 'Program Name',
    status: 'Enrollment Status',
  }
  return fieldMap[field] || field
}

/**
 * Format visa status to human-readable value
 */
function formatVisaStatus(status: string): string {
  const statusMap: Record<string, string> = {
    in_process: 'In Process',
    approved: 'Approved',
    denied: 'Denied',
    expired: 'Expired',
  }
  return statusMap[status] || status
}

/**
 * Format value for display
 */
function formatValue(field: string, value: any): string {
  if (value === null || value === undefined) {
    return '(empty)'
  }
  if (field === 'visa_status') {
    return formatVisaStatus(value)
  }
  if (typeof value === 'object') {
    return JSON.stringify(value)
  }
  return String(value)
}

/**
 * Generate description from changes
 */
function generateDescription(
  entityType: string,
  action: string,
  changesJson: any,
  oldValues?: any,
  newValues?: any
): string {
  // Handle different audit log formats
  const changes = changesJson || {}

  if (action === 'create') {
    switch (entityType) {
      case 'student':
        return 'Student record created'
      case 'student_note':
        return 'Note added'
      case 'student_document':
        return `Document uploaded${changes.document_type ? ` (${changes.document_type})` : ''}`
      case 'enrollment':
        return `Enrollment created${changes.program_name ? ` for ${changes.program_name}` : ''}`
      default:
        return `${entityType} created`
    }
  }

  if (action === 'delete') {
    switch (entityType) {
      case 'student':
        return 'Student record deleted'
      case 'student_note':
        return 'Note deleted'
      case 'student_document':
        return 'Document deleted'
      case 'enrollment':
        return 'Enrollment deleted'
      default:
        return `${entityType} deleted`
    }
  }

  if (action === 'update') {
    // Handle changes_json format (nested old/new)
    if (changes && typeof changes === 'object') {
      const changedFields = Object.keys(changes).filter(
        (key) => key !== 'old' && key !== 'new'
      )

      if (changedFields.length > 0) {
        // Format: "Field changed from old to new"
        const descriptions = changedFields.map((field) => {
          const change = changes[field]
          if (change && typeof change === 'object' && 'old' in change && 'new' in change) {
            const fieldName = formatFieldName(field)
            const oldVal = formatValue(field, change.old)
            const newVal = formatValue(field, change.new)
            return `${fieldName} changed from "${oldVal}" to "${newVal}"`
          }
          return `${formatFieldName(field)} updated`
        })
        return descriptions.join(', ')
      }
    }

    // Handle old_values/new_values format
    if (oldValues && newValues) {
      const changedFields = Object.keys(newValues).filter(
        (key) => oldValues[key] !== newValues[key]
      )
      if (changedFields.length > 0) {
        const descriptions = changedFields.map((field) => {
          const fieldName = formatFieldName(field)
          const oldVal = formatValue(field, oldValues[field])
          const newVal = formatValue(field, newValues[field])
          return `${fieldName} changed from "${oldVal}" to "${newVal}"`
        })
        return descriptions.join(', ')
      }
    }

    return `${entityType} updated`
  }

  return `${action} on ${entityType}`
}

/**
 * Determine event type from entity type and action
 */
function getEventType(entityType: string, action: string): ActivityEntry['event_type'] {
  if (entityType === 'student_note') {
    return 'Note'
  }
  if (entityType === 'student_document') {
    return 'Document'
  }
  if (entityType === 'enrollment') {
    return 'Enrollment'
  }
  return 'Update'
}

/**
 * GET /api/students/[id]/activity
 *
 * Returns activity feed for a specific student including:
 * - Student record updates
 * - Note additions/edits/deletions
 * - Document uploads/deletions
 * - Enrollment changes
 *
 * Query parameters:
 * - period: Time period filter (last-7-days, last-30-days, last-90-days, all-time)
 * - search: Search term to filter activities by description
 * - page: Page number for pagination (default: 1)
 * - per_page: Items per page (default: 20, max: 100)
 *
 * Response (200):
 * {
 *   "success": true,
 *   "data": [
 *     {
 *       "id": "activity-uuid",
 *       "event_type": "Update",
 *       "description": "Visa Status changed from \"In Process\" to \"Approved\"",
 *       "timestamp": "2024-01-01T00:00:00Z",
 *       "user_id": "user-uuid",
 *       "user_name": "John Doe",
 *       "old_value": "in_process",
 *       "new_value": "approved",
 *       "action": "update",
 *       "entity_type": "student"
 *     }
 *   ],
 *   "meta": {
 *     "total": 100,
 *     "page": 1,
 *     "per_page": 20,
 *     "total_pages": 5
 *   }
 * }
 *
 * Security:
 * - Requires authentication
 * - RLS policies ensure activities belong to user's agency
 * - Student must belong to user's agency
 *
 * @param request - Next.js request object
 * @param params - Route parameters containing student ID
 * @returns Activity feed with pagination or error response
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: studentId } = await params
  try {
    const supabase = await createServerClient()

    // SECURITY BOUNDARY: Verify user is authenticated
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()
    if (authError || !user) {
      throw new UnauthorizedError('Not authenticated')
    }

    // Get user's agency_id
    const userAgencyId = user.app_metadata?.agency_id

    if (!userAgencyId) {
      throw new ForbiddenError('User not associated with an agency')
    }

    // Verify student exists and belongs to user's agency
    const { data: student, error: studentError } = await supabase
      .from('students')
      .select('id, full_name')
      .eq('id', studentId)
      .eq('agency_id', userAgencyId)
      .single()

    if (studentError || !student) {
      throw new ValidationError('Student not found')
    }

    // Parse query parameters
    const searchParams = request.nextUrl.searchParams
    const period = (searchParams.get('period') || 'last-30-days') as TimePeriod
    const search = searchParams.get('search') || ''
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10))
    const per_page = Math.min(
      100,
      Math.max(1, parseInt(searchParams.get('per_page') || '20', 10))
    )

    // Calculate time filter
    const daysBack = TIME_PERIODS[period] || TIME_PERIODS['last-30-days']
    let fromDate: Date | null = null
    if (daysBack !== null) {
      fromDate = new Date()
      fromDate.setDate(fromDate.getDate() - daysBack)
    }

    // Query audit logs for student activities
    // We need to get:
    // 1. Direct student changes (entity_type='student', entity_id=studentId)
    // 2. Note changes (entity_type='student_note', join to find student_id)
    // 3. Document changes (entity_type='student_document', join to find student_id)
    // 4. Enrollment changes (entity_type='enrollment', join to find student_id)

    // Build base query
    let query = supabase
      .from('audit_logs')
      .select(
        `
        id,
        entity_type,
        entity_id,
        user_id,
        action,
        changes_json,
        old_values,
        new_values,
        created_at,
        user:users (
          id,
          full_name
        )
      `,
        { count: 'exact' }
      )
      .eq('agency_id', userAgencyId)

    // For student-specific activities, we need to filter differently based on entity type
    // Since we can't do complex JOINs in PostgREST easily, we'll fetch activities
    // for the student entity directly, and then fetch related entity IDs separately

    // First, get IDs of related entities
    const { data: noteIds } = await supabase
      .from('student_notes')
      .select('id')
      .eq('student_id', studentId)
      .eq('agency_id', userAgencyId)

    const { data: documentIds } = await supabase
      .from('student_documents')
      .select('id')
      .eq('student_id', studentId)
      .eq('agency_id', userAgencyId)

    const { data: enrollmentIds } = await supabase
      .from('enrollments')
      .select('id')
      .eq('student_id', studentId)
      .eq('agency_id', userAgencyId)

    // Build filter for entity types and IDs
    const filters = []

    // Direct student changes
    filters.push({ entity_type: 'student', entity_ids: [studentId] })

    // Note changes
    if (noteIds && noteIds.length > 0) {
      filters.push({
        entity_type: 'student_note',
        entity_ids: noteIds.map((n: { id: string }) => n.id),
      })
    }

    // Document changes
    if (documentIds && documentIds.length > 0) {
      filters.push({
        entity_type: 'student_document',
        entity_ids: documentIds.map((d: { id: string }) => d.id),
      })
    }

    // Enrollment changes
    if (enrollmentIds && enrollmentIds.length > 0) {
      filters.push({
        entity_type: 'enrollment',
        entity_ids: enrollmentIds.map((e: { id: string }) => e.id),
      })
    }

    // We need to fetch all activities and then filter
    // Since PostgREST doesn't support complex OR conditions well, we'll use multiple queries
    const allActivities: any[] = []

    for (const filter of filters) {
      const { data: activities } = await supabase
        .from('audit_logs')
        .select(
          `
          id,
          entity_type,
          entity_id,
          user_id,
          action,
          changes_json,
          old_values,
          new_values,
          created_at,
          user:users (
            id,
            full_name
          )
        `
        )
        .eq('agency_id', userAgencyId)
        .eq('entity_type', filter.entity_type)
        .in('entity_id', filter.entity_ids)
        .gte('created_at', fromDate ? fromDate.toISOString() : '1970-01-01')
        .order('created_at', { ascending: false })

      if (activities) {
        allActivities.push(...activities)
      }
    }

    // Sort all activities by timestamp
    allActivities.sort((a, b) => {
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    })

    // Format activities
    let formattedActivities: ActivityEntry[] = allActivities.map((log) => {
      const description = generateDescription(
        log.entity_type,
        log.action,
        log.changes_json,
        log.old_values,
        log.new_values
      )

      return {
        id: log.id,
        event_type: getEventType(log.entity_type, log.action),
        description,
        timestamp: log.created_at,
        user_id: log.user_id,
        user_name: log.user ? log.user.full_name : null,
        old_value: log.old_values,
        new_value: log.new_values,
        action: log.action,
        entity_type: log.entity_type,
      }
    })

    // Apply search filter
    if (search) {
      const searchLower = search.toLowerCase()
      formattedActivities = formattedActivities.filter((activity) =>
        activity.description.toLowerCase().includes(searchLower)
      )
    }

    // Calculate pagination
    const total = formattedActivities.length
    const total_pages = Math.ceil(total / per_page)
    const start = (page - 1) * per_page
    const end = start + per_page
    const paginatedActivities = formattedActivities.slice(start, end)

    return createSuccessResponse(paginatedActivities, {
      total,
      page,
      per_page,
      total_pages,
    })
  } catch (error) {
    return handleApiError(error, {
      path: `/api/students/${studentId}/activity`,
    })
  }
}
