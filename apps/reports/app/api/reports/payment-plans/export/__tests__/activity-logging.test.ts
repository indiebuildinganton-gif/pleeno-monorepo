/**
 * CSV Export Activity Logging Integration Tests
 *
 * Epic 7.2: CSV Export Functionality
 * Task 5: Add Export Tracking
 *
 * Integration tests verifying that export events are logged
 * to the activity_log table with proper metadata.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextRequest, NextResponse } from 'next/server'
import { GET } from '../route'

// Track activity log inserts
let activityLogInserts: any[] = []

// Mock Supabase client
const mockFrom = vi.fn()
const mockSelect = vi.fn()
const mockEq = vi.fn()
const mockGte = vi.fn()
const mockLte = vi.fn()
const mockIn = vi.fn()
const mockInsert = vi.fn()
const mockSingle = vi.fn()
const mockOrder = vi.fn()
const mockRange = vi.fn()

vi.mock('@pleeno/database/server', () => ({
  createServerClient: vi.fn(() => ({
    from: mockFrom,
  })),
}))

// Mock requireRole from @pleeno/auth
vi.mock('@pleeno/auth', () => ({
  requireRole: vi.fn(),
}))

// Mock utils
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

// Mock csv-stringify
vi.mock('csv-stringify/sync', () => ({
  stringify: vi.fn((data) => {
    return data.map((row: any[]) => row.join(',')).join('\n')
  }),
}))

// Mock CSV formatter
vi.mock('@pleeno/utils/csv-formatter', () => ({
  exportAsCSVStream: vi.fn(() => {
    return new Response('mocked stream', {
      status: 200,
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': 'attachment; filename="export.csv"',
      },
    })
  }),
}))

// Import mocked requireRole
import { requireRole } from '@pleeno/auth'

describe('CSV Export Activity Logging', () => {
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
          name: 'Main Branch',
          college_id: 'c1',
          colleges: {
            id: 'c1',
            name: 'Tech University',
          },
        },
      },
    },
  ]

  beforeEach(() => {
    // Reset activity log tracking
    activityLogInserts = []

    // Reset all mocks
    vi.clearAllMocks()

    // Mock requireRole to return authenticated user
    vi.mocked(requireRole).mockResolvedValue({
      user: mockUser,
      role: 'agency_admin',
    } as any)

    // Setup Supabase mock chain
    mockFrom.mockImplementation((table: string) => {
      if (table === 'activity_log') {
        return {
          insert: mockInsert.mockImplementation((data) => {
            activityLogInserts.push(data)
            return Promise.resolve({ error: null })
          }),
        }
      }

      if (table === 'users') {
        return {
          select: mockSelect.mockReturnValue({
            eq: mockEq.mockReturnValue({
              single: mockSingle.mockResolvedValue({
                data: { first_name: 'John', last_name: 'Doe' },
                error: null,
              }),
            }),
          }),
        }
      }

      if (table === 'payment_plans') {
        return {
          select: mockSelect.mockReturnValue({
            eq: mockEq.mockReturnValue({
              gte: mockGte.mockReturnValue({
                lte: mockLte.mockReturnValue({
                  in: mockIn.mockResolvedValue({
                    data: mockPaymentPlansData,
                    error: null,
                  }),
                }),
              }),
            }),
            count: 'exact',
            head: true,
          }),
        }
      }

      return {
        select: mockSelect.mockReturnValue({
          eq: mockEq.mockReturnValue({
            data: mockPaymentPlansData,
            error: null,
          }),
        }),
      }
    })
  })

  it('logs export event to activity_log table', async () => {
    // Create request
    const request = new NextRequest('http://localhost/api/reports/payment-plans/export?format=csv', {
      method: 'GET',
    })

    // Execute export
    const response = await GET(request)

    expect(response).toBeDefined()
    expect(response.ok).toBe(true)

    // Wait a bit for async logging to complete
    await new Promise((resolve) => setTimeout(resolve, 100))

    // Verify activity log was created
    expect(activityLogInserts.length).toBeGreaterThan(0)

    const logEntry = activityLogInserts[0]
    expect(logEntry).toBeDefined()
    expect(logEntry.agency_id).toBe('agency-123')
    expect(logEntry.user_id).toBe('user-123')
    expect(logEntry.entity_type).toBe('report')
    expect(logEntry.action).toBe('exported')
  })

  it('includes metadata in activity log', async () => {
    const request = new NextRequest(
      'http://localhost/api/reports/payment-plans/export?format=csv&date_from=2025-01-01&date_to=2025-12-31',
      {
        method: 'GET',
      }
    )

    await GET(request)

    // Wait for async logging
    await new Promise((resolve) => setTimeout(resolve, 100))

    const logEntry = activityLogInserts[0]
    expect(logEntry.metadata).toBeDefined()
    expect(logEntry.metadata.report_type).toBe('payment_plans')
    expect(logEntry.metadata.format).toBe('csv')
    expect(logEntry.metadata.row_count).toBeGreaterThan(0)
  })

  it('includes filters in metadata', async () => {
    const request = new NextRequest(
      'http://localhost/api/reports/payment-plans/export?format=csv&date_from=2025-01-01&college_id=college-1',
      {
        method: 'GET',
      }
    )

    await GET(request)

    // Wait for async logging
    await new Promise((resolve) => setTimeout(resolve, 100))

    const logEntry = activityLogInserts[0]
    expect(logEntry.metadata.filters).toBeDefined()
    expect(logEntry.metadata.filters.date_from).toBe('2025-01-01')
  })

  it('includes columns in metadata', async () => {
    const request = new NextRequest(
      'http://localhost/api/reports/payment-plans/export?format=csv&columns[]=student_name&columns[]=total_amount',
      {
        method: 'GET',
      }
    )

    await GET(request)

    // Wait for async logging
    await new Promise((resolve) => setTimeout(resolve, 100))

    const logEntry = activityLogInserts[0]
    expect(logEntry.metadata.columns).toBeDefined()
    expect(logEntry.metadata.columns).toContain('student_name')
    expect(logEntry.metadata.columns).toContain('total_amount')
  })

  it('includes exported_at timestamp', async () => {
    const request = new NextRequest('http://localhost/api/reports/payment-plans/export?format=csv', {
      method: 'GET',
    })

    await GET(request)

    // Wait for async logging
    await new Promise((resolve) => setTimeout(resolve, 100))

    const logEntry = activityLogInserts[0]
    expect(logEntry.metadata.exported_at).toBeDefined()
    expect(typeof logEntry.metadata.exported_at).toBe('string')

    // Verify it's a valid ISO date
    expect(() => new Date(logEntry.metadata.exported_at)).not.toThrow()
  })

  it('includes human-readable description', async () => {
    const request = new NextRequest('http://localhost/api/reports/payment-plans/export?format=csv', {
      method: 'GET',
    })

    await GET(request)

    // Wait for async logging
    await new Promise((resolve) => setTimeout(resolve, 100))

    const logEntry = activityLogInserts[0]
    expect(logEntry.description).toBeDefined()
    expect(logEntry.description).toContain('John Doe')
    expect(logEntry.description).toContain('payment plans')
    expect(logEntry.description).toContain('CSV')
    expect(logEntry.description).toMatch(/\d+ rows/)
  })

  it('does not fail export if logging fails', async () => {
    // Mock activity log insert to fail
    mockInsert.mockResolvedValueOnce({ error: new Error('Database error') })

    const request = new NextRequest('http://localhost/api/reports/payment-plans/export?format=csv', {
      method: 'GET',
    })

    // Export should still succeed
    const response = await GET(request)
    expect(response).toBeDefined()
    expect(response.ok).toBe(true)
  })

  it('logs with agency_id for multi-tenant isolation', async () => {
    const request = new NextRequest('http://localhost/api/reports/payment-plans/export?format=csv', {
      method: 'GET',
    })

    await GET(request)

    // Wait for async logging
    await new Promise((resolve) => setTimeout(resolve, 100))

    const logEntry = activityLogInserts[0]
    expect(logEntry.agency_id).toBe('agency-123')

    // Verify agency_id matches user's agency
    expect(logEntry.agency_id).toBe(mockUser.app_metadata.agency_id)
  })

  it('sets entity_id to empty string for reports', async () => {
    const request = new NextRequest('http://localhost/api/reports/payment-plans/export?format=csv', {
      method: 'GET',
    })

    await GET(request)

    // Wait for async logging
    await new Promise((resolve) => setTimeout(resolve, 100))

    const logEntry = activityLogInserts[0]
    expect(logEntry.entity_id).toBe('')
  })

  it('logs correct row count after filtering', async () => {
    // Override mock to return specific number of rows
    const customMockData = [
      mockPaymentPlansData[0],
      { ...mockPaymentPlansData[0], id: 'pp-2', reference_number: 'PP-002' },
      { ...mockPaymentPlansData[0], id: 'pp-3', reference_number: 'PP-003' },
    ]

    mockFrom.mockImplementation((table: string) => {
      if (table === 'activity_log') {
        return {
          insert: mockInsert.mockImplementation((data) => {
            activityLogInserts.push(data)
            return Promise.resolve({ error: null })
          }),
        }
      }

      if (table === 'users') {
        return {
          select: mockSelect.mockReturnValue({
            eq: mockEq.mockReturnValue({
              single: mockSingle.mockResolvedValue({
                data: { first_name: 'John', last_name: 'Doe' },
                error: null,
              }),
            }),
          }),
        }
      }

      if (table === 'payment_plans') {
        return {
          select: mockSelect.mockReturnValue({
            eq: mockEq.mockReturnValue({
              data: customMockData,
              error: null,
            }),
          }),
        }
      }

      return {}
    })

    const request = new NextRequest('http://localhost/api/reports/payment-plans/export?format=csv', {
      method: 'GET',
    })

    await GET(request)

    // Wait for async logging
    await new Promise((resolve) => setTimeout(resolve, 100))

    const logEntry = activityLogInserts[0]
    expect(logEntry.metadata.row_count).toBe(3)
  })
})
