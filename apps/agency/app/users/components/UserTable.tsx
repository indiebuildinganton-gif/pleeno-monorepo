'use client'

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  Badge,
} from '@pleeno/ui'

interface User {
  id: string
  email: string
  full_name: string | null
  role: 'agency_admin' | 'agency_user'
  status: 'active' | 'inactive' | 'suspended'
  created_at: string
}

interface UserTableProps {
  initialUsers: User[]
  currentUserId: string
}

export function UserTable({ initialUsers, currentUserId }: UserTableProps) {
  const getRoleBadgeVariant = (role: string) => {
    return role === 'agency_admin' ? 'blue' : 'gray'
  }

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'active':
        return 'success'
      case 'inactive':
        return 'gray'
      case 'suspended':
        return 'destructive'
      default:
        return 'gray'
    }
  }

  const formatRole = (role: string) => {
    return role === 'agency_admin' ? 'Admin' : 'User'
  }

  const formatStatus = (status: string) => {
    return status.charAt(0).toUpperCase() + status.slice(1)
  }

  if (initialUsers.length === 0) {
    return (
      <div className="rounded-lg border border-dashed p-8 text-center">
        <p className="text-muted-foreground">No users found</p>
      </div>
    )
  }

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
          {initialUsers.map((user) => (
            <TableRow key={user.id}>
              <TableCell className="font-medium">
                {user.full_name || 'N/A'}
                {user.id === currentUserId && (
                  <span className="ml-2 text-xs text-muted-foreground">(You)</span>
                )}
              </TableCell>
              <TableCell>{user.email}</TableCell>
              <TableCell>
                <Badge variant={getRoleBadgeVariant(user.role)}>
                  {formatRole(user.role)}
                </Badge>
              </TableCell>
              <TableCell>
                <Badge variant={getStatusBadgeVariant(user.status)}>
                  {formatStatus(user.status)}
                </Badge>
              </TableCell>
              <TableCell className="text-right">
                <span className="text-sm text-muted-foreground">
                  {/* Actions will be added in future tasks */}
                  -
                </span>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
