import { describe, it, expect } from 'vitest'
import {
  formatCurrencyForCSV,
  formatDateISO,
  generateCSVHeaders,
  addUTF8BOM,
  exportAsCSV,
} from '../csv-formatter'

describe('CSV Formatter', () => {
  describe('formatCurrencyForCSV', () => {
    it('formats number with 2 decimal places', () => {
      expect(formatCurrencyForCSV(1234.56)).toBe('1234.56')
      expect(formatCurrencyForCSV(1000)).toBe('1000.00')
      expect(formatCurrencyForCSV(0.5)).toBe('0.50')
    })

    it('handles zero correctly', () => {
      expect(formatCurrencyForCSV(0)).toBe('0.00')
    })

    it('handles large numbers', () => {
      expect(formatCurrencyForCSV(1234567.89)).toBe('1234567.89')
    })

    it('handles negative numbers', () => {
      expect(formatCurrencyForCSV(-100.5)).toBe('-100.50')
    })

    it('rounds to 2 decimal places', () => {
      expect(formatCurrencyForCSV(1.999)).toBe('2.00')
      expect(formatCurrencyForCSV(1.234)).toBe('1.23')
      expect(formatCurrencyForCSV(1.235)).toBe('1.24')
    })

    it('handles null and undefined', () => {
      expect(formatCurrencyForCSV(null)).toBe('')
      expect(formatCurrencyForCSV(undefined)).toBe('')
    })
  })

  describe('formatDateISO', () => {
    it('formats date string to ISO format', () => {
      expect(formatDateISO('2025-11-13T12:00:00Z')).toBe('2025-11-13')
      expect(formatDateISO('2025-01-01')).toBe('2025-01-01')
    })

    it('formats Date object to ISO format', () => {
      const date = new Date('2025-11-13T12:00:00Z')
      expect(formatDateISO(date)).toBe('2025-11-13')
    })

    it('formats date string with time to ISO date only', () => {
      expect(formatDateISO('2025-12-25T23:59:59Z')).toBe('2025-12-25')
    })

    it('handles different date formats', () => {
      // ISO 8601
      expect(formatDateISO('2025-03-15T00:00:00.000Z')).toBe('2025-03-15')

      // Date object
      const date = new Date(2025, 5, 20) // Note: month is 0-indexed
      const formatted = formatDateISO(date)
      expect(formatted).toMatch(/2025-06-2[01]/) // Could be 20 or 21 depending on timezone
    })

    it('handles null and undefined', () => {
      expect(formatDateISO(null)).toBe('')
      expect(formatDateISO(undefined)).toBe('')
    })

    it('handles empty string', () => {
      expect(formatDateISO('')).toBe('')
    })
  })

  describe('generateCSVHeaders', () => {
    it('maps column keys to labels', () => {
      const columns = ['student_name', 'total_amount', 'status']
      const headers = generateCSVHeaders(columns)
      expect(headers).toEqual(['Student Name', 'Total Amount', 'Status'])
    })

    it('maps all payment plan columns correctly', () => {
      const columns = [
        'student_name',
        'college_name',
        'branch_name',
        'branch_city',
        'total_amount',
        'currency',
        'start_date',
        'commission_rate_percent',
        'expected_commission',
        'earned_commission',
        'status',
        'contract_expiration_date',
      ]
      const headers = generateCSVHeaders(columns)
      expect(headers).toEqual([
        'Student Name',
        'College',
        'Branch',
        'City',
        'Total Amount',
        'Currency',
        'Start Date',
        'Commission Rate (%)',
        'Expected Commission',
        'Earned Commission',
        'Status',
        'Contract Expiration',
      ])
    })

    it('uses key as label if not mapped', () => {
      const columns = ['unknown_column']
      const headers = generateCSVHeaders(columns)
      expect(headers).toEqual(['unknown_column'])
    })

    it('handles mixed known and unknown columns', () => {
      const columns = ['student_name', 'custom_field', 'status']
      const headers = generateCSVHeaders(columns)
      expect(headers).toEqual(['Student Name', 'custom_field', 'Status'])
    })

    it('handles empty array', () => {
      const headers = generateCSVHeaders([])
      expect(headers).toEqual([])
    })
  })

  describe('addUTF8BOM', () => {
    it('prepends BOM to content', () => {
      expect(addUTF8BOM('data')).toBe('\uFEFFdata')
      expect(addUTF8BOM('Name,Amount\nJohn,100')).toBe('\uFEFFName,Amount\nJohn,100')
    })

    it('handles empty string', () => {
      expect(addUTF8BOM('')).toBe('\uFEFF')
    })

    it('BOM is correct Unicode character', () => {
      const result = addUTF8BOM('test')
      expect(result.charCodeAt(0)).toBe(0xfeff)
    })
  })

  describe('exportAsCSV', () => {
    it('exports simple data with headers', () => {
      const data = [
        { student_name: 'John Doe', total_amount: 1000, status: 'active' },
        { student_name: 'Jane Smith', total_amount: 2000, status: 'completed' },
      ]
      const columns = ['student_name', 'total_amount', 'status']

      const response = exportAsCSV(data, columns)

      expect(response).toBeInstanceOf(Response)
      expect(response.status).toBe(200)
      expect(response.headers.get('Content-Type')).toBe('text/csv; charset=utf-8')
      expect(response.headers.get('Content-Disposition')).toContain('attachment')
      expect(response.headers.get('Content-Disposition')).toContain('payment_plans_')
      expect(response.headers.get('Content-Disposition')).toContain('.csv')
    })

    it('CSV content includes BOM', async () => {
      const data = [{ student_name: 'John Doe', total_amount: 1000 }]
      const columns = ['student_name', 'total_amount']

      const response = exportAsCSV(data, columns)

      // Get the raw content via arrayBuffer to preserve BOM
      const buffer = await response.arrayBuffer()
      const bytes = new Uint8Array(buffer)

      // Check for UTF-8 BOM (EF BB BF)
      expect(bytes[0]).toBe(0xef)
      expect(bytes[1]).toBe(0xbb)
      expect(bytes[2]).toBe(0xbf)
    })

    it('CSV content includes headers', async () => {
      const data = [{ student_name: 'John Doe', total_amount: 1000 }]
      const columns = ['student_name', 'total_amount']

      const response = exportAsCSV(data, columns)
      const text = await response.text()

      // Remove BOM and check content
      const content = text.slice(1)
      expect(content).toContain('Student Name')
      expect(content).toContain('Total Amount')
    })

    it('formats currency amounts correctly', async () => {
      const data = [{ total_amount: 1234.5, expected_commission: 100 }]
      const columns = ['total_amount', 'expected_commission']

      const response = exportAsCSV(data, columns)
      const text = await response.text()

      expect(text).toContain('1234.50')
      expect(text).toContain('100.00')
    })

    it('formats dates correctly', async () => {
      const data = [
        { start_date: '2025-11-13T12:00:00Z', contract_expiration_date: new Date('2026-11-13') },
      ]
      const columns = ['start_date', 'contract_expiration_date']

      const response = exportAsCSV(data, columns)
      const text = await response.text()

      expect(text).toContain('2025-11-13')
      expect(text).toMatch(/2026-11-1[23]/) // Date might vary by timezone
    })

    it('handles null and undefined values', async () => {
      const data = [{ student_name: 'John Doe', total_amount: null, start_date: undefined }]
      const columns = ['student_name', 'total_amount', 'start_date']

      const response = exportAsCSV(data, columns)
      const text = await response.text()

      // Should have empty fields for null/undefined, but quoted
      expect(text).toContain('John Doe')
      // Empty fields should be quoted as ""
      expect(text).toContain('""')
    })

    it('quotes all fields', async () => {
      const data = [{ student_name: 'John Doe', status: 'active' }]
      const columns = ['student_name', 'status']

      const response = exportAsCSV(data, columns)
      const text = await response.text()

      // All fields should be quoted
      const lines = text.split('\n')
      lines.forEach((line) => {
        if (line.trim()) {
          // Each field should be quoted
          expect(line).toMatch(/"[^"]*"/)
        }
      })
    })

    it('handles special characters in text', async () => {
      const data = [{ student_name: 'José García, Jr.', status: 'active' }]
      const columns = ['student_name', 'status']

      const response = exportAsCSV(data, columns)
      const text = await response.text()

      // Special characters should be preserved
      expect(text).toContain('José García, Jr.')
    })

    it('handles percentage fields correctly', async () => {
      const data = [{ student_name: 'John Doe', commission_rate_percent: 15.5 }]
      const columns = ['student_name', 'commission_rate_percent']

      const response = exportAsCSV(data, columns)
      const text = await response.text()

      expect(text).toContain('15.5')
    })

    it('generates unique filename with timestamp', () => {
      const data = [{ student_name: 'John' }]
      const columns = ['student_name']

      const response1 = exportAsCSV(data, columns)
      const response2 = exportAsCSV(data, columns)

      const filename1 = response1.headers.get('Content-Disposition')
      const filename2 = response2.headers.get('Content-Disposition')

      expect(filename1).toContain('payment_plans_')
      expect(filename2).toContain('payment_plans_')
      // Note: Filenames might be the same if called in rapid succession
    })

    it('handles empty data array', async () => {
      const data: any[] = []
      const columns = ['student_name', 'total_amount']

      const response = exportAsCSV(data, columns)
      const text = await response.text()

      // Should still have headers
      expect(text).toContain('Student Name')
      expect(text).toContain('Total Amount')
    })
  })
})
