/**
 * ActivityFeedSkeleton Component
 *
 * Loading state skeleton for the ActivityFeed
 * Epic 6: Agency Dashboard
 * Story 6.4: Recent Activity Feed
 * Task 4: Create ActivityFeed Component
 */

/**
 * ActivityFeedSkeleton Component
 *
 * Displays placeholder cards while activities are loading
 * Shows 4 skeleton cards with pulsing animation
 */
export function ActivityFeedSkeleton() {
  return (
    <div className="space-y-4">
      <div className="h-6 w-32 bg-muted animate-pulse rounded" />
      <div className="space-y-2">
        {[...Array(4)].map((_, i) => (
          <div
            key={i}
            className="flex items-start gap-3 p-3 rounded-lg border"
          >
            <div className="w-8 h-8 bg-muted animate-pulse rounded" />
            <div className="flex-1 space-y-2">
              <div className="h-4 bg-muted animate-pulse rounded w-3/4" />
              <div className="h-3 bg-muted animate-pulse rounded w-1/2" />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
