/**
 * Commissions Report Types
 *
 * Story 7.4: Commission Report by College
 * Task 2: Implement Commission Report API Route
 */

/**
 * Payment plan drill-down details for commission report
 */
export interface CommissionPaymentPlan {
  student_id: string
  student_name: string
  payment_plan_id: string
  total_amount: number
  paid_amount: number
  commission_earned: number
}

/**
 * Commission report row - one row per branch
 */
export interface CommissionReportRow {
  // College information
  college_id: string
  college_name: string

  // Branch information
  branch_id: string
  branch_name: string
  branch_city: string
  commission_rate_percent: number

  // Aggregated counts
  total_payment_plans: number
  total_students: number

  // Financial aggregations
  total_paid: number
  earned_commission: number
  outstanding_commission: number

  // Drill-down data: student payment plans for this branch
  payment_plans: CommissionPaymentPlan[]
}

/**
 * Request body for commissions report
 */
export interface CommissionsReportRequest {
  date_from: string // ISO date format (YYYY-MM-DD) - required
  date_to: string // ISO date format (YYYY-MM-DD) - required
  city?: string // Optional city filter
}

/**
 * Summary totals for commissions report
 */
export interface CommissionsSummary {
  total_paid: number
  total_earned: number
  total_outstanding: number
}

/**
 * Complete response for commissions report
 */
export interface CommissionsReportResponse {
  data: CommissionReportRow[]
  summary: CommissionsSummary
}
