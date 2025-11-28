/**
 * MarkAsPaidModal Component Tests
 *
 * Tests for the Mark as Paid modal component
 * Epic 4: Payments Domain
 * Story 4.4: Manual Payment Recording
 * Task 9: Testing - Component Tests
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MarkAsPaidModal } from '../MarkAsPaidModal'
import type { Installment } from '@pleeno/validations'

// Mock the useRecordPayment hook
const mockMutate = vi.fn()
const mockIsPending = false

vi.mock('../../hooks/useRecordPayment', () => ({
  useRecordPayment: vi.fn(() => ({
    mutate: mockMutate,
    isPending: mockIsPending,
  })),
}))

// Import the mocked module to access it
import { useRecordPayment } from '../../hooks/useRecordPayment'

// Mock toast
vi.mock('@pleeno/ui', async () => {
  const actual = await vi.importActual('@pleeno/ui')
  return {
    ...actual,
    useToast: () => ({
      addToast: vi.fn(),
    }),
  }
})

describe('MarkAsPaidModal', () => {
  const mockInstallment: Installment = {
    id: 'installment-123',
    payment_plan_id: 'plan-123',
    installment_number: 1,
    amount: 1000,
    student_due_date: '2025-02-01',
    college_due_date: '2025-02-08',
    status: 'pending',
    paid_date: null,
    paid_amount: null,
    payment_notes: null,
    agency_id: 'agency-123',
    created_at: '2025-01-01T00:00:00Z',
    updated_at: '2025-01-01T00:00:00Z',
  }

  const mockOnClose = vi.fn()
  const mockOnSuccess = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
    // Reset the mock implementation
    vi.mocked(useRecordPayment).mockReturnValue({
      mutate: mockMutate,
      isPending: false,
    } as any)
  })

  describe('Modal Rendering', () => {
    it('should render modal with correct installment data', () => {
      render(
        <MarkAsPaidModal
          installment={mockInstallment}
          isOpen={true}
          onClose={mockOnClose}
        />
      )

      expect(screen.getByText('Mark Installment as Paid')).toBeInTheDocument()
      expect(screen.getByText(/Installment #1/)).toBeInTheDocument()
      expect(screen.getByText(/Amount: \$1,000.00/)).toBeInTheDocument()
    })

    it('should not render when isOpen is false', () => {
      render(
        <MarkAsPaidModal
          installment={mockInstallment}
          isOpen={false}
          onClose={mockOnClose}
        />
      )

      expect(screen.queryByText('Mark Installment as Paid')).not.toBeInTheDocument()
    })

    it('should display due date when provided', () => {
      render(
        <MarkAsPaidModal
          installment={mockInstallment}
          isOpen={true}
          onClose={mockOnClose}
        />
      )

      expect(screen.getByText(/Due:/)).toBeInTheDocument()
    })

    it('should display outstanding balance for partial payments', () => {
      const partialInstallment = {
        ...mockInstallment,
        status: 'partial' as const,
        paid_amount: 600,
      }

      render(
        <MarkAsPaidModal
          installment={partialInstallment}
          isOpen={true}
          onClose={mockOnClose}
        />
      )

      expect(screen.getByText(/Outstanding:/)).toBeInTheDocument()
      expect(screen.getByText(/\$400.00/)).toBeInTheDocument()
    })
  })

  describe('Form Fields', () => {
    it('should render all form fields', () => {
      render(
        <MarkAsPaidModal
          installment={mockInstallment}
          isOpen={true}
          onClose={mockOnClose}
        />
      )

      expect(screen.getByLabelText(/Payment Date/)).toBeInTheDocument()
      expect(screen.getByLabelText(/Amount Paid/)).toBeInTheDocument()
      expect(screen.getByLabelText(/Notes \(Optional\)/)).toBeInTheDocument()
    })

    it('should pre-fill paid_amount with full installment amount for new payments', () => {
      render(
        <MarkAsPaidModal
          installment={mockInstallment}
          isOpen={true}
          onClose={mockOnClose}
        />
      )

      const amountInput = screen.getByLabelText(/Amount Paid/) as HTMLInputElement
      expect(amountInput.value).toBe('1000')
    })

    it('should pre-fill paid_amount with outstanding balance for partial payments', () => {
      const partialInstallment = {
        ...mockInstallment,
        status: 'partial' as const,
        paid_amount: 600,
      }

      render(
        <MarkAsPaidModal
          installment={partialInstallment}
          isOpen={true}
          onClose={mockOnClose}
        />
      )

      const amountInput = screen.getByLabelText(/Amount Paid/) as HTMLInputElement
      expect(amountInput.value).toBe('400') // 1000 - 600
    })

    it('should set paid_date to today by default', () => {
      render(
        <MarkAsPaidModal
          installment={mockInstallment}
          isOpen={true}
          onClose={mockOnClose}
        />
      )

      const dateInput = screen.getByLabelText(/Payment Date/) as HTMLInputElement
      const today = new Date().toISOString().split('T')[0]
      expect(dateInput.value).toBe(today)
    })

    it('should set max date to today for date picker', () => {
      render(
        <MarkAsPaidModal
          installment={mockInstallment}
          isOpen={true}
          onClose={mockOnClose}
        />
      )

      const dateInput = screen.getByLabelText(/Payment Date/) as HTMLInputElement
      const today = new Date().toISOString().split('T')[0]
      expect(dateInput.max).toBe(today)
    })
  })

  describe('Form Validation', () => {
    it('should display validation error for empty paid_amount', async () => {
      const user = userEvent.setup()
      render(
        <MarkAsPaidModal
          installment={mockInstallment}
          isOpen={true}
          onClose={mockOnClose}
        />
      )

      const amountInput = screen.getByLabelText(/Amount Paid/)
      await user.clear(amountInput)
      await user.tab()

      await waitFor(() => {
        expect(screen.getByText(/Expected number, received nan/i)).toBeInTheDocument()
      })
    })

    it('should allow valid paid_amount', async () => {
      const user = userEvent.setup()
      render(
        <MarkAsPaidModal
          installment={mockInstallment}
          isOpen={true}
          onClose={mockOnClose}
        />
      )

      const amountInput = screen.getByLabelText(/Amount Paid/)
      await user.clear(amountInput)
      await user.type(amountInput, '500')

      // No error should be shown
      await waitFor(() => {
        expect(screen.queryByRole('alert')).not.toBeInTheDocument()
      })
    })
  })

  describe('Character Counter', () => {
    it('should display character counter for notes field', () => {
      render(
        <MarkAsPaidModal
          installment={mockInstallment}
          isOpen={true}
          onClose={mockOnClose}
        />
      )

      expect(screen.getByText('0/500')).toBeInTheDocument()
    })

    it('should update character counter as user types', async () => {
      const user = userEvent.setup()
      render(
        <MarkAsPaidModal
          installment={mockInstallment}
          isOpen={true}
          onClose={mockOnClose}
        />
      )

      const notesInput = screen.getByLabelText(/Notes \(Optional\)/)
      await user.type(notesInput, 'Payment received')

      await waitFor(() => {
        expect(screen.getByText('16/500')).toBeInTheDocument()
      })
    })

    it('should change color when approaching limit', async () => {
      const user = userEvent.setup()
      render(
        <MarkAsPaidModal
          installment={mockInstallment}
          isOpen={true}
          onClose={mockOnClose}
        />
      )

      const notesInput = screen.getByLabelText(/Notes \(Optional\)/)
      const longText = 'a'.repeat(460)
      await user.type(notesInput, longText)

      await waitFor(() => {
        const counter = screen.getByText('460/500')
        expect(counter.className).toContain('text-destructive')
      })
    })
  })

  describe('Partial Payment Warning', () => {
    it('should display partial payment warning when paid_amount < outstanding balance', async () => {
      const user = userEvent.setup()
      render(
        <MarkAsPaidModal
          installment={mockInstallment}
          isOpen={true}
          onClose={mockOnClose}
        />
      )

      const amountInput = screen.getByLabelText(/Amount Paid/)
      await user.clear(amountInput)
      await user.type(amountInput, '500')

      await waitFor(() => {
        expect(screen.getByText(/This is a partial payment/)).toBeInTheDocument()
        expect(screen.getByText(/Outstanding balance after this payment:/)).toBeInTheDocument()
        expect(screen.getByText(/\$500.00/)).toBeInTheDocument() // 1000 - 500
      })
    })

    it('should not display warning when paid_amount >= installment amount', async () => {
      const user = userEvent.setup()
      render(
        <MarkAsPaidModal
          installment={mockInstallment}
          isOpen={true}
          onClose={mockOnClose}
        />
      )

      const amountInput = screen.getByLabelText(/Amount Paid/)
      await user.clear(amountInput)
      await user.type(amountInput, '1000')

      await waitFor(() => {
        expect(screen.queryByText(/This is a partial payment/)).not.toBeInTheDocument()
      })
    })

    it('should calculate correct remaining balance for partial installments', async () => {
      const user = userEvent.setup()
      const partialInstallment = {
        ...mockInstallment,
        status: 'partial' as const,
        paid_amount: 600,
      }

      render(
        <MarkAsPaidModal
          installment={partialInstallment}
          isOpen={true}
          onClose={mockOnClose}
        />
      )

      // Outstanding balance is 400, user pays 200
      const amountInput = screen.getByLabelText(/Amount Paid/)
      await user.clear(amountInput)
      await user.type(amountInput, '200')

      await waitFor(() => {
        expect(screen.getByText(/This is a partial payment/)).toBeInTheDocument()
        expect(screen.getByText(/\$200.00/)).toBeInTheDocument() // 400 - 200
      })
    })
  })

  describe('Form Submission', () => {
    it('should call recordPayment mutation with correct data on submit', async () => {
      const user = userEvent.setup()
      render(
        <MarkAsPaidModal
          installment={mockInstallment}
          isOpen={true}
          onClose={mockOnClose}
          onSuccess={mockOnSuccess}
        />
      )

      const amountInput = screen.getByLabelText(/Amount Paid/)
      await user.clear(amountInput)
      await user.type(amountInput, '1000')

      const notesInput = screen.getByLabelText(/Notes \(Optional\)/)
      await user.type(notesInput, 'Payment received via bank transfer')

      const submitButton = screen.getByRole('button', { name: /Mark as Paid/ })
      await user.click(submitButton)

      await waitFor(() => {
        expect(mockMutate).toHaveBeenCalledWith(
          expect.objectContaining({
            installmentId: 'installment-123',
            paymentPlanId: 'plan-123',
            paid_amount: 1000,
            notes: 'Payment received via bank transfer',
          }),
          expect.any(Object)
        )
      })
    })

    it('should call onSuccess and onClose after successful submission', async () => {
      const user = userEvent.setup()

      // Mock the mutation to simulate success
      mockMutate.mockImplementation((variables, { onSuccess }) => {
        onSuccess?.()
      })

      render(
        <MarkAsPaidModal
          installment={mockInstallment}
          isOpen={true}
          onClose={mockOnClose}
          onSuccess={mockOnSuccess}
        />
      )

      const submitButton = screen.getByRole('button', { name: /Mark as Paid/ })
      await user.click(submitButton)

      await waitFor(() => {
        expect(mockOnSuccess).toHaveBeenCalled()
        expect(mockOnClose).toHaveBeenCalled()
      })
    })

    it('should disable submit button when form is invalid', async () => {
      const user = userEvent.setup()
      render(
        <MarkAsPaidModal
          installment={mockInstallment}
          isOpen={true}
          onClose={mockOnClose}
        />
      )

      const amountInput = screen.getByLabelText(/Amount Paid/)
      await user.clear(amountInput)

      const submitButton = screen.getByRole('button', { name: /Mark as Paid/ })

      await waitFor(() => {
        expect(submitButton).toBeDisabled()
      })
    })

    it('should disable submit button when mutation is pending', () => {
      vi.mocked(useRecordPayment).mockReturnValue({
        mutate: mockMutate,
        isPending: true,
      } as any)

      render(
        <MarkAsPaidModal
          installment={mockInstallment}
          isOpen={true}
          onClose={mockOnClose}
        />
      )

      const submitButton = screen.getByRole('button', { name: /Recording.../ })
      expect(submitButton).toBeDisabled()
    })
  })

  describe('Cancel Button', () => {
    it('should call onClose when cancel button is clicked', async () => {
      const user = userEvent.setup()
      render(
        <MarkAsPaidModal
          installment={mockInstallment}
          isOpen={true}
          onClose={mockOnClose}
        />
      )

      const cancelButton = screen.getByRole('button', { name: /Cancel/ })
      await user.click(cancelButton)

      expect(mockOnClose).toHaveBeenCalled()
    })

    it('should disable cancel button when mutation is pending', () => {
      vi.mocked(useRecordPayment).mockReturnValue({
        mutate: mockMutate,
        isPending: true,
      } as any)

      render(
        <MarkAsPaidModal
          installment={mockInstallment}
          isOpen={true}
          onClose={mockOnClose}
        />
      )

      const cancelButton = screen.getByRole('button', { name: /Cancel/ })
      expect(cancelButton).toBeDisabled()
    })
  })

  describe('Accessibility', () => {
    it('should have proper ARIA labels on form fields', () => {
      render(
        <MarkAsPaidModal
          installment={mockInstallment}
          isOpen={true}
          onClose={mockOnClose}
        />
      )

      const dateInput = screen.getByLabelText(/Payment Date/)
      expect(dateInput).toHaveAttribute('aria-required', 'true')

      const amountInput = screen.getByLabelText(/Amount Paid/)
      expect(amountInput).toHaveAttribute('aria-required', 'true')
    })

    it('should associate error messages with form fields', async () => {
      const user = userEvent.setup()
      render(
        <MarkAsPaidModal
          installment={mockInstallment}
          isOpen={true}
          onClose={mockOnClose}
        />
      )

      const amountInput = screen.getByLabelText(/Amount Paid/)
      await user.clear(amountInput)
      await user.tab()

      await waitFor(() => {
        expect(amountInput).toHaveAttribute('aria-invalid', 'true')
        expect(amountInput).toHaveAttribute('aria-describedby')
      })
    })

    it('should have aria-live region for character counter', () => {
      render(
        <MarkAsPaidModal
          installment={mockInstallment}
          isOpen={true}
          onClose={mockOnClose}
        />
      )

      const counter = screen.getByText('0/500')
      expect(counter).toHaveAttribute('aria-live', 'polite')
    })

    it('should have aria-busy on submit button when pending', () => {
      vi.mocked(useRecordPayment).mockReturnValue({
        mutate: mockMutate,
        isPending: true,
      } as any)

      render(
        <MarkAsPaidModal
          installment={mockInstallment}
          isOpen={true}
          onClose={mockOnClose}
        />
      )

      const submitButton = screen.getByRole('button', { name: /Recording.../ })
      expect(submitButton).toHaveAttribute('aria-busy', 'true')
    })
  })

  describe('Loading States', () => {
    it('should show loading text when mutation is pending', () => {
      vi.mocked(useRecordPayment).mockReturnValue({
        mutate: mockMutate,
        isPending: true,
      } as any)

      render(
        <MarkAsPaidModal
          installment={mockInstallment}
          isOpen={true}
          onClose={mockOnClose}
        />
      )

      expect(screen.getByText('Recording...')).toBeInTheDocument()
    })

    it('should disable all inputs when mutation is pending', () => {
      vi.mocked(useRecordPayment).mockReturnValue({
        mutate: mockMutate,
        isPending: true,
      } as any)

      render(
        <MarkAsPaidModal
          installment={mockInstallment}
          isOpen={true}
          onClose={mockOnClose}
        />
      )

      const dateInput = screen.getByLabelText(/Payment Date/)
      const amountInput = screen.getByLabelText(/Amount Paid/)
      const notesInput = screen.getByLabelText(/Notes \(Optional\)/)

      expect(dateInput).toBeDisabled()
      expect(amountInput).toBeDisabled()
      expect(notesInput).toBeDisabled()
    })
  })
})
