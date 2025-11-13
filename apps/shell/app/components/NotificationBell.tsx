/**
 * NotificationBell Component
 *
 * Displays a bell icon with unread notification count badge in the header.
 * Toggles a dropdown showing recent notifications on click.
 * Auto-refreshes notification count every 60 seconds.
 *
 * Epic 5: Intelligent Status Automation & Notifications
 * Story 5.3: Overdue Payment Alerts - Task 3
 */

'use client'

import { Bell } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { useState } from 'react'
import { NotificationDropdown } from './NotificationDropdown'
import type { NotificationListResponse } from '@/types/notifications'

export function NotificationBell() {
  const [isOpen, setIsOpen] = useState(false)

  // Fetch unread notifications with auto-refresh every 60 seconds
  const { data: notificationsResponse } = useQuery<NotificationListResponse>({
    queryKey: ['notifications', 'unread'],
    queryFn: async () => {
      const res = await fetch('/api/notifications?is_read=false&limit=100')
      if (!res.ok) {
        throw new Error('Failed to fetch notifications')
      }
      return res.json()
    },
    refetchInterval: 60000, // Poll every 60 seconds
  })

  const notifications = notificationsResponse?.data || []
  const unreadCount = notifications.length

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 hover:bg-gray-100 rounded-full transition-colors"
        aria-label="Notifications"
        aria-expanded={isOpen}
      >
        <Bell className="h-5 w-5 text-gray-600" />
        {unreadCount > 0 && (
          <span className="absolute top-0 right-0 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-white transform translate-x-1/2 -translate-y-1/2 bg-red-600 rounded-full min-w-[20px]">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <NotificationDropdown notifications={notifications} onClose={() => setIsOpen(false)} />
      )}
    </div>
  )
}
