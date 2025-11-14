/**
 * ActivityFeed Component
 *
 * Displays a feed of recent activities in the system
 * Epic 6: Agency Dashboard
 * Story 6.4: Recent Activity Feed
 * Task 4: Create ActivityFeed Component
 * Task 5: Implement Auto-Refresh for Real-Time Feel
 */

'use client'

import { useQuery } from '@tanstack/react-query'
import { useEffect, useRef, useState } from 'react'
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
 * - Auto-refreshes every 60 seconds (Task 5)
 * - Refreshes when user returns to tab (Task 5)
 * - Shows "New Activity" badge when fresh data arrives (Task 5)
 * - Displays chronologically (most recent first)
 * - "View More" button for future expansion
 *
 * TODO: Future Enhancement - Real-Time Updates (Task 5)
 * Consider implementing WebSocket/Supabase Realtime subscriptions for true real-time updates.
 * Current polling approach (60s refresh) is sufficient for MVP.
 * WebSocket would eliminate polling overhead and provide instant updates.
 * See: https://supabase.com/docs/guides/realtime
 */
export function ActivityFeed() {
  const { data, isLoading, error, refetch, dataUpdatedAt } = useQuery({
    queryKey: ['activities'],
    queryFn: async () => {
      const res = await fetch('/api/activity-log?limit=20')
      if (!res.ok) throw new Error('Failed to fetch activities')
      const json = await res.json()
      return json.data as Activity[]
    },
    staleTime: 60000, // 1 minute
    refetchInterval: 60000, // Auto-refresh every 60 seconds
    refetchOnWindowFocus: true, // Refetch when user returns to tab
    refetchOnReconnect: true, // Refetch when network reconnects
    refetchIntervalInBackground: false, // Don't refetch when tab is not visible
  })

  // Track when new activities arrive and show badge
  const [showNewBadge, setShowNewBadge] = useState(false)
  const prevDataUpdatedAt = useRef(dataUpdatedAt)

  useEffect(() => {
    if (prevDataUpdatedAt.current && dataUpdatedAt > prevDataUpdatedAt.current) {
      setShowNewBadge(true)
      setTimeout(() => setShowNewBadge(false), 3000) // Hide after 3 seconds
    }
    prevDataUpdatedAt.current = dataUpdatedAt
  }, [dataUpdatedAt])

  if (isLoading) return <ActivityFeedSkeleton />
  if (error) return <ActivityFeedError onRetry={() => refetch()} />
  if (!data || data.length === 0) return <ActivityFeedEmpty />

  return (
    <div className="space-y-4" data-testid="activity-feed">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Recent Activity</h2>
        {showNewBadge && (
          <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full animate-pulse">
            New Activity
          </span>
        )}
      </div>
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
