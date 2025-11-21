/**
 * useOverduePayments Hook
 *
 * TanStack Query hook for fetching overdue payments data.
 * Provides auto-refresh, caching, and loading/error states.
 *
 * Epic 6: Agency Dashboard
 * Story 6.5: Overdue Payments Summary Widget
 * Task 2: Create OverduePaymentsWidget Component
 */

import { useQuery } from '@tanstack/react-query'
import { useApiUrl } from './useApiUrl'

/**
 * Overdue Payment Item
 */
export interface OverduePayment {
  id: string
  student_id: string
  student_name: string
  college_id: string
  college_name: string
  amount: number
  days_overdue: number
  due_date: string
  payment_plan_id: string
  installment_number: number
}

/**
 * Overdue Payments Response
 */
export interface OverduePaymentsResponse {
  overdue_payments: OverduePayment[]
  total_count: number
  total_amount: number
}

/**
 * API Response Wrapper
 */
interface ApiResponse {
  success: boolean
  data: OverduePaymentsResponse
}

/**
 * useOverduePayments Hook
 *
 * Fetches overdue payments from /api/overdue-payments
 * with automatic refresh and caching.
 *
 * Query Configuration:
 * - queryKey: ['overdue-payments']
 * - staleTime: 300000 (5 minutes)
 * - refetchInterval: 300000 (5 minutes auto-refresh)
 * - refetchOnWindowFocus: true (refresh when user returns to tab)
 *
 * @returns UseQueryResult with OverduePaymentsResponse data
 *
 * @example
 * ```tsx
 * const { data, isLoading, error, refetch } = useOverduePayments()
 *
 * if (isLoading) return <Skeleton />
 * if (error) return <Error onRetry={refetch} />
 * if (!data) return null
 *
 * return <div>{data.total_count} overdue payments</div>
 * ```
 */
export function useOverduePayments() {
  const getApiUrl = useApiUrl()

  return useQuery({
    queryKey: ['overdue-payments'],
    queryFn: async () => {
      const res = await fetch(getApiUrl('/api/overdue-payments'))
      if (!res.ok) {
        throw new Error('Failed to fetch overdue payments')
      }
      const json = (await res.json()) as ApiResponse
      return json.data
    },
    staleTime: 300000, // 5 minutes
    refetchInterval: 300000, // Auto-refresh every 5 minutes
    refetchOnWindowFocus: true, // Refresh when user returns to tab
  })
}
