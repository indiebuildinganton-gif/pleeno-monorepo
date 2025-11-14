/**
 * useDebounce Hook
 *
 * Epic 3: Entities Domain
 * Story 3.1: College Registry
 * Task 17: Create Activity Feed Component
 *
 * Custom hook to debounce a value, useful for search inputs.
 */

import { useEffect, useState } from 'react'

/**
 * Custom hook to debounce a value
 *
 * @param value - The value to debounce
 * @param delay - Delay in milliseconds (default: 300ms)
 * @returns Debounced value
 *
 * @example
 * ```tsx
 * const [searchQuery, setSearchQuery] = useState('')
 * const debouncedSearch = useDebounce(searchQuery, 300)
 *
 * // Use debouncedSearch for URL updates or API calls
 * useEffect(() => {
 *   if (debouncedSearch) {
 *     // Update URL or make API call
 *   }
 * }, [debouncedSearch])
 * ```
 */
export function useDebounce<T>(value: T, delay: number = 300): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value)

  useEffect(() => {
    // Set up a timer to update the debounced value after the delay
    const handler = setTimeout(() => {
      setDebouncedValue(value)
    }, delay)

    // Clean up the timer if value changes before delay is complete
    return () => {
      clearTimeout(handler)
    }
  }, [value, delay])

  return debouncedValue
}
