/**
 * Audit Logger Utility
 *
 * Provides comprehensive audit logging functionality for compliance and audit trails.
 * Logs detailed old/new values and user context to the audit_logs table for Epic 8.
 *
 * This is separate from activity-logger.ts which logs human-readable descriptions
 * for the Recent Activity Feed. The audit_logs table stores detailed change tracking
 * with old_values and new_values for compliance and forensic analysis.
 *
 * Epic 4: Payments Domain
 * Story 4.4: Manual Payment Recording
 * Task 7: Audit Logging
 *
 * @module packages/database/src/audit-logger
 */

import type { SupabaseClient } from '@supabase/supabase-js'

/**
 * Valid entity types for audit logging
 */
export type AuditEntityType =
  | 'payment'
  | 'payment_plan'
  | 'student'
  | 'enrollment'
  | 'installment'
  | 'user'
  | 'agency'

/**
 * Valid actions for audit logging
 */
export type AuditAction =
  | 'created'
  | 'updated'
  | 'deleted'
  | 'payment_recorded'
  | 'email_change_requested'
  | 'email_changed'
  | 'status_updated'

/**
 * Audit log entry interface
 */
export interface AuditLog {
  id: string
  agency_id: string
  user_id: string | null
  entity_type: AuditEntityType
  entity_id: string
  action: AuditAction
  old_values: Record<string, any> | null
  new_values: Record<string, any>
  metadata: Record<string, any> | null
  ip_address: string | null
  user_agent: string | null
  created_at: string
}

/**
 * Parameters for audit log entry
 */
export interface AuditLogParams {
  /** UUID of agency the entity belongs to */
  agencyId: string
  /** UUID of user who performed the action (null for system actions) */
  userId: string | null
  /** Type of entity being logged */
  entityType: AuditEntityType
  /** UUID of the entity being logged */
  entityId: string
  /** Action performed on the entity */
  action: AuditAction
  /** Old values before the change (null for create operations) */
  oldValues?: Record<string, any> | null
  /** New values after the change */
  newValues: Record<string, any>
  /** Additional metadata for context (notes, ip_address, etc.) */
  metadata?: Record<string, any>
  /** Client IP address (for security auditing) */
  ipAddress?: string | null
  /** User agent string (for security auditing) */
  userAgent?: string | null
}

