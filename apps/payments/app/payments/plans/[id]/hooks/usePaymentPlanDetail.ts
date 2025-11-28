import { useQuery } from '@tanstack/react-query'
import type { Installment } from '@pleeno/validations'

/**
 * Payment Plan Detail from API
 */
export interface PaymentPlanDetail {
  id: string
  enrollment_id: string
  total_amount: number
  currency: string
  status: 'active' | 'completed' | 'cancelled'
  expected_commission: number
  earned_commission: number
  total_installments: number
  installments_paid_count: number
  next_due_date: string | null
  student: {
    id: string
    first_name: string
    last_name: string
  } | null
  college: {
    id: string
    name: string
  } | null
  branch: {
    id: string
    name: string
  } | null
  installments: Installment[]
}

/**
 * API Response
 */
interface PaymentPlanDetailResponse {
  success: boolean
  data: PaymentPlanDetail
}

/**
 * TanStack Query hook for fetching payment plan details
 *
 * Features:
 * - Fetches payment plan with installments
 * - Auto-refetches after mutations (via query invalidation)
 * - Loading and error states
 * - Stale time configuration
 *
 * Usage:
 * ```tsx
 * const { data, isLoading, error, refetch } = usePaymentPlanDetail(planId)
 *
 * if (isLoading) return <LoadingSkeleton />
 * if (error) return <ErrorState />
 * if (!data) return null
 *
 * const plan = data.data
 * ```
 *
 * Epic 4: Payments Domain
 * Story 4.4: Manual Payment Recording
 * Task 4: Payment Plan Detail Page Updates
 *
 * @param planId - The payment plan ID
 * @returns TanStack Query object with data, isLoading, error, refetch
 */
export function usePaymentPlanDetail(planId: string) {
  return useQuery<PaymentPlanDetailResponse>({
    queryKey: ['payment-plans', planId],
    queryFn: async () => {
      const res = await fetch(`/api/payment-plans/${planId}`)
      if (!res.ok) {
        throw new Error('Failed to fetch payment plan details')
      }
      return res.json()
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    enabled: !!planId, // Only run if planId is provided
  })
}
