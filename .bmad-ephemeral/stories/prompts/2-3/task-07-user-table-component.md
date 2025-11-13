# Task 7: Create User Table Component

**Story:** 2.3 User Management Interface
**AC:** 1, 2, 3

## Context

Create a Client Component to display the user list with interactive features using TanStack Query for optimistic updates.

## Task

Build the UserTable Client Component with role/status badges and action menu integration.

## Requirements

1. Create file: `apps/agency/app/users/components/UserTable.tsx`
2. Client Component with 'use client' directive
3. Use TanStack Query for data management
4. Display columns: Name, Email, Role, Status, Actions
5. Role badge: Admin (blue), User (gray)
6. Status badge: Active (green), Inactive (red)
7. Integrate UserActionsMenu component
8. Accept initialUsers prop from Server Component

## Implementation

```typescript
// apps/agency/app/users/components/UserTable.tsx
'use client'

import { useQuery } from '@tanstack/react-query'
import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
  Badge
} from '@pleeno/ui'
import { UserActionsMenu } from './UserActionsMenu'

interface User {
  id: string
  email: string
  full_name: string
  role: 'agency_admin' | 'agency_user'
  status: 'active' | 'inactive'
  agency_id: string
  created_at: string
  updated_at: string
}

interface UserTableProps {
  initialUsers: User[]
  currentUserId: string
}

export function UserTable({ initialUsers, currentUserId }: UserTableProps) {
  const { data: users } = useQuery({
    queryKey: ['users'],
    queryFn: async () => {
      const response = await fetch('/api/users')
      const result = await response.json()
      if (!result.success) {
        throw new Error(result.error?.message || 'Failed to fetch users')
      }
      return result.data as User[]
    },
    initialData: initialUsers,
    staleTime: 30000 // Consider data fresh for 30 seconds
  })

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Email</TableHead>
            <TableHead>Role</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {users.length === 0 ? (
            <TableRow>
              <TableCell colSpan={5} className="text-center text-muted-foreground">
                No users found
              </TableCell>
            </TableRow>
          ) : (
            users.map((user) => (
              <TableRow key={user.id}>
                <TableCell className="font-medium">{user.full_name}</TableCell>
                <TableCell>{user.email}</TableCell>
                <TableCell>
                  <Badge
                    variant={user.role === 'agency_admin' ? 'default' : 'secondary'}
                  >
                    {user.role === 'agency_admin' ? 'Admin' : 'User'}
                  </Badge>
                </TableCell>
                <TableCell>
                  <Badge
                    variant={user.status === 'active' ? 'success' : 'destructive'}
                  >
                    {user.status === 'active' ? 'Active' : 'Inactive'}
                  </Badge>
                </TableCell>
                <TableCell className="text-right">
                  <UserActionsMenu
                    user={user}
                    isCurrentUser={user.id === currentUserId}
                  />
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  )
}
```

## Architecture Alignment

- Location: `apps/agency/app/users/components/UserTable.tsx`
- Client Component (interactive)
- Use TanStack Query for data management
- Accept initialUsers for SSR hydration
- Pass currentUserId to disable self-actions
- Use shadcn/ui Table components

## Badge Styling

**Role Badges:**
- Admin: `variant="default"` (blue)
- User: `variant="secondary"` (gray)

**Status Badges:**
- Active: `variant="success"` (green)
- Inactive: `variant="destructive"` (red)

## Data Management

- Initial data from Server Component (SSR)
- TanStack Query manages client-side state
- Query invalidation on mutations
- 30-second stale time for performance

## Acceptance Criteria

- [ ] File created at correct location
- [ ] 'use client' directive at top
- [ ] TanStack Query setup correctly
- [ ] Table displays all user data
- [ ] Role badges styled correctly
- [ ] Status badges styled correctly
- [ ] Actions menu integrated
- [ ] Current user identified
- [ ] Empty state handled
- [ ] TypeScript types defined

## Component Props

```typescript
interface UserTableProps {
  initialUsers: User[]  // From Server Component
  currentUserId: string // To identify current user
}
```

## Integration Points

- Parent: `apps/agency/app/users/page.tsx`
- Child: `apps/agency/app/users/components/UserActionsMenu.tsx`
- Queries: TanStack Query cache
- Mutations: Trigger via UserActionsMenu

## Next Steps

After completing this task:
1. Verify table renders correctly
2. Check badge colors match design
3. Verify empty state works
4. Proceed to Task 8: Create Pending Invitations Table
