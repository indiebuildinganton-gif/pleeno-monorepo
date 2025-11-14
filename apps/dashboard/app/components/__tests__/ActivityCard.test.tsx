/**
 * ActivityCard Component Tests
 *
 * Tests for the activity card component
 * Epic 6: Agency Dashboard
 * Story 6.4: Recent Activity Feed
 * Task 4: Create ActivityFeed Component
 * Task 6: Make Activities Clickable
 */

import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { ActivityCard } from '../ActivityCard'

describe('ActivityCard', () => {
  it('should render activity with user', () => {
    const activity = {
      id: '1',
      timestamp: new Date().toISOString(),
      description: 'Test created student John Doe',
      user: { id: 'user-1', name: 'Test User', email: 'test@example.com' },
      entity_type: 'student',
      entity_id: 'student-1',
      action: 'created',
      metadata: {},
    }

    render(<ActivityCard activity={activity} />)

    expect(screen.getByText('Test created student John Doe')).toBeInTheDocument()
    expect(screen.getByText(/Test User/)).toBeInTheDocument()
    expect(screen.getByText('👤')).toBeInTheDocument() // Student icon
  })

  it('should render "System" for null user', () => {
    const activity = {
      id: '1',
      timestamp: new Date().toISOString(),
      description: 'System marked installment as overdue',
      user: null,
      entity_type: 'installment',
      entity_id: 'installment-1',
      action: 'marked_overdue',
      metadata: {},
    }

    render(<ActivityCard activity={activity} />)

    expect(screen.getByText(/System/)).toBeInTheDocument()
    expect(screen.getByText('⚠️')).toBeInTheDocument() // Installment icon
  })

  it('should show relative timestamp', () => {
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString()
    const activity = {
      id: '1',
      timestamp: oneHourAgo,
      description: 'Test activity',
      user: { id: 'user-1', name: 'Test User', email: 'test@example.com' },
      entity_type: 'student',
      entity_id: 'student-1',
      action: 'created',
      metadata: {},
    }

    render(<ActivityCard activity={activity} />)

    expect(screen.getByText(/about 1 hour ago/i)).toBeInTheDocument()
  })

  it('should display correct icon for payment entity type', () => {
    const activity = {
      id: '1',
      timestamp: new Date().toISOString(),
      description: 'Created payment for student',
      user: { id: 'user-1', name: 'Test User', email: 'test@example.com' },
      entity_type: 'payment',
      entity_id: 'payment-1',
      action: 'created',
      metadata: {},
    }

    render(<ActivityCard activity={activity} />)

    expect(screen.getByText('💰')).toBeInTheDocument() // Payment icon
  })

  it('should display correct icon for payment_plan entity type', () => {
    const activity = {
      id: '1',
      timestamp: new Date().toISOString(),
      description: 'Created payment plan',
      user: { id: 'user-1', name: 'Test User', email: 'test@example.com' },
      entity_type: 'payment_plan',
      entity_id: 'plan-1',
      action: 'created',
      metadata: {},
    }

    render(<ActivityCard activity={activity} />)

    expect(screen.getByText('📋')).toBeInTheDocument() // Payment plan icon
  })

  it('should display correct icon for enrollment entity type', () => {
    const activity = {
      id: '1',
      timestamp: new Date().toISOString(),
      description: 'Student enrolled in school',
      user: { id: 'user-1', name: 'Test User', email: 'test@example.com' },
      entity_type: 'enrollment',
      entity_id: 'enrollment-1',
      action: 'created',
      metadata: {},
    }

    render(<ActivityCard activity={activity} />)

    expect(screen.getByText('🏫')).toBeInTheDocument() // Enrollment icon
  })

  it('should display default icon for unknown entity type', () => {
    const activity = {
      id: '1',
      timestamp: new Date().toISOString(),
      description: 'Unknown entity activity',
      user: { id: 'user-1', name: 'Test User', email: 'test@example.com' },
      entity_type: 'unknown_type',
      entity_id: 'unknown-1',
      action: 'created',
      metadata: {},
    }

    render(<ActivityCard activity={activity} />)

    expect(screen.getByText('📝')).toBeInTheDocument() // Default icon
  })

  it('should display relative timestamp for activities from yesterday', () => {
    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
    const activity = {
      id: '1',
      timestamp: yesterday,
      description: 'Test activity',
      user: { id: 'user-1', name: 'Test User', email: 'test@example.com' },
      entity_type: 'student',
      entity_id: 'student-1',
      action: 'created',
      metadata: {},
    }

    render(<ActivityCard activity={activity} />)

    expect(screen.getByText(/1 day ago/i)).toBeInTheDocument()
  })

  it('should display relative timestamp for recent activities', () => {
    const twoMinutesAgo = new Date(Date.now() - 2 * 60 * 1000).toISOString()
    const activity = {
      id: '1',
      timestamp: twoMinutesAgo,
      description: 'Test activity',
      user: { id: 'user-1', name: 'Test User', email: 'test@example.com' },
      entity_type: 'student',
      entity_id: 'student-1',
      action: 'created',
      metadata: {},
    }

    render(<ActivityCard activity={activity} />)

    expect(screen.getByText(/2 minutes ago/i)).toBeInTheDocument()
  })

  // Navigation Tests (Task 6)
  describe('Navigation', () => {
    it('should navigate to payment plan page for payment activity', () => {
      const activity = {
        id: '1',
        timestamp: new Date().toISOString(),
        description: 'Recorded payment',
        user: { id: 'user-1', name: 'Test User', email: 'test@example.com' },
        entity_type: 'payment',
        entity_id: 'payment-123',
        action: 'recorded',
        metadata: { payment_plan_id: 'plan-456' },
      }

      render(<ActivityCard activity={activity} />)

      const link = screen.getByRole('link')
      expect(link).toHaveAttribute('href', '/payments/plans/plan-456')
    })

    it('should navigate to payment plan page for payment_plan activity', () => {
      const activity = {
        id: '1',
        timestamp: new Date().toISOString(),
        description: 'Created payment plan',
        user: { id: 'user-1', name: 'Test User', email: 'test@example.com' },
        entity_type: 'payment_plan',
        entity_id: 'plan-789',
        action: 'created',
        metadata: {},
      }

      render(<ActivityCard activity={activity} />)

      const link = screen.getByRole('link')
      expect(link).toHaveAttribute('href', '/payments/plans/plan-789')
    })

    it('should navigate to student page for student activity', () => {
      const activity = {
        id: '1',
        timestamp: new Date().toISOString(),
        description: 'Added student',
        user: { id: 'user-1', name: 'Test User', email: 'test@example.com' },
        entity_type: 'student',
        entity_id: 'student-101',
        action: 'created',
        metadata: {},
      }

      render(<ActivityCard activity={activity} />)

      const link = screen.getByRole('link')
      expect(link).toHaveAttribute('href', '/entities/students/student-101')
    })

    it('should navigate to student page with enrollments tab for enrollment activity', () => {
      const activity = {
        id: '1',
        timestamp: new Date().toISOString(),
        description: 'Student enrolled',
        user: { id: 'user-1', name: 'Test User', email: 'test@example.com' },
        entity_type: 'enrollment',
        entity_id: 'enrollment-202',
        action: 'created',
        metadata: { student_id: 'student-303' },
      }

      render(<ActivityCard activity={activity} />)

      const link = screen.getByRole('link')
      expect(link).toHaveAttribute('href', '/entities/students/student-303?tab=enrollments')
    })

    it('should navigate to payment plan page for installment activity', () => {
      const activity = {
        id: '1',
        timestamp: new Date().toISOString(),
        description: 'Installment overdue',
        user: null,
        entity_type: 'installment',
        entity_id: 'installment-404',
        action: 'marked_overdue',
        metadata: { payment_plan_id: 'plan-505' },
      }

      render(<ActivityCard activity={activity} />)

      const link = screen.getByRole('link')
      expect(link).toHaveAttribute('href', '/payments/plans/plan-505')
    })

    it('should fallback to dashboard when payment activity is missing payment_plan_id', () => {
      const activity = {
        id: '1',
        timestamp: new Date().toISOString(),
        description: 'Recorded payment',
        user: { id: 'user-1', name: 'Test User', email: 'test@example.com' },
        entity_type: 'payment',
        entity_id: 'payment-606',
        action: 'recorded',
        metadata: {}, // Missing payment_plan_id
      }

      render(<ActivityCard activity={activity} />)

      const link = screen.getByRole('link')
      expect(link).toHaveAttribute('href', '/dashboard')
    })

    it('should fallback to dashboard when enrollment activity is missing student_id', () => {
      const activity = {
        id: '1',
        timestamp: new Date().toISOString(),
        description: 'Student enrolled',
        user: { id: 'user-1', name: 'Test User', email: 'test@example.com' },
        entity_type: 'enrollment',
        entity_id: 'enrollment-707',
        action: 'created',
        metadata: {}, // Missing student_id
      }

      render(<ActivityCard activity={activity} />)

      const link = screen.getByRole('link')
      expect(link).toHaveAttribute('href', '/dashboard')
    })

    it('should fallback to dashboard for unknown entity types', () => {
      const activity = {
        id: '1',
        timestamp: new Date().toISOString(),
        description: 'Unknown activity',
        user: { id: 'user-1', name: 'Test User', email: 'test@example.com' },
        entity_type: 'unknown_type',
        entity_id: 'unknown-808',
        action: 'unknown',
        metadata: {},
      }

      render(<ActivityCard activity={activity} />)

      const link = screen.getByRole('link')
      expect(link).toHaveAttribute('href', '/dashboard')
    })

    it('should have tooltip indicating clickability', () => {
      const activity = {
        id: '1',
        timestamp: new Date().toISOString(),
        description: 'Test activity',
        user: { id: 'user-1', name: 'Test User', email: 'test@example.com' },
        entity_type: 'student',
        entity_id: 'student-909',
        action: 'created',
        metadata: {},
      }

      render(<ActivityCard activity={activity} />)

      const link = screen.getByRole('link')
      expect(link).toHaveAttribute('title', 'Click to view details')
    })
  })
})
