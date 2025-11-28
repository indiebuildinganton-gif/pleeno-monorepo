/**
 * PaymentPlanWizardStep2 Component Tests
 *
 * Epic 4: Payments Domain
 * Story 4.2: Flexible Installment Structure
 * Task 13: Testing - Component Tests
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { PaymentPlanWizardStep2 } from '../PaymentPlanWizardStep2'
import { Step1FormData } from '../PaymentPlanWizardStep1'

// Mock PaymentPlanSummary component
vi.mock('../PaymentPlanSummary', () => ({
  PaymentPlanSummary: ({ commissionableValue, expectedCommission }: any) => (
    <div data-testid="payment-summary">
      <div>Commissionable Value: {commissionableValue}</div>
      <div>Expected Commission: {expectedCommission}</div>
    </div>
  ),
}))

describe('PaymentPlanWizardStep2', () => {
  const mockStep1Data: Step1FormData = {
    student_id: 'student-1',
    branch_id: 'branch-1',
    course_name: 'Bachelor of Business',
    total_course_value: 10000,
    commission_rate: 0.15,
    course_start_date: '2025-02-01',
    course_end_date: '2025-12-31',
  }

  const mockOnNext = vi.fn()
  const mockOnBack = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Form Rendering', () => {
    it('renders all required form fields', () => {
      render(
        <PaymentPlanWizardStep2
          step1Data={mockStep1Data}
          onNext={mockOnNext}
          onBack={mockOnBack}
        />
      )

      expect(screen.getByLabelText(/Initial Payment Amount/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/Initial Payment Due Date/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/already been paid/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/Number of Installments/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/Payment Frequency/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/Materials Cost/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/Admin Fees/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/Other Fees/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/First Installment College Due Date/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/Student Lead Time/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/GST Inclusive/i)).toBeInTheDocument()
    })

    it('renders step title and description', () => {
      render(
        <PaymentPlanWizardStep2
          step1Data={mockStep1Data}
          onNext={mockOnNext}
          onBack={mockOnBack}
        />
      )

      expect(screen.getByText('Step 2: Payment Structure')).toBeInTheDocument()
      expect(screen.getByText(/Configure payment schedule, fees, and due dates/i)).toBeInTheDocument()
    })

    it('renders section headers', () => {
      render(
        <PaymentPlanWizardStep2
          step1Data={mockStep1Data}
          onNext={mockOnNext}
          onBack={mockOnBack}
        />
      )

      expect(screen.getByText('Initial Payment')).toBeInTheDocument()
      expect(screen.getByText('Installments')).toBeInTheDocument()
      expect(screen.getByText('Non-Commissionable Fees')).toBeInTheDocument()
      expect(screen.getByText('Payment Timeline')).toBeInTheDocument()
      expect(screen.getByText('GST')).toBeInTheDocument()
    })

    it('renders navigation buttons', () => {
      render(
        <PaymentPlanWizardStep2
          step1Data={mockStep1Data}
          onNext={mockOnNext}
          onBack={mockOnBack}
        />
      )

      expect(screen.getByRole('button', { name: /Back/i })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /Generate Installments/i })).toBeInTheDocument()
    })

    it('renders real-time payment summary', () => {
      render(
        <PaymentPlanWizardStep2
          step1Data={mockStep1Data}
          onNext={mockOnNext}
          onBack={mockOnBack}
        />
      )

      expect(screen.getByTestId('payment-summary')).toBeInTheDocument()
    })
  })

  describe('Form Validation', () => {
    it('disables initial payment due date when amount is 0', () => {
      render(
        <PaymentPlanWizardStep2
          step1Data={mockStep1Data}
          onNext={mockOnNext}
          onBack={mockOnBack}
        />
      )

      const dueDateInput = screen.getByLabelText(/Initial Payment Due Date/i)
      expect(dueDateInput).toBeDisabled()
    })

    it('enables initial payment due date when amount is greater than 0', async () => {
      const user = userEvent.setup()
      render(
        <PaymentPlanWizardStep2
          step1Data={mockStep1Data}
          onNext={mockOnNext}
          onBack={mockOnBack}
        />
      )

      const amountInput = screen.getByLabelText(/Initial Payment Amount/i)
      await user.clear(amountInput)
      await user.type(amountInput, '2000')

      await waitFor(() => {
        const dueDateInput = screen.getByLabelText(/Initial Payment Due Date/i)
        expect(dueDateInput).not.toBeDisabled()
      })
    })

    it('shows error when initial payment exceeds commissionable value', async () => {
      const user = userEvent.setup()
      render(
        <PaymentPlanWizardStep2
          step1Data={mockStep1Data}
          onNext={mockOnNext}
          onBack={mockOnBack}
        />
      )

      // First add some fees to reduce commissionable value
      const materialsInput = screen.getByLabelText(/Materials Cost/i)
      await user.clear(materialsInput)
      await user.type(materialsInput, '1000')

      // Try to set initial payment higher than commissionable value (9000)
      const amountInput = screen.getByLabelText(/Initial Payment Amount/i)
      await user.clear(amountInput)
      await user.type(amountInput, '10000')

      await waitFor(() => {
        expect(
          screen.getByText(/Initial payment cannot exceed commissionable value/i)
        ).toBeInTheDocument()
      })
    })

    it('shows error when total fees equal or exceed course value', async () => {
      const user = userEvent.setup()
      render(
        <PaymentPlanWizardStep2
          step1Data={mockStep1Data}
          onNext={mockOnNext}
          onBack={mockOnBack}
        />
      )

      // Set fees that equal course value
      const materialsInput = screen.getByLabelText(/Materials Cost/i)
      await user.clear(materialsInput)
      await user.type(materialsInput, '5000')

      const adminInput = screen.getByLabelText(/Admin Fees/i)
      await user.clear(adminInput)
      await user.type(adminInput, '3000')

      const otherInput = screen.getByLabelText(/Other Fees/i)
      await user.clear(otherInput)
      await user.type(otherInput, '2000')

      await waitFor(() => {
        expect(
          screen.getByText(/Total fees cannot equal or exceed the total course value/i)
        ).toBeInTheDocument()
      })
    })

    it('validates number of installments between 1 and 24', async () => {
      const user = userEvent.setup()
      render(
        <PaymentPlanWizardStep2
          step1Data={mockStep1Data}
          onNext={mockOnNext}
          onBack={mockOnBack}
        />
      )

      const installmentsInput = screen.getByLabelText(/Number of Installments/i)

      // Test 0 installments
      await user.clear(installmentsInput)
      await user.type(installmentsInput, '0')
      await waitFor(() => {
        expect(screen.getByText(/Must be at least 1/i)).toBeInTheDocument()
      })

      // Test 25 installments
      await user.clear(installmentsInput)
      await user.type(installmentsInput, '25')
      await waitFor(() => {
        expect(screen.getByText(/Cannot exceed 24 installments/i)).toBeInTheDocument()
      })
    })

    it('requires initial payment due date when amount is specified', async () => {
      const user = userEvent.setup()
      render(
        <PaymentPlanWizardStep2
          step1Data={mockStep1Data}
          onNext={mockOnNext}
          onBack={mockOnBack}
        />
      )

      // Set initial payment amount without date
      const amountInput = screen.getByLabelText(/Initial Payment Amount/i)
      await user.clear(amountInput)
      await user.type(amountInput, '2000')

      // Try to submit
      const generateButton = screen.getByRole('button', { name: /Generate Installments/i })
      expect(generateButton).toBeDisabled()
    })
  })

  describe('Conditional Field Enabling', () => {
    it('disables initial payment paid toggle when amount is 0', () => {
      render(
        <PaymentPlanWizardStep2
          step1Data={mockStep1Data}
          onNext={mockOnNext}
          onBack={mockOnBack}
        />
      )

      const paidToggle = screen.getByRole('switch', { name: /already been paid/i })
      expect(paidToggle).toBeDisabled()
    })

    it('enables initial payment paid toggle when amount is greater than 0', async () => {
      const user = userEvent.setup()
      render(
        <PaymentPlanWizardStep2
          step1Data={mockStep1Data}
          onNext={mockOnNext}
          onBack={mockOnBack}
        />
      )

      const amountInput = screen.getByLabelText(/Initial Payment Amount/i)
      await user.clear(amountInput)
      await user.type(amountInput, '2000')

      await waitFor(() => {
        const paidToggle = screen.getByRole('switch', { name: /already been paid/i })
        expect(paidToggle).not.toBeDisabled()
      })
    })
  })

  describe('Real-Time Summary Updates', () => {
    it('updates commissionable value when materials cost changes', async () => {
      const user = userEvent.setup()
      render(
        <PaymentPlanWizardStep2
          step1Data={mockStep1Data}
          onNext={mockOnNext}
          onBack={mockOnBack}
        />
      )

      // Initially: commissionable value = 10000
      expect(screen.getByText(/Commissionable Value: 10000/i)).toBeInTheDocument()

      // Add materials cost
      const materialsInput = screen.getByLabelText(/Materials Cost/i)
      await user.clear(materialsInput)
      await user.type(materialsInput, '500')

      // Should update to 9500
      await waitFor(() => {
        expect(screen.getByText(/Commissionable Value: 9500/i)).toBeInTheDocument()
      })
    })

    it('updates commission when GST toggle changes', async () => {
      const user = userEvent.setup()
      render(
        <PaymentPlanWizardStep2
          step1Data={mockStep1Data}
          onNext={mockOnNext}
          onBack={mockOnBack}
        />
      )

      // Initially: GST inclusive = true, commission = 10000 * 0.15 = 1500
      expect(screen.getByText(/Expected Commission: 1500/i)).toBeInTheDocument()

      // Toggle GST off
      const gstToggle = screen.getByRole('switch', { name: /GST Inclusive/i })
      await user.click(gstToggle)

      // Should update to (10000 / 1.1) * 0.15 = 1363.64
      await waitFor(() => {
        expect(screen.getByText(/Expected Commission: 1363\.6/i)).toBeInTheDocument()
      })
    })
  })

  describe('Student Due Date Preview', () => {
    it('displays student due date preview when college due date and lead time are set', async () => {
      const user = userEvent.setup()
      render(
        <PaymentPlanWizardStep2
          step1Data={mockStep1Data}
          onNext={mockOnNext}
          onBack={mockOnBack}
        />
      )

      // Set first college due date
      const collegeDueDateInput = screen.getByLabelText(/First Installment College Due Date/i)
      await user.type(collegeDueDateInput, '2025-03-15')

      // Set lead time (default is already 7)
      await waitFor(() => {
        expect(screen.getByText(/Preview: First Student Due Date/i)).toBeInTheDocument()
      })
    })

    it('updates preview when lead time changes', async () => {
      const user = userEvent.setup()
      render(
        <PaymentPlanWizardStep2
          step1Data={mockStep1Data}
          onNext={mockOnNext}
          onBack={mockOnBack}
        />
      )

      // Set first college due date
      const collegeDueDateInput = screen.getByLabelText(/First Installment College Due Date/i)
      await user.type(collegeDueDateInput, '2025-03-15')

      // Change lead time
      const leadTimeInput = screen.getByLabelText(/Student Lead Time/i)
      await user.clear(leadTimeInput)
      await user.type(leadTimeInput, '14')

      await waitFor(() => {
        // Preview should show 14 days before March 15 = March 1
        expect(screen.getByText(/14 days before/i)).toBeInTheDocument()
      })
    })
  })

  describe('Form Submission', () => {
    it('calls onNext with form data when valid', async () => {
      const user = userEvent.setup()
      render(
        <PaymentPlanWizardStep2
          step1Data={mockStep1Data}
          onNext={mockOnNext}
          onBack={mockOnBack}
        />
      )

      // Fill all required fields
      const installmentsInput = screen.getByLabelText(/Number of Installments/i)
      await user.clear(installmentsInput)
      await user.type(installmentsInput, '4')

      const collegeDueDateInput = screen.getByLabelText(/First Installment College Due Date/i)
      await user.type(collegeDueDateInput, '2025-03-15')

      // Wait for form to become valid
      await waitFor(() => {
        const generateButton = screen.getByRole('button', { name: /Generate Installments/i })
        expect(generateButton).not.toBeDisabled()
      })

      const generateButton = screen.getByRole('button', { name: /Generate Installments/i })
      await user.click(generateButton)

      await waitFor(() => {
        expect(mockOnNext).toHaveBeenCalledWith(
          expect.objectContaining({
            initial_payment_amount: 0,
            number_of_installments: 4,
            payment_frequency: 'monthly',
            materials_cost: 0,
            admin_fees: 0,
            other_fees: 0,
            first_college_due_date: '2025-03-15',
            student_lead_time_days: 7,
            gst_inclusive: true,
          })
        )
      })
    })

    it('calls onBack when Back button is clicked', async () => {
      const user = userEvent.setup()
      render(
        <PaymentPlanWizardStep2
          step1Data={mockStep1Data}
          onNext={mockOnNext}
          onBack={mockOnBack}
        />
      )

      const backButton = screen.getByRole('button', { name: /Back/i })
      await user.click(backButton)

      expect(mockOnBack).toHaveBeenCalledTimes(1)
    })

    it('disables submit button when fees exceed course value', async () => {
      const user = userEvent.setup()
      render(
        <PaymentPlanWizardStep2
          step1Data={mockStep1Data}
          onNext={mockOnNext}
          onBack={mockOnBack}
        />
      )

      // Set fees that exceed course value
      const materialsInput = screen.getByLabelText(/Materials Cost/i)
      await user.clear(materialsInput)
      await user.type(materialsInput, '10000')

      await waitFor(() => {
        const generateButton = screen.getByRole('button', { name: /Generate Installments/i })
        expect(generateButton).toBeDisabled()
      })
    })

    it('disables submit button when initial payment exceeds commissionable value', async () => {
      const user = userEvent.setup()
      render(
        <PaymentPlanWizardStep2
          step1Data={mockStep1Data}
          onNext={mockOnNext}
          onBack={mockOnBack}
        />
      )

      // Set initial payment that exceeds total
      const amountInput = screen.getByLabelText(/Initial Payment Amount/i)
      await user.clear(amountInput)
      await user.type(amountInput, '15000')

      await waitFor(() => {
        const generateButton = screen.getByRole('button', { name: /Generate Installments/i })
        expect(generateButton).toBeDisabled()
      })
    })
  })

  describe('Initial Data', () => {
    it('pre-fills form with initial data when provided', () => {
      const initialData = {
        initial_payment_amount: 2000,
        initial_payment_due_date: '2025-02-01',
        initial_payment_paid: true,
        number_of_installments: 11,
        payment_frequency: 'monthly' as const,
        materials_cost: 500,
        admin_fees: 200,
        other_fees: 100,
        first_college_due_date: '2025-03-15',
        student_lead_time_days: 7,
        gst_inclusive: true,
      }

      render(
        <PaymentPlanWizardStep2
          initialData={initialData}
          step1Data={mockStep1Data}
          onNext={mockOnNext}
          onBack={mockOnBack}
        />
      )

      expect((screen.getByLabelText(/Initial Payment Amount/i) as HTMLInputElement).value).toBe('2000')
      expect((screen.getByLabelText(/Number of Installments/i) as HTMLInputElement).value).toBe('11')
      expect((screen.getByLabelText(/Materials Cost/i) as HTMLInputElement).value).toBe('500')
      expect((screen.getByLabelText(/Admin Fees/i) as HTMLInputElement).value).toBe('200')
      expect((screen.getByLabelText(/Other Fees/i) as HTMLInputElement).value).toBe('100')
      expect((screen.getByLabelText(/Student Lead Time/i) as HTMLInputElement).value).toBe('7')
    })
  })

  describe('Payment Frequency Selection', () => {
    it('allows selecting monthly frequency', async () => {
      const user = userEvent.setup()
      render(
        <PaymentPlanWizardStep2
          step1Data={mockStep1Data}
          onNext={mockOnNext}
          onBack={mockOnBack}
        />
      )

      // Default should be monthly
      expect(screen.getByText('Monthly')).toBeInTheDocument()
    })

    it('allows selecting quarterly frequency', async () => {
      const user = userEvent.setup()
      render(
        <PaymentPlanWizardStep2
          step1Data={mockStep1Data}
          onNext={mockOnNext}
          onBack={mockOnBack}
        />
      )

      const frequencyTrigger = screen.getByRole('combobox', { name: /Payment Frequency/i })
      await user.click(frequencyTrigger)

      const quarterlyOption = screen.getByText('Quarterly')
      await user.click(quarterlyOption)

      await waitFor(() => {
        expect(screen.getByText(/Installments due every 3 months/i)).toBeInTheDocument()
      })
    })

    it('allows selecting custom frequency', async () => {
      const user = userEvent.setup()
      render(
        <PaymentPlanWizardStep2
          step1Data={mockStep1Data}
          onNext={mockOnNext}
          onBack={mockOnBack}
        />
      )

      const frequencyTrigger = screen.getByRole('combobox', { name: /Payment Frequency/i })
      await user.click(frequencyTrigger)

      const customOption = screen.getByText('Custom')
      await user.click(customOption)

      await waitFor(() => {
        expect(screen.getByText(/Manually configure due dates/i)).toBeInTheDocument()
      })
    })
  })

  describe('GST Toggle', () => {
    it('displays correct GST status text when inclusive', () => {
      render(
        <PaymentPlanWizardStep2
          step1Data={mockStep1Data}
          onNext={mockOnNext}
          onBack={mockOnBack}
        />
      )

      expect(screen.getByText(/Amounts already include GST/i)).toBeInTheDocument()
    })

    it('displays correct GST status text when exclusive', async () => {
      const user = userEvent.setup()
      render(
        <PaymentPlanWizardStep2
          step1Data={mockStep1Data}
          onNext={mockOnNext}
          onBack={mockOnBack}
        />
      )

      const gstToggle = screen.getByRole('switch', { name: /GST Inclusive/i })
      await user.click(gstToggle)

      await waitFor(() => {
        expect(screen.getByText(/GST will be calculated separately/i)).toBeInTheDocument()
      })
    })
  })
})
