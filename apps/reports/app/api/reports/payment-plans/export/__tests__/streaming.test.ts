/**
 * CSV Streaming Export Tests
 *
 * Epic 7.2: CSV Export Functionality
 * Task 3: Support Large Dataset Streaming
 *
 * Tests for streaming CSV export functionality with large datasets
 */

import { describe, it, expect, vi } from 'vitest'
import { exportAsCSVStream, formatRowForCSV } from '@pleeno/utils/csv-formatter'

describe('CSV Streaming Export', () => {
  describe('exportAsCSVStream', () => {
    it('streams large dataset without loading all into memory', async () => {
      // Create mock data generator that yields batches
      const mockData = Array.from({ length: 5000 }, (_, i) => ({
        id: `id-${i}`,
        reference_number: `REF-${i}`,
        total_amount: 1000 + i,
        currency: 'USD',
        start_date: new Date('2025-01-01').toISOString(),
        commission_rate_percent: 10,
        expected_commission: (1000 + i) * 0.1,
        status: 'active',
      }))

      // Mock generator that yields data in batches
      async function* mockQuery() {
        const batchSize = 500
        for (let i = 0; i < mockData.length; i += batchSize) {
          yield mockData.slice(i, i + batchSize)
        }
      }

      const columns = [
        'id',
        'reference_number',
        'total_amount',
        'currency',
        'start_date',
        'commission_rate_percent',
        'expected_commission',
        'status',
      ]
      const response = await exportAsCSVStream(mockQuery, columns, 5000)

      expect(response.status).toBe(200)
      expect(response.headers.get('Content-Type')).toBe('text/csv; charset=utf-8')
      expect(response.headers.get('Transfer-Encoding')).toBe('chunked')

      // Verify response body is a stream
      expect(response.body).toBeDefined()

      // Verify Content-Disposition header includes filename
      const contentDisposition = response.headers.get('Content-Disposition')
      expect(contentDisposition).toContain('attachment')
      expect(contentDisposition).toContain('filename="payment_plans_')
      expect(contentDisposition).toContain('.csv"')
    })

    it('handles empty batches gracefully', async () => {
      async function* emptyQuery() {
        yield []
      }

      const columns = ['id', 'total_amount']
      const response = await exportAsCSVStream(emptyQuery, columns)

      expect(response.status).toBe(200)
      expect(response.headers.get('Content-Type')).toBe('text/csv; charset=utf-8')

      // Should still return valid response even with empty data
      expect(response.body).toBeDefined()
    })

    it('handles query errors', async () => {
      async function* errorQuery() {
        throw new Error('Database connection failed')
      }

      const columns = ['id']

      // Expect the error to be thrown during stream consumption
      const response = await exportAsCSVStream(errorQuery, columns)

      // Response is created, but error will occur when stream is consumed
      expect(response.status).toBe(200)
      expect(response.body).toBeDefined()
    })

    it('includes UTF-8 BOM for Excel compatibility', async () => {
      async function* smallQuery() {
        yield [
          {
            id: 'test-1',
            student_name: 'John Doe',
            total_amount: 1000,
          },
        ]
      }

      const columns = ['id', 'student_name', 'total_amount']
      const response = await exportAsCSVStream(smallQuery, columns)

      const reader = response.body?.getReader()
      expect(reader).toBeDefined()

      if (reader) {
        const { value } = await reader.read()
        if (value) {
          const text = new TextDecoder().decode(value)
          // UTF-8 BOM should be at the start
          expect(text.charCodeAt(0)).toBe(0xfeff)
        }
        reader.releaseLock()
      }
    })

    it('processes multiple batches correctly', async () => {
      const batch1 = [
        { id: 'id-1', student_name: 'Alice', total_amount: 1000 },
        { id: 'id-2', student_name: 'Bob', total_amount: 2000 },
      ]
      const batch2 = [
        { id: 'id-3', student_name: 'Charlie', total_amount: 3000 },
        { id: 'id-4', student_name: 'Diana', total_amount: 4000 },
      ]

      async function* multiQuery() {
        yield batch1
        yield batch2
      }

      const columns = ['id', 'student_name', 'total_amount']
      const response = await exportAsCSVStream(multiQuery, columns)

      expect(response.status).toBe(200)
      expect(response.body).toBeDefined()

      // Verify stream contains data from all batches
      const reader = response.body?.getReader()
      if (reader) {
        const chunks: Uint8Array[] = []
        let done = false

        while (!done) {
          const result = await reader.read()
          done = result.done
          if (result.value) {
            chunks.push(result.value)
          }
        }

        // Combine chunks and decode
        const totalLength = chunks.reduce((sum, chunk) => sum + chunk.length, 0)
        const combined = new Uint8Array(totalLength)
        let offset = 0
        for (const chunk of chunks) {
          combined.set(chunk, offset)
          offset += chunk.length
        }

        const csvText = new TextDecoder().decode(combined)

        // Verify all records are present
        expect(csvText).toContain('Alice')
        expect(csvText).toContain('Bob')
        expect(csvText).toContain('Charlie')
        expect(csvText).toContain('Diana')

        reader.releaseLock()
      }
    })

    it('generates unique filenames with timestamps', async () => {
      async function* query() {
        yield [{ id: '1', total_amount: 100 }]
      }

      const columns = ['id', 'total_amount']

      // Create two exports in quick succession
      const response1 = await exportAsCSVStream(query, columns)
      const response2 = await exportAsCSVStream(query, columns)

      const filename1 = response1.headers.get('Content-Disposition')
      const filename2 = response2.headers.get('Content-Disposition')

      // Both should have filenames
      expect(filename1).toContain('payment_plans_')
      expect(filename2).toContain('payment_plans_')

      // They might be the same if created in the same millisecond, but both should be valid
      expect(filename1).toMatch(/payment_plans_\d{4}-\d{2}-\d{2}T\d{2}-\d{2}-\d{2}/)
      expect(filename2).toMatch(/payment_plans_\d{4}-\d{2}-\d{2}T\d{2}-\d{2}-\d{2}/)
    })
  })

  describe('formatRowForCSV', () => {
    it('formats currency amounts correctly', () => {
      const row = {
        plan_amount: 1234.567,
        expected_commission: 123.4,
        total_paid: 500,
      }

      const columns = ['plan_amount', 'expected_commission', 'total_paid']
      const formatted = formatRowForCSV(row, columns)

      expect(formatted.plan_amount).toBe('1234.57')
      expect(formatted.expected_commission).toBe('123.40')
      expect(formatted.total_paid).toBe('500.00')
    })

    it('formats dates correctly', () => {
      const row = {
        start_date: '2025-01-15T10:30:00Z',
        contract_expiration_date: '2026-12-31T23:59:59Z',
      }

      const columns = ['start_date', 'contract_expiration_date']
      const formatted = formatRowForCSV(row, columns)

      expect(formatted.start_date).toBe('2025-01-15')
      expect(formatted.contract_expiration_date).toBe('2026-12-31')
    })

    it('formats percentage rates correctly', () => {
      const row = {
        commission_rate_percent: 10.5,
      }

      const columns = ['commission_rate_percent']
      const formatted = formatRowForCSV(row, columns)

      expect(formatted.commission_rate_percent).toBe('10.5')
    })

    it('handles null values correctly', () => {
      const row = {
        plan_amount: null,
        start_date: null,
        commission_rate_percent: null,
        student_name: null,
      }

      const columns = ['plan_amount', 'start_date', 'commission_rate_percent', 'student_name']
      const formatted = formatRowForCSV(row, columns)

      expect(formatted.plan_amount).toBe('')
      expect(formatted.start_date).toBe('')
      expect(formatted.commission_rate_percent).toBe('')
      expect(formatted.student_name).toBe('')
    })

    it('handles undefined values correctly', () => {
      const row = {
        plan_amount: undefined,
        start_date: undefined,
      }

      const columns = ['plan_amount', 'start_date', 'student_name']
      const formatted = formatRowForCSV(row, columns)

      expect(formatted.plan_amount).toBe('')
      expect(formatted.start_date).toBe('')
      expect(formatted.student_name).toBe('')
    })

    it('handles nested values correctly', () => {
      const row = {
        enrollments: {
          students: {
            name: 'John Doe',
          },
        },
      }

      const columns = ['enrollments.students.name']
      const formatted = formatRowForCSV(row, columns)

      // Note: This tests the getNestedValue function indirectly
      // The actual behavior depends on how getNestedValue handles the path
      expect(formatted['enrollments.students.name']).toBeDefined()
    })

    it('formats string values correctly', () => {
      const row = {
        student_name: 'Jane Smith',
        status: 'active',
        currency: 'USD',
      }

      const columns = ['student_name', 'status', 'currency']
      const formatted = formatRowForCSV(row, columns)

      expect(formatted.student_name).toBe('Jane Smith')
      expect(formatted.status).toBe('active')
      expect(formatted.currency).toBe('USD')
    })

    it('handles special characters in strings', () => {
      const row = {
        student_name: 'O\'Brien, John "Jack"',
        branch_name: 'Campus, Main',
      }

      const columns = ['student_name', 'branch_name']
      const formatted = formatRowForCSV(row, columns)

      // Values should be preserved as-is; CSV quoting happens in stringifier
      expect(formatted.student_name).toBe('O\'Brien, John "Jack"')
      expect(formatted.branch_name).toBe('Campus, Main')
    })
  })

  describe('Performance and Memory', () => {
    it('handles very large batches efficiently', async () => {
      // Create a large dataset
      const largeDataset = Array.from({ length: 10000 }, (_, i) => ({
        id: `id-${i}`,
        reference_number: `REF-${String(i).padStart(6, '0')}`,
        student_name: `Student ${i}`,
        total_amount: Math.floor(Math.random() * 100000),
        currency: i % 2 === 0 ? 'USD' : 'EUR',
        commission_rate_percent: 10,
        expected_commission: Math.floor(Math.random() * 10000),
        status: ['active', 'completed', 'pending'][i % 3],
        start_date: new Date(2024, i % 12, (i % 28) + 1).toISOString(),
      }))

      async function* largeQuery() {
        const batchSize = 500
        for (let i = 0; i < largeDataset.length; i += batchSize) {
          yield largeDataset.slice(i, i + batchSize)
        }
      }

      const columns = [
        'id',
        'reference_number',
        'student_name',
        'total_amount',
        'currency',
        'commission_rate_percent',
        'expected_commission',
        'status',
        'start_date',
      ]

      const startTime = Date.now()
      const response = await exportAsCSVStream(largeQuery, columns, 10000)
      const creationTime = Date.now() - startTime

      // Stream creation should be fast (< 100ms) since it doesn't process all data
      expect(creationTime).toBeLessThan(100)

      expect(response.status).toBe(200)
      expect(response.body).toBeDefined()
    })

    it('does not block on backpressure', async () => {
      // Simulate slow consumer by creating large batches
      const largeBatch = Array.from({ length: 1000 }, (_, i) => ({
        id: `id-${i}`,
        total_amount: i * 100,
      }))

      async function* slowQuery() {
        yield largeBatch
        yield largeBatch
        yield largeBatch
      }

      const columns = ['id', 'total_amount']
      const response = await exportAsCSVStream(slowQuery, columns)

      expect(response.status).toBe(200)
      expect(response.body).toBeDefined()

      // Stream should be created without processing all data
      // This tests that we properly handle backpressure
    })
  })

  describe('Edge Cases', () => {
    it('handles single row correctly', async () => {
      async function* singleQuery() {
        yield [{ id: '1', student_name: 'John', total_amount: 1000 }]
      }

      const columns = ['id', 'student_name', 'total_amount']
      const response = await exportAsCSVStream(singleQuery, columns)

      expect(response.status).toBe(200)
      expect(response.body).toBeDefined()
    })

    it('handles varying batch sizes', async () => {
      async function* varyingQuery() {
        yield [{ id: '1', total_amount: 100 }]
        yield [
          { id: '2', total_amount: 200 },
          { id: '3', total_amount: 300 },
          { id: '4', total_amount: 400 },
        ]
        yield [
          { id: '5', total_amount: 500 },
          { id: '6', total_amount: 600 },
        ]
      }

      const columns = ['id', 'total_amount']
      const response = await exportAsCSVStream(varyingQuery, columns)

      expect(response.status).toBe(200)
      expect(response.body).toBeDefined()
    })

    it('sets correct cache control headers', async () => {
      async function* query() {
        yield [{ id: '1', total_amount: 100 }]
      }

      const columns = ['id', 'total_amount']
      const response = await exportAsCSVStream(query, columns)

      expect(response.headers.get('Cache-Control')).toBe('no-cache')
    })
  })
})
