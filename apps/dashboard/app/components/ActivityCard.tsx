/**
 * ActivityCard Component
 *
 * Displays a single activity item with icon, description, user, and timestamp
 * Epic 6: Agency Dashboard
 * Story 6.4: Recent Activity Feed
 * Task 4: Create ActivityFeed Component
 * Task 6: Make Activities Clickable
 */

'use client'

import { formatDistanceToNow } from 'date-fns'
import Link from 'next/link'

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
 * Determine the navigation URL based on activity type and metadata
 *
 * Navigation mapping:
 * - payment → /payments/plans/[plan_id] (from metadata)
 * - payment_plan → /payments/plans/[entity_id]
 * - student → /entities/students/[entity_id]
 * - enrollment → /entities/students/[student_id]?tab=enrollments (from metadata)
 * - installment → /payments/plans/[plan_id] (from metadata)
 * - default → /dashboard (fallback)
 */
function getActivityLink(activity: Activity): string {
  const { entity_type, entity_id, metadata = {} } = activity

  switch (entity_type) {
    case 'payment':
    case 'installment':
      // Both navigate to the payment plan page
      if (!metadata.payment_plan_id) {
        console.warn(
          `Missing payment_plan_id in ${entity_type} activity metadata:`,
          activity.id
        )
        return '/dashboard'
      }
      return `/payments/plans/${metadata.payment_plan_id}`

    case 'payment_plan':
      return `/payments/plans/${entity_id}`

    case 'student':
      return `/entities/students/${entity_id}`

    case 'enrollment':
      // Navigate to student page with enrollments tab
      if (!metadata.student_id) {
        console.warn(
          'Missing student_id in enrollment activity metadata:',
          activity.id
        )
        return '/dashboard'
      }
      return `/entities/students/${metadata.student_id}?tab=enrollments`

    default:
      return '/dashboard'
  }
}

/**
 * ActivityCard Component
 *
 * Displays a single activity with:
 * - Icon based on entity type
 * - Description of the action
 * - User name (or "System" if null)
 * - Relative timestamp (e.g., "2 hours ago")
 * - Clickable navigation to related entity page
 * - Hover effects to indicate interactivity
 */
export function ActivityCard({ activity }: { activity: Activity }) {
  const icon = getActivityIcon(activity.entity_type)
  const relativeTime = formatDistanceToNow(new Date(activity.timestamp), {
    addSuffix: true,
  })
  const userName = activity.user?.name || 'System'
  const href = getActivityLink(activity)

  return (
    <Link
      href={href}
      className="block p-3 rounded-lg border hover:bg-muted hover:border-primary/50 transition-all cursor-pointer group"
      title="Click to view details"
    >
      <div className="flex items-start gap-3">
        <div className="text-2xl flex-shrink-0 transition-transform group-hover:scale-110">
          {icon}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium group-hover:text-primary transition-colors">
            {activity.description}
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            {userName} · {relativeTime}
          </p>
        </div>
      </div>
    </Link>
  )
}
