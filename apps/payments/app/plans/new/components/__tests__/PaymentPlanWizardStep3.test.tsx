/**
 * PaymentPlanWizardStep3 Component Tests
 *
 * Epic 4: Payments Domain
 * Story 4.2: Flexible Installment Structure
 * Task 13: Testing - Component Tests
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { PaymentPlanWizardStep3 } from '../PaymentPlanWizardStep3'
import { Step1FormData } from '../PaymentPlanWizardStep1'
import { Step2FormData } from '../PaymentPlanWizardStep2'
import { Installment } from '../InstallmentTable'

// Mock hooks
vi.mock('@/hooks/useStudents', () => ({
  useStudents: vi.fn(() => ({
    data: {
      data: [
        {
          id: 'student-1',
          first_name: 'John',
          last_name: 'Doe',
          email: 'john@example.com',
        },
      ],
      total: 1,
    },
    isLoading: false,
    error: null,
  })),
}))

// Mock InstallmentTable component
vi.mock('../InstallmentTable', () => ({
  InstallmentTable: ({
    installments,
    totalCourseValue,
  }: {
    installments: Installment[]
    totalCourseValue: number
  }) => (
    <div data-testid="installment-table">
      <div>Installments: {installments.length}</div>
      <div>Total: {totalCourseValue}</div>
    </div>
  ),
}))

describe('PaymentPlanWizardStep3', () => {
  const mockStep1Data: Step1FormData = {
    student_id: 'student-1',
    branch_id: 'branch-1',
    course_name: 'Bachelor of Business',
    total_course_value: 10000,
    commission_rate: 0.15,
    course_start_date: '2025-02-01',
    course_end_date: '2025-12-31',
  }

  const mockStep2Data: Step2FormData = {
    initial_payment_amount: 2000,
    initial_payment_due_date: '2025-02-01',
    initial_payment_paid: false,
    number_of_installments: 4,
    payment_frequency: 'quarterly',
    materials_cost: 500,
    admin_fees: 200,
    other_fees: 100,
    first_college_due_date: '2025-03-15',
    student_lead_time_days: 7,
    gst_inclusive: true,
  }

  // Commissionable value = 10000 - 500 - 200 - 100 = 9200
  const mockInstallments: Installment[] = [
    {
      installment_number: 0,
      amount: 2000,
      student_due_date: '2025-02-01',
      college_due_date: '2025-02-08',
      is_initial_payment: true,
      generates_commission: true,
      status: 'draft',
    },
    {
      installment_number: 1,
      amount: 1800,
      student_due_date: '2025-03-08',
      college_due_date: '2025-03-15',
      is_initial_payment: false,
      generates_commission: true,
      status: 'draft',
    },
    {
      installment_number: 2,
      amount: 1800,
      student_due_date: '2025-06-08',
      college_due_date: '2025-06-15',
      is_initial_payment: false,
      generates_commission: true,
      status: 'draft',
    },
    {
      installment_number: 3,
      amount: 1800,
      student_due_date: '2025-09-08',
      college_due_date: '2025-09-15',
      is_initial_payment: false,
      generates_commission: true,
      status: 'draft',
    },
    {
      installment_number: 4,
      amount: 1800,
      student_due_date: '2025-12-08',
      college_due_date: '2025-12-15',
      is_initial_payment: false,
      generates_commission: true,
      status: 'draft',
    },
  ]

  const mockOnBack = vi.fn()
  const mockOnEditStep1 = vi.fn()
  const mockOnEditStep2 = vi.fn()
  const mockOnCreate = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Summary Display', () => {
    it('displays selected student information', async () => {
      render(
        <PaymentPlanWizardStep3
          step1Data={mockStep1Data}
          step2Data={mockStep2Data}
          generatedInstallments={mockInstallments}
          onBack={mockOnBack}
          onEditStep1={mockOnEditStep1}
          onEditStep2={mockOnEditStep2}
          onCreate={mockOnCreate}
        />
      )

      await waitFor(() => {
        expect(screen.getByText('John Doe')).toBeInTheDocument()
        expect(screen.getByText('john@example.com')).toBeInTheDocument()
      })
    })

    it('displays course information', () => {
      render(
        <PaymentPlanWizardStep3
          step1Data={mockStep1Data}
          step2Data={mockStep2Data}
          generatedInstallments={mockInstallments}
          onBack={mockOnBack}
          onEditStep1={mockOnEditStep1}
          onEditStep2={mockOnEditStep2}
          onCreate={mockOnCreate}
        />
      )

      expect(screen.getByText('Bachelor of Business')).toBeInTheDocument()
    })

    it('displays total course value', () => {
      render(
        <PaymentPlanWizardStep3
          step1Data={mockStep1Data}
          step2Data={mockStep2Data}
          generatedInstallments={mockInstallments}
          onBack={mockOnBack}
          onEditStep1={mockOnEditStep1}
          onEditStep2={mockOnEditStep2}
          onCreate={mockOnCreate}
        />
      )

      expect(screen.getByText(/\$10,000/i)).toBeInTheDocument()
    })

    it('displays commission details highlighted in green section', () => {
      render(
        <PaymentPlanWizardStep3
          step1Data={mockStep1Data}
          step2Data={mockStep2Data}
          generatedInstallments={mockInstallments}
          onBack={mockOnBack}
          onEditStep1={mockOnEditStep1}
          onEditStep2={mockOnEditStep2}
          onCreate={mockOnCreate}
        />
      )

      expect(screen.getByText('Commission Details')).toBeInTheDocument()
      expect(screen.getByText(/Commission Rate:/i)).toBeInTheDocument()
      expect(screen.getByText(/15\.0%/i)).toBeInTheDocument()
      expect(screen.getByText(/Commissionable Value:/i)).toBeInTheDocument()
      expect(screen.getByText(/Total Commission:/i)).toBeInTheDocument()
    })

    it('displays non-commissionable fees when present', () => {
      render(
        <PaymentPlanWizardStep3
          step1Data={mockStep1Data}
          step2Data={mockStep2Data}
          generatedInstallments={mockInstallments}
          onBack={mockOnBack}
          onEditStep1={mockOnEditStep1}
          onEditStep2={mockOnEditStep2}
          onCreate={mockOnCreate}
        />
      )

      expect(screen.getByText(/Non-Commissionable Fees:/i)).toBeInTheDocument()
      expect(screen.getByText(/Materials:/i)).toBeInTheDocument()
      expect(screen.getByText(/Admin:/i)).toBeInTheDocument()
      expect(screen.getByText(/Other:/i)).toBeInTheDocument()
    })

    it('displays GST status badge', () => {
      render(
        <PaymentPlanWizardStep3
          step1Data={mockStep1Data}
          step2Data={mockStep2Data}
          generatedInstallments={mockInstallments}
          onBack={mockOnBack}
          onEditStep1={mockOnEditStep1}
          onEditStep2={mockOnEditStep2}
          onCreate={mockOnCreate}
        />
      )

      expect(screen.getByText('GST Inclusive')).toBeInTheDocument()
    })

    it('displays payment structure details', () => {
      render(
        <PaymentPlanWizardStep3
          step1Data={mockStep1Data}
          step2Data={mockStep2Data}
          generatedInstallments={mockInstallments}
          onBack={mockOnBack}
          onEditStep1={mockOnEditStep1}
          onEditStep2={mockOnEditStep2}
          onCreate={mockOnCreate}
        />
      )

      expect(screen.getByText(/Payment Frequency:/i)).toBeInTheDocument()
      expect(screen.getByText('Quarterly')).toBeInTheDocument()
      expect(screen.getByText(/Number of Installments:/i)).toBeInTheDocument()
      expect(screen.getByText(/Student Lead Time:/i)).toBeInTheDocument()
      expect(screen.getByText(/7 days/i)).toBeInTheDocument()
    })
  })

  describe('Installment Schedule', () => {
    it('displays installment table', () => {
      render(
        <PaymentPlanWizardStep3
          step1Data={mockStep1Data}
          step2Data={mockStep2Data}
          generatedInstallments={mockInstallments}
          onBack={mockOnBack}
          onEditStep1={mockOnEditStep1}
          onEditStep2={mockOnEditStep2}
          onCreate={mockOnCreate}
        />
      )

      expect(screen.getByTestId('installment-table')).toBeInTheDocument()
      expect(screen.getByText(/Installments: 5/i)).toBeInTheDocument()
    })

    it('displays installment count badge', () => {
      render(
        <PaymentPlanWizardStep3
          step1Data={mockStep1Data}
          step2Data={mockStep2Data}
          generatedInstallments={mockInstallments}
          onBack={mockOnBack}
          onEditStep1={mockOnEditStep1}
          onEditStep2={mockOnEditStep2}
          onCreate={mockOnCreate}
        />
      )

      expect(screen.getByText(/5 installments/i)).toBeInTheDocument()
    })
  })

  describe('Validation', () => {
    it('shows green success banner when amounts reconcile', () => {
      render(
        <PaymentPlanWizardStep3
          step1Data={mockStep1Data}
          step2Data={mockStep2Data}
          generatedInstallments={mockInstallments}
          onBack={mockOnBack}
          onEditStep1={mockOnEditStep1}
          onEditStep2={mockOnEditStep2}
          onCreate={mockOnCreate}
        />
      )

      expect(screen.getByText(/Amounts reconcile correctly/i)).toBeInTheDocument()
      expect(screen.getByText(/Installments sum to commissionable value/i)).toBeInTheDocument()
    })

    it('shows red error banner when amounts do not reconcile', () => {
      // Create invalid installments (sum doesn't match commissionable value)
      const invalidInstallments: Installment[] = [
        {
          installment_number: 0,
          amount: 1000,
          student_due_date: '2025-02-01',
          college_due_date: '2025-02-08',
          is_initial_payment: true,
          generates_commission: true,
          status: 'draft',
        },
      ]

      render(
        <PaymentPlanWizardStep3
          step1Data={mockStep1Data}
          step2Data={mockStep2Data}
          generatedInstallments={invalidInstallments}
          onBack={mockOnBack}
          onEditStep1={mockOnEditStep1}
          onEditStep2={mockOnEditStep2}
          onCreate={mockOnCreate}
        />
      )

      expect(
        screen.getByText(/Warning: Installments do not sum to commissionable value/i)
      ).toBeInTheDocument()
      expect(screen.getByText(/Expected:/i)).toBeInTheDocument()
      expect(screen.getByText(/Actual:/i)).toBeInTheDocument()
      expect(screen.getByText(/Difference:/i)).toBeInTheDocument()
    })

    it('disables Create button when validation fails', () => {
      // Create invalid installments
      const invalidInstallments: Installment[] = [
        {
          installment_number: 0,
          amount: 1000,
          student_due_date: '2025-02-01',
          college_due_date: '2025-02-08',
          is_initial_payment: true,
          generates_commission: true,
          status: 'draft',
        },
      ]

      render(
        <PaymentPlanWizardStep3
          step1Data={mockStep1Data}
          step2Data={mockStep2Data}
          generatedInstallments={invalidInstallments}
          onBack={mockOnBack}
          onEditStep1={mockOnEditStep1}
          onEditStep2={mockOnEditStep2}
          onCreate={mockOnCreate}
        />
      )

      const createButton = screen.getByRole('button', { name: /Create Payment Plan/i })
      expect(createButton).toBeDisabled()
    })

    it('enables Create button when validation passes', () => {
      render(
        <PaymentPlanWizardStep3
          step1Data={mockStep1Data}
          step2Data={mockStep2Data}
          generatedInstallments={mockInstallments}
          onBack={mockOnBack}
          onEditStep1={mockOnEditStep1}
          onEditStep2={mockOnEditStep2}
          onCreate={mockOnCreate}
        />
      )

      const createButton = screen.getByRole('button', { name: /Create Payment Plan/i })
      expect(createButton).not.toBeDisabled()
    })
  })

  describe('Navigation', () => {
    it('calls onBack when Back button is clicked', async () => {
      const user = userEvent.setup()
      render(
        <PaymentPlanWizardStep3
          step1Data={mockStep1Data}
          step2Data={mockStep2Data}
          generatedInstallments={mockInstallments}
          onBack={mockOnBack}
          onEditStep1={mockOnEditStep1}
          onEditStep2={mockOnEditStep2}
          onCreate={mockOnCreate}
        />
      )

      const backButton = screen.getByRole('button', { name: /Back to Step 2/i })
      await user.click(backButton)

      expect(mockOnBack).toHaveBeenCalledTimes(1)
    })

    it('calls onEditStep1 when Edit General Info button is clicked', async () => {
      const user = userEvent.setup()
      render(
        <PaymentPlanWizardStep3
          step1Data={mockStep1Data}
          step2Data={mockStep2Data}
          generatedInstallments={mockInstallments}
          onBack={mockOnBack}
          onEditStep1={mockOnEditStep1}
          onEditStep2={mockOnEditStep2}
          onCreate={mockOnCreate}
        />
      )

      const editStep1Button = screen.getByRole('button', { name: /Edit General Info/i })
      await user.click(editStep1Button)

      expect(mockOnEditStep1).toHaveBeenCalledTimes(1)
    })

    it('calls onEditStep2 when Edit Payment Structure button is clicked', async () => {
      const user = userEvent.setup()
      render(
        <PaymentPlanWizardStep3
          step1Data={mockStep1Data}
          step2Data={mockStep2Data}
          generatedInstallments={mockInstallments}
          onBack={mockOnBack}
          onEditStep1={mockOnEditStep1}
          onEditStep2={mockOnEditStep2}
          onCreate={mockOnCreate}
        />
      )

      const editStep2Button = screen.getByRole('button', { name: /Edit Payment Structure/i })
      await user.click(editStep2Button)

      expect(mockOnEditStep2).toHaveBeenCalledTimes(1)
    })

    it('calls onCreate when Create Payment Plan button is clicked', async () => {
      const user = userEvent.setup()
      render(
        <PaymentPlanWizardStep3
          step1Data={mockStep1Data}
          step2Data={mockStep2Data}
          generatedInstallments={mockInstallments}
          onBack={mockOnBack}
          onEditStep1={mockOnEditStep1}
          onEditStep2={mockOnEditStep2}
          onCreate={mockOnCreate}
        />
      )

      const createButton = screen.getByRole('button', { name: /Create Payment Plan/i })
      await user.click(createButton)

      expect(mockOnCreate).toHaveBeenCalledTimes(1)
    })
  })

  describe('Loading State', () => {
    it('displays loading state when creating', () => {
      render(
        <PaymentPlanWizardStep3
          step1Data={mockStep1Data}
          step2Data={mockStep2Data}
          generatedInstallments={mockInstallments}
          onBack={mockOnBack}
          onEditStep1={mockOnEditStep1}
          onEditStep2={mockOnEditStep2}
          onCreate={mockOnCreate}
          isCreating={true}
        />
      )

      expect(screen.getByText(/Creating Payment Plan.../i)).toBeInTheDocument()
    })

    it('disables all buttons when creating', () => {
      render(
        <PaymentPlanWizardStep3
          step1Data={mockStep1Data}
          step2Data={mockStep2Data}
          generatedInstallments={mockInstallments}
          onBack={mockOnBack}
          onEditStep1={mockOnEditStep1}
          onEditStep2={mockOnEditStep2}
          onCreate={mockOnCreate}
          isCreating={true}
        />
      )

      expect(screen.getByRole('button', { name: /Back to Step 2/i })).toBeDisabled()
      expect(screen.getByRole('button', { name: /Edit General Info/i })).toBeDisabled()
      expect(screen.getByRole('button', { name: /Edit Payment Structure/i })).toBeDisabled()
      expect(screen.getByRole('button', { name: /Creating Payment Plan.../i })).toBeDisabled()
    })
  })

  describe('Step Title', () => {
    it('renders step title and description', () => {
      render(
        <PaymentPlanWizardStep3
          step1Data={mockStep1Data}
          step2Data={mockStep2Data}
          generatedInstallments={mockInstallments}
          onBack={mockOnBack}
          onEditStep1={mockOnEditStep1}
          onEditStep2={mockOnEditStep2}
          onCreate={mockOnCreate}
        />
      )

      expect(screen.getByText('Step 3: Review & Confirmation')).toBeInTheDocument()
      expect(
        screen.getByText(/Review the payment plan summary and installment schedule before creating/i)
      ).toBeInTheDocument()
    })
  })
})
