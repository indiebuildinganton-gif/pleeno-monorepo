# Task 8: Create Pending Invitations Table Component

**Story:** 2.3 User Management Interface
**AC:** 5, 6

## Context

Create a Client Component to display pending invitations with resend and delete actions.

## Task

Build the PendingInvitationsTable component with invitation management actions.

## Requirements

1. Create file: `apps/agency/app/users/components/PendingInvitationsTable.tsx`
2. Client Component with 'use client' directive
3. Display columns: Email, Role, Invited By, Expires In, Actions
4. Calculate relative expiration time (e.g., "5 days")
5. Actions: Resend button, Delete button
6. Use TanStack Query mutations for actions
7. Show toast notifications on success/error

## Implementation

```typescript
// apps/agency/app/users/components/PendingInvitationsTable.tsx
'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { formatDistanceToNow } from 'date-fns'
import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
  Badge,
  Button
} from '@pleeno/ui'
import { toast } from '@pleeno/ui/hooks/use-toast'
import { RefreshCw, Trash2 } from 'lucide-react'

interface Invitation {
  id: string
  email: string
  role: 'agency_admin' | 'agency_user'
  expires_at: string
  created_at: string
  invited_by: {
    full_name: string
  }
}

interface PendingInvitationsTableProps {
  initialInvitations: Invitation[]
  currentUserId: string
}

export function PendingInvitationsTable({
  initialInvitations,
  currentUserId
}: PendingInvitationsTableProps) {
  const queryClient = useQueryClient()

  const { data: invitations } = useQuery({
    queryKey: ['invitations', 'pending'],
    queryFn: async () => {
      const response = await fetch('/api/invitations?status=pending')
      const result = await response.json()
      if (!result.success) {
        throw new Error(result.error?.message || 'Failed to fetch invitations')
      }
      return result.data as Invitation[]
    },
    initialData: initialInvitations,
    staleTime: 30000
  })

  const resendMutation = useMutation({
    mutationFn: async (invitationId: string) => {
      const response = await fetch(`/api/invitations/${invitationId}/resend`, {
        method: 'POST'
      })
      const result = await response.json()
      if (!result.success) {
        throw new Error(result.error?.message || 'Failed to resend invitation')
      }
      return result.data
    },
    onSuccess: (data, invitationId) => {
      queryClient.invalidateQueries({ queryKey: ['invitations', 'pending'] })
      const invitation = invitations.find(inv => inv.id === invitationId)
      toast({
        title: 'Invitation resent',
        description: `Invitation resent to ${invitation?.email}`
      })
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive'
      })
    }
  })

  const deleteMutation = useMutation({
    mutationFn: async (invitationId: string) => {
      const response = await fetch(`/api/invitations/${invitationId}`, {
        method: 'DELETE'
      })
      const result = await response.json()
      if (!result.success) {
        throw new Error(result.error?.message || 'Failed to delete invitation')
      }
      return result
    },
    onSuccess: (data, invitationId) => {
      queryClient.invalidateQueries({ queryKey: ['invitations', 'pending'] })
      const invitation = invitations.find(inv => inv.id === invitationId)
      toast({
        title: 'Invitation deleted',
        description: `Invitation for ${invitation?.email} has been deleted`
      })
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive'
      })
    }
  })

  const getExpiresIn = (expiresAt: string) => {
    return formatDistanceToNow(new Date(expiresAt), { addSuffix: true })
  }

  if (invitations.length === 0) {
    return null
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Email</TableHead>
            <TableHead>Role</TableHead>
            <TableHead>Invited By</TableHead>
            <TableHead>Expires</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {invitations.map((invitation) => (
            <TableRow key={invitation.id}>
              <TableCell className="font-medium">{invitation.email}</TableCell>
              <TableCell>
                <Badge
                  variant={invitation.role === 'agency_admin' ? 'default' : 'secondary'}
                >
                  {invitation.role === 'agency_admin' ? 'Admin' : 'User'}
                </Badge>
              </TableCell>
              <TableCell>{invitation.invited_by.full_name}</TableCell>
              <TableCell className="text-muted-foreground">
                {getExpiresIn(invitation.expires_at)}
              </TableCell>
              <TableCell className="text-right space-x-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => resendMutation.mutate(invitation.id)}
                  disabled={resendMutation.isPending}
                >
                  <RefreshCw className="h-4 w-4 mr-1" />
                  Resend
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => deleteMutation.mutate(invitation.id)}
                  disabled={deleteMutation.isPending}
                >
                  <Trash2 className="h-4 w-4 mr-1" />
                  Delete
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
```

## Architecture Alignment

- Location: `apps/agency/app/users/components/PendingInvitationsTable.tsx`
- Client Component (interactive)
- Use TanStack Query for mutations
- Use date-fns for relative time
- Use shadcn/ui components
- Show toast notifications

## Features

**Relative Time Display:**
- "in 5 days"
- "in 2 hours"
- "expires in 1 day"

**Actions:**
- Resend: Extends expiration, sends email
- Delete: Removes invitation permanently

**Mutations:**
- Optimistic updates (optional)
- Query invalidation on success
- Toast notifications
- Error handling

## Acceptance Criteria

- [ ] File created at correct location
- [ ] 'use client' directive at top
- [ ] Table displays invitation data
- [ ] Relative time calculated correctly
- [ ] Resend button works
- [ ] Delete button works
- [ ] Loading states handled
- [ ] Toast notifications shown
- [ ] Query invalidation on success
- [ ] Error handling implemented

## Component Props

```typescript
interface PendingInvitationsTableProps {
  initialInvitations: Invitation[]  // From Server Component
  currentUserId: string             // For audit logging
}
```

## Integration Points

- Parent: `apps/agency/app/users/page.tsx`
- API: `/api/invitations/[id]/resend` (POST)
- API: `/api/invitations/[id]` (DELETE)
- Queries: TanStack Query cache

## Next Steps

After completing this task:
1. Verify table renders correctly
2. Test resend functionality
3. Test delete functionality
4. Verify toast notifications
5. Proceed to Task 9: Create User Actions Menu
