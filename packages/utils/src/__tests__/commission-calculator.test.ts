import { describe, it, expect } from 'vitest'
import {
  calculateCommissionableValue,
  calculateExpectedCommission,
  calculateExpectedCommissionLegacy,
} from '../commission-calculator'

describe('Commission Calculator - Story 4.2', () => {
  describe('calculateCommissionableValue', () => {
    describe('Basic Calculations', () => {
      it('subtracts all fees from total course value', () => {
        // Example from requirements:
        // Total: $10,000, Materials: $500, Admin: $200, Other: $100
        // Result: $10,000 - $500 - $200 - $100 = $9,200
        const result = calculateCommissionableValue(10000, 500, 200, 100)
        expect(result).toBe(9200)
      })

      it('returns total when all fees are 0', () => {
        const result = calculateCommissionableValue(10000, 0, 0, 0)
        expect(result).toBe(10000)
      })

      it('handles only materials cost', () => {
        const result = calculateCommissionableValue(5000, 500)
        expect(result).toBe(4500)
      })

      it('handles only admin fees', () => {
        const result = calculateCommissionableValue(5000, 0, 300)
        expect(result).toBe(4700)
      })

      it('handles only other fees', () => {
        const result = calculateCommissionableValue(5000, 0, 0, 250)
        expect(result).toBe(4750)
      })
    })

    describe('Edge Cases - Fees Exceed Total', () => {
      it('returns 0 when fees equal total', () => {
        const result = calculateCommissionableValue(1000, 400, 300, 300)
        expect(result).toBe(0)
      })

      it('returns 0 when fees exceed total', () => {
        const result = calculateCommissionableValue(1000, 500, 400, 300)
        expect(result).toBe(0)
      })

      it('returns 0 when single fee equals total', () => {
        const result = calculateCommissionableValue(1000, 1000)
        expect(result).toBe(0)
      })

      it('returns 0 when single fee exceeds total', () => {
        const result = calculateCommissionableValue(1000, 1500)
        expect(result).toBe(0)
      })
    })

    describe('Edge Cases - NULL and Undefined', () => {
      it('returns 0 when total is 0', () => {
        const result = calculateCommissionableValue(0, 100, 50, 25)
        expect(result).toBe(0)
      })

      it('returns 0 when total is null', () => {
        const result = calculateCommissionableValue(null as any, 100, 50, 25)
        expect(result).toBe(0)
      })

      it('returns 0 when total is undefined', () => {
        const result = calculateCommissionableValue(undefined as any, 100, 50, 25)
        expect(result).toBe(0)
      })

      it('treats undefined materials cost as 0', () => {
        const result = calculateCommissionableValue(1000, undefined as any, 100, 50)
        expect(result).toBe(850)
      })

      it('treats undefined admin fees as 0', () => {
        const result = calculateCommissionableValue(1000, 100, undefined as any, 50)
        expect(result).toBe(850)
      })

      it('treats undefined other fees as 0', () => {
        const result = calculateCommissionableValue(1000, 100, 50, undefined as any)
        expect(result).toBe(850)
      })

      it('handles all fees undefined', () => {
        const result = calculateCommissionableValue(1000)
        expect(result).toBe(1000)
      })
    })

    describe('Edge Cases - Negative Values', () => {
      it('returns 0 when total is negative', () => {
        const result = calculateCommissionableValue(-1000, 100, 50, 25)
        expect(result).toBe(0)
      })

      it('treats negative materials cost as 0', () => {
        const result = calculateCommissionableValue(1000, -100, 50, 25)
        expect(result).toBe(925)
      })

      it('treats negative admin fees as 0', () => {
        const result = calculateCommissionableValue(1000, 100, -50, 25)
        expect(result).toBe(875)
      })

      it('treats negative other fees as 0', () => {
        const result = calculateCommissionableValue(1000, 100, 50, -25)
        expect(result).toBe(850)
      })
    })

    describe('Precision and Rounding', () => {
      it('rounds result to 2 decimal places', () => {
        const result = calculateCommissionableValue(1000.5, 100.33, 50.22, 25.11)
        expect(result).toBe(824.84)
      })

      it('handles complex decimal calculations', () => {
        const result = calculateCommissionableValue(12345.67, 234.56, 123.45, 67.89)
        expect(result).toBe(11919.77)
      })
    })

    describe('Real-world Scenarios', () => {
      it('handles typical university course with materials and fees', () => {
        // $35,000 course, $800 materials, $200 admin, $100 other
        const result = calculateCommissionableValue(35000, 800, 200, 100)
        expect(result).toBe(33900)
      })

      it('handles high-value course with significant non-commissionable fees', () => {
        // $80,000 course, $5,000 materials, $1,000 admin, $500 other
        const result = calculateCommissionableValue(80000, 5000, 1000, 500)
        expect(result).toBe(73500)
      })

      it('handles modest course with minimal fees', () => {
        // $12,500 course, $250 materials, $50 admin, $25 other
        const result = calculateCommissionableValue(12500, 250, 50, 25)
        expect(result).toBe(12175)
      })
    })
  })

  describe('calculateExpectedCommission - GST Handling', () => {
    describe('GST Inclusive (default)', () => {
      it('calculates commission on full amount when GST inclusive', () => {
        // Example from requirements:
        // Commissionable Value: $9,200, Rate: 15%, GST Inclusive: true
        // Result: $9,200 × 0.15 = $1,380.00
        const result = calculateExpectedCommission(9200, 0.15, true)
        expect(result).toBe(1380)
      })

      it('uses GST inclusive by default', () => {
        const result = calculateExpectedCommission(9200, 0.15)
        expect(result).toBe(1380)
      })

      it('calculates 10% commission on $10,000 (GST inclusive)', () => {
        const result = calculateExpectedCommission(10000, 0.1, true)
        expect(result).toBe(1000)
      })

      it('calculates 20% commission on $5,000 (GST inclusive)', () => {
        const result = calculateExpectedCommission(5000, 0.2, true)
        expect(result).toBe(1000)
      })
    })

    describe('GST Exclusive', () => {
      it('removes GST before calculating commission', () => {
        // Example from requirements:
        // Commissionable Value: $9,200, Rate: 15%, GST Inclusive: false
        // Base: $9,200 / 1.10 = $8,363.64
        // Result: $8,363.64 × 0.15 = $1,254.55
        const result = calculateExpectedCommission(9200, 0.15, false)
        expect(result).toBe(1254.55)
      })

      it('calculates 10% commission on $10,000 (GST exclusive)', () => {
        // Base: $10,000 / 1.10 = $9,090.91
        // Result: $9,090.91 × 0.10 = $909.09
        const result = calculateExpectedCommission(10000, 0.1, false)
        expect(result).toBe(909.09)
      })

      it('calculates 20% commission on $5,000 (GST exclusive)', () => {
        // Base: $5,000 / 1.10 = $4,545.45
        // Result: $4,545.45 × 0.20 = $909.09
        const result = calculateExpectedCommission(5000, 0.2, false)
        expect(result).toBe(909.09)
      })

      it('calculates 5% commission on $22,000 (GST exclusive)', () => {
        // Base: $22,000 / 1.10 = $20,000
        // Result: $20,000 × 0.05 = $1,000
        const result = calculateExpectedCommission(22000, 0.05, false)
        expect(result).toBe(1000)
      })
    })

    describe('Edge Cases - Zero Values', () => {
      it('returns 0 when commissionable value is 0', () => {
        const result = calculateExpectedCommission(0, 0.15)
        expect(result).toBe(0)
      })

      it('returns 0 when commission rate is 0', () => {
        const result = calculateExpectedCommission(10000, 0)
        expect(result).toBe(0)
      })

      it('returns 0 when both are 0', () => {
        const result = calculateExpectedCommission(0, 0)
        expect(result).toBe(0)
      })
    })

    describe('Edge Cases - NULL and Undefined', () => {
      it('returns 0 when commissionable value is null', () => {
        const result = calculateExpectedCommission(null as any, 0.15)
        expect(result).toBe(0)
      })

      it('returns 0 when commission rate is null', () => {
        const result = calculateExpectedCommission(10000, null as any)
        expect(result).toBe(0)
      })

      it('returns 0 when commissionable value is undefined', () => {
        const result = calculateExpectedCommission(undefined as any, 0.15)
        expect(result).toBe(0)
      })

      it('returns 0 when commission rate is undefined', () => {
        const result = calculateExpectedCommission(10000, undefined as any)
        expect(result).toBe(0)
      })
    })

    describe('Edge Cases - Negative Values', () => {
      it('returns 0 when commissionable value is negative', () => {
        const result = calculateExpectedCommission(-1000, 0.15)
        expect(result).toBe(0)
      })

      it('returns 0 when commission rate is negative', () => {
        const result = calculateExpectedCommission(10000, -0.05)
        expect(result).toBe(0)
      })

      it('returns 0 when both are negative', () => {
        const result = calculateExpectedCommission(-1000, -0.05)
        expect(result).toBe(0)
      })
    })

    describe('Commission Rate Edge Cases', () => {
      it('calculates 100% commission rate (1.0)', () => {
        const result = calculateExpectedCommission(10000, 1.0)
        expect(result).toBe(10000)
      })

      it('calculates very small commission rate (0.001)', () => {
        const result = calculateExpectedCommission(10000, 0.001)
        expect(result).toBe(10)
      })

      it('calculates typical rate of 0.15 (15%)', () => {
        const result = calculateExpectedCommission(10000, 0.15)
        expect(result).toBe(1500)
      })
    })

    describe('Precision and Rounding', () => {
      it('rounds result to 2 decimal places', () => {
        const result = calculateExpectedCommission(1000.5, 0.1575)
        expect(result).toBe(157.58)
      })

      it('handles complex decimal calculations', () => {
        const result = calculateExpectedCommission(5678.9, 0.1234)
        expect(result).toBe(700.78)
      })

      it('rounds up when necessary', () => {
        const result = calculateExpectedCommission(100, 0.3333)
        expect(result).toBe(33.33)
      })

      it('rounds down when necessary', () => {
        const result = calculateExpectedCommission(33.33, 0.1)
        expect(result).toBe(3.33)
      })
    })

    describe('Real-world Scenarios', () => {
      it('handles typical university course with GST inclusive', () => {
        // $33,900 commissionable value with 15% commission (GST inclusive)
        const result = calculateExpectedCommission(33900, 0.15, true)
        expect(result).toBe(5085)
      })

      it('handles typical university course with GST exclusive', () => {
        // $33,900 commissionable value with 15% commission (GST exclusive)
        // Base: $33,900 / 1.10 = $30,818.18
        // Result: $30,818.18 × 0.15 = $4,622.73
        const result = calculateExpectedCommission(33900, 0.15, false)
        expect(result).toBe(4622.73)
      })

      it('handles high-value course with low rate (GST inclusive)', () => {
        // $73,500 with 5% commission = $3,675
        const result = calculateExpectedCommission(73500, 0.05, true)
        expect(result).toBe(3675)
      })

      it('handles high-value course with low rate (GST exclusive)', () => {
        // $73,500 with 5% commission (GST exclusive)
        // Base: $73,500 / 1.10 = $66,818.18
        // Result: $66,818.18 × 0.05 = $3,340.91
        const result = calculateExpectedCommission(73500, 0.05, false)
        expect(result).toBe(3340.91)
      })
    })

    describe('Matches Database Formula', () => {
      it('uses same formula as PostgreSQL function (GST inclusive)', () => {
        const commissionableValue = 12345.67
        const commissionRate = 0.1345

        const result = calculateExpectedCommission(commissionableValue, commissionRate, true)
        const expected = Math.round(commissionableValue * commissionRate * 100) / 100

        expect(result).toBe(expected)
        expect(result).toBe(1660.49)
      })

      it('uses same formula as PostgreSQL function (GST exclusive)', () => {
        const commissionableValue = 12345.67
        const commissionRate = 0.1345
        const base = commissionableValue / 1.10

        const result = calculateExpectedCommission(commissionableValue, commissionRate, false)
        const expected = Math.round(base * commissionRate * 100) / 100

        expect(result).toBe(expected)
        expect(result).toBe(1509.54)
      })
    })
  })

  describe('calculateExpectedCommissionLegacy - Backward Compatibility', () => {
    describe('Basic Calculations', () => {
      it('calculates 0% rate as $0 commission', () => {
        const result = calculateExpectedCommissionLegacy(10000, 0)
        expect(result).toBe(0)
      })

      it('calculates 15% of $10,000 as $1,500.00', () => {
        const result = calculateExpectedCommissionLegacy(10000, 15)
        expect(result).toBe(1500.0)
      })

      it('calculates 100% of $5,000 as $5,000.00', () => {
        const result = calculateExpectedCommissionLegacy(5000, 100)
        expect(result).toBe(5000.0)
      })

      it('calculates 20% of $3,500 as $700.00', () => {
        const result = calculateExpectedCommissionLegacy(3500, 20)
        expect(result).toBe(700.0)
      })
    })

    describe('Edge Cases', () => {
      it('returns 0 when totalAmount is 0', () => {
        const result = calculateExpectedCommissionLegacy(0, 15)
        expect(result).toBe(0)
      })

      it('returns 0 when commissionRatePercent is 0', () => {
        const result = calculateExpectedCommissionLegacy(10000, 0)
        expect(result).toBe(0)
      })

      it('returns 0 when totalAmount is null', () => {
        const result = calculateExpectedCommissionLegacy(null as any, 15)
        expect(result).toBe(0)
      })

      it('returns 0 when totalAmount is negative', () => {
        const result = calculateExpectedCommissionLegacy(-1000, 15)
        expect(result).toBe(0)
      })
    })

    describe('Matches Old Database Formula', () => {
      it('uses same formula as Story 4.1 PostgreSQL function', () => {
        // Old database formula: ROUND(total_amount * (commission_rate_percent / 100), 2)
        const totalAmount = 12345.67
        const commissionRate = 13.45

        const result = calculateExpectedCommissionLegacy(totalAmount, commissionRate)
        const expected = Math.round(totalAmount * (commissionRate / 100) * 100) / 100

        expect(result).toBe(expected)
        expect(result).toBe(1660.49)
      })
    })
  })

  describe('Integration - Full Workflow', () => {
    it('calculates complete commission flow (GST inclusive)', () => {
      // Step 1: Calculate commissionable value
      const totalCourseValue = 10000
      const materialsCost = 500
      const adminFees = 200
      const otherFees = 100

      const commissionableValue = calculateCommissionableValue(
        totalCourseValue,
        materialsCost,
        adminFees,
        otherFees
      )
      expect(commissionableValue).toBe(9200)

      // Step 2: Calculate expected commission (GST inclusive)
      const commissionRate = 0.15 // 15%
      const expectedCommission = calculateExpectedCommission(commissionableValue, commissionRate, true)
      expect(expectedCommission).toBe(1380)
    })

    it('calculates complete commission flow (GST exclusive)', () => {
      // Step 1: Calculate commissionable value
      const totalCourseValue = 10000
      const materialsCost = 500
      const adminFees = 200
      const otherFees = 100

      const commissionableValue = calculateCommissionableValue(
        totalCourseValue,
        materialsCost,
        adminFees,
        otherFees
      )
      expect(commissionableValue).toBe(9200)

      // Step 2: Calculate expected commission (GST exclusive)
      const commissionRate = 0.15 // 15%
      const expectedCommission = calculateExpectedCommission(
        commissionableValue,
        commissionRate,
        false
      )
      expect(expectedCommission).toBe(1254.55)
    })

    it('handles workflow with no fees (GST inclusive)', () => {
      const commissionableValue = calculateCommissionableValue(10000)
      expect(commissionableValue).toBe(10000)

      const expectedCommission = calculateExpectedCommission(commissionableValue, 0.15)
      expect(expectedCommission).toBe(1500)
    })

    it('handles workflow with fees exceeding total', () => {
      const commissionableValue = calculateCommissionableValue(1000, 500, 400, 300)
      expect(commissionableValue).toBe(0)

      const expectedCommission = calculateExpectedCommission(commissionableValue, 0.15)
      expect(expectedCommission).toBe(0)
    })
  })
})
