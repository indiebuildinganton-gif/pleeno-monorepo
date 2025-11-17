/**
 * Activity Feed API - Recent activity log with user information
 *
 * This endpoint provides a chronological feed of recent activities across the system,
 * including user actions and system-generated events.
 *
 * Epic 6: Dashboard & Reporting Zone
 * Story 6.4: Recent Activity Feed
 * Task 3: Create Activity Feed API Route
 */

import { NextRequest, NextResponse } from 'next/server'
import {
  handleApiError,
  createSuccessResponse,
  ForbiddenError,
} from '@pleeno/utils/server'
import { createServerClient } from '@pleeno/database/server'
import { requireRole } from '@pleeno/auth/server'

// Cache configuration: 1 minute (frequent dashboard access)
export const revalidate = 60

/**
 * Activity response interface
 */
interface Activity {
  id: string
  timestamp: string // ISO 8601 format
  action: string
  description: string
  user: { id: string; name: string; email: string } | null
  entity_type: string
  entity_id: string
  metadata: Record<string, any>
}

/**
 * GET /api/activity-log
 *
 * Returns recent activities with user information in chronological order.
 *
 * Query Parameters:
 * - limit (optional): Number of activities to return (default: 20, max: 100)
 *
 * Response (200):
 * {
 *   "success": true,
 *   "data": [
 *     {
 *       "id": "uuid",
 *       "timestamp": "2025-11-13T10:30:00Z",
 *       "action": "created",
 *       "description": "John Doe created new student Alice Smith",
 *       "user": {
 *         "id": "user-uuid",
 *         "name": "John Doe",
 *         "email": "john@example.com"
 *       },
 *       "entity_type": "student",
 *       "entity_id": "entity-uuid",
 *       "metadata": {
 *         "student_name": "Alice Smith"
 *       }
 *     },
 *     {
 *       "id": "uuid",
 *       "timestamp": "2025-11-13T09:15:00Z",
 *       "action": "marked_overdue",
 *       "description": "System marked installment as overdue for Bob Johnson",
 *       "user": null,
 *       "entity_type": "installment",
 *       "entity_id": "entity-uuid",
 *       "metadata": {
 *         "student_name": "Bob Johnson",
 *         "amount": 250.00
 *       }
 *     }
 *   ]
 * }
 *
 * Security:
 * - Requires authentication (agency_admin or agency_user)
 * - RLS policies automatically filter by agency_id
 * - All queries are scoped to the user's agency
 *
 * Performance:
 * - 1-minute cache via Next.js revalidate
 * - LEFT JOIN to users table (avoids N+1 queries)
 * - Uses idx_activity_log_agency_created index
 * - Response cached at CDN edge with stale-while-revalidate
 *
 * @param request - Next.js request object
 * @returns Activity feed with user information or error response
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

    // Parse query parameters
    const searchParams = request.nextUrl.searchParams
    const limitParam = searchParams.get('limit')
    const limit = Math.min(
      parseInt(limitParam || '20', 10),
      100 // Max 100 activities
    )

    // Create Supabase client
    const supabase = await createServerClient()

    // Query activity_log with LEFT JOIN to users table
    // RLS automatically filters by agency_id
    const { data: activities, error } = await supabase
      .from('activity_log')
      .select(`
        id,
        entity_type,
        entity_id,
        action,
        description,
        metadata,
        created_at,
        users:user_id (
          id,
          email,
          first_name,
          last_name
        )
      `)
      .order('created_at', { ascending: false })
      .limit(limit)

    if (error) {
      console.error('Activity log query error:', error)
      throw new Error('Failed to fetch activities')
    }

    // Transform response to match expected format
    const transformedActivities: Activity[] = (activities || []).map((activity) => {
      // Handle user data (null for system actions)
      let user = null
      if (activity.users) {
        // Supabase returns nested user as an object (single relation)
        const userData = activity.users as any
        user = {
          id: userData.id,
          name: `${userData.first_name || ''} ${userData.last_name || ''}`.trim(),
          email: userData.email,
        }
      }

      return {
        id: activity.id,
        timestamp: activity.created_at,
        action: activity.action,
        description: activity.description,
        user,
        entity_type: activity.entity_type,
        entity_id: activity.entity_id,
        metadata: activity.metadata || {},
      }
    })

    // Return standardized success response with cache headers
    return new NextResponse(
      JSON.stringify(createSuccessResponse(transformedActivities)),
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=30',
        },
      }
    )
  } catch (error) {
    return handleApiError(error, {
      path: '/api/activity-log',
    })
  }
}
