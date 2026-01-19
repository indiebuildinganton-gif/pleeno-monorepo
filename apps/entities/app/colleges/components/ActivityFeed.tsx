/**
 * Activity Feed Component
 *
 * Displays activity timeline for colleges with chronological display,
 * time period filtering, search functionality, and auto-refresh capabilities.
 *
 * Epic 3: Entities Domain
 * Story 3.1: College Registry
 * Task 17: Create Activity Feed Component
 *
 * Features:
 * - Chronological display (newest first)
 * - Event type badges (Update, Branch, Contact, Note)
 * - Time period filter (Last 7/30/60/90 days, All time)
 * - Search with 300ms debounce
 * - Auto-refresh on filter/search change
 * - Relative timestamps ("10 days ago")
 * - User attribution for each activity
 * - Field update formatting: "Field: old → new"
 *
 * Acceptance Criteria (AC 14-16):
 * - Activity displays chronologically ✓
 * - Time filter works (7/30/60/90 days, All time) ✓
 * - Search with debounce works (300ms) ✓
 * - Shows user attribution ✓
 * - Auto-refreshes on filter change ✓
 */

'use client'

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { getApiUrl } from '@/hooks/useApiUrl'
import { RefreshCw, Search } from 'lucide-react'
import { Button } from '@pleeno/ui/components/ui/button'
import { Input } from '@pleeno/ui/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@pleeno/ui/components/ui/select'
import { getRelativeTime } from '@pleeno/utils'
import { cn } from '@pleeno/ui/lib/utils'
import { useDebounce } from '../../../hooks/useDebounce'

/**
 * Activity entry interface matching API response
 */
interface ActivityEntry {
  id: string
  event_type: 'Update' | 'Branch' | 'Contact' | 'Note'
  description: string
  timestamp: string
  user_id: string | null
  user_name: string | null
  old_value?: any
  new_value?: any
  action: string
  entity_type: string
}

/**
 * Time period options for filtering
 */
const TIME_PERIOD_OPTIONS = [
  { value: '7', label: 'Last 7 days' },
  { value: '30', label: 'Last 30 days' },
  { value: '60', label: 'Last 60 days' },
  { value: '90', label: 'Last 90 days' },
  { value: 'all', label: 'All time' },
] as const

type TimePeriod = typeof TIME_PERIOD_OPTIONS[number]['value']

/**
 * ActivityFeed Component Props
 */
interface ActivityFeedProps {
  /**
   * College ID to fetch activities for
   */
  collegeId: string
}

/**
 * ActivityFeed Component
 *
 * Right-side panel showing chronological timeline of all college changes.
 * Includes college updates, branch changes, contact modifications, and notes.
 */
export function ActivityFeed({ collegeId }: ActivityFeedProps) {
  const [timePeriod, setTimePeriod] = useState<TimePeriod>('30')
  const [searchTerm, setSearchTerm] = useState('')

  // Debounce search term to reduce API calls (300ms delay)
  const debouncedSearchTerm = useDebounce(searchTerm, 300)

  /**
   * Fetch activity feed with TanStack Query
   * Auto-refreshes when filters change
   */
  const {
    data: activityData,
    isLoading,
    error,
    refetch,
    isFetching,
  } = useQuery<{ data: ActivityEntry[]; meta: any }>({
    queryKey: ['college-activity', collegeId, timePeriod, debouncedSearchTerm],
    queryFn: async () => {
      const params = new URLSearchParams({
        period: timePeriod,
      })
      if (debouncedSearchTerm) {
        params.append('search', debouncedSearchTerm)
      }

      const response = await fetch(getApiUrl(`/api/colleges/${collegeId}/activity?${params.toString()}`))
      if (!response.ok) {
        throw new Error('Failed to fetch activity feed')
      }
      const result = await response.json()
      return result
    },
    // Auto-refresh every 30 seconds
    refetchInterval: 30000,
    // Refetch when window regains focus
    refetchOnWindowFocus: true,
  })

  const activities = activityData?.data || []

  /**
   * Get badge color based on event type
   */
  const getEventTypeBadgeColor = (eventType: ActivityEntry['event_type']) => {
    switch (eventType) {
      case 'Update':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
      case 'Branch':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
      case 'Contact':
        return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200'
      case 'Note':
        return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200'
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200'
    }
  }

  /**
   * Handle manual refresh
   */
  const handleRefresh = () => {
    refetch()
  }

  /**
   * Render description with highlighted "old → new" values
   * Parses the description for arrow patterns and quoted values
   */
  const renderDescription = (activity: ActivityEntry) => {
    const { description } = activity

    // Check if description contains the arrow pattern for field updates
    if (description.includes(' → ') || description.includes('" to "')) {
      // Highlight the old → new values
      return (
        <p className="text-sm text-foreground">
          {description.split(/(".*?"|→)/g).map((part, index) => {
            if (part === '→') {
              return (
                <span key={index} className="mx-1 font-semibold text-primary">
                  →
                </span>
              )
            }
            if (part.startsWith('"') && part.endsWith('"')) {
              return (
                <span key={index} className="font-medium text-foreground">
                  {part}
                </span>
              )
            }
            return <span key={index}>{part}</span>
          })}
        </p>
      )
    }

    return <p className="text-sm text-foreground">{description}</p>
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold">Activity Feed</h2>
        <Button
          variant="ghost"
          size="icon"
          onClick={handleRefresh}
          disabled={isFetching}
          title="Refresh activity feed"
        >
          <RefreshCw className={cn('h-4 w-4', isFetching && 'animate-spin')} />
        </Button>
      </div>

      {/* Filters */}
      <div className="space-y-3 mb-4">
        {/* Time Period Filter */}
        <Select value={timePeriod} onValueChange={(value) => setTimePeriod(value as TimePeriod)}>
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Select time period" />
          </SelectTrigger>
          <SelectContent>
            {TIME_PERIOD_OPTIONS.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Search Input with Debounce */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Search activity..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      {/* Activity Feed */}
      <div className="flex-1 overflow-y-auto">
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
          </div>
        ) : error ? (
          <div className="rounded-lg border border-destructive bg-destructive/10 p-4">
            <p className="text-sm text-destructive">Failed to load activity feed. Please try again.</p>
          </div>
        ) : activities.length === 0 ? (
          <div className="rounded-lg border border-dashed border-muted-foreground/25 bg-muted/20 p-6 text-center">
            <p className="text-sm text-muted-foreground">
              {searchTerm ? 'No activities found matching your search.' : 'No activity yet.'}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {activities.map((activity) => (
              <div
                key={activity.id}
                className="rounded-lg border bg-card p-4 shadow-sm hover:shadow-md transition-shadow"
              >
                <div className="space-y-2">
                  {/* Event Type Badge */}
                  <div className="flex items-center gap-2">
                    <span
                      className={cn(
                        'inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ring-1 ring-inset ring-gray-500/10',
                        getEventTypeBadgeColor(activity.event_type)
                      )}
                    >
                      {activity.event_type.toUpperCase()}
                    </span>
                  </div>

                  {/* Description with old → new formatting */}
                  {renderDescription(activity)}

                  {/* Timestamp and User Attribution */}
                  <div className="flex items-center justify-between pt-2 border-t">
                    <div className="text-xs text-muted-foreground">
                      {activity.user_name && (
                        <>
                          <span className="font-medium">By: {activity.user_name}</span>
                          <span className="mx-1">·</span>
                        </>
                      )}
                      <span>{getRelativeTime(activity.timestamp)}</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
