/**
 * ContractExpirationBadge Component
 *
 * Story 7.1: Payment Plans Report Generator with Contract Expiration Tracking
 * Task 4: Create Report Results Table Component
 *
 * Displays a badge indicating contract expiration urgency with color-coding:
 * - Red (destructive): Expired contracts
 * - Orange: Expires within 7 days
 * - Yellow (warning): Expires within 30 days
 * - Gray (outline): Active contracts (30+ days)
 */

import { Badge } from '@pleeno/ui/components/ui/badge'

interface ContractExpirationBadgeProps {
  days: number
}

export function ContractExpirationBadge({ days }: ContractExpirationBadgeProps) {
  // Expired contracts (negative days)
  if (days < 0) {
    return (
      <Badge variant="destructive">
        Expired {Math.abs(days)} days ago
      </Badge>
    )
  }

  // Expiring within 7 days (critical)
  if (days < 7) {
    return (
      <Badge variant="destructive" className="bg-orange-600 hover:bg-orange-700">
        {days} {days === 1 ? 'day' : 'days'} left
      </Badge>
    )
  }

  // Expiring within 30 days (warning)
  if (days < 30) {
    return (
      <Badge variant="warning" className="bg-yellow-600 hover:bg-yellow-700">
        {days} days left
      </Badge>
    )
  }

  // Active contracts (30+ days)
  return (
    <Badge variant="outline">
      {days} days left
    </Badge>
  )
}
