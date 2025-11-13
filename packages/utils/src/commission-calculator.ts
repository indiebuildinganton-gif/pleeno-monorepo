/**
 * Commission Calculator Utility
 *
 * Provides client-side commission calculation that matches the database
 * calculate_expected_commission() function exactly.
 *
 * @module commission-calculator
 */

/**
 * Calculate expected commission based on total amount and commission rate.
 *
 * This function matches the database formula exactly:
 * expected_commission = total_amount * (commission_rate_percent / 100)
 *
 * @param totalAmount - Total payment plan amount (must be >= 0)
 * @param commissionRatePercent - Commission rate as percentage (0-100)
 * @returns Expected commission rounded to 2 decimal places
 *
 * @example
 * ```typescript
 * calculateExpectedCommission(10000, 15) // Returns 1500.00
 * calculateExpectedCommission(5000, 0) // Returns 0.00
 * calculateExpectedCommission(3500, 20) // Returns 700.00
 * calculateExpectedCommission(100000, 0.5) // Returns 500.00
 * ```
 *
 * @remarks
 * - Returns 0 for NULL, undefined, or negative values
 * - Result is rounded to 2 decimal places to match database precision
 * - Use this for real-time preview calculations before database insert
 */
export function calculateExpectedCommission(
  totalAmount: number,
  commissionRatePercent: number
): number {
  // Handle NULL, undefined, or falsy values
  if (!totalAmount || !commissionRatePercent) {
    return 0
  }

  // Handle negative values
  if (totalAmount < 0 || commissionRatePercent < 0) {
    return 0
  }

  // Calculate commission and round to 2 decimal places
  // Using Math.round with * 100 / 100 to avoid floating point precision issues
  return Math.round(totalAmount * (commissionRatePercent / 100) * 100) / 100
}
