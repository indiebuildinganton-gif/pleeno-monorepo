import { useQuery } from '@tanstack/react-query'

/**
 * Query parameters for fetching enrollments
 */
interface EnrollmentsQueryParams {
  status?: 'active' | 'completed' | 'cancelled'
  student_id?: string
  college_id?: string
}

/**
 * Enrollment data structure returned from API
 */
export interface Enrollment {
  id: string
  program_name: string
  status: string
  student: {
    id: string
    first_name: string
    last_name: string
  }
  branch: {
    id: string
    city: string
    commission_rate_percent: number
    college: {
      id: string
      name: string
    }
  }
}

/**
 * API response structure for enrollments endpoint
 */
interface EnrollmentsResponse {
  success: boolean
  data: Enrollment[]
}

/**
 * TanStack Query hook for fetching enrollments
 *
 * Features:
 * - GET /api/enrollments with optional query parameters
 * - Caching and automatic refetching via React Query
 * - Type-safe enrollment data
 * - Support for filtering by status, student_id, or college_id
 *
 * Usage:
 * ```tsx
 * const { data, isLoading, error } = useEnrollments({ status: 'active' })
 * const enrollments = data?.data || []
 * ```
 *
 * Epic 4: Payments Domain
 * Story 4.1: Payment Plan Creation
 * Task 7: Enrollment Dropdown Component
 *
 * @param params - Optional query parameters for filtering enrollments
 * @returns TanStack Query result with enrollment data, loading state, and error
 */
export function useEnrollments(params?: EnrollmentsQueryParams) {
  return useQuery({
    queryKey: ['enrollments', params],
    queryFn: async () => {
      const searchParams = new URLSearchParams()
      if (params?.status) searchParams.append('status', params.status)
      if (params?.student_id) searchParams.append('student_id', params.student_id)
      if (params?.college_id) searchParams.append('college_id', params.college_id)

      const url = `/api/enrollments${searchParams.toString() ? `?${searchParams}` : ''}`
      const response = await fetch(url)

      if (!response.ok) {
        throw new Error('Failed to fetch enrollments')
      }

      return response.json() as Promise<EnrollmentsResponse>
    },
  })
}
