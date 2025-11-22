/**
 * Formatting Utilities
 *
 * Provides consistent formatting functions for currency, percentages, and other values
 * across the application.
 *
 * @module formatters
 */

/**
 * Format a number as currency with locale-specific formatting
 *
 * @param amount - The amount to format
 * @param currency - Currency code (default: 'AUD')
 * @param locale - Locale for formatting (default: 'en-AU')
 * @returns Formatted currency string
 *
 * @example
 * ```typescript
 * formatCurrency(1500, 'USD') // Returns "$1,500.00"
 * formatCurrency(1500.50, 'EUR', 'de-DE') // Returns "1.500,50 €"
 * formatCurrency(1500, 'AUD', 'en-AU') // Returns "$1,500.00"
 * ```
 *
 * @remarks
 * - Returns formatted zero value for NaN inputs
 * - Always displays 2 decimal places
 * - Uses Intl.NumberFormat for locale-aware formatting
 */
export function formatCurrency(
  amount: number,
  currency: string = 'AUD',
  locale: string = 'en-AU'
): string {
  if (isNaN(amount)) return formatCurrency(0, currency, locale)

  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount)
}

/**
 * Format a percentage value
 *
 * @param value - The percentage value (0-100)
 * @param decimals - Number of decimal places (default: 2)
 * @returns Formatted percentage string
 *
 * @example
 * ```typescript
 * formatPercent(15) // Returns "15.00%"
 * formatPercent(15.5, 1) // Returns "15.5%"
 * formatPercent(0.5, 2) // Returns "0.50%"
 * ```
 *
 * @remarks
 * - Returns "0%" for NaN inputs
 * - Does not convert decimal to percentage (input 15 = output 15%, not 1500%)
 */
export function formatPercent(value: number, decimals: number = 2): string {
  if (isNaN(value)) return '0%'
  return `${value.toFixed(decimals)}%`
}

/**
 * Format a number with thousands separators
 *
 * @param value - The number to format
 * @param decimals - Number of decimal places (default: 0)
 * @param locale - Locale for formatting (default: 'en-US')
 * @returns Formatted number string
 *
 * @example
 * ```typescript
 * formatNumber(1500) // Returns "1,500"
 * formatNumber(1500.50, 2) // Returns "1,500.50"
 * formatNumber(1500000, 0, 'de-DE') // Returns "1.500.000"
 * ```
 */
export function formatNumber(
  value: number,
  decimals: number = 0,
  locale: string = 'en-US'
): string {
  if (isNaN(value)) return formatNumber(0, decimals, locale)

  return new Intl.NumberFormat(locale, {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(value)
}

/**
 * Format date as readable string
 *
 * @param date - Date string, Date object, or null
 * @param formatString - Output format (default: 'MMM d, yyyy')
 * @param locale - Locale for formatting (default: 'en-AU')
 * @returns Formatted date string or 'N/A' if date is null
 *
 * @example
 * ```typescript
 * formatDate('2025-11-15') // Returns "Nov 15, 2025"
 * formatDate(new Date('2025-11-15'), 'dd/MM/yyyy') // Returns "15/11/2025"
 * formatDate('2025-11-15T10:30:00Z', 'MMM d, yyyy h:mm a') // Returns "Nov 15, 2025 10:30 AM"
 * formatDate(null) // Returns "N/A"
 * ```
 *
 * @remarks
 * - Returns 'N/A' for null/undefined inputs
 * - Uses Australian locale by default ('en-AU')
 * - Common format strings:
 *   - 'MMM d, yyyy' → "Nov 15, 2025"
 *   - 'dd/MM/yyyy' → "15/11/2025"
 *   - 'yyyy-MM-dd' → "2025-11-15"
 *   - 'MMMM d, yyyy' → "November 15, 2025"
 */
export function formatDate(
  date: string | Date | null,
  formatString: string = 'MMM d, yyyy',
  locale: string = 'en-AU'
): string {
  if (!date) return 'N/A'

  try {
    const dateObj = typeof date === 'string' ? new Date(date) : date

    // Check if date is valid
    if (isNaN(dateObj.getTime())) {
      return 'N/A'
    }

    // Simple date formatting using Intl.DateTimeFormat
    // For more complex formats, consider using date-fns
    if (formatString === 'MMM d, yyyy') {
      return dateObj.toLocaleDateString(locale, {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      })
    } else if (formatString === 'dd/MM/yyyy') {
      return dateObj.toLocaleDateString(locale, {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
      })
    } else if (formatString === 'yyyy-MM-dd') {
      const year = dateObj.getFullYear()
      const month = String(dateObj.getMonth() + 1).padStart(2, '0')
      const day = String(dateObj.getDate()).padStart(2, '0')
      return `${year}-${month}-${day}`
    } else {
      // Default to standard locale format
      return dateObj.toLocaleDateString(locale)
    }
  } catch (error) {
    console.error('Date formatting error:', error)
    return 'N/A'
  }
}

/**
 * Alias for formatPercent for consistency with other formatters
 *
 * @param value - The percentage value (0-100)
 * @param decimals - Number of decimal places (default: 1)
 * @returns Formatted percentage string
 *
 * @example
 * ```typescript
 * formatPercentage(15.5) // Returns "15.5%"
 * formatPercentage(15.5, 2) // Returns "15.50%"
 * formatPercentage(0.5, 1) // Returns "0.5%"
 * ```
 */
export function formatPercentage(value: number, decimals: number = 1): string {
  return formatPercent(value, decimals)
}
