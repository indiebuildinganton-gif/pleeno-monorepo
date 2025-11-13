# Task 10: Create Role Change Confirmation Dialog

**Story:** 2.3 User Management Interface
**AC:** 2

## Context

Create a confirmation dialog for role changes with last-admin validation.

## Task

Build the ConfirmRoleChangeDialog component with TanStack Query mutation.

## Requirements

1. Create file: `apps/agency/app/users/components/ConfirmRoleChangeDialog.tsx`
2. Client Component with dialog UI
3. Display current role and new role
4. Warning message about permissions
5. Cancel and Confirm buttons
6. Call PATCH /api/users/[id]/role on confirm
7. Show success toast with user name
8. Refresh user list with query invalidation
9. Handle last-admin error gracefully

## Implementation

```typescript
// apps/agency/app/users/components/ConfirmRoleChangeDialog.tsx
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
  Badge
} from '@pleeno/ui'
import { toast } from '@pleeno/ui/hooks/use-toast'

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
      toast({
        title: 'Role updated',
        description: `Role updated for ${user.full_name}`
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
```

## Architecture Alignment

- Location: `apps/agency/app/users/components/ConfirmRoleChangeDialog.tsx`
- Client Component with TanStack Query
- Use shadcn/ui Dialog
- Use toast for notifications
- Query invalidation on success
- Handle loading/error states

## Dialog Layout

```
┌─────────────────────────────────────┐
│ Change User Role                    │
│ You are about to change the role... │
├─────────────────────────────────────┤
│                                     │
│ Current Role:        [Admin]        │
│ New Role:           [User]          │
│                                     │
│ ⚠️  Changing role affects perms...  │
│                                     │
│          [Cancel]  [Confirm Change] │
└─────────────────────────────────────┘
```

## Error Handling

**Last Admin Error:**
```json
{
  "success": false,
  "error": {
    "message": "Cannot remove last admin from agency"
  }
}
```

Display error in toast, keep dialog open.

## Acceptance Criteria

- [ ] File created at correct location
- [ ] Dialog renders correctly
- [ ] Current and new roles displayed
- [ ] Warning message shown
- [ ] Cancel button closes dialog
- [ ] Confirm button triggers mutation
- [ ] Loading state during mutation
- [ ] Success toast on completion
- [ ] Error toast on failure
- [ ] Query invalidation refreshes list
- [ ] Dialog closes on success
- [ ] Last-admin error handled gracefully

## Component Props

```typescript
interface ConfirmRoleChangeDialogProps {
  open: boolean                      // Control dialog visibility
  onOpenChange: (open: boolean) => void  // Handle close
  user: User                         // User to update
  newRole: 'agency_admin' | 'agency_user'  // Target role
}
```

## Integration Points

- Parent: `apps/agency/app/users/components/UserActionsMenu.tsx`
- API: `/api/users/[id]/role` (PATCH)
- Queries: TanStack Query cache
- Toasts: shadcn/ui toast system

## Next Steps

After completing this task:
1. Test role change success case
2. Test last-admin validation
3. Verify toast notifications
4. Verify query invalidation
5. Proceed to Task 11: Create Status Change Dialog
