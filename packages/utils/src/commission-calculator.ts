/**
 * Commission Calculator Utility
 *
 * Provides client-side commission calculation that matches the database
 * functions exactly. Includes support for:
 * - Non-commissionable fees (materials, admin, other)
 * - GST inclusive/exclusive handling
 *
 * These utilities enable real-time preview calculations in the payment plan wizard
 * before values are persisted to the database.
 *
 * @module commission-calculator
 */

/**
 * Calculate the commission-eligible value by subtracting non-commissionable fees
 * from the total course value.
 *
 * This function matches the database calculate_commissionable_value() function exactly.
 *
 * Formula:
 * Commissionable Value = Total Course Value - Materials Cost - Admin Fees - Other Fees
 *
 * @param totalCourseValue - Total course/program value (must be >= 0)
 * @param materialsCost - Cost of materials, books, supplies (default: 0)
 * @param adminFees - Administrative or enrollment fees (default: 0)
 * @param otherFees - Miscellaneous fees (default: 0)
 * @returns Commission-eligible value rounded to 2 decimal places, minimum 0
 *
 * @example
 * ```typescript
 * // Basic calculation
 * calculateCommissionableValue(10000, 500, 200, 100) // Returns 9200.00
 *
 * // No fees
 * calculateCommissionableValue(10000, 0, 0, 0) // Returns 10000.00
 *
 * // Only materials cost
 * calculateCommissionableValue(5000, 500) // Returns 4500.00
 *
 * // Fees exceed total (edge case)
 * calculateCommissionableValue(1000, 500, 400, 300) // Returns 0.00
 * ```
 *
 * @remarks
 * - All parameters must be non-negative numbers
 * - NULL/undefined fee values are treated as 0
 * - If fees exceed total course value, returns 0 (not negative)
 * - Result is rounded to 2 decimal places to match database precision
 * - Use this for Step 2 real-time preview in payment plan wizard
 */
export function calculateCommissionableValue(
  totalCourseValue: number,
  materialsCost: number = 0,
  adminFees: number = 0,
  otherFees: number = 0
): number {
  // Handle NULL, undefined, or negative values for total
  if (!totalCourseValue || totalCourseValue < 0) {
    return 0
  }

  // Treat NULL/undefined/negative fees as 0
  const validMaterialsCost = materialsCost && materialsCost >= 0 ? materialsCost : 0
  const validAdminFees = adminFees && adminFees >= 0 ? adminFees : 0
  const validOtherFees = otherFees && otherFees >= 0 ? otherFees : 0

  // Calculate commissionable value
  const commissionableValue =
    totalCourseValue - validMaterialsCost - validAdminFees - validOtherFees

  // Ensure result is not negative and round to 2 decimal places
  const result = Math.max(commissionableValue, 0)
  return Math.round(result * 100) / 100
}

/**
 * Calculate expected commission with GST handling support.
 *
 * This function matches the enhanced database calculate_expected_commission() function
 * from Story 4.2.
 *
 * Formula:
 * - If GST Inclusive: base = commissionableValue
 * - If GST Exclusive: base = commissionableValue / 1.10 (removes 10% GST)
 * - Expected Commission = base × commissionRate
 *
 * @param commissionableValue - Commission-eligible value (from calculateCommissionableValue)
 * @param commissionRate - Commission rate as decimal (e.g., 0.15 for 15%)
 * @param gstInclusive - Whether amounts already include GST (default: true)
 * @returns Expected commission rounded to 2 decimal places
 *
 * @example
 * ```typescript
 * // GST Inclusive (default)
 * calculateExpectedCommission(9200, 0.15, true) // Returns 1380.00
 *
 * // GST Exclusive (removes 10% GST before calculating commission)
 * calculateExpectedCommission(9200, 0.15, false) // Returns 1254.55
 *
 * // Zero commission rate
 * calculateExpectedCommission(10000, 0) // Returns 0.00
 *
 * // Zero commissionable value
 * calculateExpectedCommission(0, 0.15) // Returns 0.00
 * ```
 *
 * @remarks
 * - Returns 0 for NULL, undefined, or negative values
 * - GST rate is fixed at 10% (Australian GST)
 * - Result is rounded to 2 decimal places to match database precision
 * - When gstInclusive=false, divides by 1.10 to remove GST before calculating commission
 * - Use this for Step 2 real-time preview in payment plan wizard
 */
