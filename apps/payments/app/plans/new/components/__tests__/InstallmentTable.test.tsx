/**
 * InstallmentTable Component Tests
 *
 * Unit tests for the installment schedule table component
 * Epic 4: Payments Domain
 * Story 4.2: Flexible Installment Structure
 * Task 10: InstallmentTable Component
 */

import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { InstallmentTable, type Installment } from '../InstallmentTable'

describe('InstallmentTable', () => {
  // Mock data
  const mockInitialPayment: Installment = {
    installment_number: 0,
    amount: 2000,
    student_due_date: '2025-03-08T00:00:00.000Z',
    college_due_date: '2025-03-15T00:00:00.000Z',
    is_initial_payment: true,
    generates_commission: true,
    status: 'paid',
  }

  const mockRegularInstallment1: Installment = {
    installment_number: 1,
    amount: 2000,
    student_due_date: '2025-04-08T00:00:00.000Z',
    college_due_date: '2025-04-15T00:00:00.000Z',
    is_initial_payment: false,
    generates_commission: true,
    status: 'draft',
  }

  const mockRegularInstallment2: Installment = {
    installment_number: 2,
    amount: 2000,
    student_due_date: '2025-05-08T00:00:00.000Z',
    college_due_date: '2025-05-15T00:00:00.000Z',
    is_initial_payment: false,
    generates_commission: true,
    status: 'draft',
  }

  const mockInstallments = [
    mockInitialPayment,
    mockRegularInstallment1,
    mockRegularInstallment2,
  ]

  const totalCourseValue = 6000

  describe('Empty State', () => {
    it('renders empty state message when installments array is empty', () => {
      render(
        <InstallmentTable installments={[]} totalCourseValue={0} currency="AUD" />
      )

      expect(screen.getByText('No installments generated yet')).toBeInTheDocument()
    })

    it('renders table headers even with empty installments', () => {
      render(
        <InstallmentTable installments={[]} totalCourseValue={0} currency="AUD" />
      )

      expect(screen.getByText('#')).toBeInTheDocument()
      expect(screen.getByText('Amount')).toBeInTheDocument()
      expect(screen.getByText('Student Due Date')).toBeInTheDocument()
      expect(screen.getByText('College Due Date')).toBeInTheDocument()
      expect(screen.getByText('Status')).toBeInTheDocument()
    })
  })

  describe('Initial Payment Row', () => {
    it('displays "Initial Payment" label for installment_number = 0', () => {
      render(
        <InstallmentTable
          installments={mockInstallments}
          totalCourseValue={totalCourseValue}
          currency="AUD"
        />
      )

      expect(screen.getByText('Initial Payment')).toBeInTheDocument()
    })

    it('shows Paid status badge for initial payment when status is paid', () => {
      render(
        <InstallmentTable
          installments={mockInstallments}
          totalCourseValue={totalCourseValue}
          currency="AUD"
        />
      )

      const paidBadges = screen.getAllByText('Paid')
      expect(paidBadges.length).toBeGreaterThan(0)
    })

    it('applies special styling to initial payment row', () => {
      const { container } = render(
        <InstallmentTable
          installments={mockInstallments}
          totalCourseValue={totalCourseValue}
          currency="AUD"
        />
      )

      // Check for the special background class on initial payment row
      const rows = container.querySelectorAll('tbody tr')
      expect(rows[0].className).toContain('bg-blue-50')
    })

    it('displays commission-eligible indicator on initial payment', () => {
      const { container } = render(
        <InstallmentTable
          installments={mockInstallments}
          totalCourseValue={totalCourseValue}
          currency="AUD"
        />
      )

      // Check for CheckCircle2 icons (commission indicators)
      const commissionIcons = container.querySelectorAll('svg.lucide-check-circle-2')
      expect(commissionIcons.length).toBeGreaterThan(0)
    })
  })

  describe('Regular Installment Rows', () => {
    it('displays "Installment N" label for regular installments', () => {
      render(
        <InstallmentTable
          installments={mockInstallments}
          totalCourseValue={totalCourseValue}
          currency="AUD"
        />
      )

      expect(screen.getByText('Installment 1')).toBeInTheDocument()
      expect(screen.getByText('Installment 2')).toBeInTheDocument()
    })

    it('shows Draft status badge for draft installments', () => {
      render(
        <InstallmentTable
          installments={mockInstallments}
          totalCourseValue={totalCourseValue}
          currency="AUD"
        />
      )

      const draftBadges = screen.getAllByText('Draft')
      expect(draftBadges.length).toBe(2) // Two regular installments with draft status
    })

    it('displays commission-eligible indicator on all rows', () => {
      const { container } = render(
        <InstallmentTable
          installments={mockInstallments}
          totalCourseValue={totalCourseValue}
          currency="AUD"
        />
      )

      // All 3 installments should have commission indicators
      const commissionIcons = container.querySelectorAll('svg.lucide-check-circle-2')
      expect(commissionIcons.length).toBe(3)
    })
  })

  describe('Currency Formatting', () => {
    it('formats currency correctly with AUD', () => {
      render(
        <InstallmentTable
          installments={mockInstallments}
          totalCourseValue={totalCourseValue}
          currency="AUD"
        />
      )

      // Check for formatted currency values (AUD format: A$2,000.00 or $2,000.00)
      const currencyText = screen.getAllByText(/\$.*2,000\.00/)
      expect(currencyText.length).toBeGreaterThan(0)
    })

    it('formats total correctly', () => {
      render(
        <InstallmentTable
          installments={mockInstallments}
          totalCourseValue={totalCourseValue}
          currency="AUD"
        />
      )

      // Total should be $6,000.00 (3 x $2,000)
      expect(screen.getByText(/\$.*6,000\.00/)).toBeInTheDocument()
    })
  })

  describe('Date Formatting', () => {
    it('formats dates correctly', () => {
      render(
        <InstallmentTable
          installments={mockInstallments}
          totalCourseValue={totalCourseValue}
          currency="AUD"
        />
      )

      // Check for formatted dates (format: "Mar 8, 2025")
      expect(screen.getByText(/Mar.*8.*2025/)).toBeInTheDocument()
      expect(screen.getByText(/Apr.*8.*2025/)).toBeInTheDocument()
      expect(screen.getByText(/May.*8.*2025/)).toBeInTheDocument()
    })

    it('handles both student and college due dates', () => {
      render(
        <InstallmentTable
          installments={mockInstallments}
          totalCourseValue={totalCourseValue}
          currency="AUD"
        />
      )

      // Check for both date columns
      expect(screen.getByText(/Mar.*15.*2025/)).toBeInTheDocument() // College due date
      expect(screen.getByText(/Apr.*15.*2025/)).toBeInTheDocument()
    })
  })

  describe('Table Footer and Total', () => {
    it('displays table footer with total label', () => {
      render(
        <InstallmentTable
          installments={mockInstallments}
          totalCourseValue={totalCourseValue}
          currency="AUD"
        />
      )

      expect(screen.getByText('Total')).toBeInTheDocument()
    })

    it('calculates total sum correctly', () => {
      render(
        <InstallmentTable
          installments={mockInstallments}
          totalCourseValue={totalCourseValue}
          currency="AUD"
        />
      )

      // Total should be $6,000.00 (3 installments × $2,000)
      expect(screen.getByText(/\$.*6,000\.00/)).toBeInTheDocument()
    })

    it('shows Valid badge when total matches expected value', () => {
      render(
        <InstallmentTable
          installments={mockInstallments}
          totalCourseValue={6000}
          currency="AUD"
        />
      )

      expect(screen.getByText('✓ Valid')).toBeInTheDocument()
    })

    it('shows Invalid badge when total does not match expected value', () => {
      render(
        <InstallmentTable
          installments={mockInstallments}
          totalCourseValue={5000} // Incorrect total
          currency="AUD"
        />
      )

      expect(screen.getByText('⚠ Invalid')).toBeInTheDocument()
    })

    it('handles rounding tolerance (1 cent difference)', () => {
      const installmentsWithRounding: Installment[] = [
        { ...mockInitialPayment, amount: 2000.33 },
        { ...mockRegularInstallment1, amount: 2000.33 },
        { ...mockRegularInstallment2, amount: 2000.33 },
      ]

      render(
        <InstallmentTable
          installments={installmentsWithRounding}
          totalCourseValue={6000.99}
          currency="AUD"
        />
      )

      // Should show Valid because difference is within 1 cent tolerance
      expect(screen.getByText('✓ Valid')).toBeInTheDocument()
    })
  })

  describe('Status Badges', () => {
    it('renders paid status badge correctly', () => {
      const paidInstallment: Installment = {
        ...mockInitialPayment,
        status: 'paid',
      }

      render(
        <InstallmentTable
          installments={[paidInstallment]}
          totalCourseValue={2000}
          currency="AUD"
        />
      )

      expect(screen.getByText('Paid')).toBeInTheDocument()
    })

    it('renders draft status badge correctly', () => {
      const draftInstallment: Installment = {
        ...mockRegularInstallment1,
        status: 'draft',
      }

      render(
        <InstallmentTable
          installments={[draftInstallment]}
          totalCourseValue={2000}
          currency="AUD"
        />
      )

      expect(screen.getByText('Draft')).toBeInTheDocument()
    })
  })

  describe('Table Structure', () => {
    it('renders all required column headers', () => {
      render(
        <InstallmentTable
          installments={mockInstallments}
          totalCourseValue={totalCourseValue}
          currency="AUD"
        />
      )

      expect(screen.getByText('#')).toBeInTheDocument()
      expect(screen.getByText('Amount')).toBeInTheDocument()
      expect(screen.getByText('Student Due Date')).toBeInTheDocument()
      expect(screen.getByText('College Due Date')).toBeInTheDocument()
      expect(screen.getByText('Status')).toBeInTheDocument()
    })

    it('renders correct number of rows', () => {
      const { container } = render(
        <InstallmentTable
          installments={mockInstallments}
          totalCourseValue={totalCourseValue}
          currency="AUD"
        />
      )

      const bodyRows = container.querySelectorAll('tbody tr')
      expect(bodyRows.length).toBe(3) // 3 installments
    })
  })

  describe('Responsive Design', () => {
    it('applies responsive wrapper class', () => {
      const { container } = render(
        <InstallmentTable
          installments={mockInstallments}
          totalCourseValue={totalCourseValue}
          currency="AUD"
        />
      )

      // Check for rounded border wrapper
      const wrapper = container.querySelector('.rounded-md.border')
      expect(wrapper).toBeInTheDocument()
    })
  })

  describe('Edge Cases', () => {
    it('handles zero amount installments', () => {
      const zeroInstallment: Installment = {
        ...mockInitialPayment,
        amount: 0,
      }

      render(
        <InstallmentTable
          installments={[zeroInstallment]}
          totalCourseValue={0}
          currency="AUD"
        />
      )

      expect(screen.getByText(/\$.*0\.00/)).toBeInTheDocument()
    })

    it('handles invalid date strings gracefully', () => {
      const invalidDateInstallment: Installment = {
        ...mockInitialPayment,
        student_due_date: '',
        college_due_date: '',
      }

      render(
        <InstallmentTable
          installments={[invalidDateInstallment]}
          totalCourseValue={2000}
          currency="AUD"
        />
      )

      // Should display "-" for invalid dates
      const cells = screen.getAllByText('-')
      expect(cells.length).toBeGreaterThan(0)
    })
  })
})
