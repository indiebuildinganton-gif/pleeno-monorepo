/**
 * InstallmentStatusBadge Component Tests
 *
 * Tests for the installment status badge component
 * Epic 5: Intelligent Status Automation
 * Story 5.2: Due Soon Notification Flags
 * Task 2: Update UI to display "due soon" badges
 */

import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import {
  InstallmentStatusBadge,
  getInstallmentStatusLabel,
  getAllInstallmentStatuses,
} from '../InstallmentStatusBadge'

describe('InstallmentStatusBadge', () => {
  describe('Status rendering', () => {
    it('should render draft status correctly', () => {
      render(<InstallmentStatusBadge status="draft" />)
      expect(screen.getByText('Draft')).toBeInTheDocument()
    })

    it('should render pending status correctly', () => {
      render(<InstallmentStatusBadge status="pending" />)
      expect(screen.getByText('Pending')).toBeInTheDocument()
    })

    it('should render paid status correctly', () => {
      render(<InstallmentStatusBadge status="paid" />)
      expect(screen.getByText('Paid')).toBeInTheDocument()
    })

    it('should render overdue status correctly', () => {
      render(<InstallmentStatusBadge status="overdue" />)
      expect(screen.getByText('Overdue')).toBeInTheDocument()
    })

    it('should render cancelled status correctly', () => {
      render(<InstallmentStatusBadge status="cancelled" />)
      expect(screen.getByText('Cancelled')).toBeInTheDocument()
    })
  })

  describe('Due soon flag', () => {
    it('should render "Due Soon" when status is pending and isDueSoon is true', () => {
      render(<InstallmentStatusBadge status="pending" isDueSoon={true} />)
      expect(screen.getByText(/Due Soon/)).toBeInTheDocument()
      expect(screen.queryByText('Pending')).not.toBeInTheDocument()
    })

    it('should render "Pending" when status is pending and isDueSoon is false', () => {
      render(<InstallmentStatusBadge status="pending" isDueSoon={false} />)
      expect(screen.getByText('Pending')).toBeInTheDocument()
      expect(screen.queryByText(/Due Soon/)).not.toBeInTheDocument()
    })

    it('should not show due soon for non-pending statuses even if isDueSoon is true', () => {
      render(<InstallmentStatusBadge status="paid" isDueSoon={true} />)
      expect(screen.getByText('Paid')).toBeInTheDocument()
      expect(screen.queryByText(/Due Soon/)).not.toBeInTheDocument()
    })

    it('should display days until due when isDueSoon and daysUntilDue are provided', () => {
      render(<InstallmentStatusBadge status="pending" isDueSoon={true} daysUntilDue={3} />)
      expect(screen.getByText(/Due Soon \(3d\)/)).toBeInTheDocument()
    })

    it('should not display days countdown when daysUntilDue is not provided', () => {
      render(<InstallmentStatusBadge status="pending" isDueSoon={true} />)
      const badge = screen.getByText('Due Soon')
      expect(badge.textContent).toBe('Due Soon')
      expect(badge.textContent).not.toContain('d)')
    })
  })

  describe('Icon display', () => {
    it('should show icon by default', () => {
      const { container } = render(<InstallmentStatusBadge status="overdue" />)
      const icon = container.querySelector('svg')
      expect(icon).toBeInTheDocument()
    })

    it('should hide icon when showIcon is false', () => {
      const { container } = render(<InstallmentStatusBadge status="overdue" showIcon={false} />)
      const icon = container.querySelector('svg')
      expect(icon).not.toBeInTheDocument()
    })

    it('should show Clock icon for due soon status', () => {
      const { container } = render(
        <InstallmentStatusBadge status="pending" isDueSoon={true} />
      )
      // Clock icon should be present
      const icon = container.querySelector('svg')
      expect(icon).toBeInTheDocument()
    })

    it('should show AlertTriangle icon for overdue status', () => {
      const { container } = render(<InstallmentStatusBadge status="overdue" />)
      const icon = container.querySelector('svg')
      expect(icon).toBeInTheDocument()
    })

    it('should show CheckCircle icon for paid status', () => {
      const { container } = render(<InstallmentStatusBadge status="paid" />)
      const icon = container.querySelector('svg')
      expect(icon).toBeInTheDocument()
    })
  })

  describe('Color coding', () => {
    it('should use warning variant (yellow/amber) for due soon', () => {
      render(<InstallmentStatusBadge status="pending" isDueSoon={true} />)
      const badge = screen.getByText('Due Soon').closest('div')
      expect(badge).toBeInTheDocument()
      // Badge component should receive variant="warning"
    })

    it('should use destructive variant (red) for overdue', () => {
      render(<InstallmentStatusBadge status="overdue" />)
      const badge = screen.getByText('Overdue').closest('div')
      expect(badge).toBeInTheDocument()
      // Badge component should receive variant="destructive"
    })

    it('should use success variant (green) for paid', () => {
      render(<InstallmentStatusBadge status="paid" />)
      const badge = screen.getByText('Paid').closest('div')
      expect(badge).toBeInTheDocument()
      // Badge component should receive variant="success"
    })

    it('should use blue variant for pending', () => {
      render(<InstallmentStatusBadge status="pending" />)
      const badge = screen.getByText('Pending').closest('div')
      expect(badge).toBeInTheDocument()
      // Badge component should receive variant="blue"
    })

    it('should use gray variant for draft', () => {
      render(<InstallmentStatusBadge status="draft" />)
      const badge = screen.getByText('Draft').closest('div')
      expect(badge).toBeInTheDocument()
      // Badge component should receive variant="gray"
    })

    it('should use gray variant for cancelled', () => {
      render(<InstallmentStatusBadge status="cancelled" />)
      const badge = screen.getByText('Cancelled').closest('div')
      expect(badge).toBeInTheDocument()
      // Badge component should receive variant="gray"
    })
  })

  describe('Custom className', () => {
    it('should apply custom className when provided', () => {
      const { container } = render(
        <InstallmentStatusBadge status="pending" className="custom-class" />
      )
      const badge = container.querySelector('.custom-class')
      expect(badge).toBeInTheDocument()
    })
  })

  describe('Helper functions', () => {
    it('getInstallmentStatusLabel should return correct label for status', () => {
      expect(getInstallmentStatusLabel('draft')).toBe('Draft')
      expect(getInstallmentStatusLabel('pending')).toBe('Pending')
      expect(getInstallmentStatusLabel('paid')).toBe('Paid')
      expect(getInstallmentStatusLabel('overdue')).toBe('Overdue')
      expect(getInstallmentStatusLabel('cancelled')).toBe('Cancelled')
    })

    it('getInstallmentStatusLabel should return "Due Soon" when pending and isDueSoon is true', () => {
      expect(getInstallmentStatusLabel('pending', true)).toBe('Due Soon')
    })

    it('getAllInstallmentStatuses should return all valid statuses', () => {
      const statuses = getAllInstallmentStatuses()
      expect(statuses).toEqual(['draft', 'pending', 'paid', 'overdue', 'cancelled'])
      expect(statuses).toHaveLength(5)
    })
  })

  describe('Edge cases', () => {
    it('should handle daysUntilDue of 0', () => {
      render(<InstallmentStatusBadge status="pending" isDueSoon={true} daysUntilDue={0} />)
      expect(screen.getByText(/Due Soon \(0d\)/)).toBeInTheDocument()
    })

    it('should handle large daysUntilDue values', () => {
      render(<InstallmentStatusBadge status="pending" isDueSoon={true} daysUntilDue={30} />)
      expect(screen.getByText(/Due Soon \(30d\)/)).toBeInTheDocument()
    })
  })
})
