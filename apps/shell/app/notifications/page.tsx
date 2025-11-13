/**
 * Notifications Page
 *
 * Full page listing all notifications (read and unread).
 * Features:
 * - Filter by all/unread tabs
 * - Paginated list of notifications
 * - Click notification to navigate to linked page
 * - "Dismiss" button to mark notification as read
 * - Distinct styling for unread notifications (blue background, bold)
 *
 * Epic 5: Intelligent Status Automation & Notifications
 * Story 5.3: Overdue Payment Alerts - Task 3
 */

'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useRouter } from 'next/navigation'
import { formatDistanceToNow } from 'date-fns'
import { useState } from 'react'
import Link from 'next/link'
import { ChevronLeft } from 'lucide-react'
import type {
  Notification,
  NotificationListResponse,
  NotificationUpdateResponse,
} from '@/types/notifications'

type FilterType = 'all' | 'unread'

export default function NotificationsPage() {
  const router = useRouter()
  const queryClient = useQueryClient()
  const [filter, setFilter] = useState<FilterType>('all')

  // Fetch notifications based on filter
  const { data, isLoading } = useQuery<NotificationListResponse>({
    queryKey: ['notifications', 'list', filter],
    queryFn: async () => {
      const params = filter === 'unread' ? '?is_read=false&limit=100' : '?limit=100'
      const res = await fetch(`/api/notifications${params}`)
      if (!res.ok) {
        throw new Error('Failed to fetch notifications')
      }
      return res.json()
    },
  })

  // Mark notification as read mutation
  const markAsReadMutation = useMutation({
    mutationFn: async (notificationId: string) => {
      const res = await fetch(`/api/notifications/${notificationId}/mark-read`, {
        method: 'PATCH',
      })
      if (!res.ok) {
        throw new Error('Failed to mark notification as read')
      }
      return res.json() as Promise<NotificationUpdateResponse>
    },
    onSuccess: () => {
      // Invalidate all notification queries to refresh the list
      queryClient.invalidateQueries({ queryKey: ['notifications'] })
    },
  })

  // Handle clicking a notification
  const handleNotificationClick = (notification: Notification) => {
    // Mark as read if unread
    if (!notification.is_read) {
      markAsReadMutation.mutate(notification.id)
    }

    // Navigate to link if present
    if (notification.link) {
      router.push(notification.link)
    }
  }

  // Handle "Dismiss" button click
  const handleDismiss = (e: React.MouseEvent, notificationId: string) => {
    e.stopPropagation() // Prevent triggering notification click
    markAsReadMutation.mutate(notificationId)
  }

  const notifications = data?.data || []

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Breadcrumb */}
        <div className="mb-6">
          <Link
            href="/dashboard"
            className="inline-flex items-center text-sm text-gray-600 hover:text-gray-900 transition-colors"
          >
            <ChevronLeft className="h-4 w-4 mr-1" />
            Back to Dashboard
          </Link>
        </div>

        {/* Header with Filter Tabs */}
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-bold text-gray-900">Notifications</h1>

          {/* Filter tabs */}
          <div className="flex gap-2">
            <button
              onClick={() => setFilter('all')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                filter === 'all'
                  ? 'bg-blue-600 text-white'
                  : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'
              }`}
            >
              All
            </button>
            <button
              onClick={() => setFilter('unread')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                filter === 'unread'
                  ? 'bg-blue-600 text-white'
                  : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'
              }`}
            >
              Unread
            </button>
          </div>
        </div>

        {/* Notifications List */}
        {isLoading ? (
          <div className="text-center py-12">
            <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-blue-600 border-r-transparent"></div>
            <p className="mt-4 text-gray-600">Loading notifications...</p>
          </div>
        ) : notifications.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-lg shadow-sm border border-gray-200">
            <p className="text-gray-500">
              {filter === 'unread' ? 'No unread notifications' : 'No notifications to display'}
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {notifications.map((notification) => (
              <div
                key={notification.id}
                onClick={() => handleNotificationClick(notification)}
                className={`p-4 rounded-lg border cursor-pointer hover:shadow-md transition-all ${
                  !notification.is_read
                    ? 'bg-blue-50 border-blue-200 font-semibold'
                    : 'bg-white border-gray-200'
                }`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <p className="text-sm text-gray-800">{notification.message}</p>
                    <div className="flex items-center gap-4 mt-2">
                      <span className="text-xs text-gray-500">
                        {formatDistanceToNow(new Date(notification.created_at), {
                          addSuffix: true,
                        })}
                      </span>
                      {notification.type && (
                        <span className="text-xs px-2 py-1 bg-gray-100 text-gray-600 rounded">
                          {notification.type.replace('_', ' ')}
                        </span>
                      )}
                    </div>
                  </div>

                  {!notification.is_read && (
                    <button
                      onClick={(e) => handleDismiss(e, notification.id)}
                      className="text-xs text-blue-600 hover:text-blue-800 font-medium transition-colors px-3 py-1 hover:bg-blue-100 rounded"
                    >
                      Dismiss
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Pagination Info */}
        {data && data.pagination.total > 0 && (
          <div className="mt-6 text-center text-sm text-gray-600">
            Showing {data.data.length} of {data.pagination.total} notification
            {data.pagination.total === 1 ? '' : 's'}
          </div>
        )}
      </div>
    </div>
  )
}
