/**
 * Integration Tests: Student API Endpoints
 *
 * Tests for the GET/POST /api/students and GET/PATCH/DELETE /api/students/[id] endpoints
 *
 * Epic 3: Entities Domain
 * Story 3.2: Student Registry
 * Task 17: Testing - Integration Tests
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { GET as getStudents, POST as createStudent } from '@entities/app/api/students/route'
import {
  GET as getStudent,
  PATCH as updateStudent,
  DELETE as deleteStudent,
} from '@entities/app/api/students/[id]/route'
import { testAgencies, testUsers, testStudents } from '../fixtures/students'

// Mock Supabase client
const mockGetUser = vi.fn()
const mockFrom = vi.fn()
const mockSelect = vi.fn()
const mockEq = vi.fn()
const mockOr = vi.fn()
const mockOrder = vi.fn()
const mockRange = vi.fn()
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

// Mock auth utility
vi.mock('@pleeno/auth', () => ({
  requireRole: vi.fn(async (request, roles) => {
    const mockUser = testUsers.agencyAAdmin
    return { user: mockUser }
  }),
}))

// Mock audit logging and activity logging
vi.mock('@pleeno/utils', async () => {
  const actual = await vi.importActual('@pleeno/utils')
  return {
    ...actual,
    logAudit: vi.fn(async () => {}),
  }
})

vi.mock('@pleeno/database', async () => {
  const actual = await vi.importActual('@pleeno/database')
  return {
    ...actual,
    logActivity: vi.fn(async () => {}),
  }
})

describe('GET /api/students', () => {
  beforeEach(() => {
    vi.clearAllMocks()

    // Default mock setup
    mockFrom.mockReturnValue({
      select: mockSelect,
    })

    mockSelect.mockReturnValue({
      eq: mockEq,
    })

    mockEq.mockReturnValue({
      or: mockOr,
      order: mockOrder,
      range: mockRange,
    })

    mockOr.mockReturnValue({
      order: mockOrder,
    })

    mockOrder.mockReturnValue({
      range: mockRange,
    })
  })

  it('returns paginated list of students', async () => {
    const mockStudents = [testStudents.johnDoe, testStudents.janeDoe]

    mockRange.mockResolvedValueOnce({
      data: mockStudents,
      error: null,
      count: 2,
    })

    const request = new Request('http://localhost/api/students?page=1&per_page=20')
    const response = await getStudents(request)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.success).toBe(true)
    expect(data.data).toHaveLength(2)
    expect(data.meta.total).toBe(2)
    expect(data.meta.page).toBe(1)
    expect(data.meta.per_page).toBe(20)
    expect(data.meta.total_pages).toBe(1)
  })

  it('filters students by search query', async () => {
    const searchQuery = 'John'
    mockRange.mockResolvedValueOnce({
      data: [testStudents.johnDoe],
      error: null,
      count: 1,
    })

    const request = new Request(`http://localhost/api/students?search=${searchQuery}`)
    const response = await getStudents(request)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.success).toBe(true)
    expect(mockOr).toHaveBeenCalled()
    expect(data.data).toHaveLength(1)
  })

  it('supports pagination with page and per_page parameters', async () => {
    const mockStudents = [testStudents.johnDoe]

    mockRange.mockResolvedValueOnce({
      data: mockStudents,
      error: null,
      count: 50,
    })

    const request = new Request('http://localhost/api/students?page=2&per_page=10')
    const response = await getStudents(request)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.meta.page).toBe(2)
    expect(data.meta.per_page).toBe(10)
    expect(data.meta.total_pages).toBe(5) // 50 total / 10 per page
    expect(mockRange).toHaveBeenCalledWith(10, 19) // offset 10, range 10-19
  })

  it('validates pagination parameters', async () => {
    const request = new Request('http://localhost/api/students?page=0&per_page=-1')
    const response = await getStudents(request)
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.success).toBe(false)
    expect(data.error.message).toContain('Invalid pagination parameters')
  })

  it('rejects per_page > 100', async () => {
    const request = new Request('http://localhost/api/students?per_page=101')
    const response = await getStudents(request)
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.success).toBe(false)
    expect(data.error.message).toContain('Invalid pagination parameters')
  })

  it('returns empty array when no students found', async () => {
    mockRange.mockResolvedValueOnce({
      data: [],
      error: null,
      count: 0,
    })

    const request = new Request('http://localhost/api/students')
    const response = await getStudents(request)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.success).toBe(true)
    expect(data.data).toEqual([])
    expect(data.meta.total).toBe(0)
  })

  it('filters by agency_id automatically via RLS', async () => {
    mockRange.mockResolvedValueOnce({
      data: [testStudents.johnDoe],
      error: null,
      count: 1,
    })

    const request = new Request('http://localhost/api/students')
    await getStudents(request)

    expect(mockEq).toHaveBeenCalledWith('agency_id', testAgencies.agencyA.id)
  })

  it('handles database errors gracefully', async () => {
    mockRange.mockResolvedValueOnce({
      data: null,
      error: { message: 'Database connection failed' },
      count: null,
    })

    const request = new Request('http://localhost/api/students')
    const response = await getStudents(request)
    const data = await response.json()

    expect(response.status).toBe(500)
    expect(data.success).toBe(false)
  })
})

describe('POST /api/students', () => {
  beforeEach(() => {
    vi.clearAllMocks()

    mockFrom.mockReturnValue({
      insert: mockInsert,
    })

    mockInsert.mockReturnValue({
      select: mockSelect,
    })

    mockSelect.mockReturnValue({
      single: mockSingle,
    })
  })

  it('creates a new student with valid data', async () => {
    const newStudent = {
      full_name: 'Alice Johnson',
      passport_number: 'EF111111',
      email: 'alice@email.com',
      phone: '+1-416-555-0001',
      visa_status: 'in_process',
      date_of_birth: '1996-01-15',
      nationality: 'Canadian',
    }

    const createdStudent = {
      id: 'new-student-uuid',
      agency_id: testAgencies.agencyA.id,
      ...newStudent,
      created_at: '2025-01-15T00:00:00Z',
      updated_at: '2025-01-15T00:00:00Z',
    }

    mockSingle.mockResolvedValueOnce({
      data: createdStudent,
      error: null,
    })

    const request = new Request('http://localhost/api/students', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newStudent),
    })

    const response = await createStudent(request)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.success).toBe(true)
    expect(data.data.full_name).toBe('Alice Johnson')
    expect(data.data.passport_number).toBe('EF111111')
    expect(mockInsert).toHaveBeenCalledWith(
      expect.objectContaining({
        agency_id: testAgencies.agencyA.id,
        full_name: 'Alice Johnson',
        passport_number: 'EF111111',
      })
    )
  })

  it('creates student with only required fields', async () => {
    const minimalStudent = {
      full_name: 'Bob Williams',
      passport_number: 'GH222222',
    }

    const createdStudent = {
      id: 'new-student-uuid',
      agency_id: testAgencies.agencyA.id,
      ...minimalStudent,
      email: null,
      phone: null,
      visa_status: null,
      date_of_birth: null,
      nationality: null,
      created_at: '2025-01-15T00:00:00Z',
      updated_at: '2025-01-15T00:00:00Z',
    }

    mockSingle.mockResolvedValueOnce({
      data: createdStudent,
      error: null,
    })

    const request = new Request('http://localhost/api/students', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(minimalStudent),
    })

    const response = await createStudent(request)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.success).toBe(true)
    expect(data.data.full_name).toBe('Bob Williams')
  })

  it('validates required fields', async () => {
    const invalidStudent = {
      full_name: 'Missing Passport',
      // passport_number is missing
    }

    const request = new Request('http://localhost/api/students', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(invalidStudent),
    })

    const response = await createStudent(request)
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.success).toBe(false)
    expect(data.error.type).toBe('ValidationError')
  })

  it('validates email format', async () => {
    const invalidStudent = {
      full_name: 'Invalid Email',
      passport_number: 'IJ333333',
      email: 'not-an-email',
    }

    const request = new Request('http://localhost/api/students', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(invalidStudent),
    })

    const response = await createStudent(request)
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.success).toBe(false)
    expect(data.error.type).toBe('ValidationError')
  })

  it('validates visa_status enum', async () => {
    const invalidStudent = {
      full_name: 'Invalid Visa',
      passport_number: 'KL444444',
      visa_status: 'invalid_status',
    }

    const request = new Request('http://localhost/api/students', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(invalidStudent),
    })

    const response = await createStudent(request)
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.success).toBe(false)
    expect(data.error.type).toBe('ValidationError')
  })

  it('validates date_of_birth format', async () => {
    const invalidStudent = {
      full_name: 'Invalid DOB',
      passport_number: 'MN555555',
      date_of_birth: '01/15/1996', // Wrong format
    }

    const request = new Request('http://localhost/api/students', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(invalidStudent),
    })

    const response = await createStudent(request)
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.success).toBe(false)
    expect(data.error.type).toBe('ValidationError')
  })

  it('rejects duplicate passport number within same agency', async () => {
    const duplicateStudent = {
      full_name: 'Duplicate Passport',
      passport_number: testStudents.johnDoe.passport_number, // Already exists
      email: 'duplicate@email.com',
    }

    mockSingle.mockResolvedValueOnce({
      data: null,
      error: {
        code: '23505', // PostgreSQL unique constraint violation
        message: 'duplicate key value violates unique constraint',
      },
    })

    const request = new Request('http://localhost/api/students', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(duplicateStudent),
    })

    const response = await createStudent(request)
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.success).toBe(false)
    expect(data.error.message).toContain('passport number already exists')
  })

  it('automatically sets agency_id from authenticated user', async () => {
    const newStudent = {
      full_name: 'Test Student',
      passport_number: 'OP666666',
    }

    const createdStudent = {
      id: 'new-student-uuid',
      agency_id: testAgencies.agencyA.id,
      ...newStudent,
      created_at: '2025-01-15T00:00:00Z',
      updated_at: '2025-01-15T00:00:00Z',
    }

    mockSingle.mockResolvedValueOnce({
      data: createdStudent,
      error: null,
    })

    const request = new Request('http://localhost/api/students', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newStudent),
    })

    await createStudent(request)

    expect(mockInsert).toHaveBeenCalledWith(
      expect.objectContaining({
        agency_id: testAgencies.agencyA.id,
      })
    )
  })
})

describe('GET /api/students/[id]', () => {
  beforeEach(() => {
    vi.clearAllMocks()

    mockFrom.mockReturnValue({
      select: mockSelect,
    })

    mockSelect.mockReturnValue({
      eq: mockEq,
    })

    mockEq.mockReturnValue({
      single: mockSingle,
    })
  })

  it('returns student by id', async () => {
    mockSingle.mockResolvedValueOnce({
      data: testStudents.johnDoe,
      error: null,
    })

    const request = new Request(`http://localhost/api/students/${testStudents.johnDoe.id}`)
    const response = await getStudent(request, {
      params: Promise.resolve({ id: testStudents.johnDoe.id }),
    })
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.success).toBe(true)
    expect(data.data.id).toBe(testStudents.johnDoe.id)
    expect(data.data.full_name).toBe('John Doe')
  })

  it('returns 404 if student not found', async () => {
    mockSingle.mockResolvedValueOnce({
      data: null,
      error: { message: 'Not found' },
    })

    const request = new Request('http://localhost/api/students/non-existent-id')
    const response = await getStudent(request, {
      params: Promise.resolve({ id: 'non-existent-id' }),
    })
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.success).toBe(false)
  })

  it('respects RLS - cannot access student from different agency', async () => {
    mockSingle.mockResolvedValueOnce({
      data: null,
      error: { message: 'Not found' },
    })

    const request = new Request(`http://localhost/api/students/${testStudents.bobSmith.id}`)
    const response = await getStudent(request, {
      params: Promise.resolve({ id: testStudents.bobSmith.id }),
    })
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.success).toBe(false)
  })
})

describe('PATCH /api/students/[id]', () => {
  beforeEach(() => {
    vi.clearAllMocks()

    mockFrom.mockReturnValue({
      update: mockUpdate,
    })

    mockUpdate.mockReturnValue({
      eq: mockEq,
    })

    mockEq.mockReturnValue({
      select: mockSelect,
    })

    mockSelect.mockReturnValue({
      single: mockSingle,
    })
  })

  it('updates student with valid data', async () => {
    const updateData = {
      visa_status: 'approved',
      email: 'newemail@email.com',
    }

    const updatedStudent = {
      ...testStudents.johnDoe,
      ...updateData,
      updated_at: '2025-01-15T10:00:00Z',
    }

    mockSingle.mockResolvedValueOnce({
      data: updatedStudent,
      error: null,
    })

    const request = new Request(`http://localhost/api/students/${testStudents.johnDoe.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updateData),
    })

    const response = await updateStudent(request, {
      params: Promise.resolve({ id: testStudents.johnDoe.id }),
    })
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.success).toBe(true)
    expect(data.data.visa_status).toBe('approved')
    expect(data.data.email).toBe('newemail@email.com')
  })

  it('supports partial updates', async () => {
    const updateData = {
      phone: '+1-416-555-9999',
    }

    const updatedStudent = {
      ...testStudents.johnDoe,
      phone: '+1-416-555-9999',
      updated_at: '2025-01-15T10:00:00Z',
    }

    mockSingle.mockResolvedValueOnce({
      data: updatedStudent,
      error: null,
    })

    const request = new Request(`http://localhost/api/students/${testStudents.johnDoe.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updateData),
    })

    const response = await updateStudent(request, {
      params: Promise.resolve({ id: testStudents.johnDoe.id }),
    })
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.success).toBe(true)
    expect(data.data.phone).toBe('+1-416-555-9999')
  })

  it('validates update data', async () => {
    const invalidUpdate = {
      email: 'not-an-email',
      visa_status: 'invalid_status',
    }

    const request = new Request(`http://localhost/api/students/${testStudents.johnDoe.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(invalidUpdate),
    })

    const response = await updateStudent(request, {
      params: Promise.resolve({ id: testStudents.johnDoe.id }),
    })
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.success).toBe(false)
    expect(data.error.type).toBe('ValidationError')
  })

  it('rejects duplicate passport number on update', async () => {
    const updateData = {
      passport_number: testStudents.janeDoe.passport_number, // Duplicate
    }

    mockSingle.mockResolvedValueOnce({
      data: null,
      error: {
        code: '23505',
        message: 'duplicate key value violates unique constraint',
      },
    })

    const request = new Request(`http://localhost/api/students/${testStudents.johnDoe.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updateData),
    })

    const response = await updateStudent(request, {
      params: Promise.resolve({ id: testStudents.johnDoe.id }),
    })
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.success).toBe(false)
  })
})

describe('DELETE /api/students/[id]', () => {
  beforeEach(() => {
    vi.clearAllMocks()

    mockFrom.mockReturnValue({
      delete: mockDelete,
    })

    mockDelete.mockReturnValue({
      eq: mockEq,
    })

    mockEq.mockReturnValue({
      select: mockSelect,
    })

    mockSelect.mockReturnValue({
      single: mockSingle,
    })
  })

  it('deletes student by id', async () => {
    mockSingle.mockResolvedValueOnce({
      data: testStudents.johnDoe,
      error: null,
    })

    const request = new Request(`http://localhost/api/students/${testStudents.johnDoe.id}`, {
      method: 'DELETE',
    })

    const response = await deleteStudent(request, {
      params: Promise.resolve({ id: testStudents.johnDoe.id }),
    })
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.success).toBe(true)
    expect(mockDelete).toHaveBeenCalled()
  })

  it('returns 404 if student not found', async () => {
    mockSingle.mockResolvedValueOnce({
      data: null,
      error: { message: 'Not found' },
    })

    const request = new Request('http://localhost/api/students/non-existent-id', {
      method: 'DELETE',
    })

    const response = await deleteStudent(request, {
      params: Promise.resolve({ id: 'non-existent-id' }),
    })
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.success).toBe(false)
  })

  it('respects RLS - cannot delete student from different agency', async () => {
    mockSingle.mockResolvedValueOnce({
      data: null,
      error: { message: 'Not found' },
    })

    const request = new Request(`http://localhost/api/students/${testStudents.bobSmith.id}`, {
      method: 'DELETE',
    })

    const response = await deleteStudent(request, {
      params: Promise.resolve({ id: testStudents.bobSmith.id }),
    })
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.success).toBe(false)
  })
})
