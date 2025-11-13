'use client'

// Placeholder component - will be fully implemented in Task 10

interface User {
  id: string
  email: string
  full_name: string
  role: 'agency_admin' | 'agency_user'
  status: 'active' | 'inactive'
}

interface ConfirmRoleChangeDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  user: User
  newRole: 'agency_admin' | 'agency_user'
}

export function ConfirmRoleChangeDialog({
  open: _open,
  onOpenChange: _onOpenChange,
  user: _user,
  newRole: _newRole
}: ConfirmRoleChangeDialogProps) {
  return null
}
