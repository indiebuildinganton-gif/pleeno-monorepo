import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useToast } from '@pleeno/ui'

/**
 * Enrollment status type
 */
export type EnrollmentStatus = 'active' | 'completed' | 'cancelled'

/**
 * Mutation variables for updating enrollment status
 */
interface UpdateEnrollmentStatusVariables {
  enrollmentId: string
  newStatus: EnrollmentStatus
}

/**
 * API response structure for enrollment update
 */
interface UpdateEnrollmentStatusResponse {
  success: boolean
  data: {
    id: string
    status: EnrollmentStatus
  }
}

/**
 * TanStack Query mutation hook for updating enrollment status
 *
 * Features:
 * - PATCH /api/enrollments/[id]
 * - Optimistic updates to local cache
 * - Automatic rollback on error
 * - Invalidates and refetches related queries on success
 * - Toast notifications for success/error states
 *
 * Usage:
 * ```tsx
 * const { mutate: updateStatus, isPending } = useUpdateEnrollmentStatus()
 *
 * const handleStatusChange = (enrollmentId: string, newStatus: EnrollmentStatus) => {
 *   updateStatus({ enrollmentId, newStatus })
 * }
 * ```
 *
 * Epic 3: Entities Domain
 * Story 3.3: Student-College Enrollment Linking
 * Task 9: Enrollment Status Management UI
 *
 * @returns TanStack Query mutation result with mutate function and loading state
 */
export function useUpdateEnrollmentStatus() {
  const queryClient = useQueryClient()
  const { addToast } = useToast()

  return useMutation({
    mutationFn: async ({ enrollmentId, newStatus }: UpdateEnrollmentStatusVariables) => {
      const response = await fetch(`/api/enrollments/${enrollmentId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: newStatus }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to update enrollment status')
      }

      return response.json() as Promise<UpdateEnrollmentStatusResponse>
    },

    // Optimistic update - update UI immediately
    onMutate: async ({ enrollmentId, newStatus }) => {
      // Cancel any outgoing refetches to avoid overwriting optimistic update
      await queryClient.cancelQueries({ queryKey: ['students'] })
      await queryClient.cancelQueries({ queryKey: ['branches'] })

      // Snapshot the previous values
      const previousStudentEnrollments = queryClient.getQueriesData({
        queryKey: ['students'],
      })
      const previousBranchEnrollments = queryClient.getQueriesData({
        queryKey: ['branches'],
      })

      // Optimistically update all matching queries
      queryClient.setQueriesData<{
        success: boolean
        data: Array<{ id: string; status: string }>
      }>({ queryKey: ['students'] }, (old) => {
        if (!old) return old
        return {
          ...old,
          data: old.data.map((enrollment) =>
            enrollment.id === enrollmentId
              ? { ...enrollment, status: newStatus }
              : enrollment
          ),
        }
      })

      queryClient.setQueriesData<{
        success: boolean
        data: Array<{ id: string; status: string }>
      }>({ queryKey: ['branches'] }, (old) => {
        if (!old) return old
        return {
          ...old,
          data: old.data.map((enrollment) =>
            enrollment.id === enrollmentId
              ? { ...enrollment, status: newStatus }
              : enrollment
          ),
        }
      })

      // Return context with snapshot
      return { previousStudentEnrollments, previousBranchEnrollments }
    },

    // If mutation fails, rollback to previous values
    onError: (error, variables, context) => {
      if (context) {
        // Restore previous student enrollments
        context.previousStudentEnrollments.forEach(([queryKey, data]) => {
          queryClient.setQueryData(queryKey, data)
        })
        // Restore previous branch enrollments
        context.previousBranchEnrollments.forEach(([queryKey, data]) => {
          queryClient.setQueryData(queryKey, data)
        })
      }

      // Show error toast
      addToast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to update enrollment status',
        variant: 'error',
      })
    },

    // On success, invalidate queries to refetch fresh data
    onSuccess: (data, variables) => {
      // Invalidate all student and branch enrollment queries to refetch
      queryClient.invalidateQueries({ queryKey: ['students'] })
      queryClient.invalidateQueries({ queryKey: ['branches'] })

      // Show success toast
      const statusLabel = variables.newStatus.charAt(0).toUpperCase() + variables.newStatus.slice(1)
      addToast({
        title: 'Success',
        description: `Enrollment status updated to ${statusLabel}`,
        variant: 'success',
      })
    },
  })
}
