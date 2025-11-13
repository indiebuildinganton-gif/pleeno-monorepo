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
