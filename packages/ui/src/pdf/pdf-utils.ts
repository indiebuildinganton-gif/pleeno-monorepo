/**
 * PDF Utility Functions
 *
 * Story 7.3: PDF Export Functionality
 * Task 6: Add Summary Totals Section
 *
 * Utility functions for PDF generation including currency formatting and calculations
 */

export interface SummaryMetrics {
  totalRecords: number
  totalAmount: number
  expectedCommission: number
  earnedCommission: number
  outstandingCommission: number
}

export interface PaymentPlanRow {
  plan_amount: number
  expected_commission: number
  earned_commission: number
  total_amount?: number // Alternative field name
}

/**
 * Calculate summary metrics from payment plan data
 *
 * @param data - Array of payment plan rows
 * @returns Summary metrics object
 */
export function calculateSummary(data: PaymentPlanRow[]): SummaryMetrics {
  const totalRecords = data.length

  const totalAmount = data.reduce((sum, plan) => {
    return sum + (plan.total_amount || plan.plan_amount || 0)
  }, 0)

  const expectedCommission = data.reduce((sum, plan) => {
    return sum + (plan.expected_commission || 0)
  }, 0)

  const earnedCommission = data.reduce((sum, plan) => {
    return sum + (plan.earned_commission || 0)
  }, 0)

  const outstandingCommission = expectedCommission - earnedCommission

  return {
    totalRecords,
    totalAmount,
    expectedCommission,
    earnedCommission,
    outstandingCommission,
  }
}

/**
 * Format currency value with AUD formatting
 *
 * @param value - Numeric value to format
 * @param currency - Currency code (default: 'AUD')
 * @returns Formatted currency string (e.g., "$1,234.56")
 */
export function formatCurrency(value: number, currency: string = 'AUD'): string {
  if (value === null || value === undefined || isNaN(value)) {
    return '$0.00'
  }

  return new Intl.NumberFormat('en-AU', {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value)
}

/**
 * Format date to ISO string (YYYY-MM-DD)
 *
 * @param date - Date string or Date object
 * @returns Formatted date string
 */
export function formatDate(date: string | Date): string {
  if (!date) return ''

  const dateObj = typeof date === 'string' ? new Date(date) : date

  if (isNaN(dateObj.getTime())) {
    return ''
  }

  return dateObj.toISOString().split('T')[0]
}

/**
 * Format datetime for PDF metadata
 *
 * @param date - Date object (defaults to now)
 * @returns Formatted datetime string (e.g., "2025-11-14 14:30:00")
 */
export function formatDateTime(date: Date = new Date()): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  const hours = String(date.getHours()).padStart(2, '0')
  const minutes = String(date.getMinutes()).padStart(2, '0')
  const seconds = String(date.getSeconds()).padStart(2, '0')

  return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`
}

/**
 * Generate PDF filename with timestamp
 *
 * @param reportType - Type of report (default: 'payment_plans')
 * @returns Filename string (e.g., "payment_plans_2025-11-14_143000.pdf")
 */
export function generatePDFFilename(reportType: string = 'payment_plans'): string {
  const now = new Date()
  const year = now.getFullYear()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  const day = String(now.getDate()).padStart(2, '0')
  const hours = String(now.getHours()).padStart(2, '0')
  const minutes = String(now.getMinutes()).padStart(2, '0')
  const seconds = String(now.getSeconds()).padStart(2, '0')

  const timestamp = `${year}-${month}-${day}_${hours}${minutes}${seconds}`

  return `${reportType}_${timestamp}.pdf`
}

/**
 * Validate summary calculations against source data
 *
 * @param data - Source payment plan data
 * @param summary - Calculated summary metrics
 * @returns True if validation passes, false otherwise
 */
export function validateSummary(data: PaymentPlanRow[], summary: SummaryMetrics): boolean {
  const recalculated = calculateSummary(data)

  const tolerance = 0.01 // Allow 1 cent difference due to floating point precision

  return (
    summary.totalRecords === recalculated.totalRecords &&
    Math.abs(summary.totalAmount - recalculated.totalAmount) < tolerance &&
    Math.abs(summary.expectedCommission - recalculated.expectedCommission) < tolerance &&
    Math.abs(summary.earnedCommission - recalculated.earnedCommission) < tolerance &&
    Math.abs(summary.outstandingCommission - recalculated.outstandingCommission) < tolerance
  )
}
