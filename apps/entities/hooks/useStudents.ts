import { useQuery } from '@tanstack/react-query'
import { getApiUrl } from '@/hooks/useApiUrl'

/**
 * Student data structure returned from API
 */
export interface Student {
  id: string
  agency_id: string
  full_name: string
  email: string | null
  phone: string | null
  passport_number: string
  date_of_birth: string | null
  nationality: string | null
  visa_status: 'in_process' | 'approved' | 'denied' | 'expired' | null
  latest_enrollment: {
    college_name: string | null
    branch_name: string | null
    branch_city: string | null
  } | null
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
 * API response structure for students list endpoint
 */
interface StudentsResponse {
  success: boolean
  data: Student[]
  meta: PaginationMeta
}

/**
 * Query parameters for students list
 */
export interface StudentsParams {
  page?: number
  per_page?: number
  search?: string
}

/**
 * TanStack Query hook for fetching students list
 *
 * Features:
 * - GET /api/students with pagination and search
 * - Caching and automatic refetching via React Query
 * - Type-safe student data with enrollment information
 * - Search support across name, email, phone, and passport
 *
 * Usage:
 * ```tsx
 * const { data, isLoading, error } = useStudents({ page: 1, per_page: 20, search: 'john' })
 * const students = data?.data || []
 * const pagination = data?.meta
 * ```
 *
 * Epic 3: Entities Domain
 * Story 3.2: Student Registry
 * Task 8: Student List UI Component
 *
 * @param params - Query parameters for pagination and search
 * @returns TanStack Query result with students data, pagination meta, loading state, and error
 */
export function useStudents(params: StudentsParams = {}) {
  const { page = 1, per_page = 20, search = '' } = params

  return useQuery({
    queryKey: ['students', page, per_page, search],
    queryFn: async () => {
      const searchParams = new URLSearchParams({
        page: page.toString(),
        per_page: per_page.toString(),
      })

      if (search.trim()) {
        searchParams.append('search', search.trim())
      }

      const response = await fetch(getApiUrl(`/api/students?${searchParams.toString()}`))

      if (!response.ok) {
        throw new Error('Failed to fetch students')
      }

      return response.json() as Promise<StudentsResponse>
    },
  })
}
