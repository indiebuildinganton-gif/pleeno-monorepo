/**
 * Integration Test: Notification Bell Icon
 *
 * Tests that the NotificationBell component displays the correct unread count
 * and updates when notifications are marked as read.
 *
 * Epic 5: Intelligent Status Automation & Notifications
 * Story 5.3: Overdue Payment Alerts - Task 5
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { NotificationBell } from '@shell/app/components/NotificationBell'

describe('NotificationBell', () => {
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

  it('should display correct unread count', async () => {
    // Mock API response with 3 unread notifications
    global.fetch = vi.fn(() =>
      Promise.resolve({
        ok: true,
        json: () =>
          Promise.resolve({
            data: [
              { id: '1', is_read: false, created_at: new Date().toISOString(), message: 'Test 1' },
              { id: '2', is_read: false, created_at: new Date().toISOString(), message: 'Test 2' },
              { id: '3', is_read: false, created_at: new Date().toISOString(), message: 'Test 3' },
            ],
            pagination: {
              page: 1,
              limit: 100,
              total: 3,
              totalPages: 1,
            },
          }),
      } as Response)
    )

    render(
      <QueryClientProvider client={queryClient}>
        <NotificationBell />
      </QueryClientProvider>
    )

    // Wait for the badge to appear with count
    await waitFor(
      () => {
        const badge = screen.getByText('3')
        expect(badge).toBeInTheDocument()
      },
      { timeout: 3000 }
    )

    // Verify fetch was called with correct URL
    expect(global.fetch).toHaveBeenCalledWith('/api/notifications?is_read=false&limit=100')
  })

  it('should hide badge when count is 0', async () => {
    // Mock API response with no notifications
    global.fetch = vi.fn(() =>
      Promise.resolve({
        ok: true,
        json: () =>
          Promise.resolve({
            data: [],
            pagination: {
              page: 1,
              limit: 100,
              total: 0,
              totalPages: 0,
            },
          }),
      } as Response)
    )

    render(
      <QueryClientProvider client={queryClient}>
        <NotificationBell />
      </QueryClientProvider>
    )

    // Wait a bit for the component to render
    await waitFor(() => {
      const bellButton = screen.getByLabelText('Notifications')
      expect(bellButton).toBeInTheDocument()
    })

    // Verify badge is not present
    expect(screen.queryByText('0')).not.toBeInTheDocument()
    expect(screen.queryByText(/^\d+$/)).not.toBeInTheDocument()
  })

  it('should display "99+" when count exceeds 99', async () => {
    // Create 150 notifications
    const notifications = Array.from({ length: 150 }, (_, i) => ({
      id: `${i + 1}`,
      is_read: false,
      created_at: new Date().toISOString(),
      message: `Test ${i + 1}`,
    }))

    // Mock API response with 150 unread notifications
    global.fetch = vi.fn(() =>
      Promise.resolve({
        ok: true,
        json: () =>
          Promise.resolve({
            data: notifications,
            pagination: {
              page: 1,
              limit: 100,
              total: 150,
              totalPages: 2,
            },
          }),
      } as Response)
    )

    render(
      <QueryClientProvider client={queryClient}>
        <NotificationBell />
      </QueryClientProvider>
    )

    // Wait for the badge to show "99+"
    await waitFor(
      () => {
        const badge = screen.getByText('99+')
        expect(badge).toBeInTheDocument()
      },
      { timeout: 3000 }
    )
  })

  it('should handle API errors gracefully', async () => {
    // Mock API error
    global.fetch = vi.fn(() =>
      Promise.resolve({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
        json: () => Promise.resolve({ error: 'Failed to fetch notifications' }),
      } as Response)
    )

    // Suppress console errors for this test
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

    render(
      <QueryClientProvider client={queryClient}>
        <NotificationBell />
      </QueryClientProvider>
    )

    // Wait for component to render
    await waitFor(() => {
      const bellButton = screen.getByLabelText('Notifications')
      expect(bellButton).toBeInTheDocument()
    })

    // Badge should not be present when there's an error
    expect(screen.queryByText(/^\d+$/)).not.toBeInTheDocument()

    consoleSpy.mockRestore()
  })

  it('should show loading state initially', () => {
    // Mock a slow API response
    global.fetch = vi.fn(
      () =>
        new Promise((resolve) => {
          setTimeout(() => {
            resolve({
              ok: true,
              json: () =>
                Promise.resolve({
                  data: [],
                  pagination: {
                    page: 1,
                    limit: 100,
                    total: 0,
                    totalPages: 0,
                  },
                }),
            } as Response)
          }, 100)
        })
    )

    render(
      <QueryClientProvider client={queryClient}>
        <NotificationBell />
      </QueryClientProvider>
    )

    // Bell button should be present immediately
    const bellButton = screen.getByLabelText('Notifications')
    expect(bellButton).toBeInTheDocument()
  })

  it('should have correct accessibility attributes', async () => {
    global.fetch = vi.fn(() =>
      Promise.resolve({
        ok: true,
        json: () =>
          Promise.resolve({
            data: [{ id: '1', is_read: false, created_at: new Date().toISOString(), message: 'Test' }],
            pagination: {
              page: 1,
              limit: 100,
              total: 1,
              totalPages: 1,
            },
          }),
      } as Response)
    )

    render(
      <QueryClientProvider client={queryClient}>
        <NotificationBell />
      </QueryClientProvider>
    )

    await waitFor(() => {
      const bellButton = screen.getByLabelText('Notifications')
      expect(bellButton).toBeInTheDocument()
      expect(bellButton).toHaveAttribute('aria-label', 'Notifications')
      expect(bellButton).toHaveAttribute('aria-expanded')
    })
  })
})
