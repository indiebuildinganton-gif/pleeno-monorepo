/**
 * Integration Tests: Student Notes API
 *
 * Tests for the GET/POST /api/students/[id]/notes and PATCH/DELETE /api/students/[id]/notes/[note_id] endpoints
 *
 * Epic 3: Entities Domain
 * Story 3.2: Student Registry
 * Task 17: Testing - Integration Tests
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { GET as getNotes, POST as createNote } from '@entities/app/api/students/[id]/notes/route'
import {
  PATCH as updateNote,
  DELETE as deleteNote,
} from '@entities/app/api/students/[id]/notes/[note_id]/route'
import { testAgencies, testUsers, testStudents, testNotes } from '../fixtures/students'

// Mock Supabase client
const mockGetUser = vi.fn()
const mockFrom = vi.fn()
const mockSelect = vi.fn()
const mockEq = vi.fn()
const mockOrder = vi.fn()
const mockSingle = vi.fn()
const mockInsert = vi.fn()
const mockUpdate = vi.fn()
const mockDelete = vi.fn()

vi.mock('@pleeno/database/server', () => ({
  createServerClient: vi.fn(() => ({
    auth: {
      getUser: mockGetUser,
    },
    from: mockFrom,
  })),
}))

// Mock audit logging
vi.mock('@pleeno/utils', async () => {
  const actual = await vi.importActual('@pleeno/utils')
  return {
    ...actual,
    logAudit: vi.fn(async () => {}),
  }
})

describe('GET /api/students/[id]/notes', () => {
  beforeEach(() => {
    vi.clearAllMocks()

    mockGetUser.mockResolvedValue({
      data: {
        user: testUsers.agencyAAdmin,
      },
      error: null,
    })

    mockFrom.mockReturnValue({
      select: mockSelect,
    })

    mockSelect.mockReturnValue({
      eq: mockEq,
    })

    mockEq.mockReturnValue({
      single: mockSingle,
      eq: mockEq,
      order: mockOrder,
    })

    mockOrder.mockResolvedValue({
      data: null,
      error: null,
    })
  })

  it('returns all notes for a student', async () => {
    const mockNotes = [
      {
        ...testNotes.note1,
        users: {
          id: testUsers.agencyAAdmin.id,
          full_name: 'Admin User',
          email: testUsers.agencyAAdmin.email,
        },
      },
      {
        ...testNotes.note2,
        users: {
          id: testUsers.agencyAUser.id,
          full_name: 'Regular User',
          email: testUsers.agencyAUser.email,
        },
      },
    ]

    // Mock student verification
    mockSingle.mockResolvedValueOnce({
      data: { id: testStudents.johnDoe.id },
      error: null,
    })

    // Mock notes fetch
    mockOrder.mockResolvedValueOnce({
      data: mockNotes,
      error: null,
    })

    const request = new Request(`http://localhost/api/students/${testStudents.johnDoe.id}/notes`)
    const response = await getNotes(request, {
      params: Promise.resolve({ id: testStudents.johnDoe.id }),
    })
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.success).toBe(true)
    expect(data.data).toHaveLength(2)
    expect(data.data[0].content).toBe(testNotes.note1.content)
  })

  it('returns empty array when student has no notes', async () => {
    // Mock student verification
    mockSingle.mockResolvedValueOnce({
      data: { id: testStudents.johnDoe.id },
      error: null,
    })

    // Mock empty notes
    mockOrder.mockResolvedValueOnce({
      data: [],
      error: null,
    })

    const request = new Request(`http://localhost/api/students/${testStudents.johnDoe.id}/notes`)
    const response = await getNotes(request, {
      params: Promise.resolve({ id: testStudents.johnDoe.id }),
    })
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.success).toBe(true)
    expect(data.data).toEqual([])
  })

  it('returns 400 if student not found', async () => {
    // Mock student verification failure
    mockSingle.mockResolvedValueOnce({
      data: null,
      error: { message: 'Not found' },
    })

    const request = new Request('http://localhost/api/students/non-existent-id/notes')
    const response = await getNotes(request, {
      params: Promise.resolve({ id: 'non-existent-id' }),
    })
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.success).toBe(false)
    expect(data.error.message).toContain('Student not found')
  })

  it('returns 400 if student belongs to different agency (RLS)', async () => {
    // Mock student verification failure due to RLS
    mockSingle.mockResolvedValueOnce({
      data: null,
      error: { message: 'Not found' },
    })

    const request = new Request(`http://localhost/api/students/${testStudents.bobSmith.id}/notes`)
    const response = await getNotes(request, {
      params: Promise.resolve({ id: testStudents.bobSmith.id }),
    })
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.success).toBe(false)
  })

  it('includes user attribution with each note', async () => {
    const mockNoteWithUser = {
      ...testNotes.note1,
      users: {
        id: testUsers.agencyAAdmin.id,
        full_name: 'Admin User',
        email: 'admin@agency.com',
      },
    }

    mockSingle.mockResolvedValueOnce({
      data: { id: testStudents.johnDoe.id },
      error: null,
    })

    mockOrder.mockResolvedValueOnce({
      data: [mockNoteWithUser],
      error: null,
    })

    const request = new Request(`http://localhost/api/students/${testStudents.johnDoe.id}/notes`)
    const response = await getNotes(request, {
      params: Promise.resolve({ id: testStudents.johnDoe.id }),
    })
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.data[0]).toHaveProperty('user')
    expect(data.data[0].user.full_name).toBe('Admin User')
    expect(data.data[0].user.email).toBe('admin@agency.com')
  })

  it('orders notes by created_at descending (newest first)', async () => {
    mockSingle.mockResolvedValueOnce({
      data: { id: testStudents.johnDoe.id },
      error: null,
    })

    mockOrder.mockResolvedValueOnce({
      data: [],
      error: null,
    })

    const request = new Request(`http://localhost/api/students/${testStudents.johnDoe.id}/notes`)
    await getNotes(request, {
      params: Promise.resolve({ id: testStudents.johnDoe.id }),
    })

    expect(mockOrder).toHaveBeenCalledWith('created_at', { ascending: false })
  })
})

describe('POST /api/students/[id]/notes', () => {
  beforeEach(() => {
    vi.clearAllMocks()

    mockGetUser.mockResolvedValue({
      data: {
        user: testUsers.agencyAAdmin,
      },
      error: null,
    })

    mockFrom.mockReturnValue({
      select: mockSelect,
      insert: mockInsert,
    })

    mockSelect.mockReturnValue({
      eq: mockEq,
    })

    mockEq.mockReturnValue({
      single: mockSingle,
    })

    mockInsert.mockReturnValue({
      select: mockSelect,
    })
  })

  it('creates a new note with valid data', async () => {
    const newNoteData = {
      content: 'This is a test note about the student progress.',
    }

    const createdNote = {
      id: 'new-note-uuid',
      student_id: testStudents.johnDoe.id,
      user_id: testUsers.agencyAAdmin.id,
      agency_id: testAgencies.agencyA.id,
      content: newNoteData.content,
      created_at: '2025-01-15T10:00:00Z',
      updated_at: '2025-01-15T10:00:00Z',
    }

    // Mock student verification
    mockSingle.mockResolvedValueOnce({
      data: { id: testStudents.johnDoe.id },
      error: null,
    })

    // Mock note creation
    mockSingle.mockResolvedValueOnce({
      data: createdNote,
      error: null,
    })

    const request = new Request(`http://localhost/api/students/${testStudents.johnDoe.id}/notes`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newNoteData),
    })

    const response = await createNote(request, {
      params: Promise.resolve({ id: testStudents.johnDoe.id }),
    })
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.success).toBe(true)
    expect(data.data.content).toBe(newNoteData.content)
    expect(data.data.student_id).toBe(testStudents.johnDoe.id)
  })

  it('validates content is required', async () => {
    const invalidNote = {
      content: '',
    }

    const request = new Request(`http://localhost/api/students/${testStudents.johnDoe.id}/notes`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(invalidNote),
    })

    const response = await createNote(request, {
      params: Promise.resolve({ id: testStudents.johnDoe.id }),
    })
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.success).toBe(false)
    expect(data.error.type).toBe('ValidationError')
  })

  it('validates content length (max 2000 characters)', async () => {
    const longNote = {
      content: 'a'.repeat(2001),
    }

    const request = new Request(`http://localhost/api/students/${testStudents.johnDoe.id}/notes`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(longNote),
    })

    const response = await createNote(request, {
      params: Promise.resolve({ id: testStudents.johnDoe.id }),
    })
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.success).toBe(false)
    expect(data.error.type).toBe('ValidationError')
  })

  it('accepts note with exactly 2000 characters', async () => {
    const maxLengthNote = {
      content: 'a'.repeat(2000),
    }

    const createdNote = {
      id: 'new-note-uuid',
      student_id: testStudents.johnDoe.id,
      user_id: testUsers.agencyAAdmin.id,
      agency_id: testAgencies.agencyA.id,
      content: maxLengthNote.content,
      created_at: '2025-01-15T10:00:00Z',
      updated_at: '2025-01-15T10:00:00Z',
    }

    mockSingle.mockResolvedValueOnce({
      data: { id: testStudents.johnDoe.id },
      error: null,
    })

    mockSingle.mockResolvedValueOnce({
      data: createdNote,
      error: null,
    })

    const request = new Request(`http://localhost/api/students/${testStudents.johnDoe.id}/notes`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(maxLengthNote),
    })

    const response = await createNote(request, {
      params: Promise.resolve({ id: testStudents.johnDoe.id }),
    })
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.success).toBe(true)
  })

  it('automatically sets agency_id and user_id from authenticated user', async () => {
    const newNoteData = {
      content: 'Test note',
    }

    const createdNote = {
      id: 'new-note-uuid',
      student_id: testStudents.johnDoe.id,
      user_id: testUsers.agencyAAdmin.id,
      agency_id: testAgencies.agencyA.id,
      content: newNoteData.content,
      created_at: '2025-01-15T10:00:00Z',
      updated_at: '2025-01-15T10:00:00Z',
    }

    mockSingle.mockResolvedValueOnce({
      data: { id: testStudents.johnDoe.id },
      error: null,
    })

    mockSingle.mockResolvedValueOnce({
      data: createdNote,
      error: null,
    })

    const request = new Request(`http://localhost/api/students/${testStudents.johnDoe.id}/notes`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newNoteData),
    })

    await createNote(request, {
      params: Promise.resolve({ id: testStudents.johnDoe.id }),
    })

    expect(mockInsert).toHaveBeenCalledWith(
      expect.objectContaining({
        agency_id: testAgencies.agencyA.id,
        user_id: testUsers.agencyAAdmin.id,
        student_id: testStudents.johnDoe.id,
      })
    )
  })

  it('returns 400 if student not found', async () => {
    mockSingle.mockResolvedValueOnce({
      data: null,
      error: { message: 'Not found' },
    })

    const request = new Request('http://localhost/api/students/non-existent-id/notes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content: 'Test note' }),
    })

    const response = await createNote(request, {
      params: Promise.resolve({ id: 'non-existent-id' }),
    })
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.success).toBe(false)
  })
})

describe('PATCH /api/students/[id]/notes/[note_id]', () => {
  beforeEach(() => {
    vi.clearAllMocks()

    mockGetUser.mockResolvedValue({
      data: {
        user: testUsers.agencyAAdmin,
      },
      error: null,
    })

    mockFrom.mockReturnValue({
      update: mockUpdate,
    })

    mockUpdate.mockReturnValue({
      eq: mockEq,
    })

    mockEq.mockReturnValue({
      eq: mockEq,
      select: mockSelect,
    })

    mockSelect.mockReturnValue({
      single: mockSingle,
    })
  })

  it('updates note content', async () => {
    const updateData = {
      content: 'Updated note content',
    }

    const updatedNote = {
      ...testNotes.note1,
      content: updateData.content,
      updated_at: '2025-01-15T11:00:00Z',
    }

    mockSingle.mockResolvedValueOnce({
      data: updatedNote,
      error: null,
    })

    const request = new Request(
      `http://localhost/api/students/${testStudents.johnDoe.id}/notes/${testNotes.note1.id}`,
      {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updateData),
      }
    )

    const response = await updateNote(request, {
      params: Promise.resolve({
        id: testStudents.johnDoe.id,
        note_id: testNotes.note1.id,
      }),
    })
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.success).toBe(true)
    expect(data.data.content).toBe('Updated note content')
  })

  it('validates content cannot be empty', async () => {
    const invalidUpdate = {
      content: '',
    }

    const request = new Request(
      `http://localhost/api/students/${testStudents.johnDoe.id}/notes/${testNotes.note1.id}`,
      {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(invalidUpdate),
      }
    )

    const response = await updateNote(request, {
      params: Promise.resolve({
        id: testStudents.johnDoe.id,
        note_id: testNotes.note1.id,
      }),
    })
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.success).toBe(false)
    expect(data.error.type).toBe('ValidationError')
  })

  it('respects RLS - cannot update note from different agency', async () => {
    mockSingle.mockResolvedValueOnce({
      data: null,
      error: { message: 'Not found' },
    })

    const request = new Request(
      `http://localhost/api/students/${testStudents.johnDoe.id}/notes/${testNotes.note1.id}`,
      {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: 'Updated content' }),
      }
    )

    const response = await updateNote(request, {
      params: Promise.resolve({
        id: testStudents.johnDoe.id,
        note_id: testNotes.note1.id,
      }),
    })
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.success).toBe(false)
  })
})

describe('DELETE /api/students/[id]/notes/[note_id]', () => {
  beforeEach(() => {
    vi.clearAllMocks()

    mockGetUser.mockResolvedValue({
      data: {
        user: testUsers.agencyAAdmin,
      },
      error: null,
    })

    mockFrom.mockReturnValue({
      delete: mockDelete,
    })

    mockDelete.mockReturnValue({
      eq: mockEq,
    })

    mockEq.mockReturnValue({
      eq: mockEq,
      select: mockSelect,
    })

    mockSelect.mockReturnValue({
      single: mockSingle,
    })
  })

  it('deletes note by id', async () => {
    mockSingle.mockResolvedValueOnce({
      data: testNotes.note1,
      error: null,
    })

    const request = new Request(
      `http://localhost/api/students/${testStudents.johnDoe.id}/notes/${testNotes.note1.id}`,
      {
        method: 'DELETE',
      }
    )

    const response = await deleteNote(request, {
      params: Promise.resolve({
        id: testStudents.johnDoe.id,
        note_id: testNotes.note1.id,
      }),
    })
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.success).toBe(true)
    expect(mockDelete).toHaveBeenCalled()
  })

  it('returns 400 if note not found', async () => {
    mockSingle.mockResolvedValueOnce({
      data: null,
      error: { message: 'Not found' },
    })

    const request = new Request(
      `http://localhost/api/students/${testStudents.johnDoe.id}/notes/non-existent-id`,
      {
        method: 'DELETE',
      }
    )

    const response = await deleteNote(request, {
      params: Promise.resolve({
        id: testStudents.johnDoe.id,
        note_id: 'non-existent-id',
      }),
    })
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.success).toBe(false)
  })

  it('respects RLS - cannot delete note from different agency', async () => {
    mockSingle.mockResolvedValueOnce({
      data: null,
      error: { message: 'Not found' },
    })

    const request = new Request(
      `http://localhost/api/students/${testStudents.johnDoe.id}/notes/${testNotes.note1.id}`,
      {
        method: 'DELETE',
      }
    )

    const response = await deleteNote(request, {
      params: Promise.resolve({
        id: testStudents.johnDoe.id,
        note_id: testNotes.note1.id,
      }),
    })
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.success).toBe(false)
  })
})
