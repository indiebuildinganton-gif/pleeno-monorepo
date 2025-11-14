/**
 * ExportButtons Component Tests
 *
 * Epic 7.2: CSV Export Functionality
 * Task 4: Add Export Button to Report UI
 *
 * Tests:
 * - Button rendering and labels
 * - CSV export URL generation with filters
 * - Loading states during export
 * - Toast notifications for success/error
 * - Accessibility features
 */

import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { ExportButtons } from '../ExportButtons'
import type { PaymentPlansReportFilters } from '../../types/payment-plans-report'

// Mock the useToast hook
const mockAddToast = jest.fn()
jest.mock('@pleeno/ui', () => ({
  ...jest.requireActual('@pleeno/ui'),
  useToast: () => ({
    addToast: mockAddToast,
  }),
}))

describe('ExportButtons', () => {
  const mockFilters: PaymentPlansReportFilters = {
    date_from: '2025-01-01',
    date_to: '2025-12-31',
    college_ids: ['college-1', 'college-2'],
    branch_ids: ['branch-1'],
    student_ids: ['student-1'],
    status: ['active', 'completed'],
    contract_expiration_from: '2025-06-01',
    contract_expiration_to: '2025-12-31',
  }

  const mockColumns = ['student_name', 'college_name', 'plan_amount', 'status']

  const mockReportData = [
    { id: '1', student_name: 'John Doe', college_name: 'MIT', plan_amount: 5000, status: 'active' },
    { id: '2', student_name: 'Jane Smith', college_name: 'Harvard', plan_amount: 6000, status: 'completed' },
  ]

  beforeEach(() => {
    jest.clearAllMocks()
    // Mock window.location.href
    delete (window as any).location
    window.location = { href: '', origin: 'http://localhost:3000' } as any
  })

  afterEach(() => {
    jest.restoreAllMocks()
  })

  describe('Rendering', () => {
    it('renders CSV export button with correct label', () => {
      render(<ExportButtons filters={mockFilters} columns={mockColumns} />)

      const csvButton = screen.getByRole('button', { name: /export report to csv format/i })
      expect(csvButton).toBeInTheDocument()
      expect(csvButton).toHaveTextContent('Export CSV')
    })

    it('renders PDF export button with correct label', () => {
      render(<ExportButtons filters={mockFilters} columns={mockColumns} />)

      const pdfButton = screen.getByRole('button', { name: /export report to pdf format/i })
      expect(pdfButton).toBeInTheDocument()
      expect(pdfButton).toHaveTextContent('Export PDF')
    })

    it('renders download icons for both buttons', () => {
      render(<ExportButtons filters={mockFilters} columns={mockColumns} />)

      // Icons should be present (lucide-react icons have aria-hidden="true")
      const buttons = screen.getAllByRole('button')
      expect(buttons).toHaveLength(2)
    })
  })

  describe('CSV Export', () => {
    it('builds correct URL with all filters', () => {
      render(<ExportButtons filters={mockFilters} columns={mockColumns} reportData={mockReportData} />)

      const csvButton = screen.getByRole('button', { name: /export report to csv format/i })
      fireEvent.click(csvButton)

      // Check that window.location.href was set with correct URL
      const url = new URL(window.location.href)

      expect(url.pathname).toBe('/api/reports/payment-plans/export')
      expect(url.searchParams.get('format')).toBe('csv')
      expect(url.searchParams.get('date_from')).toBe('2025-01-01')
      expect(url.searchParams.get('date_to')).toBe('2025-12-31')
      expect(url.searchParams.getAll('college_id')).toEqual(['college-1', 'college-2'])
      expect(url.searchParams.getAll('branch_id')).toEqual(['branch-1'])
      expect(url.searchParams.getAll('student_id')).toEqual(['student-1'])
      expect(url.searchParams.getAll('status[]')).toEqual(['active', 'completed'])
      expect(url.searchParams.get('contract_expiration_from')).toBe('2025-06-01')
      expect(url.searchParams.get('contract_expiration_to')).toBe('2025-12-31')
      expect(url.searchParams.getAll('columns[]')).toEqual(mockColumns)
    })

    it('handles empty filters gracefully', () => {
      const emptyFilters: PaymentPlansReportFilters = {}

      render(<ExportButtons filters={emptyFilters} columns={mockColumns} />)

      const csvButton = screen.getByRole('button', { name: /export report to csv format/i })
      fireEvent.click(csvButton)

      const url = new URL(window.location.href)

      expect(url.pathname).toBe('/api/reports/payment-plans/export')
      expect(url.searchParams.get('format')).toBe('csv')
      expect(url.searchParams.get('date_from')).toBeNull()
      expect(url.searchParams.get('college_id')).toBeNull()
    })

    it('shows loading state during export', async () => {
      render(<ExportButtons filters={mockFilters} columns={mockColumns} reportData={mockReportData} />)

      const csvButton = screen.getByRole('button', { name: /export report to csv format/i })
      fireEvent.click(csvButton)

      // Should show loading state immediately
      await waitFor(() => {
        expect(screen.getByText('Exporting...')).toBeInTheDocument()
      })

      // Button should be disabled during export
      expect(csvButton).toBeDisabled()
    })

    it('shows success toast after export starts', async () => {
      render(<ExportButtons filters={mockFilters} columns={mockColumns} reportData={mockReportData} />)

      const csvButton = screen.getByRole('button', { name: /export report to csv format/i })
      fireEvent.click(csvButton)

      await waitFor(() => {
        expect(mockAddToast).toHaveBeenCalledWith({
          title: 'Export Started',
          description: 'Exporting 2 rows to CSV. Download will begin shortly.',
          variant: 'success',
        })
      })
    })

    it('resets loading state after 2 seconds', async () => {
      jest.useFakeTimers()

      render(<ExportButtons filters={mockFilters} columns={mockColumns} reportData={mockReportData} />)

      const csvButton = screen.getByRole('button', { name: /export report to csv format/i })
      fireEvent.click(csvButton)

      // Should be in loading state
      await waitFor(() => {
        expect(screen.getByText('Exporting...')).toBeInTheDocument()
      })

      // Fast-forward 2 seconds
      jest.advanceTimersByTime(2000)

      // Loading state should be cleared
      await waitFor(() => {
        expect(screen.queryByText('Exporting...')).not.toBeInTheDocument()
        expect(screen.getByText('Export CSV')).toBeInTheDocument()
      })

      jest.useRealTimers()
    })
  })

  describe('PDF Export', () => {
    it('shows "coming soon" toast when clicking PDF button', async () => {
      render(<ExportButtons filters={mockFilters} columns={mockColumns} />)

      const pdfButton = screen.getByRole('button', { name: /export report to pdf format/i })
      fireEvent.click(pdfButton)

      await waitFor(() => {
        expect(mockAddToast).toHaveBeenCalledWith({
          title: 'Coming Soon',
          description: 'PDF export functionality will be available soon.',
          variant: 'warning',
        })
      })
    })

    it('does not disable PDF button or show loading state', () => {
      render(<ExportButtons filters={mockFilters} columns={mockColumns} />)

      const pdfButton = screen.getByRole('button', { name: /export report to pdf format/i })
      fireEvent.click(pdfButton)

      // Button should remain enabled
      expect(pdfButton).not.toBeDisabled()
      expect(screen.queryByText('Exporting...')).not.toBeInTheDocument()
    })
  })

  describe('Accessibility', () => {
    it('has proper ARIA labels for buttons', () => {
      render(<ExportButtons filters={mockFilters} columns={mockColumns} />)

      expect(screen.getByRole('button', { name: /export report to csv format/i })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /export report to pdf format/i })).toBeInTheDocument()
    })

    it('marks icons as hidden from screen readers', () => {
      const { container } = render(<ExportButtons filters={mockFilters} columns={mockColumns} />)

      // Icons should have aria-hidden="true"
      const icons = container.querySelectorAll('[aria-hidden="true"]')
      expect(icons.length).toBeGreaterThan(0)
    })

    it('disables CSV button during export for keyboard users', async () => {
      render(<ExportButtons filters={mockFilters} columns={mockColumns} />)

      const csvButton = screen.getByRole('button', { name: /export report to csv format/i })
      fireEvent.click(csvButton)

      await waitFor(() => {
        expect(csvButton).toHaveAttribute('disabled')
      })
    })
  })

  describe('Edge Cases', () => {
    it('handles export with no report data', () => {
      render(<ExportButtons filters={mockFilters} columns={mockColumns} />)

      const csvButton = screen.getByRole('button', { name: /export report to csv format/i })
      fireEvent.click(csvButton)

      // Should not crash and should still show toast with 0 rows
      expect(mockAddToast).toHaveBeenCalledWith(
        expect.objectContaining({
          description: expect.stringContaining('0 rows'),
        })
      )
    })

    it('handles export with empty columns array', () => {
      render(<ExportButtons filters={mockFilters} columns={[]} reportData={mockReportData} />)

      const csvButton = screen.getByRole('button', { name: /export report to csv format/i })
      fireEvent.click(csvButton)

      const url = new URL(window.location.href)

      // Should still build URL without crashing
      expect(url.pathname).toBe('/api/reports/payment-plans/export')
      expect(url.searchParams.getAll('columns[]')).toEqual([])
    })
  })
})
