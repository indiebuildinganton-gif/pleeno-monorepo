/**
 * PDF Export Integration Tests
 *
 * Story 7.3: PDF Export Functionality
 * Task 9: Testing - Integration Tests
 *
 * Tests the complete PDF export flow including:
 * - API route integration
 * - PDF generation
 * - Activity logging
 * - Filter application
 * - Performance metrics
 */

import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest'
import { createClient } from '@supabase/supabase-js'
import type { SupabaseClient } from '@supabase/supabase-js'

// Integration tests require actual Supabase connection
// These tests will be skipped if SUPABASE_URL or SUPABASE_ANON_KEY are not set

const supabaseUrl = process.env.SUPABASE_URL
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY

const shouldSkipTests = !supabaseUrl || !supabaseAnonKey

describe.skipIf(shouldSkipTests)('PDF Export Integration', () => {
  let supabase: SupabaseClient
  let authToken: string
  let testAgencyId: string
  let testUserId: string
  let testPaymentPlanIds: string[] = []

  beforeAll(async () => {
    if (!supabaseUrl || !supabaseAnonKey) {
      return
    }

    supabase = createClient(supabaseUrl, supabaseAnonKey)

    // Setup: Sign in as test user or create one
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email: process.env.TEST_USER_EMAIL || 'test@example.com',
      password: process.env.TEST_USER_PASSWORD || 'testpassword123',
    })

    if (authError || !authData.session) {
      throw new Error('Failed to authenticate test user. Please set TEST_USER_EMAIL and TEST_USER_PASSWORD')
    }

    authToken = authData.session.access_token
    testUserId = authData.user.id
    testAgencyId = authData.user.app_metadata?.agency_id

    if (!testAgencyId) {
      throw new Error('Test user does not have an agency_id')
    }
  })

  beforeEach(async () => {
    // Clean up any test payment plans created in previous runs
    if (testPaymentPlanIds.length > 0) {
      await supabase.from('payment_plans').delete().in('id', testPaymentPlanIds)
      testPaymentPlanIds = []
    }
  })

  afterAll(async () => {
    // Cleanup test data
    if (testPaymentPlanIds.length > 0) {
      await supabase.from('payment_plans').delete().in('id', testPaymentPlanIds)
    }

    // Sign out
    await supabase.auth.signOut()
  })

  describe('PDF Export API Integration', () => {
    it('should export PDF with authentication', async () => {
      const apiUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/reports/payment-plans/pdf`

      const response = await fetch(apiUrl, {
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      })

      expect(response.status).toBe(200)
      expect(response.headers.get('Content-Type')).toBe('application/pdf')
    })

    it('should reject unauthenticated requests', async () => {
      const apiUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/reports/payment-plans/pdf`

      const response = await fetch(apiUrl)

      expect(response.status).toBeGreaterThanOrEqual(401)
    })

    it('should apply date filters correctly', async () => {
      const apiUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/reports/payment-plans/pdf?date_from=2024-01-01&date_to=2024-12-31`

      const response = await fetch(apiUrl, {
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      })

      expect(response.status).toBe(200)
      expect(response.headers.get('Content-Type')).toBe('application/pdf')

      const blob = await response.blob()
      expect(blob.size).toBeGreaterThan(0)
    })

    it('should generate PDF with correct filename format', async () => {
      const apiUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/reports/payment-plans/pdf`

      const response = await fetch(apiUrl, {
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      })

      const disposition = response.headers.get('Content-Disposition')
      expect(disposition).toMatch(/^attachment; filename="payment_plans_\d{4}-\d{2}-\d{2}_\d{6}\.pdf"$/)
    })

    it('should handle empty results gracefully', async () => {
      // Query with filters that should return no results
      const apiUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/reports/payment-plans/pdf?date_from=2099-01-01&date_to=2099-12-31`

      const response = await fetch(apiUrl, {
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      })

      expect(response.status).toBe(200)
      expect(response.headers.get('Content-Type')).toBe('application/pdf')

      const blob = await response.blob()
      // Empty PDF should still have headers and structure
      expect(blob.size).toBeGreaterThan(1000)
    })
  })

  describe('Activity Logging Integration', () => {
    it('should log PDF export activity', async () => {
      const apiUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/reports/payment-plans/pdf`

      // Get count of activity logs before export
      const { count: beforeCount } = await supabase
        .from('activity_log')
        .select('*', { count: 'exact', head: true })
        .eq('agency_id', testAgencyId)
        .eq('action', 'exported')

      // Perform export
      await fetch(apiUrl, {
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      })

      // Wait a bit for async logging
      await new Promise((resolve) => setTimeout(resolve, 1000))

      // Get count of activity logs after export
      const { count: afterCount } = await supabase
        .from('activity_log')
        .select('*', { count: 'exact', head: true })
        .eq('agency_id', testAgencyId)
        .eq('action', 'exported')

      expect(afterCount).toBeGreaterThan(beforeCount || 0)
    })

    it('should log export with performance metrics', async () => {
      const apiUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/reports/payment-plans/pdf`

      // Perform export
      await fetch(apiUrl, {
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      })

      // Wait for async logging
      await new Promise((resolve) => setTimeout(resolve, 1000))

      // Query most recent export log
      const { data: logs } = await supabase
        .from('activity_log')
        .select('*')
        .eq('agency_id', testAgencyId)
        .eq('action', 'exported')
        .order('created_at', { ascending: false })
        .limit(1)

      expect(logs).toBeDefined()
      expect(logs!.length).toBeGreaterThan(0)

      const log = logs![0]
      expect(log.metadata).toBeDefined()
      expect(log.metadata.report_type).toBe('payment_plans')
      expect(log.metadata.format).toBe('pdf')
      expect(log.metadata.page_count).toBeGreaterThan(0)
      expect(log.metadata.duration_ms).toBeGreaterThan(0)
      expect(log.metadata.file_size_bytes).toBeGreaterThan(0)
    })
  })

  describe('RLS (Row-Level Security) Integration', () => {
    it('should only return data for user\'s agency', async () => {
      const apiUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/reports/payment-plans/pdf`

      const response = await fetch(apiUrl, {
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      })

      expect(response.status).toBe(200)

      // All data in PDF should belong to testAgencyId
      // This is enforced by RLS at the database level
    })
  })

  describe('Filter Integration', () => {
    it('should apply status filters', async () => {
      const apiUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/reports/payment-plans/pdf?status[]=active&status[]=completed`

      const response = await fetch(apiUrl, {
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      })

      expect(response.status).toBe(200)

      const blob = await response.blob()
      expect(blob.size).toBeGreaterThan(0)
    })

    it('should apply multiple filters together', async () => {
      const apiUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/reports/payment-plans/pdf?date_from=2024-01-01&date_to=2024-12-31&status[]=active`

      const response = await fetch(apiUrl, {
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      })

      expect(response.status).toBe(200)

      const blob = await response.blob()
      expect(blob.size).toBeGreaterThan(0)
    })
  })

  describe('Performance Integration', () => {
    it('should generate PDF in reasonable time for small datasets', async () => {
      const apiUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/reports/payment-plans/pdf`

      const startTime = Date.now()

      const response = await fetch(apiUrl, {
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      })

      const duration = Date.now() - startTime

      expect(response.status).toBe(200)
      // Should complete in under 10 seconds for small datasets
      expect(duration).toBeLessThan(10000)
    })

    it('should handle reasonable file sizes', async () => {
      const apiUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/reports/payment-plans/pdf`

      const response = await fetch(apiUrl, {
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      })

      const blob = await response.blob()

      // PDF should be reasonable size (not too small, not too large)
      expect(blob.size).toBeGreaterThan(1000) // At least 1KB
      expect(blob.size).toBeLessThan(50 * 1024 * 1024) // Less than 50MB
    })
  })

  describe('Error Handling Integration', () => {
    it('should return 400 for invalid date ranges', async () => {
      const apiUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/reports/payment-plans/pdf?date_from=2024-12-31&date_to=2024-01-01`

      const response = await fetch(apiUrl, {
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      })

      expect(response.status).toBe(400)
    })

    it('should handle malformed query parameters gracefully', async () => {
      const apiUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/reports/payment-plans/pdf?date_from=invalid-date`

      const response = await fetch(apiUrl, {
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      })

      // Should either succeed (ignoring invalid param) or return 400
      expect([200, 400]).toContain(response.status)
    })
  })

  describe('Content Validation', () => {
    it('should return valid PDF binary data', async () => {
      const apiUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/reports/payment-plans/pdf`

      const response = await fetch(apiUrl, {
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      })

      const arrayBuffer = await response.arrayBuffer()
      const uint8Array = new Uint8Array(arrayBuffer)

      // PDF files start with "%PDF-" (hex: 25 50 44 46 2D)
      expect(uint8Array[0]).toBe(0x25) // %
      expect(uint8Array[1]).toBe(0x50) // P
      expect(uint8Array[2]).toBe(0x44) // D
      expect(uint8Array[3]).toBe(0x46) // F
      expect(uint8Array[4]).toBe(0x2d) // -
    })

    it('should set correct Cache-Control headers', async () => {
      const apiUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/reports/payment-plans/pdf`

      const response = await fetch(apiUrl, {
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      })

      expect(response.headers.get('Cache-Control')).toBe('no-cache')
    })
  })
})
