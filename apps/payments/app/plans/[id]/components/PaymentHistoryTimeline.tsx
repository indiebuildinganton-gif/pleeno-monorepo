/**
 * PaymentHistoryTimeline Component
 *
 * Displays a visual timeline of payment history for an installment,
 * showing all payment recording events, partial payments, and modifications.
 *
 * Features:
 * - Chronological timeline of payment events (most recent first)
 * - Visual indicators with icons and color coding
 * - Displays date, action, amount, user, and notes
 * - Loading states and empty states
 * - Mobile responsive design
 *
 * Epic 4: Payments Domain
 * Story 4.4: Manual Payment Recording
 * Task 10: Payment History Timeline (Optional)
 */

'use client'

import { Clock, DollarSign, Edit } from 'lucide-react'
import { formatCurrency } from '@pleeno/utils/formatters'
import { formatDateInAgencyTimezone } from '@pleeno/utils/date-helpers'
import { useAuditLogs, type AuditLogWithUser } from '../hooks/useAuditLogs'

/**
 * PaymentHistoryTimeline Props
 */
interface PaymentHistoryTimelineProps {
  /** Installment ID to fetch audit logs for */
  installmentId: string | null
  /** Currency code for formatting amounts */
  currency: string
  /** Agency timezone for date formatting */
  timezone?: string
}

/**
 * PaymentHistoryTimeline Component
 *
 * Fetches and displays audit logs for an installment in a timeline format.
 * Shows loading state while fetching, empty state if no history exists.
 *
 * @example
 * ```tsx
 * <PaymentHistoryTimeline
 *   installmentId={installment.id}
 *   currency="AUD"
 *   timezone="Australia/Brisbane"
 * />
 * ```
 */
export function PaymentHistoryTimeline({
  installmentId,
  currency,
  timezone = 'UTC',
}: PaymentHistoryTimelineProps) {
  const { data, isLoading, error } = useAuditLogs(installmentId)

  // Loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="flex items-center space-x-2 text-muted-foreground">
          <Clock className="h-4 w-4 animate-spin" />
          <span className="text-sm">Loading payment history...</span>
        </div>
      </div>
    )
  }

  // Error state
  if (error) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="text-sm text-destructive">
          Failed to load payment history. Please try again.
        </div>
      </div>
    )
  }

  // Empty state
  if (!data?.data || data.data.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <Clock className="h-12 w-12 text-muted-foreground/50 mb-3" />
        <h4 className="text-sm font-medium text-muted-foreground mb-1">
          No payment history yet
        </h4>
        <p className="text-xs text-muted-foreground">
          Payment activities will appear here once recorded
        </p>
      </div>
    )
  }

  const auditLogs = data.data

  return (
    <div className="payment-timeline">
      <div className="space-y-6">
        {auditLogs.map((log, index) => (
          <TimelineEntry
            key={log.id}
            log={log}
            currency={currency}
            timezone={timezone}
            isLast={index === auditLogs.length - 1}
          />
        ))}
      </div>
    </div>
  )
}

/**
 * TimelineEntry Props
 */
interface TimelineEntryProps {
  /** Audit log entry to display */
  log: AuditLogWithUser
  /** Currency code for formatting amounts */
  currency: string
  /** Agency timezone for date formatting */
  timezone: string
  /** Whether this is the last entry in the timeline */
  isLast: boolean
}

/**
 * TimelineEntry Component
 *
 * Displays a single entry in the payment history timeline.
 * Shows icon, date, action, amount, user, and notes.
 *
 * Color coding:
 * - Green: Payment recorded (full payment)
 * - Yellow: Partial payment
 * - Blue: Payment update/modification
 */
function TimelineEntry({ log, currency, timezone, isLast }: TimelineEntryProps) {
  // Determine action type and styling
  const isPartialPayment =
    log.new_values?.status === 'partial' || log.metadata?.is_partial === true
  const isFullPayment = log.new_values?.status === 'paid' && !isPartialPayment
  const isUpdate = log.action === 'updated'

  // Icon and color based on action type
  const Icon = isUpdate ? Edit : DollarSign
  const iconColor = isFullPayment
    ? 'text-green-600 bg-green-100'
    : isPartialPayment
      ? 'text-yellow-600 bg-yellow-100'
      : 'text-blue-600 bg-blue-100'

  const markerColor = isFullPayment
    ? 'bg-green-600'
    : isPartialPayment
      ? 'bg-yellow-600'
      : 'bg-blue-600'

  // Format action for display
  const actionText = formatAction(log.action, log.new_values?.status)

  // Format date and time
  const dateTime = formatDateInAgencyTimezone(
    log.created_at,
    timezone,
    'MMM d, yyyy \'at\' h:mm a'
  )

  // Extract payment details
  const paidAmount = log.new_values?.paid_amount
  const notes = log.new_values?.payment_notes || log.metadata?.notes

  return (
    <div className="timeline-entry relative flex gap-4">
      {/* Timeline marker and line */}
      <div className="timeline-marker-container flex flex-col items-center">
        {/* Icon with colored background */}
        <div className={`rounded-full p-2 ${iconColor}`}>
          <Icon className="h-4 w-4" />
        </div>

        {/* Connecting line (except for last entry) */}
        {!isLast && (
          <div className={`w-0.5 flex-1 mt-2 ${markerColor} opacity-30`} />
        )}
      </div>

      {/* Timeline content */}
      <div className="timeline-content flex-1 pb-6">
        {/* Header: Action and Date */}
        <div className="flex items-start justify-between gap-2 mb-2">
          <span className="font-medium text-sm">{actionText}</span>
          <span className="text-xs text-muted-foreground whitespace-nowrap">
            {dateTime}
          </span>
        </div>

        {/* Details: Amount, Notes, User */}
        <div className="space-y-1.5 text-sm">
          {/* Amount */}
          {paidAmount !== null && paidAmount !== undefined && (
            <div className="flex items-center gap-2">
              <span className="text-muted-foreground">Amount:</span>
              <span className="font-semibold">{formatCurrency(paidAmount, currency)}</span>
              {isPartialPayment && (
                <span className="text-xs px-2 py-0.5 bg-yellow-100 text-yellow-800 rounded">
                  Partial
                </span>
              )}
            </div>
          )}

          {/* Notes */}
          {notes && (
            <div className="text-sm italic text-muted-foreground border-l-2 border-muted pl-3 py-1">
              &ldquo;{notes}&rdquo;
            </div>
          )}

          {/* User */}
          {log.user && (
            <div className="text-xs text-muted-foreground mt-2">
              Recorded by {log.user.name}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

/**
 * Format action type for display
 *
 * @param action - Audit action type
 * @param status - New status value from audit log
 * @returns Human-readable action text
 */
function formatAction(action: string, status?: string): string {
  if (action === 'payment_recorded') {
    if (status === 'paid') {
      return 'Payment Recorded (Full)'
    }
    if (status === 'partial') {
      return 'Payment Recorded (Partial)'
    }
    return 'Payment Recorded'
  }

  if (action === 'updated') {
    return 'Payment Updated'
  }

  // Fallback: capitalize first letter
  return action.charAt(0).toUpperCase() + action.slice(1).replace(/_/g, ' ')
}
