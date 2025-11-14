/**
 * Component Tests: NotesSection
 *
 * Tests for the NotesSection component including character counter, note CRUD operations
 *
 * Epic 3: Entities Domain
 * Story 3.2: Student Registry
 * Task 17: Testing - Component Tests
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { NotesSection } from '../NotesSection'

// Create a test query client
const createTestQueryClient = () =>
  new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  })

const mockNotes = [
  {
    id: 'note-1',
    student_id: 'student-1',
    user_id: 'user-1',
    content: 'This is the first note about the student.',
    created_at: '2025-01-10T10:00:00Z',
    updated_at: '2025-01-10T10:00:00Z',
    user: {
      full_name: 'Admin User',
      email: 'admin@agency.com',
    },
  },
  {
    id: 'note-2',
    student_id: 'student-1',
    user_id: 'user-1',
    content: 'Follow up needed on visa documentation.',
    created_at: '2025-01-11T14:30:00Z',
    updated_at: '2025-01-11T14:30:00Z',
    user: {
      full_name: 'Regular User',
      email: 'user@agency.com',
    },
  },
]

// Mock fetch
global.fetch = vi.fn()

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <QueryClientProvider client={createTestQueryClient()}>{children}</QueryClientProvider>
)

describe('NotesSection', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    ;(global.fetch as any).mockResolvedValue({
      ok: true,
      json: async () => ({ success: true, data: mockNotes }),
    })
  })

  it('renders notes list', async () => {
    render(<NotesSection studentId="student-1" />, { wrapper })

    await waitFor(() => {
      expect(screen.getByText('This is the first note about the student.')).toBeInTheDocument()
      expect(screen.getByText('Follow up needed on visa documentation.')).toBeInTheDocument()
    })
  })

  it('displays character counter', () => {
    render(<NotesSection studentId="student-1" />, { wrapper })

    expect(screen.getByText(/0 \/ 2,000/)).toBeInTheDocument()
  })

  it('updates character counter as user types', async () => {
    const user = userEvent.setup()

    render(<NotesSection studentId="student-1" />, { wrapper })

    const textarea = screen.getByPlaceholderText(/add a note/i)
    await user.type(textarea, 'Test note')

    await waitFor(() => {
      expect(screen.getByText(/9 \/ 2,000/)).toBeInTheDocument()
    })
  })

  it('shows warning when approaching character limit', async () => {
    const user = userEvent.setup()

    render(<NotesSection studentId="student-1" />, { wrapper })

    const textarea = screen.getByPlaceholderText(/add a note/i)
    const longText = 'a'.repeat(1850)
    await user.type(textarea, longText)

    await waitFor(() => {
      const counter = screen.getByText(/1,850 \/ 2,000/)
      expect(counter).toHaveClass('text-warning')
    })
  })

  it('prevents input beyond 2000 characters', async () => {
    const user = userEvent.setup()

    render(<NotesSection studentId="student-1" />, { wrapper })

    const textarea = screen.getByPlaceholderText(/add a note/i) as HTMLTextAreaElement
    const longText = 'a'.repeat(2500)

    await user.type(textarea, longText)

    await waitFor(() => {
      expect(textarea.value.length).toBeLessThanOrEqual(2000)
    })
  })

  it('creates a new note when Post Note button is clicked', async () => {
    const user = userEvent.setup()
    ;(global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        success: true,
        data: {
          id: 'note-3',
          content: 'New note content',
          created_at: '2025-01-15T12:00:00Z',
        },
      }),
    })

    render(<NotesSection studentId="student-1" />, { wrapper })

    const textarea = screen.getByPlaceholderText(/add a note/i)
    await user.type(textarea, 'New note content')

    const postButton = screen.getByText(/post note/i)
    await user.click(postButton)

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        '/api/students/student-1/notes',
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({ content: 'New note content' }),
        })
      )
    })
  })

  it('disables Post Note button when content is empty', () => {
    render(<NotesSection studentId="student-1" />, { wrapper })

    const postButton = screen.getByText(/post note/i).closest('button')
    expect(postButton).toBeDisabled()
  })

  it('clears textarea after posting note', async () => {
    const user = userEvent.setup()
    ;(global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: true, data: { id: 'note-3' } }),
    })

    render(<NotesSection studentId="student-1" />, { wrapper })

    const textarea = screen.getByPlaceholderText(/add a note/i) as HTMLTextAreaElement
    await user.type(textarea, 'New note')

    const postButton = screen.getByText(/post note/i)
    await user.click(postButton)

    await waitFor(() => {
      expect(textarea.value).toBe('')
    })
  })

  it('displays user attribution with notes', async () => {
    render(<NotesSection studentId="student-1" />, { wrapper })

    await waitFor(() => {
      expect(screen.getByText('Admin User')).toBeInTheDocument()
      expect(screen.getByText('Regular User')).toBeInTheDocument()
    })
  })

  it('displays relative timestamps for notes', async () => {
    render(<NotesSection studentId="student-1" />, { wrapper })

    await waitFor(() => {
      const timestamps = screen.getAllByText(/ago/i)
      expect(timestamps.length).toBeGreaterThan(0)
    })
  })

  it('shows edit and delete buttons for each note', async () => {
    render(<NotesSection studentId="student-1" />, { wrapper })

    await waitFor(() => {
      const editButtons = screen.getAllByLabelText(/edit/i)
      const deleteButtons = screen.getAllByLabelText(/delete/i)
      expect(editButtons.length).toBe(2)
      expect(deleteButtons.length).toBe(2)
    })
  })

  it('opens edit modal when edit button is clicked', async () => {
    const user = userEvent.setup()

    render(<NotesSection studentId="student-1" />, { wrapper })

    await waitFor(() => {
      expect(screen.getByText('This is the first note about the student.')).toBeInTheDocument()
    })

    const editButtons = screen.getAllByLabelText(/edit/i)
    await user.click(editButtons[0])

    await waitFor(() => {
      expect(screen.getByText(/edit note/i)).toBeInTheDocument()
    })
  })

  it('updates note when edit is saved', async () => {
    const user = userEvent.setup()
    ;(global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        success: true,
        data: { ...mockNotes[0], content: 'Updated note content' },
      }),
    })

    render(<NotesSection studentId="student-1" />, { wrapper })

    await waitFor(() => {
      expect(screen.getByText('This is the first note about the student.')).toBeInTheDocument()
    })

    const editButtons = screen.getAllByLabelText(/edit/i)
    await user.click(editButtons[0])

    const editTextarea = await screen.findByDisplayValue('This is the first note about the student.')
    await user.clear(editTextarea)
    await user.type(editTextarea, 'Updated note content')

    const saveButton = screen.getByText(/save/i)
    await user.click(saveButton)

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        '/api/students/student-1/notes/note-1',
        expect.objectContaining({
          method: 'PATCH',
          body: JSON.stringify({ content: 'Updated note content' }),
        })
      )
    })
  })

  it('shows delete confirmation dialog', async () => {
    const user = userEvent.setup()

    render(<NotesSection studentId="student-1" />, { wrapper })

    await waitFor(() => {
      expect(screen.getByText('This is the first note about the student.')).toBeInTheDocument()
    })

    const deleteButtons = screen.getAllByLabelText(/delete/i)
    await user.click(deleteButtons[0])

    await waitFor(() => {
      expect(screen.getByText(/are you sure/i)).toBeInTheDocument()
    })
  })

  it('deletes note when confirmed', async () => {
    const user = userEvent.setup()
    ;(global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: true }),
    })

    render(<NotesSection studentId="student-1" />, { wrapper })

    await waitFor(() => {
      expect(screen.getByText('This is the first note about the student.')).toBeInTheDocument()
    })

    const deleteButtons = screen.getAllByLabelText(/delete/i)
    await user.click(deleteButtons[0])

    const confirmButton = await screen.findByText(/confirm/i)
    await user.click(confirmButton)

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        '/api/students/student-1/notes/note-1',
        expect.objectContaining({
          method: 'DELETE',
        })
      )
    })
  })

  it('displays loading state while fetching notes', () => {
    ;(global.fetch as any).mockImplementationOnce(
      () => new Promise((resolve) => setTimeout(resolve, 1000))
    )

    render(<NotesSection studentId="student-1" />, { wrapper })

    expect(screen.getByText(/loading/i)).toBeInTheDocument()
  })

  it('displays error state when fetch fails', async () => {
    ;(global.fetch as any).mockRejectedValueOnce(new Error('Failed to fetch'))

    render(<NotesSection studentId="student-1" />, { wrapper })

    await waitFor(() => {
      expect(screen.getByText(/error/i)).toBeInTheDocument()
    })
  })

  it('displays empty state when no notes exist', async () => {
    ;(global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: true, data: [] }),
    })

    render(<NotesSection studentId="student-1" />, { wrapper })

    await waitFor(() => {
      expect(screen.getByText(/no notes yet/i)).toBeInTheDocument()
    })
  })
})
