/**
 * Task Assignment Form - Client component for managing user task assignments
 *
 * This component displays all master tasks as checkboxes and allows agency admins
 * to modify task assignments for a user with optimistic updates and success feedback.
 *
 * Epic 2: Agency Configuration & User Management
 * Story 2.2: User Invitation and Task Assignment System
 * Task 09: Create task assignment UI for existing users
 */

'use client'

import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Button, Checkbox } from '@pleeno/ui'
import { CheckCircle2 } from 'lucide-react'

interface MasterTask {
  id: string
  task_name: string
  task_code: string
  description: string | null
}

interface TaskAssignmentFormProps {
  userId: string
  currentTaskIds: string[]
  masterTasks: MasterTask[]
}

export function TaskAssignmentForm({
  userId,
  currentTaskIds,
  masterTasks,
}: TaskAssignmentFormProps) {
  // Local state for selected task IDs
  const [selectedTaskIds, setSelectedTaskIds] = useState<string[]>(currentTaskIds)

  // Success toast state
  const [showSuccess, setShowSuccess] = useState(false)

  const queryClient = useQueryClient()

  // Mutation for updating task assignments with optimistic updates
  const mutation = useMutation({
    mutationFn: async (taskIds: string[]) => {
      const response = await fetch(`/api/users/${userId}/tasks`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ task_ids: taskIds }),
      })

      const result = await response.json()

      if (!result.success) {
        throw new Error(result.error?.message || 'Failed to update task assignments')
      }

      return result.data
    },
    // Optimistic update: immediately update UI before API responds
    onMutate: async (newTaskIds) => {
      // Cancel any outgoing refetches to avoid overwriting optimistic update
      await queryClient.cancelQueries({ queryKey: ['users', userId, 'tasks'] })

      // Snapshot the previous value for potential rollback
      const previousTaskIds = selectedTaskIds

      // Optimistically update to the new value
      setSelectedTaskIds(newTaskIds)

      // Return context object with the snapshot
      return { previousTaskIds }
    },
    // On error: rollback to previous state
    onError: (error, _newTaskIds, context) => {
      // Rollback optimistic update
      if (context?.previousTaskIds) {
        setSelectedTaskIds(context.previousTaskIds)
      }

      // Show error alert
      alert(`Failed to update task assignments: ${error.message}`)
    },
    // On success: show success toast
    onSuccess: () => {
      // Invalidate and refetch user data
      queryClient.invalidateQueries({ queryKey: ['users'] })
      queryClient.invalidateQueries({ queryKey: ['users', userId] })

      // Show success toast
      setShowSuccess(true)

      // Auto-hide success toast after 3 seconds
      setTimeout(() => {
        setShowSuccess(false)
      }, 3000)
    },
  })

  // Handle checkbox toggle
  const handleTaskToggle = (taskId: string, checked: boolean) => {
    if (checked) {
      setSelectedTaskIds((prev) => [...prev, taskId])
    } else {
      setSelectedTaskIds((prev) => prev.filter((id) => id !== taskId))
    }
  }

  // Handle form submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    mutation.mutate(selectedTaskIds)
  }

  // Check if there are unsaved changes
  const hasChanges =
    JSON.stringify([...selectedTaskIds].sort()) !==
    JSON.stringify([...currentTaskIds].sort())

  return (
    <div>
      {/* Success Toast */}
      {showSuccess && (
        <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-md flex items-center gap-2 text-green-800">
          <CheckCircle2 className="h-5 w-5" />
          <span className="text-sm font-medium">Task assignments updated successfully!</span>
        </div>
      )}

      <form onSubmit={handleSubmit}>
        {/* Task Checkboxes */}
        <div className="space-y-4 mb-6">
          {masterTasks.length === 0 ? (
            <p className="text-sm text-muted-foreground">No tasks available</p>
          ) : (
            masterTasks.map((task) => {
              const isChecked = selectedTaskIds.includes(task.id)

              return (
                <div
                  key={task.id}
                  className="flex items-start gap-3 p-3 rounded-md border hover:bg-accent/50 transition-colors"
                >
                  <Checkbox
                    id={`task-${task.id}`}
                    checked={isChecked}
                    onCheckedChange={(checked) => {
                      handleTaskToggle(task.id, checked === true)
                    }}
                    className="mt-1"
                  />
                  <div className="flex-1">
                    <label
                      htmlFor={`task-${task.id}`}
                      className="text-sm font-medium cursor-pointer"
                    >
                      {task.task_name}
                    </label>
                    {task.description && (
                      <p className="text-sm text-muted-foreground mt-1">
                        {task.description}
                      </p>
                    )}
                  </div>
                </div>
              )
            })
          )}
        </div>

        {/* Selected Count */}
        <div className="text-sm text-muted-foreground mb-4">
          {selectedTaskIds.length} task{selectedTaskIds.length !== 1 ? 's' : ''}{' '}
          selected
        </div>

        {/* Save Button */}
        <Button
          type="submit"
          disabled={!hasChanges || mutation.isPending}
          className="w-full sm:w-auto"
        >
          {mutation.isPending ? 'Saving...' : 'Save Task Assignments'}
        </Button>

        {/* Unsaved Changes Indicator */}
        {hasChanges && !mutation.isPending && (
          <p className="text-sm text-amber-600 mt-2">
            You have unsaved changes
          </p>
        )}
      </form>
    </div>
  )
}
