import { useQuery } from '@tanstack/react-query'

/**
 * Query parameters for fetching colleges
 */
interface CollegesQueryParams {
  page?: number
  per_page?: number
}

/**
 * College data structure returned from API
 */
export interface College {
  id: string
  name: string
  country: string
  default_commission_rate_percent: number
  created_at: string
  updated_at: string
}

/**
 * API response structure for colleges endpoint
 */
interface CollegesResponse {
  success: boolean
  data: College[]
  meta?: {
    total: number
    page: number
    per_page: number
    total_pages: number
  }
}

/**
 * TanStack Query hook for fetching colleges
 *
 * Features:
 * - GET /api/colleges with optional query parameters
 * - Caching and automatic refetching via React Query
 * - Type-safe college data
 * - Support for pagination
 *
 * Usage:
 * ```tsx
 * const { data, isLoading, error } = useColleges()
 * const colleges = data?.data || []
 * ```
 *
 * Epic 3: Entities Domain
 * Story 3.3: Student-College Enrollment Linking
 * Task 5: Payment Plan Creation Integration
 *
 * @param params - Optional query parameters for pagination
 * @returns TanStack Query result with college data, loading state, and error
 */
export function useColleges(params?: CollegesQueryParams) {
  return useQuery({
    queryKey: ['colleges', params],
    queryFn: async () => {
      const searchParams = new URLSearchParams()
      if (params?.page) searchParams.append('page', params.page.toString())
      if (params?.per_page) searchParams.append('per_page', params.per_page.toString())

      const url = `/api/colleges${searchParams.toString() ? `?${searchParams}` : ''}`
      const response = await fetch(url)

      if (!response.ok) {
        throw new Error('Failed to fetch colleges')
      }

      return response.json() as Promise<CollegesResponse>
    },
  })
}
