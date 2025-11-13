/**
 * DueSoonBadge Component
 *
 * Displays a warning badge for payments that are due soon.
 * Uses yellow/amber color coding to differentiate from overdue (red) and paid (green) statuses.
 *
 * Epic 5: Intelligent Status Automation
 * Story 5.2: Due Soon Notification Flags
 * Task 2: Update UI to display "due soon" badges
 */

'use client'

import { Badge } from '@pleeno/ui'
import { Clock } from 'lucide-react'

export interface DueSoonBadgeProps {
  /**
   * Number of days until the payment is due
   * Optional - if provided, displays the countdown
   */
  daysUntilDue?: number

  /**
   * Size of the badge
   * @default 'md'
   */
  size?: 'sm' | 'md' | 'lg'

  /**
   * Additional CSS classes
   */
  className?: string

  /**
   * Show icon
   * @default true
   */
  showIcon?: boolean
}

/**
 * DueSoonBadge Component
 *
 * Displays a yellow/amber warning badge to indicate payments due soon.
 *
 * @example
 * ```tsx
 * <DueSoonBadge daysUntilDue={3} />
 * <DueSoonBadge size="sm" showIcon={false} />
 * ```
 */
export function DueSoonBadge({
  daysUntilDue,
  size = 'md',
  className,
  showIcon = true
}: DueSoonBadgeProps) {
  const sizeClasses = {
    sm: 'text-xs px-2 py-0.5',
    md: 'text-sm px-2.5 py-0.5',
    lg: 'text-base px-3 py-1',
  }

  const iconSizes = {
    sm: 'w-3 h-3',
    md: 'w-3.5 h-3.5',
    lg: 'w-4 h-4',
  }

  return (
    <Badge
      variant="warning"
      className={`${sizeClasses[size]} ${className || ''}`}
    >
      {showIcon && <Clock className={`${iconSizes[size]} mr-1`} />}
      Due Soon
      {daysUntilDue !== undefined && ` (${daysUntilDue}d)`}
    </Badge>
  )
}

/**
 * Helper function to determine if a badge should be shown
 * Uses the isDueSoon utility from date-helpers
 */
export function shouldShowDueSoonBadge(
  dueDate: Date | string,
  thresholdDays: number = 4,
  timezone: string = 'UTC'
): boolean {
  // Import will be resolved at runtime
  const { isDueSoon } = require('@pleeno/utils/date-helpers')
  return isDueSoon(dueDate, thresholdDays, timezone)
}
