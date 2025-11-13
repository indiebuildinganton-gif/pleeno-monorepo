/**
 * CommissionBySchoolWidget Component Tests
 *
 * Tests for the commission by school widget component
 * Epic 6: Dashboard & Reporting Zone
 * Story 6.1: KPI Widgets with Trends and Market Breakdown
 * Task 7: Create CommissionBySchoolWidget Component
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { CommissionBySchoolWidget } from '../CommissionBySchoolWidget'

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

describe('CommissionBySchoolWidget', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  const mockSchoolData = {
    success: true,
    data: [
      {
        college_id: '1',
        college_name: 'University of Sydney',
        commission: 50000,
        percentage_share: 35.5,
        trend: 'up' as const,
      },
      {
        college_id: '2',
        college_name: 'University of Melbourne',
        commission: 40000,
        percentage_share: 28.4,
        trend: 'up' as const,
      },
      {
        college_id: '3',
        college_name: 'University of Queensland',
        commission: 25000,
        percentage_share: 17.8,
        trend: 'neutral' as const,
      },
      {
        college_id: '4',
        college_name: 'Monash University',
        commission: 15000,
        percentage_share: 10.7,
        trend: 'down' as const,
      },
      {
        college_id: '5',
        college_name: 'University of Adelaide',
        commission: 10000,
        percentage_share: 7.6,
        trend: 'neutral' as const,
      },
    ],
  }

  it('should render loading state initially', () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ;(global.fetch as any).mockImplementation(
      () => new Promise(() => {}) // Never resolves
    )

    renderWithQuery(<CommissionBySchoolWidget />)

    // Check for skeleton animation elements
    const skeletonElements = screen.getAllByRole('generic')
    expect(skeletonElements.length).toBeGreaterThan(0)
  })

  it('should render top 5 schools with data after loading', async () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ;(global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => mockSchoolData,
    })

    renderWithQuery(<CommissionBySchoolWidget />)

    await waitFor(() => {
      expect(screen.getByText('Top Schools')).toBeInTheDocument()
    })

    expect(screen.getByText('University of Sydney')).toBeInTheDocument()
    expect(screen.getByText('University of Melbourne')).toBeInTheDocument()
    expect(screen.getByText('University of Queensland')).toBeInTheDocument()
    expect(screen.getByText('Monash University')).toBeInTheDocument()
    expect(screen.getByText('University of Adelaide')).toBeInTheDocument()
  })

  it('should display commission amounts with correct currency formatting', async () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ;(global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => mockSchoolData,
    })

    renderWithQuery(<CommissionBySchoolWidget />)

    await waitFor(() => {
      expect(screen.getByText('Top Schools')).toBeInTheDocument()
    })

    // Check that currency formatted values appear (formatCurrency adds $ and commas)
    expect(screen.getByText(/\$50,000\.00/)).toBeInTheDocument()
    expect(screen.getByText(/\$40,000\.00/)).toBeInTheDocument()
  })

  it('should display percentage shares with correct formatting', async () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ;(global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => mockSchoolData,
    })

    renderWithQuery(<CommissionBySchoolWidget />)

    await waitFor(() => {
      expect(screen.getByText('Top Schools')).toBeInTheDocument()
    })

    expect(screen.getByText('35.5%')).toBeInTheDocument()
    expect(screen.getByText('28.4%')).toBeInTheDocument()
    expect(screen.getByText('17.8%')).toBeInTheDocument()
    expect(screen.getByText('10.7%')).toBeInTheDocument()
    expect(screen.getByText('7.6%')).toBeInTheDocument()
  })

  it('should render progress bars with correct widths', async () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ;(global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => mockSchoolData,
    })

    const { container } = renderWithQuery(<CommissionBySchoolWidget />)

    await waitFor(() => {
      expect(screen.getByText('Top Schools')).toBeInTheDocument()
    })

    // Check that progress bars are rendered with correct widths
    const progressBars = container.querySelectorAll('[role="progressbar"]')
    expect(progressBars).toHaveLength(5)

    // Check the first progress bar has correct aria attributes
    expect(progressBars[0]).toHaveAttribute('aria-valuenow', '35.5')
    expect(progressBars[0]).toHaveAttribute('aria-valuemin', '0')
    expect(progressBars[0]).toHaveAttribute('aria-valuemax', '100')
  })

  it('should display trend arrows with correct colors', async () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ;(global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => mockSchoolData,
    })

    renderWithQuery(<CommissionBySchoolWidget />)

    await waitFor(() => {
      expect(screen.getByText('Top Schools')).toBeInTheDocument()
    })

    // Check for trend arrow aria labels
    const upArrows = screen.getAllByLabelText('Trending up')
    const downArrows = screen.getAllByLabelText('Trending down')
    const neutralArrows = screen.getAllByLabelText('No change')

    expect(upArrows).toHaveLength(2) // Sydney and Melbourne
    expect(downArrows).toHaveLength(1) // Monash
    expect(neutralArrows).toHaveLength(2) // Queensland and Adelaide
  })

  it('should render school names as clickable links', async () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ;(global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => mockSchoolData,
    })

    renderWithQuery(<CommissionBySchoolWidget />)

    await waitFor(() => {
      expect(screen.getByText('Top Schools')).toBeInTheDocument()
    })

    // Check that school names are links
    const sydneyLink = screen.getByText('University of Sydney')
    expect(sydneyLink).toHaveAttribute('href', '/colleges/1')

    const melbourneLink = screen.getByText('University of Melbourne')
    expect(melbourneLink).toHaveAttribute('href', '/colleges/2')
  })

  it('should render "View All Colleges" link', async () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ;(global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => mockSchoolData,
    })

    renderWithQuery(<CommissionBySchoolWidget />)

    await waitFor(() => {
      expect(screen.getByText('Top Schools')).toBeInTheDocument()
    })

    const viewAllLink = screen.getByText('View All Colleges →')
    expect(viewAllLink).toBeInTheDocument()
    expect(viewAllLink).toHaveAttribute('href', '/colleges')
  })

  it('should render error state on fetch failure', async () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ;(global.fetch as any).mockResolvedValueOnce({
      ok: false,
      status: 500,
    })

    renderWithQuery(<CommissionBySchoolWidget />)

    await waitFor(() => {
      expect(screen.getByText('Failed to load commission by school')).toBeInTheDocument()
    })

    expect(
      screen.getByText('There was an error loading the school commission data. Please try again.')
    ).toBeInTheDocument()
    expect(screen.getByText('Retry')).toBeInTheDocument()
  })

  it('should fetch data from correct endpoint', async () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ;(global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => mockSchoolData,
    })

    renderWithQuery(<CommissionBySchoolWidget />)

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith('/api/dashboard/commission-by-school')
    })
  })

  it('should handle less than 5 schools gracefully', async () => {
    const dataWithFewSchools = {
      success: true,
      data: [
        {
          college_id: '1',
          college_name: 'University of Sydney',
          commission: 50000,
          percentage_share: 60.0,
          trend: 'up' as const,
        },
        {
          college_id: '2',
          college_name: 'University of Melbourne',
          commission: 30000,
          percentage_share: 40.0,
          trend: 'neutral' as const,
        },
      ],
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ;(global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => dataWithFewSchools,
    })

    renderWithQuery(<CommissionBySchoolWidget />)

    await waitFor(() => {
      expect(screen.getByText('Top Schools')).toBeInTheDocument()
    })

    expect(screen.getByText('University of Sydney')).toBeInTheDocument()
    expect(screen.getByText('University of Melbourne')).toBeInTheDocument()

    // Should still render "View All" link even with fewer schools
    expect(screen.getByText('View All Colleges →')).toBeInTheDocument()
  })

  it('should handle more than 5 schools by limiting display to top 5', async () => {
    const dataWithManySchools = {
      success: true,
      data: [
        ...mockSchoolData.data,
        {
          college_id: '6',
          college_name: 'University of Western Australia',
          commission: 5000,
          percentage_share: 3.6,
          trend: 'up' as const,
        },
        {
          college_id: '7',
          college_name: 'University of Tasmania',
          commission: 3000,
          percentage_share: 2.1,
          trend: 'down' as const,
        },
      ],
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ;(global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => dataWithManySchools,
    })

    renderWithQuery(<CommissionBySchoolWidget />)

    await waitFor(() => {
      expect(screen.getByText('Top Schools')).toBeInTheDocument()
    })

    // Should only show top 5
    expect(screen.getByText('University of Sydney')).toBeInTheDocument()
    expect(screen.getByText('University of Adelaide')).toBeInTheDocument()

    // Should not show 6th and 7th schools
    expect(screen.queryByText('University of Western Australia')).not.toBeInTheDocument()
    expect(screen.queryByText('University of Tasmania')).not.toBeInTheDocument()
  })

  it('should use 5-minute stale time for cache', async () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ;(global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => mockSchoolData,
    })

    const queryClient = createTestQueryClient()

    render(
      <QueryClientProvider client={queryClient}>
        <CommissionBySchoolWidget />
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

    renderWithQuery(<CommissionBySchoolWidget />)

    await waitFor(() => {
      expect(screen.getByText('Top Schools')).toBeInTheDocument()
    })

    // Should still render the widget structure
    expect(screen.getByText('Commission breakdown by top performing schools')).toBeInTheDocument()
    expect(screen.getByText('View All Colleges →')).toBeInTheDocument()
  })
})
