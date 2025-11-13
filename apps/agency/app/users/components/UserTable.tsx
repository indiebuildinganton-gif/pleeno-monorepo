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
  task_count?: number
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
            <TableHead>Assigned Tasks</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {users.length === 0 ? (
            <TableRow>
              <TableCell colSpan={6} className="text-center text-muted-foreground">
                No users found
              </TableCell>
            </TableRow>
          ) : (
            users.map((user) => (
              <TableRow key={user.id}>
                <TableCell className="font-medium">
                  {user.full_name || 'N/A'}
                  {user.id === currentUserId && (
                    <span className="ml-2 text-xs text-muted-foreground">(You)</span>
                  )}
                </TableCell>
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
                <TableCell>
                  <span className="text-sm text-muted-foreground">
                    {user.task_count !== undefined ? user.task_count : 0} task
                    {user.task_count !== 1 ? 's' : ''}
                  </span>
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
