/**
 * useDebounce Hook
 *
 * Story 7.1: Payment Plans Report Generator with Contract Expiration Tracking
 * Task 7: Create Colleges/Branches/Students Lookup APIs
 *
 * Custom hook to debounce a value, useful for typeahead search inputs.
 */

import { useEffect, useState } from 'react'

/**
 * Custom hook to debounce a value
 *
 * @param value - The value to debounce
 * @param delay - Delay in milliseconds (default: 500ms)
 * @returns Debounced value
 *
 * @example
 * ```tsx
 * const [searchQuery, setSearchQuery] = useState('')
 * const debouncedSearch = useDebounce(searchQuery, 500)
 *
 * // Use debouncedSearch for API calls
 * useEffect(() => {
 *   if (debouncedSearch) {
 *     // Make API call
 *   }
 * }, [debouncedSearch])
 * ```
 */
export function useDebounce<T>(value: T, delay: number = 500): T {
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
