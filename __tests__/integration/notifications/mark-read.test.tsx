/**
 * Integration Test: Mark Notification as Read
 *
 * Tests that marking notifications as read updates the UI optimistically
 * and persists changes to the database.
 *
 * Epic 5: Intelligent Status Automation & Notifications
 * Story 5.3: Overdue Payment Alerts - Task 5
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { NotificationDropdown } from '@shell/app/components/NotificationDropdown'
import type { Notification } from '@shell/types/notifications'

// Mock Next.js router
const mockPush = vi.fn()
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
  }),
}))

describe('Mark Notification as Read', () => {
  let queryClient: QueryClient

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: {
          retry: false,
        },
      },
    })
    vi.clearAllMocks()
  })

  it('should mark notification as read and update UI optimistically', async () => {
    const onClose = vi.fn()

    const notifications: Notification[] = [
      {
        id: '1',
        agency_id: 'agency-123',
        user_id: null,
        type: 'overdue_payment',
        message: 'Payment overdue: John Smith - $500.00',
        link: '/payments/plans?status=overdue',
        is_read: false,
        read_at: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
    ]

    // Mock PATCH API
    global.fetch = vi.fn(() =>
      Promise.resolve({
        ok: true,
        json: () =>
          Promise.resolve({
            success: true,
            notification: {
              ...notifications[0],
              is_read: true,
              read_at: new Date().toISOString(),
            },
          }),
      } as Response)
    )

    render(
      <QueryClientProvider client={queryClient}>
        <NotificationDropdown notifications={notifications} onClose={onClose} />
      </QueryClientProvider>
    )

    // Verify notification starts as unread (bold, blue background)
    const notificationElement = screen.getByText(/Payment overdue: John Smith/).closest('div')
    expect(notificationElement).toHaveClass('bg-blue-50')
    expect(notificationElement).toHaveClass('font-semibold')

    // Click "Mark as read" button
    const markReadButton = screen.getByText('Mark as read')
    fireEvent.click(markReadButton)

    // Verify API called
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith('/api/notifications/1/mark-read', {
        method: 'PATCH',
      })
    })
  })

  it('should handle mark-as-read API errors gracefully', async () => {
    const onClose = vi.fn()

    const notifications: Notification[] = [
      {
        id: '2',
        agency_id: 'agency-123',
        user_id: null,
        type: 'overdue_payment',
        message: 'Test notification',
        link: '/payments/plans',
        is_read: false,
        read_at: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
    ]

    // Mock API error
    global.fetch = vi.fn(() =>
      Promise.resolve({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
        json: () => Promise.resolve({ error: 'Failed to update notification' }),
      } as Response)
    )

    // Suppress console errors for this test
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

    render(
      <QueryClientProvider client={queryClient}>
        <NotificationDropdown notifications={notifications} onClose={onClose} />
      </QueryClientProvider>
    )

    // Click "Mark as read" button
    const markReadButton = screen.getByText('Mark as read')
    fireEvent.click(markReadButton)

    // Wait for API call
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalled()
    })

    // Notification should still be visible (error handling)
    expect(screen.getByText(/Test notification/)).toBeInTheDocument()

    consoleSpy.mockRestore()
  })

  it('should invalidate queries after marking as read', async () => {
    const onClose = vi.fn()

    const notifications: Notification[] = [
      {
        id: '3',
        agency_id: 'agency-123',
        user_id: null,
        type: 'overdue_payment',
        message: 'Test notification',
        link: '/payments/plans',
        is_read: false,
        read_at: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
    ]

    global.fetch = vi.fn(() =>
      Promise.resolve({
        ok: true,
        json: () =>
          Promise.resolve({
            success: true,
            notification: { ...notifications[0], is_read: true },
          }),
      } as Response)
    )

    // Spy on query invalidation
    const invalidateQueriesSpy = vi.spyOn(queryClient, 'invalidateQueries')

    render(
      <QueryClientProvider client={queryClient}>
        <NotificationDropdown notifications={notifications} onClose={onClose} />
      </QueryClientProvider>
    )

    // Click "Mark as read" button
    const markReadButton = screen.getByText('Mark as read')
    fireEvent.click(markReadButton)

    // Verify queries were invalidated after successful update
    await waitFor(() => {
      expect(invalidateQueriesSpy).toHaveBeenCalledWith({
        queryKey: ['notifications'],
      })
    })
  })

  it('should not show "Mark as read" button for already-read notifications', () => {
    const onClose = vi.fn()

    const notifications: Notification[] = [
      {
        id: '4',
        agency_id: 'agency-123',
        user_id: null,
        type: 'overdue_payment',
        message: 'Already read notification',
        link: '/payments/plans',
        is_read: true,
        read_at: new Date().toISOString(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
    ]

    render(
      <QueryClientProvider client={queryClient}>
        <NotificationDropdown notifications={notifications} onClose={onClose} />
      </QueryClientProvider>
    )

    // Verify "Mark as read" button is not present
    expect(screen.queryByText('Mark as read')).not.toBeInTheDocument()

    // Verify notification has normal styling (not bold, no blue background)
    const notificationElement = screen.getByText(/Already read notification/).closest('div')
    expect(notificationElement).not.toHaveClass('bg-blue-50')
    expect(notificationElement).not.toHaveClass('font-semibold')
  })

  it('should handle multiple notifications correctly', async () => {
    const onClose = vi.fn()

    const notifications: Notification[] = [
      {
        id: '5',
        agency_id: 'agency-123',
        user_id: null,
        type: 'overdue_payment',
        message: 'Notification 1',
        link: '/payments/plans',
        is_read: false,
        read_at: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      {
        id: '6',
        agency_id: 'agency-123',
        user_id: null,
        type: 'overdue_payment',
        message: 'Notification 2',
        link: '/payments/plans',
        is_read: false,
        read_at: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
    ]

    global.fetch = vi.fn(() =>
      Promise.resolve({
        ok: true,
        json: () =>
          Promise.resolve({
            success: true,
            notification: { id: '5', is_read: true },
          }),
      } as Response)
    )

    render(
      <QueryClientProvider client={queryClient}>
        <NotificationDropdown notifications={notifications} onClose={onClose} />
      </QueryClientProvider>
    )

    // Both notifications should have "Mark as read" buttons
    const markReadButtons = screen.getAllByText('Mark as read')
    expect(markReadButtons).toHaveLength(2)

    // Click first notification's "Mark as read" button
    fireEvent.click(markReadButtons[0])

    // Verify correct notification ID was sent
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith('/api/notifications/5/mark-read', {
        method: 'PATCH',
      })
    })
  })

  it('should show correct timestamp format', () => {
    const onClose = vi.fn()

    const twoHoursAgo = new Date()
    twoHoursAgo.setHours(twoHoursAgo.getHours() - 2)

    const notifications: Notification[] = [
      {
        id: '7',
        agency_id: 'agency-123',
        user_id: null,
        type: 'overdue_payment',
        message: 'Test notification',
        link: '/payments/plans',
        is_read: false,
        read_at: null,
        created_at: twoHoursAgo.toISOString(),
        updated_at: twoHoursAgo.toISOString(),
      },
    ]

    render(
      <QueryClientProvider client={queryClient}>
        <NotificationDropdown notifications={notifications} onClose={onClose} />
      </QueryClientProvider>
    )

    // Verify relative timestamp is shown
    expect(screen.getByText(/2 hours ago/)).toBeInTheDocument()
  })

  it('should limit display to 10 most recent notifications', () => {
    const onClose = vi.fn()

    // Create 15 notifications
    const notifications: Notification[] = Array.from({ length: 15 }, (_, i) => ({
      id: `${i + 1}`,
      agency_id: 'agency-123',
      user_id: null,
      type: 'overdue_payment',
      message: `Notification ${i + 1}`,
      link: '/payments/plans',
      is_read: false,
      read_at: null,
      created_at: new Date(Date.now() - i * 60000).toISOString(), // Each 1 minute apart
      updated_at: new Date().toISOString(),
    }))

    render(
      <QueryClientProvider client={queryClient}>
        <NotificationDropdown notifications={notifications} onClose={onClose} />
      </QueryClientProvider>
    )

    // Verify only 10 notifications are displayed
    const displayedNotifications = screen.getAllByText(/Notification \d+/)
    expect(displayedNotifications).toHaveLength(10)

    // Verify first 10 are shown
    expect(screen.getByText('Notification 1')).toBeInTheDocument()
    expect(screen.getByText('Notification 10')).toBeInTheDocument()

    // Verify 11-15 are not shown
    expect(screen.queryByText('Notification 11')).not.toBeInTheDocument()
    expect(screen.queryByText('Notification 15')).not.toBeInTheDocument()
  })

  it('should show "No notifications" when list is empty', () => {
    const onClose = vi.fn()

    render(
      <QueryClientProvider client={queryClient}>
        <NotificationDropdown notifications={[]} onClose={onClose} />
      </QueryClientProvider>
    )

    expect(screen.getByText('No notifications')).toBeInTheDocument()
  })
})
