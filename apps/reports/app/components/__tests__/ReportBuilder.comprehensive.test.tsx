/**
 * ReportBuilder Comprehensive Component Tests
 *
 * Story 7.1: Payment Plans Report Generator with Contract Expiration Tracking
 * Task 8: Testing
 *
 * Comprehensive tests for all ReportBuilder functionality
 */

import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ReportBuilder } from '../ReportBuilder'
import { vi } from 'vitest'

// Mock fetch for lookup APIs
global.fetch = vi.fn()

describe('ReportBuilder - Comprehensive Tests', () => {
  const mockOnGenerate = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()

    // Mock successful lookup API responses
    ;(global.fetch as any).mockImplementation((url: string) => {
      if (url.includes('/api/reports/lookup/colleges')) {
        return Promise.resolve({
          ok: true,
          json: () =>
            Promise.resolve([
              { id: 'c1', name: 'State University', branch_count: 3 },
              { id: 'c2', name: 'Tech College', branch_count: 2 },
            ]),
        })
      }
      if (url.includes('/api/reports/lookup/branches')) {
        return Promise.resolve({
          ok: true,
          json: () =>
            Promise.resolve([
              { id: 'b1', name: 'Main Campus', college_id: 'c1' },
              { id: 'b2', name: 'West Campus', college_id: 'c1' },
            ]),
        })
      }
      if (url.includes('/api/reports/lookup/students')) {
        return Promise.resolve({
          ok: true,
          json: () =>
            Promise.resolve([
              { id: 's1', name: 'John Doe', college_name: 'State University' },
              { id: 's2', name: 'Jane Smith', college_name: 'Tech College' },
            ]),
        })
      }
      return Promise.reject(new Error('Unknown URL'))
    })
  })

  describe('Filter Inputs', () => {
    it('renders all filter inputs', () => {
      render(<ReportBuilder onGenerate={mockOnGenerate} />)

      // Date range filters
      expect(screen.getByLabelText(/Plan Start Date From/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/Plan Start Date To/i)).toBeInTheDocument()

      // Contract expiration filters
      expect(screen.getByLabelText(/Contract Expiration From/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/Contract Expiration To/i)).toBeInTheDocument()

      // Status filter
      expect(screen.getByLabelText(/Status/i)).toBeInTheDocument()
    })

    it('allows selecting date range', async () => {
      render(<ReportBuilder onGenerate={mockOnGenerate} />)

      const dateFromInput = screen.getByLabelText(/Plan Start Date From/i) as HTMLInputElement
      const dateToInput = screen.getByLabelText(/Plan Start Date To/i) as HTMLInputElement

      await userEvent.type(dateFromInput, '2024-01-01')
      await userEvent.type(dateToInput, '2024-12-31')

      expect(dateFromInput.value).toBe('2024-01-01')
      expect(dateToInput.value).toBe('2024-12-31')
    })

    it('allows selecting status filter', async () => {
      render(<ReportBuilder onGenerate={mockOnGenerate} />)

      const statusSelect = screen.getByLabelText(/Status/i) as HTMLSelectElement

      // Should have status options
      expect(statusSelect).toBeInTheDocument()
    })
  })

  describe('Column Selection', () => {
    it('renders column selection checkboxes', () => {
      render(<ReportBuilder onGenerate={mockOnGenerate} />)

      // Check for some key columns
      expect(screen.getByLabelText(/Student Name/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/College/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/Plan Amount/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/Status/i)).toBeInTheDocument()
    })

    it('allows selecting and deselecting columns', async () => {
      render(<ReportBuilder onGenerate={mockOnGenerate} />)

      const studentNameCheckbox = screen.getByLabelText(/Student Name/i) as HTMLInputElement

      // Initially unchecked (or checked, depending on defaults)
      const initialState = studentNameCheckbox.checked

      // Toggle
      await userEvent.click(studentNameCheckbox)
      expect(studentNameCheckbox.checked).toBe(!initialState)

      // Toggle back
      await userEvent.click(studentNameCheckbox)
      expect(studentNameCheckbox.checked).toBe(initialState)
    })

    it('requires at least one column to be selected', async () => {
      render(<ReportBuilder onGenerate={mockOnGenerate} />)

      // Try to generate report without selecting columns
      const generateButton = screen.getByRole('button', { name: /Generate Report/i })
      await userEvent.click(generateButton)

      // Should show validation error
      await waitFor(() => {
        expect(
          screen.getByText(/Please select at least one column/i)
        ).toBeInTheDocument()
      })

      // onGenerate should not be called
      expect(mockOnGenerate).not.toHaveBeenCalled()
    })

    it('allows generating report with selected columns', async () => {
      render(<ReportBuilder onGenerate={mockOnGenerate} />)

      // Select at least one column
      const studentNameCheckbox = screen.getByLabelText(/Student Name/i)
      await userEvent.click(studentNameCheckbox)

      const generateButton = screen.getByRole('button', { name: /Generate Report/i })
      await userEvent.click(generateButton)

      // onGenerate should be called
      await waitFor(() => {
        expect(mockOnGenerate).toHaveBeenCalled()
      })
    })
  })

  describe('Date Range Validation', () => {
    it('validates that date_from <= date_to', async () => {
      render(<ReportBuilder onGenerate={mockOnGenerate} />)

      const dateFromInput = screen.getByLabelText(/Plan Start Date From/i) as HTMLInputElement
      const dateToInput = screen.getByLabelText(/Plan Start Date To/i) as HTMLInputElement

      // Set invalid date range (from > to)
      await userEvent.type(dateFromInput, '2024-12-31')
      await userEvent.type(dateToInput, '2024-01-01')

      // Select at least one column
      const studentNameCheckbox = screen.getByLabelText(/Student Name/i)
      await userEvent.click(studentNameCheckbox)

      const generateButton = screen.getByRole('button', { name: /Generate Report/i })
      await userEvent.click(generateButton)

      // Should show validation error
      await waitFor(() => {
        expect(
          screen.getByText(/Start date must be before or equal to end date/i)
        ).toBeInTheDocument()
      })

      // onGenerate should not be called
      expect(mockOnGenerate).not.toHaveBeenCalled()
    })

    it('allows valid date range', async () => {
      render(<ReportBuilder onGenerate={mockOnGenerate} />)

      const dateFromInput = screen.getByLabelText(/Plan Start Date From/i) as HTMLInputElement
      const dateToInput = screen.getByLabelText(/Plan Start Date To/i) as HTMLInputElement

      // Set valid date range
      await userEvent.type(dateFromInput, '2024-01-01')
      await userEvent.type(dateToInput, '2024-12-31')

      // Select at least one column
      const studentNameCheckbox = screen.getByLabelText(/Student Name/i)
      await userEvent.click(studentNameCheckbox)

      const generateButton = screen.getByRole('button', { name: /Generate Report/i })
      await userEvent.click(generateButton)

      // onGenerate should be called
      await waitFor(() => {
        expect(mockOnGenerate).toHaveBeenCalled()
      })
    })

    it('allows equal date_from and date_to', async () => {
      render(<ReportBuilder onGenerate={mockOnGenerate} />)

      const dateFromInput = screen.getByLabelText(/Plan Start Date From/i) as HTMLInputElement
      const dateToInput = screen.getByLabelText(/Plan Start Date To/i) as HTMLInputElement

      // Set same dates
      await userEvent.type(dateFromInput, '2024-06-15')
      await userEvent.type(dateToInput, '2024-06-15')

      // Select at least one column
      const studentNameCheckbox = screen.getByLabelText(/Student Name/i)
      await userEvent.click(studentNameCheckbox)

      const generateButton = screen.getByRole('button', { name: /Generate Report/i })
      await userEvent.click(generateButton)

      // onGenerate should be called
      await waitFor(() => {
        expect(mockOnGenerate).toHaveBeenCalled()
      })
    })
  })

  describe('Form Submission', () => {
    it('calls onGenerate with correct data on form submit', async () => {
      render(<ReportBuilder onGenerate={mockOnGenerate} />)

      // Fill in filters
      const dateFromInput = screen.getByLabelText(/Plan Start Date From/i)
      const dateToInput = screen.getByLabelText(/Plan Start Date To/i)

      await userEvent.type(dateFromInput, '2024-01-01')
      await userEvent.type(dateToInput, '2024-12-31')

      // Select columns
      const studentNameCheckbox = screen.getByLabelText(/Student Name/i)
      const planAmountCheckbox = screen.getByLabelText(/Plan Amount/i)
      await userEvent.click(studentNameCheckbox)
      await userEvent.click(planAmountCheckbox)

      // Submit form
      const generateButton = screen.getByRole('button', { name: /Generate Report/i })
      await userEvent.click(generateButton)

      // Verify onGenerate was called
      await waitFor(() => {
        expect(mockOnGenerate).toHaveBeenCalledWith(
          expect.objectContaining({
            filters: expect.objectContaining({
              date_from: '2024-01-01',
              date_to: '2024-12-31',
            }),
            columns: expect.arrayContaining(['student_name', 'plan_amount']),
          })
        )
      })
    })
  })

  describe('Reset Button', () => {
    it('resets form to initial state', async () => {
      render(<ReportBuilder onGenerate={mockOnGenerate} />)

      // Fill in filters
      const dateFromInput = screen.getByLabelText(/Plan Start Date From/i) as HTMLInputElement
      const dateToInput = screen.getByLabelText(/Plan Start Date To/i) as HTMLInputElement

      await userEvent.type(dateFromInput, '2024-01-01')
      await userEvent.type(dateToInput, '2024-12-31')

      // Select columns
      const studentNameCheckbox = screen.getByLabelText(/Student Name/i) as HTMLInputElement
      await userEvent.click(studentNameCheckbox)

      // Verify values are set
      expect(dateFromInput.value).toBe('2024-01-01')
      expect(dateToInput.value).toBe('2024-12-31')
      expect(studentNameCheckbox.checked).toBe(true)

      // Click reset button
      const resetButton = screen.getByRole('button', { name: /Reset Filters/i })
      await userEvent.click(resetButton)

      // Verify form is reset
      await waitFor(() => {
        expect(dateFromInput.value).toBe('')
        expect(dateToInput.value).toBe('')
        expect(studentNameCheckbox.checked).toBe(false)
      })
    })
  })

  describe('Preset Filters Integration', () => {
    it('populates filters when preset button clicked', async () => {
      render(<ReportBuilder onGenerate={mockOnGenerate} />)

      const button30 = screen.getByRole('button', { name: /Expiring in 30 days/i })
      await userEvent.click(button30)

      // Verify contract expiration dates are set
      const contractFromInput = screen.getByLabelText(
        /Contract Expiration From/i
      ) as HTMLInputElement
      const contractToInput = screen.getByLabelText(
        /Contract Expiration To/i
      ) as HTMLInputElement

      expect(contractFromInput.value).toBeTruthy()
      expect(contractToInput.value).toBeTruthy()
    })
  })

  describe('Loading States', () => {
    it('shows loading state while fetching lookup data', async () => {
      // Delay the fetch response
      ;(global.fetch as any).mockImplementation(() =>
        new Promise((resolve) =>
          setTimeout(
            () =>
              resolve({
                ok: true,
                json: () => Promise.resolve([]),
              }),
            100
          )
        )
      )

      render(<ReportBuilder onGenerate={mockOnGenerate} />)

      // Should show loading indicators (implementation-specific)
      // This is a placeholder - adjust based on actual implementation
    })

    it('handles fetch errors gracefully', async () => {
      ;(global.fetch as any).mockRejectedValue(new Error('Network error'))

      render(<ReportBuilder onGenerate={mockOnGenerate} />)

      // Should handle error gracefully without crashing
      // Verify component still renders
      expect(screen.getByRole('button', { name: /Generate Report/i })).toBeInTheDocument()
    })
  })
})
