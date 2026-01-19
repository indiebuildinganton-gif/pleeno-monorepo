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

import { useEffect, useState, useRef } from 'react'

import { AlertTriangle } from 'lucide-react'
import { formatCurrency } from '@pleeno/utils'
import { useOverduePayments, OverduePayment } from '../hooks/useOverduePayments'
import { getZoneUrl } from '@/lib/navigation-utils'

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
  if (days >= 30) return 'bg-white border-red-300'
  if (days >= 8) return 'bg-white border-orange-300'
  return 'bg-white border-yellow-300'
}

// =================================================================
// SUB-COMPONENTS - Loading, Error, Empty States
// =================================================================

/**
 * Loading Skeleton Component
 *
 * Displays animated skeleton while data is being fetched
 * Matches the layout of the actual widget for smooth transition
 */
function OverduePaymentsSkeleton() {
  return (
    <div
      className="border-2 border-gray-300 rounded-lg p-4 bg-gray-50 animate-pulse"
      aria-busy="true"
      aria-label="Loading overdue payments"
    >
      {/* Header skeleton - matches actual widget header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="h-6 w-40 bg-gray-300 rounded"></div>
          <div className="h-6 w-8 bg-gray-300 rounded-full"></div>
        </div>
        <div>
          <div className="h-4 w-24 bg-gray-300 rounded mb-1"></div>
          <div className="h-8 w-32 bg-gray-300 rounded"></div>
        </div>
      </div>

      {/* Payment item skeletons - 3 rows matching actual payment items */}
      <div className="space-y-2">
        {[1, 2, 3].map((i) => (
          <div key={i} className="p-3 rounded-lg border border-gray-300 bg-white">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <div className="h-5 w-32 bg-gray-300 rounded mb-2"></div>
                <div className="h-4 w-48 bg-gray-300 rounded"></div>
              </div>
              <div className="text-right">
                <div className="h-5 w-20 bg-gray-300 rounded mb-2"></div>
                <div className="h-4 w-24 bg-gray-300 rounded"></div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

/**
 * Error State Component
 *
 * Displays error message with retry button
 * Logs error to console for debugging
 * Includes accessibility attributes for screen readers
 */
function OverduePaymentsError({ error, onRetry }: { error: Error; onRetry: () => void }) {
  // Log error for debugging
  useEffect(() => {
    console.error('Overdue payments fetch error:', error)
  }, [error])

  return (
    <div
      className="border-2 border-red-300 rounded-lg p-6 bg-red-50"
      role="alert"
      aria-live="polite"
    >
      <div className="flex items-center gap-3 mb-4">
        <AlertTriangle className="h-6 w-6 text-red-600" aria-hidden="true" />
        <h3 className="text-lg font-semibold text-red-900">
          Unable to load overdue payments
        </h3>
      </div>
      <p className="text-sm text-red-700 mb-4">
        There was an error fetching the data. Please try again.
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
 * Displays celebratory message when no overdue payments exist
 * Features:
 * - Celebration emoji with bounce animation
 * - Positive reinforcement messaging
 * - Green success styling
 * - "Last checked" timestamp for reassurance
 */
function OverduePaymentsEmpty() {
  return (
    <div className="border-2 border-green-500 rounded-lg p-6 bg-green-50 text-center">
      <div className="text-6xl mb-3 animate-bounce">🎉</div>
      <h3 className="text-lg font-semibold text-green-900 mb-2">
        No overdue payments!
      </h3>
      <p className="text-sm text-green-700">
        Great work keeping all payments on track!
      </p>
      <p className="text-xs text-green-600 mt-2">
        Last checked: {new Date().toLocaleTimeString()}
      </p>
    </div>
  )
}

// =================================================================
// OVERDUE PAYMENT ITEM COMPONENT
// =================================================================

/**
 * OverduePaymentItem Component
 *
 * Compact card for dense grid layout with:
 * - Student name and college
 * - Amount and days overdue inline
 * - AI call reminder action button
 * - Color-coded urgency styling
 * - Clickable link to payment plan details
 */
function OverduePaymentItem({ payment }: { payment: OverduePayment }) {
  const urgencyColor = getUrgencyColor(payment.days_overdue)
  const urgencyBgColor = getUrgencyBgColor(payment.days_overdue)

  const handleAICall = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    // TODO: Implement AI call reminder functionality
    console.log('AI Call reminder for:', payment.student_name)
    alert(`AI Call reminder initiated for ${payment.student_name}`)
  }

  return (
    <div className={`rounded-lg border ${urgencyBgColor} hover:shadow-md transition-all p-3 flex flex-col gap-2`}>
      {/* Student Info - Name & Institution on one line */}
      <a
        href={getZoneUrl('payments', `/plans/${payment.payment_plan_id}`)}
        className="block hover:underline"
      >
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-gray-900 truncate text-sm">{payment.student_name}</p>
            <p className="text-xs text-gray-600 truncate">{payment.college_name}</p>
          </div>
        </div>
      </a>

      {/* Amount and Days Overdue - Inline */}
      <div className="flex items-center justify-between text-xs">
        <span className="font-bold text-gray-900">{formatCurrency(payment.amount)}</span>
        <span className={`font-medium ${urgencyColor}`}>
          {payment.days_overdue}d overdue
        </span>
      </div>

      {/* AI Call Action Button */}
      <button
        onClick={handleAICall}
        className="w-full px-2 py-1.5 bg-green-600 hover:bg-green-700 text-white text-xs font-medium rounded transition-colors flex items-center justify-center gap-1.5"
      >
        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
        </svg>
        AI Call Reminder
      </button>
    </div>
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
 * - Auto-refresh with visual indicator for new overdue payments
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
 *
 * New Overdue Detection:
 * - Tracks previous count using useRef
 * - Shows flash border animation when count increases
 * - Displays "New overdue payment" badge for 3 seconds
 * - Auto-dismisses visual indicator
 */
export function OverduePaymentsWidget() {
  const { data, isLoading, error, refetch } = useOverduePayments()
  const [hasNewOverdue, setHasNewOverdue] = useState(false)
  const prevCountRef = useRef<number | undefined>(undefined)

  // Detect new overdue payments by comparing current vs previous count
  useEffect(() => {
    if (data && prevCountRef.current !== undefined) {
      if (data.total_count > prevCountRef.current) {
        // New overdue payment detected - show visual indicator
        setHasNewOverdue(true)

        // Auto-dismiss after 3 seconds
        const timeout = setTimeout(() => {
          setHasNewOverdue(false)
        }, 3000)

        // Cleanup: cancel timeout on unmount or when dependency changes
        return () => clearTimeout(timeout)
      }
    }
    // Update previous count reference
    prevCountRef.current = data?.total_count
  }, [data?.total_count])

  // Loading state
  if (isLoading) {
    return <OverduePaymentsSkeleton />
  }

  // Error state
  if (error) {
    return <OverduePaymentsError error={error} onRetry={() => refetch()} />
  }

  // Empty state
  if (!data || data.total_count === 0) {
    return <OverduePaymentsEmpty />
  }

  // Success state - render overdue payments
  return (
    <div
      className={`
        border-2 rounded-lg p-4 bg-white transition-all
        ${hasNewOverdue ? 'border-red-600 animate-pulse' : 'border-gray-300'}
      `}
    >
      {/* New overdue payment indicator */}
      {hasNewOverdue && (
        <div className="mb-3 px-3 py-1.5 bg-red-600 text-white text-sm font-medium rounded-full inline-flex items-center gap-2 animate-fade-in">
          <AlertTriangle className="h-4 w-4" aria-hidden="true" />
          New overdue payment detected
        </div>
      )}

      {/* Header with count badge and total amount */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
          Overdue Payments
          <span className="px-2 py-1 bg-red-600 text-white text-sm rounded-full">
            {data.total_count}
          </span>
        </h2>
        <div className="text-right">
          <p className="text-sm text-gray-600">Total Overdue</p>
          <p className="text-2xl font-bold text-gray-900">
            {formatCurrency(data.total_amount)}
          </p>
        </div>
      </div>

      {/* Overdue payments grid - 2-3 columns responsive */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {data.overdue_payments.map((payment) => (
          <OverduePaymentItem key={payment.id} payment={payment} />
        ))}
      </div>
    </div>
  )
}
