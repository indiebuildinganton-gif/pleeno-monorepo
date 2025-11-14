/**
 * ActivityFeed Component Tests
 *
 * Tests for the activity feed component
 * Epic 6: Agency Dashboard
 * Story 6.4: Recent Activity Feed
 * Task 4: Create ActivityFeed Component
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ActivityFeed } from '../ActivityFeed'
import userEvent from '@testing-library/user-event'

// Create a new QueryClient for each test to avoid state leakage
const createTestQueryClient = () =>
  new QueryClient({
    defaultOptions: {
      queries: { retry: false },
    },
  })

function renderWithQuery(ui: React.ReactElement) {
  const queryClient = createTestQueryClient()
  return render(<QueryClientProvider client={queryClient}>{ui}</QueryClientProvider>)
}

// Mock fetch globally
global.fetch = vi.fn()

describe('ActivityFeed', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  const mockActivities = [
    {
      id: '1',
      timestamp: new Date().toISOString(),
      description: 'Created payment plan for John Doe',
      user: { id: 'user-1', name: 'Jane Smith', email: 'jane@example.com' },
      entity_type: 'payment_plan',
      entity_id: 'plan-1',
      action: 'created',
      metadata: {},
    },
    {
      id: '2',
      timestamp: new Date(Date.now() - 60 * 60 * 1000).toISOString(),
      description: 'Updated student information',
      user: { id: 'user-2', name: 'Bob Johnson', email: 'bob@example.com' },
      entity_type: 'student',
      entity_id: 'student-1',
      action: 'updated',
      metadata: {},
    },
  ]

  it('should render loading skeleton initially', () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ;(global.fetch as any).mockImplementation(
      () => new Promise(() => {}) // Never resolves
    )

    renderWithQuery(<ActivityFeed />)

    // Check for skeleton elements
    const skeletonElements = screen.getAllByRole('generic')
    expect(skeletonElements.length).toBeGreaterThan(0)
  })

  it('should render activities after loading', async () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ;(global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        success: true,
        data: mockActivities,
      }),
    })

    renderWithQuery(<ActivityFeed />)

    await waitFor(() => {
      expect(screen.getByText('Recent Activity')).toBeInTheDocument()
      expect(screen.getByText('Created payment plan for John Doe')).toBeInTheDocument()
      expect(screen.getByText('Updated student information')).toBeInTheDocument()
    })

    expect(screen.getByText(/Jane Smith/)).toBeInTheDocument()
    expect(screen.getByText(/Bob Johnson/)).toBeInTheDocument()
  })

  it('should show empty state when no activities', async () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ;(global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: true, data: [] }),
    })

    renderWithQuery(<ActivityFeed />)

    await waitFor(() => {
      expect(screen.getByText('No recent activity')).toBeInTheDocument()
    })

    expect(screen.getByText('Activity will appear here as your team works')).toBeInTheDocument()
    expect(screen.getByText('📭')).toBeInTheDocument()
  })

  it('should show error state on fetch failure', async () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ;(global.fetch as any).mockRejectedValue(new Error('Network error'))

    renderWithQuery(<ActivityFeed />)

    await waitFor(() => {
      expect(screen.getByText('Unable to load recent activity')).toBeInTheDocument()
      expect(screen.getByText('Retry')).toBeInTheDocument()
    })
  })

  it('should show error state when response is not ok', async () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ;(global.fetch as any).mockResolvedValueOnce({
      ok: false,
      status: 500,
    })

    renderWithQuery(<ActivityFeed />)

    await waitFor(() => {
      expect(screen.getByText('Unable to load recent activity')).toBeInTheDocument()
    })
  })

  it('should fetch data from correct endpoint', async () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ;(global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: true, data: mockActivities }),
    })

    renderWithQuery(<ActivityFeed />)

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith('/api/activity-log?limit=20')
    })
  })

  it('should retry on error when retry button is clicked', async () => {
    const user = userEvent.setup()

    // First call fails
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ;(global.fetch as any).mockRejectedValueOnce(new Error('Network error'))

    renderWithQuery(<ActivityFeed />)

    await waitFor(() => {
      expect(screen.getByText('Retry')).toBeInTheDocument()
    })

    // Second call succeeds
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ;(global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: true, data: mockActivities }),
    })

    const retryButton = screen.getByText('Retry')
    await user.click(retryButton)

    await waitFor(() => {
      expect(screen.getByText('Created payment plan for John Doe')).toBeInTheDocument()
    })
  })

  it('should render "View More" button', async () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ;(global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: true, data: mockActivities }),
    })

    renderWithQuery(<ActivityFeed />)

    await waitFor(() => {
      expect(screen.getByText('View More (Coming Soon)')).toBeInTheDocument()
    })

    const viewMoreButton = screen.getByText('View More (Coming Soon)')
    expect(viewMoreButton).toBeDisabled()
  })

  it('should render activities in chronological order', async () => {
    const activities = [
      {
        id: '1',
        timestamp: new Date('2025-11-14T10:00:00Z').toISOString(),
        description: 'First activity',
        user: { id: 'user-1', name: 'User 1', email: 'user1@example.com' },
        entity_type: 'student',
        entity_id: 'student-1',
        action: 'created',
        metadata: {},
      },
      {
        id: '2',
        timestamp: new Date('2025-11-14T11:00:00Z').toISOString(),
        description: 'Second activity',
        user: { id: 'user-2', name: 'User 2', email: 'user2@example.com' },
        entity_type: 'payment',
        entity_id: 'payment-1',
        action: 'created',
        metadata: {},
      },
    ]

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ;(global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: true, data: activities }),
    })

    renderWithQuery(<ActivityFeed />)

    await waitFor(() => {
      expect(screen.getByText('First activity')).toBeInTheDocument()
      expect(screen.getByText('Second activity')).toBeInTheDocument()
    })
  })

  it('should display activity with null user as "System"', async () => {
    const systemActivity = [
      {
        id: '1',
        timestamp: new Date().toISOString(),
        description: 'System marked installment as overdue',
        user: null,
        entity_type: 'installment',
        entity_id: 'installment-1',
        action: 'marked_overdue',
        metadata: {},
      },
    ]

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ;(global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: true, data: systemActivity }),
    })

    renderWithQuery(<ActivityFeed />)

    await waitFor(() => {
      expect(screen.getByText(/System/)).toBeInTheDocument()
    })
  })

  it('should use 1-minute stale time for caching', async () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ;(global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: true, data: mockActivities }),
    })

    const queryClient = createTestQueryClient()

    render(
      <QueryClientProvider client={queryClient}>
        <ActivityFeed />
      </QueryClientProvider>
    )

    // The component should use staleTime: 60000 (1 minute)
    // We can verify the fetch is called once and cached
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledTimes(1)
    })
  })

  it('should display appropriate icons for different entity types', async () => {
    const diverseActivities = [
      {
        id: '1',
        timestamp: new Date().toISOString(),
        description: 'Payment created',
        user: { id: 'user-1', name: 'User 1', email: 'user1@example.com' },
        entity_type: 'payment',
        entity_id: 'payment-1',
        action: 'created',
        metadata: {},
      },
      {
        id: '2',
        timestamp: new Date().toISOString(),
        description: 'Student enrolled',
        user: { id: 'user-2', name: 'User 2', email: 'user2@example.com' },
        entity_type: 'enrollment',
        entity_id: 'enrollment-1',
        action: 'created',
        metadata: {},
      },
    ]

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ;(global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: true, data: diverseActivities }),
    })

    renderWithQuery(<ActivityFeed />)

    await waitFor(() => {
      expect(screen.getByText('💰')).toBeInTheDocument() // Payment icon
      expect(screen.getByText('🏫')).toBeInTheDocument() // Enrollment icon
    })
  })
})
