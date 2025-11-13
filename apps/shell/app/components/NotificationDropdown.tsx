/**
 * NotificationDropdown Component
 *
 * Dropdown showing recent notifications (max 10).
 * Features:
 * - Click notification to navigate to linked page
 * - "Mark as read" button per notification with optimistic UI update
 * - Relative timestamps ("2 hours ago")
 * - Distinct styling for unread notifications (bold, blue background)
 * - "View all notifications" link to full page
 *
 * Epic 5: Intelligent Status Automation & Notifications
 * Story 5.3: Overdue Payment Alerts - Task 3
 */

'use client'

import { useRouter } from 'next/navigation'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { formatDistanceToNow } from 'date-fns'
import { X } from 'lucide-react'
import type { Notification, NotificationUpdateResponse } from '@/types/notifications'
import { useEffect, useRef } from 'react'

interface Props {
  notifications: Notification[]
  onClose: () => void
}

export function NotificationDropdown({ notifications, onClose }: Props) {
  const router = useRouter()
  const queryClient = useQueryClient()
  const dropdownRef = useRef<HTMLDivElement>(null)

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
      // Invalidate queries to refresh notification count
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

    onClose()
  }

  // Handle "Mark as read" button click
  const handleMarkAsRead = (e: React.MouseEvent, notificationId: string) => {
    e.stopPropagation() // Prevent triggering notification click
    markAsReadMutation.mutate(notificationId)
  }

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        onClose()
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [onClose])

  // Show only the most recent 10 notifications
  const recentNotifications = notifications.slice(0, 10)

  return (
    <div
      ref={dropdownRef}
      className="absolute right-0 mt-2 w-96 bg-white rounded-lg shadow-lg border border-gray-200 z-50"
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900">Notifications</h3>
        <button
          onClick={onClose}
          className="text-gray-400 hover:text-gray-600 transition-colors"
          aria-label="Close notifications"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      {/* Notification List */}
      <div className="max-h-96 overflow-y-auto">
        {recentNotifications.length === 0 ? (
          <div className="px-4 py-8 text-center text-gray-500">No notifications</div>
        ) : (
          recentNotifications.map((notification) => (
            <div
              key={notification.id}
              onClick={() => handleNotificationClick(notification)}
              className={`px-4 py-3 border-b border-gray-200 last:border-b-0 hover:bg-gray-50 cursor-pointer transition-colors ${
                !notification.is_read ? 'bg-blue-50 font-semibold' : ''
              }`}
            >
              <p className="text-sm text-gray-800">{notification.message}</p>
              <div className="flex items-center justify-between mt-1">
                <span className="text-xs text-gray-500">
                  {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true })}
                </span>
                {!notification.is_read && (
                  <button
                    onClick={(e) => handleMarkAsRead(e, notification.id)}
                    className="text-xs text-blue-600 hover:text-blue-800 transition-colors"
                  >
                    Mark as read
                  </button>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Footer - View All Link */}
      <div className="px-4 py-3 border-t border-gray-200 bg-gray-50">
        <a
          href="/notifications"
          className="text-sm text-blue-600 hover:text-blue-800 font-medium transition-colors"
          onClick={onClose}
        >
          View all notifications →
        </a>
      </div>
    </div>
  )
}