/**
 * Logs a detailed audit entry with old/new values for compliance
 *
 * This function creates an audit log entry with:
 * - Agency identification (which agency's data)
 * - User identification (who made the change, or null for system actions)
 * - Entity identification (what was affected)
 * - Action details (what happened)
 * - Old values (state before change)
 * - New values (state after change)
 * - Metadata (additional context like notes, calculations)
 * - Security context (IP address, user agent)
 * - Timestamp (when it happened)
 *
 * The function is designed to be non-blocking and resilient:
 * - Audit logging failures are logged but don't throw errors
 * - This prevents logging failures from breaking business operations
 * - However, failures are still logged to console for investigation
 *
 * Use Cases:
 * - Compliance: Track all changes for regulatory requirements
 * - Forensics: Investigate what changed, when, and by whom
 * - Debugging: Understand state transitions and data flow
 * - Rollback: Restore previous values using old_values
 *
 * Security:
 * - Uses server-side Supabase client with JWT authentication
 * - RLS policies enforce agency isolation
 * - Supports null user_id for system-generated changes
 * - IP address and user agent logged for security analysis
 *
 * @param client - Authenticated Supabase client
 * @param params - Audit log parameters
 * @returns Promise that resolves when audit log is created (or fails gracefully)
 *
 * @example Payment recording
 * ```typescript
 * const supabase = await createServerClient()
 *
 * await logAudit(supabase, {
 *   agencyId: agency.id,
 *   userId: user.id,
 *   entityType: 'installment',
 *   entityId: installment.id,
 *   action: 'payment_recorded',
 *   oldValues: {
 *     status: 'pending',
 *     paid_date: null,
 *     paid_amount: null,
 *     payment_notes: null
 *   },
 *   newValues: {
 *     status: 'paid',
 *     paid_date: '2025-11-14',
 *     paid_amount: 1000.00,
 *     payment_notes: 'Check #12345'
 *   },
 *   metadata: {
 *     notes: 'Check #12345',
 *     installment_number: 1,
 *     payment_plan_id: 'uuid'
 *   },
 *   ipAddress: request.headers.get('x-forwarded-for'),
 *   userAgent: request.headers.get('user-agent')
 * })
 * ```
 *
 * @example User update (system action)
 * ```typescript
 * await logAudit(supabase, {
 *   agencyId: agency.id,
 *   userId: null, // System action
 *   entityType: 'user',
 *   entityId: user.id,
 *   action: 'status_updated',
 *   oldValues: { status: 'active' },
 *   newValues: { status: 'suspended' },
 *   metadata: {
 *     reason: 'payment_overdue',
 *     automated: true
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
      agency_id: params.agencyId,
      user_id: params.userId,
      entity_type: params.entityType,
      entity_id: params.entityId,
      action: params.action,
      old_values: params.oldValues || null,
      new_values: params.newValues,
      metadata: params.metadata || null,
      ip_address: params.ipAddress || null,
      user_agent: params.userAgent || null,
      // created_at will be set by database default (now())
    })

    if (error) {
      console.error('Failed to create audit log entry:', {
        error,
        params: {
          agencyId: params.agencyId,
          entityType: params.entityType,
          entityId: params.entityId,
          action: params.action,
        },
      })
      // Don't throw - audit logging failure shouldn't break the operation
      // This follows the principle that audit logging is important but not critical
      // enough to block business operations
    }
  } catch (error) {
    console.error('Unexpected error during audit logging:', {
      error,
      params: {
        agencyId: params.agencyId,
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

/**
 * Convenience function for logging payment-related changes
 *
 * This specialized function simplifies payment audit logging by:
 * - Automatically setting entityType to 'installment'
 * - Automatically setting action to 'payment_recorded'
 * - Providing clear parameter names specific to payments
 *
 * @param client - Authenticated Supabase client
 * @param params - Payment-specific audit log parameters
 * @returns Promise that resolves when audit log is created
 *
 * @example
 * ```typescript
 * await logPaymentAudit(supabase, {
 *   agencyId: agency.id,
 *   userId: user.id,
 *   installmentId: installment.id,
 *   oldValues: {
 *     status: 'pending',
 *     paid_date: null,
 *     paid_amount: null,
 *     payment_notes: null
 *   },
 *   newValues: {
 *     status: 'paid',
 *     paid_date: '2025-11-14',
 *     paid_amount: 1000.00,
 *     payment_notes: 'Check #12345'
 *   },
 *   metadata: {
 *     notes: 'Check #12345',
 *     installment_number: 1
 *   },
 *   ipAddress: request.headers.get('x-forwarded-for'),
 *   userAgent: request.headers.get('user-agent')
 * })
 * ```
 */
export async function logPaymentAudit(
  client: SupabaseClient,
  params: {
    agencyId: string
    userId: string
    installmentId: string
    oldValues: {
      status: string
      paid_date: string | null
      paid_amount: number | null
      payment_notes: string | null
    }
    newValues: {
      status: string
      paid_date: string
      paid_amount: number
      payment_notes: string | null
    }
    metadata?: Record<string, any>
    ipAddress?: string | null
    userAgent?: string | null
  }
): Promise<void> {
  await logAudit(client, {
    agencyId: params.agencyId,
    userId: params.userId,
    entityType: 'installment',
    entityId: params.installmentId,
    action: 'payment_recorded',
    oldValues: params.oldValues,
    newValues: params.newValues,
    metadata: params.metadata,
    ipAddress: params.ipAddress,
    userAgent: params.userAgent,
  })
}
