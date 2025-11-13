/**
 * UserTable Component Tests
 *
 * Tests for the user table component
 * Epic 2: Agency Configuration & User Management
 * Story 2.3: User Management Interface
 */

import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { UserTable } from '../UserTable'

// Create a new QueryClient for each test to avoid state leakage
const createTestQueryClient = () =>
  new QueryClient({
    defaultOptions: {
      queries: { retry: false },
    },
  })

function renderWithQuery(ui: React.ReactElement) {
  const queryClient = createTestQueryClient()
  return render(<QueryClientProvider client={queryClient}>{ui}</QueryClientProvider>)
}

describe('UserTable', () => {
  const mockUsers = [
    {
      id: '1',
      email: 'admin@test.com',
      full_name: 'Admin User',
      role: 'agency_admin' as const,
      status: 'active' as const,
      agency_id: 'agency-1',
      created_at: '2024-01-01',
      updated_at: '2024-01-01',
      task_count: 5,
    },
    {
      id: '2',
      email: 'user@test.com',
      full_name: 'Regular User',
      role: 'agency_user' as const,
      status: 'inactive' as const,
      agency_id: 'agency-1',
      created_at: '2024-01-01',
      updated_at: '2024-01-01',
      task_count: 2,
    },
  ]

  it('should render user list with all columns', () => {
    renderWithQuery(<UserTable initialUsers={mockUsers} currentUserId="1" />)

    expect(screen.getByText('Admin User')).toBeInTheDocument()
    expect(screen.getByText('admin@test.com')).toBeInTheDocument()
    expect(screen.getByText('Admin')).toBeInTheDocument()
    expect(screen.getByText('Active')).toBeInTheDocument()

    expect(screen.getByText('Regular User')).toBeInTheDocument()
    expect(screen.getByText('user@test.com')).toBeInTheDocument()
    expect(screen.getByText('User')).toBeInTheDocument()
    expect(screen.getByText('Inactive')).toBeInTheDocument()
  })

  it('should display task counts correctly', () => {
    renderWithQuery(<UserTable initialUsers={mockUsers} currentUserId="1" />)

    // The actual implementation uses <TableCell> but we can search for text content
    expect(screen.getByText(/5 tasks/i)).toBeInTheDocument()
    expect(screen.getByText(/2 tasks/i)).toBeInTheDocument()
  })

  it('should show empty state when no users', () => {
    renderWithQuery(<UserTable initialUsers={[]} currentUserId="1" />)

    expect(screen.getByText('No users found')).toBeInTheDocument()
  })

  it('should display role badges with correct text', () => {
    renderWithQuery(<UserTable initialUsers={mockUsers} currentUserId="1" />)

    const adminBadge = screen.getByText('Admin')
    const userBadge = screen.getByText('User')

    expect(adminBadge).toBeInTheDocument()
    expect(userBadge).toBeInTheDocument()
  })

  it('should display status badges with correct text', () => {
    renderWithQuery(<UserTable initialUsers={mockUsers} currentUserId="1" />)

    const activeBadge = screen.getByText('Active')
    const inactiveBadge = screen.getByText('Inactive')

    expect(activeBadge).toBeInTheDocument()
    expect(inactiveBadge).toBeInTheDocument()
  })

  it('should render table headers', () => {
    renderWithQuery(<UserTable initialUsers={mockUsers} currentUserId="1" />)

    expect(screen.getByText('Name')).toBeInTheDocument()
    expect(screen.getByText('Email')).toBeInTheDocument()
    expect(screen.getByText('Role')).toBeInTheDocument()
    expect(screen.getByText('Status')).toBeInTheDocument()
    expect(screen.getByText('Assigned Tasks')).toBeInTheDocument()
    expect(screen.getByText('Actions')).toBeInTheDocument()
  })

  it('should render UserActionsMenu for each user', () => {
    renderWithQuery(<UserTable initialUsers={mockUsers} currentUserId="1" />)

    // The UserActionsMenu renders a button with MoreVertical icon
    // We can check for buttons with sr-only text "Open menu"
    const actionButtons = screen.getAllByText('Open menu')
    expect(actionButtons).toHaveLength(2)
  })

  it('should handle users without task count', () => {
    const usersWithoutTaskCount = [
      {
        id: '1',
        email: 'test@test.com',
        full_name: 'Test User',
        role: 'agency_user' as const,
        status: 'active' as const,
        agency_id: 'agency-1',
        created_at: '2024-01-01',
        updated_at: '2024-01-01',
        // no task_count field
      },
    ]

    renderWithQuery(<UserTable initialUsers={usersWithoutTaskCount} currentUserId="1" />)

    // Should default to 0 tasks
    expect(screen.getByText(/0 tasks/i)).toBeInTheDocument()
  })

  it('should handle singular task count', () => {
    const userWithOneTask = [
      {
        id: '1',
        email: 'test@test.com',
        full_name: 'Test User',
        role: 'agency_user' as const,
        status: 'active' as const,
        agency_id: 'agency-1',
        created_at: '2024-01-01',
        updated_at: '2024-01-01',
        task_count: 1,
      },
    ]

    renderWithQuery(<UserTable initialUsers={userWithOneTask} currentUserId="1" />)

    // Should show "1 task" (singular)
    expect(screen.getByText(/1 task$/i)).toBeInTheDocument()
  })
})
