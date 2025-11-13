/**
 * ReportResultsTable Comprehensive Component Tests
 *
 * Story 7.1: Payment Plans Report Generator with Contract Expiration Tracking
 * Task 8: Testing
 *
 * Comprehensive tests for all ReportResultsTable functionality
 */

import { render, screen, fireEvent, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ReportResultsTable } from '../ReportResultsTable'
import type {
  PaymentPlanReportRow,
  PaginationMetadata,
  ReportSummary,
} from '../../types/payment-plans-report'
import { vi } from 'vitest'

// Mock data for testing
const createMockData = (): PaymentPlanReportRow[] => [
  {
    id: '1',
    reference_number: 'PP-001',
    student_id: 's1',
    student_name: 'John Doe',
    college_id: 'c1',
    college_name: 'State University',
    branch_id: 'b1',
    branch_name: 'Main Campus',
    program_name: 'Computer Science',
    plan_amount: 50000,
    currency: 'USD',
    commission_rate_percent: 10,
    expected_commission: 5000,
    total_paid: 25000,
    total_remaining: 25000,
    earned_commission: 2500,
    status: 'active',
    contract_expiration_date: '2025-12-31',
    days_until_contract_expiration: 50,
    contract_status: 'active',
    start_date: '2024-01-01',
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-06-01T00:00:00Z',
  },
  {
    id: '2',
    reference_number: 'PP-002',
    student_id: 's2',
    student_name: 'Jane Smith',
    college_id: 'c2',
    college_name: 'Tech College',
    branch_id: 'b2',
    branch_name: 'West Campus',
    program_name: 'Business Administration',
    plan_amount: 40000,
    currency: 'USD',
    commission_rate_percent: 8,
    expected_commission: 3200,
    total_paid: 40000,
    total_remaining: 0,
    earned_commission: 3200,
    status: 'completed',
    contract_expiration_date: '2025-11-20',
    days_until_contract_expiration: 5,
    contract_status: 'expiring_soon',
    start_date: '2023-09-01',
    created_at: '2023-09-01T00:00:00Z',
    updated_at: '2024-08-01T00:00:00Z',
  },
  {
    id: '3',
    reference_number: 'PP-003',
    student_id: 's3',
    student_name: 'Bob Johnson',
    college_id: 'c3',
    college_name: 'Community College',
    branch_id: 'b3',
    branch_name: 'East Campus',
    program_name: 'Engineering',
    plan_amount: 60000,
    currency: 'USD',
    commission_rate_percent: 12,
    expected_commission: 7200,
    total_paid: 10000,
    total_remaining: 50000,
    earned_commission: 1200,
    status: 'active',
    contract_expiration_date: '2025-10-01',
    days_until_contract_expiration: -10,
    contract_status: 'expired',
    start_date: '2024-03-01',
    created_at: '2024-03-01T00:00:00Z',
    updated_at: '2024-09-01T00:00:00Z',
  },
  {
    id: '4',
    reference_number: 'PP-004',
    student_id: 's4',
    student_name: 'Alice Williams',
    college_id: 'c1',
    college_name: 'State University',
    branch_id: 'b1',
    branch_name: 'Main Campus',
    program_name: 'Medicine',
    plan_amount: 80000,
    currency: 'USD',
    commission_rate_percent: 15,
    expected_commission: 12000,
    total_paid: 60000,
    total_remaining: 20000,
    earned_commission: 9000,
    status: 'active',
    contract_expiration_date: '2025-11-25',
    days_until_contract_expiration: 25,
    contract_status: 'expiring_soon',
    start_date: '2024-02-01',
    created_at: '2024-02-01T00:00:00Z',
    updated_at: '2024-10-01T00:00:00Z',
  },
]

const mockPagination: PaginationMetadata = {
  page: 1,
  page_size: 10,
  total_count: 4,
  total_pages: 1,
}

const mockSummary: ReportSummary = {
  total_plan_amount: 230000,
  total_paid_amount: 135000,
  total_commission: 15900,
}

