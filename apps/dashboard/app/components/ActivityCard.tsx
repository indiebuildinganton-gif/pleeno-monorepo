/**
 * ActivityCard Component
 *
 * Displays a single activity item with icon, description, user, and timestamp
 * Epic 6: Agency Dashboard
 * Story 6.4: Recent Activity Feed
 * Task 4: Create ActivityFeed Component
 */

'use client'

import { formatDistanceToNow } from 'date-fns'

interface Activity {
  id: string
  timestamp: string
  action: string
  description: string
  user: { id: string; name: string; email: string } | null
  entity_type: string
  entity_id: string
  metadata: Record<string, any>
}

/**
 * Get the appropriate icon for an activity based on entity type
 */
function getActivityIcon(entityType: string): string {
  const icons: Record<string, string> = {
    payment: '💰',
    payment_plan: '📋',
    student: '👤',
    enrollment: '🏫',
    installment: '⚠️',
  }
  return icons[entityType] || '📝'
}

/**
 * ActivityCard Component
 *
 * Displays a single activity with:
 * - Icon based on entity type
 * - Description of the action
 * - User name (or "System" if null)
 * - Relative timestamp (e.g., "2 hours ago")
 */
export function ActivityCard({ activity }: { activity: Activity }) {
  const icon = getActivityIcon(activity.entity_type)
  const relativeTime = formatDistanceToNow(new Date(activity.timestamp), {
    addSuffix: true,
  })
  const userName = activity.user?.name || 'System'

  return (
    <div className="flex items-start gap-3 p-3 rounded-lg border hover:bg-muted transition-colors">
      <div className="text-2xl flex-shrink-0">{icon}</div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium">{activity.description}</p>
        <p className="text-xs text-muted-foreground mt-1">
          {userName} · {relativeTime}
        </p>
      </div>
    </div>
  )
}
