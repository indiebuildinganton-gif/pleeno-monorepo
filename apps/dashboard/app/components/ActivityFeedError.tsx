/**
 * ActivityFeedError Component
 *
 * Error state display for the ActivityFeed
 * Epic 6: Agency Dashboard
 * Story 6.4: Recent Activity Feed
 * Task 4: Create ActivityFeed Component
 */

interface Props {
  onRetry: () => void
}

/**
 * ActivityFeedError Component
 *
 * Displays error message with retry button when activity fetch fails
 */
export function ActivityFeedError({ onRetry }: Props) {
  return (
    <div className="space-y-4 text-center py-8">
      <p className="text-sm text-muted-foreground">
        Unable to load recent activity
      </p>
      <button
        onClick={onRetry}
        className="px-4 py-2 text-sm bg-primary text-primary-foreground rounded hover:bg-primary/90"
      >
        Retry
      </button>
    </div>
  )
}
