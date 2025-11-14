/**
 * Unit tests for Activity Logger
 *
 * Epic 7.2: CSV Export Functionality
 * Task 5: Add Export Tracking
 *
 * Tests the logReportExport function for logging export events
 * to the activity_log table.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { logActivity, logReportExport } from '../activity-logger'
import type { SupabaseClient } from '@supabase/supabase-js'

describe('Activity Logger - Report Export', () => {
  let mockSupabaseClient: SupabaseClient

  beforeEach(() => {
    // Create a mock Supabase client
    mockSupabaseClient = {
      from: vi.fn(),
    } as any
  })

  describe('logReportExport', () => {
    it('logs report export with all metadata', async () => {
      // Mock Supabase responses
      const mockInsert = vi.fn().mockResolvedValue({ error: null })
      const mockSingle = vi.fn().mockResolvedValue({
        data: { first_name: 'John', last_name: 'Doe' },
        error: null,
      })
      const mockEq = vi.fn().mockReturnValue({ single: mockSingle })
      const mockSelect = vi.fn().mockReturnValue({ eq: mockEq })
      const mockFrom = vi.fn((table: string) => {
        if (table === 'users') {
          return { select: mockSelect }
        }
        if (table === 'activity_log') {
          return { insert: mockInsert }
        }
        return {}
      })

      mockSupabaseClient.from = mockFrom as any

      // Call logReportExport
      await logReportExport({
        client: mockSupabaseClient,
        agencyId: 'agency-1',
        userId: 'user-1',
        reportType: 'payment_plans',
        format: 'csv',
        rowCount: 150,
        filters: { date_from: '2025-01-01' },
        columns: ['student_name', 'total_amount'],
      })

      // Verify activity_log insert was called
      expect(mockFrom).toHaveBeenCalledWith('activity_log')
      expect(mockInsert).toHaveBeenCalled()

      // Get the inserted data
      const insertedData = mockInsert.mock.calls[0][0]

      // Verify the structure
      expect(insertedData).toMatchObject({
        agency_id: 'agency-1',
        user_id: 'user-1',
        entity_type: 'report',
        entity_id: '',
        action: 'exported',
      })

      // Verify description includes user name and row count
      expect(insertedData.description).toContain('John Doe')
      expect(insertedData.description).toContain('payment plans')
      expect(insertedData.description).toContain('CSV')
      expect(insertedData.description).toContain('150 rows')

      // Verify metadata
      expect(insertedData.metadata).toMatchObject({
        report_type: 'payment_plans',
        format: 'csv',
        row_count: 150,
        filters: { date_from: '2025-01-01' },
        columns: ['student_name', 'total_amount'],
      })

      // Verify exported_at timestamp exists
      expect(insertedData.metadata.exported_at).toBeDefined()
      expect(typeof insertedData.metadata.exported_at).toBe('string')
    })

    it('handles user fetch errors gracefully', async () => {
      // Mock user fetch error
      const mockInsert = vi.fn().mockResolvedValue({ error: null })
      const mockSingle = vi.fn().mockResolvedValue({
        data: null,
        error: new Error('User not found'),
      })
      const mockEq = vi.fn().mockReturnValue({ single: mockSingle })
      const mockSelect = vi.fn().mockReturnValue({ eq: mockEq })
      const mockFrom = vi.fn((table: string) => {
        if (table === 'users') {
          return { select: mockSelect }
        }
        if (table === 'activity_log') {
          return { insert: mockInsert }
        }
        return {}
      })

      mockSupabaseClient.from = mockFrom as any

      // Call logReportExport
      await logReportExport({
        client: mockSupabaseClient,
        agencyId: 'agency-1',
        userId: 'user-1',
        reportType: 'payment_plans',
        format: 'csv',
        rowCount: 150,
        filters: {},
        columns: [],
      })

      // Should still create activity log with generic user name
      expect(mockInsert).toHaveBeenCalled()
      const insertedData = mockInsert.mock.calls[0][0]
      expect(insertedData.description).toContain('User')
    })

    it('handles logging errors gracefully', async () => {
      // Mock insert error
      const mockInsert = vi.fn().mockResolvedValue({
        error: new Error('Database error'),
      })
      const mockSingle = vi.fn().mockResolvedValue({
        data: { first_name: 'John', last_name: 'Doe' },
        error: null,
      })
      const mockEq = vi.fn().mockReturnValue({ single: mockSingle })
      const mockSelect = vi.fn().mockReturnValue({ eq: mockEq })
      const mockFrom = vi.fn((table: string) => {
        if (table === 'users') {
          return { select: mockSelect }
        }
        if (table === 'activity_log') {
          return { insert: mockInsert }
        }
        return {}
      })

      mockSupabaseClient.from = mockFrom as any

      // Should not throw error
      await expect(
        logReportExport({
          client: mockSupabaseClient,
          agencyId: 'agency-1',
          userId: 'user-1',
          reportType: 'payment_plans',
          format: 'csv',
          rowCount: 150,
          filters: {},
          columns: [],
        })
      ).resolves.not.toThrow()
    })

    it('formats report type with spaces', async () => {
      const mockInsert = vi.fn().mockResolvedValue({ error: null })
      const mockSingle = vi.fn().mockResolvedValue({
        data: { first_name: 'Jane', last_name: 'Smith' },
        error: null,
      })
      const mockEq = vi.fn().mockReturnValue({ single: mockSingle })
      const mockSelect = vi.fn().mockReturnValue({ eq: mockEq })
      const mockFrom = vi.fn((table: string) => {
        if (table === 'users') {
          return { select: mockSelect }
        }
        if (table === 'activity_log') {
          return { insert: mockInsert }
        }
        return {}
      })

      mockSupabaseClient.from = mockFrom as any

      await logReportExport({
        client: mockSupabaseClient,
        agencyId: 'agency-1',
        userId: 'user-1',
        reportType: 'payment_plans',
        format: 'pdf',
        rowCount: 75,
        filters: {},
        columns: [],
      })

      const insertedData = mockInsert.mock.calls[0][0]
      // Should convert payment_plans to "payment plans"
      expect(insertedData.description).toContain('payment plans')
      expect(insertedData.description).toContain('PDF')
    })

    it('includes filters in metadata', async () => {
      const mockInsert = vi.fn().mockResolvedValue({ error: null })
      const mockSingle = vi.fn().mockResolvedValue({
        data: { first_name: 'John', last_name: 'Doe' },
        error: null,
      })
      const mockEq = vi.fn().mockReturnValue({ single: mockSingle })
      const mockSelect = vi.fn().mockReturnValue({ eq: mockEq })
      const mockFrom = vi.fn((table: string) => {
        if (table === 'users') {
          return { select: mockSelect }
        }
        if (table === 'activity_log') {
          return { insert: mockInsert }
        }
        return {}
      })

      mockSupabaseClient.from = mockFrom as any

      const filters = {
        date_from: '2025-01-01',
        date_to: '2025-12-31',
        college_id: 'college-1',
        status: ['active', 'completed'],
      }

      await logReportExport({
        client: mockSupabaseClient,
        agencyId: 'agency-1',
        userId: 'user-1',
        reportType: 'payment_plans',
        format: 'csv',
        rowCount: 200,
        filters,
        columns: ['student_name', 'total_amount', 'status'],
      })

      const insertedData = mockInsert.mock.calls[0][0]
      expect(insertedData.metadata.filters).toEqual(filters)
      expect(insertedData.metadata.columns).toEqual(['student_name', 'total_amount', 'status'])
    })

    it('sets entity_id to empty string for reports', async () => {
      const mockInsert = vi.fn().mockResolvedValue({ error: null })
      const mockSingle = vi.fn().mockResolvedValue({
        data: { first_name: 'John', last_name: 'Doe' },
        error: null,
      })
      const mockEq = vi.fn().mockReturnValue({ single: mockSingle })
      const mockSelect = vi.fn().mockReturnValue({ eq: mockEq })
      const mockFrom = vi.fn((table: string) => {
        if (table === 'users') {
          return { select: mockSelect }
        }
        if (table === 'activity_log') {
          return { insert: mockInsert }
        }
        return {}
      })

      mockSupabaseClient.from = mockFrom as any

      await logReportExport({
        client: mockSupabaseClient,
        agencyId: 'agency-1',
        userId: 'user-1',
        reportType: 'payment_plans',
        format: 'csv',
        rowCount: 100,
        filters: {},
        columns: [],
      })

      const insertedData = mockInsert.mock.calls[0][0]
      expect(insertedData.entity_id).toBe('')
      expect(insertedData.entity_type).toBe('report')
      expect(insertedData.action).toBe('exported')
    })

    it('includes PDF-specific metrics in metadata', async () => {
      const mockInsert = vi.fn().mockResolvedValue({ error: null })
      const mockSingle = vi.fn().mockResolvedValue({
        data: { first_name: 'John', last_name: 'Doe' },
        error: null,
      })
      const mockEq = vi.fn().mockReturnValue({ single: mockSingle })
      const mockSelect = vi.fn().mockReturnValue({ eq: mockEq })
      const mockFrom = vi.fn((table: string) => {
        if (table === 'users') {
          return { select: mockSelect }
        }
        if (table === 'activity_log') {
          return { insert: mockInsert }
        }
        return {}
      })

      mockSupabaseClient.from = mockFrom as any

      await logReportExport({
        client: mockSupabaseClient,
        agencyId: 'agency-1',
        userId: 'user-1',
        reportType: 'payment_plans',
        format: 'pdf',
        rowCount: 90,
        filters: {},
        columns: [],
        pageCount: 3,
        durationMs: 2500,
        fileSizeBytes: 51200,
      })

      const insertedData = mockInsert.mock.calls[0][0]

      // Verify PDF-specific metadata
      expect(insertedData.metadata.page_count).toBe(3)
      expect(insertedData.metadata.duration_ms).toBe(2500)
      expect(insertedData.metadata.file_size_bytes).toBe(51200)

      // Verify description includes page count for PDF
      expect(insertedData.description).toContain('3 pages')
      expect(insertedData.description).toContain('PDF')
      expect(insertedData.description).toContain('90 rows')
    })

    it('omits optional metrics when not provided', async () => {
      const mockInsert = vi.fn().mockResolvedValue({ error: null })
      const mockSingle = vi.fn().mockResolvedValue({
        data: { first_name: 'John', last_name: 'Doe' },
        error: null,
      })
      const mockEq = vi.fn().mockReturnValue({ single: mockSingle })
      const mockSelect = vi.fn().mockReturnValue({ eq: mockEq })
      const mockFrom = vi.fn((table: string) => {
        if (table === 'users') {
          return { select: mockSelect }
        }
        if (table === 'activity_log') {
          return { insert: mockInsert }
        }
        return {}
      })

      mockSupabaseClient.from = mockFrom as any

      await logReportExport({
        client: mockSupabaseClient,
        agencyId: 'agency-1',
        userId: 'user-1',
        reportType: 'payment_plans',
        format: 'csv',
        rowCount: 100,
        filters: {},
        columns: [],
        // No optional metrics provided
      })

      const insertedData = mockInsert.mock.calls[0][0]

      // Verify optional fields are not included
      expect(insertedData.metadata.page_count).toBeUndefined()
      expect(insertedData.metadata.duration_ms).toBeUndefined()
      expect(insertedData.metadata.file_size_bytes).toBeUndefined()

      // Verify base fields are still included
      expect(insertedData.metadata.report_type).toBe('payment_plans')
      expect(insertedData.metadata.format).toBe('csv')
      expect(insertedData.metadata.row_count).toBe(100)
    })
  })

  describe('logActivity', () => {
    it('logs activity with report entity type', async () => {
      const mockInsert = vi.fn().mockResolvedValue({ error: null })
      const mockFrom = vi.fn().mockReturnValue({ insert: mockInsert })

      mockSupabaseClient.from = mockFrom as any

      await logActivity(mockSupabaseClient, {
        agencyId: 'agency-1',
        userId: 'user-1',
        entityType: 'report',
        entityId: '',
        action: 'exported',
        description: 'Test export',
        metadata: { test: true },
      })

      expect(mockFrom).toHaveBeenCalledWith('activity_log')
      expect(mockInsert).toHaveBeenCalledWith({
        agency_id: 'agency-1',
        user_id: 'user-1',
        entity_type: 'report',
        entity_id: '',
        action: 'exported',
        description: 'Test export',
        metadata: { test: true },
      })
    })

    it('handles insert errors gracefully', async () => {
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation()
      const mockInsert = vi.fn().mockResolvedValue({
        error: new Error('Database error'),
      })
      const mockFrom = vi.fn().mockReturnValue({ insert: mockInsert })

      mockSupabaseClient.from = mockFrom as any

      // Should not throw
      await expect(
        logActivity(mockSupabaseClient, {
          agencyId: 'agency-1',
          userId: 'user-1',
          entityType: 'report',
          entityId: '',
          action: 'exported',
          description: 'Test export',
        })
      ).resolves.not.toThrow()

      // Should log error
      expect(consoleErrorSpy).toHaveBeenCalled()

      consoleErrorSpy.mockRestore()
    })
  })
})
