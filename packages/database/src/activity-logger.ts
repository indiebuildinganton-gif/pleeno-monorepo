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

/**
 * Valid actions for activity logging
 */
export type ActivityAction =
  | 'created'
  | 'recorded'
  | 'updated'
  | 'marked_overdue'
  | 'deleted'

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
  /** UUID of the entity being logged */
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
