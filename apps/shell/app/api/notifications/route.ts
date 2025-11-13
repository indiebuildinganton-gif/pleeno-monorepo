/**
 * Notifications API - List notifications for the authenticated user
 *
 * This endpoint returns paginated notifications for the current user's agency.
 * Includes both agency-wide (user_id IS NULL) and user-specific notifications.
 * Supports filtering by read status and pagination.
 *
 * Epic 5: Intelligent Status Automation & Notifications
 * Story 5.3: Overdue Payment Alerts - Task 1
 */

import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@pleeno/database/server'
import type { NotificationListResponse, NotificationErrorResponse } from '@/types/notifications'

/**
 * GET /api/notifications
 *
 * List notifications for the authenticated user's agency.
 * Returns both agency-wide and user-specific notifications.
 *
 * Query Parameters:
 * - page: Page number (default: 1)
 * - limit: Items per page (default: 20, max: 100)
 * - is_read: Filter by read status ('true' or 'false')
 *
 * Security:
 * - Requires authentication (checked via auth.getUser())
 * - RLS policies ensure users only see notifications for their agency
 * - RLS filters: agency-wide (user_id IS NULL) OR user-specific (user_id = auth.uid())
 *
 * @returns JSON with paginated notifications and metadata
 */
export async function GET(
  request: NextRequest
): Promise<NextResponse<NotificationListResponse | NotificationErrorResponse>> {
  const supabase = await createServerClient()

  // Check authentication
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Parse query parameters
  const searchParams = request.nextUrl.searchParams
  const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10))
  const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '20', 10)))
  const isReadParam = searchParams.get('is_read')

  // Calculate pagination offset
  const offset = (page - 1) * limit

  // Build query
  let query = supabase
    .from('notifications')
    .select('*', { count: 'exact' })
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1)

  // Apply is_read filter if provided
  if (isReadParam === 'true') {
    query = query.eq('is_read', true)
  } else if (isReadParam === 'false') {
    query = query.eq('is_read', false)
  }

  // Execute query
  // RLS policies automatically filter by:
  // - agency_id = user's agency
  // - (user_id IS NULL OR user_id = auth.uid())
  const { data: notifications, error, count } = await query

  if (error) {
    console.error('Failed to fetch notifications:', error)
    return NextResponse.json(
      {
        error: 'Failed to fetch notifications',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined,
      },
      { status: 500 }
    )
  }

  // Calculate total pages
  const total = count || 0
  const totalPages = Math.ceil(total / limit)

  return NextResponse.json({
    data: notifications || [],
    pagination: {
      page,
      limit,
      total,
      totalPages,
    },
  })
}
