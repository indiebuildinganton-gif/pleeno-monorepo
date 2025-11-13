/**
 * LoginForm Component Tests
 *
 * Tests for the login form component
 */

import { describe, it, expect, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { LoginForm } from '../login-form'

describe('LoginForm', () => {
  it('should render login form', () => {
    render(<LoginForm onSubmit={vi.fn()} />)

    expect(screen.getByLabelText(/email/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument()
  })

  it('should render optional elements when provided', () => {
    const onForgotPassword = vi.fn()
    const onSignUp = vi.fn()

    render(
      <LoginForm
        onSubmit={vi.fn()}
        onForgotPassword={onForgotPassword}
        onSignUp={onSignUp}
      />
    )

    expect(screen.getByText(/forgot password/i)).toBeInTheDocument()
    expect(screen.getByText(/sign up/i)).toBeInTheDocument()
  })

  it('should validate email format', async () => {
    const user = userEvent.setup()
    render(<LoginForm onSubmit={vi.fn()} />)

    const emailInput = screen.getByLabelText(/email/i)
    await user.type(emailInput, 'invalid-email')

    const submitButton = screen.getByRole('button', { name: /sign in/i })
    await user.click(submitButton)

    await waitFor(() => {
      expect(screen.getByText(/invalid email/i)).toBeInTheDocument()
    })
  })

  it('should require password', async () => {
    const user = userEvent.setup()
    render(<LoginForm onSubmit={vi.fn()} />)

    const emailInput = screen.getByLabelText(/email/i)
    await user.type(emailInput, 'test@example.com')

    const submitButton = screen.getByRole('button', { name: /sign in/i })
    await user.click(submitButton)

    await waitFor(() => {
      expect(screen.getByText(/password is required/i)).toBeInTheDocument()
    })
  })

  it('should call onSubmit with form data', async () => {
    const user = userEvent.setup()
    const onSubmit = vi.fn().mockResolvedValue(undefined)

    render(<LoginForm onSubmit={onSubmit} />)

    await user.type(screen.getByLabelText(/email/i), 'test@example.com')
    await user.type(screen.getByLabelText(/password/i), 'Password123!')
    await user.click(screen.getByRole('button', { name: /sign in/i }))

    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledWith({
        email: 'test@example.com',
        password: 'Password123!',
      })
    })
  })

  it('should show loading state during submission', async () => {
    const user = userEvent.setup()
    const onSubmit = vi.fn(() => new Promise(() => {})) // Never resolves

    render(<LoginForm onSubmit={onSubmit} />)

    await user.type(screen.getByLabelText(/email/i), 'test@example.com')
    await user.type(screen.getByLabelText(/password/i), 'Password123!')
    await user.click(screen.getByRole('button', { name: /sign in/i }))

    await waitFor(() => {
      expect(screen.getByText(/signing in/i)).toBeInTheDocument()
    })

    // Button should be disabled during loading
    expect(screen.getByRole('button', { name: /signing in/i })).toBeDisabled()
  })

  it('should disable inputs during submission', async () => {
    const user = userEvent.setup()
    const onSubmit = vi.fn(() => new Promise(() => {}))

    render(<LoginForm onSubmit={onSubmit} />)

    await user.type(screen.getByLabelText(/email/i), 'test@example.com')
    await user.type(screen.getByLabelText(/password/i), 'Password123!')
    await user.click(screen.getByRole('button', { name: /sign in/i }))

    await waitFor(() => {
      expect(screen.getByLabelText(/email/i)).toBeDisabled()
      expect(screen.getByLabelText(/password/i)).toBeDisabled()
    })
  })

  it('should display error message on submission failure', async () => {
    const user = userEvent.setup()
    const onSubmit = vi.fn().mockRejectedValue(new Error('Invalid credentials'))

    render(<LoginForm onSubmit={onSubmit} />)

    await user.type(screen.getByLabelText(/email/i), 'test@example.com')
    await user.type(screen.getByLabelText(/password/i), 'WrongPassword')
    await user.click(screen.getByRole('button', { name: /sign in/i }))

    await waitFor(() => {
      expect(screen.getByText(/invalid credentials/i)).toBeInTheDocument()
    })

    // Form should be re-enabled after error
    expect(screen.getByLabelText(/email/i)).not.toBeDisabled()
    expect(screen.getByLabelText(/password/i)).not.toBeDisabled()
  })

  it('should call onForgotPassword when forgot password link is clicked', async () => {
    const user = userEvent.setup()
    const onForgotPassword = vi.fn()

    render(<LoginForm onSubmit={vi.fn()} onForgotPassword={onForgotPassword} />)

    await user.click(screen.getByText(/forgot password/i))

    expect(onForgotPassword).toHaveBeenCalled()
  })

  it('should call onSignUp when sign up link is clicked', async () => {
    const user = userEvent.setup()
    const onSignUp = vi.fn()

    render(<LoginForm onSubmit={vi.fn()} onSignUp={onSignUp} />)

    await user.click(screen.getByText(/sign up/i))

    expect(onSignUp).toHaveBeenCalled()
  })

  it('should clear error on successful submission', async () => {
    const user = userEvent.setup()
    const onSubmit = vi
      .fn()
      .mockRejectedValueOnce(new Error('Error'))
      .mockResolvedValueOnce(undefined)

    render(<LoginForm onSubmit={onSubmit} />)

    // First submission - error
    await user.type(screen.getByLabelText(/email/i), 'test@example.com')
    await user.type(screen.getByLabelText(/password/i), 'Password123!')
    await user.click(screen.getByRole('button', { name: /sign in/i }))

    await waitFor(() => {
      expect(screen.getByText(/error/i)).toBeInTheDocument()
    })

    // Second submission - success
    await user.click(screen.getByRole('button', { name: /sign in/i }))

    await waitFor(() => {
      expect(screen.queryByText(/error/i)).not.toBeInTheDocument()
    })
  })
})
