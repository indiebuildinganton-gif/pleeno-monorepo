/**
 * ConfirmStatusChangeDialog Component Tests
 *
 * Tests for the status change confirmation dialog
 * Epic 2: Agency Configuration & User Management
 * Story 2.3: User Management Interface
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ConfirmStatusChangeDialog } from '../ConfirmStatusChangeDialog'

// Mock fetch
global.fetch = vi.fn()

// Mock toast
vi.mock('@pleeno/ui/hooks/use-toast', () => ({
  toast: vi.fn(),
}))

const createTestQueryClient = () =>
  new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  })

function renderWithQuery(ui: React.ReactElement) {
  const queryClient = createTestQueryClient()
  return render(<QueryClientProvider client={queryClient}>{ui}</QueryClientProvider>)
}

describe('ConfirmStatusChangeDialog', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  const mockUser = {
    id: 'user-123',
    full_name: 'Test User',
    status: 'active' as const,
  }

  const mockOnOpenChange = vi.fn()

  it('should render dialog when open', () => {
    renderWithQuery(
      <ConfirmStatusChangeDialog
        open={true}
        onOpenChange={mockOnOpenChange}
        user={mockUser}
        newStatus="inactive"
      />
    )

    expect(screen.getByText('Deactivate User')).toBeInTheDocument()
  })

  it('should not render dialog when closed', () => {
    renderWithQuery(
      <ConfirmStatusChangeDialog
        open={false}
        onOpenChange={mockOnOpenChange}
        user={mockUser}
        newStatus="inactive"
      />
    )

    expect(screen.queryByText('Deactivate User')).not.toBeInTheDocument()
  })

  it('should show deactivation warning for deactivating user', () => {
    renderWithQuery(
      <ConfirmStatusChangeDialog
        open={true}
        onOpenChange={mockOnOpenChange}
        user={mockUser}
        newStatus="inactive"
      />
    )

    expect(screen.getByText('This user will no longer be able to log in')).toBeInTheDocument()
    expect(
      screen.getByText(/They will be immediately signed out from all devices/i)
    ).toBeInTheDocument()
  })

  it('should show activation message for reactivating user', () => {
    const inactiveUser = {
      ...mockUser,
      status: 'inactive' as const,
    }

    renderWithQuery(
      <ConfirmStatusChangeDialog
        open={true}
        onOpenChange={mockOnOpenChange}
        user={inactiveUser}
        newStatus="active"
      />
    )

    expect(screen.getByText('Reactivate User')).toBeInTheDocument()
    expect(
      screen.getByText(/This user will regain access to the system/i)
    ).toBeInTheDocument()
  })

  it('should render Deactivate User button for deactivation', () => {
    renderWithQuery(
      <ConfirmStatusChangeDialog
        open={true}
        onOpenChange={mockOnOpenChange}
        user={mockUser}
        newStatus="inactive"
      />
    )

    expect(screen.getByRole('button', { name: 'Deactivate User' })).toBeInTheDocument()
  })

  it('should render Reactivate User button for activation', () => {
    const inactiveUser = {
      ...mockUser,
      status: 'inactive' as const,
    }

    renderWithQuery(
      <ConfirmStatusChangeDialog
        open={true}
        onOpenChange={mockOnOpenChange}
        user={inactiveUser}
        newStatus="active"
      />
    )

    expect(screen.getByRole('button', { name: 'Reactivate User' })).toBeInTheDocument()
  })

  it('should render Cancel button', () => {
    renderWithQuery(
      <ConfirmStatusChangeDialog
        open={true}
        onOpenChange={mockOnOpenChange}
        user={mockUser}
        newStatus="inactive"
      />
    )

    expect(screen.getByRole('button', { name: 'Cancel' })).toBeInTheDocument()
  })

  it('should close dialog when Cancel is clicked', async () => {
    const user = userEvent.setup()
    renderWithQuery(
      <ConfirmStatusChangeDialog
        open={true}
        onOpenChange={mockOnOpenChange}
        user={mockUser}
        newStatus="inactive"
      />
    )

    const cancelButton = screen.getByRole('button', { name: 'Cancel' })
    await user.click(cancelButton)

    expect(mockOnOpenChange).toHaveBeenCalledWith(false)
  })

  it('should call API when confirm is clicked', async () => {
    const user = userEvent.setup()
    ;(global.fetch as any).mockResolvedValueOnce({
      json: async () => ({ success: true, data: { ...mockUser, status: 'inactive' } }),
    })

    renderWithQuery(
      <ConfirmStatusChangeDialog
        open={true}
        onOpenChange={mockOnOpenChange}
        user={mockUser}
        newStatus="inactive"
      />
    )

    const confirmButton = screen.getByRole('button', { name: 'Deactivate User' })
    await user.click(confirmButton)

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith('/api/users/user-123/status', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'inactive' }),
      })
    })
  })

  it('should show loading state during submission', async () => {
    const user = userEvent.setup()
    ;(global.fetch as any).mockImplementationOnce(
      () => new Promise((resolve) => setTimeout(resolve, 100))
    )

    renderWithQuery(
      <ConfirmStatusChangeDialog
        open={true}
        onOpenChange={mockOnOpenChange}
        user={mockUser}
        newStatus="inactive"
      />
    )

    const confirmButton = screen.getByRole('button', { name: 'Deactivate User' })
    await user.click(confirmButton)

    await waitFor(() => {
      expect(screen.getByText('Deactivating...')).toBeInTheDocument()
    })
  })

  it('should disable buttons during submission', async () => {
    const user = userEvent.setup()
    ;(global.fetch as any).mockImplementationOnce(
      () => new Promise((resolve) => setTimeout(resolve, 100))
    )

    renderWithQuery(
      <ConfirmStatusChangeDialog
        open={true}
        onOpenChange={mockOnOpenChange}
        user={mockUser}
        newStatus="inactive"
      />
    )

    const confirmButton = screen.getByRole('button', { name: 'Deactivate User' })
    await user.click(confirmButton)

    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Deactivating...' })).toBeDisabled()
      expect(screen.getByRole('button', { name: 'Cancel' })).toBeDisabled()
    })
  })

  it('should close dialog on successful submission', async () => {
    const user = userEvent.setup()
    ;(global.fetch as any).mockResolvedValueOnce({
      json: async () => ({ success: true, data: { ...mockUser, status: 'inactive' } }),
    })

    renderWithQuery(
      <ConfirmStatusChangeDialog
        open={true}
        onOpenChange={mockOnOpenChange}
        user={mockUser}
        newStatus="inactive"
      />
    )

    const confirmButton = screen.getByRole('button', { name: 'Deactivate User' })
    await user.click(confirmButton)

    await waitFor(() => {
      expect(mockOnOpenChange).toHaveBeenCalledWith(false)
    })
  })

  it('should display user name in description', () => {
    renderWithQuery(
      <ConfirmStatusChangeDialog
        open={true}
        onOpenChange={mockOnOpenChange}
        user={mockUser}
        newStatus="inactive"
      />
    )

    expect(screen.getByText(/You are about to deactivate Test User/i)).toBeInTheDocument()
  })
})
