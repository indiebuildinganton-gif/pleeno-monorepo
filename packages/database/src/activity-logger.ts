/**
 * Activity Logger Utility
 *
 * Provides centralized activity logging functionality for the Recent Activity Feed.
 * Logs user and system actions to the activity_log table with human-readable descriptions.
 *
 * Epic 6: Business Intelligence Dashboard
 * Story 6.4: Recent Activity Feed
 * Task 2: Implement Activity Logging in Existing API Routes
 *
 * @module packages/database/src/activity-logger
 */

import type { SupabaseClient } from '@supabase/supabase-js'

/**
 * Valid entity types for activity logging
 */
export type ActivityEntityType =
  | 'payment'
  | 'payment_plan'
  | 'student'
  | 'enrollment'
  | 'installment'
  | 'report'

/**
 * Valid actions for activity logging
 */
export type ActivityAction =
  | 'created'
  | 'recorded'
  | 'updated'
  | 'marked_overdue'
  | 'deleted'
  | 'exported'

/**
 * Activity log entry interface
 */
export interface ActivityLog {
  id: string
  agency_id: string
  user_id: string | null
  entity_type: ActivityEntityType
  entity_id: string
  action: ActivityAction
  description: string
  metadata: Record<string, any> | null
  created_at: string
}

/**
 * Parameters for activity log entry
 */
export interface ActivityLogParams {
  /** UUID of agency the entity belongs to */
  agencyId: string
  /** UUID of user who performed the action (null for system actions) */
  userId: string | null
  /** Type of entity being logged */
  entityType: ActivityEntityType
  /** UUID of the entity being logged (empty string for reports) */
  entityId: string
  /** Action performed on the entity */
  action: ActivityAction
  /** Human-readable description for display in activity feed */
  description: string
  /** Additional metadata for context (student_name, amount, etc.) */
  metadata?: Record<string, any>
}

/**
 * Logs an activity to the activity feed
 *
 * This function creates an activity log entry with:
 * - Agency identification (which agency's data)
 * - User identification (who made the change, or null for system actions)
 * - Entity identification (what was affected)
 * - Action details (what happened)
 * - Human-readable description (for display in the feed)
 * - Metadata (for additional context like names, amounts)
 * - Timestamp (when it happened)
 *
 * The function is designed to be non-blocking and resilient:
 * - Activity logging failures are logged but don't throw errors
 * - This prevents logging failures from breaking business operations
 * - However, failures are still logged for investigation
 *
 * Security:
 * - Uses server-side Supabase client with JWT authentication
 * - RLS policies enforce agency isolation
 * - Supports null user_id for system-generated activities
 *
 * @param client - Authenticated Supabase client
 * @param params - Activity log parameters
 * @returns Promise that resolves when activity log is created (or fails gracefully)
 *
 * @example User action
 * ```typescript
 * const supabase = await createServerClient()
 *
 * await logActivity(supabase, {
 *   agencyId: agency.id,
 *   userId: user.id,
 *   entityType: 'payment',
 *   entityId: payment.id,
 *   action: 'recorded',
 *   description: `${userName} recorded payment of $500.00 for John Doe`,
 *   metadata: {
 *     student_name: 'John Doe',
 *     amount: 500.00,
 *     payment_plan_id: 'uuid'
 *   }
 * })
 * ```
 *
 * @example System action
 * ```typescript
 * await logActivity(supabase, {
 *   agencyId: agency.id,
 *   userId: null, // System action
 *   entityType: 'installment',
 *   entityId: installment.id,
 *   action: 'marked_overdue',
 *   description: `System marked installment $250.00 as overdue for Jane Smith`,
 *   metadata: {
 *     student_name: 'Jane Smith',
 *     amount: 250.00,
 *     installment_id: 'uuid'
 *   }
 * })
 * ```
 */
export async function logActivity(
  client: SupabaseClient,
  params: ActivityLogParams
): Promise<void> {
  try {
    const { error } = await client.from('activity_log').insert({
      agency_id: params.agencyId,
      user_id: params.userId,
      entity_type: params.entityType,
      entity_id: params.entityId,
      action: params.action,
      description: params.description,
      metadata: params.metadata || null,
      // created_at will be set by database default (now())
    })

    if (error) {
      console.error('Failed to create activity log entry:', {
        error,
        params: {
          agencyId: params.agencyId,
          entityType: params.entityType,
          entityId: params.entityId,
          action: params.action,
        },
      })
      // Don't throw - activity logging failure shouldn't break the operation
    }
  } catch (error) {
    console.error('Unexpected error during activity logging:', {
      error,
      params: {
        agencyId: params.agencyId,
        entityType: params.entityType,
        entityId: params.entityId,
        action: params.action,
      },
    })
    // Don't throw - activity logging failure shouldn't break the operation
  }
}

