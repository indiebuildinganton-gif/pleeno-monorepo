/**
 * OverduePaymentsWidget Component
 *
 * Displays overdue payments in a visually urgent manner with:
 * - Color-coded severity indicators (yellow/orange/red)
 * - Total summaries (count and amount)
 * - Clickable navigation to payment plan details
 * - Responsive layout (table on desktop, cards on mobile)
 *
 * Epic 6: Agency Dashboard
 * Story 6.5: Overdue Payments Summary Widget
 * Task 2: Create OverduePaymentsWidget Component
 */

'use client'

import Link from 'next/link'
import { AlertTriangle } from 'lucide-react'
import { formatCurrency } from '@pleeno/utils'
import { useOverduePayments, OverduePayment } from '../hooks/useOverduePayments'

// =================================================================
// HELPER FUNCTIONS - Urgency Color Coding
// =================================================================

/**
 * Get text color class based on days overdue
 * - 1-7 days: yellow/warning
 * - 8-30 days: orange/alert
 * - 30+ days: red/critical
 */
function getUrgencyColor(days: number): string {
  if (days >= 30) return 'text-red-600'
  if (days >= 8) return 'text-orange-600'
  return 'text-yellow-600'
}

/**
 * Get background and border color classes based on days overdue
 * Used for the payment item cards
 */
function getUrgencyBgColor(days: number): string {
  if (days >= 30) return 'bg-red-50 border-red-300'
  if (days >= 8) return 'bg-orange-50 border-orange-300'
  return 'bg-yellow-50 border-yellow-300'
}

// =================================================================
// SUB-COMPONENTS - Loading, Error, Empty States
// =================================================================

/**
 * Loading Skeleton Component
 *
 * Displays animated skeleton while data is being fetched
 */
function OverduePaymentsSkeleton() {
  return (
    <div className="border-2 border-gray-200 rounded-lg p-4 bg-gray-50 animate-pulse">
      <div className="flex items-center justify-between mb-4">
        <div className="h-6 w-48 bg-gray-300 rounded"></div>
        <div className="h-8 w-32 bg-gray-300 rounded"></div>
      </div>
      <div className="space-y-2">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-20 bg-gray-200 rounded"></div>
        ))}
      </div>
    </div>
  )
}

/**
 * Error State Component
 *
 * Displays error message with retry button
 */
function OverduePaymentsError({ onRetry }: { onRetry: () => void }) {
  return (
    <div className="border-2 border-red-300 rounded-lg p-6 bg-red-50">
      <div className="flex items-center gap-3 mb-4">
        <AlertTriangle className="h-6 w-6 text-red-600" />
        <h3 className="text-lg font-semibold text-red-900">Failed to Load</h3>
      </div>
      <p className="text-sm text-red-700 mb-4">
        Unable to fetch overdue payments. Please try again.
      </p>
      <button
        onClick={onRetry}
        className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm font-medium"
      >
        Retry
      </button>
    </div>
  )
}

/**
 * Empty State Component
 *
 * Displays friendly message when no overdue payments exist
 */
function OverduePaymentsEmpty() {
  return (
    <div className="border-2 border-green-300 rounded-lg p-6 bg-green-50">
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

// =================================================================
// OVERDUE PAYMENT ITEM COMPONENT
// =================================================================

/**
 * OverduePaymentItem Component
 *
 * Individual overdue payment item with:
 * - Student name and college
 * - Amount and days overdue
 * - Color-coded urgency styling
 * - Clickable link to payment plan details
 */
function OverduePaymentItem({ payment }: { payment: OverduePayment }) {
  const urgencyColor = getUrgencyColor(payment.days_overdue)
  const urgencyBgColor = getUrgencyBgColor(payment.days_overdue)

  return (
    <Link
      href={`/payments/plans/${payment.payment_plan_id}`}
      className={`block p-3 rounded-lg border ${urgencyBgColor} hover:shadow-md transition-all`}
    >
      <div className="flex items-center justify-between">
        {/* Student and College Info */}
        <div className="flex-1 min-w-0">
          <p className="font-medium text-gray-900 truncate">{payment.student_name}</p>
          <p className="text-sm text-gray-600 truncate">{payment.college_name}</p>
        </div>

        {/* Amount and Days Overdue */}
        <div className="text-right ml-4">
          <p className="font-bold text-gray-900">
            {formatCurrency(payment.amount, 'AUD')}
          </p>
          <p className={`text-sm font-medium ${urgencyColor}`}>
            {payment.days_overdue} day{payment.days_overdue !== 1 ? 's' : ''} overdue
          </p>
        </div>
      </div>
    </Link>
  )
}

// =================================================================
// MAIN WIDGET COMPONENT
// =================================================================

/**
 * OverduePaymentsWidget Component
 *
 * Main widget displaying all overdue payments with:
 * - Prominent header with count badge and total amount
 * - List of overdue payments sorted by urgency
 * - Color-coded severity indicators
 * - Clickable navigation to payment plan details
 * - Responsive layout (table on desktop, cards on mobile)
 *
 * Fetches data using useOverduePayments hook with:
 * - Auto-refresh every 5 minutes
 * - Refresh on window focus
 * - 5-minute stale time
 *
 * States:
 * - Loading: Shows skeleton loader
 * - Error: Shows error message with retry
 * - Empty: Shows "All Payments Current" message
 * - Success: Renders list of overdue payments
 */
export function OverduePaymentsWidget() {
  const { data, isLoading, error, refetch } = useOverduePayments()

  // Loading state
  if (isLoading) {
    return <OverduePaymentsSkeleton />
  }

  // Error state
  if (error) {
    return <OverduePaymentsError onRetry={() => refetch()} />
  }

  // Empty state
  if (!data || data.total_count === 0) {
    return <OverduePaymentsEmpty />
  }

  // Success state - render overdue payments
  return (
    <div className="border-2 border-red-500 rounded-lg p-4 bg-red-50">
      {/* Header with count badge and total amount */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-red-900 flex items-center gap-2">
          Overdue Payments
          <span className="px-2 py-1 bg-red-600 text-white text-sm rounded-full">
            {data.total_count}
          </span>
        </h2>
        <div className="text-right">
          <p className="text-sm text-red-700">Total Overdue</p>
          <p className="text-2xl font-bold text-red-900">
            {formatCurrency(data.total_amount, 'AUD')}
          </p>
        </div>
      </div>

      {/* Overdue payments list */}
      <div className="space-y-2">
        {data.overdue_payments.map((payment) => (
          <OverduePaymentItem key={payment.id} payment={payment} />
        ))}
      </div>
    </div>
  )
}
