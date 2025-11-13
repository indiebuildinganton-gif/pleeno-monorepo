# Task 11: Create Status Change Confirmation Dialog

**Story:** 2.3 User Management Interface
**AC:** 3, 4

## Context

Create a confirmation dialog for status changes (activate/deactivate) with appropriate warnings.

## Task

Build the ConfirmStatusChangeDialog component with TanStack Query mutation.

## Requirements

1. Create file: `apps/agency/app/users/components/ConfirmStatusChangeDialog.tsx`
2. Client Component with dialog UI
3. Display action: "Deactivate [User]" or "Reactivate [User]"
4. Warning for deactivation: user cannot log in
5. Cancel and Confirm buttons
6. Call PATCH /api/users/[id]/status on confirm
7. Show success toast
8. Refresh user list with query invalidation

## Implementation

```typescript
// apps/agency/app/users/components/ConfirmStatusChangeDialog.tsx
'use client'

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
```

## Architecture Alignment

- Location: `apps/agency/app/users/components/ConfirmStatusChangeDialog.tsx`
- Client Component with TanStack Query
- Use shadcn/ui Dialog
- Use toast for notifications
- Query invalidation on success
- Different styling for deactivate vs reactivate

## Dialog Layouts

**Deactivate:**
```
┌─────────────────────────────────────┐
│ Deactivate User                     │
│ You are about to deactivate John... │
├─────────────────────────────────────┤
│                                     │
│ ⚠️  This user will no longer be     │
│     able to log in                  │
│     They will be immediately...     │
│                                     │
│          [Cancel]  [Deactivate User]│
└─────────────────────────────────────┘
```

**Reactivate:**
```
┌─────────────────────────────────────┐
│ Reactivate User                     │
│ You are about to reactivate John... │
├─────────────────────────────────────┤
│                                     │
│ ✓  This user will regain access...  │
│                                     │
│          [Cancel]  [Reactivate User]│
└─────────────────────────────────────┘
```

## Styling Details

**Deactivate:**
- Red warning background
- AlertTriangle icon
- Destructive button variant

**Reactivate:**
- Green success background
- No icon needed
- Default button variant

## Acceptance Criteria

- [ ] File created at correct location
- [ ] Dialog renders correctly
- [ ] Deactivate shows red warning
- [ ] Reactivate shows green message
- [ ] Cancel button closes dialog
- [ ] Confirm button triggers mutation
- [ ] Loading state during mutation
- [ ] Success toast on completion
- [ ] Error toast on failure
- [ ] Query invalidation refreshes list
- [ ] Dialog closes on success
- [ ] Button text changes based on action

## Component Props

```typescript
interface ConfirmStatusChangeDialogProps {
  open: boolean                      // Control dialog visibility
  onOpenChange: (open: boolean) => void  // Handle close
  user: User                         // User to update
  newStatus: 'active' | 'inactive'   // Target status
}
```

## Integration Points

- Parent: `apps/agency/app/users/components/UserActionsMenu.tsx`
- API: `/api/users/[id]/status` (PATCH)
- Queries: TanStack Query cache
- Toasts: shadcn/ui toast system

## Next Steps

After completing this task:
1. Test deactivate flow
2. Test reactivate flow
3. Verify warnings display correctly
4. Verify toast notifications
5. Proceed to Task 12: Add Navigation Link
