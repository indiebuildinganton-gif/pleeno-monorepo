/**
 * ActivityFeed Component
 *
 * Displays a feed of recent activities in the system
 * Epic 6: Agency Dashboard
 * Story 6.4: Recent Activity Feed
 * Task 4: Create ActivityFeed Component
 */

'use client'

import { useQuery } from '@tanstack/react-query'
import { ActivityCard } from './ActivityCard'
import { ActivityFeedSkeleton } from './ActivityFeedSkeleton'
import { ActivityFeedError } from './ActivityFeedError'
import { ActivityFeedEmpty } from './ActivityFeedEmpty'

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
 * ActivityFeed Component
 *
 * Fetches and displays recent activities using TanStack Query:
 * - Loading: Shows skeleton loader
 * - Error: Shows error message with retry button
 * - Empty: Shows "No recent activity" message
 * - Success: Renders ActivityCard for each activity
 *
 * Features:
 * - Fetches up to 20 most recent activities
 * - 1-minute stale time for caching
 * - Displays chronologically (most recent first)
 * - "View More" button for future expansion
 */
export function ActivityFeed() {
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['activities'],
    queryFn: async () => {
      const res = await fetch('/api/activity-log?limit=20')
      if (!res.ok) throw new Error('Failed to fetch activities')
      const json = await res.json()
      return json.data as Activity[]
    },
    staleTime: 60000, // 1 minute
  })

  if (isLoading) return <ActivityFeedSkeleton />
  if (error) return <ActivityFeedError onRetry={() => refetch()} />
  if (!data || data.length === 0) return <ActivityFeedEmpty />

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold">Recent Activity</h2>
      <div className="space-y-2">
        {data.map((activity) => (
          <ActivityCard key={activity.id} activity={activity} />
        ))}
      </div>
      <button
        className="w-full py-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
        disabled
      >
        View More (Coming Soon)
      </button>
    </div>
  )
}