describe('ReportResultsTable - Comprehensive Tests', () => {
  const mockOnPageChange = vi.fn()
  const mockOnSort = vi.fn()
  const mockOnPageSizeChange = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Data Rendering', () => {
    it('renders table with all data rows', () => {
      const mockData = createMockData()

      render(
        <ReportResultsTable
          data={mockData}
          pagination={mockPagination}
          summary={mockSummary}
          onPageChange={mockOnPageChange}
          onSort={mockOnSort}
        />
      )

      // Check if all student names are rendered
      expect(screen.getByText('John Doe')).toBeInTheDocument()
      expect(screen.getByText('Jane Smith')).toBeInTheDocument()
      expect(screen.getByText('Bob Johnson')).toBeInTheDocument()
      expect(screen.getByText('Alice Williams')).toBeInTheDocument()
    })

    it('renders correct number of rows', () => {
      const mockData = createMockData()

      const { container } = render(
        <ReportResultsTable
          data={mockData}
          pagination={mockPagination}
          summary={mockSummary}
          onPageChange={mockOnPageChange}
          onSort={mockOnSort}
        />
      )

      const tbody = container.querySelector('tbody')
      const rows = tbody?.querySelectorAll('tr') || []

      // Should have 4 data rows (not including summary row if separate)
      expect(rows.length).toBeGreaterThanOrEqual(4)
    })
  })

  describe('Currency Formatting', () => {
    it('formats currency columns correctly', () => {
      const mockData = [createMockData()[0]]

      render(
        <ReportResultsTable
          data={mockData}
          pagination={mockPagination}
          summary={mockSummary}
          onPageChange={mockOnPageChange}
          onSort={mockOnSort}
        />
      )

      // Check for formatted currency values
      expect(screen.getByText(/\$50,000\.00/)).toBeInTheDocument() // plan_amount
      expect(screen.getByText(/\$25,000\.00/)).toBeInTheDocument() // total_paid
      expect(screen.getByText(/\$2,500\.00/)).toBeInTheDocument() // earned_commission
    })

    it('handles zero amounts correctly', () => {
      const mockData = [
        {
          ...createMockData()[0],
          total_paid: 0,
          earned_commission: 0,
        },
      ]

      render(
        <ReportResultsTable
          data={mockData}
          pagination={mockPagination}
          summary={mockSummary}
          onPageChange={mockOnPageChange}
          onSort={mockOnSort}
        />
      )

      // Should show $0.00 formatted
      expect(screen.getAllByText(/\$0\.00/)[0]).toBeInTheDocument()
    })

    it('handles large amounts correctly', () => {
      const mockData = [
        {
          ...createMockData()[0],
          plan_amount: 1234567.89,
        },
      ]

      render(
        <ReportResultsTable
          data={mockData}
          pagination={mockPagination}
          summary={mockSummary}
          onPageChange={mockOnPageChange}
          onSort={mockOnSort}
        />
      )

      // Should have comma separators
      expect(screen.getByText(/\$1,234,567\.89/)).toBeInTheDocument()
    })
  })

  describe('Date Formatting', () => {
    it('formats date columns correctly', () => {
      const mockData = [createMockData()[0]]

      render(
        <ReportResultsTable
          data={mockData}
          pagination={mockPagination}
          summary={mockSummary}
          onPageChange={mockOnPageChange}
          onSort={mockOnSort}
        />
      )

      // Check for formatted dates
      // Date formatting may vary, so check for year at minimum
      expect(screen.getByText(/2025/)).toBeInTheDocument()
    })
  })

  describe('Status Badges', () => {
    it('renders status badges with correct styling', () => {
      const mockData = createMockData()

      render(
        <ReportResultsTable
          data={mockData}
          pagination={mockPagination}
          summary={mockSummary}
          onPageChange={mockOnPageChange}
          onSort={mockOnSort}
        />
      )

      // Check for status text
      expect(screen.getAllByText(/active/i).length).toBeGreaterThan(0)
      expect(screen.getByText(/completed/i)).toBeInTheDocument()
    })

    it('differentiates between different statuses visually', () => {
      const mockData = createMockData()

      const { container } = render(
        <ReportResultsTable
          data={mockData}
          pagination={mockPagination}
          summary={mockSummary}
          onPageChange={mockOnPageChange}
          onSort={mockOnSort}
        />
      )

      // Status badges should have different classes/colors
      const badges = container.querySelectorAll('[data-status]')
      expect(badges.length).toBeGreaterThan(0)
    })
  })

  describe('Contract Expiration Badges', () => {
    it('renders contract expiration badges with urgency', () => {
      const mockData = createMockData()

      render(
        <ReportResultsTable
          data={mockData}
          pagination={mockPagination}
          summary={mockSummary}
          onPageChange={mockOnPageChange}
          onSort={mockOnSort}
        />
      )

      // Check for expiration text
      expect(screen.getByText(/50 days left/i)).toBeInTheDocument()
      expect(screen.getByText(/5 days left/i)).toBeInTheDocument()
      expect(screen.getByText(/Expired 10 days ago/i)).toBeInTheDocument()
    })

    it('shows critical badge for contracts expiring within 7 days', () => {
      const mockData = [createMockData()[1]] // 5 days left

      const { container } = render(
        <ReportResultsTable
          data={mockData}
          pagination={mockPagination}
          summary={mockSummary}
          onPageChange={mockOnPageChange}
          onSort={mockOnSort}
        />
      )

      expect(screen.getByText(/5 days left/i)).toBeInTheDocument()
      // Should have critical/red styling
    })

    it('shows expired badge for past expiration dates', () => {
      const mockData = [createMockData()[2]] // Expired 10 days ago

      render(
        <ReportResultsTable
          data={mockData}
          pagination={mockPagination}
          summary={mockSummary}
          onPageChange={mockOnPageChange}
          onSort={mockOnSort}
        />
      )

      expect(screen.getByText(/Expired 10 days ago/i)).toBeInTheDocument()
    })
  })

  describe('Row Highlighting', () => {
    it('highlights expired contracts in red', () => {
      const mockData = [createMockData()[2]] // Expired contract

      const { container } = render(
        <ReportResultsTable
          data={mockData}
          pagination={mockPagination}
          summary={mockSummary}
          onPageChange={mockOnPageChange}
          onSort={mockOnSort}
        />
      )

      const rows = container.querySelectorAll('tbody tr')
      const expiredRow = rows[0]

      // Should have red/danger background class
      expect(expiredRow.className).toContain('bg-red')
    })

    it('highlights expiring soon contracts in orange', () => {
      const mockData = [
        {
          ...createMockData()[0],
          days_until_contract_expiration: 5,
          contract_status: 'expiring_soon' as const,
        },
      ]

      const { container } = render(
        <ReportResultsTable
          data={mockData}
          pagination={mockPagination}
          summary={mockSummary}
          onPageChange={mockOnPageChange}
          onSort={mockOnSort}
        />
      )

      const rows = container.querySelectorAll('tbody tr')
      const expiringSoonRow = rows[0]

      // Should have orange/warning background class
      expect(expiringSoonRow.className).toContain('bg-orange')
    })

    it('highlights warning contracts in yellow', () => {
      const mockData = [
        {
          ...createMockData()[0],
          days_until_contract_expiration: 25,
          contract_status: 'expiring_soon' as const,
        },
      ]

      const { container } = render(
        <ReportResultsTable
          data={mockData}
          pagination={mockPagination}
          summary={mockSummary}
          onPageChange={mockOnPageChange}
          onSort={mockOnSort}
        />
      )

      const rows = container.querySelectorAll('tbody tr')
      const warningRow = rows[0]

      // Should have yellow/warning background class
      expect(warningRow.className).toMatch(/bg-(yellow|amber)/)
    })
  })

  describe('Summary Totals Footer', () => {
    it('renders summary totals footer', () => {
      render(
        <ReportResultsTable
          data={createMockData()}
          pagination={mockPagination}
          summary={mockSummary}
          onPageChange={mockOnPageChange}
          onSort={mockOnSort}
        />
      )

      expect(screen.getByText(/Totals \(All Pages\)/i)).toBeInTheDocument()
    })

    it('displays correct summary totals', () => {
      render(
        <ReportResultsTable
          data={createMockData()}
          pagination={mockPagination}
          summary={mockSummary}
          onPageChange={mockOnPageChange}
          onSort={mockOnSort}
        />
      )

      expect(screen.getByText(/\$230,000\.00/)).toBeInTheDocument()
      expect(screen.getByText(/\$135,000\.00/)).toBeInTheDocument()
      expect(screen.getByText(/\$15,900\.00/)).toBeInTheDocument()
    })

    it('updates summary when data changes', () => {
      const { rerender } = render(
        <ReportResultsTable
          data={createMockData()}
          pagination={mockPagination}
          summary={mockSummary}
          onPageChange={mockOnPageChange}
          onSort={mockOnSort}
        />
      )

      const newSummary = {
        total_plan_amount: 500000,
        total_paid_amount: 300000,
        total_commission: 50000,
      }

      rerender(
        <ReportResultsTable
          data={createMockData()}
          pagination={mockPagination}
          summary={newSummary}
          onPageChange={mockOnPageChange}
          onSort={mockOnSort}
        />
      )

      expect(screen.getByText(/\$500,000\.00/)).toBeInTheDocument()
      expect(screen.getByText(/\$300,000\.00/)).toBeInTheDocument()
      expect(screen.getByText(/\$50,000\.00/)).toBeInTheDocument()
    })
  })

  describe('Sorting', () => {
    it('calls onSort when column header is clicked', async () => {
      render(
        <ReportResultsTable
          data={createMockData()}
          pagination={mockPagination}
          summary={mockSummary}
          onPageChange={mockOnPageChange}
          onSort={mockOnSort}
        />
      )

      const studentNameHeader = screen.getByText(/Student Name/i)
      await userEvent.click(studentNameHeader)

      expect(mockOnSort).toHaveBeenCalledWith(
        expect.objectContaining({
          column: 'student_name',
        })
      )
    })

    it('renders sort indicators on sortable columns', () => {
      render(
        <ReportResultsTable
          data={createMockData()}
          pagination={mockPagination}
          summary={mockSummary}
          onPageChange={mockOnPageChange}
          onSort={mockOnSort}
        />
      )

      // Sortable columns should have visual indicators
      const studentNameHeader = screen.getByText(/Student Name/i).closest('th')
      expect(studentNameHeader).toHaveAttribute('role', 'button')
    })
  })

  describe('Pagination', () => {
    it('renders pagination controls', () => {
      render(
        <ReportResultsTable
          data={createMockData()}
          pagination={mockPagination}
          summary={mockSummary}
          onPageChange={mockOnPageChange}
          onSort={mockOnSort}
        />
      )

      expect(screen.getByText(/Showing 1-4 of 4 results/i)).toBeInTheDocument()
      expect(screen.getByText(/Page 1 of 1/i)).toBeInTheDocument()
    })

    it('calls onPageChange when page is changed', async () => {
      const pagination: PaginationMetadata = {
        page: 1,
        page_size: 10,
        total_count: 25,
        total_pages: 3,
      }

      render(
        <ReportResultsTable
          data={createMockData()}
          pagination={pagination}
          summary={mockSummary}
          onPageChange={mockOnPageChange}
          onSort={mockOnSort}
        />
      )

      const nextButton = screen.getByRole('button', { name: /next/i })
      await userEvent.click(nextButton)

      expect(mockOnPageChange).toHaveBeenCalledWith(2)
    })

    it('disables previous button on first page', () => {
      render(
        <ReportResultsTable
          data={createMockData()}
          pagination={mockPagination}
          summary={mockSummary}
          onPageChange={mockOnPageChange}
          onSort={mockOnSort}
        />
      )

      const prevButton = screen.getByRole('button', { name: /previous/i })
      expect(prevButton).toBeDisabled()
    })

    it('disables next button on last page', () => {
      render(
        <ReportResultsTable
          data={createMockData()}
          pagination={mockPagination}
          summary={mockSummary}
          onPageChange={mockOnPageChange}
          onSort={mockOnSort}
        />
      )

      const nextButton = screen.getByRole('button', { name: /next/i })
      expect(nextButton).toBeDisabled()
    })

    it('renders page size selector', () => {
      render(
        <ReportResultsTable
          data={createMockData()}
          pagination={mockPagination}
          summary={mockSummary}
          onPageChange={mockOnPageChange}
          onSort={mockOnSort}
          onPageSizeChange={mockOnPageSizeChange}
        />
      )

      const pageSizeSelect = screen.getByLabelText(/Per page/i)
      expect(pageSizeSelect).toBeInTheDocument()
    })

    it('calls onPageSizeChange when page size is changed', async () => {
      render(
        <ReportResultsTable
          data={createMockData()}
          pagination={mockPagination}
          summary={mockSummary}
          onPageChange={mockOnPageChange}
          onSort={mockOnSort}
          onPageSizeChange={mockOnPageSizeChange}
        />
      )

      const pageSizeSelect = screen.getByLabelText(/Per page/i)
      await userEvent.selectOptions(pageSizeSelect, '25')

      expect(mockOnPageSizeChange).toHaveBeenCalledWith(25)
    })
  })

  describe('Loading State', () => {
    it('shows loading skeleton rows', () => {
      const { container } = render(
        <ReportResultsTable
          data={[]}
          pagination={mockPagination}
          summary={mockSummary}
          onPageChange={mockOnPageChange}
          onSort={mockOnSort}
          isLoading={true}
        />
      )

      const skeletonElements = container.querySelectorAll('.animate-pulse')
      expect(skeletonElements.length).toBeGreaterThan(0)
    })

    it('does not show skeleton rows when not loading', () => {
      const { container } = render(
        <ReportResultsTable
          data={createMockData()}
          pagination={mockPagination}
          summary={mockSummary}
          onPageChange={mockOnPageChange}
          onSort={mockOnSort}
          isLoading={false}
        />
      )

      const skeletonElements = container.querySelectorAll('.animate-pulse')
      expect(skeletonElements.length).toBe(0)
    })
  })

  describe('Empty State', () => {
    it('shows empty state when no data', () => {
      render(
        <ReportResultsTable
          data={[]}
          pagination={{ ...mockPagination, total_count: 0 }}
          summary={{ total_plan_amount: 0, total_paid_amount: 0, total_commission: 0 }}
          onPageChange={mockOnPageChange}
          onSort={mockOnSort}
        />
      )

      expect(
        screen.getByText(/No payment plans match the selected filters/i)
      ).toBeInTheDocument()
    })

    it('does not show empty state when loading', () => {
      render(
        <ReportResultsTable
          data={[]}
          pagination={mockPagination}
          summary={mockSummary}
          onPageChange={mockOnPageChange}
          onSort={mockOnSort}
          isLoading={true}
        />
      )

      expect(
        screen.queryByText(/No payment plans match the selected filters/i)
      ).not.toBeInTheDocument()
    })
  })

  describe('Responsive Behavior', () => {
    it('renders table on desktop', () => {
      const { container } = render(
        <ReportResultsTable
          data={createMockData()}
          pagination={mockPagination}
          summary={mockSummary}
          onPageChange={mockOnPageChange}
          onSort={mockOnSort}
        />
      )

      const table = container.querySelector('table')
      expect(table).toBeInTheDocument()
    })
  })
})
