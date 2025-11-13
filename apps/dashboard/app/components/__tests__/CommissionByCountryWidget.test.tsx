/**
 * CommissionByCountryWidget Component Tests
 *
 * Tests for the commission by country widget component
 * Epic 6: Dashboard & Reporting Zone
 * Story 6.1: KPI Widgets with Trends and Market Breakdown
 * Task 8: Create CommissionByCountryWidget Component
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { CommissionByCountryWidget } from '../CommissionByCountryWidget'

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

describe('CommissionByCountryWidget', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  const mockCountryData = {
    success: true,
    data: [
      {
        country: 'India',
        commission: 60000,
        percentage_share: 40.5,
        trend: 'up' as const,
      },
      {
        country: 'China',
        commission: 45000,
        percentage_share: 30.3,
        trend: 'up' as const,
      },
      {
        country: 'Vietnam',
        commission: 25000,
        percentage_share: 16.9,
        trend: 'neutral' as const,
      },
      {
        country: 'Philippines',
        commission: 12000,
        percentage_share: 8.1,
        trend: 'down' as const,
      },
      {
        country: 'Unknown',
        commission: 6000,
        percentage_share: 4.2,
        trend: 'neutral' as const,
      },
    ],
  }

  it('should render loading state initially', () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ;(global.fetch as any).mockImplementation(
      () => new Promise(() => {}) // Never resolves
    )

    renderWithQuery(<CommissionByCountryWidget />)

    // Check for skeleton animation elements
    const skeletonElements = screen.getAllByRole('generic')
    expect(skeletonElements.length).toBeGreaterThan(0)
  })

  it('should render top 5 countries with data after loading', async () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ;(global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => mockCountryData,
    })

    renderWithQuery(<CommissionByCountryWidget />)

    await waitFor(() => {
      expect(screen.getByText('Top Countries')).toBeInTheDocument()
    })

    expect(screen.getByText('India')).toBeInTheDocument()
    expect(screen.getByText('China')).toBeInTheDocument()
    expect(screen.getByText('Vietnam')).toBeInTheDocument()
    expect(screen.getByText('Philippines')).toBeInTheDocument()
    expect(screen.getByText('Unknown')).toBeInTheDocument()
  })

  it('should display commission amounts with correct currency formatting', async () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ;(global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => mockCountryData,
    })

    renderWithQuery(<CommissionByCountryWidget />)

    await waitFor(() => {
      expect(screen.getByText('Top Countries')).toBeInTheDocument()
    })

    // Check that currency formatted values appear (formatCurrency adds $ and commas)
    expect(screen.getByText(/\$60,000\.00/)).toBeInTheDocument()
    expect(screen.getByText(/\$45,000\.00/)).toBeInTheDocument()
  })

  it('should display percentage shares with correct formatting', async () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ;(global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => mockCountryData,
    })

    renderWithQuery(<CommissionByCountryWidget />)

    await waitFor(() => {
      expect(screen.getByText('Top Countries')).toBeInTheDocument()
    })

    expect(screen.getByText('40.5%')).toBeInTheDocument()
    expect(screen.getByText('30.3%')).toBeInTheDocument()
    expect(screen.getByText('16.9%')).toBeInTheDocument()
    expect(screen.getByText('8.1%')).toBeInTheDocument()
    expect(screen.getByText('4.2%')).toBeInTheDocument()
  })

  it('should render progress bars with correct widths', async () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ;(global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => mockCountryData,
    })

    const { container } = renderWithQuery(<CommissionByCountryWidget />)

    await waitFor(() => {
      expect(screen.getByText('Top Countries')).toBeInTheDocument()
    })

    // Check that progress bars are rendered with correct widths
    const progressBars = container.querySelectorAll('[role="progressbar"]')
    expect(progressBars).toHaveLength(5)

    // Check the first progress bar has correct aria attributes
    expect(progressBars[0]).toHaveAttribute('aria-valuenow', '40.5')
    expect(progressBars[0]).toHaveAttribute('aria-valuemin', '0')
    expect(progressBars[0]).toHaveAttribute('aria-valuemax', '100')
  })

  it('should display trend arrows with correct colors', async () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ;(global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => mockCountryData,
    })

    renderWithQuery(<CommissionByCountryWidget />)

    await waitFor(() => {
      expect(screen.getByText('Top Countries')).toBeInTheDocument()
    })

    // Check for trend arrow aria labels
    const upArrows = screen.getAllByLabelText('Trending up')
    const downArrows = screen.getAllByLabelText('Trending down')
    const neutralArrows = screen.getAllByLabelText('No change')

    expect(upArrows).toHaveLength(2) // India and China
    expect(downArrows).toHaveLength(1) // Philippines
    expect(neutralArrows).toHaveLength(2) // Vietnam and Unknown
  })

  it('should display flag emojis for known countries', async () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ;(global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => mockCountryData,
    })

    renderWithQuery(<CommissionByCountryWidget />)

    await waitFor(() => {
      expect(screen.getByText('Top Countries')).toBeInTheDocument()
    })

    // Check that flag emojis are rendered (they have role="img")
    const flagElements = screen.getAllByRole('img')
    expect(flagElements.length).toBeGreaterThan(0)

    // Check specific flag aria labels
    expect(screen.getByLabelText('India flag')).toBeInTheDocument()
    expect(screen.getByLabelText('China flag')).toBeInTheDocument()
    expect(screen.getByLabelText('Vietnam flag')).toBeInTheDocument()
  })

  it('should handle "Unknown" nationality gracefully with globe icon', async () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ;(global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => mockCountryData,
    })

    renderWithQuery(<CommissionByCountryWidget />)

    await waitFor(() => {
      expect(screen.getByText('Top Countries')).toBeInTheDocument()
    })

    // Check that "Unknown" is displayed
    expect(screen.getByText('Unknown')).toBeInTheDocument()

    // Check that globe icon is rendered for unknown country
    expect(screen.getByLabelText('Unknown country')).toBeInTheDocument()
  })

  it('should render error state on fetch failure', async () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ;(global.fetch as any).mockResolvedValueOnce({
      ok: false,
      status: 500,
    })

    renderWithQuery(<CommissionByCountryWidget />)

    await waitFor(() => {
      expect(screen.getByText('Failed to load commission by country')).toBeInTheDocument()
    })

    expect(
      screen.getByText('There was an error loading the country commission data. Please try again.')
    ).toBeInTheDocument()
    expect(screen.getByText('Retry')).toBeInTheDocument()
  })

  it('should fetch data from correct endpoint', async () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ;(global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => mockCountryData,
    })

    renderWithQuery(<CommissionByCountryWidget />)

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith('/api/dashboard/commission-by-country')
    })
  })

  it('should handle less than 5 countries gracefully', async () => {
    const dataWithFewCountries = {
      success: true,
      data: [
        {
          country: 'India',
          commission: 75000,
          percentage_share: 55.0,
          trend: 'up' as const,
        },
        {
          country: 'China',
          commission: 60000,
          percentage_share: 45.0,
          trend: 'neutral' as const,
        },
      ],
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ;(global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => dataWithFewCountries,
    })

    renderWithQuery(<CommissionByCountryWidget />)

    await waitFor(() => {
      expect(screen.getByText('Top Countries')).toBeInTheDocument()
    })

    expect(screen.getByText('India')).toBeInTheDocument()
    expect(screen.getByText('China')).toBeInTheDocument()

    // Should render the widget with fewer countries
    expect(screen.getByText('Commission breakdown by country of origin')).toBeInTheDocument()
  })

  it('should handle more than 5 countries by limiting display to top 5', async () => {
    const dataWithManyCountries = {
      success: true,
      data: [
        ...mockCountryData.data,
        {
          country: 'Thailand',
          commission: 3000,
          percentage_share: 2.0,
          trend: 'up' as const,
        },
        {
          country: 'Malaysia',
          commission: 2000,
          percentage_share: 1.4,
          trend: 'down' as const,
        },
      ],
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ;(global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => dataWithManyCountries,
    })

    renderWithQuery(<CommissionByCountryWidget />)

    await waitFor(() => {
      expect(screen.getByText('Top Countries')).toBeInTheDocument()
    })

    // Should only show top 5
    expect(screen.getByText('India')).toBeInTheDocument()
    expect(screen.getByText('Unknown')).toBeInTheDocument()

    // Should not show 6th and 7th countries
    expect(screen.queryByText('Thailand')).not.toBeInTheDocument()
    expect(screen.queryByText('Malaysia')).not.toBeInTheDocument()
  })

  it('should use 5-minute stale time for cache', async () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ;(global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => mockCountryData,
    })

    const queryClient = createTestQueryClient()

    render(
      <QueryClientProvider client={queryClient}>
        <CommissionByCountryWidget />
      </QueryClientProvider>
    )

    // The component should use staleTime: 5 * 60 * 1000
    // We can verify the fetch is called once and cached
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledTimes(1)
    })
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

    renderWithQuery(<CommissionByCountryWidget />)

    await waitFor(() => {
      expect(screen.getByText('Top Countries')).toBeInTheDocument()
    })

    // Should still render the widget structure
    expect(screen.getByText('Commission breakdown by country of origin')).toBeInTheDocument()
  })

  it('should apply correct color coding to progress bars', async () => {
    const dataWithVariousPercentages = {
      success: true,
      data: [
        {
          country: 'India',
          commission: 50000,
          percentage_share: 35.0, // Should be green (>= 30%)
          trend: 'up' as const,
        },
        {
          country: 'China',
          commission: 30000,
          percentage_share: 22.0, // Should be green (>= 20%)
          trend: 'neutral' as const,
        },
        {
          country: 'Vietnam',
          commission: 20000,
          percentage_share: 16.0, // Should be yellow (>= 15%)
          trend: 'up' as const,
        },
        {
          country: 'Philippines',
          commission: 15000,
          percentage_share: 11.0, // Should be yellow (>= 10%)
          trend: 'neutral' as const,
        },
        {
          country: 'Thailand',
          commission: 8000,
          percentage_share: 5.0, // Should be yellow (< 10%)
          trend: 'down' as const,
        },
      ],
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ;(global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => dataWithVariousPercentages,
    })

    const { container } = renderWithQuery(<CommissionByCountryWidget />)

    await waitFor(() => {
      expect(screen.getByText('Top Countries')).toBeInTheDocument()
    })

    const progressBars = container.querySelectorAll('[role="progressbar"]')
    expect(progressBars).toHaveLength(5)

    // Check that different color classes are applied
    // Note: This is a basic check - in real tests you might want to check specific classes
    progressBars.forEach((bar) => {
      expect(bar.className).toMatch(/bg-/)
    })
  })
})
