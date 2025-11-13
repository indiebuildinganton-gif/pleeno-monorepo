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
 * @param currency - Currency code (USD, EUR, GBP, AUD, etc.)
 * @param locale - Locale for formatting (default: 'en-US')
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
  currency: string,
  locale: string = 'en-US'
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
