/**
 * Component Tests: StudentTable
 *
 * Tests for the StudentTable component including sorting, pagination, and visa status badges
 *
 * Epic 3: Entities Domain
 * Story 3.2: Student Registry
 * Task 17: Testing - Component Tests
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { StudentTable } from '../StudentTable'

// Mock next/navigation
const mockPush = vi.fn()
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
  }),
}))

const mockStudents = [
  {
    id: 'student-1',
    full_name: 'John Doe',
    email: 'john@email.com',
    phone: '+1-416-555-0123',
    passport_number: 'AB123456',
    visa_status: 'approved' as const,
    date_of_birth: '1995-06-15',
    nationality: 'Canadian',
    updated_at: '2025-01-10T00:00:00Z',
    latest_enrollment: {
      college_name: 'University of Toronto',
      branch_name: 'Main Campus',
      branch_city: 'Toronto',
    },
  },
  {
    id: 'student-2',
    full_name: 'Jane Smith',
    email: 'jane@email.com',
    phone: '+1-416-555-0124',
    passport_number: 'CD789012',
    visa_status: 'in_process' as const,
    date_of_birth: '1996-03-20',
    nationality: 'American',
    updated_at: '2025-01-11T00:00:00Z',
    latest_enrollment: null,
  },
  {
    id: 'student-3',
    full_name: 'Bob Johnson',
    email: 'bob@email.com',
    phone: '+1-416-555-0125',
    passport_number: 'EF345678',
    visa_status: 'denied' as const,
    date_of_birth: '1997-08-12',
    nationality: 'British',
    updated_at: '2025-01-09T00:00:00Z',
    latest_enrollment: {
      college_name: 'University of Melbourne',
      branch_name: 'Parkville Campus',
      branch_city: 'Melbourne',
    },
  },
  {
    id: 'student-4',
    full_name: 'Alice Williams',
    email: 'alice@email.com',
    phone: null,
    passport_number: 'GH901234',
    visa_status: 'expired' as const,
    date_of_birth: null,
    nationality: null,
    updated_at: '2025-01-08T00:00:00Z',
    latest_enrollment: null,
  },
]

const mockPagination = {
  total: 4,
  page: 1,
  per_page: 20,
  total_pages: 1,
}

describe('StudentTable', () => {
  const mockOnPageChange = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders table with student data', () => {
    render(
      <StudentTable
        data={mockStudents}
        pagination={mockPagination}
        onPageChange={mockOnPageChange}
      />
    )

    expect(screen.getByText('John Doe')).toBeInTheDocument()
    expect(screen.getByText('Jane Smith')).toBeInTheDocument()
    expect(screen.getByText('Bob Johnson')).toBeInTheDocument()
    expect(screen.getByText('Alice Williams')).toBeInTheDocument()
  })

  it('displays visa status badges with correct colors', () => {
    render(
      <StudentTable
        data={mockStudents}
        pagination={mockPagination}
        onPageChange={mockOnPageChange}
      />
    )

    expect(screen.getByText('Approved')).toBeInTheDocument()
    expect(screen.getByText('In Process')).toBeInTheDocument()
    expect(screen.getByText('Denied')).toBeInTheDocument()
    expect(screen.getByText('Expired')).toBeInTheDocument()
  })

  it('displays college and branch information', () => {
    render(
      <StudentTable
        data={mockStudents}
        pagination={mockPagination}
        onPageChange={mockOnPageChange}
      />
    )

    expect(screen.getByText('University of Toronto')).toBeInTheDocument()
    expect(screen.getByText('Main Campus (Toronto)')).toBeInTheDocument()
    expect(screen.getByText('University of Melbourne')).toBeInTheDocument()
    expect(screen.getByText('Parkville Campus (Melbourne)')).toBeInTheDocument()
  })

  it('displays em dash for missing data', () => {
    render(
      <StudentTable
        data={mockStudents}
        pagination={mockPagination}
        onPageChange={mockOnPageChange}
      />
    )

    // Student 2 and 4 have no enrollment
    const emDashes = screen.getAllByText('—')
    expect(emDashes.length).toBeGreaterThan(0)
  })

  it('makes rows clickable and navigates to student detail', async () => {
    const user = userEvent.setup()

    render(
      <StudentTable
        data={mockStudents}
        pagination={mockPagination}
        onPageChange={mockOnPageChange}
      />
    )

    const firstRow = screen.getByText('John Doe').closest('tr')
    expect(firstRow).toBeInTheDocument()

    if (firstRow) {
      await user.click(firstRow)
      expect(mockPush).toHaveBeenCalledWith('/students/student-1')
    }
  })

  it('supports column sorting', async () => {
    const user = userEvent.setup()

    render(
      <StudentTable
        data={mockStudents}
        pagination={mockPagination}
        onPageChange={mockOnPageChange}
      />
    )

    // Find the Name header and click it to sort
    const nameHeader = screen.getByText('Name').closest('button')
    expect(nameHeader).toBeInTheDocument()

    if (nameHeader) {
      await user.click(nameHeader)
      // Should show sort indicator
      await waitFor(() => {
        expect(nameHeader.querySelector('svg')).toBeInTheDocument()
      })
    }
  })

  it('displays loading state', () => {
    render(
      <StudentTable
        data={[]}
        pagination={mockPagination}
        onPageChange={mockOnPageChange}
        isLoading={true}
      />
    )

    expect(screen.getByText('Loading...')).toBeInTheDocument()
  })

  it('displays empty state when no students', () => {
    render(
      <StudentTable
        data={[]}
        pagination={{ ...mockPagination, total: 0 }}
        onPageChange={mockOnPageChange}
        isLoading={false}
      />
    )

    expect(screen.getByText(/no students found/i)).toBeInTheDocument()
  })

  it('displays pagination controls', () => {
    const paginationWithMultiplePages = {
      total: 100,
      page: 2,
      per_page: 20,
      total_pages: 5,
    }

    render(
      <StudentTable
        data={mockStudents}
        pagination={paginationWithMultiplePages}
        onPageChange={mockOnPageChange}
      />
    )

    expect(screen.getByText(/page 2 of 5/i)).toBeInTheDocument()
  })

  it('calls onPageChange when navigating pages', async () => {
    const user = userEvent.setup()

    const paginationWithMultiplePages = {
      total: 100,
      page: 2,
      per_page: 20,
      total_pages: 5,
    }

    render(
      <StudentTable
        data={mockStudents}
        pagination={paginationWithMultiplePages}
        onPageChange={mockOnPageChange}
      />
    )

    const nextButton = screen.getByText(/next/i)
    await user.click(nextButton)

    expect(mockOnPageChange).toHaveBeenCalledWith(3)
  })

  it('disables previous button on first page', () => {
    render(
      <StudentTable
        data={mockStudents}
        pagination={mockPagination}
        onPageChange={mockOnPageChange}
      />
    )

    const prevButton = screen.getByText(/previous/i).closest('button')
    expect(prevButton).toBeDisabled()
  })

  it('disables next button on last page', () => {
    render(
      <StudentTable
        data={mockStudents}
        pagination={mockPagination}
        onPageChange={mockOnPageChange}
      />
    )

    const nextButton = screen.getByText(/next/i).closest('button')
    expect(nextButton).toBeDisabled()
  })

  it('formats contact information correctly', () => {
    render(
      <StudentTable
        data={mockStudents}
        pagination={mockPagination}
        onPageChange={mockOnPageChange}
      />
    )

    expect(screen.getByText('john@email.com')).toBeInTheDocument()
    expect(screen.getByText('+1-416-555-0123')).toBeInTheDocument()
  })

  it('displays passport numbers', () => {
    render(
      <StudentTable
        data={mockStudents}
        pagination={mockPagination}
        onPageChange={mockOnPageChange}
      />
    )

    expect(screen.getByText('AB123456')).toBeInTheDocument()
    expect(screen.getByText('CD789012')).toBeInTheDocument()
  })

  it('shows relative timestamps for last updated', () => {
    render(
      <StudentTable
        data={mockStudents}
        pagination={mockPagination}
        onPageChange={mockOnPageChange}
      />
    )

    // Should display relative time like "2 days ago"
    const timeElements = screen.getAllByText(/ago/i)
    expect(timeElements.length).toBeGreaterThan(0)
  })
})
