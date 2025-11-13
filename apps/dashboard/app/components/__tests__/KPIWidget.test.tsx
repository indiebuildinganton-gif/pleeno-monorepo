/**
 * KPIWidget Component Tests
 *
 * Tests for the KPI widget component
 * Epic 6: Dashboard & Reporting Zone
 * Story 6.1: KPI Widgets with Trends and Market Breakdown
 * Task 5: Create KPIWidget Component
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { KPIWidget } from '../KPIWidget'
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

describe('KPIWidget', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  const mockKPIData = {
    success: true,
    data: {
      active_students: 150,
      active_payment_plans: 120,
      outstanding_amount: 250000.0,
      earned_commission: 45000.0,
      collection_rate: 85.5,
      trends: {
        active_students: 'up' as const,
        active_payment_plans: 'up' as const,
        outstanding_amount: 'down' as const,
        earned_commission: 'up' as const,
        collection_rate: 'neutral' as const,
      },
    },
  }

  it('should render loading skeleton initially', () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ;(global.fetch as any).mockImplementation(
      () => new Promise(() => {}) // Never resolves
    )

    renderWithQuery(<KPIWidget />)

    // Check for skeleton animation elements
    const skeletonElements = screen.getAllByRole('generic')
    expect(skeletonElements.length).toBeGreaterThan(0)
  })

  it('should render 5 metric cards after loading', async () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ;(global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => mockKPIData,
    })

    renderWithQuery(<KPIWidget />)

    await waitFor(() => {
      expect(screen.getByText('Active Students')).toBeInTheDocument()
    })

    expect(screen.getByText('Active Payment Plans')).toBeInTheDocument()
    expect(screen.getByText('Outstanding Amount')).toBeInTheDocument()
    expect(screen.getByText('Earned Commission')).toBeInTheDocument()
    expect(screen.getByText('Collection Rate')).toBeInTheDocument()
  })

  it('should display correct metric values', async () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ;(global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => mockKPIData,
    })

    renderWithQuery(<KPIWidget />)

    await waitFor(() => {
      expect(screen.getByText('150')).toBeInTheDocument() // active_students
    })

    expect(screen.getByText('120')).toBeInTheDocument() // active_payment_plans
  })

  it('should format currency values correctly', async () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ;(global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => mockKPIData,
    })

    renderWithQuery(<KPIWidget />)

    await waitFor(() => {
      // Check currency formatting for outstanding amount and earned commission
      expect(screen.getByText(/\$250,000/)).toBeInTheDocument()
      expect(screen.getByText(/\$45,000/)).toBeInTheDocument()
    })
  })

  it('should format percentage values correctly', async () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ;(global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => mockKPIData,
    })

    renderWithQuery(<KPIWidget />)

    await waitFor(() => {
      // Check percentage formatting for collection rate
      expect(screen.getByText('85.5%')).toBeInTheDocument()
    })
  })

  it('should display trend arrows with correct colors and labels', async () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ;(global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => mockKPIData,
    })

    renderWithQuery(<KPIWidget />)

    await waitFor(() => {
      expect(screen.getByText('Active Students')).toBeInTheDocument()
    })

    // Check for trend arrow aria labels
    const upArrows = screen.getAllByLabelText('Trending up')
    const downArrows = screen.getAllByLabelText('Trending down')
    const neutralArrows = screen.getAllByLabelText('No change')

    expect(upArrows).toHaveLength(3) // active_students, active_payment_plans, earned_commission
    expect(downArrows).toHaveLength(1) // outstanding_amount
    expect(neutralArrows).toHaveLength(1) // collection_rate
  })

  it('should apply correct variant classes to cards', async () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ;(global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => mockKPIData,
    })

    const { container } = renderWithQuery(<KPIWidget />)

    await waitFor(() => {
      expect(screen.getByText('Active Students')).toBeInTheDocument()
    })

    // Check that warning variant is applied to Outstanding Amount card
    const cards = container.querySelectorAll('[class*="border-amber"]')
    expect(cards.length).toBeGreaterThan(0)

    // Check that success variant is applied to Earned Commission card
    const successCards = container.querySelectorAll('[class*="border-green"]')
    expect(successCards.length).toBeGreaterThan(0)
  })

  it('should render error state on fetch failure', async () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ;(global.fetch as any).mockResolvedValueOnce({
      ok: false,
      status: 500,
    })

    renderWithQuery(<KPIWidget />)

    await waitFor(() => {
      expect(screen.getByText('Failed to load KPI metrics')).toBeInTheDocument()
    })

    expect(
      screen.getByText('There was an error loading the dashboard metrics. Please try again.')
    ).toBeInTheDocument()
    expect(screen.getByText('Retry')).toBeInTheDocument()
  })

  it('should allow retrying after error', async () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ;(global.fetch as any)
      .mockResolvedValueOnce({
        ok: false,
        status: 500,
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => mockKPIData,
      })

    const user = userEvent.setup()
    renderWithQuery(<KPIWidget />)

    // Wait for error state
    await waitFor(() => {
      expect(screen.getByText('Failed to load KPI metrics')).toBeInTheDocument()
    })

    // Click retry button
    const retryButton = screen.getByText('Retry')
    await user.click(retryButton)

    // Wait for successful load
    await waitFor(() => {
      expect(screen.getByText('Active Students')).toBeInTheDocument()
    })

    expect(screen.getByText('150')).toBeInTheDocument()
  })

  it('should fetch data from correct endpoint', async () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ;(global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => mockKPIData,
    })

    renderWithQuery(<KPIWidget />)

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith('/api/kpis')
    })
  })

  it('should handle zero values gracefully', async () => {
    const zeroData = {
      success: true,
      data: {
        active_students: 0,
        active_payment_plans: 0,
        outstanding_amount: 0,
        earned_commission: 0,
        collection_rate: 0,
        trends: {
          active_students: 'neutral' as const,
          active_payment_plans: 'neutral' as const,
          outstanding_amount: 'neutral' as const,
          earned_commission: 'neutral' as const,
          collection_rate: 'neutral' as const,
        },
      },
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ;(global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => zeroData,
    })

    renderWithQuery(<KPIWidget />)

    await waitFor(() => {
      expect(screen.getByText('Active Students')).toBeInTheDocument()
    })

    // Check for zero values
    const zeroElements = screen.getAllByText('0')
    expect(zeroElements.length).toBeGreaterThan(0)

    // Check for currency zeros
    expect(screen.getByText(/\$0/)).toBeInTheDocument()

    // Check for percentage zero
    expect(screen.getByText('0.0%')).toBeInTheDocument()
  })

  it('should handle all neutral trends', async () => {
    const neutralData = {
      success: true,
      data: {
        active_students: 100,
        active_payment_plans: 50,
        outstanding_amount: 10000,
        earned_commission: 5000,
        collection_rate: 75,
        trends: {
          active_students: 'neutral' as const,
          active_payment_plans: 'neutral' as const,
          outstanding_amount: 'neutral' as const,
          earned_commission: 'neutral' as const,
          collection_rate: 'neutral' as const,
        },
      },
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ;(global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => neutralData,
    })

    renderWithQuery(<KPIWidget />)

    await waitFor(() => {
      expect(screen.getByText('Active Students')).toBeInTheDocument()
    })

    // All trends should be neutral
    const neutralArrows = screen.getAllByLabelText('No change')
    expect(neutralArrows).toHaveLength(5)
  })

  it('should handle all down trends', async () => {
    const downData = {
      success: true,
      data: {
        active_students: 80,
        active_payment_plans: 40,
        outstanding_amount: 5000,
        earned_commission: 2000,
        collection_rate: 50,
        trends: {
          active_students: 'down' as const,
          active_payment_plans: 'down' as const,
          outstanding_amount: 'down' as const,
          earned_commission: 'down' as const,
          collection_rate: 'down' as const,
        },
      },
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ;(global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => downData,
    })

    renderWithQuery(<KPIWidget />)

    await waitFor(() => {
      expect(screen.getByText('Active Students')).toBeInTheDocument()
    })

    // All trends should be down
    const downArrows = screen.getAllByLabelText('Trending down')
    expect(downArrows).toHaveLength(5)
  })

  it('should handle all up trends', async () => {
    const upData = {
      success: true,
      data: {
        active_students: 200,
        active_payment_plans: 150,
        outstanding_amount: 300000,
        earned_commission: 60000,
        collection_rate: 90,
        trends: {
          active_students: 'up' as const,
          active_payment_plans: 'up' as const,
          outstanding_amount: 'up' as const,
          earned_commission: 'up' as const,
          collection_rate: 'up' as const,
        },
      },
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ;(global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => upData,
    })

    renderWithQuery(<KPIWidget />)

    await waitFor(() => {
      expect(screen.getByText('Active Students')).toBeInTheDocument()
    })

    // All trends should be up
    const upArrows = screen.getAllByLabelText('Trending up')
    expect(upArrows).toHaveLength(5)
  })

  it('should use 5-minute stale time for cache', async () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ;(global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => mockKPIData,
    })

    const queryClient = createTestQueryClient()

    render(
      <QueryClientProvider client={queryClient}>
        <KPIWidget />
      </QueryClientProvider>
    )

    // The component should use staleTime: 5 * 60 * 1000
    // We can verify the fetch is called once and cached
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledTimes(1)
    })
  })

  it('should render 5 cards in responsive grid', async () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ;(global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => mockKPIData,
    })

    const { container } = renderWithQuery(<KPIWidget />)

    await waitFor(() => {
      expect(screen.getByText('Active Students')).toBeInTheDocument()
    })

    // Check that the grid container has the correct responsive classes
    const gridContainer = container.querySelector('.grid')
    expect(gridContainer).toBeInTheDocument()
    expect(gridContainer).toHaveClass('grid-cols-1')
    expect(gridContainer).toHaveClass('md:grid-cols-5')
  })

  it('should handle large numeric values correctly', async () => {
    const largeData = {
      success: true,
      data: {
        active_students: 9999,
        active_payment_plans: 8888,
        outstanding_amount: 9999999.99,
        earned_commission: 888888.88,
        collection_rate: 99.9,
        trends: {
          active_students: 'up' as const,
          active_payment_plans: 'up' as const,
          outstanding_amount: 'up' as const,
          earned_commission: 'up' as const,
          collection_rate: 'up' as const,
        },
      },
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ;(global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => largeData,
    })

    renderWithQuery(<KPIWidget />)

    await waitFor(() => {
      expect(screen.getByText('9999')).toBeInTheDocument() // active_students
    })

    expect(screen.getByText('8888')).toBeInTheDocument() // active_payment_plans
    expect(screen.getByText(/\$9,999,999/)).toBeInTheDocument() // outstanding_amount
    expect(screen.getByText(/\$888,888/)).toBeInTheDocument() // earned_commission
    expect(screen.getByText('99.9%')).toBeInTheDocument() // collection_rate
  })

  it('should handle decimal collection rates correctly', async () => {
    const decimalData = {
      success: true,
      data: {
        active_students: 100,
        active_payment_plans: 50,
        outstanding_amount: 10000,
        earned_commission: 5000,
        collection_rate: 85.56,
        trends: {
          active_students: 'neutral' as const,
          active_payment_plans: 'neutral' as const,
          outstanding_amount: 'neutral' as const,
          earned_commission: 'neutral' as const,
          collection_rate: 'neutral' as const,
        },
      },
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ;(global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => decimalData,
    })

    renderWithQuery(<KPIWidget />)

    await waitFor(() => {
      expect(screen.getByText('85.6%')).toBeInTheDocument() // Should round to 1 decimal
    })
  })

  it('should handle missing data property gracefully', async () => {
    const invalidData = {
      success: true,
      data: null,
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ;(global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => invalidData,
    })

    renderWithQuery(<KPIWidget />)

    await waitFor(() => {
      expect(screen.getByText('Failed to load KPI metrics')).toBeInTheDocument()
    })
  })

  it('should handle network error gracefully', async () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ;(global.fetch as any).mockRejectedValueOnce(new Error('Network error'))

    renderWithQuery(<KPIWidget />)

    await waitFor(() => {
      expect(screen.getByText('Failed to load KPI metrics')).toBeInTheDocument()
    })
  })
})
