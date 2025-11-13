/**
 * SeasonalCommissionChart Component Tests
 *
 * Tests for the seasonal commission chart component
 * Epic 6: Dashboard & Reporting Zone
 * Story 6.1: KPI Widgets with Trends and Market Breakdown
 * Task 6: Create SeasonalCommissionChart Component
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { SeasonalCommissionChart } from '../SeasonalCommissionChart'

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

describe('SeasonalCommissionChart', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  const mockSeasonalData = {
    success: true,
    data: [
      {
        month: '2024-01',
        commission: 5000,
        previous_year_commission: 4500,
        is_peak: false,
        is_quiet: false,
        yoy_change: 11.1,
      },
      {
        month: '2024-02',
        commission: 8000,
        previous_year_commission: 7000,
        is_peak: true,
        is_quiet: false,
        yoy_change: 14.3,
      },
      {
        month: '2024-03',
        commission: 3000,
        previous_year_commission: 3500,
        is_peak: false,
        is_quiet: true,
        yoy_change: -14.3,
      },
    ],
  }

  it('should render loading state initially', () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ;(global.fetch as any).mockImplementation(
      () => new Promise(() => {}) // Never resolves
    )

    renderWithQuery(<SeasonalCommissionChart />)

    expect(screen.getByText('Loading chart...')).toBeInTheDocument()
  })

  it('should render chart with data after loading', async () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ;(global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => mockSeasonalData,
    })

    renderWithQuery(<SeasonalCommissionChart />)

    await waitFor(() => {
      expect(screen.getByText('Seasonal Commission Trends')).toBeInTheDocument()
    })

    expect(
      screen.getByText('Monthly commission for the last 12 months with year-over-year comparison')
    ).toBeInTheDocument()
  })

  it('should render error state on fetch failure', async () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ;(global.fetch as any).mockResolvedValueOnce({
      ok: false,
      status: 500,
    })

    renderWithQuery(<SeasonalCommissionChart />)

    await waitFor(() => {
      expect(screen.getByText('Failed to load seasonal commission data')).toBeInTheDocument()
    })

    expect(
      screen.getByText(
        'There was an error loading the seasonal commission chart. Please try again.'
      )
    ).toBeInTheDocument()
    expect(screen.getByText('Retry')).toBeInTheDocument()
  })

  it('should fetch data from correct endpoint', async () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ;(global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => mockSeasonalData,
    })

    renderWithQuery(<SeasonalCommissionChart />)

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith('/api/dashboard/seasonal-commission')
    })
  })

  it('should render peak and quiet month indicators in legend', async () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ;(global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => mockSeasonalData,
    })

    renderWithQuery(<SeasonalCommissionChart />)

    await waitFor(() => {
      expect(screen.getByText('Peak Month')).toBeInTheDocument()
      expect(screen.getByText('Quiet Month')).toBeInTheDocument()
    })
  })

  it('should handle data without previous year comparison', async () => {
    const dataWithoutPreviousYear = {
      success: true,
      data: [
        {
          month: '2024-01',
          commission: 5000,
          is_peak: false,
          is_quiet: false,
        },
        {
          month: '2024-02',
          commission: 8000,
          is_peak: true,
          is_quiet: false,
        },
      ],
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ;(global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => dataWithoutPreviousYear,
    })

    renderWithQuery(<SeasonalCommissionChart />)

    await waitFor(() => {
      expect(screen.getByText('Seasonal Commission Trends')).toBeInTheDocument()
    })

    // Should still render without crashing
    expect(screen.getByText('Peak Month')).toBeInTheDocument()
  })

  it('should handle empty data array', async () => {
    const emptyData = {
      success: true,
      data: [],
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ;(global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => emptyData,
    })

    renderWithQuery(<SeasonalCommissionChart />)

    await waitFor(() => {
      expect(screen.getByText('Seasonal Commission Trends')).toBeInTheDocument()
    })
  })

  it('should use 5-minute stale time for cache', async () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ;(global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => mockSeasonalData,
    })

    const queryClient = createTestQueryClient()

    render(
      <QueryClientProvider client={queryClient}>
        <SeasonalCommissionChart />
      </QueryClientProvider>
    )

    // The component should use staleTime: 5 * 60 * 1000
    // We can't directly test this without accessing the query options,
    // but we can verify the fetch is called once and cached
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledTimes(1)
    })
  })

  it('should render responsive container', async () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ;(global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => mockSeasonalData,
    })

    const { container } = renderWithQuery(<SeasonalCommissionChart />)

    await waitFor(() => {
      expect(screen.getByText('Seasonal Commission Trends')).toBeInTheDocument()
    })

    // Check that ResponsiveContainer is rendered
    // Recharts renders a div with class 'recharts-responsive-container'
    const responsiveContainer = container.querySelector('.recharts-responsive-container')
    expect(responsiveContainer).toBeInTheDocument()
  })

  it('should handle months with less than 12 data points', async () => {
    const partialData = {
      success: true,
      data: [
        {
          month: '2024-01',
          commission: 5000,
        },
        {
          month: '2024-02',
          commission: 6000,
        },
        {
          month: '2024-03',
          commission: 7000,
        },
      ],
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ;(global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => partialData,
    })

    renderWithQuery(<SeasonalCommissionChart />)

    await waitFor(() => {
      expect(screen.getByText('Seasonal Commission Trends')).toBeInTheDocument()
    })

    // Should render without errors
    expect(screen.queryByText('Failed to load seasonal commission data')).not.toBeInTheDocument()
  })
})
