/**
 * Integration Tests: CSV Import API
 *
 * Tests for the POST /api/students/import endpoint
 *
 * Epic 3: Entities Domain
 * Story 3.2: Student Registry
 * Task 17: Testing - Integration Tests
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { POST as importStudents } from '@entities/app/api/students/import/route'
import { testAgencies, testUsers, sampleCSVData } from '../fixtures/students'

// Mock Supabase client
const mockGetUser = vi.fn()
const mockFrom = vi.fn()
const mockInsert = vi.fn()
const mockSelect = vi.fn()

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

// Mock audit logging
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

describe('POST /api/students/import', () => {
  beforeEach(() => {
    vi.clearAllMocks()

    mockGetUser.mockResolvedValue({
      data: {
        user: testUsers.agencyAAdmin,
      },
      error: null,
    })

    mockFrom.mockReturnValue({
      insert: mockInsert,
    })

    mockInsert.mockReturnValue({
      select: mockSelect,
    })

    mockSelect.mockResolvedValue({
      data: [],
      error: null,
    })
  })

  it('imports valid CSV data successfully', async () => {
    const importedStudents = [
      {
        id: 'student-1-uuid',
        agency_id: testAgencies.agencyA.id,
        full_name: 'Alice Johnson',
        passport_number: 'AB111111',
        email: 'alice@email.com',
        phone: '+1-416-555-0001',
        date_of_birth: '1996-01-15',
        nationality: 'Canadian',
        visa_status: 'in_process',
        created_at: '2025-01-15T00:00:00Z',
        updated_at: '2025-01-15T00:00:00Z',
      },
      {
        id: 'student-2-uuid',
        agency_id: testAgencies.agencyA.id,
        full_name: 'Bob Williams',
        passport_number: 'AB222222',
        email: 'bob@email.com',
        phone: '+1-416-555-0002',
        date_of_birth: '1997-02-20',
        nationality: 'American',
        visa_status: 'approved',
        created_at: '2025-01-15T00:00:00Z',
        updated_at: '2025-01-15T00:00:00Z',
      },
      {
        id: 'student-3-uuid',
        agency_id: testAgencies.agencyA.id,
        full_name: 'Carol Davis',
        passport_number: 'AB333333',
        email: 'carol@email.com',
        phone: '+1-416-555-0003',
        date_of_birth: '1998-03-25',
        nationality: 'British',
        visa_status: 'denied',
        created_at: '2025-01-15T00:00:00Z',
        updated_at: '2025-01-15T00:00:00Z',
      },
    ]

    mockSelect.mockResolvedValueOnce({
      data: importedStudents,
      error: null,
    })

    const formData = new FormData()
    const csvBlob = new Blob([sampleCSVData.valid], { type: 'text/csv' })
    formData.append('file', csvBlob, 'students.csv')

    const request = new Request('http://localhost/api/students/import', {
      method: 'POST',
      body: formData,
    })

    const response = await importStudents(request)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.success).toBe(true)
    expect(data.data.imported).toBe(3)
    expect(data.data.failed).toBe(0)
    expect(data.data.students).toHaveLength(3)
  })

  it('rejects CSV with invalid headers', async () => {
    const formData = new FormData()
    const csvBlob = new Blob([sampleCSVData.invalidHeaders], { type: 'text/csv' })
    formData.append('file', csvBlob, 'students.csv')

    const request = new Request('http://localhost/api/students/import', {
      method: 'POST',
      body: formData,
    })

    const response = await importStudents(request)
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.success).toBe(false)
    expect(data.error.message).toContain('header')
  })

  it('handles rows with validation errors gracefully', async () => {
    const formData = new FormData()
    const csvBlob = new Blob([sampleCSVData.invalidData], { type: 'text/csv' })
    formData.append('file', csvBlob, 'students.csv')

    const request = new Request('http://localhost/api/students/import', {
      method: 'POST',
      body: formData,
    })

    const response = await importStudents(request)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.success).toBe(true)
    expect(data.data.failed).toBeGreaterThan(0)
    expect(data.data.errors).toBeDefined()
    expect(data.data.errors.length).toBeGreaterThan(0)
  })

  it('reports duplicate passport numbers', async () => {
    const formData = new FormData()
    const csvBlob = new Blob([sampleCSVData.duplicatePassport], { type: 'text/csv' })
    formData.append('file', csvBlob, 'students.csv')

    mockSelect.mockResolvedValueOnce({
      data: null,
      error: {
        code: '23505',
        message: 'duplicate key value violates unique constraint',
      },
    })

    const request = new Request('http://localhost/api/students/import', {
      method: 'POST',
      body: formData,
    })

    const response = await importStudents(request)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.success).toBe(true)
    expect(data.data.failed).toBeGreaterThan(0)
    expect(data.data.errors).toBeDefined()
  })

  it('rejects non-CSV files', async () => {
    const formData = new FormData()
    const txtBlob = new Blob(['not a csv'], { type: 'text/plain' })
    formData.append('file', txtBlob, 'students.txt')

    const request = new Request('http://localhost/api/students/import', {
      method: 'POST',
      body: formData,
    })

    const response = await importStudents(request)
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.success).toBe(false)
    expect(data.error.message).toContain('CSV')
  })

  it('requires file to be uploaded', async () => {
    const formData = new FormData()

    const request = new Request('http://localhost/api/students/import', {
      method: 'POST',
      body: formData,
    })

    const response = await importStudents(request)
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.success).toBe(false)
    expect(data.error.message).toContain('required')
  })

  it('validates required fields in CSV rows', async () => {
    const csvWithMissingFields = `full_name,passport_number,email
,AB123456,test@email.com
John Doe,,test2@email.com`

    const formData = new FormData()
    const csvBlob = new Blob([csvWithMissingFields], { type: 'text/csv' })
    formData.append('file', csvBlob, 'students.csv')

    const request = new Request('http://localhost/api/students/import', {
      method: 'POST',
      body: formData,
    })

    const response = await importStudents(request)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.data.failed).toBe(2)
    expect(data.data.imported).toBe(0)
  })

  it('automatically sets agency_id for all imported students', async () => {
    const importedStudents = [
      {
        id: 'student-1-uuid',
        agency_id: testAgencies.agencyA.id,
        full_name: 'Alice Johnson',
        passport_number: 'AB111111',
        created_at: '2025-01-15T00:00:00Z',
        updated_at: '2025-01-15T00:00:00Z',
      },
    ]

    mockSelect.mockResolvedValueOnce({
      data: importedStudents,
      error: null,
    })

    const csvData = `full_name,passport_number
Alice Johnson,AB111111`

    const formData = new FormData()
    const csvBlob = new Blob([csvData], { type: 'text/csv' })
    formData.append('file', csvBlob, 'students.csv')

    const request = new Request('http://localhost/api/students/import', {
      method: 'POST',
      body: formData,
    })

    await importStudents(request)

    expect(mockInsert).toHaveBeenCalledWith(
      expect.arrayContaining([
        expect.objectContaining({
          agency_id: testAgencies.agencyA.id,
        }),
      ])
    )
  })

  it('handles empty CSV file', async () => {
    const emptyCSV = `full_name,passport_number,email`

    const formData = new FormData()
    const csvBlob = new Blob([emptyCSV], { type: 'text/csv' })
    formData.append('file', csvBlob, 'students.csv')

    const request = new Request('http://localhost/api/students/import', {
      method: 'POST',
      body: formData,
    })

    const response = await importStudents(request)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.data.imported).toBe(0)
    expect(data.data.failed).toBe(0)
  })

  it('provides detailed error messages for failed rows', async () => {
    const csvWithErrors = `full_name,passport_number,email,visa_status
John Doe,AB123456,invalid-email,in_process
Jane Doe,CD789012,jane@email.com,invalid_status`

    const formData = new FormData()
    const csvBlob = new Blob([csvWithErrors], { type: 'text/csv' })
    formData.append('file', csvBlob, 'students.csv')

    const request = new Request('http://localhost/api/students/import', {
      method: 'POST',
      body: formData,
    })

    const response = await importStudents(request)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.data.errors).toBeDefined()
    expect(data.data.errors.length).toBeGreaterThan(0)
    expect(data.data.errors[0]).toHaveProperty('row')
    expect(data.data.errors[0]).toHaveProperty('error')
  })

  it('limits CSV file size to prevent memory issues', async () => {
    // Create a very large CSV (>10MB)
    const largeCSV = 'full_name,passport_number\n' + 'John Doe,AB123456\n'.repeat(500000)

    const formData = new FormData()
    const csvBlob = new Blob([largeCSV], { type: 'text/csv' })
    formData.append('file', csvBlob, 'students.csv')

    const request = new Request('http://localhost/api/students/import', {
      method: 'POST',
      body: formData,
    })

    const response = await importStudents(request)
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.success).toBe(false)
    expect(data.error.message).toContain('size')
  })

  it('trims whitespace from CSV values', async () => {
    const csvWithWhitespace = `full_name,passport_number,email
  John Doe  ,  AB123456  ,  john@email.com  `

    const importedStudent = {
      id: 'student-1-uuid',
      agency_id: testAgencies.agencyA.id,
      full_name: 'John Doe',
      passport_number: 'AB123456',
      email: 'john@email.com',
      created_at: '2025-01-15T00:00:00Z',
      updated_at: '2025-01-15T00:00:00Z',
    }

    mockSelect.mockResolvedValueOnce({
      data: [importedStudent],
      error: null,
    })

    const formData = new FormData()
    const csvBlob = new Blob([csvWithWhitespace], { type: 'text/csv' })
    formData.append('file', csvBlob, 'students.csv')

    const request = new Request('http://localhost/api/students/import', {
      method: 'POST',
      body: formData,
    })

    const response = await importStudents(request)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.data.imported).toBe(1)
    expect(data.data.students[0].full_name).toBe('John Doe')
    expect(data.data.students[0].passport_number).toBe('AB123456')
  })
})
