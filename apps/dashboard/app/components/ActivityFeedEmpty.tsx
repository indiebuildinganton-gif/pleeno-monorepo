/**
 * ActivityFeedEmpty Component
 *
 * Empty state display for the ActivityFeed
 * Epic 6: Agency Dashboard
 * Story 6.4: Recent Activity Feed
 * Task 4: Create ActivityFeed Component
 */

/**
 * ActivityFeedEmpty Component
 *
 * Displays friendly empty state when no activities exist
 */
export function ActivityFeedEmpty() {
  return (
    <div className="space-y-4 text-center py-8">
      <div className="text-4xl">📭</div>
      <div>
        <p className="text-sm font-medium">No recent activity</p>
        <p className="text-xs text-muted-foreground mt-1">
          Activity will appear here as your team works
        </p>
      </div>
    </div>
  )
}
