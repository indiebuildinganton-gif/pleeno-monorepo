/**
 * Hook to construct API URLs with basePath support
 *
 * Next.js basePath configuration affects both pages and API routes.
 * When basePath is '/dashboard', API routes are served at /dashboard/api/*
 * not /api/*
 */

import { useCallback } from 'react'

/**
 * Returns a function that constructs API URLs with the correct basePath
 *
 * @example
 * const getApiUrl = useApiUrl()
 * const url = getApiUrl('/api/kpis') // Returns '/dashboard/api/kpis'
 */
export function useApiUrl() {
  return useCallback((path: string) => {
    // If path already starts with /dashboard, don't add it again
    if (path.startsWith('/dashboard')) {
      return path
    }

    // Add basePath prefix to API routes
    return `/dashboard${path}`
  }, [])
}

/**
 * Standalone function to get API URL with basePath
 * Use this in non-React contexts (e.g., server components, utilities)
 *
 * @param path - API path (e.g., '/api/kpis')
 * @returns Full API path with basePath (e.g., '/dashboard/api/kpis')
 */
export function getApiUrl(path: string): string {
  // If path already starts with /dashboard, don't add it again
  if (path.startsWith('/dashboard')) {
    return path
  }

  // Add basePath prefix to API routes
  return `/dashboard${path}`
}
