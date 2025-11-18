/**
 * Payment History Section Component Tests
 *
 * Story 7.5: Student Payment History Report
 * Task 9: Testing and Validation
 *
 * Comprehensive tests for PaymentHistorySection component
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { PaymentHistorySection } from '../PaymentHistorySection'

// Mock fetch
global.fetch = vi.fn()

// Mock window.open
global.window.open = vi.fn()

describe('PaymentHistorySection', () => {
  const mockStudentId = 'student-123'

  const mockPaymentHistory = [
    {
      payment_plan_id: 'plan-1',
      college_name: 'Imagine Education',
      branch_name: 'Brisbane Campus',
      program_name: 'Certificate IV',
      plan_total_amount: 20000,
      plan_start_date: '2025-01-01',
      plan_status: 'active',
      installments: [
        {
          installment_id: 'inst-1',
          installment_number: 1,
          amount: 5000,
          due_date: '2025-01-15',
          paid_at: '2025-01-10',
          paid_amount: 5000,
          status: 'paid',
        },
        {
          installment_id: 'inst-2',
          installment_number: 2,
          amount: 5000,
          due_date: '2025-02-15',
          paid_at: null,
          paid_amount: null,
          status: 'pending',
        },
      ],
    },
  ]

  const mockSummary = {
    total_paid: 5000,
    total_outstanding: 15000,
    percentage_paid: 25,
  }

  beforeEach(() => {
    vi.clearAllMocks()
    ;(global.fetch as any).mockResolvedValue({
      ok: true,
      json: async () => ({
        data: mockPaymentHistory,
        summary: mockSummary,
      }),
    })
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('Initial Render and Data Loading', () => {
    it('should render the component with title', async () => {
      render(<PaymentHistorySection studentId={mockStudentId} />)

      expect(screen.getByText('Payment History')).toBeInTheDocument()
    })

    it('should fetch payment history on mount', async () => {
      render(<PaymentHistorySection studentId={mockStudentId} />)

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(
          expect.stringContaining(`/api/students/${mockStudentId}/payment-history`)
        )
      })
    })

    it('should display loading state while fetching', async () => {
      ;(global.fetch as any).mockImplementation(
        () =>
          new Promise((resolve) => {
            setTimeout(() => {
              resolve({
                ok: true,
                json: async () => ({ data: [], summary: mockSummary }),
              })
            }, 100)
          })
      )

      render(<PaymentHistorySection studentId={mockStudentId} />)

      expect(screen.getByText('Loading payment history...')).toBeInTheDocument()
    })

    it('should display payment history after loading', async () => {
      render(<PaymentHistorySection studentId={mockStudentId} />)

      await waitFor(() => {
        expect(screen.getByText('Imagine Education')).toBeInTheDocument()
      })

      expect(screen.getByText(/Brisbane Campus/)).toBeInTheDocument()
      expect(screen.getByText(/Certificate IV/)).toBeInTheDocument()
    })
  })

  describe('Summary Display', () => {
    it('should display summary totals correctly', async () => {
      render(<PaymentHistorySection studentId={mockStudentId} />)

      await waitFor(() => {
        expect(screen.getByText('$5,000.00')).toBeInTheDocument()
      })

      expect(screen.getByText('$15,000.00')).toBeInTheDocument()
      expect(screen.getByText('25.0%')).toBeInTheDocument()
    })

    it('should display Total Paid label', async () => {
      render(<PaymentHistorySection studentId={mockStudentId} />)

      await waitFor(() => {
        expect(screen.getByText('Total Paid')).toBeInTheDocument()
      })
    })

    it('should display Total Outstanding label', async () => {
      render(<PaymentHistorySection studentId={mockStudentId} />)

      await waitFor(() => {
        expect(screen.getByText('Total Outstanding')).toBeInTheDocument()
      })
    })

    it('should display Percentage Paid label', async () => {
      render(<PaymentHistorySection studentId={mockStudentId} />)

      await waitFor(() => {
        expect(screen.getByText('Percentage Paid')).toBeInTheDocument()
      })
    })
  })

  describe('Payment Plan Display', () => {
    it('should display payment plan details', async () => {
      render(<PaymentHistorySection studentId={mockStudentId} />)

      await waitFor(() => {
        expect(screen.getByText('Imagine Education')).toBeInTheDocument()
      })

      expect(screen.getByText(/Brisbane Campus/)).toBeInTheDocument()
      expect(screen.getByText(/Certificate IV/)).toBeInTheDocument()
      expect(screen.getByText('$20,000.00')).toBeInTheDocument()
    })

    it('should display payment plan count', async () => {
      render(<PaymentHistorySection studentId={mockStudentId} />)

      await waitFor(() => {
        expect(screen.getByText('1 payment plan')).toBeInTheDocument()
      })
    })

    it('should display multiple payment plans count', async () => {
      const multiplePaymentHistory = [
        ...mockPaymentHistory,
        {
          payment_plan_id: 'plan-2',
          college_name: 'Other College',
          branch_name: 'Sydney Campus',
          program_name: 'Diploma',
          plan_total_amount: 15000,
          plan_start_date: '2024-06-01',
          plan_status: 'completed',
          installments: [],
        },
      ]

      ;(global.fetch as any).mockResolvedValue({
        ok: true,
        json: async () => ({
          data: multiplePaymentHistory,
          summary: mockSummary,
        }),
      })

      render(<PaymentHistorySection studentId={mockStudentId} />)

      await waitFor(() => {
        expect(screen.getByText('2 payment plans')).toBeInTheDocument()
      })
    })

    it('should display installments table', async () => {
      render(<PaymentHistorySection studentId={mockStudentId} />)

      await waitFor(() => {
        expect(screen.getByText('Due Date')).toBeInTheDocument()
      })

      expect(screen.getByText('Amount')).toBeInTheDocument()
      expect(screen.getByText('Paid Amount')).toBeInTheDocument()
      expect(screen.getByText('Paid Date')).toBeInTheDocument()
      expect(screen.getByText('Status')).toBeInTheDocument()
    })

    it('should display installment data', async () => {
      render(<PaymentHistorySection studentId={mockStudentId} />)

      await waitFor(() => {
        expect(screen.getByText('Jan 15, 2025')).toBeInTheDocument()
      })

      expect(screen.getByText('Jan 10, 2025')).toBeInTheDocument()
    })
  })

  describe('Status Badges', () => {
    it('should display paid status badge with correct color', async () => {
      render(<PaymentHistorySection studentId={mockStudentId} />)

      await waitFor(() => {
        const paidBadges = screen.getAllByText('paid')
        expect(paidBadges[0]).toHaveClass('text-green-800')
      })
    })

    it('should display pending status badge with correct color', async () => {
      render(<PaymentHistorySection studentId={mockStudentId} />)

      await waitFor(() => {
        const pendingBadge = screen.getByText('pending')
        expect(pendingBadge).toHaveClass('text-yellow-800')
      })
    })

    it('should display overdue status badge with correct color', async () => {
      const historyWithOverdue = [
        {
          ...mockPaymentHistory[0],
          installments: [
            {
              installment_id: 'inst-3',
              installment_number: 3,
              amount: 5000,
              due_date: '2024-12-15',
              paid_at: null,
              paid_amount: null,
              status: 'overdue',
            },
          ],
        },
      ]

      ;(global.fetch as any).mockResolvedValue({
        ok: true,
        json: async () => ({
          data: historyWithOverdue,
          summary: mockSummary,
        }),
      })

      render(<PaymentHistorySection studentId={mockStudentId} />)

      await waitFor(() => {
        const overdueBadge = screen.getByText('overdue')
        expect(overdueBadge).toHaveClass('text-red-800')
      })
    })

    it('should display cancelled status badge with correct color', async () => {
      const historyWithCancelled = [
        {
          ...mockPaymentHistory[0],
          plan_status: 'cancelled',
          installments: [
            {
              installment_id: 'inst-4',
              installment_number: 1,
              amount: 5000,
              due_date: '2025-01-15',
              paid_at: null,
              paid_amount: null,
              status: 'cancelled',
            },
          ],
        },
      ]

      ;(global.fetch as any).mockResolvedValue({
        ok: true,
        json: async () => ({
          data: historyWithCancelled,
          summary: mockSummary,
        }),
      })

      render(<PaymentHistorySection studentId={mockStudentId} />)

      await waitFor(() => {
        const cancelledBadges = screen.getAllByText('cancelled')
        expect(cancelledBadges[0]).toHaveClass('text-gray-800')
      })
    })
  })

  describe('Date Range Filtering', () => {
    it('should display filter dropdown', async () => {
      render(<PaymentHistorySection studentId={mockStudentId} />)

      await waitFor(() => {
        expect(screen.getByDisplayValue('All Time')).toBeInTheDocument()
      })
    })

    it('should change filter to "This Year"', async () => {
      render(<PaymentHistorySection studentId={mockStudentId} />)

      await waitFor(() => {
        const filterSelect = screen.getByDisplayValue('All Time')
        fireEvent.change(filterSelect, { target: { value: 'thisYear' } })
      })

      expect(screen.getByDisplayValue('This Year')).toBeInTheDocument()
    })

    it('should display custom date inputs when "Custom Range" is selected', async () => {
      render(<PaymentHistorySection studentId={mockStudentId} />)

      await waitFor(() => {
        const filterSelect = screen.getByDisplayValue('All Time')
        fireEvent.change(filterSelect, { target: { value: 'custom' } })
      })

      expect(screen.getByLabelText('From:')).toBeInTheDocument()
      expect(screen.getByLabelText('To:')).toBeInTheDocument()
    })

    it('should fetch data with date range when custom dates are set', async () => {
      render(<PaymentHistorySection studentId={mockStudentId} />)

      await waitFor(() => {
        const filterSelect = screen.getByDisplayValue('All Time')
        fireEvent.change(filterSelect, { target: { value: 'custom' } })
      })

      const dateFromInput = screen.getByLabelText('From:')
      const dateToInput = screen.getByLabelText('To:')

      fireEvent.change(dateFromInput, { target: { value: '2025-01-01' } })
      fireEvent.change(dateToInput, { target: { value: '2025-12-31' } })

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(
          expect.stringContaining('date_from=2025-01-01&date_to=2025-12-31')
        )
      })
    })

    it('should display active filter text', async () => {
      render(<PaymentHistorySection studentId={mockStudentId} />)

      await waitFor(() => {
        expect(screen.getByText('Showing: All Time')).toBeInTheDocument()
      })
    })

    it('should display "This Year" filter text with year', async () => {
      render(<PaymentHistorySection studentId={mockStudentId} />)

      await waitFor(() => {
        const filterSelect = screen.getByDisplayValue('All Time')
        fireEvent.change(filterSelect, { target: { value: 'thisYear' } })
      })

      await waitFor(() => {
        expect(
          screen.getByText(/Showing: This Year \(2025\)/)
        ).toBeInTheDocument()
      })
    })
  })

  describe('Refresh Functionality', () => {
    it('should display refresh button', async () => {
      render(<PaymentHistorySection studentId={mockStudentId} />)

      await waitFor(() => {
        expect(screen.getByText('Refresh')).toBeInTheDocument()
      })
    })

    it('should refetch data when refresh button is clicked', async () => {
      render(<PaymentHistorySection studentId={mockStudentId} />)

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledTimes(1)
      })

      const refreshButton = screen.getByText('Refresh')
      fireEvent.click(refreshButton)

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledTimes(2)
      })
    })
  })

  describe('PDF Export', () => {
    it('should display export PDF button', async () => {
      render(<PaymentHistorySection studentId={mockStudentId} />)

      await waitFor(() => {
        expect(screen.getByText('Export PDF')).toBeInTheDocument()
      })
    })

    it('should open export URL when export button is clicked', async () => {
      render(<PaymentHistorySection studentId={mockStudentId} />)

      await waitFor(() => {
        const exportButton = screen.getByText('Export PDF')
        fireEvent.click(exportButton)
      })

      expect(window.open).toHaveBeenCalledWith(
        expect.stringContaining(
          `/api/students/${mockStudentId}/payment-history/export?format=pdf`
        ),
        '_blank'
      )
    })

    it('should disable export button when no payment history', async () => {
      ;(global.fetch as any).mockResolvedValue({
        ok: true,
        json: async () => ({
          data: [],
          summary: { total_paid: 0, total_outstanding: 0, percentage_paid: 0 },
        }),
      })

      render(<PaymentHistorySection studentId={mockStudentId} />)

      await waitFor(() => {
        const exportButton = screen.getByText('Export PDF')
        expect(exportButton).toBeDisabled()
      })
    })

    it('should include date filters in export URL', async () => {
      render(<PaymentHistorySection studentId={mockStudentId} />)

      await waitFor(() => {
        const filterSelect = screen.getByDisplayValue('All Time')
        fireEvent.change(filterSelect, { target: { value: 'custom' } })
      })

      const dateFromInput = screen.getByLabelText('From:')
      const dateToInput = screen.getByLabelText('To:')

      fireEvent.change(dateFromInput, { target: { value: '2025-01-01' } })
      fireEvent.change(dateToInput, { target: { value: '2025-12-31' } })

      await waitFor(() => {
        const exportButton = screen.getByText('Export PDF')
        fireEvent.click(exportButton)
      })

      expect(window.open).toHaveBeenCalledWith(
        expect.stringContaining('date_from=2025-01-01&date_to=2025-12-31'),
        '_blank'
      )
    })
  })

  describe('Empty State', () => {
    it('should display empty state when no payment history', async () => {
      ;(global.fetch as any).mockResolvedValue({
        ok: true,
        json: async () => ({
          data: [],
          summary: { total_paid: 0, total_outstanding: 0, percentage_paid: 0 },
        }),
      })

      render(<PaymentHistorySection studentId={mockStudentId} />)

      await waitFor(() => {
        expect(
          screen.getByText('No payment history available for selected date range')
        ).toBeInTheDocument()
      })
    })

    it('should show "View all payment history" link in empty state when filtered', async () => {
      ;(global.fetch as any).mockResolvedValue({
        ok: true,
        json: async () => ({
          data: [],
          summary: { total_paid: 0, total_outstanding: 0, percentage_paid: 0 },
        }),
      })

      render(<PaymentHistorySection studentId={mockStudentId} />)

      await waitFor(() => {
        const filterSelect = screen.getByDisplayValue('All Time')
        fireEvent.change(filterSelect, { target: { value: 'thisYear' } })
      })

      await waitFor(() => {
        expect(screen.getByText('View all payment history')).toBeInTheDocument()
      })
    })
  })

  describe('Error Handling', () => {
    it('should display error message when fetch fails', async () => {
      ;(global.fetch as any).mockResolvedValue({
        ok: false,
        status: 500,
      })

      render(<PaymentHistorySection studentId={mockStudentId} />)

      await waitFor(() => {
        expect(
          screen.getByText('Failed to load payment history. Please try again.')
        ).toBeInTheDocument()
      })
    })

    it('should display error message when fetch throws', async () => {
      ;(global.fetch as any).mockRejectedValue(new Error('Network error'))

      render(<PaymentHistorySection studentId={mockStudentId} />)

      await waitFor(() => {
        expect(
          screen.getByText('Failed to load payment history. Please try again.')
        ).toBeInTheDocument()
      })
    })

    it('should not show summary when error occurs', async () => {
      ;(global.fetch as any).mockResolvedValue({
        ok: false,
        status: 500,
      })

      render(<PaymentHistorySection studentId={mockStudentId} />)

      await waitFor(() => {
        expect(screen.queryByText('Total Paid')).not.toBeInTheDocument()
      })
    })
  })

  describe('Currency and Date Formatting', () => {
    it('should format currency with AUD symbol', async () => {
      render(<PaymentHistorySection studentId={mockStudentId} />)

      await waitFor(() => {
        expect(screen.getByText('$5,000.00')).toBeInTheDocument()
      })
    })

    it('should format dates correctly', async () => {
      render(<PaymentHistorySection studentId={mockStudentId} />)

      await waitFor(() => {
        expect(screen.getByText('Jan 15, 2025')).toBeInTheDocument()
      })
    })

    it('should display "N/A" for null paid dates', async () => {
      render(<PaymentHistorySection studentId={mockStudentId} />)

      await waitFor(() => {
        const naDates = screen.getAllByText('N/A')
        expect(naDates.length).toBeGreaterThan(0)
      })
    })

    it('should display "-" for null paid amounts', async () => {
      render(<PaymentHistorySection studentId={mockStudentId} />)

      await waitFor(() => {
        const dashMarks = screen.getAllByText('-')
        expect(dashMarks.length).toBeGreaterThan(0)
      })
    })
  })
})
