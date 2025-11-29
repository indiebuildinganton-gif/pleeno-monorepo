import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useRouter } from 'next/navigation'
import { useToast } from '@pleeno/ui'
import type { PaymentPlanCreate, PaymentPlan } from '@pleeno/validations'
import { getApiUrl } from '@/hooks/useApiUrl'

/**
 * API Response type for payment plan creation
 */
interface CreatePaymentPlanResponse {
  success: boolean
  data: PaymentPlan
}

/**
 * API Error response type
 */
interface ApiError {
  error?: {
    message?: string
    errors?: Record<string, string[]>
  }
  message?: string
}

/**
 * TanStack Query mutation hook for creating payment plans
 *
 * Features:
 * - POST /api/payment-plans with validated data
 * - Success: Navigate to detail page + toast notification
 * - Error: Toast notification with descriptive message
 * - Optimistic update: Add plan to cache immediately
 * - Cache invalidation: Refresh payment-plans query on success
 * - Rollback: Remove optimistic update on error
 *
 * Usage:
 * ```tsx
 * const createPaymentPlan = useCreatePaymentPlan()
 *
 * const onSubmit = (data: PaymentPlanCreate) => {
 *   createPaymentPlan.mutate(data)
 * }
 *
 * <Button disabled={createPaymentPlan.isPending}>
 *   {createPaymentPlan.isPending ? 'Creating...' : 'Create'}
 * </Button>
 * ```
 *
 * Epic 4: Payments Domain
 * Story 4.1: Payment Plan Creation
 * Task 6: Payment Plan Creation Mutation
 *
 * @returns TanStack Query mutation object with mutate, isPending, error, etc.
 */
export function useCreatePaymentPlan() {
  const queryClient = useQueryClient()
  const router = useRouter()
  const { addToast } = useToast()

  return useMutation({
    mutationFn: async (data: PaymentPlanCreate): Promise<CreatePaymentPlanResponse> => {
      const response = await fetch(getApiUrl('/api/payment-plans'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })

      const result = await response.json()

      if (!response.ok) {
        const error = result as ApiError
        const errorMessage =
          error.error?.message || error.message || 'Failed to create payment plan'
        throw new Error(errorMessage)
      }

      return result as CreatePaymentPlanResponse
    },

    onSuccess: (response) => {
      // Invalidate payment plans cache to trigger refetch
      queryClient.invalidateQueries({ queryKey: ['payment-plans'] })

      // Show success toast notification
      addToast({
        title: 'Payment plan created',
        description: 'The payment plan has been created successfully.',
        variant: 'success',
      })

      // Navigate to detail page
      router.push(`/payments/plans/${response.data.id}`)
    },

    // Optimistic update: Add plan to cache immediately
    onMutate: async (newPaymentPlan) => {
      // Cancel outgoing refetches to prevent race conditions
      await queryClient.cancelQueries({ queryKey: ['payment-plans'] })

      // Snapshot the previous value for rollback
      const previousPaymentPlans = queryClient.getQueryData(['payment-plans'])

      // Optimistically update cache with temporary plan
      queryClient.setQueryData(['payment-plans'], (old: any) => {
        return {
          ...old,
          data: [
            ...(old?.data || []),
            {
              ...newPaymentPlan,
              id: 'temp-id',
              agency_id: 'temp-agency-id',
              currency: 'AUD',
              commission_rate_percent: 0,
              expected_commission: 0,
              status: 'active' as const,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            },
          ],
        }
      })

      // Return context with snapshot for rollback
      return { previousPaymentPlans }
    },

    // Rollback on error and show error toast
    onError: (error: Error, newPaymentPlan, context) => {
      // Restore previous cache state
      if (context?.previousPaymentPlans) {
        queryClient.setQueryData(['payment-plans'], context.previousPaymentPlans)
      }

      // Show error toast notification
      addToast({
        title: 'Failed to create payment plan',
        description: error.message,
        variant: 'error',
      })
    },
  })
}
