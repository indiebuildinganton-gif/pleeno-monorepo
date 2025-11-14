/**
 * Integration Test: Notification Navigation
 *
 * Tests that clicking notifications properly navigates to the linked page
 * and closes the dropdown.
 *
 * Epic 5: Intelligent Status Automation & Notifications
 * Story 5.3: Overdue Payment Alerts - Task 5
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
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

describe('Notification Navigation', () => {
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

  it('should navigate to notification link on click', async () => {
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

    // Mock the mark-as-read API call
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

    render(
      <QueryClientProvider client={queryClient}>
        <NotificationDropdown notifications={notifications} onClose={onClose} />
      </QueryClientProvider>
    )

    // Click the notification
    const notification = screen.getByText(/Payment overdue: John Smith/)
    fireEvent.click(notification)

    // Verify navigation was called with correct URL
    expect(mockPush).toHaveBeenCalledWith('/payments/plans?status=overdue')

    // Verify dropdown was closed
    expect(onClose).toHaveBeenCalled()
  })

  it('should navigate to different link for different notification', async () => {
    const onClose = vi.fn()

    const notifications: Notification[] = [
      {
        id: '2',
        agency_id: 'agency-123',
        user_id: null,
        type: 'due_soon',
        message: 'Payment due soon: Jane Doe - $300.00',
        link: '/payments/plans?status=due_soon',
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

    render(
      <QueryClientProvider client={queryClient}>
        <NotificationDropdown notifications={notifications} onClose={onClose} />
      </QueryClientProvider>
    )

    // Click the notification
    const notification = screen.getByText(/Payment due soon: Jane Doe/)
    fireEvent.click(notification)

    // Verify navigation to different URL
    expect(mockPush).toHaveBeenCalledWith('/payments/plans?status=due_soon')
    expect(onClose).toHaveBeenCalled()
  })

  it('should not navigate if notification has no link', async () => {
    const onClose = vi.fn()

    const notifications: Notification[] = [
      {
        id: '3',
        agency_id: 'agency-123',
        user_id: null,
        type: 'system',
        message: 'System maintenance scheduled',
        link: null, // No link
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

    render(
      <QueryClientProvider client={queryClient}>
        <NotificationDropdown notifications={notifications} onClose={onClose} />
      </QueryClientProvider>
    )

    // Click the notification
    const notification = screen.getByText(/System maintenance scheduled/)
    fireEvent.click(notification)

    // Verify navigation was NOT called (no link)
    expect(mockPush).not.toHaveBeenCalled()

    // Dropdown should still be closed
    expect(onClose).toHaveBeenCalled()
  })

  it('should mark notification as read when clicked', async () => {
    const onClose = vi.fn()

    const notifications: Notification[] = [
      {
        id: '4',
        agency_id: 'agency-123',
        user_id: null,
        type: 'overdue_payment',
        message: 'Payment overdue: Bob Johnson - $750.00',
        link: '/payments/plans?status=overdue',
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

    render(
      <QueryClientProvider client={queryClient}>
        <NotificationDropdown notifications={notifications} onClose={onClose} />
      </QueryClientProvider>
    )

    // Click the notification
    const notification = screen.getByText(/Payment overdue: Bob Johnson/)
    fireEvent.click(notification)

    // Verify mark-as-read API was called
    expect(global.fetch).toHaveBeenCalledWith('/api/notifications/4/mark-read', {
      method: 'PATCH',
    })
  })

  it('should not mark already-read notification as read again', async () => {
    const onClose = vi.fn()

    const notifications: Notification[] = [
      {
        id: '5',
        agency_id: 'agency-123',
        user_id: null,
        type: 'overdue_payment',
        message: 'Payment overdue: Alice Cooper - $600.00',
        link: '/payments/plans?status=overdue',
        is_read: true, // Already read
        read_at: new Date().toISOString(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
    ]

    global.fetch = vi.fn()

    render(
      <QueryClientProvider client={queryClient}>
        <NotificationDropdown notifications={notifications} onClose={onClose} />
      </QueryClientProvider>
    )

    // Click the notification
    const notification = screen.getByText(/Payment overdue: Alice Cooper/)
    fireEvent.click(notification)

    // Verify mark-as-read API was NOT called (already read)
    expect(global.fetch).not.toHaveBeenCalled()

    // Navigation should still work
    expect(mockPush).toHaveBeenCalledWith('/payments/plans?status=overdue')
    expect(onClose).toHaveBeenCalled()
  })

  it('should close dropdown when clicking close button', () => {
    const onClose = vi.fn()

    const notifications: Notification[] = [
      {
        id: '6',
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

    render(
      <QueryClientProvider client={queryClient}>
        <NotificationDropdown notifications={notifications} onClose={onClose} />
      </QueryClientProvider>
    )

    // Click the close button
    const closeButton = screen.getByLabelText('Close notifications')
    fireEvent.click(closeButton)

    // Verify dropdown was closed
    expect(onClose).toHaveBeenCalled()

    // No navigation should occur
    expect(mockPush).not.toHaveBeenCalled()
  })

  it('should stop propagation when clicking mark as read button', () => {
    const onClose = vi.fn()

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

    render(
      <QueryClientProvider client={queryClient}>
        <NotificationDropdown notifications={notifications} onClose={onClose} />
      </QueryClientProvider>
    )

    // Click the "Mark as read" button
    const markReadButton = screen.getByText('Mark as read')
    fireEvent.click(markReadButton)

    // Verify mark-as-read API was called
    expect(global.fetch).toHaveBeenCalledWith('/api/notifications/7/mark-read', {
      method: 'PATCH',
    })

    // Dropdown should NOT be closed (event propagation stopped)
    expect(onClose).not.toHaveBeenCalled()

    // Navigation should NOT occur (event propagation stopped)
    expect(mockPush).not.toHaveBeenCalled()
  })
})
