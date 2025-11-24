/**
 * Overdue Payments API Route Tests
 *
 * Tests for the GET /api/dashboard/overdue-payments endpoint
 * Epic 6: Agency Dashboard
 * Story 6.5: Overdue Payments Summary Widget
 * Task 7: Testing
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextRequest, NextResponse } from 'next/server'
import { GET } from '../route'

// Mock Supabase client
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let mockSupabaseQuery: any

const createMockSupabase = () => {
  return {
    from: (_table: string) => {
      return {
        select: (_columns: string) => {
          return {
            eq: (_column: string, _value: string) => {
              return {
                eq: (_column2: string, _value2: string) => {
                  return {
                    order: (_column3: string, _options: any) => mockSupabaseQuery,
                  }
                },
              }
            },
          }
        },
      }
    },
    auth: {
      getUser: vi.fn(),
    },
  }
}

vi.mock('@pleeno/database/server', () => ({
  createServerClient: vi.fn(() => createMockSupabase()),
}))

// Mock requireRole from @pleeno/auth
vi.mock('@pleeno/auth', () => ({
  requireRole: vi.fn(),
}))

// Import mocked requireRole
import { requireRole } from '@pleeno/auth/server'

describe('GET /api/dashboard/overdue-payments', () => {
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

  beforeEach(() => {
    vi.clearAllMocks()
  })

  // =================================================================
  // AUTHENTICATION & AUTHORIZATION TESTS
  // =================================================================

  describe('Authentication and Authorization', () => {
    it('returns 401 for unauthenticated users', async () => {
      // Mock requireRole to return 401
      vi.mocked(requireRole).mockResolvedValue(
        NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
      )

      const request = new NextRequest('http://localhost:3000/api/dashboard/overdue-payments', {
        method: 'GET',
      })

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

      const request = new NextRequest('http://localhost:3000/api/dashboard/overdue-payments', {
        method: 'GET',
      })

      const response = await GET(request)
      expect(response.status).toBe(403)

      const data = await response.json()
      expect(data.success).toBe(false)
      expect(data.error.message).toContain('not associated with an agency')
    })

    it('allows agency_admin to access overdue payments', async () => {
      // Mock requireRole to return admin user
      vi.mocked(requireRole).mockResolvedValue({
        user: mockUser,
        role: 'agency_admin',
      })

      // Setup query result
      mockSupabaseQuery = { data: [], error: null }

      const request = new NextRequest('http://localhost:3000/api/dashboard/overdue-payments', {
        method: 'GET',
      })

      const response = await GET(request)
      expect(response.status).toBe(200)

      const data = await response.json()
      expect(data.success).toBe(true)
    })

    it('allows agency_user to access overdue payments', async () => {
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

      // Setup query result
      mockSupabaseQuery = { data: [], error: null }

      const request = new NextRequest('http://localhost:3000/api/dashboard/overdue-payments', {
        method: 'GET',
      })

      const response = await GET(request)
      expect(response.status).toBe(200)
    })
  })

  // =================================================================
  // DATA FILTERING & ORDERING TESTS
  // =================================================================

  describe('Data Filtering and Ordering', () => {
    beforeEach(() => {
      // Mock requireRole to return valid admin user
      vi.mocked(requireRole).mockResolvedValue({
        user: mockUser,
        role: 'agency_admin',
      })
    })

    it('returns only overdue installments', async () => {
      const mockOverdueData = [
        {
          id: '1',
          amount: '1000.00',
          student_due_date: '2024-01-01',
          installment_number: 1,
          payment_plan_id: 'plan-1',
          payment_plans: {
            id: 'plan-1',
            enrollment_id: 'enrollment-1',
            enrollments: {
              id: 'enrollment-1',
              student_id: 'student-1',
              college_id: 'college-1',
              students: { id: 'student-1', name: 'John Doe' },
              colleges: { id: 'college-1', name: 'Test College' },
            },
          },
        },
      ]

      mockSupabaseQuery = { data: mockOverdueData, error: null }

      const request = new NextRequest('http://localhost:3000/api/dashboard/overdue-payments', {
        method: 'GET',
      })

      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.data.overdue_payments).toHaveLength(1)

      const payment = data.data.overdue_payments[0]
      expect(payment).toHaveProperty('id')
      expect(payment).toHaveProperty('student_name')
      expect(payment).toHaveProperty('college_name')
      expect(payment).toHaveProperty('amount')
      expect(payment).toHaveProperty('days_overdue')
      expect(payment).toHaveProperty('payment_plan_id')
    })

    it('calculates days_overdue correctly', async () => {
      // Create a date 15 days ago
      const fifteenDaysAgo = new Date()
      fifteenDaysAgo.setDate(fifteenDaysAgo.getDate() - 15)
      const dueDateStr = fifteenDaysAgo.toISOString().split('T')[0]

      const mockOverdueData = [
        {
          id: '1',
          amount: '1000.00',
          student_due_date: dueDateStr,
          installment_number: 1,
          payment_plan_id: 'plan-1',
          payment_plans: {
            id: 'plan-1',
            enrollment_id: 'enrollment-1',
            enrollments: {
              id: 'enrollment-1',
              student_id: 'student-1',
              college_id: 'college-1',
              students: { id: 'student-1', name: 'John Doe' },
              colleges: { id: 'college-1', name: 'Test College' },
            },
          },
        },
      ]

      mockSupabaseQuery = { data: mockOverdueData, error: null }

      const request = new NextRequest('http://localhost:3000/api/dashboard/overdue-payments', {
        method: 'GET',
      })

      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      const payment = data.data.overdue_payments[0]

      // Allow for 1 day variance due to timezone/time differences
      expect(payment.days_overdue).toBeGreaterThanOrEqual(14)
      expect(payment.days_overdue).toBeLessThanOrEqual(16)
    })

    it('calculates totals correctly', async () => {
      const mockOverdueData = [
        {
          id: '1',
          amount: '1000.00',
          student_due_date: '2024-01-01',
          installment_number: 1,
          payment_plan_id: 'plan-1',
          payment_plans: {
            id: 'plan-1',
            enrollment_id: 'enrollment-1',
            enrollments: {
              id: 'enrollment-1',
              student_id: 'student-1',
              college_id: 'college-1',
              students: { id: 'student-1', name: 'John Doe' },
              colleges: { id: 'college-1', name: 'Test College' },
            },
          },
        },
        {
          id: '2',
          amount: '2000.50',
          student_due_date: '2024-01-05',
          installment_number: 2,
          payment_plan_id: 'plan-2',
          payment_plans: {
            id: 'plan-2',
            enrollment_id: 'enrollment-2',
            enrollments: {
              id: 'enrollment-2',
              student_id: 'student-2',
              college_id: 'college-2',
              students: { id: 'student-2', name: 'Jane Smith' },
              colleges: { id: 'college-2', name: 'Another College' },
            },
          },
        },
      ]

      mockSupabaseQuery = { data: mockOverdueData, error: null }

      const request = new NextRequest('http://localhost:3000/api/dashboard/overdue-payments', {
        method: 'GET',
      })

      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.data.total_count).toBe(2)
      expect(data.data.total_amount).toBe(3000.5)
    })

    it('returns empty array when no overdue payments', async () => {
      mockSupabaseQuery = { data: [], error: null }

      const request = new NextRequest('http://localhost:3000/api/dashboard/overdue-payments', {
        method: 'GET',
      })

      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.data.overdue_payments).toEqual([])
      expect(data.data.total_count).toBe(0)
      expect(data.data.total_amount).toBe(0)
    })
  })

  // =================================================================
  // ERROR HANDLING TESTS
  // =================================================================

  describe('Error Handling', () => {
    beforeEach(() => {
      // Mock requireRole to return valid admin user
      vi.mocked(requireRole).mockResolvedValue({
        user: mockUser,
        role: 'agency_admin',
      })
    })

    it('handles database errors gracefully', async () => {
      mockSupabaseQuery = {
        data: null,
        error: { message: 'Database connection failed', code: 'DB_ERROR' },
      }

      const request = new NextRequest('http://localhost:3000/api/dashboard/overdue-payments', {
        method: 'GET',
      })

      const response = await GET(request)

      expect(response.status).toBe(500)

      const data = await response.json()
      expect(data.success).toBe(false)
    })

    it('handles null data with error', async () => {
      mockSupabaseQuery = {
        data: null,
        error: { message: 'Query failed', code: 'QUERY_ERROR' },
      }

      const request = new NextRequest('http://localhost:3000/api/dashboard/overdue-payments', {
        method: 'GET',
      })

      const response = await GET(request)

      expect(response.status).toBe(500)
    })
  })

  // =================================================================
  // RESPONSE FORMAT TESTS
  // =================================================================

  describe('Response Format', () => {
    beforeEach(() => {
      // Mock requireRole to return valid admin user
      vi.mocked(requireRole).mockResolvedValue({
        user: mockUser,
        role: 'agency_admin',
      })

      mockSupabaseQuery = { data: [], error: null }
    })

    it('returns correct response structure', async () => {
      const request = new NextRequest('http://localhost:3000/api/dashboard/overdue-payments', {
        method: 'GET',
      })

      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data).toHaveProperty('success', true)
      expect(data).toHaveProperty('data')
      expect(data.data).toHaveProperty('overdue_payments')
      expect(data.data).toHaveProperty('total_count')
      expect(data.data).toHaveProperty('total_amount')
    })

    it('returns numeric values for counts and amounts', async () => {
      const request = new NextRequest('http://localhost:3000/api/dashboard/overdue-payments', {
        method: 'GET',
      })

      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(typeof data.data.total_count).toBe('number')
      expect(typeof data.data.total_amount).toBe('number')
    })

    it('rounds amounts to 2 decimal places', async () => {
      const mockOverdueData = [
        {
          id: '1',
          amount: '1000.123',
          student_due_date: '2024-01-01',
          installment_number: 1,
          payment_plan_id: 'plan-1',
          payment_plans: {
            id: 'plan-1',
            enrollment_id: 'enrollment-1',
            enrollments: {
              id: 'enrollment-1',
              student_id: 'student-1',
              college_id: 'college-1',
              students: { id: 'student-1', name: 'John Doe' },
              colleges: { id: 'college-1', name: 'Test College' },
            },
          },
        },
        {
          id: '2',
          amount: '2000.456',
          student_due_date: '2024-01-05',
          installment_number: 2,
          payment_plan_id: 'plan-2',
          payment_plans: {
            id: 'plan-2',
            enrollment_id: 'enrollment-2',
            enrollments: {
              id: 'enrollment-2',
              student_id: 'student-2',
              college_id: 'college-2',
              students: { id: 'student-2', name: 'Jane Smith' },
              colleges: { id: 'college-2', name: 'Another College' },
            },
          },
        },
      ]

      mockSupabaseQuery = { data: mockOverdueData, error: null }

      const request = new NextRequest('http://localhost:3000/api/dashboard/overdue-payments', {
        method: 'GET',
      })

      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      // 1000.123 + 2000.456 = 3000.579, rounded to 3000.58
      expect(data.data.total_amount).toBe(3000.58)
    })

    it('includes all required payment fields', async () => {
      const mockOverdueData = [
        {
          id: '1',
          amount: '1000.00',
          student_due_date: '2024-01-01',
          installment_number: 1,
          payment_plan_id: 'plan-1',
          payment_plans: {
            id: 'plan-1',
            enrollment_id: 'enrollment-1',
            enrollments: {
              id: 'enrollment-1',
              student_id: 'student-1',
              college_id: 'college-1',
              students: { id: 'student-1', name: 'John Doe' },
              colleges: { id: 'college-1', name: 'Test College' },
            },
          },
        },
      ]

      mockSupabaseQuery = { data: mockOverdueData, error: null }

      const request = new NextRequest('http://localhost:3000/api/dashboard/overdue-payments', {
        method: 'GET',
      })

      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      const payment = data.data.overdue_payments[0]

      expect(payment).toHaveProperty('id')
      expect(payment).toHaveProperty('student_id')
      expect(payment).toHaveProperty('student_name')
      expect(payment).toHaveProperty('college_id')
      expect(payment).toHaveProperty('college_name')
      expect(payment).toHaveProperty('amount')
      expect(payment).toHaveProperty('days_overdue')
      expect(payment).toHaveProperty('due_date')
      expect(payment).toHaveProperty('payment_plan_id')
      expect(payment).toHaveProperty('installment_number')
    })
  })
})
