'use client'

// Placeholder component - will be fully implemented in Task 11

interface User {
  id: string
  email: string
  full_name: string
  role: 'agency_admin' | 'agency_user'
  status: 'active' | 'inactive'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Button
} from '@pleeno/ui'
import { toast } from '@pleeno/ui/hooks/use-toast'
import { AlertTriangle } from 'lucide-react'

interface User {
  id: string
  full_name: string
  status: 'active' | 'inactive'
}

interface ConfirmStatusChangeDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  user: User
  newStatus: 'active' | 'inactive'
}

export function ConfirmStatusChangeDialog({
  open: _open,
  onOpenChange: _onOpenChange,
  user: _user,
  newStatus: _newStatus
}: ConfirmStatusChangeDialogProps) {
  return null
  open,
  onOpenChange,
  user,
  newStatus
}: ConfirmStatusChangeDialogProps) {
  const queryClient = useQueryClient()
  const isDeactivating = newStatus === 'inactive'

  const mutation = useMutation({
    mutationFn: async () => {
      const response = await fetch(`/api/users/${user.id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      })

      const result = await response.json()
      if (!result.success) {
        throw new Error(result.error?.message || 'Failed to change status')
      }
      return result.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] })
      const action = isDeactivating ? 'deactivated' : 'reactivated'
      toast({
        title: 'Status updated',
        description: `${user.full_name} has been ${action}`
      })
      onOpenChange(false)
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive'
      })
    }
  })

  const handleConfirm = () => {
    mutation.mutate()
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {isDeactivating ? 'Deactivate User' : 'Reactivate User'}
          </DialogTitle>
          <DialogDescription>
            {isDeactivating
              ? `You are about to deactivate ${user.full_name}`
              : `You are about to reactivate ${user.full_name}`}
          </DialogDescription>
        </DialogHeader>

        <div className="py-4">
          {isDeactivating ? (
            <div className="flex gap-3 rounded-md bg-red-50 p-4 text-sm text-red-800 dark:bg-red-900/20 dark:text-red-200">
              <AlertTriangle className="h-5 w-5 flex-shrink-0" />
              <div>
                <p className="font-semibold">This user will no longer be able to log in</p>
                <p className="mt-1">
                  They will be immediately signed out from all devices and cannot access the
                  system until reactivated.
                </p>
              </div>
            </div>
          ) : (
            <div className="rounded-md bg-green-50 p-4 text-sm text-green-800 dark:bg-green-900/20 dark:text-green-200">
              <p>
                This user will regain access to the system and will be able to log in with
                their existing credentials.
              </p>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={mutation.isPending}
          >
            Cancel
          </Button>
          <Button
            variant={isDeactivating ? 'destructive' : 'default'}
            onClick={handleConfirm}
            disabled={mutation.isPending}
          >
            {mutation.isPending
              ? isDeactivating
                ? 'Deactivating...'
                : 'Reactivating...'
              : isDeactivating
              ? 'Deactivate User'
              : 'Reactivate User'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
