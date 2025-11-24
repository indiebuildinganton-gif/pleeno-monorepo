/**
 * Payment Plans PDF Export API Route Tests
 *
 * Story 7.3: PDF Export Functionality
 * Task 9: Testing - API Route Unit Tests
 *
 * Comprehensive unit tests for GET /api/reports/payment-plans/pdf endpoint
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { NextRequest, NextResponse } from 'next/server'
import { GET } from '../route'

// Mock Supabase client
const mockFrom = vi.fn()
const mockSelect = vi.fn()
const mockEq = vi.fn()
const mockGte = vi.fn()
const mockLte = vi.fn()
const mockIn = vi.fn()
const mockOrder = vi.fn()

vi.mock('@pleeno/database/server', () => ({
  createServerClient: vi.fn(() => ({
    from: mockFrom,
  })),
}))

// Mock requireRole from @pleeno/auth
vi.mock('@pleeno/auth', () => ({
  requireRole: vi.fn(),
}))

// Mock @react-pdf/renderer
vi.mock('@react-pdf/renderer', () => ({
  renderToBuffer: vi.fn(() => Promise.resolve(Buffer.from('fake-pdf-content'))),
}))

// Mock PDFReportDocument and utilities
vi.mock('@pleeno/ui', () => ({
  PDFReportDocument: vi.fn(() => null),
  generatePDFFilename: vi.fn(() => 'payment_plans_2025-11-14_143000.pdf'),
}))

// Mock activity logger
vi.mock('@pleeno/database/activity-logger', () => ({
  logReportExport: vi.fn().mockResolvedValue(undefined),
}))

// Mock handleApiError
vi.mock('@pleeno/utils', () => ({
  handleApiError: vi.fn((error) =>
    NextResponse.json(
      {
        success: false,
        error: { message: error.message || 'An error occurred' },
      },
      { status: error.name === 'ValidationError' ? 400 : 500 }
    )
  ),
  ForbiddenError: class ForbiddenError extends Error {
    constructor(message: string) {
      super(message)
      this.name = 'ForbiddenError'
    }
  },
  ValidationError: class ValidationError extends Error {
    constructor(
      message: string,
      public details?: any
    ) {
      super(message)
      this.name = 'ValidationError'
    }
  },
  calculateExpectedCommission: vi.fn((amount, rate) => (amount * rate) / 100),
}))

// Import mocked modules
import { requireRole } from '@pleeno/auth/server'
import { renderToBuffer } from '@react-pdf/renderer'
import { logReportExport } from '@pleeno/database/activity-logger'
import { PDFReportDocument, generatePDFFilename } from '@pleeno/ui'

describe('GET /api/reports/payment-plans/pdf', () => {
  const mockUser = {
    id: 'user-123',
    email: 'admin@test.com',
    app_metadata: {
      role: 'agency_admin',
      agency_id: 'agency-123',
      agency_name: 'Test Agency',
    },
    user_metadata: {},
    aud: 'authenticated',
    created_at: new Date().toISOString(),
    role: 'authenticated',
    updated_at: new Date().toISOString(),
  }

  const mockPaymentPlansData = [
    {
      id: 'pp-1',
      reference_number: 'PP-001',
      total_amount: 50000,
      currency: 'AUD',
      commission_rate_percent: 10,
      expected_commission: 5000,
      status: 'active',
      start_date: '2024-01-01',
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-06-01T00:00:00Z',
      enrollments: {
        id: 'enr-1',
        program_name: 'Computer Science',
        contract_expiration_date: '2025-12-31',
        student_id: 's1',
        students: {
          id: 's1',
          name: 'John Doe',
        },
        branches: {
          id: 'branch-1',
          name: 'Sydney Campus',
          college_id: 'college-1',
          colleges: {
            id: 'college-1',
            name: 'Tech University',
          },
        },
      },
    },
    {
      id: 'pp-2',
      reference_number: 'PP-002',
      total_amount: 75000,
      currency: 'AUD',
      commission_rate_percent: 12,
      expected_commission: 9000,
      status: 'completed',
      start_date: '2024-02-01',
      created_at: '2024-02-01T00:00:00Z',
      updated_at: '2024-07-01T00:00:00Z',
      enrollments: {
        id: 'enr-2',
        program_name: 'Business Administration',
        contract_expiration_date: '2026-01-31',
        student_id: 's2',
        students: {
          id: 's2',
          name: 'Jane Smith',
        },
        branches: {
          id: 'branch-2',
          name: 'Melbourne Campus',
          college_id: 'college-1',
          colleges: {
            id: 'college-1',
            name: 'Tech University',
          },
        },
      },
    },
  ]

  beforeEach(() => {
    vi.clearAllMocks()

    // Setup default mock behavior
    ;(requireRole as any).mockResolvedValue({ user: mockUser })

    // Chain mock methods
    mockOrder.mockReturnValue(Promise.resolve({ data: mockPaymentPlansData, error: null }))
    mockIn.mockReturnValue({ order: mockOrder })
    mockLte.mockReturnValue({ in: mockIn, order: mockOrder })
    mockGte.mockReturnValue({ lte: mockLte, in: mockIn, order: mockOrder })
    mockEq.mockReturnValue({ gte: mockGte, lte: mockLte, in: mockIn, order: mockOrder })
    mockSelect.mockReturnValue({ eq: mockEq })
    mockFrom.mockReturnValue({ select: mockSelect })
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('Authentication & Authorization', () => {
    it('should require authentication', async () => {
      const unauthorizedResponse = NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
      ;(requireRole as any).mockResolvedValue(unauthorizedResponse)

      const request = new NextRequest(
        'http://localhost:3000/api/reports/payment-plans/pdf?format=pdf'
      )
      const response = await GET(request)

      expect(requireRole).toHaveBeenCalledWith(request, ['agency_admin', 'agency_user'])
      expect(response).toBe(unauthorizedResponse)
    })

    it('should enforce RLS by filtering by agency_id', async () => {
      const request = new NextRequest('http://localhost:3000/api/reports/payment-plans/pdf')
      await GET(request)

      expect(mockEq).toHaveBeenCalledWith('agency_id', 'agency-123')
    })

    it('should return error if user has no agency_id', async () => {
      const userWithoutAgency = { ...mockUser, app_metadata: { role: 'agency_admin' } }
      ;(requireRole as any).mockResolvedValue({ user: userWithoutAgency })

      const request = new NextRequest('http://localhost:3000/api/reports/payment-plans/pdf')
      const response = await GET(request)

      expect(response.status).toBe(500)
    })
  })

  describe('PDF Generation', () => {
    it('should return PDF with correct Content-Type header', async () => {
      const request = new NextRequest('http://localhost:3000/api/reports/payment-plans/pdf')
      const response = await GET(request)

      expect(response.headers.get('Content-Type')).toBe('application/pdf')
    })

    it('should include filename with timestamp in Content-Disposition', async () => {
      const request = new NextRequest('http://localhost:3000/api/reports/payment-plans/pdf')
      const response = await GET(request)

      const disposition = response.headers.get('Content-Disposition')
      expect(disposition).toContain('attachment; filename="payment_plans_2025-11-14_143000.pdf"')
    })

    it('should return 200 status for successful PDF generation', async () => {
      const request = new NextRequest('http://localhost:3000/api/reports/payment-plans/pdf')
      const response = await GET(request)

      expect(response.status).toBe(200)
    })

    it('should generate PDF document with correct props', async () => {
      const request = new NextRequest('http://localhost:3000/api/reports/payment-plans/pdf')
      await GET(request)

      expect(PDFReportDocument).toHaveBeenCalledWith(
        expect.objectContaining({
          header: expect.objectContaining({
            title: 'Payment Plans Report',
            subtitle: 'Commission Tracking and Analysis',
            agencyName: 'Test Agency',
          }),
          columns: expect.any(Array),
          data: expect.any(Array),
          currency: 'AUD',
          rowsPerPage: 30,
        })
      )
    })

    it('should render PDF to buffer', async () => {
      const request = new NextRequest('http://localhost:3000/api/reports/payment-plans/pdf')
      await GET(request)

      expect(renderToBuffer).toHaveBeenCalled()
    })
  })

  describe('Query Filters', () => {
    it('should apply date range filters', async () => {
      const request = new NextRequest(
        'http://localhost:3000/api/reports/payment-plans/pdf?date_from=2024-01-01&date_to=2024-12-31'
      )
      await GET(request)

      expect(mockGte).toHaveBeenCalledWith('start_date', '2024-01-01')
      expect(mockLte).toHaveBeenCalledWith('start_date', '2024-12-31')
    })

    it('should apply status filters', async () => {
      const request = new NextRequest(
        'http://localhost:3000/api/reports/payment-plans/pdf?status[]=active&status[]=completed'
      )
      await GET(request)

      expect(mockIn).toHaveBeenCalledWith('status', ['active', 'completed'])
    })

    it('should apply student_id filters', async () => {
      const request = new NextRequest(
        'http://localhost:3000/api/reports/payment-plans/pdf?student_id=s1&student_id=s2'
      )
      await GET(request)

      expect(mockIn).toHaveBeenCalledWith('enrollments.student_id', ['s1', 's2'])
    })

    it('should apply branch_id filters', async () => {
      const request = new NextRequest(
        'http://localhost:3000/api/reports/payment-plans/pdf?branch_id=b1&branch_id=b2'
      )
      await GET(request)

      expect(mockIn).toHaveBeenCalledWith('enrollments.branches.id', ['b1', 'b2'])
    })

    it('should apply college_id filters', async () => {
      const request = new NextRequest(
        'http://localhost:3000/api/reports/payment-plans/pdf?college_id=c1&college_id=c2'
      )
      await GET(request)

      expect(mockIn).toHaveBeenCalledWith('enrollments.branches.college_id', ['c1', 'c2'])
    })

    it('should order results by start_date descending', async () => {
      const request = new NextRequest('http://localhost:3000/api/reports/payment-plans/pdf')
      await GET(request)

      expect(mockOrder).toHaveBeenCalledWith('start_date', { ascending: false })
    })
  })

  describe('Input Validation', () => {
    it('should return 400 for invalid date range (start after end)', async () => {
      const request = new NextRequest(
        'http://localhost:3000/api/reports/payment-plans/pdf?date_from=2024-12-31&date_to=2024-01-01'
      )
      const response = await GET(request)

      expect(response.status).toBe(400)
    })

    it('should return 400 for invalid contract expiration range', async () => {
      const request = new NextRequest(
        'http://localhost:3000/api/reports/payment-plans/pdf?contract_expiration_from=2025-12-31&contract_expiration_to=2025-01-01'
      )
      const response = await GET(request)

      expect(response.status).toBe(400)
    })
  })

  describe('Edge Cases', () => {
    it('should handle empty dataset with headers-only PDF', async () => {
      mockOrder.mockReturnValue(Promise.resolve({ data: [], error: null }))

      const request = new NextRequest('http://localhost:3000/api/reports/payment-plans/pdf')
      const response = await GET(request)

      expect(response.status).toBe(200)
      expect(response.headers.get('Content-Type')).toBe('application/pdf')

      // Should still generate PDF with empty data
      expect(PDFReportDocument).toHaveBeenCalledWith(
        expect.objectContaining({
          data: [],
        })
      )
    })

    it('should handle null payment plans data', async () => {
      mockOrder.mockReturnValue(Promise.resolve({ data: null, error: null }))

      const request = new NextRequest('http://localhost:3000/api/reports/payment-plans/pdf')
      const response = await GET(request)

      expect(response.status).toBe(200)
      expect(PDFReportDocument).toHaveBeenCalledWith(
        expect.objectContaining({
          data: [],
        })
      )
    })

    it('should handle database errors gracefully', async () => {
      mockOrder.mockReturnValue(
        Promise.resolve({
          data: null,
          error: { message: 'Database connection failed' },
        })
      )

      const request = new NextRequest('http://localhost:3000/api/reports/payment-plans/pdf')
      const response = await GET(request)

      expect(response.status).toBe(500)
    })

    it('should handle large datasets (100+ rows)', async () => {
      const largeDataset = Array.from({ length: 150 }, (_, i) => ({
        ...mockPaymentPlansData[0],
        id: `pp-${i}`,
        reference_number: `PP-${String(i).padStart(3, '0')}`,
      }))

      mockOrder.mockReturnValue(Promise.resolve({ data: largeDataset, error: null }))

      const request = new NextRequest('http://localhost:3000/api/reports/payment-plans/pdf')
      const response = await GET(request)

      expect(response.status).toBe(200)
      expect(PDFReportDocument).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.arrayContaining([expect.any(Object)]),
          rowsPerPage: 30,
        })
      )
    })
  })

  describe('Activity Logging', () => {
    it('should log export activity with performance metrics', async () => {
      const request = new NextRequest('http://localhost:3000/api/reports/payment-plans/pdf')
      await GET(request)

      expect(logReportExport).toHaveBeenCalledWith(
        expect.objectContaining({
          agencyId: 'agency-123',
          userId: 'user-123',
          reportType: 'payment_plans',
          format: 'pdf',
          rowCount: 2,
          pageCount: 1,
          durationMs: expect.any(Number),
          fileSizeBytes: expect.any(Number),
        })
      )
    })

    it('should calculate correct page count for large datasets', async () => {
      const largeDataset = Array.from({ length: 90 }, (_, i) => ({
        ...mockPaymentPlansData[0],
        id: `pp-${i}`,
      }))

      mockOrder.mockReturnValue(Promise.resolve({ data: largeDataset, error: null }))

      const request = new NextRequest('http://localhost:3000/api/reports/payment-plans/pdf')
      await GET(request)

      // 90 rows / 30 per page = 3 pages
      expect(logReportExport).toHaveBeenCalledWith(
        expect.objectContaining({
          pageCount: 3,
        })
      )
    })

    it('should log even if export activity logging fails', async () => {
      ;(logReportExport as any).mockRejectedValue(new Error('Logging failed'))

      const request = new NextRequest('http://localhost:3000/api/reports/payment-plans/pdf')
      const response = await GET(request)

      // Should still return successful PDF despite logging failure
      expect(response.status).toBe(200)
    })

    it('should include filters in activity log', async () => {
      const request = new NextRequest(
        'http://localhost:3000/api/reports/payment-plans/pdf?date_from=2024-01-01&status[]=active'
      )
      await GET(request)

      expect(logReportExport).toHaveBeenCalledWith(
        expect.objectContaining({
          filters: expect.objectContaining({
            date_from: '2024-01-01',
            status: ['active'],
          }),
        })
      )
    })

    it('should track export duration', async () => {
      const request = new NextRequest('http://localhost:3000/api/reports/payment-plans/pdf')
      await GET(request)

      expect(logReportExport).toHaveBeenCalledWith(
        expect.objectContaining({
          durationMs: expect.any(Number),
        })
      )

      const callArgs = (logReportExport as any).mock.calls[0][0]
      expect(callArgs.durationMs).toBeGreaterThanOrEqual(0)
    })

    it('should track file size', async () => {
      const request = new NextRequest('http://localhost:3000/api/reports/payment-plans/pdf')
      await GET(request)

      expect(logReportExport).toHaveBeenCalledWith(
        expect.objectContaining({
          fileSizeBytes: expect.any(Number),
        })
      )

      const callArgs = (logReportExport as any).mock.calls[0][0]
      expect(callArgs.fileSizeBytes).toBeGreaterThan(0)
    })
  })

  describe('Performance', () => {
    it('should complete export in reasonable time', async () => {
      const startTime = Date.now()

      const request = new NextRequest('http://localhost:3000/api/reports/payment-plans/pdf')
      await GET(request)

      const duration = Date.now() - startTime

      // Should complete in under 1 second for mock data
      expect(duration).toBeLessThan(1000)
    })
  })

  describe('Response Headers', () => {
    it('should include Cache-Control: no-cache header', async () => {
      const request = new NextRequest('http://localhost:3000/api/reports/payment-plans/pdf')
      const response = await GET(request)

      expect(response.headers.get('Cache-Control')).toBe('no-cache')
    })

    it('should return binary PDF data', async () => {
      const request = new NextRequest('http://localhost:3000/api/reports/payment-plans/pdf')
      const response = await GET(request)

      const buffer = await response.arrayBuffer()
      expect(buffer.byteLength).toBeGreaterThan(0)
    })
  })
})
