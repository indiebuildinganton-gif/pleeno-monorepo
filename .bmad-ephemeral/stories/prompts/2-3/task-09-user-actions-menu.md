# Task 9: Create User Actions Menu Component

**Story:** 2.3 User Management Interface
**AC:** 2, 3

## Context

Create a dropdown menu for user actions with role change and status change options.

## Task

Build the UserActionsMenu component with dropdown actions and dialog integrations.

## Requirements

1. Create file: `apps/agency/app/users/components/UserActionsMenu.tsx`
2. Client Component with dropdown menu
3. Actions: Change Role, Deactivate/Activate, View Details
4. Disable "Deactivate" for current user
5. Open confirmation dialogs for role/status changes
6. Use TanStack Query mutations for optimistic updates

## Implementation

```typescript
// apps/agency/app/users/components/UserActionsMenu.tsx
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  Button
} from '@pleeno/ui'
import { MoreVertical, UserCog, Power, Eye } from 'lucide-react'
import { ConfirmRoleChangeDialog } from './ConfirmRoleChangeDialog'
import { ConfirmStatusChangeDialog } from './ConfirmStatusChangeDialog'

interface User {
  id: string
  email: string
  full_name: string
  role: 'agency_admin' | 'agency_user'
  status: 'active' | 'inactive'
}

interface UserActionsMenuProps {
  user: User
  isCurrentUser: boolean
}

export function UserActionsMenu({ user, isCurrentUser }: UserActionsMenuProps) {
  const router = useRouter()
  const [roleDialogOpen, setRoleDialogOpen] = useState(false)
  const [statusDialogOpen, setStatusDialogOpen] = useState(false)

  const handleViewDetails = () => {
    router.push(`/users/${user.id}`)
  }

  const handleChangeRole = () => {
    setRoleDialogOpen(true)
  }

  const handleToggleStatus = () => {
    setStatusDialogOpen(true)
  }

  const newRole = user.role === 'agency_admin' ? 'agency_user' : 'agency_admin'
  const newStatus = user.status === 'active' ? 'inactive' : 'active'

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="sm">
            <MoreVertical className="h-4 w-4" />
            <span className="sr-only">Open menu</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuLabel>Actions</DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={handleViewDetails}>
            <Eye className="mr-2 h-4 w-4" />
            View Details
          </DropdownMenuItem>
          <DropdownMenuItem onClick={handleChangeRole}>
            <UserCog className="mr-2 h-4 w-4" />
            Change Role
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={handleToggleStatus}
            disabled={isCurrentUser && user.status === 'active'}
          >
            <Power className="mr-2 h-4 w-4" />
            {user.status === 'active' ? 'Deactivate' : 'Activate'}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <ConfirmRoleChangeDialog
        open={roleDialogOpen}
        onOpenChange={setRoleDialogOpen}
        user={user}
        newRole={newRole}
      />

      <ConfirmStatusChangeDialog
        open={statusDialogOpen}
        onOpenChange={setStatusDialogOpen}
        user={user}
        newStatus={newStatus}
      />
    </>
  )
}
```

## Architecture Alignment

- Location: `apps/agency/app/users/components/UserActionsMenu.tsx`
- Client Component with state management
- Use shadcn/ui DropdownMenu
- Integrate confirmation dialogs
- Handle navigation with Next.js router
- Disable actions for current user

## Menu Items

1. **View Details** - Navigate to user detail page
2. **Change Role** - Open role change dialog
3. **Deactivate/Activate** - Open status change dialog
   - Disabled for current user (when deactivating)

## State Management

- Local state for dialog open/close
- Pass user and new value to dialogs
- Dialogs handle mutations

## Acceptance Criteria

- [ ] File created at correct location
- [ ] Dropdown menu renders correctly
- [ ] All menu items present
- [ ] Icons displayed correctly
- [ ] "View Details" navigates to user page
- [ ] "Change Role" opens role dialog
- [ ] "Deactivate/Activate" opens status dialog
- [ ] Current user cannot deactivate self
- [ ] Menu closes after selection
- [ ] Dialogs controlled by state

## Component Props

```typescript
interface UserActionsMenuProps {
  user: User           // Full user object
  isCurrentUser: boolean  // Disable self-deactivation
}
```

## Integration Points

- Parent: `apps/agency/app/users/components/UserTable.tsx`
- Child: `ConfirmRoleChangeDialog.tsx`
- Child: `ConfirmStatusChangeDialog.tsx`
- Router: Next.js navigation

## Disabled Actions

**Deactivate (for current user):**
```typescript
disabled={isCurrentUser && user.status === 'active'}
```

This prevents admins from accidentally locking themselves out.

## Next Steps

After completing this task:
1. Verify menu renders and opens
2. Check all actions work
3. Verify disabled state for current user
4. Proceed to Task 10: Create Role Change Dialog
