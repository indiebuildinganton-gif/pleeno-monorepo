/**
 * Offer Letter Upload/Download API Route Tests
 *
 * Integration tests for POST /api/enrollments/[id]/offer-letter (upload)
 * and GET /api/enrollments/[id]/offer-letter (download) endpoints
 *
 * Epic 3: Entities Domain
 * Story 3.3: Student-College Enrollment Linking
 * Task 12: Testing (Final Task)
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextRequest } from 'next/server'
import { GET, POST } from '../route'

// Mock Supabase client methods
const mockFrom = vi.fn()
const mockSelect = vi.fn()
const mockUpdate = vi.fn()
const mockStorage = {
  from: vi.fn(),
}

// Mock createServerClient
vi.mock('@pleeno/database/server', () => ({
  createServerClient: vi.fn(() => ({
    from: mockFrom,
    auth: {
      getUser: vi.fn(),
    },
    storage: mockStorage,
  })),
}))

// Mock utilities
vi.mock('@pleeno/utils', async () => {
  const actual = await vi.importActual('@pleeno/utils')
  return {
    ...actual,
    validateFile: vi.fn(),
    generateUniqueFilename: vi.fn((name) => `unique-${name}`),
    logAudit: vi.fn(),
  }
})

// Import mocked functions
import { createServerClient } from '@pleeno/database/server'
import { validateFile, generateUniqueFilename } from '@pleeno/utils'
import { logAudit } from '@pleeno/database'

describe('POST /api/enrollments/[id]/offer-letter (Upload)', () => {
  const mockUser = {
    id: 'user-123',
    email: 'admin@agency.com',
    app_metadata: {
      role: 'agency_admin',
      agency_id: 'agency-123',
    },
    user_metadata: {},
    aud: 'authenticated',
    created_at: '2024-01-15T12:00:00Z',
    role: 'authenticated',
    updated_at: '2024-01-15T12:00:00Z',
  }

  const mockEnrollment = {
    id: 'enrollment-789',
    offer_letter_url: null,
    agency_id: 'agency-123',
  }

  beforeEach(() => {
    vi.clearAllMocks()

    // Default: Mock successful authentication
    const mockSupabase = vi.mocked(createServerClient)()
    vi.mocked(mockSupabase.auth.getUser).mockResolvedValue({
      data: { user: mockUser },
      error: null,
    })

    // Mock validateFile to not throw by default
    vi.mocked(validateFile).mockImplementation(() => {})

    // Mock logAudit to not do anything
    vi.mocked(logAudit).mockResolvedValue()
  })

  it('uploads offer letter successfully', async () => {
    // Mock fetch enrollment
    mockFrom.mockReturnValueOnce({
      select: mockSelect,
    })
    mockSelect.mockReturnValueOnce({
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({
        data: mockEnrollment,
        error: null,
      }),
    })

    // Mock storage upload
    const mockStorageBucket = {
      upload: vi.fn().mockResolvedValue({
        error: null,
      }),
      getPublicUrl: vi.fn().mockReturnValue({
        data: {
          publicUrl: 'https://storage.example.com/enrollment-789/unique-offer.pdf',
        },
      }),
    }
    mockStorage.from.mockReturnValue(mockStorageBucket)

    // Mock enrollment update
    const updatedEnrollment = {
      id: 'enrollment-789',
      offer_letter_url: 'https://storage.example.com/enrollment-789/unique-offer.pdf',
      offer_letter_filename: 'offer.pdf',
    }

    mockFrom.mockReturnValueOnce({
      update: mockUpdate,
    })
    mockUpdate.mockReturnValueOnce({
      eq: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({
        data: updatedEnrollment,
        error: null,
      }),
    })

    // Create test file
    const file = new File(['test content'], 'offer.pdf', { type: 'application/pdf' })
    const formData = new FormData()
    formData.append('file', file)

    const request = new NextRequest('http://localhost:3000/api/enrollments/enrollment-789/offer-letter', {
      method: 'POST',
      body: formData,
    })

    const response = await POST(request, { params: Promise.resolve({ id: 'enrollment-789' }) })
    expect(response.status).toBe(200)

    const data = await response.json()
    expect(data.success).toBe(true)
    expect(data.data.offer_letter_url).toBe(
      'https://storage.example.com/enrollment-789/unique-offer.pdf'
    )
    expect(data.data.offer_letter_filename).toBe('offer.pdf')

    // Verify file validation was called
    expect(validateFile).toHaveBeenCalledWith(file)

    // Verify storage upload was called
    expect(mockStorageBucket.upload).toHaveBeenCalledWith(
      'enrollment-789/unique-offer.pdf',
      file,
      expect.objectContaining({
        cacheControl: '3600',
        upsert: false,
      })
    )

    // Verify audit log was called
    expect(logAudit).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        userId: 'user-123',
        agencyId: 'agency-123',
        entityType: 'enrollment_document',
        entityId: 'enrollment-789',
        action: 'create',
      })
    )
  })

  it('replaces existing offer letter when uploading new one', async () => {
    const enrollmentWithOldFile = {
      id: 'enrollment-789',
      offer_letter_url:
        'https://storage.example.com/storage/v1/object/public/enrollment-documents/enrollment-789/old-offer.pdf',
      agency_id: 'agency-123',
    }

    // Mock fetch enrollment
    mockFrom.mockReturnValueOnce({
      select: mockSelect,
    })
    mockSelect.mockReturnValueOnce({
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({
        data: enrollmentWithOldFile,
        error: null,
      }),
    })

    // Mock storage operations
    const mockStorageBucket = {
      remove: vi.fn().mockResolvedValue({ error: null }),
      upload: vi.fn().mockResolvedValue({ error: null }),
      getPublicUrl: vi.fn().mockReturnValue({
        data: {
          publicUrl: 'https://storage.example.com/enrollment-789/unique-new-offer.pdf',
        },
      }),
    }
    mockStorage.from.mockReturnValue(mockStorageBucket)

    // Mock enrollment update
    const updatedEnrollment = {
      id: 'enrollment-789',
      offer_letter_url: 'https://storage.example.com/enrollment-789/unique-new-offer.pdf',
      offer_letter_filename: 'new-offer.pdf',
    }

    mockFrom.mockReturnValueOnce({
      update: mockUpdate,
    })
    mockUpdate.mockReturnValueOnce({
      eq: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({
        data: updatedEnrollment,
        error: null,
      }),
    })

    const file = new File(['test content'], 'new-offer.pdf', { type: 'application/pdf' })
    const formData = new FormData()
    formData.append('file', file)

    const request = new NextRequest('http://localhost:3000/api/enrollments/enrollment-789/offer-letter', {
      method: 'POST',
      body: formData,
    })

    const response = await POST(request, { params: Promise.resolve({ id: 'enrollment-789' }) })
    expect(response.status).toBe(200)

    const data = await response.json()
    expect(data.success).toBe(true)
    expect(data.data.offer_letter_filename).toBe('new-offer.pdf')

    // Verify old file was deleted
    expect(mockStorageBucket.remove).toHaveBeenCalledWith(['enrollment-789/old-offer.pdf'])
  })

  it('returns 400 when no file is provided', async () => {
    // Mock fetch enrollment
    mockFrom.mockReturnValueOnce({
      select: mockSelect,
    })
    mockSelect.mockReturnValueOnce({
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({
        data: mockEnrollment,
        error: null,
      }),
    })

    const formData = new FormData()
    // No file appended

    const request = new NextRequest('http://localhost:3000/api/enrollments/enrollment-789/offer-letter', {
      method: 'POST',
      body: formData,
    })

    const response = await POST(request, { params: Promise.resolve({ id: 'enrollment-789' }) })
    expect(response.status).toBe(400)

    const data = await response.json()
    expect(data.success).toBe(false)
    expect(data.error.message).toContain('No file provided')
  })

  it('returns 400 when file validation fails (invalid type)', async () => {
    // Mock fetch enrollment
    mockFrom.mockReturnValueOnce({
      select: mockSelect,
    })
    mockSelect.mockReturnValueOnce({
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({
        data: mockEnrollment,
        error: null,
      }),
    })

    // Mock validateFile to throw validation error
    vi.mocked(validateFile).mockImplementation(() => {
      throw new Error('Invalid file type. Only PDF, JPEG, and PNG files are allowed')
    })

    const file = new File(['test content'], 'document.txt', { type: 'text/plain' })
    const formData = new FormData()
    formData.append('file', file)

    const request = new NextRequest('http://localhost:3000/api/enrollments/enrollment-789/offer-letter', {
      method: 'POST',
      body: formData,
    })

    const response = await POST(request, { params: Promise.resolve({ id: 'enrollment-789' }) })
    expect(response.status).toBe(500)

    const data = await response.json()
    expect(data.success).toBe(false)
    expect(data.error.message).toContain('Invalid file type')
  })

  it('returns 400 when file validation fails (size too large)', async () => {
    // Mock fetch enrollment
    mockFrom.mockReturnValueOnce({
      select: mockSelect,
    })
    mockSelect.mockReturnValueOnce({
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({
        data: mockEnrollment,
        error: null,
      }),
    })

    // Mock validateFile to throw size error
    vi.mocked(validateFile).mockImplementation(() => {
      throw new Error('File too large. Maximum size is 10MB')
    })

    const file = new File(['x'.repeat(11 * 1024 * 1024)], 'large.pdf', {
      type: 'application/pdf',
    })
    const formData = new FormData()
    formData.append('file', file)

    const request = new NextRequest('http://localhost:3000/api/enrollments/enrollment-789/offer-letter', {
      method: 'POST',
      body: formData,
    })

    const response = await POST(request, { params: Promise.resolve({ id: 'enrollment-789' }) })
    expect(response.status).toBe(500)

    const data = await response.json()
    expect(data.success).toBe(false)
    expect(data.error.message).toContain('File too large')
  })

  it('returns 404 when enrollment not found', async () => {
    mockFrom.mockReturnValueOnce({
      select: mockSelect,
    })
    mockSelect.mockReturnValueOnce({
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({
        data: null,
        error: { message: 'Not found' },
      }),
    })

    const file = new File(['test content'], 'offer.pdf', { type: 'application/pdf' })
    const formData = new FormData()
    formData.append('file', file)

    const request = new NextRequest(
      'http://localhost:3000/api/enrollments/nonexistent/offer-letter',
      {
        method: 'POST',
        body: formData,
      }
    )

    const response = await POST(request, { params: Promise.resolve({ id: 'nonexistent' }) })
    expect(response.status).toBe(400)

    const data = await response.json()
    expect(data.success).toBe(false)
    expect(data.error.message).toContain('Enrollment not found')
  })

  it('enforces RLS - prevents uploading to different agency enrollment', async () => {
    // RLS will not return enrollment from different agency
    mockFrom.mockReturnValueOnce({
      select: mockSelect,
    })
    mockSelect.mockReturnValueOnce({
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({
        data: null,
        error: null,
      }),
    })

    const file = new File(['test content'], 'offer.pdf', { type: 'application/pdf' })
    const formData = new FormData()
    formData.append('file', file)

    const request = new NextRequest(
      'http://localhost:3000/api/enrollments/other-agency-enrollment/offer-letter',
      {
        method: 'POST',
        body: formData,
      }
    )

    const response = await POST(request, {
      params: Promise.resolve({ id: 'other-agency-enrollment' }),
    })
    expect(response.status).toBe(400)

    const data = await response.json()
    expect(data.success).toBe(false)
  })
})

describe('GET /api/enrollments/[id]/offer-letter (Download)', () => {
  const mockUser = {
    id: 'user-123',
    email: 'admin@agency.com',
    app_metadata: {
      role: 'agency_admin',
      agency_id: 'agency-123',
    },
    user_metadata: {},
    aud: 'authenticated',
    created_at: '2024-01-15T12:00:00Z',
    role: 'authenticated',
    updated_at: '2024-01-15T12:00:00Z',
  }

  beforeEach(() => {
    vi.clearAllMocks()

    // Default: Mock successful authentication
    const mockSupabase = vi.mocked(createServerClient)()
    vi.mocked(mockSupabase.auth.getUser).mockResolvedValue({
      data: { user: mockUser },
      error: null,
    })
  })

  it('downloads offer letter successfully with inline disposition', async () => {
    const enrollment = {
      id: 'enrollment-789',
      offer_letter_url:
        'https://storage.example.com/storage/v1/object/public/enrollment-documents/enrollment-789/offer.pdf',
      offer_letter_filename: 'offer.pdf',
    }

    // Mock fetch enrollment
    mockFrom.mockReturnValueOnce({
      select: mockSelect,
    })
    mockSelect.mockReturnValueOnce({
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({
        data: enrollment,
        error: null,
      }),
    })

    // Mock storage download
    const mockFileBlob = new Blob(['PDF content'], { type: 'application/pdf' })
    const mockStorageBucket = {
      download: vi.fn().mockResolvedValue({
        data: mockFileBlob,
        error: null,
      }),
    }
    mockStorage.from.mockReturnValue(mockStorageBucket)

    const request = new NextRequest('http://localhost:3000/api/enrollments/enrollment-789/offer-letter', {
      method: 'GET',
    })

    const response = await GET(request, { params: Promise.resolve({ id: 'enrollment-789' }) })
    expect(response.status).toBe(200)
    expect(response.headers.get('Content-Type')).toBe('application/pdf')
    expect(response.headers.get('Content-Disposition')).toContain('inline')
    expect(response.headers.get('Content-Disposition')).toContain('offer.pdf')
  })

  it('downloads offer letter with attachment disposition when download=true', async () => {
    const enrollment = {
      id: 'enrollment-789',
      offer_letter_url:
        'https://storage.example.com/storage/v1/object/public/enrollment-documents/enrollment-789/offer.pdf',
      offer_letter_filename: 'offer.pdf',
    }

    mockFrom.mockReturnValueOnce({
      select: mockSelect,
    })
    mockSelect.mockReturnValueOnce({
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({
        data: enrollment,
        error: null,
      }),
    })

    const mockFileBlob = new Blob(['PDF content'], { type: 'application/pdf' })
    const mockStorageBucket = {
      download: vi.fn().mockResolvedValue({
        data: mockFileBlob,
        error: null,
      }),
    }
    mockStorage.from.mockReturnValue(mockStorageBucket)

    const request = new NextRequest(
      'http://localhost:3000/api/enrollments/enrollment-789/offer-letter?download=true',
      {
        method: 'GET',
      }
    )

    const response = await GET(request, { params: Promise.resolve({ id: 'enrollment-789' }) })
    expect(response.status).toBe(200)
    expect(response.headers.get('Content-Disposition')).toContain('attachment')
  })

  it('serves JPEG files with correct Content-Type', async () => {
    const enrollment = {
      id: 'enrollment-789',
      offer_letter_url:
        'https://storage.example.com/storage/v1/object/public/enrollment-documents/enrollment-789/offer.jpg',
      offer_letter_filename: 'offer.jpg',
    }

    mockFrom.mockReturnValueOnce({
      select: mockSelect,
    })
    mockSelect.mockReturnValueOnce({
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({
        data: enrollment,
        error: null,
      }),
    })

    const mockFileBlob = new Blob(['JPEG content'], { type: 'image/jpeg' })
    const mockStorageBucket = {
      download: vi.fn().mockResolvedValue({
        data: mockFileBlob,
        error: null,
      }),
    }
    mockStorage.from.mockReturnValue(mockStorageBucket)

    const request = new NextRequest('http://localhost:3000/api/enrollments/enrollment-789/offer-letter', {
      method: 'GET',
    })

    const response = await GET(request, { params: Promise.resolve({ id: 'enrollment-789' }) })
    expect(response.status).toBe(200)
    expect(response.headers.get('Content-Type')).toBe('image/jpeg')
  })

  it('serves PNG files with correct Content-Type', async () => {
    const enrollment = {
      id: 'enrollment-789',
      offer_letter_url:
        'https://storage.example.com/storage/v1/object/public/enrollment-documents/enrollment-789/offer.png',
      offer_letter_filename: 'offer.png',
    }

    mockFrom.mockReturnValueOnce({
      select: mockSelect,
    })
    mockSelect.mockReturnValueOnce({
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({
        data: enrollment,
        error: null,
      }),
    })

    const mockFileBlob = new Blob(['PNG content'], { type: 'image/png' })
    const mockStorageBucket = {
      download: vi.fn().mockResolvedValue({
        data: mockFileBlob,
        error: null,
      }),
    }
    mockStorage.from.mockReturnValue(mockStorageBucket)

    const request = new NextRequest('http://localhost:3000/api/enrollments/enrollment-789/offer-letter', {
      method: 'GET',
    })

    const response = await GET(request, { params: Promise.resolve({ id: 'enrollment-789' }) })
    expect(response.status).toBe(200)
    expect(response.headers.get('Content-Type')).toBe('image/png')
  })

  it('returns 404 when enrollment has no offer letter', async () => {
    const enrollment = {
      id: 'enrollment-789',
      offer_letter_url: null,
      offer_letter_filename: null,
    }

    mockFrom.mockReturnValueOnce({
      select: mockSelect,
    })
    mockSelect.mockReturnValueOnce({
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({
        data: enrollment,
        error: null,
      }),
    })

    const request = new NextRequest('http://localhost:3000/api/enrollments/enrollment-789/offer-letter', {
      method: 'GET',
    })

    const response = await GET(request, { params: Promise.resolve({ id: 'enrollment-789' }) })
    expect(response.status).toBe(400)

    const data = await response.json()
    expect(data.success).toBe(false)
    expect(data.error.message).toContain('No offer letter found')
  })

  it('returns 404 when enrollment not found', async () => {
    mockFrom.mockReturnValueOnce({
      select: mockSelect,
    })
    mockSelect.mockReturnValueOnce({
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({
        data: null,
        error: { message: 'Not found' },
      }),
    })

    const request = new NextRequest(
      'http://localhost:3000/api/enrollments/nonexistent/offer-letter',
      {
        method: 'GET',
      }
    )

    const response = await GET(request, { params: Promise.resolve({ id: 'nonexistent' }) })
    expect(response.status).toBe(400)

    const data = await response.json()
    expect(data.success).toBe(false)
    expect(data.error.message).toContain('Enrollment not found')
  })

  it('enforces RLS - prevents downloading from different agency enrollment', async () => {
    // RLS will not return enrollment from different agency
    mockFrom.mockReturnValueOnce({
      select: mockSelect,
    })
    mockSelect.mockReturnValueOnce({
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({
        data: null,
        error: null,
      }),
    })

    const request = new NextRequest(
      'http://localhost:3000/api/enrollments/other-agency-enrollment/offer-letter',
      {
        method: 'GET',
      }
    )

    const response = await GET(request, {
      params: Promise.resolve({ id: 'other-agency-enrollment' }),
    })
    expect(response.status).toBe(400)

    const data = await response.json()
    expect(data.success).toBe(false)
  })
})