export function calculateExpectedCommission(
  commissionableValue: number,
  commissionRate: number,
  gstInclusive: boolean = true
): number {
  // Handle NULL, undefined, or negative values
  if (!commissionableValue || commissionableValue < 0) {
    return 0
  }

  if (commissionRate === undefined || commissionRate === null || commissionRate < 0) {
    return 0
  }

  // Calculate base amount (with GST handling if needed)
  let base: number
  if (gstInclusive) {
    // GST is already included, use full amount
    base = commissionableValue
  } else {
    // GST is exclusive, remove 10% GST (divide by 1.10)
    base = commissionableValue / 1.1
  }

  // Calculate commission and round to 2 decimal places
  // Using Math.round with * 100 / 100 to avoid floating point precision issues
  return Math.round(base * commissionRate * 100) / 100
}

/**
 * @deprecated Use calculateExpectedCommission with commissionableValue instead.
 * This function is maintained for backward compatibility with Story 4.1 code.
 *
 * Calculate expected commission based on total amount and commission rate percentage.
 *
 * @param totalAmount - Total payment plan amount (must be >= 0)
 * @param commissionRatePercent - Commission rate as percentage (0-100)
 * @returns Expected commission rounded to 2 decimal places
 */
export function calculateExpectedCommissionLegacy(
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

/**
 * Commission and GST calculation utilities
 *
 * These functions handle commission calculations including GST (Goods and Services Tax)
 * in both inclusive and exclusive modes, as well as earned commission calculations
 * based on payment progress.
 */

/**
 * Calculate GST amount based on commission and GST configuration
 *
 * @param commissionAmount - The commission amount (before or including GST)
 * @param gstRate - GST rate as decimal (e.g., 0.1 for 10%)
 * @param gstInclusive - Whether commission amount already includes GST
 * @returns GST amount
 *
 * @example
 * // GST inclusive: Extract GST from total
 * calculateGST(1100, 0.1, true) // Returns 100
 *
 * // GST exclusive: Calculate GST to add
 * calculateGST(1000, 0.1, false) // Returns 100
 */
export function calculateGST(
  commissionAmount: number,
  gstRate: number,
  gstInclusive: boolean
): number {
  if (commissionAmount === 0) return 0

  if (gstInclusive) {
    // GST inclusive: GST = commission / (1 + rate) * rate
    return (commissionAmount / (1 + gstRate)) * gstRate
  } else {
    // GST exclusive: GST = commission * rate
    return commissionAmount * gstRate
  }
}

/**
 * Calculate total amount including GST
 *
 * @param commissionAmount - The commission amount
 * @param gstRate - GST rate as decimal (e.g., 0.1 for 10%)
 * @param gstInclusive - Whether commission amount already includes GST
 * @returns Total amount including GST
 *
 * @example
 * // GST inclusive: Amount already includes GST
 * calculateTotalWithGST(1100, 0.1, true) // Returns 1100
 *
 * // GST exclusive: Add GST to amount
 * calculateTotalWithGST(1000, 0.1, false) // Returns 1100
 */
export function calculateTotalWithGST(
  commissionAmount: number,
  gstRate: number,
  gstInclusive: boolean
): number {
  if (gstInclusive) {
    // Commission already includes GST, no adjustment needed
    return commissionAmount
  } else {
    // Add GST to commission
    return commissionAmount + commissionAmount * gstRate
  }
}

/**
 * Calculate earned commission from paid installments
 *
 * Calculates commission earned proportionally based on payment progress.
 * If 50% of the payment plan is paid, 50% of expected commission is earned.
 *
 * @param totalPaid - Total amount paid so far (SUM of paid installments)
 * @param totalAmount - Total payment plan amount
 * @param expectedCommission - Expected commission for the full payment plan
 * @returns Earned commission amount
 *
 * @example
 * // 50% paid
 * calculateEarnedCommission(5000, 10000, 1500) // Returns 750
 *
 * // 100% paid
 * calculateEarnedCommission(10000, 10000, 1500) // Returns 1500
 *
 * // Nothing paid
 * calculateEarnedCommission(0, 10000, 1500) // Returns 0
 */
export function calculateEarnedCommission(
  totalPaid: number,
  totalAmount: number,
  expectedCommission: number
): number {
  if (totalAmount === 0) return 0
  return (totalPaid / totalAmount) * expectedCommission
}

/**
 * Calculate outstanding commission
 *
 * @param expectedCommission - Total expected commission
 * @param earnedCommission - Commission earned so far
 * @returns Outstanding commission amount
 */
export function calculateOutstandingCommission(
  expectedCommission: number,
  earnedCommission: number
): number {
  return Math.max(0, expectedCommission - earnedCommission)
}
