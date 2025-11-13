'use client'

/**
 * Activity Panel Component
 *
 * Displays activity feed for the college with time filter and search.
 * Shows recent activities in chronological order.
 *
 * Epic 3: Entities Domain
 * Story 3.1: College Registry
 * Task 13: College Detail Page Layout
 */

import { useEffect, useState } from 'react'

interface Activity {
  id: string
  action: string
  description: string
  created_at: string
  user?: {
    full_name: string
  }
}

interface ActivityPanelProps {
  collegeId: string
}

export function ActivityPanel({ collegeId }: ActivityPanelProps) {
  const [activities, setActivities] = useState<Activity[]>([])
  const [loading, setLoading] = useState(true)
  const [timeFilter, setTimeFilter] = useState('30')
  const [searchQuery, setSearchQuery] = useState('')

  useEffect(() => {
    async function fetchActivity() {
      try {
        const params = new URLSearchParams({
          days: timeFilter,
          ...(searchQuery && { search: searchQuery }),
        })
        const response = await fetch(
          `/api/colleges/${collegeId}/activity?${params}`
        )
        if (response.ok) {
          const result = await response.json()
          setActivities(result.data || [])
        }
      } catch (error) {
        console.error('Failed to fetch activity:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchActivity()
  }, [collegeId, timeFilter, searchQuery])

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMs / 3600000)
    const diffDays = Math.floor(diffMs / 86400000)

    if (diffMins < 1) return 'Just now'
    if (diffMins < 60) return `${diffMins}m ago`
    if (diffHours < 24) return `${diffHours}h ago`
    if (diffDays < 7) return `${diffDays}d ago`
    return date.toLocaleDateString()
  }

  return (
    <div className="bg-card rounded-lg border p-6 h-fit sticky top-6">
      <h2 className="text-xl font-semibold mb-4">Activity</h2>

      {/* Time Filter */}
      <div className="mb-4">
        <select
          value={timeFilter}
          onChange={(e) => setTimeFilter(e.target.value)}
          className="w-full px-3 py-2 border rounded-md bg-background text-sm"
        >
          <option value="7">Last 7 days</option>
          <option value="30">Last 30 days</option>
          <option value="90">Last 90 days</option>
          <option value="365">Last year</option>
        </select>
      </div>

      {/* Search */}
      <div className="mb-4">
        <input
          type="text"
          placeholder="Search activity..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full px-3 py-2 border rounded-md bg-background text-sm"
        />
      </div>

      {/* Activity List */}
      {loading ? (
        <p className="text-sm text-muted-foreground">Loading activity...</p>
      ) : activities.length === 0 ? (
        <p className="text-sm text-muted-foreground">No recent activity.</p>
      ) : (
        <div className="space-y-3 max-h-96 overflow-y-auto">
          {activities.map((activity) => (
            <div
              key={activity.id}
              className="text-sm border-b pb-2 last:border-b-0"
            >
              <div className="font-medium">{activity.description}</div>
              <div className="text-xs text-muted-foreground mt-1">
                {formatDate(activity.created_at)}
                {activity.user && ` • ${activity.user.full_name}`}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
