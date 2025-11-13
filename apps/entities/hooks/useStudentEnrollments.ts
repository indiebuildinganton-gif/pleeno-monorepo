import { useQuery } from '@tanstack/react-query'

/**
 * Branch data structure with college information
 */
interface Branch {
  id: string
  name: string
  city: string
  commission_rate_percent: number
  college: {
    id: string
    name: string
    city: string
    country: string
  }
}

/**
 * Student enrollment data structure returned from API
 */
export interface StudentEnrollment {
  id: string
  program_name: string
  status: 'active' | 'completed' | 'cancelled'
  offer_letter_url: string | null
  offer_letter_filename: string | null
  created_at: string
  updated_at: string
  branch: Branch
}

/**
 * API response structure for student enrollments endpoint
 */
interface StudentEnrollmentsResponse {
  success: boolean
  data: StudentEnrollment[]
}

/**
 * TanStack Query hook for fetching student enrollments
 *
 * Features:
 * - GET /api/students/[id]/enrollments
 * - Caching and automatic refetching via React Query
 * - Type-safe enrollment data with branch and college information
 * - Automatic enabled/disabled based on studentId presence
 *
 * Usage:
 * ```tsx
 * const { data, isLoading, error } = useStudentEnrollments(studentId)
 * const enrollments = data?.data || []
 * ```
 *
 * Epic 3: Entities Domain
 * Story 3.3: Student-College Enrollment Linking
 * Task 6: Student Detail Page - Enrollments Section
 *
 * @param studentId - The ID of the student to fetch enrollments for
 * @returns TanStack Query result with enrollment data, loading state, and error
 */
export function useStudentEnrollments(studentId: string | undefined) {
  return useQuery({
    queryKey: ['students', studentId, 'enrollments'],
    queryFn: async () => {
      if (!studentId) {
        throw new Error('Student ID is required')
      }

      const response = await fetch(`/api/students/${studentId}/enrollments`)

      if (!response.ok) {
        throw new Error('Failed to fetch student enrollments')
      }

      return response.json() as Promise<StudentEnrollmentsResponse>
    },
    enabled: !!studentId,
  })
}
