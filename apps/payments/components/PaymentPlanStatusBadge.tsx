'use client'

import { Badge, cn } from '@pleeno/ui'

export type PaymentPlanStatus = 'active' | 'completed' | 'cancelled'

interface PaymentPlanStatusBadgeProps {
  status: PaymentPlanStatus
  className?: string
}

const statusConfig = {
  active: {
    label: 'Active',
    variant: 'blue' as const,
    className: '',
  },
  completed: {
    label: 'Completed',
    variant: 'success' as const,
    className: '',
  },
  cancelled: {
    label: 'Cancelled',
    variant: 'destructive' as const,
    className: '',
  },
}

export function PaymentPlanStatusBadge({
  status,
  className,
}: PaymentPlanStatusBadgeProps) {
  const config = statusConfig[status]

  return (
    <Badge variant={config.variant} className={cn(config.className, className)}>
      {config.label}
    </Badge>
  )
}

/**
 * Helper function to get status label
 */
export function getStatusLabel(status: PaymentPlanStatus): string {
  return statusConfig[status].label
}

/**
 * Helper function to get all valid statuses
 */
export function getAllStatuses(): PaymentPlanStatus[] {
  return ['active', 'completed', 'cancelled']
}
