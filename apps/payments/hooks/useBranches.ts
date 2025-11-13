import { useQuery } from '@tanstack/react-query'

/**
 * Branch data structure returned from API
 */
export interface Branch {
  id: string
  college_id: string
  name: string
  city: string
  commission_rate_percent: number
  created_at: string
  updated_at: string
}

/**
 * API response structure for branches endpoint
 */
interface BranchesResponse {
  success: boolean
  data: Branch[]
}

/**
 * TanStack Query hook for fetching branches for a specific college
 *
 * Features:
 * - GET /api/colleges/[id]/branches
 * - Caching and automatic refetching via React Query
 * - Type-safe branch data
 * - Conditional fetching (only when collegeId is provided)
 *
 * Usage:
 * ```tsx
 * const { data, isLoading, error } = useBranches(collegeId)
 * const branches = data?.data || []
 * ```
 *
 * Epic 3: Entities Domain
 * Story 3.3: Student-College Enrollment Linking
 * Task 5: Payment Plan Creation Integration
 *
 * @param collegeId - UUID of the college to fetch branches for
 * @returns TanStack Query result with branch data, loading state, and error
 */
export function useBranches(collegeId?: string) {
  return useQuery({
    queryKey: ['branches', collegeId],
    queryFn: async () => {
      if (!collegeId) {
        throw new Error('College ID is required')
      }

      const url = `/api/colleges/${collegeId}/branches`
      const response = await fetch(url)

      if (!response.ok) {
        throw new Error('Failed to fetch branches')
      }

      return response.json() as Promise<BranchesResponse>
    },
    enabled: !!collegeId, // Only run query if collegeId is provided
  })
}