/**
 * Type guard to check if activity logging is available
 *
 * @param client - Supabase client to check
 * @returns True if the client can write to activity_log table
 */
export function canLogActivity(client: SupabaseClient): boolean {
  return client !== null && client !== undefined
}

/**
 * Parameters for logging report export events
 */
export interface ReportExportParams {
  /** Supabase client instance */
  client: SupabaseClient
  /** UUID of agency the user belongs to */
  agencyId: string
  /** UUID of user who performed the export */
  userId: string
  /** Type of report being exported (e.g., 'payment_plans') */
  reportType: string
  /** Export format ('csv' or 'pdf') */
  format: 'csv' | 'pdf'
  /** Number of rows exported */
  rowCount: number
  /** Filters applied to the export */
  filters: Record<string, any>
  /** Columns included in the export */
  columns: string[]
}

/**
 * Log a report export event to the activity feed
 *
 * This specialized function logs CSV/PDF export events with:
 * - User identification (who exported)
 * - Report type and format
 * - Row count for visibility
 * - Applied filters for audit trail
 * - Selected columns
 *
 * The function automatically fetches the user's name to generate a
 * human-readable description like:
 * "John Doe exported payment plans report to CSV (150 rows)"
 *
 * Metadata includes:
 * - report_type: Type of report (e.g., 'payment_plans')
 * - format: Export format ('csv' or 'pdf')
 * - row_count: Number of rows exported
 * - filters: Applied filters (dates, colleges, status, etc.)
 * - columns: Selected columns for export
 * - exported_at: ISO timestamp of export
 *
 * Security:
 * - Requires authenticated user (userId cannot be null)
 * - RLS policies enforce agency isolation via agency_id
 * - No sensitive data logged in metadata (only filter params, not results)
 *
 * Performance:
 * - Non-blocking: Failures don't interrupt export
 * - Async logging runs in background
 * - Graceful error handling
 *
 * @param params - Report export parameters
 * @returns Promise that resolves when activity log is created (or fails gracefully)
 *
 * @example CSV export
 * ```typescript
 * const supabase = await createServerClient()
 *
 * await logReportExport({
 *   client: supabase,
 *   agencyId: 'agency-uuid',
 *   userId: 'user-uuid',
 *   reportType: 'payment_plans',
 *   format: 'csv',
 *   rowCount: 150,
 *   filters: {
 *     date_from: '2025-01-01',
 *     date_to: '2025-12-31',
 *     status: ['active', 'completed']
 *   },
 *   columns: ['student_name', 'total_amount', 'status']
 * })
 * ```
 *
 * @example PDF export with filters
 * ```typescript
 * await logReportExport({
 *   client: supabase,
 *   agencyId: 'agency-uuid',
 *   userId: 'user-uuid',
 *   reportType: 'payment_plans',
 *   format: 'pdf',
 *   rowCount: 75,
 *   filters: {
 *     college_id: 'college-1',
 *     date_from: '2025-01-01'
 *   },
 *   columns: ['student_name', 'college_name', 'total_amount']
 * })
 * ```
 */
export async function logReportExport(params: ReportExportParams): Promise<void> {
  const { client, agencyId, userId, reportType, format, rowCount, filters, columns } = params

  try {
    // Get user name for description
    const { data: user, error: userError } = await client
      .from('users')
      .select('first_name, last_name')
      .eq('id', userId)
      .single()

    if (userError) {
      console.error('Failed to fetch user for activity log:', userError)
      // Continue with generic description if user fetch fails
    }

    const userName = user ? `${user.first_name} ${user.last_name}` : 'User'

    // Generate human-readable description
    const description = `${userName} exported ${reportType.replace(/_/g, ' ')} report to ${format.toUpperCase()} (${rowCount} rows)`

    // Log the export activity
    await logActivity(client, {
      agencyId,
      userId,
      entityType: 'report',
      entityId: '', // Reports don't have a specific entity_id
      action: 'exported',
      description,
      metadata: {
        report_type: reportType,
        format,
        row_count: rowCount,
        filters,
        columns,
        exported_at: new Date().toISOString(),
      },
    })
  } catch (error) {
    console.error('Failed to log report export:', error)
    // Don't throw - logging failures shouldn't break export
  }
}
