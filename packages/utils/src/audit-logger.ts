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

/**
 * Audit log entry returned from queries
 */
export interface AuditLogEntry {
  id: string
  user_id: string
  agency_id: string
  entity_type: string
  entity_id: string
  action: 'create' | 'update' | 'delete'
  old_values: Record<string, any> | null
  new_values: Record<string, any> | null
  metadata: Record<string, any> | null
  ip_address: string | null
  user_agent: string | null
  timestamp: string
}

/**
 * Query options for fetching audit logs
 */
export interface AuditLogQueryOptions {
  /** Filter by entity type (e.g., 'enrollment', 'enrollment_document') */
  entityType?: string
  /** Filter by specific entity ID */
  entityId?: string
  /** Filter by action type */
  action?: 'create' | 'update' | 'delete'
  /** Filter by user ID who performed the action */
  userId?: string
  /** Maximum number of records to return (default: 50) */
  limit?: number
  /** Offset for pagination (default: 0) */
  offset?: number
  /** Filter by date range (start) */
  startDate?: Date
  /** Filter by date range (end) */
  endDate?: Date
}

/**
 * Fetches audit logs with optional filtering
 *
 * This function queries the audit_logs table with various filter options
 * for reporting and compliance purposes.
 *
 * @param client - Authenticated Supabase client
 * @param agencyId - Agency ID to filter logs (required for multi-tenant isolation)
 * @param options - Query options for filtering
 * @returns Promise resolving to array of audit log entries
 *
 * @example
 * ```typescript
 * // Get all enrollment-related audit logs
 * const logs = await getAuditLogs(supabase, agencyId, {
 *   entityType: 'enrollment',
 *   limit: 100
 * })
 *
 * // Get audit history for a specific enrollment
 * const enrollmentHistory = await getAuditLogs(supabase, agencyId, {
 *   entityType: 'enrollment',
 *   entityId: 'enrollment-uuid'
 * })
 * ```
 */
export async function getAuditLogs(
  client: SupabaseClient,
  agencyId: string,
  options: AuditLogQueryOptions = {}
): Promise<AuditLogEntry[]> {
  try {
    let query = client
      .from('audit_logs')
      .select('*')
      .eq('agency_id', agencyId)
      .order('timestamp', { ascending: false })

    // Apply filters
    if (options.entityType) {
      query = query.eq('entity_type', options.entityType)
    }

    if (options.entityId) {
      query = query.eq('entity_id', options.entityId)
    }

    if (options.action) {
      query = query.eq('action', options.action)
    }

    if (options.userId) {
      query = query.eq('user_id', options.userId)
    }

    if (options.startDate) {
      query = query.gte('timestamp', options.startDate.toISOString())
    }

    if (options.endDate) {
      query = query.lte('timestamp', options.endDate.toISOString())
    }

    // Apply pagination
    const limit = options.limit || 50
    const offset = options.offset || 0
    query = query.range(offset, offset + limit - 1)

    const { data, error } = await query

    if (error) {
      console.error('Failed to fetch audit logs:', error)
      throw new Error(`Failed to fetch audit logs: ${error.message}`)
    }

    return (data || []) as AuditLogEntry[]
  } catch (error) {
    console.error('Unexpected error fetching audit logs:', error)
    throw error
  }
}

/**
 * Gets complete audit history for a specific enrollment
 *
 * This convenience function fetches all audit logs related to an enrollment,
 * including enrollment creation, status updates, and document uploads.
 *
 * @param client - Authenticated Supabase client
 * @param agencyId - Agency ID for filtering
 * @param enrollmentId - UUID of the enrollment
 * @returns Promise resolving to array of audit log entries
 *
 * @example
 * ```typescript
 * const history = await getEnrollmentAuditHistory(
 *   supabase,
 *   agencyId,
 *   'enrollment-uuid'
 * )
 *
 * history.forEach(entry => {
 *   console.log(`${entry.action} by ${entry.user_id} at ${entry.timestamp}`)
 *   console.log('Old values:', entry.old_values)
 *   console.log('New values:', entry.new_values)
 * })
 * ```
 */
export async function getEnrollmentAuditHistory(
  client: SupabaseClient,
  agencyId: string,
  enrollmentId: string
): Promise<AuditLogEntry[]> {
  try {
    // Fetch both 'enrollment' and 'enrollment_document' logs for the enrollment
    const { data, error } = await client
      .from('audit_logs')
      .select('*')
      .eq('agency_id', agencyId)
      .eq('entity_id', enrollmentId)
      .in('entity_type', ['enrollment', 'enrollment_document'])
      .order('timestamp', { ascending: false })

    if (error) {
      console.error('Failed to fetch enrollment audit history:', error)
      throw new Error(`Failed to fetch enrollment audit history: ${error.message}`)
    }

    return (data || []) as AuditLogEntry[]
  } catch (error) {
    console.error('Unexpected error fetching enrollment audit history:', error)
    throw error
  }
}

/**
 * Gets document upload history for enrollments
 *
 * This function fetches all offer letter upload audit logs.
 *
 * @param client - Authenticated Supabase client
 * @param agencyId - Agency ID for filtering
 * @param limit - Maximum number of records (default: 50)
 * @returns Promise resolving to array of document upload audit logs
 *
 * @example
 * ```typescript
 * const uploads = await getDocumentUploadHistory(supabase, agencyId, 20)
 *
 * uploads.forEach(entry => {
 *   console.log(`Document uploaded for ${entry.entity_id}`)
 *   console.log('File:', entry.new_values?.offer_letter_filename)
 * })
 * ```
 */
export async function getDocumentUploadHistory(
  client: SupabaseClient,
  agencyId: string,
  limit: number = 50
): Promise<AuditLogEntry[]> {
  return getAuditLogs(client, agencyId, {
    entityType: 'enrollment_document',
    action: 'create',
    limit,
  })
}
