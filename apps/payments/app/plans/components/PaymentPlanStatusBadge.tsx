/**
 * PaymentPlanStatusBadge Component
 *
 * Displays payment plan status with color-coded badges:
 * - active: green (payment plan is currently active)
 * - completed: gray (all installments paid)
 * - cancelled: red (payment plan cancelled)
 *
 * Epic 4: Payments Domain
 * Story 4.3: Payment Plan List and Detail Views
 * Task 3: Payment Plans List Page
 */

'use client'

import { Badge } from '@pleeno/ui'
import { CheckCircle, XCircle, Clock } from 'lucide-react'

export type PaymentPlanStatus = 'active' | 'completed' | 'cancelled'

export interface PaymentPlanStatusBadgeProps {
  /**
   * The payment plan status from the database
   */
  status: PaymentPlanStatus

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
  active: {
    variant: 'success' as const,
    label: 'Active',
    icon: Clock,
  },
  completed: {
    variant: 'gray' as const,
    label: 'Completed',
    icon: CheckCircle,
  },
  cancelled: {
    variant: 'destructive' as const,
    label: 'Cancelled',
    icon: XCircle,
  },
}

/**
 * PaymentPlanStatusBadge Component
 *
 * Displays the appropriate badge based on payment plan status.
 *
 * @example
 * ```tsx
 * <PaymentPlanStatusBadge status="active" />
 * <PaymentPlanStatusBadge status="completed" />
 * <PaymentPlanStatusBadge status="cancelled" />
 * ```
 */
export function PaymentPlanStatusBadge({
  status,
  showIcon = true,
  className,
}: PaymentPlanStatusBadgeProps) {
  const config = statusConfig[status]
  const IconComponent = config.icon

  return (
    <Badge variant={config.variant} className={className}>
      <span className="inline-flex items-center gap-1">
        {showIcon && IconComponent && <IconComponent className="w-3.5 h-3.5" />}
        {config.label}
      </span>
    </Badge>
  )
}

/**
 * Helper function to get status label
 */
export function getPaymentPlanStatusLabel(status: PaymentPlanStatus): string {
  return statusConfig[status].label
}

/**
 * Helper function to get all valid payment plan statuses
 */
export function getAllPaymentPlanStatuses(): PaymentPlanStatus[] {
  return ['active', 'completed', 'cancelled']
}
