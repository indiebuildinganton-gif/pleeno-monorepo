import {
  format,
  formatDistanceToNow,
  addDays,
  isAfter,
  isBefore,
  startOfDay,
  isSameDay,
} from 'date-fns'
import { toZonedTime, fromZonedTime } from 'date-fns-tz'

/**
 * Format a date in the agency's timezone
 * @param date - Date to format (UTC)
 * @param timezone - IANA timezone (e.g., 'Australia/Brisbane')
 * @param formatString - date-fns format string (default: 'PPpp')
 * @returns Formatted date string in agency timezone
 * @example
 * ```ts
 * formatDateInAgencyTimezone(new Date('2024-01-01T00:00:00Z'), 'Australia/Brisbane')
 * // Returns: "Jan 1, 2024, 10:00 AM" (Brisbane is UTC+10)
 *
 * formatDateInAgencyTimezone('2024-01-01T00:00:00Z', 'America/New_York', 'yyyy-MM-dd HH:mm')
 * // Returns: "2023-12-31 19:00" (New York is UTC-5)
 * ```
 */
export function formatDateInAgencyTimezone(
  date: Date | string,
  timezone: string,
  formatString: string = 'PPpp'
): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date
  const zonedDate = toZonedTime(dateObj, timezone)
  return format(zonedDate, formatString)
}

/**
 * Get relative time string (e.g., "2 hours ago")
 * @param date - Date to compare (UTC)
 * @returns Relative time string
 * @example
 * ```ts
 * const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000)
 * getRelativeTime(twoHoursAgo)
 * // Returns: "2 hours ago"
 *
 * getRelativeTime('2024-01-01T00:00:00Z')
 * // Returns: "about 11 months ago" (assuming current date is 2025-11-13)
 * ```
 */
export function getRelativeTime(date: Date | string): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date
  return formatDistanceToNow(dateObj, { addSuffix: true })
}

/**
 * Convert local date to UTC for storage
 * @param date - Local date
 * @param timezone - IANA timezone
 * @returns UTC Date
 * @example
 * ```ts
 * const localDate = new Date('2024-01-01T10:00:00')
 * convertToUTC(localDate, 'Australia/Brisbane')
 * // Returns: Date object representing 2024-01-01T00:00:00Z
 * ```
 */
export function convertToUTC(date: Date, timezone: string): Date {
  return fromZonedTime(date, timezone)
}

/**
 * Format a date with common presets for the agency's timezone
 */
export const DateFormatPresets = {
  /**
   * Full date and time: "Jan 1, 2024, 10:00 AM"
   */
  full: 'PPpp',

  /**
   * Date only: "Jan 1, 2024"
   */
  date: 'PP',

  /**
   * Time only: "10:00 AM"
   */
  time: 'p',

  /**
   * Short date: "01/01/2024"
   */
  shortDate: 'P',

  /**
   * ISO format: "2024-01-01"
   */
  isoDate: 'yyyy-MM-dd',

  /**
   * ISO datetime: "2024-01-01 10:00"
   */
  isoDateTime: 'yyyy-MM-dd HH:mm',

  /**
   * Long format: "January 1, 2024 at 10:00 AM"
   */
  long: "PPPP 'at' p",
} as const

/**
 * Format a date using a preset format in the agency's timezone
 * @param date - Date to format (UTC)
 * @param timezone - IANA timezone
 * @param preset - Preset format key
 * @returns Formatted date string
 * @example
 * ```ts
 * formatDateWithPreset(new Date('2024-01-01T00:00:00Z'), 'Australia/Brisbane', 'date')
 * // Returns: "Jan 1, 2024"
 *
 * formatDateWithPreset('2024-01-01T00:00:00Z', 'America/New_York', 'isoDateTime')
 * // Returns: "2023-12-31 19:00"
 * ```
 */
export function formatDateWithPreset(
  date: Date | string,
  timezone: string,
  preset: keyof typeof DateFormatPresets
): string {
  return formatDateInAgencyTimezone(date, timezone, DateFormatPresets[preset])
}

/**
 * Check if a date is "due soon" based on a threshold in days
 * @param dueDate - The due date to check (UTC or string)
 * @param thresholdDays - Number of days before due date to consider "due soon" (default: 4)
 * @param timezone - IANA timezone for agency-aware calculations (default: 'UTC')
 * @returns true if the due date is between today and today + thresholdDays (inclusive)
 * @example
 * ```ts
 * // Today is 2024-01-01
 * isDueSoon('2024-01-03T00:00:00Z', 4) // Returns: true (3 days away, within 4-day threshold)
 * isDueSoon('2024-01-06T00:00:00Z', 4) // Returns: false (5 days away, outside 4-day threshold)
 * isDueSoon('2024-01-04T23:59:59Z', 4) // Returns: true (3 days away)
 * isDueSoon('2023-12-31T00:00:00Z', 4) // Returns: false (in the past)
 *
 * // With timezone awareness (Brisbane is UTC+10)
 * // Current time in Brisbane: 2024-01-01 10:00 AM
 * // Current time in UTC: 2024-01-01 00:00 AM
 * isDueSoon('2024-01-04T00:00:00Z', 4, 'Australia/Brisbane') // Checks against Brisbane's current date
 * ```
 */
export function isDueSoon(
  dueDate: Date | string,
  thresholdDays: number = 4,
  timezone: string = 'UTC'
): boolean {
  if (!dueDate) {
    return false
  }

  // Convert due date to Date object if string
  const dueDateObj = typeof dueDate === 'string' ? new Date(dueDate) : dueDate

  // Get current date in agency timezone (start of day)
  const now = new Date()
  const agencyNow = toZonedTime(now, timezone)
  const agencyToday = startOfDay(agencyNow)

  // Convert due date to agency timezone (start of day)
  const agencyDueDate = toZonedTime(dueDateObj, timezone)
  const agencyDueDateStartOfDay = startOfDay(agencyDueDate)

  // Calculate threshold date (today + thresholdDays)
  const thresholdDate = addDays(agencyToday, thresholdDays)

  // Check if due date is:
  // 1. On or after today (not in the past)
  // 2. On or before threshold date (within threshold)
  const isNotPast =
    isAfter(agencyDueDateStartOfDay, agencyToday) || isSameDay(agencyDueDateStartOfDay, agencyToday)
  const isWithinThreshold =
    isBefore(agencyDueDateStartOfDay, thresholdDate) ||
    isSameDay(agencyDueDateStartOfDay, thresholdDate)

  return isNotPast && isWithinThreshold
}
