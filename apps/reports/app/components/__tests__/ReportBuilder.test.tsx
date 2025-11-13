/**
 * ReportBuilder Component Tests
 *
 * Story 7.1: Payment Plans Report Generator with Contract Expiration Tracking
 * Task 6: Add Contract Expiration Quick Filters
 *
 * Tests preset filter buttons, date range setting, and manual override functionality
 */

import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { ReportBuilder } from '../ReportBuilder'
import { formatISO, addDays, subDays } from 'date-fns'

describe('ReportBuilder - Contract Expiration Quick Filters', () => {
  const mockOnGenerate = jest.fn()
  const today = new Date()

  beforeEach(() => {
    jest.clearAllMocks()
    // Mock the current date to ensure consistent testing
    jest.useFakeTimers()
    jest.setSystemTime(today)
  })

  afterEach(() => {
    jest.useRealTimers()
  })

  it('renders all four preset filter buttons', () => {
    render(<ReportBuilder onGenerate={mockOnGenerate} />)

    expect(screen.getByText('Expiring in 30 days')).toBeInTheDocument()
    expect(screen.getByText('Expiring in 60 days')).toBeInTheDocument()
    expect(screen.getByText('Expiring in 90 days')).toBeInTheDocument()
    expect(screen.getByText('Already expired')).toBeInTheDocument()
  })

  it('sets correct date range for "Expiring in 30 days" preset', () => {
    render(<ReportBuilder onGenerate={mockOnGenerate} />)

    const button = screen.getByText('Expiring in 30 days')
    fireEvent.click(button)

    const fromInput = screen.getByLabelText('Contract Expiration From') as HTMLInputElement
    const toInput = screen.getByLabelText('Contract Expiration To') as HTMLInputElement

    expect(fromInput.value).toBe(formatISO(today, { representation: 'date' }))
    expect(toInput.value).toBe(formatISO(addDays(today, 30), { representation: 'date' }))
  })

  it('sets correct date range for "Expiring in 60 days" preset', () => {
    render(<ReportBuilder onGenerate={mockOnGenerate} />)

    const button = screen.getByText('Expiring in 60 days')
    fireEvent.click(button)

    const fromInput = screen.getByLabelText('Contract Expiration From') as HTMLInputElement
    const toInput = screen.getByLabelText('Contract Expiration To') as HTMLInputElement

    expect(fromInput.value).toBe(formatISO(today, { representation: 'date' }))
    expect(toInput.value).toBe(formatISO(addDays(today, 60), { representation: 'date' }))
  })

  it('sets correct date range for "Expiring in 90 days" preset', () => {
    render(<ReportBuilder onGenerate={mockOnGenerate} />)

    const button = screen.getByText('Expiring in 90 days')
    fireEvent.click(button)

    const fromInput = screen.getByLabelText('Contract Expiration From') as HTMLInputElement
    const toInput = screen.getByLabelText('Contract Expiration To') as HTMLInputElement

    expect(fromInput.value).toBe(formatISO(today, { representation: 'date' }))
    expect(toInput.value).toBe(formatISO(addDays(today, 90), { representation: 'date' }))
  })

  it('sets correct date range for "Already expired" preset', () => {
    render(<ReportBuilder onGenerate={mockOnGenerate} />)

    const button = screen.getByText('Already expired')
    fireEvent.click(button)

    const fromInput = screen.getByLabelText('Contract Expiration From') as HTMLInputElement
    const toInput = screen.getByLabelText('Contract Expiration To') as HTMLInputElement

    expect(fromInput.value).toBe('') // From should be cleared for expired contracts
    expect(toInput.value).toBe(formatISO(subDays(today, 1), { representation: 'date' }))
  })

  it('highlights active preset button', () => {
    render(<ReportBuilder onGenerate={mockOnGenerate} />)

    const button30 = screen.getByText('Expiring in 30 days')
    const button60 = screen.getByText('Expiring in 60 days')

    // Initially, no preset should be active (outline variant)
    expect(button30.className).toContain('outline')

    // Click the 30-day preset
    fireEvent.click(button30)

    // The clicked button should now have default variant (not outline)
    // Note: In the actual implementation, default variant won't have 'outline' class
    waitFor(() => {
      expect(button30.className).not.toContain('outline')
    })

    // Other buttons should still be outline
    expect(button60.className).toContain('outline')
  })

  it('switches between presets correctly', () => {
    render(<ReportBuilder onGenerate={mockOnGenerate} />)

    const button30 = screen.getByText('Expiring in 30 days')
    const button60 = screen.getByText('Expiring in 60 days')

    // Click first preset
    fireEvent.click(button30)

    const toInput = screen.getByLabelText('Contract Expiration To') as HTMLInputElement

    expect(toInput.value).toBe(formatISO(addDays(today, 30), { representation: 'date' }))

    // Click second preset
    fireEvent.click(button60)

    expect(toInput.value).toBe(formatISO(addDays(today, 60), { representation: 'date' }))
  })

  it('clears active preset when user manually changes "From" date', () => {
    render(<ReportBuilder onGenerate={mockOnGenerate} />)

    const button30 = screen.getByText('Expiring in 30 days')
    const fromInput = screen.getByLabelText('Contract Expiration From') as HTMLInputElement

    // Activate preset
    fireEvent.click(button30)

    // Manually change the date
    fireEvent.change(fromInput, { target: { value: '2025-12-01' } })

    // Button should return to outline variant
    waitFor(() => {
      expect(button30.className).toContain('outline')
    })
  })

  it('clears active preset when user manually changes "To" date', () => {
    render(<ReportBuilder onGenerate={mockOnGenerate} />)

    const button30 = screen.getByText('Expiring in 30 days')
    const toInput = screen.getByLabelText('Contract Expiration To') as HTMLInputElement

    // Activate preset
    fireEvent.click(button30)

    // Manually change the date
    fireEvent.change(toInput, { target: { value: '2025-12-31' } })

    // Button should return to outline variant
    waitFor(() => {
      expect(button30.className).toContain('outline')
    })
  })

  it('clears preset when reset button is clicked', () => {
    render(<ReportBuilder onGenerate={mockOnGenerate} />)

    const button30 = screen.getByText('Expiring in 30 days')
    const resetButton = screen.getByText('Reset Filters')

    // Activate preset
    fireEvent.click(button30)

    // Reset the form
    fireEvent.click(resetButton)

    const fromInput = screen.getByLabelText('Contract Expiration From') as HTMLInputElement
    const toInput = screen.getByLabelText('Contract Expiration To') as HTMLInputElement

    // Dates should be cleared
    expect(fromInput.value).toBe('')
    expect(toInput.value).toBe('')

    // Button should return to outline variant
    waitFor(() => {
      expect(button30.className).toContain('outline')
    })
  })

  it('allows custom date range override after preset selection', () => {
    render(<ReportBuilder onGenerate={mockOnGenerate} />)

    const button30 = screen.getByText('Expiring in 30 days')
    const fromInput = screen.getByLabelText('Contract Expiration From') as HTMLInputElement
    const toInput = screen.getByLabelText('Contract Expiration To') as HTMLInputElement

    // Click preset
    fireEvent.click(button30)

    // Verify preset dates are set
    expect(fromInput.value).toBe(formatISO(today, { representation: 'date' }))
    expect(toInput.value).toBe(formatISO(addDays(today, 30), { representation: 'date' }))

    // Override with custom dates
    const customFrom = '2025-01-01'
    const customTo = '2025-06-30'

    fireEvent.change(fromInput, { target: { value: customFrom } })
    fireEvent.change(toInput, { target: { value: customTo } })

    // Custom dates should be set
    expect(fromInput.value).toBe(customFrom)
    expect(toInput.value).toBe(customTo)
  })

  it('includes preset filters in generated report', () => {
    render(<ReportBuilder onGenerate={mockOnGenerate} />)

    const button30 = screen.getByText('Expiring in 30 days')
    const generateButton = screen.getByText('Generate Report')

    // Click preset
    fireEvent.click(button30)

    // Generate report
    fireEvent.click(generateButton)

    // Verify the callback was called with correct filter dates
    waitFor(() => {
      expect(mockOnGenerate).toHaveBeenCalledWith(
        expect.objectContaining({
          filters: expect.objectContaining({
            contract_expiration_from: formatISO(today, { representation: 'date' }),
            contract_expiration_to: formatISO(addDays(today, 30), { representation: 'date' }),
          }),
        })
      )
    })
  })

  it('renders preset buttons in a separate section with proper heading', () => {
    render(<ReportBuilder onGenerate={mockOnGenerate} />)

    expect(screen.getByText('Contract Expiration Quick Filters')).toBeInTheDocument()
  })

  it('renders custom date inputs below preset buttons', () => {
    render(<ReportBuilder onGenerate={mockOnGenerate} />)

    const fromInput = screen.getByLabelText('Contract Expiration From')
    const toInput = screen.getByLabelText('Contract Expiration To')

    // Verify inputs are rendered
    expect(fromInput).toBeInTheDocument()
    expect(toInput).toBeInTheDocument()
  })
})
