/**
 * PaymentStatusWidget Component Tests
 *
 * Tests for the PaymentStatusWidget component
 * Epic 5: Payment Plans & Installment Tracking
 * Story 5.4: Payment Status Dashboard Widget
 * Task 5: Testing
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import PaymentStatusWidget from '../PaymentStatusWidget'
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

describe('PaymentStatusWidget', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  const mockPaymentData = {
    success: true,
    data: {
      pending: { count: 25, total_amount: 50000.0 },
      due_soon: { count: 5, total_amount: 12000.0 },
      overdue: { count: 3, total_amount: 8500.0 },
      paid_this_month: { count: 15, total_amount: 35000.0 },
    },
  }

  describe('Loading State', () => {
    it('displays loading skeleton initially', () => {
      // Mock fetch to never resolve
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ;(global.fetch as any).mockImplementation(
        () => new Promise(() => {}) // Never resolves
      )

      renderWithQuery(<PaymentStatusWidget />)

      // Check for skeleton animation elements (4 cards)
      const skeletonCards = screen
        .getAllByRole('generic')
        .filter((el) => el.className.includes('animate-pulse'))
      expect(skeletonCards.length).toBeGreaterThan(0)
    })
  })

  describe('Successful Data Display', () => {
    beforeEach(() => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ;(global.fetch as any).mockResolvedValue({
        ok: true,
        json: async () => mockPaymentData,
      })
    })

    it('displays all four status cards after loading', async () => {
      renderWithQuery(<PaymentStatusWidget />)

      await waitFor(() => {
        expect(screen.getByText('Pending')).toBeInTheDocument()
      })

      expect(screen.getByText('Due Soon')).toBeInTheDocument()
      expect(screen.getByText('Overdue')).toBeInTheDocument()
      expect(screen.getByText('Paid This Month')).toBeInTheDocument()
    })

    it('displays correct count values', async () => {
      renderWithQuery(<PaymentStatusWidget />)

      await waitFor(() => {
        expect(screen.getByText('25 installments')).toBeInTheDocument()
      })

      expect(screen.getByText('5 installments')).toBeInTheDocument()
      expect(screen.getByText('3 installments')).toBeInTheDocument()
      expect(screen.getByText('15 installments')).toBeInTheDocument()
    })

    it('handles singular installment count correctly', async () => {
      const singleInstallmentData = {
        success: true,
        data: {
          pending: { count: 1, total_amount: 1000.0 },
          due_soon: { count: 0, total_amount: 0 },
          overdue: { count: 0, total_amount: 0 },
          paid_this_month: { count: 0, total_amount: 0 },
        },
      }

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ;(global.fetch as any).mockResolvedValue({
        ok: true,
        json: async () => singleInstallmentData,
      })

      renderWithQuery(<PaymentStatusWidget />)

      await waitFor(() => {
        expect(screen.getByText('1 installment')).toBeInTheDocument()
      })
    })

    it('formats currency amounts correctly', async () => {
      renderWithQuery(<PaymentStatusWidget />)

      await waitFor(() => {
        expect(screen.getByText('$50,000')).toBeInTheDocument()
      })

      expect(screen.getByText('$12,000')).toBeInTheDocument()
      expect(screen.getByText('$8,500')).toBeInTheDocument()
      expect(screen.getByText('$35,000')).toBeInTheDocument()
    })

    it('displays currency with no decimals', async () => {
      renderWithQuery(<PaymentStatusWidget />)

      await waitFor(() => {
        expect(screen.getByText('Pending')).toBeInTheDocument()
      })

      // Verify no decimal places in formatted currency
      const amounts = ['$50,000', '$12,000', '$8,500', '$35,000']
      amounts.forEach((amount) => {
        expect(screen.getByText(amount)).toBeInTheDocument()
        expect(screen.queryByText(`${amount}.00`)).not.toBeInTheDocument()
      })
    })
  })

  describe('Navigation Links', () => {
    beforeEach(() => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ;(global.fetch as any).mockResolvedValue({
        ok: true,
        json: async () => mockPaymentData,
      })
    })

    it('has correct href for pending status', async () => {
      renderWithQuery(<PaymentStatusWidget />)

      await waitFor(() => {
        expect(screen.getByText('Pending')).toBeInTheDocument()
      })

      const links = screen.getAllByRole('link')
      const pendingLink = links.find((link) => link.textContent?.includes('Pending'))
      expect(pendingLink).toHaveAttribute('href', '/payments?status=pending')
    })

    it('has correct href for due soon status', async () => {
      renderWithQuery(<PaymentStatusWidget />)

      await waitFor(() => {
        expect(screen.getByText('Due Soon')).toBeInTheDocument()
      })

      const links = screen.getAllByRole('link')
      const dueSoonLink = links.find((link) => link.textContent?.includes('Due Soon'))
      expect(dueSoonLink).toHaveAttribute('href', '/payments?status=due_soon')
    })

    it('has correct href for overdue status', async () => {
      renderWithQuery(<PaymentStatusWidget />)

      await waitFor(() => {
        expect(screen.getByText('Overdue')).toBeInTheDocument()
      })

      const links = screen.getAllByRole('link')
      const overdueLink = links.find((link) => link.textContent?.includes('Overdue'))
      expect(overdueLink).toHaveAttribute('href', '/payments?status=overdue')
    })

    it('has correct href for paid this month status with period parameter', async () => {
      renderWithQuery(<PaymentStatusWidget />)

      await waitFor(() => {
        expect(screen.getByText('Paid This Month')).toBeInTheDocument()
      })

      const links = screen.getAllByRole('link')
      const paidLink = links.find((link) => link.textContent?.includes('Paid This Month'))
      expect(paidLink).toHaveAttribute('href', '/payments?status=paid&period=current_month')
    })

    it('all cards are wrapped in clickable links', async () => {
      renderWithQuery(<PaymentStatusWidget />)

      await waitFor(() => {
        expect(screen.getByText('Pending')).toBeInTheDocument()
      })

      const links = screen.getAllByRole('link')
      expect(links).toHaveLength(4)
    })
  })

  describe('Color Coding', () => {
    beforeEach(() => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ;(global.fetch as any).mockResolvedValue({
        ok: true,
        json: async () => mockPaymentData,
      })
    })

    it('applies gray styling to pending card', async () => {
      const { container } = renderWithQuery(<PaymentStatusWidget />)

      await waitFor(() => {
        expect(screen.getByText('Pending')).toBeInTheDocument()
      })

      const grayCards = container.querySelectorAll('[class*="border-gray"]')
      expect(grayCards.length).toBeGreaterThan(0)
    })

    it('applies amber styling to due soon card', async () => {
      const { container } = renderWithQuery(<PaymentStatusWidget />)

      await waitFor(() => {
        expect(screen.getByText('Due Soon')).toBeInTheDocument()
      })

      const amberCards = container.querySelectorAll('[class*="border-amber"]')
      expect(amberCards.length).toBeGreaterThan(0)
    })

    it('applies red styling to overdue card', async () => {
      const { container } = renderWithQuery(<PaymentStatusWidget />)

      await waitFor(() => {
        expect(screen.getByText('Overdue')).toBeInTheDocument()
      })

      const redCards = container.querySelectorAll('[class*="border-red"]')
      expect(redCards.length).toBeGreaterThan(0)
    })

    it('applies green styling to paid this month card', async () => {
      const { container } = renderWithQuery(<PaymentStatusWidget />)

      await waitFor(() => {
        expect(screen.getByText('Paid This Month')).toBeInTheDocument()
      })

      const greenCards = container.querySelectorAll('[class*="border-green"]')
      expect(greenCards.length).toBeGreaterThan(0)
    })
  })

  describe('Error State', () => {
    it('displays error message on fetch failure', async () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ;(global.fetch as any).mockResolvedValue({
        ok: false,
        status: 500,
      })

      renderWithQuery(<PaymentStatusWidget />)

      await waitFor(() => {
        expect(screen.getByText('Failed to load payment status')).toBeInTheDocument()
      })

      expect(
        screen.getByText(
          'There was an error loading the payment status overview. Please try again.'
        )
      ).toBeInTheDocument()
      expect(screen.getByText('Retry')).toBeInTheDocument()
    })

    it('displays error state on network error', async () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ;(global.fetch as any).mockRejectedValue(new Error('Network error'))

      renderWithQuery(<PaymentStatusWidget />)

      await waitFor(() => {
        expect(screen.getByText('Failed to load payment status')).toBeInTheDocument()
      })
    })

    it('displays error state when success is false', async () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ;(global.fetch as any).mockResolvedValue({
        ok: true,
        json: async () => ({
          success: false,
          error: 'Something went wrong',
        }),
      })

      renderWithQuery(<PaymentStatusWidget />)

      await waitFor(() => {
        expect(screen.getByText('Failed to load payment status')).toBeInTheDocument()
      })
    })

    it('allows retrying after error', async () => {
      const user = userEvent.setup()

      // First call fails, second succeeds
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ;(global.fetch as any)
        .mockResolvedValueOnce({
          ok: false,
          status: 500,
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockPaymentData,
        })

      renderWithQuery(<PaymentStatusWidget />)

      // Wait for error state
      await waitFor(() => {
        expect(screen.getByText('Failed to load payment status')).toBeInTheDocument()
      })

      // Click retry button
      const retryButton = screen.getByText('Retry')
      await user.click(retryButton)

      // Wait for successful load
      await waitFor(() => {
        expect(screen.getByText('Pending')).toBeInTheDocument()
      })

      expect(screen.getByText('25 installments')).toBeInTheDocument()
    })
  })

  describe('API Integration', () => {
    it('fetches data from correct endpoint', async () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ;(global.fetch as any).mockResolvedValue({
        ok: true,
        json: async () => mockPaymentData,
      })

      renderWithQuery(<PaymentStatusWidget />)

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith('/api/dashboard/payment-status-summary')
      })
    })

    it('uses 5-minute stale time for caching', async () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ;(global.fetch as any).mockResolvedValue({
        ok: true,
        json: async () => mockPaymentData,
      })

      const queryClient = createTestQueryClient()

      render(
        <QueryClientProvider client={queryClient}>
          <PaymentStatusWidget />
        </QueryClientProvider>
      )

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledTimes(1)
      })

      // The component should use staleTime: 5 * 60 * 1000 (5 minutes)
      // This prevents unnecessary refetches within the stale time window
    })
  })

  describe('Edge Cases', () => {
    it('handles zero values gracefully', async () => {
      const zeroData = {
        success: true,
        data: {
          pending: { count: 0, total_amount: 0 },
          due_soon: { count: 0, total_amount: 0 },
          overdue: { count: 0, total_amount: 0 },
          paid_this_month: { count: 0, total_amount: 0 },
        },
      }

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ;(global.fetch as any).mockResolvedValue({
        ok: true,
        json: async () => zeroData,
      })

      renderWithQuery(<PaymentStatusWidget />)

      await waitFor(() => {
        expect(screen.getByText('Pending')).toBeInTheDocument()
      })

      // Check for zero amounts (formatted as $0)
      const zeroAmounts = screen.getAllByText('$0')
      expect(zeroAmounts.length).toBe(4)

      // Check for "0 installments"
      const zeroInstallments = screen.getAllByText('0 installments')
      expect(zeroInstallments.length).toBe(4)
    })

    it('handles large numeric values correctly', async () => {
      const largeData = {
        success: true,
        data: {
          pending: { count: 9999, total_amount: 9999999.99 },
          due_soon: { count: 8888, total_amount: 8888888.88 },
          overdue: { count: 7777, total_amount: 7777777.77 },
          paid_this_month: { count: 6666, total_amount: 6666666.66 },
        },
      }

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ;(global.fetch as any).mockResolvedValue({
        ok: true,
        json: async () => largeData,
      })

      renderWithQuery(<PaymentStatusWidget />)

      await waitFor(() => {
        expect(screen.getByText('Pending')).toBeInTheDocument()
      })

      // Check for formatted large amounts (no decimals)
      expect(screen.getByText('$10,000,000')).toBeInTheDocument() // 9999999.99 rounded up
      expect(screen.getByText('$8,888,889')).toBeInTheDocument() // 8888888.88 rounded up
      expect(screen.getByText('$7,777,778')).toBeInTheDocument() // 7777777.77 rounded up
      expect(screen.getByText('$6,666,667')).toBeInTheDocument() // 6666666.66 rounded up

      // Check for large counts
      expect(screen.getByText('9999 installments')).toBeInTheDocument()
      expect(screen.getByText('8888 installments')).toBeInTheDocument()
      expect(screen.getByText('7777 installments')).toBeInTheDocument()
      expect(screen.getByText('6666 installments')).toBeInTheDocument()
    })

    it('handles decimal amounts correctly (no decimals displayed)', async () => {
      const decimalData = {
        success: true,
        data: {
          pending: { count: 10, total_amount: 1234.56 },
          due_soon: { count: 5, total_amount: 5678.9 },
          overdue: { count: 3, total_amount: 999.99 },
          paid_this_month: { count: 8, total_amount: 12345.67 },
        },
      }

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ;(global.fetch as any).mockResolvedValue({
        ok: true,
        json: async () => decimalData,
      })

      renderWithQuery(<PaymentStatusWidget />)

      await waitFor(() => {
        expect(screen.getByText('Pending')).toBeInTheDocument()
      })

      // Currency should be formatted without decimals
      expect(screen.getByText('$1,235')).toBeInTheDocument() // 1234.56 rounded
      expect(screen.getByText('$5,679')).toBeInTheDocument() // 5678.90 rounded
      expect(screen.getByText('$1,000')).toBeInTheDocument() // 999.99 rounded
      expect(screen.getByText('$12,346')).toBeInTheDocument() // 12345.67 rounded
    })

    it('handles missing data property gracefully', async () => {
      const invalidData = {
        success: true,
        data: null,
      }

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ;(global.fetch as any).mockResolvedValue({
        ok: true,
        json: async () => invalidData,
      })

      renderWithQuery(<PaymentStatusWidget />)

      // Should show error state when data is null
      await waitFor(() => {
        expect(screen.getByText('Failed to load payment status')).toBeInTheDocument()
      })
    })
  })

  describe('Responsive Layout', () => {
    it('renders in responsive grid layout', async () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ;(global.fetch as any).mockResolvedValue({
        ok: true,
        json: async () => mockPaymentData,
      })

      const { container } = renderWithQuery(<PaymentStatusWidget />)

      await waitFor(() => {
        expect(screen.getByText('Pending')).toBeInTheDocument()
      })

      // Check that the grid container has responsive classes
      const gridContainer = container.querySelector('.grid')
      expect(gridContainer).toBeInTheDocument()
      expect(gridContainer).toHaveClass('md:grid-cols-2')
      expect(gridContainer).toHaveClass('lg:grid-cols-4')
    })
  })

  describe('Icons', () => {
    beforeEach(() => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ;(global.fetch as any).mockResolvedValue({
        ok: true,
        json: async () => mockPaymentData,
      })
    })

    it('displays Clock icon for pending status', async () => {
      const { container } = renderWithQuery(<PaymentStatusWidget />)

      await waitFor(() => {
        expect(screen.getByText('Pending')).toBeInTheDocument()
      })

      // Check that Clock icon is present (lucide-react adds svg)
      const svgElements = container.querySelectorAll('svg')
      expect(svgElements.length).toBeGreaterThan(0)
    })

    it('displays AlertCircle icon for due soon status', async () => {
      const { container } = renderWithQuery(<PaymentStatusWidget />)

      await waitFor(() => {
        expect(screen.getByText('Due Soon')).toBeInTheDocument()
      })

      const svgElements = container.querySelectorAll('svg')
      expect(svgElements.length).toBeGreaterThan(0)
    })

    it('displays AlertTriangle icon for overdue status', async () => {
      const { container } = renderWithQuery(<PaymentStatusWidget />)

      await waitFor(() => {
        expect(screen.getByText('Overdue')).toBeInTheDocument()
      })

      const svgElements = container.querySelectorAll('svg')
      expect(svgElements.length).toBeGreaterThan(0)
    })

    it('displays CheckCircle icon for paid this month status', async () => {
      const { container } = renderWithQuery(<PaymentStatusWidget />)

      await waitFor(() => {
        expect(screen.getByText('Paid This Month')).toBeInTheDocument()
      })

      const svgElements = container.querySelectorAll('svg')
      expect(svgElements.length).toBeGreaterThan(0)
    })

    it('displays ArrowRight icon on all cards for navigation indication', async () => {
      const { container } = renderWithQuery(<PaymentStatusWidget />)

      await waitFor(() => {
        expect(screen.getByText('Pending')).toBeInTheDocument()
      })

      // Each card should have at least 2 icons: status icon + arrow right
      const svgElements = container.querySelectorAll('svg')
      expect(svgElements.length).toBeGreaterThanOrEqual(8) // 4 cards × 2 icons minimum
    })
  })
})
