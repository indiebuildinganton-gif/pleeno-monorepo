/**
 * OverduePaymentsSummary Component
 *
 * Prominent dashboard widget displaying overdue payment count and total value.
 * Uses red styling for urgency and provides immediate visibility into overdue
 * payments that require follow-up action.
 *
 * Features:
 * - Large, bold card with red styling for urgent attention
 * - Display count of overdue installments
 * - Display total value of overdue payments
 * - Clickable to navigate to filtered payment plans view
 * - Auto-refresh data using TanStack Query (5-minute interval)
 * - Green "all clear" state when no overdue payments
 *
 * Epic 5: Intelligent Status Automation
 * Story 5.3: Overdue Payment Alerts
 * Task 4: Add Overdue Payments Section to Dashboard
 */

'use client'

import { useQuery } from '@tanstack/react-query'
import { useRouter } from 'next/navigation'
import { AlertTriangle } from 'lucide-react'
import { getApiUrl } from '../hooks/useApiUrl'

/**
 * Payment Status Category
 */
interface PaymentStatusCategory {
  count: number
  total_amount: number
}

/**
 * Payment Status Summary Data
 */
interface PaymentStatusData {
  pending: PaymentStatusCategory
  due_soon: PaymentStatusCategory
  overdue: PaymentStatusCategory
  paid_this_month: PaymentStatusCategory
}

/**
 * API Response Type
 */
interface PaymentStatusResponse {
  success: boolean
  data: PaymentStatusData
}

/**
 * Format currency value
 */
function formatCurrency(amount: number, currency: string = 'AUD'): string {
  return new Intl.NumberFormat('en-AU', {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount)
}

/**
 * Loading Skeleton Component
 */
function LoadingSkeleton() {
  return (
    <div className="bg-white rounded-lg shadow-md p-6 animate-pulse">
      <div className="h-24 bg-gray-200 rounded"></div>
    </div>
  )
}

/**
 * Error State Component
 */
function ErrorState() {
  return (
    <div className="bg-red-50 border border-red-200 rounded-lg p-6">
      <p className="text-red-600 text-sm">Failed to load overdue payments summary</p>
    </div>
  )
}

/**
 * No Overdue Payments Component (Green - All Clear State)
 */
function NoOverduePayments() {
  return (
    <div className="bg-green-50 border border-green-200 rounded-lg p-6">
      <div className="flex items-center gap-3">
        <div className="p-3 bg-green-100 rounded-full">
          <AlertTriangle className="h-6 w-6 text-green-600" />
        </div>
        <div>
          <h3 className="text-lg font-semibold text-green-800">All Payments Current</h3>
          <p className="text-sm text-green-600">No overdue payments at this time</p>
        </div>
      </div>
    </div>
  )
}

/**
 * Main OverduePaymentsSummary Component
 *
 * Displays prominent overdue payment summary at top of dashboard.
 * Fetches data from payment status summary API and extracts overdue category.
 */
export function OverduePaymentsSummary() {
  const router = useRouter()

  const { data, isLoading, error } = useQuery<PaymentStatusResponse>({
    queryKey: ['payment-status-summary'],
    queryFn: async () => {
      const response = await fetch(getApiUrl('/api/dashboard/payment-status-summary'))
      if (!response.ok) {
        throw new Error('Failed to fetch payment status')
      }
      return response.json()
    },
    refetchInterval: 300000, // Refresh every 5 minutes
    staleTime: 5 * 60 * 1000, // 5 minutes
  })

  const handleClick = () => {
    router.push('/payments?status=overdue')
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      handleClick()
    }
  }

  if (isLoading) {
    return <LoadingSkeleton />
  }

  if (error || !data?.success) {
    return <ErrorState />
  }

  const { count, total_amount } = data.data.overdue

  // Show green "all clear" state when no overdue payments
  if (count === 0) {
    return <NoOverduePayments />
  }

  return (
    <div
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      className="bg-red-50 border-2 border-red-300 rounded-lg p-6 cursor-pointer hover:shadow-lg transition-shadow"
      role="button"
      tabIndex={0}
      aria-label={`${count} overdue payment${count !== 1 ? 's' : ''} totaling ${formatCurrency(total_amount)}. Click to view details.`}
    >
      <div className="flex items-center gap-4">
        {/* Icon */}
        <div className="p-4 bg-red-100 rounded-full flex-shrink-0">
          <AlertTriangle className="h-8 w-8 text-red-600" />
        </div>

        {/* Content */}
        <div className="flex-1">
          <h3 className="text-2xl font-bold text-red-900">
            {count} Overdue Payment{count !== 1 ? 's' : ''}
          </h3>
          <p className="text-xl font-semibold text-red-700 mt-1">
            {formatCurrency(total_amount)} Total
          </p>
          <p className="text-sm text-red-600 mt-2">
            Click to view overdue payment plans →
          </p>
        </div>
      </div>
    </div>
  )
}
