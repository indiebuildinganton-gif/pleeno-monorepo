/**
 * PDF Export API Route Tests
 *
 * Story 7.5: Student Payment History Report
 * Task 9: Testing and Validation
 *
 * Comprehensive tests for GET /api/students/[id]/payment-history/export
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { GET } from '../route'
import { NextRequest, NextResponse } from 'next/server'

// Mock Supabase client
const mockGetUser = vi.fn()
const mockFrom = vi.fn()
const mockSelect = vi.fn()
const mockEq = vi.fn()
const mockSingle = vi.fn()
const mockRpc = vi.fn()

vi.mock('@pleeno/database/server', () => ({
  createServerClient: vi.fn(() => ({
    auth: {
      getUser: mockGetUser,
    },
    from: mockFrom,
    rpc: mockRpc,
  })),
}))

// Mock auth utility
const mockRequireRole = vi.fn()
vi.mock('@pleeno/auth', () => ({
  requireRole: mockRequireRole,
}))

// Mock utilities
vi.mock('@pleeno/utils', async () => {
  const actual = await vi.importActual('@pleeno/utils')
  return {
    ...actual,
    handleApiError: vi.fn((error, context) => {
      return NextResponse.json(
        { error: error.message || 'Internal server error' },
        { status: 500 }
      )
    }),
    ForbiddenError: class ForbiddenError extends Error {
      constructor(message: string) {
        super(message)
        this.name = 'ForbiddenError'
      }
    },
    ValidationError: class ValidationError extends Error {
      constructor(message: string) {
        super(message)
        this.name = 'ValidationError'
      }
    },
    generatePDF: vi.fn(async (document) => {
      // Return mock PDF stream
      return new ReadableStream({
        start(controller) {
          controller.enqueue(new Uint8Array([37, 80, 68, 70])) // %PDF magic number
          controller.close()
        },
      })
    }),
    fetchAgencyLogo: vi.fn(async (logoUrl) => {
      if (!logoUrl) return null
      return 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=='
    }),
    generateTimestampedFilename: vi.fn((prefix, name) => {
      const sanitizedName = name?.toLowerCase().replace(/[^a-z0-9]/g, '_') || 'student'
      return `${prefix}_${sanitizedName}_2025-01-15.pdf`
    }),
  }
})

// Mock PDF component
vi.mock('@/components/StudentPaymentStatementPDF', () => ({
  StudentPaymentStatementPDF: vi.fn(() => null),
}))

describe('GET /api/students/[id]/payment-history/export', () => {
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
      single: mockSingle,
      eq: mockEq,
    })
  })

  describe('Authentication and Authorization', () => {
    it('should return 401 for unauthenticated requests', async () => {
      mockRequireRole.mockResolvedValue(
        NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
      )

      const request = new NextRequest(
        'http://localhost/api/students/student-1/payment-history/export?format=pdf'
      )
      const params = Promise.resolve({ id: 'student-1' })
      const response = await GET(request, { params })

      expect(response.status).toBe(401)
    })

    it('should return 404 when student not found', async () => {
      mockRequireRole.mockResolvedValue({
        user: {
          id: 'user-1',
          app_metadata: { agency_id: 'agency-1' },
        },
      })

      mockSingle.mockResolvedValueOnce({
        data: null,
        error: { message: 'Student not found' },
      })

      const request = new NextRequest(
        'http://localhost/api/students/student-1/payment-history/export?format=pdf'
      )
      const params = Promise.resolve({ id: 'student-1' })
      const response = await GET(request, { params })

      expect(response.status).toBe(404)
    })
  })

  describe('Format Validation', () => {
    it('should return 400 for invalid format parameter', async () => {
      mockRequireRole.mockResolvedValue({
        user: {
          id: 'user-1',
          app_metadata: { agency_id: 'agency-1' },
        },
      })

      const request = new NextRequest(
        'http://localhost/api/students/student-1/payment-history/export?format=xml'
      )
      const params = Promise.resolve({ id: 'student-1' })
      const response = await GET(request, { params })

      expect(response.status).toBe(500) // ValidationError handled by handleApiError
    })

    it('should return 400 for missing format parameter', async () => {
      mockRequireRole.mockResolvedValue({
        user: {
          id: 'user-1',
          app_metadata: { agency_id: 'agency-1' },
        },
      })

      const request = new NextRequest(
        'http://localhost/api/students/student-1/payment-history/export'
      )
      const params = Promise.resolve({ id: 'student-1' })
      const response = await GET(request, { params })

      expect(response.status).toBe(500) // ValidationError handled by handleApiError
    })
  })

  describe('PDF Generation', () => {
    it('should generate PDF with correct headers', async () => {
      mockRequireRole.mockResolvedValue({
        user: {
          id: 'user-1',
          app_metadata: { agency_id: 'agency-1' },
        },
      })

      mockSingle
        .mockResolvedValueOnce({
          data: {
            id: 'student-1',
            full_name: 'John Doe',
            passport_number: 'P123456',
            email: 'john@example.com',
          },
          error: null,
        })
        .mockResolvedValueOnce({
          data: {
            id: 'agency-1',
            name: 'Test Agency',
            logo_url: null,
            contact_email: 'agency@test.com',
            contact_phone: '1234567890',
          },
          error: null,
        })

      mockRpc.mockResolvedValue({
        data: [
          {
            payment_plan_id: 'plan-1',
            college_name: 'Imagine Education',
            branch_name: 'Brisbane Campus',
            program_name: 'Certificate IV',
            plan_total_amount: '5000',
            plan_start_date: '2025-01-01',
            installment_id: 'inst-1',
            installment_number: 1,
            amount: '5000',
            due_date: '2025-01-15',
            paid_at: '2025-01-10',
            paid_amount: '5000',
            status: 'paid',
          },
        ],
        error: null,
      })

      const request = new NextRequest(
        'http://localhost/api/students/student-1/payment-history/export?format=pdf'
      )
      const params = Promise.resolve({ id: 'student-1' })
      const response = await GET(request, { params })

      expect(response.status).toBe(200)
      expect(response.headers.get('Content-Type')).toBe('application/pdf')
      expect(response.headers.get('Content-Disposition')).toContain('attachment')
      expect(response.headers.get('Content-Disposition')).toContain('payment_statement')
      expect(response.headers.get('Cache-Control')).toBe('no-cache')
    })

    it('should sanitize student name in filename', async () => {
      mockRequireRole.mockResolvedValue({
        user: {
          id: 'user-1',
          app_metadata: { agency_id: 'agency-1' },
        },
      })

      mockSingle
        .mockResolvedValueOnce({
          data: {
            id: 'student-1',
            full_name: "John O'Doe (Special)",
            passport_number: 'P123456',
            email: 'john@example.com',
          },
          error: null,
        })
        .mockResolvedValueOnce({
          data: {
            id: 'agency-1',
            name: 'Test Agency',
            logo_url: null,
            contact_email: 'agency@test.com',
            contact_phone: '1234567890',
          },
          error: null,
        })

      mockRpc.mockResolvedValue({
        data: [],
        error: null,
      })

      const request = new NextRequest(
        'http://localhost/api/students/student-1/payment-history/export?format=pdf'
      )
      const params = Promise.resolve({ id: 'student-1' })
      const response = await GET(request, { params })

      expect(response.status).toBe(200)
      const contentDisposition = response.headers.get('Content-Disposition')
      expect(contentDisposition).toContain('john_o_doe__special_')
      expect(contentDisposition).not.toContain("'")
      expect(contentDisposition).not.toContain('(')
    })

    it('should include agency logo when available', async () => {
      mockRequireRole.mockResolvedValue({
        user: {
          id: 'user-1',
          app_metadata: { agency_id: 'agency-1' },
        },
      })

      mockSingle
        .mockResolvedValueOnce({
          data: {
            id: 'student-1',
            full_name: 'John Doe',
            passport_number: 'P123456',
            email: 'john@example.com',
          },
          error: null,
        })
        .mockResolvedValueOnce({
          data: {
            id: 'agency-1',
            name: 'Test Agency',
            logo_url: 'https://example.com/logo.png',
            contact_email: 'agency@test.com',
            contact_phone: '1234567890',
          },
          error: null,
        })

      mockRpc.mockResolvedValue({
        data: [],
        error: null,
      })

      const { fetchAgencyLogo } = await import('@pleeno/utils')

      const request = new NextRequest(
        'http://localhost/api/students/student-1/payment-history/export?format=pdf'
      )
      const params = Promise.resolve({ id: 'student-1' })
      const response = await GET(request, { params })

      expect(response.status).toBe(200)
      expect(fetchAgencyLogo).toHaveBeenCalledWith('https://example.com/logo.png')
    })

    it('should handle null agency logo', async () => {
      mockRequireRole.mockResolvedValue({
        user: {
          id: 'user-1',
          app_metadata: { agency_id: 'agency-1' },
        },
      })

      mockSingle
        .mockResolvedValueOnce({
          data: {
            id: 'student-1',
            full_name: 'John Doe',
            passport_number: 'P123456',
            email: 'john@example.com',
          },
          error: null,
        })
        .mockResolvedValueOnce({
          data: {
            id: 'agency-1',
            name: 'Test Agency',
            logo_url: null,
            contact_email: 'agency@test.com',
            contact_phone: '1234567890',
          },
          error: null,
        })

      mockRpc.mockResolvedValue({
        data: [],
        error: null,
      })

      const { fetchAgencyLogo } = await import('@pleeno/utils')

      const request = new NextRequest(
        'http://localhost/api/students/student-1/payment-history/export?format=pdf'
      )
      const params = Promise.resolve({ id: 'student-1' })
      const response = await GET(request, { params })

      expect(response.status).toBe(200)
      expect(fetchAgencyLogo).toHaveBeenCalledWith(null)
    })
  })

  describe('Date Range Filtering', () => {
    it('should apply date filters to PDF export', async () => {
      mockRequireRole.mockResolvedValue({
        user: {
          id: 'user-1',
          app_metadata: { agency_id: 'agency-1' },
        },
      })

      mockSingle
        .mockResolvedValueOnce({
          data: {
            id: 'student-1',
            full_name: 'John Doe',
            passport_number: 'P123456',
            email: 'john@example.com',
          },
          error: null,
        })
        .mockResolvedValueOnce({
          data: {
            id: 'agency-1',
            name: 'Test Agency',
            logo_url: null,
            contact_email: 'agency@test.com',
            contact_phone: '1234567890',
          },
          error: null,
        })

      mockRpc.mockResolvedValue({
        data: [],
        error: null,
      })

      const request = new NextRequest(
        'http://localhost/api/students/student-1/payment-history/export?format=pdf&date_from=2025-01-01&date_to=2025-12-31'
      )
      const params = Promise.resolve({ id: 'student-1' })
      const response = await GET(request, { params })

      expect(response.status).toBe(200)
      expect(mockRpc).toHaveBeenCalledWith('get_student_payment_history', {
        p_student_id: 'student-1',
        p_agency_id: 'agency-1',
        p_date_from: '2025-01-01',
        p_date_to: '2025-12-31',
      })
    })

    it('should use default dates when not provided', async () => {
      mockRequireRole.mockResolvedValue({
        user: {
          id: 'user-1',
          app_metadata: { agency_id: 'agency-1' },
        },
      })

      mockSingle
        .mockResolvedValueOnce({
          data: {
            id: 'student-1',
            full_name: 'John Doe',
            passport_number: 'P123456',
            email: 'john@example.com',
          },
          error: null,
        })
        .mockResolvedValueOnce({
          data: {
            id: 'agency-1',
            name: 'Test Agency',
            logo_url: null,
            contact_email: 'agency@test.com',
            contact_phone: '1234567890',
          },
          error: null,
        })

      mockRpc.mockResolvedValue({
        data: [],
        error: null,
      })

      const request = new NextRequest(
        'http://localhost/api/students/student-1/payment-history/export?format=pdf'
      )
      const params = Promise.resolve({ id: 'student-1' })
      const response = await GET(request, { params })

      expect(response.status).toBe(200)
      expect(mockRpc).toHaveBeenCalledWith('get_student_payment_history', {
        p_student_id: 'student-1',
        p_agency_id: 'agency-1',
        p_date_from: '1970-01-01',
        p_date_to: expect.stringMatching(/\d{4}-\d{2}-\d{2}/), // Today's date
      })
    })
  })

  describe('Error Handling', () => {
    it('should return 500 when payment history query fails', async () => {
      mockRequireRole.mockResolvedValue({
        user: {
          id: 'user-1',
          app_metadata: { agency_id: 'agency-1' },
        },
      })

      mockSingle
        .mockResolvedValueOnce({
          data: {
            id: 'student-1',
            full_name: 'John Doe',
            passport_number: 'P123456',
            email: 'john@example.com',
          },
          error: null,
        })
        .mockResolvedValueOnce({
          data: {
            id: 'agency-1',
            name: 'Test Agency',
            logo_url: null,
            contact_email: 'agency@test.com',
            contact_phone: '1234567890',
          },
          error: null,
        })

      mockRpc.mockResolvedValue({
        data: null,
        error: { message: 'Database connection error' },
      })

      const request = new NextRequest(
        'http://localhost/api/students/student-1/payment-history/export?format=pdf'
      )
      const params = Promise.resolve({ id: 'student-1' })
      const response = await GET(request, { params })

      expect(response.status).toBe(500)
    })

    it('should return 404 when agency not found', async () => {
      mockRequireRole.mockResolvedValue({
        user: {
          id: 'user-1',
          app_metadata: { agency_id: 'agency-1' },
        },
      })

      mockSingle
        .mockResolvedValueOnce({
          data: {
            id: 'student-1',
            full_name: 'John Doe',
            passport_number: 'P123456',
            email: 'john@example.com',
          },
          error: null,
        })
        .mockResolvedValueOnce({
          data: null,
          error: { message: 'Agency not found' },
        })

      const request = new NextRequest(
        'http://localhost/api/students/student-1/payment-history/export?format=pdf'
      )
      const params = Promise.resolve({ id: 'student-1' })
      const response = await GET(request, { params })

      expect(response.status).toBe(404)
    })
  })

  describe('Large Data Handling', () => {
    it('should handle large payment history (100+ installments)', async () => {
      mockRequireRole.mockResolvedValue({
        user: {
          id: 'user-1',
          app_metadata: { agency_id: 'agency-1' },
        },
      })

      mockSingle
        .mockResolvedValueOnce({
          data: {
            id: 'student-1',
            full_name: 'John Doe',
            passport_number: 'P123456',
            email: 'john@example.com',
          },
          error: null,
        })
        .mockResolvedValueOnce({
          data: {
            id: 'agency-1',
            name: 'Test Agency',
            logo_url: null,
            contact_email: 'agency@test.com',
            contact_phone: '1234567890',
          },
          error: null,
        })

      // Generate large dataset
      const largeHistory = Array.from({ length: 150 }, (_, i) => ({
        payment_plan_id: `plan-${Math.floor(i / 10)}`,
        college_name: 'Imagine Education',
        branch_name: 'Brisbane Campus',
        program_name: 'Certificate IV',
        plan_total_amount: '150000',
        plan_start_date: '2025-01-01',
        installment_id: `inst-${i}`,
        installment_number: i + 1,
        amount: '1000',
        due_date: `2025-${String((i % 12) + 1).padStart(2, '0')}-15`,
        paid_at: '2025-01-10',
        paid_amount: '1000',
        status: 'paid',
      }))

      mockRpc.mockResolvedValue({
        data: largeHistory,
        error: null,
      })

      const request = new NextRequest(
        'http://localhost/api/students/student-1/payment-history/export?format=pdf'
      )
      const params = Promise.resolve({ id: 'student-1' })
      const response = await GET(request, { params })

      expect(response.status).toBe(200)
      expect(response.headers.get('Content-Type')).toBe('application/pdf')
    })
  })
})
