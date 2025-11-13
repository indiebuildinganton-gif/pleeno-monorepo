import { useQuery } from '@tanstack/react-query'

/**
 * Student data structure
 */
interface Student {
  id: string
  full_name: string
  email: string | null
  phone: string | null
  passport_number: string | null
  visa_status: string | null
}

/**
 * Branch enrollment data structure returned from API
 */
export interface BranchEnrollment {
  id: string
  program_name: string
  status: 'active' | 'completed' | 'cancelled'
  offer_letter_url: string | null
  offer_letter_filename: string | null
  created_at: string
  updated_at: string
  student: Student
}

/**
 * API response structure for branch enrollments endpoint
 */
interface BranchEnrollmentsResponse {
  success: boolean
  data: BranchEnrollment[]
}

/**
 * TanStack Query hook for fetching branch enrollments
 *
 * Features:
 * - GET /api/branches/[id]/enrollments
 * - Caching and automatic refetching via React Query
 * - Type-safe enrollment data with student information
 * - Automatic enabled/disabled based on branchId presence
 *
 * Usage:
 * ```tsx
 * const { data, isLoading, error } = useBranchEnrollments(branchId)
 * const enrollments = data?.data || []
 * ```
 *
 * Epic 3: Entities Domain
 * Story 3.3: Student-College Enrollment Linking
 * Task 7: College Detail Page - Enrolled Students Section
 *
 * @param branchId - The ID of the branch to fetch enrollments for
 * @returns TanStack Query result with enrollment data, loading state, and error
 */
export function useBranchEnrollments(branchId: string | undefined) {
  return useQuery({
    queryKey: ['branches', branchId, 'enrollments'],
    queryFn: async () => {
      if (!branchId) {
        throw new Error('Branch ID is required')
      }

      const response = await fetch(`/api/branches/${branchId}/enrollments`)

      if (!response.ok) {
        throw new Error('Failed to fetch branch enrollments')
      }

      return response.json() as Promise<BranchEnrollmentsResponse>
    },
    enabled: !!branchId,
  })
}
