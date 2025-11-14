/**
 * ActivityCard Component Tests
 *
 * Tests for the activity card component
 * Epic 6: Agency Dashboard
 * Story 6.4: Recent Activity Feed
 * Task 4: Create ActivityFeed Component
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
})
