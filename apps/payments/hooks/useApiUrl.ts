/**
 * Hook to construct API URLs with basePath support
 *
 * Next.js basePath configuration affects both pages and API routes.
 * When basePath is '/payments', API routes are served at /payments/api/*
 * not /api/*
 */

import { useCallback } from 'react'

/**
 * Returns a function that constructs API URLs with the correct basePath
 *
 * @example
 * const getApiUrl = useApiUrl()
 * const url = getApiUrl('/api/payment-plans') // Returns '/payments/api/payment-plans'
 */
export function useApiUrl() {
  return useCallback((path: string) => {
    // If path already starts with /payments, don't add it again
    if (path.startsWith('/payments')) {
      return path
    }

    // Add basePath prefix to API routes
    return `/payments${path}`
  }, [])
}

/**
 * Standalone function to get API URL with basePath
 * Use this in non-React contexts (e.g., server components, utilities)
 *
 * @param path - API path (e.g., '/api/payment-plans')
 * @returns Full API path with basePath (e.g., '/payments/api/payment-plans')
 */
export function getApiUrl(path: string): string {
  // If path already starts with /payments, don't add it again
  if (path.startsWith('/payments')) {
    return path
  }

  // Add basePath prefix to API routes
  return `/payments${path}`
}
