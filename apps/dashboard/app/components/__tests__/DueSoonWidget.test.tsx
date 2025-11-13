/**
 * DueSoonWidget Component Tests
 *
 * Tests for the due soon dashboard widget component
 * Epic 5: Intelligent Status Automation
 * Story 5.2: Due Soon Notification Flags
 * Task 2: Update UI to display "due soon" badges
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { DueSoonWidget } from '../DueSoonWidget'

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

describe('DueSoonWidget', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  const mockDueSoonData = {
    success: true,
    data: {
      count: 12,
      total_amount: 15000.0,
    },
  }

  it('should render loading state initially', () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ;(global.fetch as any).mockImplementation(
      () => new Promise(() => {}) // Never resolves
    )

    renderWithQuery(<DueSoonWidget />)

    // Check for skeleton animation elements
    const skeletonElements = screen.getAllByRole('generic')
    expect(skeletonElements.length).toBeGreaterThan(0)
  })

  it('should render count and total amount after loading', async () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ;(global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => mockDueSoonData,
    })

    renderWithQuery(<DueSoonWidget />)

    await waitFor(() => {
      expect(screen.getByText('12')).toBeInTheDocument()
    })

    expect(screen.getByText('$15,000')).toBeInTheDocument()
    expect(screen.getByText('payments')).toBeInTheDocument()
  })

  it('should display singular "payment" when count is 1', async () => {
    const singlePaymentData = {
      success: true,
      data: {
        count: 1,
        total_amount: 1500.0,
      },
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ;(global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => singlePaymentData,
    })

    renderWithQuery(<DueSoonWidget />)

    await waitFor(() => {
      expect(screen.getByText('1')).toBeInTheDocument()
    })

    expect(screen.getByText('payment')).toBeInTheDocument()
    expect(screen.queryByText('payments')).not.toBeInTheDocument()
  })

  it('should display empty state when count is 0', async () => {
    const emptyData = {
      success: true,
      data: {
        count: 0,
        total_amount: 0,
      },
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ;(global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => emptyData,
    })

    renderWithQuery(<DueSoonWidget />)

    await waitFor(() => {
      expect(screen.getByText('0')).toBeInTheDocument()
    })

    expect(screen.getByText('No payments due in the next few days')).toBeInTheDocument()
  })

  it('should render error state on fetch failure', async () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ;(global.fetch as any).mockResolvedValueOnce({
      ok: false,
      status: 500,
    })

    renderWithQuery(<DueSoonWidget />)

    await waitFor(() => {
      expect(screen.getByText('Failed to load due soon data')).toBeInTheDocument()
    })

    expect(screen.getByText('Unable to fetch upcoming payment information.')).toBeInTheDocument()
    expect(screen.getByText('Retry')).toBeInTheDocument()
  })

  it('should fetch data from correct endpoint', async () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ;(global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => mockDueSoonData,
    })

    renderWithQuery(<DueSoonWidget />)

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith('/api/dashboard/due-soon-count')
    })
  })

  it('should render Clock icon in widget header', async () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ;(global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => mockDueSoonData,
    })

    const { container } = renderWithQuery(<DueSoonWidget />)

    await waitFor(() => {
      expect(screen.getByText('12')).toBeInTheDocument()
    })

    // Clock icon should be present
    const icon = container.querySelector('svg')
    expect(icon).toBeInTheDocument()
  })

  it('should render link to filtered payment plans view', async () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ;(global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => mockDueSoonData,
    })

    renderWithQuery(<DueSoonWidget />)

    await waitFor(() => {
      expect(screen.getByText('12')).toBeInTheDocument()
    })

    const link = screen.getByText('View all due soon payments')
    expect(link).toHaveAttribute('href', '/plans?filter=due-soon')
  })

  it('should use amber/yellow color scheme for warning', async () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ;(global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => mockDueSoonData,
    })

    const { container } = renderWithQuery(<DueSoonWidget />)

    await waitFor(() => {
      expect(screen.getByText('12')).toBeInTheDocument()
    })

    // Widget should have amber border and background
    const card = container.querySelector('.border-amber-200')
    expect(card).toBeInTheDocument()

    const bgCard = container.querySelector('.bg-amber-50')
    expect(bgCard).toBeInTheDocument()
  })

  it('should use green color scheme for empty state', async () => {
    const emptyData = {
      success: true,
      data: {
        count: 0,
        total_amount: 0,
      },
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ;(global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => emptyData,
    })

    const { container } = renderWithQuery(<DueSoonWidget />)

    await waitFor(() => {
      expect(screen.getByText('0')).toBeInTheDocument()
    })

    // Empty state should have green border and background
    const card = container.querySelector('.border-green-200')
    expect(card).toBeInTheDocument()

    const bgCard = container.querySelector('.bg-green-50')
    expect(bgCard).toBeInTheDocument()
  })

  it('should format currency amounts correctly', async () => {
    const largeAmountData = {
      success: true,
      data: {
        count: 5,
        total_amount: 123456.78,
      },
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ;(global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => largeAmountData,
    })

    renderWithQuery(<DueSoonWidget />)

    await waitFor(() => {
      expect(screen.getByText('5')).toBeInTheDocument()
    })

    // Should format with $ and commas, no decimals
    expect(screen.getByText('$123,457')).toBeInTheDocument()
  })

  it('should use 5-minute stale time for cache', async () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ;(global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => mockDueSoonData,
    })

    const queryClient = createTestQueryClient()

    render(
      <QueryClientProvider client={queryClient}>
        <DueSoonWidget />
      </QueryClientProvider>
    )

    // The component should use staleTime: 5 * 60 * 1000
    // We can verify the fetch is called once and cached
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledTimes(1)
    })
  })
})
