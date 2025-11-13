/**
 * EnrollmentSelect Component Tests
 *
 * Unit tests for the enrollment dropdown component
 * Epic 4: Payments Domain
 * Story 4.1: Payment Plan Creation
 * Task 10: Testing
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor, fireEvent } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { EnrollmentSelect } from '../EnrollmentSelect'

// Mock the useEnrollments hook
const mockUseEnrollments = vi.fn()

vi.mock('@payments/hooks/useEnrollments', () => ({
  useEnrollments: (params: any) => mockUseEnrollments(params),
}))

// Helper function to wrap component with QueryClient
const renderWithQueryClient = (ui: React.ReactElement) => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  })

  return render(<QueryClientProvider client={queryClient}>{ui}</QueryClientProvider>)
}

describe('EnrollmentSelect', () => {
  const mockOnChange = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders with loading state initially', () => {
    mockUseEnrollments.mockReturnValue({
      data: null,
      isLoading: true,
      error: null,
    })

    renderWithQueryClient(<EnrollmentSelect value="" onChange={mockOnChange} />)

    expect(screen.getByText(/loading enrollments/i)).toBeInTheDocument()
  })

  it('displays enrollments after loading', async () => {
    const mockEnrollments = [
      {
        id: 'enrollment-1',
        program_name: 'Bachelor of Computer Science',
        status: 'active',
        student: {
          id: 'student-1',
          first_name: 'John',
          last_name: 'Doe',
        },
        branch: {
          id: 'branch-1',
          city: 'Sydney',
          commission_rate_percent: 15,
          college: {
            id: 'college-1',
            name: 'University of Sydney',
          },
        },
      },
      {
        id: 'enrollment-2',
        program_name: 'Master of Business Administration',
        status: 'active',
        student: {
          id: 'student-2',
          first_name: 'Jane',
          last_name: 'Smith',
        },
        branch: {
          id: 'branch-2',
          city: 'Melbourne',
          commission_rate_percent: 20,
          college: {
            id: 'college-2',
            name: 'University of Melbourne',
          },
        },
      },
    ]

    mockUseEnrollments.mockReturnValue({
      data: { data: mockEnrollments },
      isLoading: false,
      error: null,
    })

    renderWithQueryClient(<EnrollmentSelect value="" onChange={mockOnChange} />)

    await waitFor(() => {
      expect(screen.getByRole('combobox')).toBeInTheDocument()
    })

    // Verify dropdown is rendered
    const select = screen.getByRole('combobox') as HTMLSelectElement
    expect(select).toBeInTheDocument()

    // Verify enrollments are in dropdown with correct format
    expect(
      screen.getByText(
        'John Doe - University of Sydney (Sydney) - Bachelor of Computer Science'
      )
    ).toBeInTheDocument()
    expect(
      screen.getByText(
        'Jane Smith - University of Melbourne (Melbourne) - Master of Business Administration'
      )
    ).toBeInTheDocument()
  })

  it('displays enrollments in correct format', async () => {
    const mockEnrollments = [
      {
        id: 'enrollment-1',
        program_name: 'Bachelor of Engineering',
        status: 'active',
        student: {
          id: 'student-1',
          first_name: 'Alice',
          last_name: 'Johnson',
        },
        branch: {
          id: 'branch-1',
          city: 'Brisbane',
          commission_rate_percent: 18,
          college: {
            id: 'college-1',
            name: 'Queensland University',
          },
        },
      },
    ]

    mockUseEnrollments.mockReturnValue({
      data: { data: mockEnrollments },
      isLoading: false,
      error: null,
    })

    renderWithQueryClient(<EnrollmentSelect value="" onChange={mockOnChange} />)

    await waitFor(() => {
      expect(
        screen.getByText(
          'Alice Johnson - Queensland University (Brisbane) - Bachelor of Engineering'
        )
      ).toBeInTheDocument()
    })
  })

  it('calls onChange with enrollment ID and commission rate when selection changes', async () => {
    const user = userEvent.setup()

    const mockEnrollments = [
      {
        id: 'enrollment-1',
        program_name: 'Bachelor of Science',
        status: 'active',
        student: {
          id: 'student-1',
          first_name: 'John',
          last_name: 'Doe',
        },
        branch: {
          id: 'branch-1',
          city: 'Sydney',
          commission_rate_percent: 15,
          college: {
            id: 'college-1',
            name: 'University of Sydney',
          },
        },
      },
    ]

    mockUseEnrollments.mockReturnValue({
      data: { data: mockEnrollments },
      isLoading: false,
      error: null,
    })

    renderWithQueryClient(<EnrollmentSelect value="" onChange={mockOnChange} />)

    await waitFor(() => {
      expect(screen.getByRole('combobox')).toBeInTheDocument()
    })

    const select = screen.getByRole('combobox')
    await user.selectOptions(select, 'enrollment-1')

    expect(mockOnChange).toHaveBeenCalledWith('enrollment-1', 15)
  })

  it('displays empty state when no enrollments are available', () => {
    mockUseEnrollments.mockReturnValue({
      data: { data: [] },
      isLoading: false,
      error: null,
    })

    renderWithQueryClient(<EnrollmentSelect value="" onChange={mockOnChange} />)

    expect(screen.getByText(/no active enrollments found/i)).toBeInTheDocument()
    expect(
      screen.getByText(/create a student enrollment first/i)
    ).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /create student/i })).toHaveAttribute(
      'href',
      '/students/new'
    )
  })

  it('displays error state when fetch fails', () => {
    mockUseEnrollments.mockReturnValue({
      data: null,
      isLoading: false,
      error: new Error('Failed to fetch enrollments'),
    })

    renderWithQueryClient(<EnrollmentSelect value="" onChange={mockOnChange} />)

    expect(screen.getByText(/failed to load enrollments/i)).toBeInTheDocument()
    expect(screen.getByText(/please try again/i)).toBeInTheDocument()
  })

  it('filters enrollments by search term (student name)', async () => {
    const user = userEvent.setup()

    const mockEnrollments = [
      {
        id: 'enrollment-1',
        program_name: 'Bachelor of Science',
        status: 'active',
        student: {
          id: 'student-1',
          first_name: 'John',
          last_name: 'Doe',
        },
        branch: {
          id: 'branch-1',
          city: 'Sydney',
          commission_rate_percent: 15,
          college: {
            id: 'college-1',
            name: 'University of Sydney',
          },
        },
      },
      {
        id: 'enrollment-2',
        program_name: 'Bachelor of Arts',
        status: 'active',
        student: {
          id: 'student-2',
          first_name: 'Jane',
          last_name: 'Smith',
        },
        branch: {
          id: 'branch-2',
          city: 'Melbourne',
          commission_rate_percent: 20,
          college: {
            id: 'college-2',
            name: 'University of Melbourne',
          },
        },
      },
    ]

    mockUseEnrollments.mockReturnValue({
      data: { data: mockEnrollments },
      isLoading: false,
      error: null,
    })

    renderWithQueryClient(<EnrollmentSelect value="" onChange={mockOnChange} />)

    await waitFor(() => {
      expect(screen.getByRole('combobox')).toBeInTheDocument()
    })

    // Initially both enrollments are visible
    expect(screen.getByText(/john doe/i)).toBeInTheDocument()
    expect(screen.getByText(/jane smith/i)).toBeInTheDocument()

    // Type search term
    const searchInput = screen.getByPlaceholderText(/search by student or college name/i)
    await user.type(searchInput, 'John')

    // Verify filtering: John Doe visible, Jane Smith not visible
    expect(screen.getByText(/john doe/i)).toBeInTheDocument()
    expect(screen.queryByText(/jane smith/i)).not.toBeInTheDocument()
  })

  it('filters enrollments by search term (college name)', async () => {
    const user = userEvent.setup()

    const mockEnrollments = [
      {
        id: 'enrollment-1',
        program_name: 'Bachelor of Science',
        status: 'active',
        student: {
          id: 'student-1',
          first_name: 'John',
          last_name: 'Doe',
        },
        branch: {
          id: 'branch-1',
          city: 'Sydney',
          commission_rate_percent: 15,
          college: {
            id: 'college-1',
            name: 'Harvard University',
          },
        },
      },
      {
        id: 'enrollment-2',
        program_name: 'Bachelor of Arts',
        status: 'active',
        student: {
          id: 'student-2',
          first_name: 'Jane',
          last_name: 'Smith',
        },
        branch: {
          id: 'branch-2',
          city: 'Melbourne',
          commission_rate_percent: 20,
          college: {
            id: 'college-2',
            name: 'Stanford University',
          },
        },
      },
    ]

    mockUseEnrollments.mockReturnValue({
      data: { data: mockEnrollments },
      isLoading: false,
      error: null,
    })

    renderWithQueryClient(<EnrollmentSelect value="" onChange={mockOnChange} />)

    await waitFor(() => {
      expect(screen.getByRole('combobox')).toBeInTheDocument()
    })

    // Type search term
    const searchInput = screen.getByPlaceholderText(/search by student or college name/i)
    await user.type(searchInput, 'Harvard')

    // Verify filtering: Harvard enrollment visible, Stanford not visible
    expect(screen.getByText(/harvard/i)).toBeInTheDocument()
    expect(screen.queryByText(/stanford/i)).not.toBeInTheDocument()
  })

  it('shows no results message when search has no matches', async () => {
    const user = userEvent.setup()

    const mockEnrollments = [
      {
        id: 'enrollment-1',
        program_name: 'Bachelor of Science',
        status: 'active',
        student: {
          id: 'student-1',
          first_name: 'John',
          last_name: 'Doe',
        },
        branch: {
          id: 'branch-1',
          city: 'Sydney',
          commission_rate_percent: 15,
          college: {
            id: 'college-1',
            name: 'University of Sydney',
          },
        },
      },
    ]

    mockUseEnrollments.mockReturnValue({
      data: { data: mockEnrollments },
      isLoading: false,
      error: null,
    })

    renderWithQueryClient(<EnrollmentSelect value="" onChange={mockOnChange} />)

    await waitFor(() => {
      expect(screen.getByRole('combobox')).toBeInTheDocument()
    })

    // Type search term with no matches
    const searchInput = screen.getByPlaceholderText(/search by student or college name/i)
    await user.type(searchInput, 'NonExistentStudent')

    // Verify no results message
    await waitFor(() => {
      expect(
        screen.getByText(/no enrollments found matching "NonExistentStudent"/i)
      ).toBeInTheDocument()
    })
  })

  it('clears search filter when search input is cleared', async () => {
    const user = userEvent.setup()

    const mockEnrollments = [
      {
        id: 'enrollment-1',
        program_name: 'Bachelor of Science',
        status: 'active',
        student: {
          id: 'student-1',
          first_name: 'John',
          last_name: 'Doe',
        },
        branch: {
          id: 'branch-1',
          city: 'Sydney',
          commission_rate_percent: 15,
          college: {
            id: 'college-1',
            name: 'University of Sydney',
          },
        },
      },
      {
        id: 'enrollment-2',
        program_name: 'Bachelor of Arts',
        status: 'active',
        student: {
          id: 'student-2',
          first_name: 'Jane',
          last_name: 'Smith',
        },
        branch: {
          id: 'branch-2',
          city: 'Melbourne',
          commission_rate_percent: 20,
          college: {
            id: 'college-2',
            name: 'University of Melbourne',
          },
        },
      },
    ]

    mockUseEnrollments.mockReturnValue({
      data: { data: mockEnrollments },
      isLoading: false,
      error: null,
    })

    renderWithQueryClient(<EnrollmentSelect value="" onChange={mockOnChange} />)

    await waitFor(() => {
      expect(screen.getByRole('combobox')).toBeInTheDocument()
    })

    // Type search term
    const searchInput = screen.getByPlaceholderText(/search by student or college name/i)
    await user.type(searchInput, 'John')

    // Verify filtering
    expect(screen.getByText(/john doe/i)).toBeInTheDocument()
    expect(screen.queryByText(/jane smith/i)).not.toBeInTheDocument()

    // Clear search
    await user.clear(searchInput)

    // Verify all enrollments are visible again
    expect(screen.getByText(/john doe/i)).toBeInTheDocument()
    expect(screen.getByText(/jane smith/i)).toBeInTheDocument()
  })

  it('displays validation error when provided', () => {
    mockUseEnrollments.mockReturnValue({
      data: { data: [] },
      isLoading: false,
      error: null,
    })

    renderWithQueryClient(
      <EnrollmentSelect
        value=""
        onChange={mockOnChange}
        error="Please select a valid enrollment"
      />
    )

    expect(screen.getByText('Please select a valid enrollment')).toBeInTheDocument()
  })

  it('displays selected enrollment value', () => {
    const mockEnrollments = [
      {
        id: 'enrollment-1',
        program_name: 'Bachelor of Science',
        status: 'active',
        student: {
          id: 'student-1',
          first_name: 'John',
          last_name: 'Doe',
        },
        branch: {
          id: 'branch-1',
          city: 'Sydney',
          commission_rate_percent: 15,
          college: {
            id: 'college-1',
            name: 'University of Sydney',
          },
        },
      },
    ]

    mockUseEnrollments.mockReturnValue({
      data: { data: mockEnrollments },
      isLoading: false,
      error: null,
    })

    renderWithQueryClient(
      <EnrollmentSelect value="enrollment-1" onChange={mockOnChange} />
    )

    const select = screen.getByRole('combobox') as HTMLSelectElement
    expect(select.value).toBe('enrollment-1')
  })

  it('handles enrollments with missing student data gracefully', () => {
    const mockEnrollments = [
      {
        id: 'enrollment-1',
        program_name: 'Bachelor of Science',
        status: 'active',
        student: null, // Missing student
        branch: {
          id: 'branch-1',
          city: 'Sydney',
          commission_rate_percent: 15,
          college: {
            id: 'college-1',
            name: 'University of Sydney',
          },
        },
      },
    ]

    mockUseEnrollments.mockReturnValue({
      data: { data: mockEnrollments },
      isLoading: false,
      error: null,
    })

    renderWithQueryClient(<EnrollmentSelect value="" onChange={mockOnChange} />)

    // Should render without crashing
    expect(screen.getByRole('combobox')).toBeInTheDocument()
    // Should show "Unknown" for missing parts
    expect(
      screen.getByText(/- University of Sydney \(Sydney\) - Bachelor of Science/)
    ).toBeInTheDocument()
  })

  it('handles enrollments with missing branch/college data gracefully', () => {
    const mockEnrollments = [
      {
        id: 'enrollment-1',
        program_name: 'Bachelor of Science',
        status: 'active',
        student: {
          id: 'student-1',
          first_name: 'John',
          last_name: 'Doe',
        },
        branch: null, // Missing branch
      },
    ]

    mockUseEnrollments.mockReturnValue({
      data: { data: mockEnrollments },
      isLoading: false,
      error: null,
    })

    renderWithQueryClient(<EnrollmentSelect value="" onChange={mockOnChange} />)

    // Should render without crashing
    expect(screen.getByRole('combobox')).toBeInTheDocument()
    // Should show "Unknown" for missing parts
    expect(
      screen.getByText(/John Doe - Unknown College \(Unknown City\) - Bachelor of Science/)
    ).toBeInTheDocument()
  })

  it('passes commission rate as 0 when branch data is missing', async () => {
    const user = userEvent.setup()

    const mockEnrollments = [
      {
        id: 'enrollment-1',
        program_name: 'Bachelor of Science',
        status: 'active',
        student: {
          id: 'student-1',
          first_name: 'John',
          last_name: 'Doe',
        },
        branch: null, // Missing branch (no commission rate)
      },
    ]

    mockUseEnrollments.mockReturnValue({
      data: { data: mockEnrollments },
      isLoading: false,
      error: null,
    })

    renderWithQueryClient(<EnrollmentSelect value="" onChange={mockOnChange} />)

    await waitFor(() => {
      expect(screen.getByRole('combobox')).toBeInTheDocument()
    })

    const select = screen.getByRole('combobox')
    await user.selectOptions(select, 'enrollment-1')

    expect(mockOnChange).toHaveBeenCalledWith('enrollment-1', 0)
  })

  it('search is case-insensitive', async () => {
    const user = userEvent.setup()

    const mockEnrollments = [
      {
        id: 'enrollment-1',
        program_name: 'Bachelor of Science',
        status: 'active',
        student: {
          id: 'student-1',
          first_name: 'John',
          last_name: 'Doe',
        },
        branch: {
          id: 'branch-1',
          city: 'Sydney',
          commission_rate_percent: 15,
          college: {
            id: 'college-1',
            name: 'University of Sydney',
          },
        },
      },
    ]

    mockUseEnrollments.mockReturnValue({
      data: { data: mockEnrollments },
      isLoading: false,
      error: null,
    })

    renderWithQueryClient(<EnrollmentSelect value="" onChange={mockOnChange} />)

    await waitFor(() => {
      expect(screen.getByRole('combobox')).toBeInTheDocument()
    })

    // Search with lowercase
    const searchInput = screen.getByPlaceholderText(/search by student or college name/i)
    await user.type(searchInput, 'john')

    // Should still find "John Doe"
    expect(screen.getByText(/john doe/i)).toBeInTheDocument()

    // Clear and search with uppercase
    await user.clear(searchInput)
    await user.type(searchInput, 'SYDNEY')

    // Should still find the enrollment
    expect(screen.getByText(/sydney/i)).toBeInTheDocument()
  })
})
