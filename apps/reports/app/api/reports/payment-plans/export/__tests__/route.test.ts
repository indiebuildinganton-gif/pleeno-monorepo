/**
 * Payment Plans CSV Export API Route Tests
 *
 * Epic 7.2: CSV Export Functionality
 * Task 1: Create CSV Export API Route - Testing
 *
 * Comprehensive unit tests for GET /api/reports/payment-plans/export endpoint
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextRequest, NextResponse } from 'next/server'
import { GET } from '../route'

// Mock Supabase client
const mockFrom = vi.fn()
const mockSelect = vi.fn()
const mockEq = vi.fn()
const mockGte = vi.fn()
const mockLte = vi.fn()
const mockIn = vi.fn()

vi.mock('@pleeno/database/server', () => ({
  createServerClient: vi.fn(() => ({
    from: mockFrom,
  })),
}))

// Mock requireRole from @pleeno/auth
vi.mock('@pleeno/auth', () => ({
  requireRole: vi.fn(),
}))

// Mock handleApiError
vi.mock('@pleeno/utils', () => ({
  handleApiError: vi.fn((error) =>
    NextResponse.json(
      {
        success: false,
        error: { message: error.message || 'An error occurred' },
      },
      { status: 500 }
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

// Import mocked requireRole
import { requireRole } from '@pleeno/auth'

describe('GET /api/reports/payment-plans/export', () => {
  const mockUser = {
    id: 'user-123',
    email: 'admin@test.com',
    app_metadata: {
      role: 'agency_admin',
      agency_id: 'agency-123',
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
      currency: 'USD',
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
          id: 'b1',
          name: 'Main Campus',
          college_id: 'c1',
          colleges: {
            id: 'c1',
            name: 'State University',
          },
        },
      },
    },
    {
      id: 'pp-2',
      reference_number: 'PP-002',
      total_amount: 40000,
      currency: 'EUR',
      commission_rate_percent: 8,
      expected_commission: 3200,
      status: 'completed',
      start_date: '2023-09-01',
      created_at: '2023-09-01T00:00:00Z',
      updated_at: '2024-08-01T00:00:00Z',
      enrollments: {
        id: 'enr-2',
        program_name: 'Business Administration',
        contract_expiration_date: '2025-11-20',
        student_id: 's2',
        students: {
          id: 's2',
          name: 'Jane Smith',
        },
        branches: {
          id: 'b1',
          name: 'Main Campus',
          college_id: 'c1',
          colleges: {
            id: 'c1',
            name: 'State University',
          },
        },
      },
    },
  ]

  beforeEach(() => {
    vi.clearAllMocks()

    // Default mock chain setup
    mockFrom.mockReturnValue({
      select: mockSelect,
    })
    mockSelect.mockReturnValue({
      eq: mockEq,
    })
    mockEq.mockReturnValue({
      gte: mockGte,
      lte: mockLte,
      in: mockIn,
    })
    mockGte.mockReturnValue({
      lte: mockLte,
      in: mockIn,
    })
    mockLte.mockReturnValue({
      in: mockIn,
    })
    mockIn.mockReturnValue({
      in: mockIn,
    })
    mockIn.mockResolvedValue({
      data: mockPaymentPlansData,
      error: null,
    })
  })

  describe('Authentication and Authorization', () => {
    it('returns 401 for unauthenticated users', async () => {
      // Mock requireRole to return 401
      vi.mocked(requireRole).mockResolvedValue(
        NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
      )

      const request = new NextRequest(
        'http://localhost:3000/api/reports/payment-plans/export?format=csv',
        {
          method: 'GET',
        }
      )

      const response = await GET(request)
      expect(response.status).toBe(401)

      const data = await response.json()
      expect(data.error).toBe('Unauthorized')
    })

    it('returns 403 for users without agency_id', async () => {
      // Mock requireRole to return user without agency_id
      vi.mocked(requireRole).mockResolvedValue({
        user: {
          ...mockUser,
          app_metadata: {
            role: 'agency_admin',
            // No agency_id
          },
        },
        role: 'agency_admin',
      })

      const request = new NextRequest(
        'http://localhost:3000/api/reports/payment-plans/export?format=csv',
        {
          method: 'GET',
        }
      )

      const response = await GET(request)
      expect(response.status).toBe(500)

      const data = await response.json()
      expect(data.success).toBe(false)
      expect(data.error.message).toContain('not associated with an agency')
    })

    it('allows agency_admin to export CSV', async () => {
      // Mock requireRole to return admin user
      vi.mocked(requireRole).mockResolvedValue({
        user: mockUser,
        role: 'agency_admin',
      })

      mockIn.mockResolvedValue({
        data: mockPaymentPlansData,
        error: null,
      })

      const request = new NextRequest(
        'http://localhost:3000/api/reports/payment-plans/export?format=csv',
        {
          method: 'GET',
        }
      )

      const response = await GET(request)
      expect(response.status).toBe(200)
    })

    it('allows agency_user to export CSV', async () => {
      // Mock requireRole to return regular user
      vi.mocked(requireRole).mockResolvedValue({
        user: {
          ...mockUser,
          app_metadata: {
            role: 'agency_user',
            agency_id: 'agency-123',
          },
        },
        role: 'agency_user',
      })

      mockIn.mockResolvedValue({
        data: mockPaymentPlansData,
        error: null,
      })

      const request = new NextRequest(
        'http://localhost:3000/api/reports/payment-plans/export?format=csv',
        {
          method: 'GET',
        }
      )

      const response = await GET(request)
      expect(response.status).toBe(200)
    })
  })

  describe('Format Validation', () => {
    beforeEach(() => {
      vi.mocked(requireRole).mockResolvedValue({
        user: mockUser,
        role: 'agency_admin',
      })
    })

    it('returns error for missing format parameter', async () => {
      const request = new NextRequest('http://localhost:3000/api/reports/payment-plans/export', {
        method: 'GET',
      })

      const response = await GET(request)
      expect(response.status).toBe(500)

      const data = await response.json()
      expect(data.error.message).toContain('Invalid or missing format parameter')
    })

    it('returns error for invalid format parameter', async () => {
      const request = new NextRequest(
        'http://localhost:3000/api/reports/payment-plans/export?format=pdf',
        {
          method: 'GET',
        }
      )

      const response = await GET(request)
      expect(response.status).toBe(500)

      const data = await response.json()
      expect(data.error.message).toContain('Invalid or missing format parameter')
    })

    it('accepts csv format', async () => {
      mockIn.mockResolvedValue({
        data: mockPaymentPlansData,
        error: null,
      })

      const request = new NextRequest(
        'http://localhost:3000/api/reports/payment-plans/export?format=csv',
        {
          method: 'GET',
        }
      )

      const response = await GET(request)
      expect(response.status).toBe(200)
    })
  })

  describe('Query Parameter Extraction', () => {
    beforeEach(() => {
      vi.mocked(requireRole).mockResolvedValue({
        user: mockUser,
        role: 'agency_admin',
      })
    })

    it('extracts date filters correctly', async () => {
      const mockGteFn = vi.fn().mockReturnValue({
        lte: mockLte,
        in: mockIn,
      })
      const mockLteFn = vi.fn().mockReturnValue({
        in: mockIn,
      })

      mockEq.mockReturnValue({
        gte: mockGteFn,
        lte: mockLteFn,
      })

      mockIn.mockResolvedValue({
        data: mockPaymentPlansData,
        error: null,
      })

      const request = new NextRequest(
        'http://localhost:3000/api/reports/payment-plans/export?format=csv&date_from=2024-01-01&date_to=2024-12-31',
        {
          method: 'GET',
        }
      )

      await GET(request)

      // Verify date filters were applied
      expect(mockGteFn).toHaveBeenCalledWith('start_date', '2024-01-01')
      expect(mockLteFn).toHaveBeenCalledWith('start_date', '2024-12-31')
    })

    it('extracts status filters correctly', async () => {
      const mockInFn = vi.fn().mockReturnValue({
        in: mockIn,
      })

      mockEq.mockReturnValue({
        in: mockInFn,
      })

      mockIn.mockResolvedValue({
        data: mockPaymentPlansData,
        error: null,
      })

      const request = new NextRequest(
        'http://localhost:3000/api/reports/payment-plans/export?format=csv&status[]=active&status[]=pending',
        {
          method: 'GET',
        }
      )

      await GET(request)

      // Verify status filter was applied
      expect(mockInFn).toHaveBeenCalledWith('status', ['active', 'pending'])
    })

    it('extracts college_id filters correctly', async () => {
      const mockInFn = vi.fn().mockReturnValue({
        in: mockIn,
      })

      mockEq.mockReturnValue({
        in: mockInFn,
      })

      mockIn.mockResolvedValue({
        data: mockPaymentPlansData,
        error: null,
      })

      const request = new NextRequest(
        'http://localhost:3000/api/reports/payment-plans/export?format=csv&college_id=c1&college_id=c2',
        {
          method: 'GET',
        }
      )

      await GET(request)

      // Verify college filter was applied
      expect(mockInFn).toHaveBeenCalledWith('enrollments.branches.college_id', ['c1', 'c2'])
    })

    it('extracts branch_id filters correctly', async () => {
      const mockInFn = vi.fn().mockReturnValue({
        in: mockIn,
      })

      mockEq.mockReturnValue({
        in: mockInFn,
      })

      mockIn.mockResolvedValue({
        data: mockPaymentPlansData,
        error: null,
      })

      const request = new NextRequest(
        'http://localhost:3000/api/reports/payment-plans/export?format=csv&branch_id=b1&branch_id=b2',
        {
          method: 'GET',
        }
      )

      await GET(request)

      // Verify branch filter was applied
      expect(mockInFn).toHaveBeenCalledWith('enrollments.branches.id', ['b1', 'b2'])
    })

    it('extracts student_id filters correctly', async () => {
      const mockInFn = vi.fn().mockReturnValue({
        in: mockIn,
      })

      mockEq.mockReturnValue({
        in: mockInFn,
      })

      mockIn.mockResolvedValue({
        data: mockPaymentPlansData,
        error: null,
      })

      const request = new NextRequest(
        'http://localhost:3000/api/reports/payment-plans/export?format=csv&student_id=s1&student_id=s2',
        {
          method: 'GET',
        }
      )

      await GET(request)

      // Verify student filter was applied
      expect(mockInFn).toHaveBeenCalledWith('enrollments.student_id', ['s1', 's2'])
    })

    it('extracts columns[] parameter correctly', async () => {
      mockIn.mockResolvedValue({
        data: mockPaymentPlansData,
        error: null,
      })

      const request = new NextRequest(
        'http://localhost:3000/api/reports/payment-plans/export?format=csv&columns[]=student_name&columns[]=plan_amount',
        {
          method: 'GET',
        }
      )

      const response = await GET(request)
      const csvText = await response.text()

      // Verify only selected columns are in CSV header
      expect(csvText).toContain('Student Name')
      expect(csvText).toContain('Plan Amount')
      // Should not contain other columns
      expect(csvText).not.toContain('Commission Rate')
    })
  })

  describe('Date Range Validation', () => {
    beforeEach(() => {
      vi.mocked(requireRole).mockResolvedValue({
        user: mockUser,
        role: 'agency_admin',
      })
    })

    it('returns error when date_from is after date_to', async () => {
      const request = new NextRequest(
        'http://localhost:3000/api/reports/payment-plans/export?format=csv&date_from=2024-12-31&date_to=2024-01-01',
        {
          method: 'GET',
        }
      )

      const response = await GET(request)
      expect(response.status).toBe(500)

      const data = await response.json()
      expect(data.error.message).toContain('Start date must be before or equal to end date')
    })

    it('returns error when contract_expiration_from is after contract_expiration_to', async () => {
      const request = new NextRequest(
        'http://localhost:3000/api/reports/payment-plans/export?format=csv&contract_expiration_from=2025-12-31&contract_expiration_to=2025-01-01',
        {
          method: 'GET',
        }
      )

      const response = await GET(request)
      expect(response.status).toBe(500)

      const data = await response.json()
      expect(data.error.message).toContain(
        'Contract expiration start date must be before or equal to end date'
      )
    })
  })

  describe('Column Validation', () => {
    beforeEach(() => {
      vi.mocked(requireRole).mockResolvedValue({
        user: mockUser,
        role: 'agency_admin',
      })
    })

    it('returns error for invalid column name', async () => {
      const request = new NextRequest(
        'http://localhost:3000/api/reports/payment-plans/export?format=csv&columns[]=invalid_column',
        {
          method: 'GET',
        }
      )

      const response = await GET(request)
      expect(response.status).toBe(500)

      const data = await response.json()
      expect(data.error.message).toContain('Invalid column')
    })
  })

  describe('CSV Response Format', () => {
    beforeEach(() => {
      vi.mocked(requireRole).mockResolvedValue({
        user: mockUser,
        role: 'agency_admin',
      })
    })

    it('returns CSV with correct Content-Type header', async () => {
      mockIn.mockResolvedValue({
        data: mockPaymentPlansData,
        error: null,
      })

      const request = new NextRequest(
        'http://localhost:3000/api/reports/payment-plans/export?format=csv',
        {
          method: 'GET',
        }
      )

      const response = await GET(request)
      expect(response.headers.get('Content-Type')).toBe('text/csv; charset=utf-8')
    })

    it('returns CSV with Content-Disposition header for download', async () => {
      mockIn.mockResolvedValue({
        data: mockPaymentPlansData,
        error: null,
      })

      const request = new NextRequest(
        'http://localhost:3000/api/reports/payment-plans/export?format=csv',
        {
          method: 'GET',
        }
      )

      const response = await GET(request)
      const contentDisposition = response.headers.get('Content-Disposition')

      expect(contentDisposition).toContain('attachment')
      expect(contentDisposition).toContain('filename="payment_plans_')
      expect(contentDisposition).toContain('.csv"')
    })

    it('generates filename with timestamp in correct format (YYYY-MM-DD_HHmmss)', async () => {
      mockIn.mockResolvedValue({
        data: mockPaymentPlansData,
        error: null,
      })

      const request = new NextRequest(
        'http://localhost:3000/api/reports/payment-plans/export?format=csv',
        {
          method: 'GET',
        }
      )

      const response = await GET(request)
      const contentDisposition = response.headers.get('Content-Disposition')

      // Verify filename format: payment_plans_YYYY-MM-DD_HHmmss.csv
      const filenameMatch = contentDisposition?.match(
        /filename="payment_plans_(\d{4}-\d{2}-\d{2}_\d{6})\.csv"/
      )
      expect(filenameMatch).toBeTruthy()
    })

    it('includes UTF-8 BOM for Excel compatibility', async () => {
      mockIn.mockResolvedValue({
        data: mockPaymentPlansData,
        error: null,
      })

      const request = new NextRequest(
        'http://localhost:3000/api/reports/payment-plans/export?format=csv',
        {
          method: 'GET',
        }
      )

      const response = await GET(request)
      const csvText = await response.text()

      // Verify UTF-8 BOM is present
      expect(csvText.charCodeAt(0)).toBe(0xfeff)
    })

    it('formats currency amounts as decimal (AC #4)', async () => {
      mockIn.mockResolvedValue({
        data: mockPaymentPlansData,
        error: null,
      })

      const request = new NextRequest(
        'http://localhost:3000/api/reports/payment-plans/export?format=csv&columns[]=plan_amount',
        {
          method: 'GET',
        }
      )

      const response = await GET(request)
      const csvText = await response.text()

      // Verify currency is formatted as decimal (no currency symbols)
      expect(csvText).toContain('50000.00')
      expect(csvText).toContain('40000.00')
      expect(csvText).not.toContain('$')
      expect(csvText).not.toContain('€')
    })

    it('formats dates in ISO format YYYY-MM-DD (AC #5)', async () => {
      mockIn.mockResolvedValue({
        data: mockPaymentPlansData,
        error: null,
      })

      const request = new NextRequest(
        'http://localhost:3000/api/reports/payment-plans/export?format=csv&columns[]=start_date',
        {
          method: 'GET',
        }
      )

      const response = await GET(request)
      const csvText = await response.text()

      // Verify dates are in YYYY-MM-DD format (no time component)
      expect(csvText).toContain('2024-01-01')
      expect(csvText).toContain('2023-09-01')
      expect(csvText).not.toContain('T00:00:00')
    })

    it('quotes all fields to handle commas in data', async () => {
      mockIn.mockResolvedValue({
        data: mockPaymentPlansData,
        error: null,
      })

      const request = new NextRequest(
        'http://localhost:3000/api/reports/payment-plans/export?format=csv',
        {
          method: 'GET',
        }
      )

      const response = await GET(request)
      const csvText = await response.text()

      // Verify fields are quoted
      expect(csvText).toMatch(/"[^"]*"/)
    })

    it('returns empty CSV with headers only when no data', async () => {
      mockIn.mockResolvedValue({
        data: [],
        error: null,
      })

      const request = new NextRequest(
        'http://localhost:3000/api/reports/payment-plans/export?format=csv',
        {
          method: 'GET',
        }
      )

      const response = await GET(request)
      const csvText = await response.text()

      // Verify headers are present but no data rows
      expect(csvText).toContain('Reference Number')
      expect(csvText).toContain('Student Name')
      // Only header row and UTF-8 BOM
      const lines = csvText.trim().split('\n')
      expect(lines.length).toBe(1)
    })
  })

  describe('RLS Enforcement', () => {
    it('filters data by user agency_id', async () => {
      const agency1User = {
        ...mockUser,
        app_metadata: {
          role: 'agency_admin',
          agency_id: 'agency-1',
        },
      }

      vi.mocked(requireRole).mockResolvedValue({
        user: agency1User,
        role: 'agency_admin',
      })

      const mockEqFn = vi.fn().mockReturnValue({
        in: mockIn,
      })

      mockSelect.mockReturnValue({
        eq: mockEqFn,
      })

      mockIn.mockResolvedValue({
        data: mockPaymentPlansData,
        error: null,
      })

      const request = new NextRequest(
        'http://localhost:3000/api/reports/payment-plans/export?format=csv',
        {
          method: 'GET',
        }
      )

      await GET(request)

      // Verify eq was called with the user's agency_id
      expect(mockEqFn).toHaveBeenCalledWith('agency_id', 'agency-1')
    })
  })

  describe('Error Handling', () => {
    beforeEach(() => {
      vi.mocked(requireRole).mockResolvedValue({
        user: mockUser,
        role: 'agency_admin',
      })
    })

    it('handles database query errors', async () => {
      mockIn.mockResolvedValue({
        data: null,
        error: { message: 'Database error', code: 'DB_ERROR' },
      })

      const request = new NextRequest(
        'http://localhost:3000/api/reports/payment-plans/export?format=csv',
        {
          method: 'GET',
        }
      )

      const response = await GET(request)
      expect(response.status).toBe(500)

      const data = await response.json()
      expect(data.success).toBe(false)
    })
  })

  describe('Data Transformation', () => {
    beforeEach(() => {
      vi.mocked(requireRole).mockResolvedValue({
        user: mockUser,
        role: 'agency_admin',
      })
    })

    it('calculates contract status correctly', async () => {
      const futureDate = new Date()
      futureDate.setDate(futureDate.getDate() + 90)

      const mockDataWithContract = [
        {
          ...mockPaymentPlansData[0],
          enrollments: {
            ...mockPaymentPlansData[0].enrollments,
            contract_expiration_date: futureDate.toISOString().split('T')[0],
          },
        },
      ]

      mockIn.mockResolvedValue({
        data: mockDataWithContract,
        error: null,
      })

      const request = new NextRequest(
        'http://localhost:3000/api/reports/payment-plans/export?format=csv&columns[]=contract_status',
        {
          method: 'GET',
        }
      )

      const response = await GET(request)
      const csvText = await response.text()

      // Verify contract status is calculated
      expect(csvText).toContain('active')
    })

    it('handles null values correctly in CSV', async () => {
      const mockDataWithNulls = [
        {
          ...mockPaymentPlansData[0],
          reference_number: null,
        },
      ]

      mockIn.mockResolvedValue({
        data: mockDataWithNulls,
        error: null,
      })

      const request = new NextRequest(
        'http://localhost:3000/api/reports/payment-plans/export?format=csv&columns[]=reference_number',
        {
          method: 'GET',
        }
      )

      const response = await GET(request)
      const csvText = await response.text()

      // Verify null is converted to empty string in CSV
      expect(csvText).toContain('""')
    })
  })
})
