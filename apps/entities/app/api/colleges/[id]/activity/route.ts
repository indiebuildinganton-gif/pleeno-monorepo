/**
 * College Activity Feed API
 *
 * This endpoint provides activity feed for colleges from audit logs.
 * Includes college updates, branch changes, contact changes, and notes.
 *
 * Epic 3: Entities Domain
 * Story 3.1: College Registry
 * Task 11: Activity Feed API
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
  '7': 7,
  '30': 30,
  '60': 60,
  '90': 90,
  'all': null,
} as const

type TimePeriod = keyof typeof TIME_PERIODS

/**
 * Activity entry type definition
 */
interface ActivityEntry {
  id: string
  event_type: 'Update' | 'Branch' | 'Contact' | 'Note'
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
    name: 'Name',
    website: 'Website',
    address: 'Address',
    city: 'City',
    state: 'State',
    country: 'Country',
    postal_code: 'Postal Code',
    gst_number: 'GST Number',
    first_name: 'First Name',
    last_name: 'Last Name',
    email: 'Email',
    phone: 'Phone',
    position: 'Position',
    is_primary: 'Primary Contact',
    branch_name: 'Branch Name',
    location: 'Location',
  }
  return fieldMap[field] || field
}

/**
 * Format value for display
 */
function formatValue(field: string, value: any): string {
  if (value === null || value === undefined) {
    return '(empty)'
  }
  if (field === 'is_primary') {
    return value ? 'Yes' : 'No'
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

  if (action === 'create' || action === 'contact_created' || action === 'branch_created') {
    switch (entityType) {
      case 'college':
        return 'College record created'
      case 'college_note':
        return 'Note added'
      case 'college_contact':
        return `Contact added${changes.first_name && changes.last_name ? ` (${changes.first_name} ${changes.last_name})` : ''}`
      case 'branch':
        return `Branch created${changes.branch_name ? ` (${changes.branch_name})` : ''}`
      default:
        return `${entityType} created`
    }
  }

  if (action === 'delete' || action === 'contact_deleted' || action === 'branch_deleted') {
    switch (entityType) {
      case 'college':
        return 'College record deleted'
      case 'college_note':
        return 'Note deleted'
      case 'college_contact':
        return 'Contact deleted'
      case 'branch':
        return 'Branch deleted'
      default:
        return `${entityType} deleted`
    }
  }

  if (action === 'update' || action === 'contact_updated' || action === 'branch_updated') {
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
  if (entityType === 'college_note') {
    return 'Note'
  }
  if (entityType === 'college_contact') {
    return 'Contact'
  }
  if (entityType === 'branch') {
    return 'Branch'
  }
  return 'Update'
}

/**
 * GET /api/colleges/[id]/activity
 *
 * Returns activity feed for a specific college including:
 * - College record updates
 * - Branch additions/edits/deletions
 * - Contact additions/edits/deletions
 * - Note additions/edits/deletions
 *
 * Query parameters:
 * - period: Time period filter (7, 30, 60, 90, all) - defaults to 30
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
 *       "description": "GST Number changed from \"old\" to \"new\"",
 *       "timestamp": "2024-01-01T00:00:00Z",
 *       "user_id": "user-uuid",
 *       "user_name": "John Doe",
 *       "old_value": {...},
 *       "new_value": {...},
 *       "action": "update",
 *       "entity_type": "college"
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
 * - College must belong to user's agency
 *
 * @param request - Next.js request object
 * @param params - Route parameters containing college ID
 * @returns Activity feed with pagination or error response
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: collegeId } = await params
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

    // Verify college exists and belongs to user's agency
    const { data: college, error: collegeError } = await supabase
      .from('colleges')
      .select('id, name')
      .eq('id', collegeId)
      .eq('agency_id', userAgencyId)
      .single()

    if (collegeError || !college) {
      throw new ValidationError('College not found')
    }

    // Parse query parameters
    const searchParams = request.nextUrl.searchParams
    const period = (searchParams.get('period') || '30') as TimePeriod
    const search = searchParams.get('search') || ''
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10))
    const per_page = Math.min(
      100,
      Math.max(1, parseInt(searchParams.get('per_page') || '20', 10))
    )

    // Calculate time filter
    const daysBack = TIME_PERIODS[period] !== undefined ? TIME_PERIODS[period] : TIME_PERIODS['30']
    let fromDate: Date | null = null
    if (daysBack !== null) {
      fromDate = new Date()
      fromDate.setDate(fromDate.getDate() - daysBack)
    }

    // Query audit logs for college activities
    // We need to get:
    // 1. Direct college changes (entity_type='college', entity_id=collegeId)
    // 2. Branch changes (entity_type='branch', join to find college_id)
    // 3. Contact changes (entity_type='college_contact', join to find college_id)
    // 4. Note changes (entity_type='college_note', join to find college_id)

    // First, get IDs of related entities
    const { data: branchIds } = await supabase
      .from('branches')
      .select('id')
      .eq('college_id', collegeId)
      .eq('agency_id', userAgencyId)

    const { data: contactIds } = await supabase
      .from('college_contacts')
      .select('id')
      .eq('college_id', collegeId)
      .eq('agency_id', userAgencyId)

    const { data: noteIds } = await supabase
      .from('college_notes')
      .select('id')
      .eq('college_id', collegeId)
      .eq('agency_id', userAgencyId)

    // Build filter for entity types and IDs
    const filters = []

    // Direct college changes
    filters.push({ entity_type: 'college', entity_ids: [collegeId] })

    // Branch changes
    if (branchIds && branchIds.length > 0) {
      filters.push({
        entity_type: 'branch',
        entity_ids: branchIds.map((b: { id: string }) => b.id),
      })
    }

    // Contact changes
    if (contactIds && contactIds.length > 0) {
      filters.push({
        entity_type: 'college_contact',
        entity_ids: contactIds.map((c: { id: string }) => c.id),
      })
    }

    // Note changes
    if (noteIds && noteIds.length > 0) {
      filters.push({
        entity_type: 'college_note',
        entity_ids: noteIds.map((n: { id: string }) => n.id),
      })
    }

    // Fetch all activities for each entity type
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

    return NextResponse.json(
      {
        success: true,
        data: paginatedActivities,
        meta: {
          total,
          page,
          per_page,
          total_pages,
        },
      },
      { status: 200 }
    )
  } catch (error) {
    return handleApiError(error, {
      path: `/api/colleges/${collegeId}/activity`,
    })
  }
}
