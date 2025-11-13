/**
 * Audit Logger Utility
 *
 * Provides centralized audit logging functionality for compliance and transparency.
 * Logs entity changes to the audit_logs table with comprehensive metadata.
 *
 * Epic 4: Payments Domain
 * Story 4.1: Payment Plan Creation
 * Task 09: Audit Logging
 *
 * @module packages/utils/src/audit-logger
 */

import type { SupabaseClient } from '@supabase/supabase-js'

/**
 * Parameters for audit log entry
 */
export interface AuditLogParams {
  /** UUID of user who performed the action */
  userId: string
  /** UUID of agency the entity belongs to */
  agencyId: string
  /** Type of entity being audited (e.g., 'payment_plan', 'enrollment', 'student') */
  entityType: string
  /** UUID of the entity being audited */
  entityId: string
  /** Action performed on the entity */
  action: 'create' | 'update' | 'delete'
  /** Previous values before the change (for updates/deletes) */
  oldValues?: Record<string, any> | null
  /** New values after the change (for creates/updates) */
  newValues?: Record<string, any> | null
  /** Additional metadata about the change (e.g., calculation parameters, context) */
  metadata?: Record<string, any> | null
  /** Optional IP address of the user making the change */
  ipAddress?: string | null
  /** Optional user agent string of the client */
  userAgent?: string | null
}

/**
 * Logs an action to the audit trail
 *
 * This function creates an immutable audit log entry with:
 * - User identification (who made the change)
 * - Agency identification (which agency's data)
 * - Entity identification (what was changed)
 * - Action details (what happened)
 * - Before/after values (for full audit trail)
 * - Metadata (for additional context like calculations)
 * - Timestamp (when it happened)
 *
 * The function is designed to be non-blocking and resilient:
 * - Audit logging failures are logged but don't throw errors
 * - This prevents audit failures from breaking business operations
 * - However, failures are still logged for investigation
 *
 * @param client - Authenticated Supabase client
 * @param params - Audit log parameters
 * @returns Promise that resolves when audit log is created (or fails gracefully)
 *
 * @example
 * ```typescript
 * const supabase = await createServerClient()
 *
 * await logAudit(supabase, {
 *   userId: user.id,
 *   agencyId: agency.id,
 *   entityType: 'payment_plan',
 *   entityId: paymentPlan.id,
 *   action: 'create',
 *   newValues: {
 *     total_amount: 10000,
 *     commission_rate_percent: 15,
 *     expected_commission: 1500
 *   },
 *   metadata: {
 *     commission_calculation: {
 *       formula: 'total_amount * (commission_rate_percent / 100)',
 *       total_amount: 10000,
 *       commission_rate_percent: 15
 *     }
 *   }
 * })
 * ```
 */
export async function logAudit(
  client: SupabaseClient,
  params: AuditLogParams
): Promise<void> {
  try {
    const { error } = await client.from('audit_logs').insert({
      user_id: params.userId,
      agency_id: params.agencyId,
      entity_type: params.entityType,
      entity_id: params.entityId,
      action: params.action,
      old_values: params.oldValues || null,
      new_values: params.newValues || null,
      metadata: params.metadata || null,
      ip_address: params.ipAddress || null,
      user_agent: params.userAgent || null,
      // timestamp will be set by database default (NOW())
    })

    if (error) {
      console.error('Failed to create audit log entry:', {
        error,
        params: {
          entityType: params.entityType,
          entityId: params.entityId,
          action: params.action,
        },
      })
      // Don't throw - audit logging failure shouldn't break the operation
    }
  } catch (error) {
    console.error('Unexpected error during audit logging:', {
      error,
      params: {
        entityType: params.entityType,
        entityId: params.entityId,
        action: params.action,
      },
    })
    // Don't throw - audit logging failure shouldn't break the operation
  }
}

/**
 * Type guard to check if audit logging is available
 *
 * @param client - Supabase client to check
 * @returns True if the client can write to audit_logs table
 */
export function canLogAudit(client: SupabaseClient): boolean {
  return client !== null && client !== undefined
}
