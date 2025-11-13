/**
 * ReportResultsTable Component Tests
 *
 * Story 7.1: Payment Plans Report Generator with Contract Expiration Tracking
 * Task 4: Create Report Results Table Component
 *
 * Tests table rendering, sorting, pagination, highlighting, and summary totals
 */

import { render, screen } from '@testing-library/react'
import { ReportResultsTable } from '../ReportResultsTable'
import type {
  PaymentPlanReportRow,
  PaginationMetadata,
  ReportSummary,
} from '../../types/payment-plans-report'

// Mock data for testing
const mockData: PaymentPlanReportRow[] = [
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
    branch_id: null,
    branch_name: null,
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
    branch_id: 'b2',
    branch_name: 'West Campus',
    program_name: 'Engineering',
    plan_amount: 60000,
    currency: 'USD',
    commission_rate_percent: 12,
    expected_commission: 7200,
    total_paid: 10000,
    total_remaining: 50000,
    earned_commission: 1200,
    status: 'active',
    contract_expiration_date: '2025-11-01',
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

describe('ReportResultsTable', () => {
  const mockOnPageChange = jest.fn()
  const mockOnSort = jest.fn()
  const mockOnPageSizeChange = jest.fn()

  it('renders table with data', () => {
    render(
      <ReportResultsTable
        data={mockData}
        pagination={mockPagination}
        summary={mockSummary}
        onPageChange={mockOnPageChange}
        onSort={mockOnSort}
      />
    )

    // Check if student names are rendered
    expect(screen.getByText('John Doe')).toBeInTheDocument()
    expect(screen.getByText('Jane Smith')).toBeInTheDocument()
    expect(screen.getByText('Bob Johnson')).toBeInTheDocument()
    expect(screen.getByText('Alice Williams')).toBeInTheDocument()
  })

  it('displays empty state when no data', () => {
    render(
      <ReportResultsTable
        data={[]}
        pagination={{ ...mockPagination, total_count: 0 }}
        summary={{ total_plan_amount: 0, total_paid_amount: 0, total_commission: 0 }}
        onPageChange={mockOnPageChange}
        onSort={mockOnSort}
      />
    )

    expect(screen.getByText('No payment plans match the selected filters')).toBeInTheDocument()
  })

  it('displays loading state', () => {
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

    // Should show skeleton rows (check by looking for animate-pulse class)
    const skeletonElements = document.querySelectorAll('.animate-pulse')
    expect(skeletonElements.length).toBeGreaterThan(0)
  })

  it('displays summary totals footer', () => {
    render(
      <ReportResultsTable
        data={mockData}
        pagination={mockPagination}
        summary={mockSummary}
        onPageChange={mockOnPageChange}
        onSort={mockOnSort}
      />
    )

    expect(screen.getByText('Totals (All Pages)')).toBeInTheDocument()
    expect(screen.getByText('$230,000.00')).toBeInTheDocument()
    expect(screen.getByText('$135,000.00')).toBeInTheDocument()
    expect(screen.getByText('$15,900.00')).toBeInTheDocument()
  })

  it('displays pagination info', () => {
    render(
      <ReportResultsTable
        data={mockData}
        pagination={mockPagination}
        summary={mockSummary}
        onPageChange={mockOnPageChange}
        onSort={mockOnSort}
      />
    )

    expect(screen.getByText(/Showing 1-4 of 4 results/)).toBeInTheDocument()
    expect(screen.getByText(/Page 1 of 1/)).toBeInTheDocument()
  })

  it('renders contract expiration badges with correct urgency', () => {
    render(
      <ReportResultsTable
        data={mockData}
        pagination={mockPagination}
        summary={mockSummary}
        onPageChange={mockOnPageChange}
        onSort={mockOnSort}
      />
    )

    // Check for different badge types
    expect(screen.getByText(/50 days left/)).toBeInTheDocument() // Active
    expect(screen.getByText(/5 days left/)).toBeInTheDocument() // Critical (< 7 days)
    expect(screen.getByText(/Expired 10 days ago/)).toBeInTheDocument() // Expired
    expect(screen.getByText(/25 days left/)).toBeInTheDocument() // Warning (< 30 days)
  })
})
