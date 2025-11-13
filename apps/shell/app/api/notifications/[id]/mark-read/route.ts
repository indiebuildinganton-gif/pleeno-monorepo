/**
 * Notification Mark Read API - Mark a notification as read
 *
 * This endpoint marks a specific notification as read for the authenticated user.
 * Sets is_read = true and read_at = now() via database trigger.
 * Supports optimistic UI updates via TanStack Query.
 *
 * Epic 5: Intelligent Status Automation & Notifications
 * Story 5.3: Overdue Payment Alerts - Task 1
 */

import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@pleeno/database/server'
import type { NotificationUpdateResponse, NotificationErrorResponse } from '@/types/notifications'

/**
 * PATCH /api/notifications/[id]/mark-read
 *
 * Mark a notification as read.
 *
 * Path Parameters:
 * - id: Notification UUID
 *
 * Request Body: None (empty or any valid JSON)
 *
 * Security:
 * - Requires authentication (checked via auth.getUser())
 * - RLS policies ensure users can only update their own notifications
 * - RLS verifies: agency_id matches AND (user_id IS NULL OR user_id = auth.uid())
 *
 * Database Behavior:
 * - Trigger automatically sets read_at timestamp when is_read changes to true
 * - Updates updated_at timestamp automatically
 *
 * @returns JSON with success flag and updated notification
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse<NotificationUpdateResponse | NotificationErrorResponse>> {
  const supabase = await createServerClient()

  // Check authentication
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Get notification ID from params
  const { id } = await params

  // Validate UUID format
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
  if (!uuidRegex.test(id)) {
    return NextResponse.json({ error: 'Invalid notification ID format' }, { status: 400 })
  }

  // Update notification
  // RLS policies enforce:
  // 1. Notification belongs to user's agency
  // 2. Notification is either agency-wide (user_id IS NULL) or belongs to user (user_id = auth.uid())
  const { data: notification, error } = await supabase
    .from('notifications')
    .update({ is_read: true })
    .eq('id', id)
    .select()
    .single()

  if (error) {
    // Check if error is due to no rows found (RLS blocked or doesn't exist)
    if (error.code === 'PGRST116') {
      return NextResponse.json(
        { error: 'Notification not found or access denied' },
        { status: 404 }
      )
    }

    console.error('Failed to update notification:', error)
    return NextResponse.json(
      {
        error: 'Failed to update notification',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined,
      },
      { status: 500 }
    )
  }

  return NextResponse.json({
    success: true,
    notification,
  })
}
