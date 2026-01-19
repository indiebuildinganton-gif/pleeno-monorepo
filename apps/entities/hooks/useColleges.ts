import { useQuery } from '@tanstack/react-query'
import { getApiUrl } from '@/hooks/useApiUrl'

/**
 * College data structure returned from API
 */
export interface College {
  id: string
  agency_id: string
  name: string
  city: string | null
  country: string | null
  default_commission_rate_percent: number | null
  gst_status: 'included' | 'excluded'
  contract_expiration_date: string | null
  branch_count: number
  created_at: string
  updated_at: string
}

/**
 * Pagination metadata returned from API
 */
export interface PaginationMeta {
  total: number
  page: number
  per_page: number
  total_pages: number
}

/**
 * API response structure for colleges list endpoint
 */
interface CollegesResponse {
  success: boolean
  data: College[]
  meta: PaginationMeta
}

/**
 * Query parameters for colleges list
 */
export interface CollegesParams {
  page?: number
  per_page?: number
}

/**
 * TanStack Query hook for fetching colleges list
 *
 * Features:
 * - GET /api/colleges with pagination
 * - Caching and automatic refetching via React Query
 * - Type-safe college data with branch counts
 * - Pagination support with metadata
 *
 * Usage:
 * ```tsx
 * const { data, isLoading, error } = useColleges({ page: 1, per_page: 20 })
 * const colleges = data?.data || []
 * const pagination = data?.meta
 * ```
 *
 * Epic 3: Entities Domain
 * Story 3.1: College Registry
 * Task 12: Frontend - College List Page
 *
 * @param params - Query parameters for pagination
 * @returns TanStack Query result with colleges data, pagination meta, loading state, and error
 */
export function useColleges(params: CollegesParams = {}) {
  const { page = 1, per_page = 20 } = params

  return useQuery({
    queryKey: ['colleges', page, per_page],
    queryFn: async () => {
      const searchParams = new URLSearchParams({
        page: page.toString(),
        per_page: per_page.toString(),
      })

      const response = await fetch(getApiUrl(`/api/colleges?${searchParams.toString()}`))

      if (!response.ok) {
        throw new Error('Failed to fetch colleges')
      }

      return response.json() as Promise<CollegesResponse>
    },
  })
}
