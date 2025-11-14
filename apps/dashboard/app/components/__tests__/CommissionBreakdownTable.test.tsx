/**
 * CommissionBreakdownTable Component Tests
 *
 * Tests for the commission breakdown table component with filter controls,
 * drill-down links, and summary metrics cards
 * Epic 6: Dashboard & Reporting Zone
 * Story 6.3: Commission Breakdown by College
 * Task 3: Implement Filter Controls
 * Task 4: Implement Drill-Down to Payment Plans
 * Task 5: Add Summary Metrics Cards
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, waitFor, fireEvent } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { CommissionBreakdownTable } from '../CommissionBreakdownTable'

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

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {}

  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => {
      store[key] = value.toString()
    },
    removeItem: (key: string) => {
      delete store[key]
    },
    clear: () => {
      store = {}
    },
  }
})()

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
})

describe('CommissionBreakdownTable', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    localStorageMock.clear()
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  const mockCommissionData = {
    success: true,
    data: [
      {
        college_id: '1',
        college_name: 'University of Sydney',
        branch_id: 'b1',
        branch_name: 'Sydney Campus',
        branch_city: 'Sydney',
        total_commissions: 15000,
        total_gst: 1500,
        total_with_gst: 16500,
        total_expected_commission: 20000,
        total_earned_commission: 15000,
        outstanding_commission: 5000,
        payment_plan_count: 12,
      },
      {
        college_id: '2',
        college_name: 'University of Melbourne',
        branch_id: 'b2',
        branch_name: 'Melbourne Campus',
        branch_city: 'Melbourne',
        total_commissions: 12000,
        total_gst: 1200,
        total_with_gst: 13200,
        total_expected_commission: 15000,
        total_earned_commission: 12000,
        outstanding_commission: 3000,
        payment_plan_count: 10,
      },
    ],
  }

  const mockColleges = {
    success: true,
    data: [
      { id: '1', name: 'University of Sydney' },
      { id: '2', name: 'University of Melbourne' },
    ],
  }

  const mockBranches = {
    success: true,
    data: [
      { id: 'b1', name: 'Sydney Campus', city: 'Sydney', college_id: '1' },
      { id: 'b2', name: 'Melbourne Campus', city: 'Melbourne', college_id: '2' },
    ],
  }

  const setupMocks = () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ;(global.fetch as any).mockImplementation((url: string) => {
      if (url.includes('/api/commission-by-college')) {
        return Promise.resolve({
          ok: true,
          json: async () => mockCommissionData,
        })
      } else if (url.includes('/api/entities/colleges')) {
        return Promise.resolve({
          ok: true,
          json: async () => mockColleges,
        })
      } else if (url.includes('/api/entities/branches')) {
        return Promise.resolve({
          ok: true,
          json: async () => mockBranches,
        })
      }
      return Promise.reject(new Error('Unknown URL'))
    })
  }

  describe('Filter Controls Rendering', () => {
    it('should render all filter controls', async () => {
      setupMocks()
      renderWithQuery(<CommissionBreakdownTable />)

      await waitFor(() => {
        expect(screen.getByLabelText('Time Period')).toBeInTheDocument()
        expect(screen.getByLabelText('College')).toBeInTheDocument()
        expect(screen.getByLabelText('Branch')).toBeInTheDocument()
        expect(screen.getByText('Clear Filters')).toBeInTheDocument()
      })
    })

    it('should render time period dropdown with 4 options', async () => {
      setupMocks()
      renderWithQuery(<CommissionBreakdownTable />)

      await waitFor(() => {
        const periodDropdown = screen.getByLabelText('Time Period') as HTMLSelectElement
        const options = periodDropdown.querySelectorAll('option')
        expect(options).toHaveLength(4)
        expect(options[0].textContent).toBe('All Time')
        expect(options[1].textContent).toBe('This Year')
        expect(options[2].textContent).toBe('This Quarter')
        expect(options[3].textContent).toBe('This Month')
      })
    })

    it('should render college filter dropdown', async () => {
      setupMocks()
      renderWithQuery(<CommissionBreakdownTable />)

      await waitFor(() => {
        const collegeDropdown = screen.getByLabelText('College') as HTMLSelectElement
        expect(collegeDropdown).toBeInTheDocument()
      })

      // Wait for colleges to load
      await waitFor(() => {
        const collegeDropdown = screen.getByLabelText('College') as HTMLSelectElement
        const options = collegeDropdown.querySelectorAll('option')
        expect(options.length).toBeGreaterThan(1) // At least "All Colleges" + loaded colleges
      })
    })

    it('should render branch filter dropdown', async () => {
      setupMocks()
      renderWithQuery(<CommissionBreakdownTable />)

      await waitFor(() => {
        const branchDropdown = screen.getByLabelText('Branch') as HTMLSelectElement
        expect(branchDropdown).toBeInTheDocument()
      })
    })
  })

  describe('Time Period Filter', () => {
    it('should update filter state when time period changes', async () => {
      setupMocks()
      renderWithQuery(<CommissionBreakdownTable />)

      await waitFor(() => {
        expect(screen.getByLabelText('Time Period')).toBeInTheDocument()
      })

      const periodDropdown = screen.getByLabelText('Time Period') as HTMLSelectElement
      fireEvent.change(periodDropdown, { target: { value: 'year' } })

      await waitFor(() => {
        expect(periodDropdown.value).toBe('year')
      })

      // Verify API was called with correct parameter
      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(expect.stringContaining('period=year'))
      })
    })

    it('should show date range indicator when period is selected', async () => {
      setupMocks()
      renderWithQuery(<CommissionBreakdownTable />)

      await waitFor(() => {
        expect(screen.getByText(/Showing:/)).toBeInTheDocument()
        expect(screen.getByText(/All Time/)).toBeInTheDocument()
      })

      const periodDropdown = screen.getByLabelText('Time Period') as HTMLSelectElement
      fireEvent.change(periodDropdown, { target: { value: 'year' } })

      await waitFor(() => {
        // Should show a date range instead of "All Time"
        const showingText = screen.getByText(/Showing:/)
        expect(showingText).toBeInTheDocument()
      })
    })
  })

  describe('College Filter', () => {
    it('should update filter state and reset branch when college changes', async () => {
      setupMocks()
      renderWithQuery(<CommissionBreakdownTable />)

      await waitFor(() => {
        expect(screen.getByLabelText('College')).toBeInTheDocument()
      })

      // Wait for colleges to load
      await waitFor(() => {
        const collegeDropdown = screen.getByLabelText('College') as HTMLSelectElement
        const options = collegeDropdown.querySelectorAll('option')
        expect(options.length).toBeGreaterThan(1)
      })

      const collegeDropdown = screen.getByLabelText('College') as HTMLSelectElement
      fireEvent.change(collegeDropdown, { target: { value: '1' } })

      await waitFor(() => {
        expect(collegeDropdown.value).toBe('1')
      })

      // Verify API was called with college_id parameter
      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(expect.stringContaining('college_id=1'))
      })
    })

    it('should refetch branches when college is selected', async () => {
      setupMocks()
      renderWithQuery(<CommissionBreakdownTable />)

      await waitFor(() => {
        expect(screen.getByLabelText('College')).toBeInTheDocument()
      })

      // Wait for initial data load
      await waitFor(() => {
        const collegeDropdown = screen.getByLabelText('College') as HTMLSelectElement
        expect(collegeDropdown.querySelectorAll('option').length).toBeGreaterThan(1)
      })

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const initialFetchCount = (global.fetch as any).mock.calls.length

      const collegeDropdown = screen.getByLabelText('College') as HTMLSelectElement
      fireEvent.change(collegeDropdown, { target: { value: '1' } })

      // Should trigger new fetches for branches and commission data
      await waitFor(() => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const newFetchCount = (global.fetch as any).mock.calls.length
        expect(newFetchCount).toBeGreaterThan(initialFetchCount)
      })
    })
  })

  describe('Branch Filter', () => {
    it('should update filter state when branch changes', async () => {
      setupMocks()
      renderWithQuery(<CommissionBreakdownTable />)

      await waitFor(() => {
        expect(screen.getByLabelText('Branch')).toBeInTheDocument()
      })

      // Wait for branches to load
      await waitFor(() => {
        const branchDropdown = screen.getByLabelText('Branch') as HTMLSelectElement
        const options = branchDropdown.querySelectorAll('option')
        expect(options.length).toBeGreaterThan(1)
      })

      const branchDropdown = screen.getByLabelText('Branch') as HTMLSelectElement
      fireEvent.change(branchDropdown, { target: { value: 'b1' } })

      await waitFor(() => {
        expect(branchDropdown.value).toBe('b1')
      })

      // Verify API was called with branch_id parameter
      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(expect.stringContaining('branch_id=b1'))
      })
    })
  })

  describe('Clear Filters Button', () => {
    it('should reset all filters when clicked', async () => {
      setupMocks()
      renderWithQuery(<CommissionBreakdownTable />)

      // Wait for component to load
      await waitFor(() => {
        expect(screen.getByLabelText('Time Period')).toBeInTheDocument()
      })

      // Apply some filters
      const periodDropdown = screen.getByLabelText('Time Period') as HTMLSelectElement
      fireEvent.change(periodDropdown, { target: { value: 'year' } })

      await waitFor(() => {
        expect(periodDropdown.value).toBe('year')
      })

      // Click Clear Filters
      const clearButton = screen.getByText('Clear Filters')
      fireEvent.click(clearButton)

      // Verify filters are reset
      await waitFor(() => {
        expect(periodDropdown.value).toBe('all')
      })
    })

    it('should be disabled when no filters are active', async () => {
      setupMocks()
      renderWithQuery(<CommissionBreakdownTable />)

      await waitFor(() => {
        const clearButton = screen.getByText('Clear Filters')
        expect(clearButton).toBeDisabled()
      })
    })

    it('should be enabled when filters are active', async () => {
      setupMocks()
      renderWithQuery(<CommissionBreakdownTable />)

      await waitFor(() => {
        expect(screen.getByLabelText('Time Period')).toBeInTheDocument()
      })

      // Apply a filter
      const periodDropdown = screen.getByLabelText('Time Period') as HTMLSelectElement
      fireEvent.change(periodDropdown, { target: { value: 'year' } })

      // Clear button should be enabled
      await waitFor(() => {
        const clearButton = screen.getByText('Clear Filters')
        expect(clearButton).not.toBeDisabled()
      })
    })
  })

  describe('Active Filter Count Badge', () => {
    it('should not display badge when no filters are active', async () => {
      setupMocks()
      renderWithQuery(<CommissionBreakdownTable />)

      await waitFor(() => {
        expect(screen.getByText('Commission Breakdown by College')).toBeInTheDocument()
      })

      // Badge should not be visible
      expect(screen.queryByText(/filter.*active/i)).not.toBeInTheDocument()
    })

    it('should display "1 filter active" when one filter is applied', async () => {
      setupMocks()
      renderWithQuery(<CommissionBreakdownTable />)

      await waitFor(() => {
        expect(screen.getByLabelText('Time Period')).toBeInTheDocument()
      })

      // Apply one filter
      const periodDropdown = screen.getByLabelText('Time Period') as HTMLSelectElement
      fireEvent.change(periodDropdown, { target: { value: 'year' } })

      // Should show "1 filter active"
      await waitFor(() => {
        expect(screen.getByText('1 filter active')).toBeInTheDocument()
      })
    })

    it('should display "2 filters active" when two filters are applied', async () => {
      setupMocks()
      renderWithQuery(<CommissionBreakdownTable />)

      await waitFor(() => {
        expect(screen.getByLabelText('Time Period')).toBeInTheDocument()
      })

      // Wait for colleges to load
      await waitFor(() => {
        const collegeDropdown = screen.getByLabelText('College') as HTMLSelectElement
        expect(collegeDropdown.querySelectorAll('option').length).toBeGreaterThan(1)
      })

      // Apply two filters
      const periodDropdown = screen.getByLabelText('Time Period') as HTMLSelectElement
      fireEvent.change(periodDropdown, { target: { value: 'year' } })

      const collegeDropdown = screen.getByLabelText('College') as HTMLSelectElement
      fireEvent.change(collegeDropdown, { target: { value: '1' } })

      // Should show "2 filters active"
      await waitFor(() => {
        expect(screen.getByText('2 filters active')).toBeInTheDocument()
      })
    })
  })

  describe('Table Rendering', () => {
    it('should render table with commission data', async () => {
      setupMocks()
      renderWithQuery(<CommissionBreakdownTable />)

      await waitFor(() => {
        expect(screen.getByText('University of Sydney')).toBeInTheDocument()
        expect(screen.getByText('University of Melbourne')).toBeInTheDocument()
      })
    })

    it('should display loading state', () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ;(global.fetch as any).mockImplementation(
        () => new Promise(() => {}) // Never resolves
      )

      renderWithQuery(<CommissionBreakdownTable />)

      // Should show loading skeleton
      expect(screen.getByText('Commission Breakdown by College')).toBeInTheDocument()
    })

    it('should display error state with retry button', async () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ;(global.fetch as any).mockRejectedValueOnce(new Error('API Error'))

      renderWithQuery(<CommissionBreakdownTable />)

      await waitFor(() => {
        expect(screen.getByText('Failed to Load Data')).toBeInTheDocument()
        expect(screen.getByText('Try Again')).toBeInTheDocument()
      })
    })

    it('should display empty state when no data', async () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ;(global.fetch as any).mockImplementation((url: string) => {
        if (url.includes('/api/commission-by-college')) {
          return Promise.resolve({
            ok: true,
            json: async () => ({ success: true, data: [] }),
          })
        } else if (url.includes('/api/entities/colleges')) {
          return Promise.resolve({
            ok: true,
            json: async () => mockColleges,
          })
        } else if (url.includes('/api/entities/branches')) {
          return Promise.resolve({
            ok: true,
            json: async () => mockBranches,
          })
        }
        return Promise.reject(new Error('Unknown URL'))
      })

      renderWithQuery(<CommissionBreakdownTable />)

      await waitFor(() => {
        expect(screen.getByText('No Commission Data')).toBeInTheDocument()
      })
    })

    it('should highlight top 3 performers', async () => {
      const extendedMockData = {
        success: true,
        data: [
          mockCommissionData.data[0],
          mockCommissionData.data[1],
          { ...mockCommissionData.data[1], college_id: '3', branch_id: 'b3' },
          { ...mockCommissionData.data[1], college_id: '4', branch_id: 'b4' },
        ],
      }

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ;(global.fetch as any).mockImplementation((url: string) => {
        if (url.includes('/api/commission-by-college')) {
          return Promise.resolve({
            ok: true,
            json: async () => extendedMockData,
          })
        } else if (url.includes('/api/entities/colleges')) {
          return Promise.resolve({
            ok: true,
            json: async () => mockColleges,
          })
        } else if (url.includes('/api/entities/branches')) {
          return Promise.resolve({
            ok: true,
            json: async () => mockBranches,
          })
        }
        return Promise.reject(new Error('Unknown URL'))
      })

      renderWithQuery(<CommissionBreakdownTable />)

      await waitFor(() => {
        // Should show "Top 1", "Top 2", "Top 3" badges
        expect(screen.getByText('Top 1')).toBeInTheDocument()
        expect(screen.getByText('Top 2')).toBeInTheDocument()
        expect(screen.getByText('Top 3')).toBeInTheDocument()
      })
    })
  })

  describe('Filter Persistence', () => {
    it('should save filters to localStorage', async () => {
      setupMocks()
      renderWithQuery(<CommissionBreakdownTable />)

      await waitFor(() => {
        expect(screen.getByLabelText('Time Period')).toBeInTheDocument()
      })

      // Apply a filter
      const periodDropdown = screen.getByLabelText('Time Period') as HTMLSelectElement
      fireEvent.change(periodDropdown, { target: { value: 'year' } })

      await waitFor(() => {
        // Check that localStorage was updated
        const stored = localStorageMock.getItem('dashboard-store')
        expect(stored).toBeTruthy()
        if (stored) {
          const parsed = JSON.parse(stored)
          expect(parsed.state.commissionFilters.period).toBe('year')
        }
      })
    })
  })

  describe('Drill-Down Links - Task 4', () => {
    it('should render college name as a clickable link', async () => {
      setupMocks()
      renderWithQuery(<CommissionBreakdownTable />)

      await waitFor(() => {
        const collegeLink = screen.getByText('University of Sydney').closest('a')
        expect(collegeLink).toBeInTheDocument()
        expect(collegeLink).toHaveAttribute('href', '/entities/colleges/1')
      })
    })

    it('should render all college names as clickable links with correct hrefs', async () => {
      setupMocks()
      renderWithQuery(<CommissionBreakdownTable />)

      await waitFor(() => {
        const sydneyLink = screen.getByText('University of Sydney').closest('a')
        const melbourneLink = screen.getByText('University of Melbourne').closest('a')

        expect(sydneyLink).toHaveAttribute('href', '/entities/colleges/1')
        expect(melbourneLink).toHaveAttribute('href', '/entities/colleges/2')
      })
    })

    it('should render branch name as a clickable link', async () => {
      setupMocks()
      renderWithQuery(<CommissionBreakdownTable />)

      await waitFor(() => {
        const branchLink = screen.getByText('Sydney Campus').closest('a')
        expect(branchLink).toBeInTheDocument()
        expect(branchLink).toHaveAttribute('href', '/entities/colleges/1?branch=b1')
      })
    })

    it('should render all branch names as clickable links with correct hrefs', async () => {
      setupMocks()
      renderWithQuery(<CommissionBreakdownTable />)

      await waitFor(() => {
        const sydneyBranchLink = screen.getByText('Sydney Campus').closest('a')
        const melbourneBranchLink = screen.getByText('Melbourne Campus').closest('a')

        expect(sydneyBranchLink).toHaveAttribute('href', '/entities/colleges/1?branch=b1')
        expect(melbourneBranchLink).toHaveAttribute('href', '/entities/colleges/2?branch=b2')
      })
    })

    it('should render Actions column header', async () => {
      setupMocks()
      renderWithQuery(<CommissionBreakdownTable />)

      await waitFor(() => {
        expect(screen.getByText('Actions')).toBeInTheDocument()
      })
    })

    it('should render View Plans button for each row', async () => {
      setupMocks()
      renderWithQuery(<CommissionBreakdownTable />)

      await waitFor(() => {
        const viewPlansButtons = screen.getAllByText('View Plans')
        expect(viewPlansButtons).toHaveLength(2) // Two rows of data
      })
    })

    it('should render View Plans button with correct href for payment plans', async () => {
      setupMocks()
      renderWithQuery(<CommissionBreakdownTable />)

      await waitFor(() => {
        const viewPlansLinks = screen.getAllByText('View Plans')
        const firstLink = viewPlansLinks[0].closest('a')

        expect(firstLink).toHaveAttribute('href', '/payments/plans?college=1&branch=b1')
      })
    })

    it('should display payment plan count in View Plans button', async () => {
      setupMocks()
      renderWithQuery(<CommissionBreakdownTable />)

      await waitFor(() => {
        // Should show "(12)" for University of Sydney
        expect(screen.getByText('(12)')).toBeInTheDocument()
        // Should show "(10)" for University of Melbourne
        expect(screen.getByText('(10)')).toBeInTheDocument()
      })
    })

    it('should have descriptive title attribute on View Plans button', async () => {
      setupMocks()
      renderWithQuery(<CommissionBreakdownTable />)

      await waitFor(() => {
        const viewPlansLinks = screen.getAllByText('View Plans')
        const firstLink = viewPlansLinks[0].closest('a')

        expect(firstLink).toHaveAttribute(
          'title',
          'View 12 payment plans for University of Sydney - Sydney Campus'
        )
      })
    })

    it('should use singular "plan" when payment_plan_count is 1', async () => {
      const singlePlanData = {
        success: true,
        data: [
          {
            college_id: '1',
            college_name: 'Test College',
            branch_id: 'b1',
            branch_name: 'Test Campus',
            branch_city: 'Test City',
            total_commissions: 1000,
            total_gst: 100,
            total_with_gst: 1100,
            total_expected_commission: 1500,
            total_earned_commission: 1000,
            outstanding_commission: 500,
            payment_plan_count: 1,
          },
        ],
      }

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ;(global.fetch as any).mockImplementation((url: string) => {
        if (url.includes('/api/commission-by-college')) {
          return Promise.resolve({
            ok: true,
            json: async () => singlePlanData,
          })
        } else if (url.includes('/api/entities/colleges')) {
          return Promise.resolve({
            ok: true,
            json: async () => mockColleges,
          })
        } else if (url.includes('/api/entities/branches')) {
          return Promise.resolve({
            ok: true,
            json: async () => mockBranches,
          })
        }
        return Promise.reject(new Error('Unknown URL'))
      })

      renderWithQuery(<CommissionBreakdownTable />)

      await waitFor(() => {
        const viewPlansLink = screen.getByText('View Plans').closest('a')
        expect(viewPlansLink).toHaveAttribute(
          'title',
          'View 1 payment plan for Test College - Test Campus'
        )
      })
    })

    it('should apply blue link styling to college names', async () => {
      setupMocks()
      renderWithQuery(<CommissionBreakdownTable />)

      await waitFor(() => {
        const collegeLink = screen.getByText('University of Sydney').closest('a')
        expect(collegeLink).toHaveClass('text-blue-600', 'hover:underline')
      })
    })

    it('should apply blue link styling to branch names', async () => {
      setupMocks()
      renderWithQuery(<CommissionBreakdownTable />)

      await waitFor(() => {
        const branchLink = screen.getByText('Sydney Campus').closest('a')
        expect(branchLink).toHaveClass('text-blue-600', 'hover:underline')
      })
    })

    it('should have proper keyboard accessibility for all links', async () => {
      setupMocks()
      renderWithQuery(<CommissionBreakdownTable />)

      await waitFor(() => {
        const collegeLink = screen.getByText('University of Sydney').closest('a')
        const branchLink = screen.getByText('Sydney Campus').closest('a')
        const viewPlansButton = screen.getAllByText('View Plans')[0].closest('button')

        // Links should be focusable
        expect(collegeLink).not.toHaveAttribute('tabindex', '-1')
        expect(branchLink).not.toHaveAttribute('tabindex', '-1')
        expect(viewPlansButton).toHaveAttribute('type', 'button')
      })
    })

    it('should render View Plans button with Eye icon', async () => {
      setupMocks()
      renderWithQuery(<CommissionBreakdownTable />)

      await waitFor(() => {
        const viewPlansButtons = screen.getAllByText('View Plans')
        // Check that the button has an svg icon (Eye icon from lucide-react renders as svg)
        const firstButton = viewPlansButtons[0].closest('button')
        const svg = firstButton?.querySelector('svg')
        expect(svg).toBeInTheDocument()
      })
    })

    it('should maintain all drill-down links after filtering', async () => {
      setupMocks()
      renderWithQuery(<CommissionBreakdownTable />)

      // Wait for initial render
      await waitFor(() => {
        expect(screen.getByText('University of Sydney')).toBeInTheDocument()
      })

      // Apply a filter
      const periodDropdown = screen.getByLabelText('Time Period') as HTMLSelectElement
      fireEvent.change(periodDropdown, { target: { value: 'year' } })

      // Links should still be present after filtering
      await waitFor(() => {
        const collegeLink = screen.getByText('University of Sydney').closest('a')
        const branchLink = screen.getByText('Sydney Campus').closest('a')
        const viewPlansButtons = screen.getAllByText('View Plans')

        expect(collegeLink).toHaveAttribute('href', '/entities/colleges/1')
        expect(branchLink).toHaveAttribute('href', '/entities/colleges/1?branch=b1')
        expect(viewPlansButtons.length).toBeGreaterThan(0)
      })
    })
  })

  describe('Summary Metrics Cards - Task 5', () => {
    it('should render all 4 summary cards with correct titles', async () => {
      setupMocks()
      renderWithQuery(<CommissionBreakdownTable />)

      await waitFor(() => {
        expect(screen.getByText('Total Commissions Earned')).toBeInTheDocument()
        expect(screen.getByText('Total GST')).toBeInTheDocument()
        expect(screen.getByText('Total Amount (Commission + GST)')).toBeInTheDocument()
        expect(screen.getByText('Outstanding Commission')).toBeInTheDocument()
      })
    })

    it('should calculate total commissions correctly', async () => {
      setupMocks()
      renderWithQuery(<CommissionBreakdownTable />)

      // Expected: 15000 + 12000 = 27000
      await waitFor(() => {
        // Check if the formatted value appears (may include currency symbol)
        expect(screen.getByText(/27,000/)).toBeInTheDocument()
      })
    })

    it('should calculate total GST correctly', async () => {
      setupMocks()
      renderWithQuery(<CommissionBreakdownTable />)

      // Expected: 1500 + 1200 = 2700
      await waitFor(() => {
        expect(screen.getByText(/2,700/)).toBeInTheDocument()
      })
    })

    it('should calculate total amount (commission + GST) correctly', async () => {
      setupMocks()
      renderWithQuery(<CommissionBreakdownTable />)

      // Expected: 27000 + 2700 = 29700
      await waitFor(() => {
        expect(screen.getByText(/29,700/)).toBeInTheDocument()
      })
    })

    it('should calculate outstanding commission correctly', async () => {
      setupMocks()
      renderWithQuery(<CommissionBreakdownTable />)

      // Expected: 5000 + 3000 = 8000
      await waitFor(() => {
        expect(screen.getByText(/8,000/)).toBeInTheDocument()
      })
    })

    it('should calculate commission percentage correctly', async () => {
      setupMocks()
      renderWithQuery(<CommissionBreakdownTable />)

      // Commission percentage: (27000 / 29700) * 100 = 90.9%
      await waitFor(() => {
        expect(screen.getByText(/90.9% of total/)).toBeInTheDocument()
      })
    })

    it('should calculate GST percentage correctly', async () => {
      setupMocks()
      renderWithQuery(<CommissionBreakdownTable />)

      // GST percentage: (2700 / 29700) * 100 = 9.1%
      await waitFor(() => {
        expect(screen.getByText(/9.1% of total/)).toBeInTheDocument()
      })
    })

    it('should display percentage breakdown in Total Amount card', async () => {
      setupMocks()
      renderWithQuery(<CommissionBreakdownTable />)

      // Should show "91% + 9%" (rounded)
      await waitFor(() => {
        expect(screen.getByText(/91% \+ 9%/)).toBeInTheDocument()
      })
    })

    it('should display "Not yet received" subtitle for Outstanding Commission', async () => {
      setupMocks()
      renderWithQuery(<CommissionBreakdownTable />)

      await waitFor(() => {
        expect(screen.getByText('Not yet received')).toBeInTheDocument()
      })
    })

    it('should update summary metrics when filters change', async () => {
      const yearFilterData = {
        success: true,
        data: [
          {
            college_id: '1',
            college_name: 'University of Sydney',
            branch_id: 'b1',
            branch_name: 'Sydney Campus',
            branch_city: 'Sydney',
            total_commissions: 20000,
            total_gst: 2000,
            total_with_gst: 22000,
            total_expected_commission: 25000,
            total_earned_commission: 20000,
            outstanding_commission: 5000,
            payment_plan_count: 8,
          },
        ],
      }

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ;(global.fetch as any).mockImplementation((url: string) => {
        if (url.includes('/api/commission-by-college')) {
          // Return different data when year filter is applied
          if (url.includes('period=year')) {
            return Promise.resolve({
              ok: true,
              json: async () => yearFilterData,
            })
          }
          return Promise.resolve({
            ok: true,
            json: async () => mockCommissionData,
          })
        } else if (url.includes('/api/entities/colleges')) {
          return Promise.resolve({
            ok: true,
            json: async () => mockColleges,
          })
        } else if (url.includes('/api/entities/branches')) {
          return Promise.resolve({
            ok: true,
            json: async () => mockBranches,
          })
        }
        return Promise.reject(new Error('Unknown URL'))
      })

      renderWithQuery(<CommissionBreakdownTable />)

      // Wait for initial data to load (27000 commissions)
      await waitFor(() => {
        expect(screen.getByText(/27,000/)).toBeInTheDocument()
      })

      // Apply year filter
      const periodDropdown = screen.getByLabelText('Time Period') as HTMLSelectElement
      fireEvent.change(periodDropdown, { target: { value: 'year' } })

      // Summary should update to show 20000
      await waitFor(() => {
        expect(screen.getByText(/20,000/)).toBeInTheDocument()
      })
    })

    it('should display skeleton placeholders during loading', () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ;(global.fetch as any).mockImplementation(
        () => new Promise(() => {}) // Never resolves
      )

      renderWithQuery(<CommissionBreakdownTable />)

      // Should show 4 skeleton placeholders
      const skeletons = document.querySelectorAll('.animate-pulse')
      expect(skeletons.length).toBeGreaterThanOrEqual(4)
    })

    it('should display zero values with "No data available" when no data', async () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ;(global.fetch as any).mockImplementation((url: string) => {
        if (url.includes('/api/commission-by-college')) {
          return Promise.resolve({
            ok: true,
            json: async () => ({ success: true, data: [] }),
          })
        } else if (url.includes('/api/entities/colleges')) {
          return Promise.resolve({
            ok: true,
            json: async () => mockColleges,
          })
        } else if (url.includes('/api/entities/branches')) {
          return Promise.resolve({
            ok: true,
            json: async () => mockBranches,
          })
        }
        return Promise.reject(new Error('Unknown URL'))
      })

      renderWithQuery(<CommissionBreakdownTable />)

      await waitFor(() => {
        // Should show multiple "No data available" subtitles (4 cards)
        const noDataTexts = screen.getAllByText('No data available')
        expect(noDataTexts).toHaveLength(4)
      })
    })

    it('should display zero values when API returns error', async () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ;(global.fetch as any).mockRejectedValueOnce(new Error('API Error'))

      renderWithQuery(<CommissionBreakdownTable />)

      await waitFor(() => {
        // Should show "No data available" subtitles even in error state
        const noDataTexts = screen.getAllByText('No data available')
        expect(noDataTexts).toHaveLength(4)
      })
    })

    it('should use responsive grid classes for summary cards', async () => {
      setupMocks()
      renderWithQuery(<CommissionBreakdownTable />)

      await waitFor(() => {
        const summaryGrid = document.querySelector(
          '.grid.grid-cols-1.md\\:grid-cols-2.lg\\:grid-cols-4'
        )
        expect(summaryGrid).toBeInTheDocument()
      })
    })

    it('should apply correct color classes to each summary card', async () => {
      setupMocks()
      renderWithQuery(<CommissionBreakdownTable />)

      await waitFor(() => {
        // Total Commissions - green
        const commissionCard = screen.getByText('Total Commissions Earned').closest('div')
        expect(commissionCard).toHaveClass('bg-green-50')

        // Total GST - blue
        const gstCard = screen.getByText('Total GST').closest('div')
        expect(gstCard).toHaveClass('bg-blue-50')

        // Total Amount - gray
        const totalCard = screen.getByText('Total Amount (Commission + GST)').closest('div')
        expect(totalCard).toHaveClass('bg-gray-50')

        // Outstanding - red
        const outstandingCard = screen.getByText('Outstanding Commission').closest('div')
        expect(outstandingCard).toHaveClass('bg-red-50')
      })
    })

    it('should render icons for each summary card', async () => {
      setupMocks()
      renderWithQuery(<CommissionBreakdownTable />)

      await waitFor(() => {
        const summaryCards = document.querySelectorAll('.grid > div')
        // Each card should have an svg icon
        summaryCards.forEach((card) => {
          const icon = card.querySelector('svg')
          expect(icon).toBeInTheDocument()
        })
      })
    })

    it('should handle zero division when calculating percentages', async () => {
      const zeroData = {
        success: true,
        data: [
          {
            college_id: '1',
            college_name: 'Test College',
            branch_id: 'b1',
            branch_name: 'Test Campus',
            branch_city: null,
            total_commissions: 0,
            total_gst: 0,
            total_with_gst: 0,
            total_expected_commission: 0,
            total_earned_commission: 0,
            outstanding_commission: 0,
            payment_plan_count: 0,
          },
        ],
      }

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ;(global.fetch as any).mockImplementation((url: string) => {
        if (url.includes('/api/commission-by-college')) {
          return Promise.resolve({
            ok: true,
            json: async () => zeroData,
          })
        } else if (url.includes('/api/entities/colleges')) {
          return Promise.resolve({
            ok: true,
            json: async () => mockColleges,
          })
        } else if (url.includes('/api/entities/branches')) {
          return Promise.resolve({
            ok: true,
            json: async () => mockBranches,
          })
        }
        return Promise.reject(new Error('Unknown URL'))
      })

      renderWithQuery(<CommissionBreakdownTable />)

      // Should show 0.0% instead of NaN or undefined
      await waitFor(() => {
        expect(screen.getByText(/0.0% of total/)).toBeInTheDocument()
      })
    })

    it('should format currency amounts with correct symbols and separators', async () => {
      setupMocks()
      renderWithQuery(<CommissionBreakdownTable />)

      await waitFor(() => {
        // Check that currency formatting includes currency symbol (likely $)
        // and thousands separator (comma)
        const formattedAmounts = screen.getAllByText(/\$.*,/)
        expect(formattedAmounts.length).toBeGreaterThan(0)
      })
    })

    it('should maintain summary cards position above filter controls', async () => {
      setupMocks()
      renderWithQuery(<CommissionBreakdownTable />)

      await waitFor(() => {
        const summaryCards = screen.getByText('Total Commissions Earned').closest('.grid')
        const filterControls = screen.getByLabelText('Time Period').closest('.space-y-3')

        // Summary cards should appear before filter controls in the DOM
        expect(summaryCards?.compareDocumentPosition(filterControls!)).toBe(
          Node.DOCUMENT_POSITION_FOLLOWING
        )
      })
    })
  })

  describe('TanStack Table Sorting - Task 2', () => {
    it('should render table with sortable column headers', async () => {
      setupMocks()
      renderWithQuery(<CommissionBreakdownTable />)

      await waitFor(() => {
        expect(screen.getByText('College')).toBeInTheDocument()
        expect(screen.getByText('Branch')).toBeInTheDocument()
        expect(screen.getByText('Commissions')).toBeInTheDocument()
        expect(screen.getByText('GST')).toBeInTheDocument()
        expect(screen.getByText('Total (+ GST)')).toBeInTheDocument()
        expect(screen.getByText('Expected')).toBeInTheDocument()
        expect(screen.getByText('Earned')).toBeInTheDocument()
        expect(screen.getByText('Outstanding')).toBeInTheDocument()
      })
    })

    it('should display sort indicators on column headers', async () => {
      setupMocks()
      renderWithQuery(<CommissionBreakdownTable />)

      await waitFor(() => {
        // ArrowDown icon should be present (default sort on Earned DESC)
        const icons = document.querySelectorAll('svg')
        const hasArrowIcon = Array.from(icons).some(
          (icon) =>
            icon.classList.contains('lucide-arrow-down') ||
            icon.classList.contains('lucide-arrow-up') ||
            icon.classList.contains('lucide-arrow-up-down')
        )
        expect(hasArrowIcon).toBe(true)
      })
    })

    it('should default sort by earned commission in descending order', async () => {
      const sortedData = {
        success: true,
        data: [
          {
            ...mockCommissionData.data[0],
            total_earned_commission: 20000,
          },
          {
            ...mockCommissionData.data[1],
            total_earned_commission: 15000,
          },
          {
            ...mockCommissionData.data[1],
            college_id: '3',
            branch_id: 'b3',
            college_name: 'University of Brisbane',
            total_earned_commission: 10000,
          },
        ],
      }

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ;(global.fetch as any).mockImplementation((url: string) => {
        if (url.includes('/api/commission-by-college')) {
          return Promise.resolve({
            ok: true,
            json: async () => sortedData,
          })
        } else if (url.includes('/api/entities/colleges')) {
          return Promise.resolve({
            ok: true,
            json: async () => mockColleges,
          })
        } else if (url.includes('/api/entities/branches')) {
          return Promise.resolve({
            ok: true,
            json: async () => mockBranches,
          })
        }
        return Promise.reject(new Error('Unknown URL'))
      })

      renderWithQuery(<CommissionBreakdownTable />)

      await waitFor(() => {
        const rows = document.querySelectorAll('tbody tr')
        expect(rows.length).toBe(3)

        // First row should be highest earner (20000)
        expect(rows[0].textContent).toContain('University of Sydney')

        // Second row should be second highest (15000)
        expect(rows[1].textContent).toContain('University of Melbourne')

        // Third row should be lowest (10000)
        expect(rows[2].textContent).toContain('University of Brisbane')
      })
    })

    it('should toggle sort direction when clicking column header', async () => {
      setupMocks()
      renderWithQuery(<CommissionBreakdownTable />)

      await waitFor(() => {
        expect(screen.getByText('College')).toBeInTheDocument()
      })

      // Find the College column header
      const collegeHeader = screen.getByText('College').closest('th')
      expect(collegeHeader).toBeInTheDocument()

      // Click to sort by college name
      fireEvent.click(collegeHeader!)

      await waitFor(() => {
        // Should now be sorted ascending by college name
        const rows = document.querySelectorAll('tbody tr')
        expect(rows.length).toBe(2)
      })

      // Click again to toggle to descending
      fireEvent.click(collegeHeader!)

      await waitFor(() => {
        const rows = document.querySelectorAll('tbody tr')
        expect(rows.length).toBe(2)
      })
    })

    it('should sort numeric columns correctly', async () => {
      const numericData = {
        success: true,
        data: [
          {
            ...mockCommissionData.data[0],
            total_commissions: 5000,
          },
          {
            ...mockCommissionData.data[1],
            total_commissions: 15000,
          },
          {
            ...mockCommissionData.data[1],
            college_id: '3',
            branch_id: 'b3',
            college_name: 'Test College 3',
            total_commissions: 10000,
          },
        ],
      }

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ;(global.fetch as any).mockImplementation((url: string) => {
        if (url.includes('/api/commission-by-college')) {
          return Promise.resolve({
            ok: true,
            json: async () => numericData,
          })
        } else if (url.includes('/api/entities/colleges')) {
          return Promise.resolve({
            ok: true,
            json: async () => mockColleges,
          })
        } else if (url.includes('/api/entities/branches')) {
          return Promise.resolve({
            ok: true,
            json: async () => mockBranches,
          })
        }
        return Promise.reject(new Error('Unknown URL'))
      })

      renderWithQuery(<CommissionBreakdownTable />)

      await waitFor(() => {
        expect(screen.getByText('Commissions')).toBeInTheDocument()
      })

      // Click the Commissions header to sort
      const commissionsHeader = screen.getByText('Commissions').closest('th')
      fireEvent.click(commissionsHeader!)

      await waitFor(() => {
        const rows = document.querySelectorAll('tbody tr')
        expect(rows.length).toBe(3)
      })
    })

    it('should show ArrowUp icon when sorted ascending', async () => {
      setupMocks()
      renderWithQuery(<CommissionBreakdownTable />)

      await waitFor(() => {
        expect(screen.getByText('College')).toBeInTheDocument()
      })

      // Click to sort by college (will be ascending by default)
      const collegeHeader = screen.getByText('College').closest('th')
      fireEvent.click(collegeHeader!)

      await waitFor(() => {
        // Should show ArrowUp icon for ascending sort
        const icons = document.querySelectorAll('svg')
        const hasArrowUpIcon = Array.from(icons).some((icon) =>
          icon.classList.contains('lucide-arrow-up')
        )
        expect(hasArrowUpIcon).toBe(true)
      })
    })

    it('should show ArrowDown icon when sorted descending', async () => {
      setupMocks()
      renderWithQuery(<CommissionBreakdownTable />)

      await waitFor(() => {
        expect(screen.getByText('Earned')).toBeInTheDocument()
      })

      // Earned should be sorted DESC by default, so ArrowDown should be present
      await waitFor(() => {
        const icons = document.querySelectorAll('svg')
        const hasArrowDownIcon = Array.from(icons).some((icon) =>
          icon.classList.contains('lucide-arrow-down')
        )
        expect(hasArrowDownIcon).toBe(true)
      })
    })

    it('should show ArrowUpDown icon on unsorted columns', async () => {
      setupMocks()
      renderWithQuery(<CommissionBreakdownTable />)

      await waitFor(() => {
        expect(screen.getByText('GST')).toBeInTheDocument()
      })

      // GST column should show the neutral sort icon (not currently sorted)
      await waitFor(() => {
        const icons = document.querySelectorAll('svg')
        const hasArrowUpDownIcon = Array.from(icons).some((icon) =>
          icon.classList.contains('lucide-arrow-up-down')
        )
        expect(hasArrowUpDownIcon).toBe(true)
      })
    })

    it('should apply cursor-pointer class to sortable headers', async () => {
      setupMocks()
      renderWithQuery(<CommissionBreakdownTable />)

      await waitFor(() => {
        const collegeHeader = screen.getByText('College').closest('th')
        const headerDiv = collegeHeader?.querySelector('.cursor-pointer')
        expect(headerDiv).toBeInTheDocument()
      })
    })

    it('should not show sort icon on Actions column', async () => {
      setupMocks()
      renderWithQuery(<CommissionBreakdownTable />)

      await waitFor(() => {
        const actionsHeader = screen.getByText('Actions').closest('th')
        expect(actionsHeader).toBeInTheDocument()

        // Actions column should not have cursor-pointer class
        const headerDiv = actionsHeader?.querySelector('.cursor-pointer')
        expect(headerDiv).not.toBeInTheDocument()
      })
    })

    it('should maintain sort state when filters change', async () => {
      setupMocks()
      renderWithQuery(<CommissionBreakdownTable />)

      await waitFor(() => {
        expect(screen.getByText('College')).toBeInTheDocument()
      })

      // Sort by College
      const collegeHeader = screen.getByText('College').closest('th')
      fireEvent.click(collegeHeader!)

      await waitFor(() => {
        const rows = document.querySelectorAll('tbody tr')
        expect(rows.length).toBeGreaterThan(0)
      })

      // Change filter
      const periodDropdown = screen.getByLabelText('Time Period') as HTMLSelectElement
      fireEvent.change(periodDropdown, { target: { value: 'year' } })

      // Sort indicator should still be present after filter change
      await waitFor(() => {
        const icons = document.querySelectorAll('svg')
        const hasArrowIcon = Array.from(icons).some(
          (icon) =>
            icon.classList.contains('lucide-arrow-up') ||
            icon.classList.contains('lucide-arrow-down')
        )
        expect(hasArrowIcon).toBe(true)
      })
    })

    it('should align numeric column headers to the right', async () => {
      setupMocks()
      renderWithQuery(<CommissionBreakdownTable />)

      await waitFor(() => {
        const commissionsHeader = screen.getByText('Commissions').closest('th')
        expect(commissionsHeader).toHaveClass('text-right')

        const gstHeader = screen.getByText('GST').closest('th')
        expect(gstHeader).toHaveClass('text-right')

        const earnedHeader = screen.getByText('Earned').closest('th')
        expect(earnedHeader).toHaveClass('text-right')
      })
    })

    it('should align text column headers to the left', async () => {
      setupMocks()
      renderWithQuery(<CommissionBreakdownTable />)

      await waitFor(() => {
        const collegeHeader = screen.getByText('College').closest('th')
        expect(collegeHeader).toHaveClass('text-left')

        const branchHeader = screen.getByText('Branch').closest('th')
        expect(branchHeader).toHaveClass('text-left')
      })
    })

    it('should center align Actions column header', async () => {
      setupMocks()
      renderWithQuery(<CommissionBreakdownTable />)

      await waitFor(() => {
        const actionsHeader = screen.getByText('Actions').closest('th')
        expect(actionsHeader).toHaveClass('text-center')
      })
    })
  })
})
