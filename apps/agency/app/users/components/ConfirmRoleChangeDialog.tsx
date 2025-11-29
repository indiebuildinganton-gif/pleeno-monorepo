'use client'

import { useMutation, useQueryClient } from '@tanstack/react-query'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Button,
  Badge,
  useToast
} from '@pleeno/ui'

interface User {
  id: string
  full_name: string
  role: 'agency_admin' | 'agency_user'
}

interface ConfirmRoleChangeDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  user: User
  newRole: 'agency_admin' | 'agency_user'
}

export function ConfirmRoleChangeDialog({
  open,
  onOpenChange,
  user,
  newRole
}: ConfirmRoleChangeDialogProps) {
  const queryClient = useQueryClient()
  const { addToast } = useToast()

  const mutation = useMutation({
    mutationFn: async () => {
      const response = await fetch(`/api/users/${user.id}/role`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: newRole })
      })

      const result = await response.json()
      if (!result.success) {
        throw new Error(result.error?.message || 'Failed to change role')
      }
      return result.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] })
      addToast({
        title: 'Role updated',
        description: `Role updated for ${user.full_name}`,
        variant: 'success'
      })
      onOpenChange(false)
    },
    onError: (error: Error) => {
      addToast({
        title: 'Error',
        description: error.message,
        variant: 'error'
      })
    }
  })

  const handleConfirm = () => {
    mutation.mutate()
  }

  const formatRole = (role: string) => {
    return role === 'agency_admin' ? 'Admin' : 'User'
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Change User Role</DialogTitle>
          <DialogDescription>
            You are about to change the role for {user.full_name}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Current Role:</span>
            <Badge variant={user.role === 'agency_admin' ? 'default' : 'secondary'}>
              {formatRole(user.role)}
            </Badge>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">New Role:</span>
            <Badge variant={newRole === 'agency_admin' ? 'default' : 'secondary'}>
              {formatRole(newRole)}
            </Badge>
          </div>
          <div className="rounded-md bg-yellow-50 p-3 text-sm text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-200">
            ⚠️ Changing this user's role will affect their permissions and access to features.
          </div>
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
            onClick={handleConfirm}
            disabled={mutation.isPending}
          >
            {mutation.isPending ? 'Changing...' : 'Confirm Change'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
