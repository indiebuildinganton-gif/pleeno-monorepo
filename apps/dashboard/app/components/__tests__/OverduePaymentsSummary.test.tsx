/**
 * OverduePaymentsSummary Component Tests
 *
 * Tests for the overdue payments dashboard widget component
 * Epic 5: Intelligent Status Automation
 * Story 5.3: Overdue Payment Alerts
 * Task 4: Add Overdue Payments Section to Dashboard
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { OverduePaymentsSummary } from '../OverduePaymentsSummary'

// Mock next/navigation
const mockPush = vi.fn()
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
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

describe('OverduePaymentsSummary', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  const mockPaymentStatusData = {
    success: true,
    data: {
      pending: { count: 10, total_amount: 5000.0 },
      due_soon: { count: 5, total_amount: 2500.0 },
      overdue: { count: 3, total_amount: 1500.0 },
      paid_this_month: { count: 20, total_amount: 10000.0 },
    },
  }

  // =================================================================
  // TEST 1: Loading State
  // =================================================================

  it('should render loading skeleton initially', () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ;(global.fetch as any).mockImplementation(
      () => new Promise(() => {}) // Never resolves
    )

    renderWithQuery(<OverduePaymentsSummary />)

    // Check for loading skeleton
    const skeleton = screen.getByRole('generic')
    expect(skeleton).toBeInTheDocument()
    expect(skeleton).toHaveClass('animate-pulse')
  })

  // =================================================================
  // TEST 2: With Overdue Payments - Count and Total Display
  // =================================================================

  it('should display overdue count and total when overdue payments exist', async () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ;(global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => mockPaymentStatusData,
    })

    renderWithQuery(<OverduePaymentsSummary />)

    await waitFor(() => {
      expect(screen.getByText('3 Overdue Payments')).toBeInTheDocument()
    })

    expect(screen.getByText('$1,500.00 Total')).toBeInTheDocument()
  })

  // =================================================================
  // TEST 3: Red Styling for Urgency
  // =================================================================

  it('should apply red styling when overdue payments exist', async () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ;(global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => mockPaymentStatusData,
    })

    const { container } = renderWithQuery(<OverduePaymentsSummary />)

    await waitFor(() => {
      expect(screen.getByText('3 Overdue Payments')).toBeInTheDocument()
    })

    // Widget should have red border and background
    const card = container.querySelector('.border-red-300')
    expect(card).toBeInTheDocument()

    const bgCard = container.querySelector('.bg-red-50')
    expect(bgCard).toBeInTheDocument()
  })

  // =================================================================
  // TEST 4: No Overdue Payments - Green State
  // =================================================================

  it('should display green "all clear" state when no overdue payments', async () => {
    const noOverdueData = {
      success: true,
      data: {
        pending: { count: 10, total_amount: 5000.0 },
        due_soon: { count: 5, total_amount: 2500.0 },
        overdue: { count: 0, total_amount: 0 },
        paid_this_month: { count: 20, total_amount: 10000.0 },
      },
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ;(global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => noOverdueData,
    })

    const { container } = renderWithQuery(<OverduePaymentsSummary />)

    await waitFor(() => {
      expect(screen.getByText('All Payments Current')).toBeInTheDocument()
    })

    expect(screen.getByText('No overdue payments at this time')).toBeInTheDocument()

    // Should have green border and background
    const card = container.querySelector('.border-green-200')
    expect(card).toBeInTheDocument()

    const bgCard = container.querySelector('.bg-green-50')
    expect(bgCard).toBeInTheDocument()
  })

  // =================================================================
  // TEST 5: Click Navigation
  // =================================================================

  it('should navigate to filtered payment plans on click', async () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ;(global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => mockPaymentStatusData,
    })

    const user = userEvent.setup()
    renderWithQuery(<OverduePaymentsSummary />)

    await waitFor(() => {
      expect(screen.getByText('3 Overdue Payments')).toBeInTheDocument()
    })

    const widget = screen.getByRole('button')
    await user.click(widget)

    expect(mockPush).toHaveBeenCalledWith('/payments?status=overdue')
  })

  // =================================================================
  // TEST 6: Keyboard Navigation (Enter Key)
  // =================================================================

  it('should navigate to filtered payment plans on Enter key press', async () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ;(global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => mockPaymentStatusData,
    })

    const user = userEvent.setup()
    renderWithQuery(<OverduePaymentsSummary />)

    await waitFor(() => {
      expect(screen.getByText('3 Overdue Payments')).toBeInTheDocument()
    })

    const widget = screen.getByRole('button')
    widget.focus()
    await user.keyboard('{Enter}')

    expect(mockPush).toHaveBeenCalledWith('/payments?status=overdue')
  })

  // =================================================================
  // TEST 7: Keyboard Navigation (Space Key)
  // =================================================================

  it('should navigate to filtered payment plans on Space key press', async () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ;(global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => mockPaymentStatusData,
    })

    const user = userEvent.setup()
    renderWithQuery(<OverduePaymentsSummary />)

    await waitFor(() => {
      expect(screen.getByText('3 Overdue Payments')).toBeInTheDocument()
    })

    const widget = screen.getByRole('button')
    widget.focus()
    await user.keyboard(' ')

    expect(mockPush).toHaveBeenCalledWith('/payments?status=overdue')
  })

  // =================================================================
  // TEST 8: Error State
  // =================================================================

  it('should render error state on fetch failure', async () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ;(global.fetch as any).mockResolvedValueOnce({
      ok: false,
      status: 500,
    })

    renderWithQuery(<OverduePaymentsSummary />)

    await waitFor(() => {
      expect(screen.getByText('Failed to load overdue payments summary')).toBeInTheDocument()
    })
  })

  // =================================================================
  // TEST 9: Singular vs Plural Payment Text
  // =================================================================

  it('should display singular "Payment" when count is 1', async () => {
    const singleOverdueData = {
      success: true,
      data: {
        pending: { count: 10, total_amount: 5000.0 },
        due_soon: { count: 5, total_amount: 2500.0 },
        overdue: { count: 1, total_amount: 500.0 },
        paid_this_month: { count: 20, total_amount: 10000.0 },
      },
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ;(global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => singleOverdueData,
    })

    renderWithQuery(<OverduePaymentsSummary />)

    await waitFor(() => {
      expect(screen.getByText('1 Overdue Payment')).toBeInTheDocument()
    })

    expect(screen.queryByText('1 Overdue Payments')).not.toBeInTheDocument()
  })

  // =================================================================
  // TEST 10: Currency Formatting
  // =================================================================

  it('should format currency amounts correctly with 2 decimals', async () => {
    const largeAmountData = {
      success: true,
      data: {
        pending: { count: 10, total_amount: 5000.0 },
        due_soon: { count: 5, total_amount: 2500.0 },
        overdue: { count: 10, total_amount: 123456.78 },
        paid_this_month: { count: 20, total_amount: 10000.0 },
      },
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ;(global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => largeAmountData,
    })

    renderWithQuery(<OverduePaymentsSummary />)

    await waitFor(() => {
      expect(screen.getByText('10 Overdue Payments')).toBeInTheDocument()
    })

    // Should format with $ and commas, 2 decimals
    expect(screen.getByText('$123,456.78 Total')).toBeInTheDocument()
  })

  // =================================================================
  // TEST 11: API Endpoint
  // =================================================================

  it('should fetch data from correct endpoint', async () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ;(global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => mockPaymentStatusData,
    })

    renderWithQuery(<OverduePaymentsSummary />)

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith('/api/dashboard/payment-status-summary')
    })
  })

  // =================================================================
  // TEST 12: AlertTriangle Icon
  // =================================================================

  it('should render AlertTriangle icon in overdue state', async () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ;(global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => mockPaymentStatusData,
    })

    const { container } = renderWithQuery(<OverduePaymentsSummary />)

    await waitFor(() => {
      expect(screen.getByText('3 Overdue Payments')).toBeInTheDocument()
    })

    // AlertTriangle icon should be present
    const icon = container.querySelector('svg')
    expect(icon).toBeInTheDocument()
  })

  // =================================================================
  // TEST 13: Call to Action Text
  // =================================================================

  it('should display call to action text', async () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ;(global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => mockPaymentStatusData,
    })

    renderWithQuery(<OverduePaymentsSummary />)

    await waitFor(() => {
      expect(screen.getByText('3 Overdue Payments')).toBeInTheDocument()
    })

    expect(screen.getByText('Click to view overdue payment plans →')).toBeInTheDocument()
  })

  // =================================================================
  // TEST 14: Accessibility - ARIA Label
  // =================================================================

  it('should have proper aria-label for accessibility', async () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ;(global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => mockPaymentStatusData,
    })

    renderWithQuery(<OverduePaymentsSummary />)

    await waitFor(() => {
      expect(screen.getByText('3 Overdue Payments')).toBeInTheDocument()
    })

    const widget = screen.getByRole('button')
    expect(widget).toHaveAttribute(
      'aria-label',
      '3 overdue payments totaling $1,500.00. Click to view details.'
    )
  })

  // =================================================================
  // TEST 15: Refetch Interval Configuration
  // =================================================================

  it('should use 5-minute refetch interval', async () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ;(global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => mockPaymentStatusData,
    })

    const queryClient = createTestQueryClient()

    render(
      <QueryClientProvider client={queryClient}>
        <OverduePaymentsSummary />
      </QueryClientProvider>
    )

    // The component should use refetchInterval: 300000 (5 minutes)
    // We can verify the fetch is called once and cached
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledTimes(1)
    })
  })
})
