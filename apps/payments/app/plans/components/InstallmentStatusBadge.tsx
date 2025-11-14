/**
 * InstallmentStatusBadge Component
 *
 * Displays installment status with color-coded badges:
 * - draft: gray (not yet active)
 * - pending: blue (awaiting payment)
 * - due_soon: yellow/amber (pending + due within threshold)
 * - overdue: red (past due date)
 * - paid: green (payment received)
 * - cancelled: gray (installment cancelled)
 *
 * Epic 5: Intelligent Status Automation
 * Story 5.2: Due Soon Notification Flags
 * Task 2: Update UI to display "due soon" badges
 */

'use client'

import { Badge } from '@pleeno/ui'
import { Clock, AlertTriangle, CheckCircle, XCircle } from 'lucide-react'

export type InstallmentStatus = 'draft' | 'pending' | 'partial' | 'paid' | 'overdue' | 'cancelled'

export interface InstallmentStatusBadgeProps {
  /**
   * The installment status from the database
   */
  status: InstallmentStatus

  /**
   * Whether this installment is due soon
   * Only applies when status = 'pending'
   * Computed using isDueSoon() utility
   */
  isDueSoon?: boolean

  /**
   * Number of days until due (optional)
   * Shows countdown in badge when isDueSoon = true
   */
  daysUntilDue?: number

  /**
   * Show icon in badge
   * @default true
   */
  showIcon?: boolean

  /**
   * Additional CSS classes
   */
  className?: string
}

/**
 * Status configuration mapping
 * Defines variant, label, and icon for each status
 */
const statusConfig = {
  draft: {
    variant: 'gray' as const,
    label: 'Draft',
    icon: null,
  },
  pending: {
    variant: 'blue' as const,
    label: 'Pending',
    icon: null,
  },
  due_soon: {
    variant: 'warning' as const,
    label: 'Due Soon',
    icon: Clock,
  },
  partial: {
    variant: 'warning' as const,
    label: 'Partial',
    icon: Clock,
  },
  overdue: {
    variant: 'destructive' as const,
    label: 'Overdue',
    icon: AlertTriangle,
  },
  paid: {
    variant: 'success' as const,
    label: 'Paid',
    icon: CheckCircle,
  },
  cancelled: {
    variant: 'gray' as const,
    label: 'Cancelled',
    icon: XCircle,
  },
}

/**
 * InstallmentStatusBadge Component
 *
 * Determines the appropriate badge to display based on status and isDueSoon flag.
 * Priority: paid > overdue > due_soon > pending > draft > cancelled
 *
 * The "due soon" flag is a computed state for pending installments,
 * not a distinct status in the database.
 *
 * @example
 * ```tsx
 * <InstallmentStatusBadge status="pending" />
 * <InstallmentStatusBadge status="pending" isDueSoon={true} daysUntilDue={3} />
 * <InstallmentStatusBadge status="overdue" />
 * <InstallmentStatusBadge status="paid" />
 * ```
 */
export function InstallmentStatusBadge({
  status,
  isDueSoon = false,
  daysUntilDue,
  showIcon = true,
  className,
}: InstallmentStatusBadgeProps) {
  // Determine effective status for display
  // If status is 'pending' AND isDueSoon = true, show 'due_soon' badge
  const displayStatus = status === 'pending' && isDueSoon ? 'due_soon' : status
  const config = statusConfig[displayStatus]

  const IconComponent = config.icon

  return (
    <Badge variant={config.variant} className={className}>
      <span className="inline-flex items-center gap-1">
        {showIcon && IconComponent && <IconComponent className="w-3.5 h-3.5" />}
        {config.label}
        {displayStatus === 'due_soon' && daysUntilDue !== undefined && (
          <span className="ml-0.5">({daysUntilDue}d)</span>
        )}
      </span>
    </Badge>
  )
}

/**
 * Helper function to get status label
 */
export function getInstallmentStatusLabel(
  status: InstallmentStatus,
  isDueSoon: boolean = false
): string {
  const displayStatus = status === 'pending' && isDueSoon ? 'due_soon' : status
  return statusConfig[displayStatus].label
}

/**
 * Helper function to get all valid installment statuses
 */
export function getAllInstallmentStatuses(): InstallmentStatus[] {
  return ['draft', 'pending', 'partial', 'paid', 'overdue', 'cancelled']
}
