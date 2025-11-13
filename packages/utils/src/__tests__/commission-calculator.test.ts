import { describe, it, expect } from 'vitest'
import { calculateExpectedCommission } from '../commission-calculator'

describe('Commission Calculator', () => {
  describe('Basic Calculations', () => {
    it('calculates 0% rate as $0 commission', () => {
      const result = calculateExpectedCommission(10000, 0)
      expect(result).toBe(0)
    })

    it('calculates 15% of $10,000 as $1,500.00', () => {
      const result = calculateExpectedCommission(10000, 15)
      expect(result).toBe(1500.0)
    })

    it('calculates 100% of $5,000 as $5,000.00', () => {
      const result = calculateExpectedCommission(5000, 100)
      expect(result).toBe(5000.0)
    })

    it('calculates 20% of $3,500 as $700.00', () => {
      const result = calculateExpectedCommission(3500, 20)
      expect(result).toBe(700.0)
    })

    it('calculates 0.5% of $100,000 as $500.00', () => {
      const result = calculateExpectedCommission(100000, 0.5)
      expect(result).toBe(500.0)
    })
  })

  describe('Decimal and Rounding', () => {
    it('rounds result to 2 decimal places', () => {
      // 15.75% of $1000 = 157.50
      const result = calculateExpectedCommission(1000, 15.75)
      expect(result).toBe(157.5)
    })

    it('handles complex decimal calculations correctly', () => {
      // 12.34% of $5678.90 = 700.8162... -> rounds to 700.82
      const result = calculateExpectedCommission(5678.9, 12.34)
      expect(result).toBe(700.82)
    })

    it('rounds up when necessary', () => {
      // 33.33% of $100 = 33.33
      const result = calculateExpectedCommission(100, 33.33)
      expect(result).toBe(33.33)
    })

    it('rounds down when necessary', () => {
      // 10% of $33.33 = 3.333... -> rounds to 3.33
      const result = calculateExpectedCommission(33.33, 10)
      expect(result).toBe(3.33)
    })

    it('handles very small percentages', () => {
      // 0.01% of $10000 = 1.00
      const result = calculateExpectedCommission(10000, 0.01)
      expect(result).toBe(1.0)
    })

    it('handles very large amounts', () => {
      // 5% of $1,000,000 = $50,000
      const result = calculateExpectedCommission(1000000, 5)
      expect(result).toBe(50000.0)
    })
  })

  describe('Edge Cases - NULL and Undefined', () => {
    it('returns 0 when totalAmount is 0', () => {
      const result = calculateExpectedCommission(0, 15)
      expect(result).toBe(0)
    })

    it('returns 0 when commissionRatePercent is 0', () => {
      const result = calculateExpectedCommission(10000, 0)
      expect(result).toBe(0)
    })

    it('returns 0 when totalAmount is null', () => {
      const result = calculateExpectedCommission(null as any, 15)
      expect(result).toBe(0)
    })

    it('returns 0 when commissionRatePercent is null', () => {
      const result = calculateExpectedCommission(10000, null as any)
      expect(result).toBe(0)
    })

    it('returns 0 when totalAmount is undefined', () => {
      const result = calculateExpectedCommission(undefined as any, 15)
      expect(result).toBe(0)
    })

    it('returns 0 when commissionRatePercent is undefined', () => {
      const result = calculateExpectedCommission(10000, undefined as any)
      expect(result).toBe(0)
    })

    it('returns 0 when both parameters are null', () => {
      const result = calculateExpectedCommission(null as any, null as any)
      expect(result).toBe(0)
    })
  })

  describe('Edge Cases - Negative Values', () => {
    it('returns 0 when totalAmount is negative', () => {
      const result = calculateExpectedCommission(-1000, 15)
      expect(result).toBe(0)
    })

    it('returns 0 when commissionRatePercent is negative', () => {
      const result = calculateExpectedCommission(10000, -5)
      expect(result).toBe(0)
    })

    it('returns 0 when both parameters are negative', () => {
      const result = calculateExpectedCommission(-1000, -5)
      expect(result).toBe(0)
    })
  })

  describe('Real-world Scenarios', () => {
    it('handles typical university course fee with 15% commission', () => {
      // $35,000 course with 15% commission = $5,250
      const result = calculateExpectedCommission(35000, 15)
      expect(result).toBe(5250.0)
    })

    it('handles high-value course with low commission rate', () => {
      // $80,000 course with 5% commission = $4,000
      const result = calculateExpectedCommission(80000, 5)
      expect(result).toBe(4000.0)
    })

    it('handles modest course fee with standard commission', () => {
      // $12,500 course with 12.5% commission = $1,562.50
      const result = calculateExpectedCommission(12500, 12.5)
      expect(result).toBe(1562.5)
    })

    it('handles multiple currency decimal places', () => {
      // $25,750.50 course with 18% commission = $4,635.09
      const result = calculateExpectedCommission(25750.5, 18)
      expect(result).toBe(4635.09)
    })

    it('handles tiered commission rate example', () => {
      // $50,000 course with 8.75% commission = $4,375.00
      const result = calculateExpectedCommission(50000, 8.75)
      expect(result).toBe(4375.0)
    })
  })

  describe('Matches Database Formula', () => {
    it('uses same formula as PostgreSQL function', () => {
      // Database formula: ROUND(total_amount * (commission_rate_percent / 100), 2)
      const totalAmount = 12345.67
      const commissionRate = 13.45

      const result = calculateExpectedCommission(totalAmount, commissionRate)
      const expected = Math.round(totalAmount * (commissionRate / 100) * 100) / 100

      expect(result).toBe(expected)
      expect(result).toBe(1660.49)
    })

    it('handles same edge cases as database function', () => {
      // Both return 0 for zero values
      expect(calculateExpectedCommission(0, 10)).toBe(0)
      expect(calculateExpectedCommission(100, 0)).toBe(0)
    })
  })

  describe('Precision and Floating Point', () => {
    it('avoids floating point precision issues', () => {
      // JavaScript: 0.1 + 0.2 !== 0.3
      // Our function should handle this correctly
      const result = calculateExpectedCommission(1000, 0.3)
      expect(result).toBe(3.0)
    })

    it('maintains precision with repeating decimals', () => {
      // 33.33% should not accumulate rounding errors
      const result1 = calculateExpectedCommission(1000, 33.33)
      const result2 = calculateExpectedCommission(1000, 33.33)
      expect(result1).toBe(result2)
      expect(result1).toBe(333.3)
    })

    it('handles maximum precision percentage rates', () => {
      // 99.99% of $10,000 = $9,999.00
      const result = calculateExpectedCommission(10000, 99.99)
      expect(result).toBe(9999.0)
    })
  })
})
