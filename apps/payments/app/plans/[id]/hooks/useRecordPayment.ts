import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useToast } from '@pleeno/ui'
import type { RecordPayment, Installment } from '@pleeno/validations/installment.schema'

/**
 * API Response type for record payment
 */
interface RecordPaymentResponse {
  success: boolean
  data: {
    installment: {
      id: string
      payment_plan_id: string
      installment_number: number
      amount: number
      paid_date: string | null
      paid_amount: number | null
      status: string
      payment_notes: string | null
    }
    payment_plan: {
      id: string
      status: string
      earned_commission: number
    }
  }
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
 * Parameters for the recordPayment mutation
 */
interface RecordPaymentParams extends RecordPayment {
  installmentId: string
  paymentPlanId: string
}

/**
 * TanStack Query mutation hook for recording installment payments
 *
 * Features:
 * - POST /api/installments/[id]/record-payment with validated data
 * - Optimistic update: Immediately update installment in cache before API call
 * - Optimistic update: Update payment plan status if all installments paid
 * - Optimistic update: Update earned_commission in cache
 * - Rollback: Revert optimistic updates on error
 * - Query invalidation: Refresh payment-plans, dashboard widgets on success
 * - Toast notifications: Success and error messages
 *
 * Usage:
 * ```tsx
 * const { mutate: recordPayment, isPending } = useRecordPayment()
 *
 * recordPayment({
 *   installmentId: installment.id,
 *   paymentPlanId: installment.payment_plan_id,
 *   paid_date: '2025-11-14',
 *   paid_amount: 1000,
 *   notes: 'Cash payment'
 * }, {
 *   onSuccess: () => {
 *     console.log('Payment recorded!')
 *   }
 * })
 *
 * <Button disabled={isPending}>
 *   {isPending ? 'Recording...' : 'Mark as Paid'}
 * </Button>
 * ```
 *
 * Epic 4: Payments Domain
 * Story 4.4: Manual Payment Recording
 * Task 3: TanStack Query Mutation for Payment Recording
 *
 * @returns TanStack Query mutation object with mutate, isPending, error, etc.
 */
export function useRecordPayment() {
  const queryClient = useQueryClient()
  const { addToast } = useToast()

  return useMutation({
    mutationFn: async ({
      installmentId,
      paymentPlanId,
      ...data
    }: RecordPaymentParams): Promise<RecordPaymentResponse> => {
      const response = await fetch(`/api/installments/${installmentId}/record-payment`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })

      const result = await response.json()

      if (!response.ok) {
        const error = result as ApiError
        const errorMessage = error.error?.message || error.message || 'Failed to record payment'
        throw new Error(errorMessage)
      }

      return result as RecordPaymentResponse
    },

    // Optimistic update: Update cache immediately before API call
    onMutate: async (variables) => {
      const { installmentId, paymentPlanId, paid_date, paid_amount, notes } = variables

      // Cancel outgoing refetches to prevent race conditions
      await queryClient.cancelQueries({ queryKey: ['payment-plans', paymentPlanId] })

      // Snapshot the previous value for rollback
      const previousPaymentPlan = queryClient.getQueryData(['payment-plans', paymentPlanId])

      // Optimistically update the installment in the cache
      queryClient.setQueryData(['payment-plans', paymentPlanId], (old: any) => {
        if (!old?.data) return old

        // Calculate new status based on paid amount
        const installment = old.data.installments?.find((i: any) => i.id === installmentId)
        if (!installment) return old

        const newStatus = paid_amount >= installment.amount ? 'paid' : 'partial'

        // Update the installment
        const updatedInstallments = old.data.installments?.map((i: any) =>
          i.id === installmentId
            ? {
                ...i,
                paid_date,
                paid_amount,
                status: newStatus,
                payment_notes: notes || null,
              }
            : i
        )

        // Check if all installments are now paid
        const allPaid = updatedInstallments?.every((i: any) => i.status === 'paid') ?? false

        // Calculate earned commission optimistically
        // Include both 'paid' and 'partial' installments to match API calculation
        const totalPaidAmount =
          updatedInstallments
            ?.filter((i: any) => (i.status === 'paid' || i.status === 'partial') && i.paid_amount !== null)
            .reduce((sum: number, i: any) => sum + (i.paid_amount || 0), 0) || 0

        const totalAmount = old.data.total_amount || 0
        const expectedCommission = old.data.expected_commission || 0
        const earnedCommission =
          totalAmount > 0
            ? Math.round(((totalPaidAmount / totalAmount) * expectedCommission * 100)) / 100
            : 0

        // Update payment plan
        return {
          ...old,
          data: {
            ...old.data,
            installments: updatedInstallments,
            status: allPaid ? 'completed' : old.data.status,
            earned_commission: earnedCommission,
          },
        }
      })

      // Return context with snapshot for rollback
      return { previousPaymentPlan, paymentPlanId }
    },

    // Rollback on error and show error toast
    onError: (error: Error, variables, context) => {
      // Restore previous cache state
      if (context?.previousPaymentPlan && context.paymentPlanId) {
        queryClient.setQueryData(['payment-plans', context.paymentPlanId], context.previousPaymentPlan)
      }

      // Show error toast notification
      addToast({
        title: 'Failed to record payment',
        description: error.message,
        variant: 'error',
      })
    },

    // Invalidate queries on success and show success toast
    onSuccess: (response, variables) => {
      const { paymentPlanId } = variables

      // Invalidate and refetch queries
      queryClient.invalidateQueries({ queryKey: ['payment-plans', paymentPlanId] })
      queryClient.invalidateQueries({ queryKey: ['payment-plans'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard', 'payment-status'] })

      // Invalidate dashboard widget queries (Task 5: Dashboard Widget Updates)
      // These widgets display payment data and need to refetch when payments are recorded
      queryClient.invalidateQueries({ queryKey: ['payment-status-summary'] }) // PaymentStatusWidget
      queryClient.invalidateQueries({ queryKey: ['overdue-payments'] }) // OverduePaymentsWidget
      queryClient.invalidateQueries({ queryKey: ['commission-breakdown'] }) // CommissionBreakdownWidget
      queryClient.invalidateQueries({ queryKey: ['cash-flow-projection'] }) // CashFlowChart

      // Show success toast notification
      addToast({
        title: 'Payment recorded successfully',
        description: `Installment #${response.data.installment.installment_number} has been marked as paid.`,
        variant: 'success',
      })
    },
  })
}
