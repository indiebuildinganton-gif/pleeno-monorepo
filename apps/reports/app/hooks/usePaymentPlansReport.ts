/**
 * usePaymentPlansReport Hook
 *
 * Story 7.1: Payment Plans Report Generator with Contract Expiration Tracking
 * Task 5: Integrate Report Builder and Results
 *
 * Custom TanStack Query hook for generating payment plans reports.
 * Uses useMutation since report generation is a POST request, not a GET.
 */

import { useMutation } from '@tanstack/react-query'
import type {
  PaymentPlansReportRequest,
  PaymentPlansReportResponse,
} from '../types/payment-plans-report'

/**
 * Custom hook to generate payment plans report
 *
 * @returns TanStack Query mutation for report generation
 *
 * @example
 * ```tsx
 * const mutation = usePaymentPlansReport()
 *
 * // Generate report
 * mutation.mutate(reportRequest, {
 *   onSuccess: (data) => {
 *     console.log('Report generated:', data)
 *   },
 *   onError: (error) => {
 *     console.error('Failed to generate report:', error)
 *   }
 * })
 *
 * // Check states
 * if (mutation.isPending) return <Spinner />
 * if (mutation.isError) return <Error error={mutation.error} />
 * if (mutation.isSuccess) return <Table data={mutation.data} />
 * ```
 */
export function usePaymentPlansReport() {
  return useMutation({
    mutationFn: async (request: PaymentPlansReportRequest) => {
      const res = await fetch('/api/reports/payment-plans', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(request),
      })

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}))
        throw new Error(
          errorData.error || `Failed to generate report: ${res.status} ${res.statusText}`
        )
      }

      return (await res.json()) as PaymentPlansReportResponse
    },
  })
}
