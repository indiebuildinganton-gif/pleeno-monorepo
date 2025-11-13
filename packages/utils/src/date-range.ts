/**
 * Date Range Utilities
 *
 * Utilities for calculating and formatting date ranges based on time periods.
 * Used in dashboard filter controls to display human-readable date ranges.
 *
 * Epic 6: Dashboard & Reporting Zone
 * Story 6.3: Commission Breakdown by College
 * Task 3: Implement Filter Controls
 */

import {
  format,
  startOfYear,
  endOfYear,
  startOfQuarter,
  endOfQuarter,
  startOfMonth,
  endOfMonth,
} from 'date-fns'

/**
 * Time period type for filters
 */
export type TimePeriod = 'all' | 'year' | 'quarter' | 'month'

/**
 * Get human-readable date range label based on time period
 *
 * @param period - Time period ('all', 'year', 'quarter', 'month')
 * @param referenceDate - Optional reference date (defaults to current date)
 * @returns Formatted date range string
 *
 * @example
 * getDateRangeLabel('all') // 'All Time'
 * getDateRangeLabel('year') // 'Jan 1 - Dec 31, 2025'
 * getDateRangeLabel('quarter') // 'Oct 1 - Dec 31, 2025'
 * getDateRangeLabel('month') // 'Nov 1 - Nov 30, 2025'
 */
export function getDateRangeLabel(period: TimePeriod, referenceDate: Date = new Date()): string {
  switch (period) {
    case 'all':
      return 'All Time'

    case 'year':
      return `${format(startOfYear(referenceDate), 'MMM d')} - ${format(
        endOfYear(referenceDate),
        'MMM d, yyyy'
      )}`

    case 'quarter':
      return `${format(startOfQuarter(referenceDate), 'MMM d')} - ${format(
        endOfQuarter(referenceDate),
        'MMM d, yyyy'
      )}`

    case 'month':
      return `${format(startOfMonth(referenceDate), 'MMM d')} - ${format(
        endOfMonth(referenceDate),
        'MMM d, yyyy'
      )}`

    default:
      return 'All Time'
  }
}

/**
 * Get start and end dates for a time period
 *
 * @param period - Time period ('all', 'year', 'quarter', 'month')
 * @param referenceDate - Optional reference date (defaults to current date)
 * @returns Object with start and end dates, or null for 'all'
 *
 * @example
 * getDateRange('year') // { start: Date(...), end: Date(...) }
 * getDateRange('all') // null
 */
export function getDateRange(
  period: TimePeriod,
  referenceDate: Date = new Date()
): { start: Date; end: Date } | null {
  switch (period) {
    case 'all':
      return null

    case 'year':
      return {
        start: startOfYear(referenceDate),
        end: endOfYear(referenceDate),
      }

    case 'quarter':
      return {
        start: startOfQuarter(referenceDate),
        end: endOfQuarter(referenceDate),
      }

    case 'month':
      return {
        start: startOfMonth(referenceDate),
        end: endOfMonth(referenceDate),
      }

    default:
      return null
  }
}
