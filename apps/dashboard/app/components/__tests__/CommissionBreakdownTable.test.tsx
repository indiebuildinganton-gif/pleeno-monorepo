/**
 * CommissionBreakdownTable Component Tests
 *
 * Tests for the commission breakdown table component with filter controls
 * Epic 6: Dashboard & Reporting Zone
 * Story 6.3: Commission Breakdown by College
 * Task 3: Implement Filter Controls
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
})
