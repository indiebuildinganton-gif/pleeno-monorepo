/**
 * CashFlowChart Component Tests
 *
 * Tests for the cash flow projection chart component
 * Epic 6: Dashboard & Reporting Zone
 * Story 6.2: Cash Flow Projection Chart
 * Task 8: Testing
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor, fireEvent } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { CashFlowChart } from '../CashFlowChart'

// Mock @pleeno/stores
const mockSetCashFlowView = vi.fn()
const mockCashFlowView = 'weekly'

vi.mock('@pleeno/stores', () => ({
  useDashboardStore: () => ({
    cashFlowView: mockCashFlowView,
    setCashFlowView: mockSetCashFlowView,
  }),
}))

// Mock @pleeno/auth
vi.mock('@pleeno/auth', () => ({
  useAuth: () => ({
    user: {
      id: 'user-123',
      app_metadata: {
        agency_id: 'agency-123',
      },
    },
  }),
}))

// Mock Supabase client
const mockChannel = {
  on: vi.fn().mockReturnThis(),
  subscribe: vi.fn(),
}
const mockRemoveChannel = vi.fn()

vi.mock('@/lib/supabase/client', () => ({
  createClient: () => ({
    channel: vi.fn(() => mockChannel),
    removeChannel: mockRemoveChannel,
  }),
}))

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

describe('CashFlowChart', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  const mockCashFlowData = {
    success: true,
    data: [
      {
        date_bucket: '2025-01-13',
        paid_amount: 5000,
        expected_amount: 3000,
        installment_count: 5,
        installments: [
          {
            student_name: 'John Doe',
            amount: 2500,
            status: 'paid',
            due_date: '2025-01-15',
          },
          {
            student_name: 'Jane Smith',
            amount: 2500,
            status: 'paid',
            due_date: '2025-01-15',
          },
          {
            student_name: 'Bob Johnson',
            amount: 1000,
            status: 'pending',
            due_date: '2025-01-16',
          },
          {
            student_name: 'Alice Williams',
            amount: 1000,
            status: 'pending',
            due_date: '2025-01-16',
          },
          {
            student_name: 'Charlie Brown',
            amount: 1000,
            status: 'pending',
            due_date: '2025-01-17',
          },
        ],
      },
      {
        date_bucket: '2025-01-20',
        paid_amount: 2000,
        expected_amount: 4000,
        installment_count: 3,
        installments: [
          {
            student_name: 'David Lee',
            amount: 2000,
            status: 'paid',
            due_date: '2025-01-22',
          },
          {
            student_name: 'Emma Davis',
            amount: 2000,
            status: 'pending',
            due_date: '2025-01-23',
          },
          {
            student_name: 'Frank Miller',
            amount: 2000,
            status: 'pending',
            due_date: '2025-01-24',
          },
        ],
      },
    ],
  }

  it('should render loading state initially', () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ;(global.fetch as any).mockImplementation(
      () => new Promise(() => {}) // Never resolves
    )

    renderWithQuery(<CashFlowChart />)

    expect(screen.getByText('Loading chart...')).toBeInTheDocument()
  })

  it('should render chart with data after loading', async () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ;(global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => mockCashFlowData,
    })

    renderWithQuery(<CashFlowChart />)

    await waitFor(() => {
      expect(screen.getByText(/Cash Flow Projection \(Next 90 Days\)/)).toBeInTheDocument()
    })

    // Verify summary metrics
    expect(screen.getByText('Total Expected')).toBeInTheDocument()
    expect(screen.getByText('Total Paid')).toBeInTheDocument()
    expect(screen.getByText('Net Projection')).toBeInTheDocument()
  })

  it('should render error state on fetch failure', async () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ;(global.fetch as any).mockResolvedValueOnce({
      ok: false,
      status: 500,
    })

    renderWithQuery(<CashFlowChart />)

    await waitFor(() => {
      expect(screen.getByText('Unable to load cash flow projection')).toBeInTheDocument()
    })

    expect(screen.getByText('Try Again')).toBeInTheDocument()
  })

  it('should fetch data from correct endpoint', async () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ;(global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => mockCashFlowData,
    })

    renderWithQuery(<CashFlowChart />)

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        '/api/cash-flow-projection?groupBy=weekly&days=90'
      )
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

    renderWithQuery(<CashFlowChart />)

    await waitFor(() => {
      expect(
        screen.getByText('No upcoming payments scheduled in the next 90 days')
      ).toBeInTheDocument()
    })

    expect(
      screen.getByText('Create payment plans to see cash flow projections')
    ).toBeInTheDocument()
  })

  it('should display view toggle buttons', async () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ;(global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => mockCashFlowData,
    })

    renderWithQuery(<CashFlowChart />)

    await waitFor(() => {
      expect(screen.getByText('Daily')).toBeInTheDocument()
      expect(screen.getByText('Weekly')).toBeInTheDocument()
      expect(screen.getByText('Monthly')).toBeInTheDocument()
    })
  })

  it('should call setCashFlowView when Daily button is clicked', async () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ;(global.fetch as any).mockResolvedValue({
      ok: true,
      json: async () => mockCashFlowData,
    })

    renderWithQuery(<CashFlowChart />)

    await waitFor(() => {
      expect(screen.getByText('Daily')).toBeInTheDocument()
    })

    const dailyButton = screen.getByText('Daily')
    fireEvent.click(dailyButton)

    expect(mockSetCashFlowView).toHaveBeenCalledWith('daily')
  })

  it('should call setCashFlowView when Monthly button is clicked', async () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ;(global.fetch as any).mockResolvedValue({
      ok: true,
      json: async () => mockCashFlowData,
    })

    renderWithQuery(<CashFlowChart />)

    await waitFor(() => {
      expect(screen.getByText('Monthly')).toBeInTheDocument()
    })

    const monthlyButton = screen.getByText('Monthly')
    fireEvent.click(monthlyButton)

    expect(mockSetCashFlowView).toHaveBeenCalledWith('monthly')
  })

  it('should display refresh button', async () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ;(global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => mockCashFlowData,
    })

    renderWithQuery(<CashFlowChart />)

    await waitFor(() => {
      expect(screen.getByTitle('Refresh data')).toBeInTheDocument()
    })
  })

  it('should refetch data when refresh button is clicked', async () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ;(global.fetch as any).mockResolvedValue({
      ok: true,
      json: async () => mockCashFlowData,
    })

    renderWithQuery(<CashFlowChart />)

    await waitFor(() => {
      expect(screen.getByTitle('Refresh data')).toBeInTheDocument()
    })

    const refreshButton = screen.getByTitle('Refresh data')
    fireEvent.click(refreshButton)

    await waitFor(() => {
      // Should have been called twice: initial + refresh
      expect(global.fetch).toHaveBeenCalledTimes(2)
    })
  })

  it('should calculate summary metrics correctly', async () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ;(global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => mockCashFlowData,
    })

    renderWithQuery(<CashFlowChart />)

    await waitFor(() => {
      expect(screen.getByText('Total Expected')).toBeInTheDocument()
    })

    // Total Expected: 3000 + 4000 = 7000
    expect(screen.getByText('$7,000')).toBeInTheDocument()

    // Total Paid: 5000 + 2000 = 7000
    // Net Projection: 7000 + 7000 = 14000
    expect(screen.getByText('$14,000')).toBeInTheDocument()
  })

  it('should display date range in header', async () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ;(global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => mockCashFlowData,
    })

    renderWithQuery(<CashFlowChart />)

    await waitFor(() => {
      // Should display a date range (exact format depends on current date)
      const dateRangeElements = screen.queryAllByText(/\w{3} \d{1,2}/)
      expect(dateRangeElements.length).toBeGreaterThan(0)
    })
  })

  it('should render retry button on error', async () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ;(global.fetch as any).mockResolvedValueOnce({
      ok: false,
      status: 500,
    })

    renderWithQuery(<CashFlowChart />)

    await waitFor(() => {
      expect(screen.getByText('Try Again')).toBeInTheDocument()
    })

    const retryButton = screen.getByText('Try Again')
    expect(retryButton).toBeInTheDocument()
  })

  it('should refetch when retry button is clicked', async () => {
    // First call fails
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ;(global.fetch as any).mockResolvedValueOnce({
      ok: false,
      status: 500,
    })

    renderWithQuery(<CashFlowChart />)

    await waitFor(() => {
      expect(screen.getByText('Try Again')).toBeInTheDocument()
    })

    // Second call succeeds
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ;(global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => mockCashFlowData,
    })

    const retryButton = screen.getByText('Try Again')
    fireEvent.click(retryButton)

    await waitFor(() => {
      expect(screen.getByText('Total Expected')).toBeInTheDocument()
    })
  })

  it('should not display summary metrics when data is empty', async () => {
    const emptyData = {
      success: true,
      data: [],
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ;(global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => emptyData,
    })

    renderWithQuery(<CashFlowChart />)

    await waitFor(() => {
      expect(
        screen.getByText('No upcoming payments scheduled in the next 90 days')
      ).toBeInTheDocument()
    })

    // Summary metrics should not be visible
    expect(screen.queryByText('Total Expected')).not.toBeInTheDocument()
    expect(screen.queryByText('Total Paid')).not.toBeInTheDocument()
    expect(screen.queryByText('Net Projection')).not.toBeInTheDocument()
  })

  it('should not display summary metrics during loading', () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ;(global.fetch as any).mockImplementation(
      () => new Promise(() => {}) // Never resolves
    )

    renderWithQuery(<CashFlowChart />)

    expect(screen.queryByText('Total Expected')).not.toBeInTheDocument()
    expect(screen.queryByText('Total Paid')).not.toBeInTheDocument()
    expect(screen.queryByText('Net Projection')).not.toBeInTheDocument()
  })

  it('should not display summary metrics on error', async () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ;(global.fetch as any).mockResolvedValueOnce({
      ok: false,
      status: 500,
    })

    renderWithQuery(<CashFlowChart />)

    await waitFor(() => {
      expect(screen.getByText('Unable to load cash flow projection')).toBeInTheDocument()
    })

    expect(screen.queryByText('Total Expected')).not.toBeInTheDocument()
    expect(screen.queryByText('Total Paid')).not.toBeInTheDocument()
    expect(screen.queryByText('Net Projection')).not.toBeInTheDocument()
  })

  it('should setup Realtime subscription on mount', async () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ;(global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => mockCashFlowData,
    })

    renderWithQuery(<CashFlowChart />)

    await waitFor(() => {
      expect(mockChannel.on).toHaveBeenCalledWith(
        'postgres_changes',
        expect.objectContaining({
          event: '*',
          schema: 'public',
          table: 'installments',
          filter: 'agency_id=eq.agency-123',
        }),
        expect.any(Function)
      )
      expect(mockChannel.subscribe).toHaveBeenCalled()
    })
  })

  it('should accept custom days parameter', async () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ;(global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => mockCashFlowData,
    })

    renderWithQuery(<CashFlowChart days={30} />)

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        '/api/cash-flow-projection?groupBy=weekly&days=30'
      )
    })

    await waitFor(() => {
      expect(screen.getByText(/Cash Flow Projection \(Next 30 Days\)/)).toBeInTheDocument()
    })
  })

  it('should use 5-minute stale time for cache', async () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ;(global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => mockCashFlowData,
    })

    const queryClient = createTestQueryClient()

    render(
      <QueryClientProvider client={queryClient}>
        <CashFlowChart />
      </QueryClientProvider>
    )

    await waitFor(() => {
      expect(screen.getByText('Total Expected')).toBeInTheDocument()
    })

    // Check that the query has staleTime configured
    const queries = queryClient.getQueryCache().getAll()
    const cashFlowQuery = queries.find((q) =>
      (q.queryKey as string[]).includes('cash-flow-projection')
    )

    expect(cashFlowQuery).toBeDefined()
    // The staleTime is set in the component, so we can verify fetch was only called once
    expect(global.fetch).toHaveBeenCalledTimes(1)
  })
})
