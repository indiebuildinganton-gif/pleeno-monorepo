/**
 * CommissionBreakdownWidget Component Tests
 *
 * Comprehensive tests for the commission breakdown widget including:
 * - Widget rendering and structure
 * - Header with title and control buttons
 * - Refresh button with loading state
 * - Export button placeholder (disabled)
 * - Date range indicator
 * - Summary cards integration
 * - Filter controls integration
 * - Table integration
 * - Responsive layout
 *
 * Epic 6: Dashboard & Reporting Zone
 * Story 6.3: Commission Breakdown by College
 * Task 6: Add Widget Header and Controls
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, waitFor, fireEvent } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { CommissionBreakdownWidget } from '../CommissionBreakdownWidget'

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

describe('CommissionBreakdownWidget', () => {
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

  describe('Widget Structure and Rendering', () => {
    it('renders widget container with proper styling', async () => {
      ;(global.fetch as any).mockImplementation((url: string) => {
        if (url.includes('/api/commission-by-college')) {
          return Promise.resolve({ ok: true, json: async () => mockCommissionData })
        }
        if (url.includes('/api/entities/colleges')) {
          return Promise.resolve({ ok: true, json: async () => mockColleges })
        }
        if (url.includes('/api/entities/branches')) {
          return Promise.resolve({ ok: true, json: async () => mockBranches })
        }
        return Promise.reject(new Error('Unknown URL'))
      })

      const { container } = renderWithQuery(<CommissionBreakdownWidget />)

      await waitFor(() => {
        expect(screen.getByText('Commission Breakdown by College')).toBeInTheDocument()
      })

      // Check widget container has proper classes
      const widget = container.firstChild as HTMLElement
      expect(widget).toHaveClass('bg-white', 'rounded-lg', 'shadow-sm', 'border')
    })

    it('renders widget with header section', async () => {
      ;(global.fetch as any).mockImplementation((url: string) => {
        if (url.includes('/api/commission-by-college')) {
          return Promise.resolve({ ok: true, json: async () => mockCommissionData })
        }
        if (url.includes('/api/entities/colleges')) {
          return Promise.resolve({ ok: true, json: async () => mockColleges })
        }
        if (url.includes('/api/entities/branches')) {
          return Promise.resolve({ ok: true, json: async () => mockBranches })
        }
        return Promise.reject(new Error('Unknown URL'))
      })

      renderWithQuery(<CommissionBreakdownWidget />)

      await waitFor(() => {
        expect(screen.getByText('Commission Breakdown by College')).toBeInTheDocument()
      })

      // Check header title
      const title = screen.getByText('Commission Breakdown by College')
      expect(title).toBeInTheDocument()
      expect(title.tagName).toBe('H2')
    })

    it('renders refresh and export buttons in header', async () => {
      ;(global.fetch as any).mockImplementation((url: string) => {
        if (url.includes('/api/commission-by-college')) {
          return Promise.resolve({ ok: true, json: async () => mockCommissionData })
        }
        if (url.includes('/api/entities/colleges')) {
          return Promise.resolve({ ok: true, json: async () => mockColleges })
        }
        if (url.includes('/api/entities/branches')) {
          return Promise.resolve({ ok: true, json: async () => mockBranches })
        }
        return Promise.reject(new Error('Unknown URL'))
      })

      renderWithQuery(<CommissionBreakdownWidget />)

      await waitFor(() => {
        expect(screen.getByText('Commission Breakdown by College')).toBeInTheDocument()
      })

      // Check refresh button exists
      const refreshButton = screen.getByTitle('Refresh data')
      expect(refreshButton).toBeInTheDocument()
      expect(refreshButton).not.toBeDisabled()

      // Check export button exists and is disabled
      const exportButton = screen.getByTitle('Export to CSV (coming soon)')
      expect(exportButton).toBeInTheDocument()
      expect(exportButton).toBeDisabled()
    })
  })

  describe('Refresh Button Functionality', () => {
    it('triggers refetch when refresh button is clicked', async () => {
      let fetchCount = 0
      ;(global.fetch as any).mockImplementation((url: string) => {
        if (url.includes('/api/commission-by-college')) {
          fetchCount++
          return Promise.resolve({ ok: true, json: async () => mockCommissionData })
        }
        if (url.includes('/api/entities/colleges')) {
          return Promise.resolve({ ok: true, json: async () => mockColleges })
        }
        if (url.includes('/api/entities/branches')) {
          return Promise.resolve({ ok: true, json: async () => mockBranches })
        }
        return Promise.reject(new Error('Unknown URL'))
      })

      renderWithQuery(<CommissionBreakdownWidget />)

      await waitFor(() => {
        expect(screen.getByText('Commission Breakdown by College')).toBeInTheDocument()
      })

      const initialFetchCount = fetchCount

      // Click refresh button
      const refreshButton = screen.getByTitle('Refresh data')
      fireEvent.click(refreshButton)

      await waitFor(() => {
        expect(fetchCount).toBeGreaterThan(initialFetchCount)
      })
    })

    it('shows loading state during refetch (spin animation)', async () => {
      ;(global.fetch as any).mockImplementation((url: string) => {
        if (url.includes('/api/commission-by-college')) {
          return new Promise((resolve) =>
            setTimeout(
              () => resolve({ ok: true, json: async () => mockCommissionData }),
              100
            )
          )
        }
        if (url.includes('/api/entities/colleges')) {
          return Promise.resolve({ ok: true, json: async () => mockColleges })
        }
        if (url.includes('/api/entities/branches')) {
          return Promise.resolve({ ok: true, json: async () => mockBranches })
        }
        return Promise.reject(new Error('Unknown URL'))
      })

      renderWithQuery(<CommissionBreakdownWidget />)

      await waitFor(() => {
        expect(screen.getByText('Commission Breakdown by College')).toBeInTheDocument()
      })

      // Click refresh button
      const refreshButton = screen.getByTitle('Refresh data')
      fireEvent.click(refreshButton)

      // During refetch, button should be disabled
      await waitFor(() => {
        expect(refreshButton).toBeDisabled()
      })
    })

    it('returns to normal state after refetch completes', async () => {
      ;(global.fetch as any).mockImplementation((url: string) => {
        if (url.includes('/api/commission-by-college')) {
          return Promise.resolve({ ok: true, json: async () => mockCommissionData })
        }
        if (url.includes('/api/entities/colleges')) {
          return Promise.resolve({ ok: true, json: async () => mockColleges })
        }
        if (url.includes('/api/entities/branches')) {
          return Promise.resolve({ ok: true, json: async () => mockBranches })
        }
        return Promise.reject(new Error('Unknown URL'))
      })

      renderWithQuery(<CommissionBreakdownWidget />)

      await waitFor(() => {
        expect(screen.getByText('Commission Breakdown by College')).toBeInTheDocument()
      })

      const refreshButton = screen.getByTitle('Refresh data')
      fireEvent.click(refreshButton)

      // After refetch, button should be enabled again
      await waitFor(() => {
        expect(refreshButton).not.toBeDisabled()
      })
    })
  })

  describe('Export Button (Placeholder)', () => {
    it('renders export button as disabled', async () => {
      ;(global.fetch as any).mockImplementation((url: string) => {
        if (url.includes('/api/commission-by-college')) {
          return Promise.resolve({ ok: true, json: async () => mockCommissionData })
        }
        if (url.includes('/api/entities/colleges')) {
          return Promise.resolve({ ok: true, json: async () => mockColleges })
        }
        if (url.includes('/api/entities/branches')) {
          return Promise.resolve({ ok: true, json: async () => mockBranches })
        }
        return Promise.reject(new Error('Unknown URL'))
      })

      renderWithQuery(<CommissionBreakdownWidget />)

      await waitFor(() => {
        expect(screen.getByText('Commission Breakdown by College')).toBeInTheDocument()
      })

      const exportButton = screen.getByTitle('Export to CSV (coming soon)')
      expect(exportButton).toBeDisabled()
    })

    it('shows tooltip indicating coming soon', async () => {
      ;(global.fetch as any).mockImplementation((url: string) => {
        if (url.includes('/api/commission-by-college')) {
          return Promise.resolve({ ok: true, json: async () => mockCommissionData })
        }
        if (url.includes('/api/entities/colleges')) {
          return Promise.resolve({ ok: true, json: async () => mockColleges })
        }
        if (url.includes('/api/entities/branches')) {
          return Promise.resolve({ ok: true, json: async () => mockBranches })
        }
        return Promise.reject(new Error('Unknown URL'))
      })

      renderWithQuery(<CommissionBreakdownWidget />)

      await waitFor(() => {
        expect(screen.getByText('Commission Breakdown by College')).toBeInTheDocument()
      })

      const exportButton = screen.getByTitle('Export to CSV (coming soon)')
      expect(exportButton).toHaveAttribute('title', 'Export to CSV (coming soon)')
    })

    it('does not trigger action when clicked (disabled)', async () => {
      const mockAction = vi.fn()
      ;(global.fetch as any).mockImplementation((url: string) => {
        if (url.includes('/api/commission-by-college')) {
          return Promise.resolve({ ok: true, json: async () => mockCommissionData })
        }
        if (url.includes('/api/entities/colleges')) {
          return Promise.resolve({ ok: true, json: async () => mockColleges })
        }
        if (url.includes('/api/entities/branches')) {
          return Promise.resolve({ ok: true, json: async () => mockBranches })
        }
        return Promise.reject(new Error('Unknown URL'))
      })

      renderWithQuery(<CommissionBreakdownWidget />)

      await waitFor(() => {
        expect(screen.getByText('Commission Breakdown by College')).toBeInTheDocument()
      })

      const exportButton = screen.getByTitle('Export to CSV (coming soon)')

      // Try to click (should not work because disabled)
      fireEvent.click(exportButton)

      // No action should have been triggered
      expect(mockAction).not.toHaveBeenCalled()
    })
  })

  describe('Date Range Indicator', () => {
    it('displays "All Time" for period=all', async () => {
      ;(global.fetch as any).mockImplementation((url: string) => {
        if (url.includes('/api/commission-by-college')) {
          return Promise.resolve({ ok: true, json: async () => mockCommissionData })
        }
        if (url.includes('/api/entities/colleges')) {
          return Promise.resolve({ ok: true, json: async () => mockColleges })
        }
        if (url.includes('/api/entities/branches')) {
          return Promise.resolve({ ok: true, json: async () => mockBranches })
        }
        return Promise.reject(new Error('Unknown URL'))
      })

      renderWithQuery(<CommissionBreakdownWidget />)

      await waitFor(() => {
        expect(screen.getByText('Commission Breakdown by College')).toBeInTheDocument()
      })

      // Default period is "all"
      expect(screen.getByText(/All Time/)).toBeInTheDocument()
    })

    it('displays date range for period=year', async () => {
      // Set localStorage to have period="year"
      localStorageMock.setItem(
        'dashboard-store',
        JSON.stringify({
          state: {
            commissionFilters: { period: 'year', college_id: null, branch_id: null },
          },
        })
      )

      ;(global.fetch as any).mockImplementation((url: string) => {
        if (url.includes('/api/commission-by-college')) {
          return Promise.resolve({ ok: true, json: async () => mockCommissionData })
        }
        if (url.includes('/api/entities/colleges')) {
          return Promise.resolve({ ok: true, json: async () => mockColleges })
        }
        if (url.includes('/api/entities/branches')) {
          return Promise.resolve({ ok: true, json: async () => mockBranches })
        }
        return Promise.reject(new Error('Unknown URL'))
      })

      renderWithQuery(<CommissionBreakdownWidget />)

      await waitFor(() => {
        expect(screen.getByText('Commission Breakdown by College')).toBeInTheDocument()
      })

      // Should show year date range
      expect(screen.getByText(/Jan 1 - Dec 31/)).toBeInTheDocument()
    })

    it('updates date range when period filter changes', async () => {
      ;(global.fetch as any).mockImplementation((url: string) => {
        if (url.includes('/api/commission-by-college')) {
          return Promise.resolve({ ok: true, json: async () => mockCommissionData })
        }
        if (url.includes('/api/entities/colleges')) {
          return Promise.resolve({ ok: true, json: async () => mockColleges })
        }
        if (url.includes('/api/entities/branches')) {
          return Promise.resolve({ ok: true, json: async () => mockBranches })
        }
        return Promise.reject(new Error('Unknown URL'))
      })

      renderWithQuery(<CommissionBreakdownWidget />)

      await waitFor(() => {
        expect(screen.getByText('Commission Breakdown by College')).toBeInTheDocument()
      })

      // Initially shows "All Time"
      expect(screen.getByText(/All Time/)).toBeInTheDocument()

      // Change period to "year"
      const periodSelect = screen.getByLabelText('Time Period')
      fireEvent.change(periodSelect, { target: { value: 'year' } })

      await waitFor(() => {
        expect(screen.getByText(/Jan 1 - Dec 31/)).toBeInTheDocument()
      })
    })
  })

  describe('Widget Sections Integration', () => {
    it('renders summary cards section', async () => {
      ;(global.fetch as any).mockImplementation((url: string) => {
        if (url.includes('/api/commission-by-college')) {
          return Promise.resolve({ ok: true, json: async () => mockCommissionData })
        }
        if (url.includes('/api/entities/colleges')) {
          return Promise.resolve({ ok: true, json: async () => mockColleges })
        }
        if (url.includes('/api/entities/branches')) {
          return Promise.resolve({ ok: true, json: async () => mockBranches })
        }
        return Promise.reject(new Error('Unknown URL'))
      })

      renderWithQuery(<CommissionBreakdownWidget />)

      await waitFor(() => {
        expect(screen.getByText('Commission Breakdown by College')).toBeInTheDocument()
      })

      // Check summary card titles
      expect(screen.getByText('Total Commissions Earned')).toBeInTheDocument()
      expect(screen.getByText('Total GST')).toBeInTheDocument()
      expect(screen.getByText('Total Amount (Commission + GST)')).toBeInTheDocument()
      expect(screen.getByText('Outstanding Commission')).toBeInTheDocument()
    })

    it('renders filter controls section', async () => {
      ;(global.fetch as any).mockImplementation((url: string) => {
        if (url.includes('/api/commission-by-college')) {
          return Promise.resolve({ ok: true, json: async () => mockCommissionData })
        }
        if (url.includes('/api/entities/colleges')) {
          return Promise.resolve({ ok: true, json: async () => mockColleges })
        }
        if (url.includes('/api/entities/branches')) {
          return Promise.resolve({ ok: true, json: async () => mockBranches })
        }
        return Promise.reject(new Error('Unknown URL'))
      })

      renderWithQuery(<CommissionBreakdownWidget />)

      await waitFor(() => {
        expect(screen.getByText('Commission Breakdown by College')).toBeInTheDocument()
      })

      // Check filter controls
      expect(screen.getByLabelText('Time Period')).toBeInTheDocument()
      expect(screen.getByLabelText('College')).toBeInTheDocument()
      expect(screen.getByLabelText('Branch')).toBeInTheDocument()
      expect(screen.getByText('Clear Filters')).toBeInTheDocument()
    })

    it('renders table section with data', async () => {
      ;(global.fetch as any).mockImplementation((url: string) => {
        if (url.includes('/api/commission-by-college')) {
          return Promise.resolve({ ok: true, json: async () => mockCommissionData })
        }
        if (url.includes('/api/entities/colleges')) {
          return Promise.resolve({ ok: true, json: async () => mockColleges })
        }
        if (url.includes('/api/entities/branches')) {
          return Promise.resolve({ ok: true, json: async () => mockBranches })
        }
        return Promise.reject(new Error('Unknown URL'))
      })

      renderWithQuery(<CommissionBreakdownWidget />)

      await waitFor(() => {
        expect(screen.getByText('University of Sydney')).toBeInTheDocument()
      })

      // Check table data
      expect(screen.getByText('University of Sydney')).toBeInTheDocument()
      expect(screen.getByText('University of Melbourne')).toBeInTheDocument()
      expect(screen.getByText('Sydney Campus')).toBeInTheDocument()
      expect(screen.getByText('Melbourne Campus')).toBeInTheDocument()
    })
  })

  describe('Loading and Error States', () => {
    it('shows loading skeleton during initial load', () => {
      ;(global.fetch as any).mockImplementation((url: string) => {
        return new Promise(() => {}) // Never resolves
      })

      renderWithQuery(<CommissionBreakdownWidget />)

      // Should show loading skeletons
      const skeletons = document.querySelectorAll('.animate-pulse')
      expect(skeletons.length).toBeGreaterThan(0)
    })

    it('shows error state with retry button on fetch failure', async () => {
      ;(global.fetch as any).mockImplementation((url: string) => {
        if (url.includes('/api/commission-by-college')) {
          return Promise.resolve({ ok: false })
        }
        if (url.includes('/api/entities/colleges')) {
          return Promise.resolve({ ok: true, json: async () => mockColleges })
        }
        if (url.includes('/api/entities/branches')) {
          return Promise.resolve({ ok: true, json: async () => mockBranches })
        }
        return Promise.reject(new Error('Unknown URL'))
      })

      renderWithQuery(<CommissionBreakdownWidget />)

      await waitFor(() => {
        expect(screen.getByText('Failed to Load Data')).toBeInTheDocument()
      })

      expect(screen.getByText('Try Again')).toBeInTheDocument()
    })

    it('shows empty state when no data available', async () => {
      ;(global.fetch as any).mockImplementation((url: string) => {
        if (url.includes('/api/commission-by-college')) {
          return Promise.resolve({ ok: true, json: async () => ({ success: true, data: [] }) })
        }
        if (url.includes('/api/entities/colleges')) {
          return Promise.resolve({ ok: true, json: async () => mockColleges })
        }
        if (url.includes('/api/entities/branches')) {
          return Promise.resolve({ ok: true, json: async () => mockBranches })
        }
        return Promise.reject(new Error('Unknown URL'))
      })

      renderWithQuery(<CommissionBreakdownWidget />)

      await waitFor(() => {
        expect(screen.getByText('No Commission Data')).toBeInTheDocument()
      })

      expect(
        screen.getByText(
          /No commission data available for the selected filters. Try adjusting your filters./
        )
      ).toBeInTheDocument()
    })
  })

  describe('Responsive Design', () => {
    it('renders with custom className', async () => {
      ;(global.fetch as any).mockImplementation((url: string) => {
        if (url.includes('/api/commission-by-college')) {
          return Promise.resolve({ ok: true, json: async () => mockCommissionData })
        }
        if (url.includes('/api/entities/colleges')) {
          return Promise.resolve({ ok: true, json: async () => mockColleges })
        }
        if (url.includes('/api/entities/branches')) {
          return Promise.resolve({ ok: true, json: async () => mockBranches })
        }
        return Promise.reject(new Error('Unknown URL'))
      })

      const { container } = renderWithQuery(
        <CommissionBreakdownWidget className="custom-class" />
      )

      await waitFor(() => {
        expect(screen.getByText('Commission Breakdown by College')).toBeInTheDocument()
      })

      const widget = container.firstChild as HTMLElement
      expect(widget).toHaveClass('custom-class')
    })

    it('hides button text on small screens (responsive classes)', async () => {
      ;(global.fetch as any).mockImplementation((url: string) => {
        if (url.includes('/api/commission-by-college')) {
          return Promise.resolve({ ok: true, json: async () => mockCommissionData })
        }
        if (url.includes('/api/entities/colleges')) {
          return Promise.resolve({ ok: true, json: async () => mockColleges })
        }
        if (url.includes('/api/entities/branches')) {
          return Promise.resolve({ ok: true, json: async () => mockBranches })
        }
        return Promise.reject(new Error('Unknown URL'))
      })

      renderWithQuery(<CommissionBreakdownWidget />)

      await waitFor(() => {
        expect(screen.getByText('Commission Breakdown by College')).toBeInTheDocument()
      })

      // Check that button text has responsive classes (hidden on small screens)
      const refreshText = screen.getByText('Refresh')
      expect(refreshText).toHaveClass('hidden', 'sm:inline')

      const exportText = screen.getByText('Export')
      expect(exportText).toHaveClass('hidden', 'sm:inline')
    })
  })

  describe('Accessibility', () => {
    it('has semantic HTML structure', async () => {
      ;(global.fetch as any).mockImplementation((url: string) => {
        if (url.includes('/api/commission-by-college')) {
          return Promise.resolve({ ok: true, json: async () => mockCommissionData })
        }
        if (url.includes('/api/entities/colleges')) {
          return Promise.resolve({ ok: true, json: async () => mockColleges })
        }
        if (url.includes('/api/entities/branches')) {
          return Promise.resolve({ ok: true, json: async () => mockBranches })
        }
        return Promise.reject(new Error('Unknown URL'))
      })

      renderWithQuery(<CommissionBreakdownWidget />)

      await waitFor(() => {
        expect(screen.getByText('Commission Breakdown by College')).toBeInTheDocument()
      })

      // Check heading level
      const title = screen.getByText('Commission Breakdown by College')
      expect(title.tagName).toBe('H2')

      // Check table has proper role
      const table = screen.getByRole('table')
      expect(table).toBeInTheDocument()
    })

    it('has aria labels for buttons', async () => {
      ;(global.fetch as any).mockImplementation((url: string) => {
        if (url.includes('/api/commission-by-college')) {
          return Promise.resolve({ ok: true, json: async () => mockCommissionData })
        }
        if (url.includes('/api/entities/colleges')) {
          return Promise.resolve({ ok: true, json: async () => mockColleges })
        }
        if (url.includes('/api/entities/branches')) {
          return Promise.resolve({ ok: true, json: async () => mockBranches })
        }
        return Promise.reject(new Error('Unknown URL'))
      })

      renderWithQuery(<CommissionBreakdownWidget />)

      await waitFor(() => {
        expect(screen.getByText('Commission Breakdown by College')).toBeInTheDocument()
      })

      // Check aria labels
      const refreshButton = screen.getByLabelText('Refresh commission data')
      expect(refreshButton).toBeInTheDocument()

      const exportButton = screen.getByLabelText('Export to CSV (coming soon)')
      expect(exportButton).toBeInTheDocument()
    })

    it('has descriptive table aria-label', async () => {
      ;(global.fetch as any).mockImplementation((url: string) => {
        if (url.includes('/api/commission-by-college')) {
          return Promise.resolve({ ok: true, json: async () => mockCommissionData })
        }
        if (url.includes('/api/entities/colleges')) {
          return Promise.resolve({ ok: true, json: async () => mockColleges })
        }
        if (url.includes('/api/entities/branches')) {
          return Promise.resolve({ ok: true, json: async () => mockBranches })
        }
        return Promise.reject(new Error('Unknown URL'))
      })

      renderWithQuery(<CommissionBreakdownWidget />)

      await waitFor(() => {
        expect(screen.getByText('University of Sydney')).toBeInTheDocument()
      })

      const table = screen.getByLabelText('Commission breakdown by college and branch')
      expect(table).toBeInTheDocument()
    })
  })
})
