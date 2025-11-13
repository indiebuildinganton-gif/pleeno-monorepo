/**
 * SignupForm Component Tests
 *
 * Tests for the signup form component
 */

import { describe, it, expect, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { SignupForm } from '../signup-form'

describe('SignupForm', () => {
  it('should render signup form with all fields', () => {
    render(<SignupForm onSubmit={vi.fn()} />)

    expect(screen.getByLabelText(/full name/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/agency name/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/^email$/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/^password$/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/confirm password/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /sign up/i })).toBeInTheDocument()
  })

  it('should render sign in link when onSignIn provided', () => {
    const onSignIn = vi.fn()
    render(<SignupForm onSubmit={vi.fn()} onSignIn={onSignIn} />)

    expect(screen.getByText(/sign in/i)).toBeInTheDocument()
  })

  it('should validate email format', async () => {
    const user = userEvent.setup()
    render(<SignupForm onSubmit={vi.fn()} />)

    await user.type(screen.getByLabelText(/full name/i), 'Test User')
    await user.type(screen.getByLabelText(/agency name/i), 'Test Agency')
    await user.type(screen.getByLabelText(/^email$/i), 'invalid-email')
    await user.type(screen.getByLabelText(/^password$/i), 'Password123!')
    await user.type(screen.getByLabelText(/confirm password/i), 'Password123!')

    await user.click(screen.getByRole('button', { name: /sign up/i }))

    await waitFor(() => {
      expect(screen.getByText(/invalid email/i)).toBeInTheDocument()
    })
  })

  it('should require all fields', async () => {
    const user = userEvent.setup()
    render(<SignupForm onSubmit={vi.fn()} />)

    await user.click(screen.getByRole('button', { name: /sign up/i }))

    await waitFor(() => {
      expect(screen.getByText(/full name is required/i)).toBeInTheDocument()
      expect(screen.getByText(/agency name is required/i)).toBeInTheDocument()
    })
  })

  it('should validate password requirements', async () => {
    const user = userEvent.setup()
    render(<SignupForm onSubmit={vi.fn()} />)

    await user.type(screen.getByLabelText(/full name/i), 'Test User')
    await user.type(screen.getByLabelText(/agency name/i), 'Test Agency')
    await user.type(screen.getByLabelText(/^email$/i), 'test@example.com')
    await user.type(screen.getByLabelText(/^password$/i), 'weak')
    await user.type(screen.getByLabelText(/confirm password/i), 'weak')

    await user.click(screen.getByRole('button', { name: /sign up/i }))

    await waitFor(() => {
      expect(screen.getByText(/must be at least 8 characters/i)).toBeInTheDocument()
    })
  })

  it('should require uppercase letter in password', async () => {
    const user = userEvent.setup()
    render(<SignupForm onSubmit={vi.fn()} />)

    await user.type(screen.getByLabelText(/^password$/i), 'password123')
    await user.click(screen.getByRole('button', { name: /sign up/i }))

    await waitFor(() => {
      expect(screen.getByText(/must contain at least one uppercase letter/i)).toBeInTheDocument()
    })
  })

  it('should require lowercase letter in password', async () => {
    const user = userEvent.setup()
    render(<SignupForm onSubmit={vi.fn()} />)

    await user.type(screen.getByLabelText(/^password$/i), 'PASSWORD123')
    await user.click(screen.getByRole('button', { name: /sign up/i }))

    await waitFor(() => {
      expect(screen.getByText(/must contain at least one lowercase letter/i)).toBeInTheDocument()
    })
  })

  it('should require number in password', async () => {
    const user = userEvent.setup()
    render(<SignupForm onSubmit={vi.fn()} />)

    await user.type(screen.getByLabelText(/^password$/i), 'PasswordABC')
    await user.click(screen.getByRole('button', { name: /sign up/i }))

    await waitFor(() => {
      expect(screen.getByText(/must contain at least one number/i)).toBeInTheDocument()
    })
  })

  it('should validate password confirmation match', async () => {
    const user = userEvent.setup()
    render(<SignupForm onSubmit={vi.fn()} />)

    await user.type(screen.getByLabelText(/full name/i), 'Test User')
    await user.type(screen.getByLabelText(/agency name/i), 'Test Agency')
    await user.type(screen.getByLabelText(/^email$/i), 'test@example.com')
    await user.type(screen.getByLabelText(/^password$/i), 'Password123!')
    await user.type(screen.getByLabelText(/confirm password/i), 'DifferentPassword123!')

    await user.click(screen.getByRole('button', { name: /sign up/i }))

    await waitFor(() => {
      expect(screen.getByText(/passwords don't match/i)).toBeInTheDocument()
    })
  })

  it('should call onSubmit with form data (excluding confirmPassword)', async () => {
    const user = userEvent.setup()
    const onSubmit = vi.fn().mockResolvedValue(undefined)

    render(<SignupForm onSubmit={onSubmit} />)

    await user.type(screen.getByLabelText(/full name/i), 'Test User')
    await user.type(screen.getByLabelText(/agency name/i), 'Test Agency')
    await user.type(screen.getByLabelText(/^email$/i), 'test@example.com')
    await user.type(screen.getByLabelText(/^password$/i), 'Password123!')
    await user.type(screen.getByLabelText(/confirm password/i), 'Password123!')

    await user.click(screen.getByRole('button', { name: /sign up/i }))

    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledWith({
        full_name: 'Test User',
        agency_name: 'Test Agency',
        email: 'test@example.com',
        password: 'Password123!',
      })
    })

    // Ensure confirmPassword is not included
    expect(onSubmit).not.toHaveBeenCalledWith(
      expect.objectContaining({ confirmPassword: expect.anything() })
    )
  })

  it('should show loading state during submission', async () => {
    const user = userEvent.setup()
    const onSubmit = vi.fn(() => new Promise(() => {})) // Never resolves

    render(<SignupForm onSubmit={onSubmit} />)

    await user.type(screen.getByLabelText(/full name/i), 'Test User')
    await user.type(screen.getByLabelText(/agency name/i), 'Test Agency')
    await user.type(screen.getByLabelText(/^email$/i), 'test@example.com')
    await user.type(screen.getByLabelText(/^password$/i), 'Password123!')
    await user.type(screen.getByLabelText(/confirm password/i), 'Password123!')

    await user.click(screen.getByRole('button', { name: /sign up/i }))

    await waitFor(() => {
      expect(screen.getByText(/creating account/i)).toBeInTheDocument()
    })

    // Button should be disabled
    expect(screen.getByRole('button', { name: /creating account/i })).toBeDisabled()
  })

  it('should disable inputs during submission', async () => {
    const user = userEvent.setup()
    const onSubmit = vi.fn(() => new Promise(() => {}))

    render(<SignupForm onSubmit={onSubmit} />)

    await user.type(screen.getByLabelText(/full name/i), 'Test User')
    await user.type(screen.getByLabelText(/agency name/i), 'Test Agency')
    await user.type(screen.getByLabelText(/^email$/i), 'test@example.com')
    await user.type(screen.getByLabelText(/^password$/i), 'Password123!')
    await user.type(screen.getByLabelText(/confirm password/i), 'Password123!')

    await user.click(screen.getByRole('button', { name: /sign up/i }))

    await waitFor(() => {
      expect(screen.getByLabelText(/full name/i)).toBeDisabled()
      expect(screen.getByLabelText(/agency name/i)).toBeDisabled()
      expect(screen.getByLabelText(/^email$/i)).toBeDisabled()
      expect(screen.getByLabelText(/^password$/i)).toBeDisabled()
      expect(screen.getByLabelText(/confirm password/i)).toBeDisabled()
    })
  })

  it('should display error message on submission failure', async () => {
    const user = userEvent.setup()
    const onSubmit = vi.fn().mockRejectedValue(new Error('Email already exists'))

    render(<SignupForm onSubmit={onSubmit} />)

    await user.type(screen.getByLabelText(/full name/i), 'Test User')
    await user.type(screen.getByLabelText(/agency name/i), 'Test Agency')
    await user.type(screen.getByLabelText(/^email$/i), 'test@example.com')
    await user.type(screen.getByLabelText(/^password$/i), 'Password123!')
    await user.type(screen.getByLabelText(/confirm password/i), 'Password123!')

    await user.click(screen.getByRole('button', { name: /sign up/i }))

    await waitFor(() => {
      expect(screen.getByText(/email already exists/i)).toBeInTheDocument()
    })

    // Form should be re-enabled
    expect(screen.getByLabelText(/full name/i)).not.toBeDisabled()
  })

  it('should call onSignIn when sign in link is clicked', async () => {
    const user = userEvent.setup()
    const onSignIn = vi.fn()

    render(<SignupForm onSubmit={vi.fn()} onSignIn={onSignIn} />)

    await user.click(screen.getByText(/sign in/i))

    expect(onSignIn).toHaveBeenCalled()
  })

  it('should display password requirements hint', () => {
    render(<SignupForm onSubmit={vi.fn()} />)

    expect(
      screen.getByText(/must be 8\+ characters with uppercase, lowercase, and number/i)
    ).toBeInTheDocument()
  })
})
