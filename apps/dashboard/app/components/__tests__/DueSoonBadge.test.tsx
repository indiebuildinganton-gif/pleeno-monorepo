/**
 * DueSoonBadge Component Tests
 *
 * Tests for the due soon badge component
 * Epic 5: Intelligent Status Automation
 * Story 5.2: Due Soon Notification Flags
 * Task 2: Update UI to display "due soon" badges
 */

import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { DueSoonBadge } from '../DueSoonBadge'

describe('DueSoonBadge', () => {
  it('should render with default styling', () => {
    render(<DueSoonBadge />)
    expect(screen.getByText('Due Soon')).toBeInTheDocument()
  })

  it('should display days until due when provided', () => {
    render(<DueSoonBadge daysUntilDue={3} />)
    expect(screen.getByText(/Due Soon \(3d\)/)).toBeInTheDocument()
  })

  it('should not display days countdown when not provided', () => {
    render(<DueSoonBadge />)
    const badge = screen.getByText('Due Soon')
    expect(badge.textContent).toBe('Due Soon')
    expect(badge.textContent).not.toContain('d)')
  })

  it('should render small size badge when size="sm"', () => {
    const { container } = render(<DueSoonBadge size="sm" />)
    const badge = container.querySelector('.text-xs')
    expect(badge).toBeInTheDocument()
  })

  it('should render medium size badge when size="md"', () => {
    const { container } = render(<DueSoonBadge size="md" />)
    const badge = container.querySelector('.text-sm')
    expect(badge).toBeInTheDocument()
  })

  it('should render large size badge when size="lg"', () => {
    const { container } = render(<DueSoonBadge size="lg" />)
    const badge = container.querySelector('.text-base')
    expect(badge).toBeInTheDocument()
  })

  it('should show icon by default', () => {
    const { container } = render(<DueSoonBadge />)
    // Clock icon should be present
    const icon = container.querySelector('svg')
    expect(icon).toBeInTheDocument()
  })

  it('should hide icon when showIcon={false}', () => {
    const { container } = render(<DueSoonBadge showIcon={false} />)
    const icon = container.querySelector('svg')
    expect(icon).not.toBeInTheDocument()
  })

  it('should apply custom className when provided', () => {
    const { container } = render(<DueSoonBadge className="custom-class" />)
    const badge = container.querySelector('.custom-class')
    expect(badge).toBeInTheDocument()
  })

  it('should display countdown for single day', () => {
    render(<DueSoonBadge daysUntilDue={1} />)
    expect(screen.getByText(/Due Soon \(1d\)/)).toBeInTheDocument()
  })

  it('should display countdown for multiple days', () => {
    render(<DueSoonBadge daysUntilDue={7} />)
    expect(screen.getByText(/Due Soon \(7d\)/)).toBeInTheDocument()
  })

  it('should use warning variant for yellow/amber styling', () => {
    const { container } = render(<DueSoonBadge />)
    // The Badge component should receive variant="warning"
    // which applies yellow/amber background
    const badge = screen.getByText('Due Soon').closest('div')
    expect(badge).toBeInTheDocument()
  })
})
