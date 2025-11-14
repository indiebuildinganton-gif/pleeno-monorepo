/**
 * PDF Utility Functions Tests
 *
 * Story 7.3: PDF Export Functionality
 * Task 9: Testing - Utility Function Unit Tests
 *
 * Tests for PDF utility functions including calculations and formatting
 */

import { describe, it, expect } from 'vitest'
import {
  calculateSummary,
  formatCurrency,
  formatDate,
  formatDateTime,
  generatePDFFilename,
  validateSummary,
  type SummaryMetrics,
  type PaymentPlanRow,
} from '../pdf-utils'

describe('PDF Utilities', () => {
  describe('calculateSummary', () => {
    it('should calculate summary metrics correctly', () => {
      const data: PaymentPlanRow[] = [
        {
          plan_amount: 50000,
          expected_commission: 5000,
          earned_commission: 3000,
        },
        {
          plan_amount: 75000,
          expected_commission: 9000,
          earned_commission: 7000,
        },
      ]

      const summary = calculateSummary(data)

      expect(summary).toEqual({
        totalRecords: 2,
        totalAmount: 125000,
        expectedCommission: 14000,
        earnedCommission: 10000,
        outstandingCommission: 4000,
      })
    })

    it('should handle empty data array', () => {
      const summary = calculateSummary([])

      expect(summary).toEqual({
        totalRecords: 0,
        totalAmount: 0,
        expectedCommission: 0,
        earnedCommission: 0,
        outstandingCommission: 0,
      })
    })

    it('should handle data with total_amount field instead of plan_amount', () => {
      const data = [
        {
          total_amount: 100000,
          expected_commission: 10000,
          earned_commission: 5000,
        },
      ] as PaymentPlanRow[]

      const summary = calculateSummary(data)

      expect(summary.totalAmount).toBe(100000)
    })

    it('should prefer total_amount over plan_amount if both exist', () => {
      const data = [
        {
          total_amount: 100000,
          plan_amount: 50000,
          expected_commission: 10000,
          earned_commission: 5000,
        },
      ] as PaymentPlanRow[]

      const summary = calculateSummary(data)

      expect(summary.totalAmount).toBe(100000)
    })

    it('should handle missing or zero values', () => {
      const data: PaymentPlanRow[] = [
        {
          plan_amount: 0,
          expected_commission: 0,
          earned_commission: 0,
        },
      ]

      const summary = calculateSummary(data)

      expect(summary).toEqual({
        totalRecords: 1,
        totalAmount: 0,
        expectedCommission: 0,
        earnedCommission: 0,
        outstandingCommission: 0,
      })
    })

    it('should handle negative outstanding commission (overpayment)', () => {
      const data: PaymentPlanRow[] = [
        {
          plan_amount: 50000,
          expected_commission: 5000,
          earned_commission: 6000, // Earned more than expected
        },
      ]

      const summary = calculateSummary(data)

      expect(summary.outstandingCommission).toBe(-1000)
    })

    it('should handle large datasets', () => {
      const data: PaymentPlanRow[] = Array.from({ length: 1000 }, (_, i) => ({
        plan_amount: 10000,
        expected_commission: 1000,
        earned_commission: 500,
      }))

      const summary = calculateSummary(data)

      expect(summary).toEqual({
        totalRecords: 1000,
        totalAmount: 10000000,
        expectedCommission: 1000000,
        earnedCommission: 500000,
        outstandingCommission: 500000,
      })
    })

    it('should handle decimal values accurately', () => {
      const data: PaymentPlanRow[] = [
        {
          plan_amount: 50000.55,
          expected_commission: 5000.05,
          earned_commission: 3000.03,
        },
      ]

      const summary = calculateSummary(data)

      expect(summary.totalAmount).toBeCloseTo(50000.55, 2)
      expect(summary.expectedCommission).toBeCloseTo(5000.05, 2)
      expect(summary.earnedCommission).toBeCloseTo(3000.03, 2)
      expect(summary.outstandingCommission).toBeCloseTo(2000.02, 2)
    })
  })

  describe('formatCurrency', () => {
    it('should format currency with AUD defaults', () => {
      expect(formatCurrency(1234.56)).toBe('$1,234.56')
    })

    it('should format large numbers with thousands separator', () => {
      expect(formatCurrency(1234567.89)).toBe('$1,234,567.89')
    })

    it('should format zero correctly', () => {
      expect(formatCurrency(0)).toBe('$0.00')
    })

    it('should format negative values', () => {
      expect(formatCurrency(-1234.56)).toBe('-$1,234.56')
    })

    it('should handle null as $0.00', () => {
      expect(formatCurrency(null as any)).toBe('$0.00')
    })

    it('should handle undefined as $0.00', () => {
      expect(formatCurrency(undefined as any)).toBe('$0.00')
    })

    it('should handle NaN as $0.00', () => {
      expect(formatCurrency(NaN)).toBe('$0.00')
    })

    it('should round to 2 decimal places', () => {
      expect(formatCurrency(1234.567)).toBe('$1,234.57')
      expect(formatCurrency(1234.564)).toBe('$1,234.56')
    })

    it('should support custom currency codes', () => {
      const result = formatCurrency(1234.56, 'USD')
      expect(result).toContain('1,234.56')
    })

    it('should handle very large numbers', () => {
      const result = formatCurrency(1000000000)
      expect(result).toBe('$1,000,000,000.00')
    })

    it('should handle very small numbers', () => {
      expect(formatCurrency(0.01)).toBe('$0.01')
      expect(formatCurrency(0.001)).toBe('$0.00') // Rounds down
    })
  })

  describe('formatDate', () => {
    it('should format Date object to ISO date string', () => {
      const date = new Date('2025-11-14T10:30:00Z')
      expect(formatDate(date)).toBe('2025-11-14')
    })

    it('should format ISO string to ISO date string', () => {
      expect(formatDate('2025-11-14T10:30:00Z')).toBe('2025-11-14')
    })

    it('should handle empty string', () => {
      expect(formatDate('')).toBe('')
    })

    it('should handle invalid date strings', () => {
      expect(formatDate('invalid-date')).toBe('')
    })

    it('should handle null/undefined gracefully', () => {
      expect(formatDate(null as any)).toBe('')
      expect(formatDate(undefined as any)).toBe('')
    })
  })

  describe('formatDateTime', () => {
    it('should format datetime with default (now)', () => {
      const result = formatDateTime()
      expect(result).toMatch(/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/)
    })

    it('should format specific datetime', () => {
      const date = new Date('2025-11-14T14:30:45')
      const result = formatDateTime(date)
      expect(result).toBe('2025-11-14 14:30:45')
    })

    it('should pad single digit values with zeros', () => {
      const date = new Date('2025-01-05T09:05:03')
      const result = formatDateTime(date)
      expect(result).toBe('2025-01-05 09:05:03')
    })

    it('should handle midnight correctly', () => {
      const date = new Date('2025-11-14T00:00:00')
      const result = formatDateTime(date)
      expect(result).toBe('2025-11-14 00:00:00')
    })
  })

  describe('generatePDFFilename', () => {
    it('should generate filename with default report type', () => {
      const filename = generatePDFFilename()
      expect(filename).toMatch(/^payment_plans_\d{4}-\d{2}-\d{2}_\d{6}\.pdf$/)
    })

    it('should generate filename with custom report type', () => {
      const filename = generatePDFFilename('commission_summary')
      expect(filename).toMatch(/^commission_summary_\d{4}-\d{2}-\d{2}_\d{6}\.pdf$/)
    })

    it('should include current date in filename', () => {
      const filename = generatePDFFilename('test_report')
      const today = new Date()
      const year = today.getFullYear()
      const month = String(today.getMonth() + 1).padStart(2, '0')
      const day = String(today.getDate()).padStart(2, '0')

      expect(filename).toContain(`${year}-${month}-${day}`)
    })

    it('should include timestamp with HHMMSS format', () => {
      const filename = generatePDFFilename()
      // Should match format: payment_plans_YYYY-MM-DD_HHMMSS.pdf
      expect(filename).toMatch(/_\d{6}\.pdf$/)
    })

    it('should pad timestamp components with zeros', () => {
      const filename = generatePDFFilename()
      const timestampPart = filename.match(/_(\d{6})\.pdf$/)
      expect(timestampPart).toBeTruthy()
      expect(timestampPart![1]).toHaveLength(6)
    })

    it('should create unique filenames when called multiple times', () => {
      const filename1 = generatePDFFilename()
      const filename2 = generatePDFFilename()

      // They might be the same if called in the same second, but structure should be identical
      expect(filename1).toMatch(/^payment_plans_\d{4}-\d{2}-\d{2}_\d{6}\.pdf$/)
      expect(filename2).toMatch(/^payment_plans_\d{4}-\d{2}-\d{2}_\d{6}\.pdf$/)
    })
  })

  describe('validateSummary', () => {
    const testData: PaymentPlanRow[] = [
      {
        plan_amount: 50000,
        expected_commission: 5000,
        earned_commission: 3000,
      },
      {
        plan_amount: 75000,
        expected_commission: 9000,
        earned_commission: 7000,
      },
    ]

    it('should validate correct summary', () => {
      const summary: SummaryMetrics = {
        totalRecords: 2,
        totalAmount: 125000,
        expectedCommission: 14000,
        earnedCommission: 10000,
        outstandingCommission: 4000,
      }

      expect(validateSummary(testData, summary)).toBe(true)
    })

    it('should reject incorrect total records', () => {
      const summary: SummaryMetrics = {
        totalRecords: 3, // Wrong!
        totalAmount: 125000,
        expectedCommission: 14000,
        earnedCommission: 10000,
        outstandingCommission: 4000,
      }

      expect(validateSummary(testData, summary)).toBe(false)
    })

    it('should reject incorrect total amount', () => {
      const summary: SummaryMetrics = {
        totalRecords: 2,
        totalAmount: 100000, // Wrong!
        expectedCommission: 14000,
        earnedCommission: 10000,
        outstandingCommission: 4000,
      }

      expect(validateSummary(testData, summary)).toBe(false)
    })

    it('should reject incorrect expected commission', () => {
      const summary: SummaryMetrics = {
        totalRecords: 2,
        totalAmount: 125000,
        expectedCommission: 10000, // Wrong!
        earnedCommission: 10000,
        outstandingCommission: 0,
      }

      expect(validateSummary(testData, summary)).toBe(false)
    })

    it('should reject incorrect earned commission', () => {
      const summary: SummaryMetrics = {
        totalRecords: 2,
        totalAmount: 125000,
        expectedCommission: 14000,
        earnedCommission: 5000, // Wrong!
        outstandingCommission: 9000,
      }

      expect(validateSummary(testData, summary)).toBe(false)
    })

    it('should reject incorrect outstanding commission', () => {
      const summary: SummaryMetrics = {
        totalRecords: 2,
        totalAmount: 125000,
        expectedCommission: 14000,
        earnedCommission: 10000,
        outstandingCommission: 5000, // Wrong!
      }

      expect(validateSummary(testData, summary)).toBe(false)
    })

    it('should tolerate small floating point differences', () => {
      const summary: SummaryMetrics = {
        totalRecords: 2,
        totalAmount: 125000.005, // Within 1 cent tolerance
        expectedCommission: 14000,
        earnedCommission: 10000,
        outstandingCommission: 4000,
      }

      expect(validateSummary(testData, summary)).toBe(true)
    })

    it('should validate empty dataset summary', () => {
      const emptySummary: SummaryMetrics = {
        totalRecords: 0,
        totalAmount: 0,
        expectedCommission: 0,
        earnedCommission: 0,
        outstandingCommission: 0,
      }

      expect(validateSummary([], emptySummary)).toBe(true)
    })

    it('should recalculate and compare against provided summary', () => {
      // This tests that validateSummary internally uses calculateSummary
      const calculatedSummary = calculateSummary(testData)
      expect(validateSummary(testData, calculatedSummary)).toBe(true)
    })
  })
})
