/**
 * Payment Plans Report Types
 *
 * Story 7.1: Payment Plans Report Generator with Contract Expiration Tracking
 * Task 3: Create Payment Plans Report API Route
 */

/**
 * Contract status based on expiration date
 */
export type ContractStatus = 'active' | 'expiring_soon' | 'expired'

/**
 * Payment plan status from database enum
 */
export type PaymentPlanStatus = 'active' | 'completed' | 'cancelled'

/**
 * Payment plan report row with all computed fields
 */
export interface PaymentPlanReportRow {
  // Core identifiers
  id: string
  reference_number: string | null

  // Student and college info
  student_id: string
  student_name: string
  college_id: string
  college_name: string
  branch_id: string | null
  branch_name: string | null

  // Program details
  program_name: string

  // Financial details
  plan_amount: number
  currency: string
  commission_rate_percent: number
  expected_commission: number

  // Payment tracking
  total_paid: number
  total_remaining: number
  earned_commission: number

  // Status
  status: PaymentPlanStatus

  // Contract expiration tracking
  contract_expiration_date: string | null
  days_until_contract_expiration: number | null
  contract_status: ContractStatus | null

  // Timeline
  start_date: string
  created_at: string
  updated_at: string
}

/**
 * Request filters for payment plans report
 */
export interface PaymentPlansReportFilters {
  date_from?: string
  date_to?: string
  college_ids?: string[]
  branch_ids?: string[]
  student_ids?: string[]
  status?: PaymentPlanStatus[]
  contract_expiration_from?: string
  contract_expiration_to?: string
}

/**
 * Pagination configuration
 */
export interface PaginationParams {
  page: number
  page_size: number
}

/**
 * Sort configuration
 */
export interface SortParams {
  column: string
  direction: 'asc' | 'desc'
}

/**
 * Complete request body for payment plans report
 */
export interface PaymentPlansReportRequest {
  filters: PaymentPlansReportFilters
  columns: string[]
  pagination: PaginationParams
  sort?: SortParams
}

/**
 * Pagination metadata in response
 */
export interface PaginationMetadata {
  page: number
  page_size: number
  total_count: number
  total_pages: number
}

/**
 * Summary totals for the entire dataset (not just current page)
 */
export interface ReportSummary {
  total_plan_amount: number
  total_paid_amount: number
  total_commission: number
}

/**
 * Complete response for payment plans report
 */
export interface PaymentPlansReportResponse {
  data: PaymentPlanReportRow[]
  pagination: PaginationMetadata
  summary: ReportSummary
}
