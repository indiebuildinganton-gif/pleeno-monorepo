/**
 * OverduePaymentsWidget Component Tests
 *
 * Tests for loading and error states in the overdue payments widget
 * Epic 6: Agency Dashboard
 * Story 6.5: Overdue Payments Summary Widget
 * Task 4: Add Loading and Error States
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { OverduePaymentsWidget } from '../OverduePaymentsWidget'

// Mock next/link
vi.mock('next/link', () => ({
  default: ({ children, href }: { children: React.ReactNode; href: string }) => (
    <a href={href}>{children}</a>
  ),
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

describe('OverduePaymentsWidget', () => {
  let consoleErrorSpy: ReturnType<typeof vi.spyOn>

  beforeEach(() => {
    vi.clearAllMocks()
    // Spy on console.error to verify error logging
    consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
  })

  afterEach(() => {
    consoleErrorSpy.mockRestore()
  })

  const mockOverduePaymentsData = {
    success: true,
    data: {
      overdue_payments: [
        {
          id: '1',
          payment_plan_id: 'plan-1',
          student_name: 'John Doe',
          college_name: 'Tech University',
          amount: 500.0,
          due_date: '2024-01-01',
          days_overdue: 5,
        },
        {
          id: '2',
          payment_plan_id: 'plan-2',
          student_name: 'Jane Smith',
          college_name: 'Engineering College',
          amount: 750.0,
          due_date: '2023-12-25',
          days_overdue: 15,
        },
        {
          id: '3',
          payment_plan_id: 'plan-3',
          student_name: 'Bob Johnson',
          college_name: 'Science Institute',
          amount: 1000.0,
          due_date: '2023-12-01',
          days_overdue: 45,
        },
      ],
      total_count: 3,
      total_amount: 2250.0,
    },
  }

  // =================================================================
  // TEST 1: Loading State - Skeleton Structure
  // =================================================================

  it('should render skeleton loader with correct structure while loading', () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ;(global.fetch as any).mockImplementation(
      () => new Promise(() => {}) // Never resolves
    )

    renderWithQuery(<OverduePaymentsWidget />)

    // Check for loading container with proper classes
    const skeleton = screen.getByLabelText('Loading overdue payments')
    expect(skeleton).toBeInTheDocument()
    expect(skeleton).toHaveClass('animate-pulse')
    expect(skeleton).toHaveClass('border-2')
    expect(skeleton).toHaveClass('border-gray-300')
  })

  // =================================================================
  // TEST 2: Loading State - Skeleton Has 3 Placeholder Rows
  // =================================================================

  it('should render skeleton with 3 placeholder payment rows', () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ;(global.fetch as any).mockImplementation(
      () => new Promise(() => {}) // Never resolves
    )

    const { container } = renderWithQuery(<OverduePaymentsWidget />)

    // Find all payment item skeleton placeholders
    const skeletonItems = container.querySelectorAll('.space-y-2 > div')
    expect(skeletonItems).toHaveLength(3)
  })

  // =================================================================
  // TEST 3: Loading State - Accessibility Attributes
  // =================================================================

  it('should have proper accessibility attributes on loading state', () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ;(global.fetch as any).mockImplementation(
      () => new Promise(() => {}) // Never resolves
    )

    renderWithQuery(<OverduePaymentsWidget />)

    const skeleton = screen.getByLabelText('Loading overdue payments')
    expect(skeleton).toHaveAttribute('aria-busy', 'true')
    expect(skeleton).toHaveAttribute('aria-label', 'Loading overdue payments')
  })

  // =================================================================
  // TEST 4: Error State - Renders Error Message
  // =================================================================

  it('should render error message when fetch fails', async () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ;(global.fetch as any).mockResolvedValueOnce({
      ok: false,
      status: 500,
    })

    renderWithQuery(<OverduePaymentsWidget />)

    await waitFor(() => {
      expect(screen.getByText('Unable to load overdue payments')).toBeInTheDocument()
    })

    expect(
      screen.getByText('There was an error fetching the data. Please try again.')
    ).toBeInTheDocument()
  })

  // =================================================================
  // TEST 5: Error State - Has Retry Button
  // =================================================================

  it('should display retry button in error state', async () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ;(global.fetch as any).mockResolvedValueOnce({
      ok: false,
      status: 500,
    })

    renderWithQuery(<OverduePaymentsWidget />)

    await waitFor(() => {
      expect(screen.getByText('Unable to load overdue payments')).toBeInTheDocument()
    })

    const retryButton = screen.getByRole('button', { name: 'Retry' })
    expect(retryButton).toBeInTheDocument()
  })

  // =================================================================
  // TEST 6: Error State - Retry Button Functionality
  // =================================================================

  it('should refetch data when retry button is clicked', async () => {
    const user = userEvent.setup()

    // First request fails
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ;(global.fetch as any).mockResolvedValueOnce({
      ok: false,
      status: 500,
    })

    renderWithQuery(<OverduePaymentsWidget />)

    // Wait for error state
    await waitFor(() => {
      expect(screen.getByText('Unable to load overdue payments')).toBeInTheDocument()
    })

    // Second request succeeds
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ;(global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => mockOverduePaymentsData,
    })

    // Click retry button
    const retryButton = screen.getByRole('button', { name: 'Retry' })
    await user.click(retryButton)

    // Should now show success state
    await waitFor(() => {
      expect(screen.getByText('Overdue Payments')).toBeInTheDocument()
      expect(screen.getByText('3')).toBeInTheDocument() // count badge
    })
  })

  // =================================================================
  // TEST 7: Error State - Error Logging
  // =================================================================

  it('should log error to console for debugging', async () => {
    const mockError = new Error('Network error')

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ;(global.fetch as any).mockRejectedValueOnce(mockError)

    renderWithQuery(<OverduePaymentsWidget />)

    await waitFor(() => {
      expect(screen.getByText('Unable to load overdue payments')).toBeInTheDocument()
    })

    // Verify error was logged
    expect(consoleErrorSpy).toHaveBeenCalledWith('Overdue payments fetch error:', mockError)
  })

  // =================================================================
  // TEST 8: Error State - Accessibility Attributes
  // =================================================================

  it('should have proper accessibility attributes on error state', async () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ;(global.fetch as any).mockResolvedValueOnce({
      ok: false,
      status: 500,
    })

    const { container } = renderWithQuery(<OverduePaymentsWidget />)

    await waitFor(() => {
      expect(screen.getByText('Unable to load overdue payments')).toBeInTheDocument()
    })

    const errorContainer = container.querySelector('[role="alert"]')
    expect(errorContainer).toBeInTheDocument()
    expect(errorContainer).toHaveAttribute('aria-live', 'polite')
  })

  // =================================================================
  // TEST 9: State Transition - Loading to Success
  // =================================================================

  it('should transition smoothly from loading to success state', async () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ;(global.fetch as any).mockImplementation(() =>
      Promise.resolve({
        ok: true,
        json: async () => mockOverduePaymentsData,
      })
    )

    renderWithQuery(<OverduePaymentsWidget />)

    // Initially shows skeleton
    expect(screen.getByLabelText('Loading overdue payments')).toBeInTheDocument()

    // Should transition to success state
    await waitFor(() => {
      expect(screen.queryByLabelText('Loading overdue payments')).not.toBeInTheDocument()
      expect(screen.getByText('Overdue Payments')).toBeInTheDocument()
    })
  })

  // =================================================================
  // TEST 10: State Transition - Loading to Error
  // =================================================================

  it('should transition from loading to error state on fetch failure', async () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ;(global.fetch as any).mockResolvedValueOnce({
      ok: false,
      status: 500,
    })

    renderWithQuery(<OverduePaymentsWidget />)

    // Initially shows skeleton
    expect(screen.getByLabelText('Loading overdue payments')).toBeInTheDocument()

    // Should transition to error state
    await waitFor(() => {
      expect(screen.queryByLabelText('Loading overdue payments')).not.toBeInTheDocument()
      expect(screen.getByText('Unable to load overdue payments')).toBeInTheDocument()
    })
  })

  // =================================================================
  // TEST 11: Empty State
  // =================================================================

  it('should display empty state when no overdue payments', async () => {
    const emptyData = {
      success: true,
      data: {
        overdue_payments: [],
        total_count: 0,
        total_amount: 0,
      },
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ;(global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => emptyData,
    })

    renderWithQuery(<OverduePaymentsWidget />)

    await waitFor(() => {
      expect(screen.getByText('No overdue payments!')).toBeInTheDocument()
    })

    expect(screen.getByText('Great work keeping all payments on track!')).toBeInTheDocument()
  })

  // =================================================================
  // TEST 12: Success State - Displays Payment Data
  // =================================================================

  it('should display payment data in success state', async () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ;(global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => mockOverduePaymentsData,
    })

    renderWithQuery(<OverduePaymentsWidget />)

    await waitFor(() => {
      expect(screen.getByText('Overdue Payments')).toBeInTheDocument()
    })

    // Check for student names
    expect(screen.getByText('John Doe')).toBeInTheDocument()
    expect(screen.getByText('Jane Smith')).toBeInTheDocument()
    expect(screen.getByText('Bob Johnson')).toBeInTheDocument()

    // Check for total amount
    expect(screen.getByText('A$2,250.00')).toBeInTheDocument()
  })

  // =================================================================
  // TEST 13: API Endpoint
  // =================================================================

  it('should fetch from correct API endpoint', async () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ;(global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => mockOverduePaymentsData,
    })

    renderWithQuery(<OverduePaymentsWidget />)

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith('/api/dashboard/overdue-payments')
    })
  })

  // =================================================================
  // TEST 14: Color Coding - Critical (30+ days)
  // =================================================================

  it('should apply red color for payments 30+ days overdue', async () => {
    const criticalData = {
      success: true,
      data: {
        overdue_payments: [
          {
            id: '1',
            payment_plan_id: 'plan-1',
            student_name: 'John Doe',
            college_name: 'Tech University',
            amount: 500.0,
            due_date: '2024-01-01',
            days_overdue: 35,
          },
        ],
        total_count: 1,
        total_amount: 500.0,
      },
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ;(global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => criticalData,
    })

    renderWithQuery(<OverduePaymentsWidget />)

    await waitFor(() => {
      const overdueText = screen.getByText(/35 days overdue/i)
      expect(overdueText).toHaveClass('text-red-600')
    })
  })

  // =================================================================
  // TEST 15: Color Coding - Alert (8-30 days)
  // =================================================================

  it('should apply orange color for payments 8-30 days overdue', async () => {
    const alertData = {
      success: true,
      data: {
        overdue_payments: [
          {
            id: '1',
            payment_plan_id: 'plan-1',
            student_name: 'Jane Smith',
            college_name: 'Tech University',
            amount: 500.0,
            due_date: '2024-01-01',
            days_overdue: 15,
          },
        ],
        total_count: 1,
        total_amount: 500.0,
      },
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ;(global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => alertData,
    })

    renderWithQuery(<OverduePaymentsWidget />)

    await waitFor(() => {
      const overdueText = screen.getByText(/15 days overdue/i)
      expect(overdueText).toHaveClass('text-orange-600')
    })
  })

  // =================================================================
  // TEST 16: Color Coding - Warning (1-7 days)
  // =================================================================

  it('should apply yellow color for payments 1-7 days overdue', async () => {
    const warningData = {
      success: true,
      data: {
        overdue_payments: [
          {
            id: '1',
            payment_plan_id: 'plan-1',
            student_name: 'Bob Johnson',
            college_name: 'Tech University',
            amount: 500.0,
            due_date: '2024-01-01',
            days_overdue: 5,
          },
        ],
        total_count: 1,
        total_amount: 500.0,
      },
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ;(global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => warningData,
    })

    renderWithQuery(<OverduePaymentsWidget />)

    await waitFor(() => {
      const overdueText = screen.getByText(/5 days overdue/i)
      expect(overdueText).toHaveClass('text-yellow-600')
    })
  })

  // =================================================================
  // TEST 17: Navigation - Clickable Links
  // =================================================================

  it('should have clickable links to payment plan details', async () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ;(global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => mockOverduePaymentsData,
    })

    renderWithQuery(<OverduePaymentsWidget />)

    await waitFor(() => {
      expect(screen.getByText('John Doe')).toBeInTheDocument()
    })

    const link = screen.getByText('John Doe').closest('a')
    expect(link).toHaveAttribute('href', '/payments/plans/plan-1')
  })

  // =================================================================
  // TEST 18: Multiple Payments Display
  // =================================================================

  it('should display multiple overdue payments correctly', async () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ;(global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => mockOverduePaymentsData,
    })

    renderWithQuery(<OverduePaymentsWidget />)

    await waitFor(() => {
      expect(screen.getByText('John Doe')).toBeInTheDocument()
      expect(screen.getByText('Jane Smith')).toBeInTheDocument()
      expect(screen.getByText('Bob Johnson')).toBeInTheDocument()
    })

    // Verify all colleges are shown
    expect(screen.getByText('Tech University')).toBeInTheDocument()
    expect(screen.getByText('Engineering College')).toBeInTheDocument()
    expect(screen.getByText('Science Institute')).toBeInTheDocument()
  })

  // =================================================================
  // TEST 19: Currency Formatting
  // =================================================================

  it('should format currency correctly', async () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ;(global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => mockOverduePaymentsData,
    })

    renderWithQuery(<OverduePaymentsWidget />)

    await waitFor(() => {
      // Check individual amounts are formatted
      expect(screen.getByText('A$500.00')).toBeInTheDocument()
      expect(screen.getByText('A$750.00')).toBeInTheDocument()
      expect(screen.getByText('A$1,000.00')).toBeInTheDocument()

      // Check total amount is formatted
      expect(screen.getByText('A$2,250.00')).toBeInTheDocument()
    })
  })

  // =================================================================
  // TEST 20: Empty State Celebration
  // =================================================================

  it('should show celebration emoji in empty state', async () => {
    const emptyData = {
      success: true,
      data: {
        overdue_payments: [],
        total_count: 0,
        total_amount: 0,
      },
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ;(global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => emptyData,
    })

    renderWithQuery(<OverduePaymentsWidget />)

    await waitFor(() => {
      expect(screen.getByText('🎉')).toBeInTheDocument()
    })
  })

  // =================================================================
  // TEST 21: Day Singular/Plural
  // =================================================================

  it('should use singular "day" for 1 day overdue', async () => {
    const oneDayData = {
      success: true,
      data: {
        overdue_payments: [
          {
            id: '1',
            payment_plan_id: 'plan-1',
            student_name: 'Test Student',
            college_name: 'Test College',
            amount: 100.0,
            due_date: '2024-01-01',
            days_overdue: 1,
          },
        ],
        total_count: 1,
        total_amount: 100.0,
      },
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ;(global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => oneDayData,
    })

    renderWithQuery(<OverduePaymentsWidget />)

    await waitFor(() => {
      expect(screen.getByText('1 day overdue')).toBeInTheDocument()
    })
  })

  it('should use plural "days" for multiple days overdue', async () => {
    const multipleDaysData = {
      success: true,
      data: {
        overdue_payments: [
          {
            id: '1',
            payment_plan_id: 'plan-1',
            student_name: 'Test Student',
            college_name: 'Test College',
            amount: 100.0,
            due_date: '2024-01-01',
            days_overdue: 2,
          },
        ],
        total_count: 1,
        total_amount: 100.0,
      },
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ;(global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => multipleDaysData,
    })

    renderWithQuery(<OverduePaymentsWidget />)

    await waitFor(() => {
      expect(screen.getByText('2 days overdue')).toBeInTheDocument()
    })
  })
})
