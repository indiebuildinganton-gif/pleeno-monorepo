import { useQuery } from '@tanstack/react-query'

/**
 * Query parameters for fetching students
 */
interface StudentsQueryParams {
  search?: string
  page?: number
  per_page?: number
}

/**
 * Student data structure returned from API
 */
export interface Student {
  id: string
  first_name: string
  last_name: string
  full_name: string
  email: string
  phone: string
  passport_number: string
  created_at: string
  updated_at: string
}

/**
 * API response structure for students endpoint
 */
interface StudentsResponse {
  success: boolean
  data: Student[]
  meta?: {
    total: number
    page: number
    per_page: number
    total_pages: number
  }
}

/**
 * TanStack Query hook for fetching students
 *
 * Features:
 * - GET /api/students with optional query parameters
 * - Caching and automatic refetching via React Query
 * - Type-safe student data
 * - Support for search and pagination
 *
 * Usage:
 * ```tsx
 * const { data, isLoading, error } = useStudents({ search: 'John' })
 * const students = data?.data || []
 * ```
 *
 * Epic 3: Entities Domain
 * Story 3.3: Student-College Enrollment Linking
 * Task 5: Payment Plan Creation Integration
 *
 * @param params - Optional query parameters for filtering students
 * @returns TanStack Query result with student data, loading state, and error
 */
export function useStudents(params?: StudentsQueryParams) {
  return useQuery({
    queryKey: ['students', params],
    queryFn: async () => {
      const searchParams = new URLSearchParams()
      if (params?.search) searchParams.append('search', params.search)
      if (params?.page) searchParams.append('page', params.page.toString())
      if (params?.per_page) searchParams.append('per_page', params.per_page.toString())

      const url = `/api/students${searchParams.toString() ? `?${searchParams}` : ''}`
      const response = await fetch(url)

      if (!response.ok) {
        throw new Error('Failed to fetch students')
      }

      return response.json() as Promise<StudentsResponse>
    },
  })
}
