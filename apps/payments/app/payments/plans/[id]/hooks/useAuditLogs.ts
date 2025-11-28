/**
 * useAuditLogs Hook
 *
 * TanStack Query hook for fetching audit logs for a specific installment.
 * Used by PaymentHistoryTimeline to display payment history.
 *
 * Epic 4: Payments Domain
 * Story 4.4: Manual Payment Recording
 * Task 10: Payment History Timeline (Optional)
 */

import { useQuery } from '@tanstack/react-query'
import type { AuditLog } from '@pleeno/database/audit-logger'

/**
 * User information from audit log
 */
export interface AuditLogUser {
  id: string
  name: string
  email: string
}

/**
 * Audit Log with expanded user information
 */
export interface AuditLogWithUser extends AuditLog {
  user: AuditLogUser | null
}

/**
 * API Response for audit logs
 */
interface AuditLogsResponse {
  success: boolean
  data: AuditLogWithUser[]
}

/**
 * TanStack Query hook for fetching audit logs for an installment
 *
 * Features:
 * - Fetches audit logs with user information
 * - Ordered by created_at descending (most recent first)
 * - Auto-refetches after mutations (via query invalidation)
 * - Loading and error states
 * - Filtered by entity_type='installment' and entity_id
 *
 * Usage:
 * ```tsx
 * const { data, isLoading, error } = useAuditLogs(installmentId)
 *
 * if (isLoading) return <Spinner />
 * if (error) return <ErrorState />
 * if (!data?.data?.length) return <EmptyState />
 *
 * const auditLogs = data.data
 * ```
 *
 * @param installmentId - The installment ID to fetch audit logs for
 * @returns TanStack Query object with data, isLoading, error
 */
export function useAuditLogs(installmentId: string | null) {
  return useQuery<AuditLogsResponse>({
    queryKey: ['audit-logs', 'installment', installmentId],
    queryFn: async () => {
      if (!installmentId) {
        throw new Error('Installment ID is required')
      }

      const res = await fetch(`/api/installments/${installmentId}/audit-logs`)
      if (!res.ok) {
        throw new Error('Failed to fetch audit logs')
      }
      return res.json()
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    enabled: !!installmentId, // Only run if installmentId is provided
  })
}
