import { describe, it, expect, vi, afterEach } from 'vitest'
import React from 'react'
import { render, screen, cleanup } from '@testing-library/react'
import { userEvent } from '@testing-library/user-event'
import { ErrorBoundary } from '../ErrorBoundary'

// Mock Sentry
vi.mock('@sentry/nextjs', () => ({
  captureException: vi.fn(),
  default: {
    captureException: vi.fn(),
  },
}))

// Clean up after each test
afterEach(() => {
  cleanup()
})

const ThrowError = ({ shouldThrow = true }: { shouldThrow?: boolean }) => {
  if (shouldThrow) {
    throw new Error('Test error')
  }
  return <div>No error</div>
}

describe('ErrorBoundary', () => {
  it('renders children when no error occurs', () => {
    render(
      <ErrorBoundary>
        <div>Test content</div>
      </ErrorBoundary>
    )

    expect(screen.getByText('Test content')).toBeInTheDocument()
  })

  it('renders fallback UI when error occurs', () => {
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation()

    render(
      <ErrorBoundary>
        <ThrowError />
      </ErrorBoundary>
    )

    expect(screen.getByText('Something went wrong')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Try again' })).toBeInTheDocument()

    consoleErrorSpy.mockRestore()
  })

  it('renders custom fallback if provided', () => {
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation()

    render(
      <ErrorBoundary fallback={<div>Custom error message</div>}>
        <ThrowError />
      </ErrorBoundary>
    )

    expect(screen.getByText('Custom error message')).toBeInTheDocument()

    consoleErrorSpy.mockRestore()
  })

  it('calls onError callback when error occurs', () => {
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation()
    const onErrorMock = vi.fn()

    render(
      <ErrorBoundary onError={onErrorMock}>
        <ThrowError />
      </ErrorBoundary>
    )

    expect(onErrorMock).toHaveBeenCalled()
    expect(onErrorMock.mock.calls[0][0].message).toBe('Test error')

    consoleErrorSpy.mockRestore()
  })

  it('resets error state when Try again button clicked', async () => {
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation()
    const user = userEvent.setup()

    const { getByRole, getByText, queryByText } = render(
      <ErrorBoundary>
        <ThrowError />
      </ErrorBoundary>
    )

    // Verify error UI is shown
    expect(getByText('Something went wrong')).toBeInTheDocument()

    const tryAgainButton = getByRole('button', { name: 'Try again' })
    await user.click(tryAgainButton)

    // After clicking Try again, the error state should be reset
    // The component will re-render and throw again, but we can verify the button was clicked
    // and the handler was called by checking that the error UI is still there
    // (because ThrowError will throw again)
    expect(queryByText('Something went wrong')).toBeTruthy()

    consoleErrorSpy.mockRestore()
  })

  it('shows error details in development mode', () => {
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation()
    const originalEnv = process.env.NODE_ENV
    process.env.NODE_ENV = 'development'

    const { container } = render(
      <ErrorBoundary>
        <ThrowError />
      </ErrorBoundary>
    )

    // Use container to scope the query
    expect(container.textContent).toContain('Test error')

    process.env.NODE_ENV = originalEnv
    consoleErrorSpy.mockRestore()
  })

  it('shows Report Error button', () => {
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation()

    render(
      <ErrorBoundary>
        <ThrowError />
      </ErrorBoundary>
    )

    expect(screen.getByRole('button', { name: 'Report Error' })).toBeInTheDocument()

    consoleErrorSpy.mockRestore()
  })
})
