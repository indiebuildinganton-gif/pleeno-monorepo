/**
 * Integration Tests: Student Documents API
 *
 * Tests for the GET/POST /api/students/[id]/documents and GET/DELETE /api/students/[id]/documents/[doc_id] endpoints
 *
 * Epic 3: Entities Domain
 * Story 3.2: Student Registry
 * Task 17: Testing - Integration Tests
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import {
  GET as getDocuments,
  POST as uploadDocument,
} from '@entities/app/api/students/[id]/documents/route'
import { DELETE as deleteDocument } from '@entities/app/api/students/[id]/documents/[doc_id]/route'
import { testAgencies, testUsers, testStudents, testDocuments, sampleFiles } from '../fixtures/students'

// Mock Supabase client
const mockGetUser = vi.fn()
const mockFrom = vi.fn()
const mockSelect = vi.fn()
const mockEq = vi.fn()
const mockOrder = vi.fn()
const mockSingle = vi.fn()
const mockInsert = vi.fn()
const mockDelete = vi.fn()
const mockUpload = vi.fn()
const mockRemove = vi.fn()

vi.mock('@pleeno/database/server', () => ({
  createServerClient: vi.fn(() => ({
    auth: {
      getUser: mockGetUser,
    },
    from: mockFrom,
    storage: {
      from: vi.fn(() => ({
        upload: mockUpload,
        remove: mockRemove,
      })),
    },
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

describe('GET /api/students/[id]/documents', () => {
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

  it('returns all documents for a student', async () => {
    const mockDocuments = [testDocuments.passport, testDocuments.diploma]

    // Mock student verification
    mockSingle.mockResolvedValueOnce({
      data: { id: testStudents.johnDoe.id },
      error: null,
    })

    // Mock documents fetch
    mockOrder.mockResolvedValueOnce({
      data: mockDocuments,
      error: null,
    })

    const request = new Request(`http://localhost/api/students/${testStudents.johnDoe.id}/documents`)
    const response = await getDocuments(request, {
      params: Promise.resolve({ id: testStudents.johnDoe.id }),
    })
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.success).toBe(true)
    expect(data.data).toHaveLength(2)
    expect(data.data[0].file_name).toBe('passport-scan.pdf')
  })

  it('returns empty array when student has no documents', async () => {
    mockSingle.mockResolvedValueOnce({
      data: { id: testStudents.johnDoe.id },
      error: null,
    })

    mockOrder.mockResolvedValueOnce({
      data: [],
      error: null,
    })

    const request = new Request(`http://localhost/api/students/${testStudents.johnDoe.id}/documents`)
    const response = await getDocuments(request, {
      params: Promise.resolve({ id: testStudents.johnDoe.id }),
    })
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.success).toBe(true)
    expect(data.data).toEqual([])
  })

  it('returns 400 if student not found', async () => {
    mockSingle.mockResolvedValueOnce({
      data: null,
      error: { message: 'Not found' },
    })

    const request = new Request('http://localhost/api/students/non-existent-id/documents')
    const response = await getDocuments(request, {
      params: Promise.resolve({ id: 'non-existent-id' }),
    })
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.success).toBe(false)
  })

  it('respects RLS - cannot access documents from different agency', async () => {
    mockSingle.mockResolvedValueOnce({
      data: null,
      error: { message: 'Not found' },
    })

    const request = new Request(`http://localhost/api/students/${testStudents.bobSmith.id}/documents`)
    const response = await getDocuments(request, {
      params: Promise.resolve({ id: testStudents.bobSmith.id }),
    })
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.success).toBe(false)
  })

  it('orders documents by created_at descending (newest first)', async () => {
    mockSingle.mockResolvedValueOnce({
      data: { id: testStudents.johnDoe.id },
      error: null,
    })

    mockOrder.mockResolvedValueOnce({
      data: [],
      error: null,
    })

    const request = new Request(`http://localhost/api/students/${testStudents.johnDoe.id}/documents`)
    await getDocuments(request, {
      params: Promise.resolve({ id: testStudents.johnDoe.id }),
    })

    expect(mockOrder).toHaveBeenCalledWith('created_at', { ascending: false })
  })
})

describe('POST /api/students/[id]/documents', () => {
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

    mockUpload.mockResolvedValue({
      data: { path: 'students/test/document.pdf' },
      error: null,
    })
  })

  it('uploads a valid PDF document', async () => {
    const uploadedDoc = {
      id: 'new-doc-uuid',
      student_id: testStudents.johnDoe.id,
      agency_id: testAgencies.agencyA.id,
      file_name: sampleFiles.validPDF.name,
      file_type: sampleFiles.validPDF.type,
      file_size: sampleFiles.validPDF.size,
      storage_path: 'students/test/document.pdf',
      uploaded_by: testUsers.agencyAAdmin.id,
      created_at: '2025-01-15T12:00:00Z',
    }

    // Mock student verification
    mockSingle.mockResolvedValueOnce({
      data: { id: testStudents.johnDoe.id },
      error: null,
    })

    // Mock document insert
    mockSingle.mockResolvedValueOnce({
      data: uploadedDoc,
      error: null,
    })

    const formData = new FormData()
    formData.append('file', new Blob([sampleFiles.validPDF.buffer]), sampleFiles.validPDF.name)

    const request = new Request(`http://localhost/api/students/${testStudents.johnDoe.id}/documents`, {
      method: 'POST',
      body: formData,
    })

    const response = await uploadDocument(request, {
      params: Promise.resolve({ id: testStudents.johnDoe.id }),
    })
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.success).toBe(true)
    expect(data.data.file_name).toBe(sampleFiles.validPDF.name)
  })

  it('uploads a valid image document', async () => {
    const uploadedDoc = {
      id: 'new-doc-uuid',
      student_id: testStudents.johnDoe.id,
      agency_id: testAgencies.agencyA.id,
      file_name: sampleFiles.validImage.name,
      file_type: sampleFiles.validImage.type,
      file_size: sampleFiles.validImage.size,
      storage_path: 'students/test/image.jpg',
      uploaded_by: testUsers.agencyAAdmin.id,
      created_at: '2025-01-15T12:00:00Z',
    }

    mockSingle.mockResolvedValueOnce({
      data: { id: testStudents.johnDoe.id },
      error: null,
    })

    mockSingle.mockResolvedValueOnce({
      data: uploadedDoc,
      error: null,
    })

    const formData = new FormData()
    formData.append('file', new Blob([sampleFiles.validImage.buffer]), sampleFiles.validImage.name)

    const request = new Request(`http://localhost/api/students/${testStudents.johnDoe.id}/documents`, {
      method: 'POST',
      body: formData,
    })

    const response = await uploadDocument(request, {
      params: Promise.resolve({ id: testStudents.johnDoe.id }),
    })
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.success).toBe(true)
  })

  it('rejects file larger than 10MB', async () => {
    mockSingle.mockResolvedValueOnce({
      data: { id: testStudents.johnDoe.id },
      error: null,
    })

    const formData = new FormData()
    formData.append('file', new Blob([sampleFiles.tooLarge.buffer]), sampleFiles.tooLarge.name)

    const request = new Request(`http://localhost/api/students/${testStudents.johnDoe.id}/documents`, {
      method: 'POST',
      body: formData,
    })

    const response = await uploadDocument(request, {
      params: Promise.resolve({ id: testStudents.johnDoe.id }),
    })
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.success).toBe(false)
    expect(data.error.message).toContain('10MB')
  })

  it('rejects invalid file types', async () => {
    mockSingle.mockResolvedValueOnce({
      data: { id: testStudents.johnDoe.id },
      error: null,
    })

    const formData = new FormData()
    formData.append('file', new Blob([sampleFiles.invalidType.buffer]), sampleFiles.invalidType.name)

    const request = new Request(`http://localhost/api/students/${testStudents.johnDoe.id}/documents`, {
      method: 'POST',
      body: formData,
    })

    const response = await uploadDocument(request, {
      params: Promise.resolve({ id: testStudents.johnDoe.id }),
    })
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.success).toBe(false)
    expect(data.error.message).toContain('file type')
  })

  it('rejects upload when no file provided', async () => {
    mockSingle.mockResolvedValueOnce({
      data: { id: testStudents.johnDoe.id },
      error: null,
    })

    const formData = new FormData()

    const request = new Request(`http://localhost/api/students/${testStudents.johnDoe.id}/documents`, {
      method: 'POST',
      body: formData,
    })

    const response = await uploadDocument(request, {
      params: Promise.resolve({ id: testStudents.johnDoe.id }),
    })
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.success).toBe(false)
    expect(data.error.message).toContain('required')
  })

  it('automatically sets agency_id and uploaded_by from authenticated user', async () => {
    const uploadedDoc = {
      id: 'new-doc-uuid',
      student_id: testStudents.johnDoe.id,
      agency_id: testAgencies.agencyA.id,
      file_name: sampleFiles.validPDF.name,
      file_type: sampleFiles.validPDF.type,
      file_size: sampleFiles.validPDF.size,
      storage_path: 'students/test/document.pdf',
      uploaded_by: testUsers.agencyAAdmin.id,
      created_at: '2025-01-15T12:00:00Z',
    }

    mockSingle.mockResolvedValueOnce({
      data: { id: testStudents.johnDoe.id },
      error: null,
    })

    mockSingle.mockResolvedValueOnce({
      data: uploadedDoc,
      error: null,
    })

    const formData = new FormData()
    formData.append('file', new Blob([sampleFiles.validPDF.buffer]), sampleFiles.validPDF.name)

    const request = new Request(`http://localhost/api/students/${testStudents.johnDoe.id}/documents`, {
      method: 'POST',
      body: formData,
    })

    await uploadDocument(request, {
      params: Promise.resolve({ id: testStudents.johnDoe.id }),
    })

    expect(mockInsert).toHaveBeenCalledWith(
      expect.objectContaining({
        agency_id: testAgencies.agencyA.id,
        uploaded_by: testUsers.agencyAAdmin.id,
        student_id: testStudents.johnDoe.id,
      })
    )
  })
})

describe('DELETE /api/students/[id]/documents/[doc_id]', () => {
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
      delete: mockDelete,
    })

    mockSelect.mockReturnValue({
      eq: mockEq,
    })

    mockEq.mockReturnValue({
      eq: mockEq,
      single: mockSingle,
      select: mockSelect,
    })

    mockRemove.mockResolvedValue({
      data: {},
      error: null,
    })
  })

  it('deletes document and removes from storage', async () => {
    // Mock document fetch
    mockSingle.mockResolvedValueOnce({
      data: testDocuments.passport,
      error: null,
    })

    // Mock document delete
    mockSingle.mockResolvedValueOnce({
      data: testDocuments.passport,
      error: null,
    })

    const request = new Request(
      `http://localhost/api/students/${testStudents.johnDoe.id}/documents/${testDocuments.passport.id}`,
      {
        method: 'DELETE',
      }
    )

    const response = await deleteDocument(request, {
      params: Promise.resolve({
        id: testStudents.johnDoe.id,
        doc_id: testDocuments.passport.id,
      }),
    })
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.success).toBe(true)
    expect(mockDelete).toHaveBeenCalled()
    expect(mockRemove).toHaveBeenCalledWith([testDocuments.passport.storage_path])
  })

  it('returns 400 if document not found', async () => {
    mockSingle.mockResolvedValueOnce({
      data: null,
      error: { message: 'Not found' },
    })

    const request = new Request(
      `http://localhost/api/students/${testStudents.johnDoe.id}/documents/non-existent-id`,
      {
        method: 'DELETE',
      }
    )

    const response = await deleteDocument(request, {
      params: Promise.resolve({
        id: testStudents.johnDoe.id,
        doc_id: 'non-existent-id',
      }),
    })
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.success).toBe(false)
  })

  it('respects RLS - cannot delete document from different agency', async () => {
    mockSingle.mockResolvedValueOnce({
      data: null,
      error: { message: 'Not found' },
    })

    const request = new Request(
      `http://localhost/api/students/${testStudents.johnDoe.id}/documents/${testDocuments.passport.id}`,
      {
        method: 'DELETE',
      }
    )

    const response = await deleteDocument(request, {
      params: Promise.resolve({
        id: testStudents.johnDoe.id,
        doc_id: testDocuments.passport.id,
      }),
    })
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.success).toBe(false)
  })

  it('handles storage deletion failure gracefully', async () => {
    mockSingle.mockResolvedValueOnce({
      data: testDocuments.passport,
      error: null,
    })

    mockRemove.mockResolvedValueOnce({
      data: null,
      error: { message: 'Storage deletion failed' },
    })

    // Should still delete from database even if storage fails
    mockSingle.mockResolvedValueOnce({
      data: testDocuments.passport,
      error: null,
    })

    const request = new Request(
      `http://localhost/api/students/${testStudents.johnDoe.id}/documents/${testDocuments.passport.id}`,
      {
        method: 'DELETE',
      }
    )

    const response = await deleteDocument(request, {
      params: Promise.resolve({
        id: testStudents.johnDoe.id,
        doc_id: testDocuments.passport.id,
      }),
    })
    const data = await response.json()

    // Should still succeed even if storage deletion fails
    expect(response.status).toBe(200)
    expect(mockDelete).toHaveBeenCalled()
  })
})
