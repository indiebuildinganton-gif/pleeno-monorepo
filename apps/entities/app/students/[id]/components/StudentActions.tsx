/**
 * Student Actions Component
 *
 * Displays action buttons for student management:
 * - Edit Info: Navigate to edit page
 * - New Payment Plan: Create payment plan for student
 * - Delete: Delete student with confirmation
 *
 * Epic 3: Entities Domain
 * Story 3.2: Student Registry
 * Task 10: Student Detail Page - Action Buttons
 */

'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { getApiUrl } from '@/hooks/useApiUrl'
import {
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@pleeno/ui'
import { Edit, Plus, Trash2 } from 'lucide-react'

interface StudentActionsProps {
  studentId: string
  studentName: string
}

/**
 * StudentActions - Action buttons for student management
 *
 * Features:
 * - Edit Info button - navigates to edit page
 * - New Payment Plan button - navigates to payment plan creation
 * - Delete button - shows confirmation dialog before deletion
 * - Loading states during deletion
 * - Error handling for delete operation
 *
 * @param studentId - The ID of the student
 * @param studentName - The name of the student (for confirmation dialog)
 */
export function StudentActions({ studentId, studentName }: StudentActionsProps) {
  const router = useRouter()
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [deleteError, setDeleteError] = useState<string | null>(null)

  const handleEdit = () => {
    router.push(`/students/${studentId}/edit`)
  }

  const handleNewPaymentPlan = () => {
    // Navigate to payment plan creation with student pre-selected
    router.push(`/payment-plans/new?student_id=${studentId}`)
  }

  const handleDeleteConfirm = async () => {
    setIsDeleting(true)
    setDeleteError(null)

    try {
      const response = await fetch(getApiUrl(`/api/students/${studentId}`), {
        method: 'DELETE',
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || 'Failed to delete student')
      }

      // Navigate back to students list on success
      router.push('/students')
      router.refresh()
    } catch (error) {
      console.error('Failed to delete student:', error)
      setDeleteError(
        error instanceof Error ? error.message : 'Failed to delete student'
      )
      setIsDeleting(false)
    }
  }

  return (
    <>
      <div className="flex gap-2">
        <Button variant="outline" size="sm" onClick={handleEdit}>
          <Edit className="h-4 w-4 mr-2" />
          Edit Info
        </Button>
        <Button variant="outline" size="sm" onClick={handleNewPaymentPlan}>
          <Plus className="h-4 w-4 mr-2" />
          New Payment Plan
        </Button>
        <Button
          variant="destructive"
          size="sm"
          onClick={() => setIsDeleteDialogOpen(true)}
        >
          <Trash2 className="h-4 w-4 mr-2" />
          Delete
        </Button>
      </div>

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Student</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete <strong>{studentName}</strong>?
              <br />
              <br />
              This action will permanently delete:
              <ul className="list-disc list-inside mt-2 space-y-1">
                <li>Student profile</li>
                <li>All enrollments</li>
                <li>All notes</li>
                <li>All documents</li>
                <li>All payment plans</li>
              </ul>
              <br />
              <strong className="text-destructive">
                This action cannot be undone.
              </strong>
            </DialogDescription>
          </DialogHeader>

          {deleteError && (
            <div className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive">
              {deleteError}
            </div>
          )}

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsDeleteDialogOpen(false)}
              disabled={isDeleting}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteConfirm}
              disabled={isDeleting}
            >
              {isDeleting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Deleting...
                </>
              ) : (
                'Delete Student'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
