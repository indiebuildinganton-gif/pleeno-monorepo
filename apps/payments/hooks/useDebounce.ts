/**
 * useDebounce Hook
 *
 * Epic 4: Payments Domain
 * Story 4.3: Payment Plan List and Detail Views
 * Task 5: Search Bar Component
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
 * // Use debouncedSearch for URL updates
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
