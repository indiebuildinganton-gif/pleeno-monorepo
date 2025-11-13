'use client'

// Placeholder component - will be fully implemented in Task 11

interface User {
  id: string
  email: string
  full_name: string
  role: 'agency_admin' | 'agency_user'
  status: 'active' | 'inactive'
}

interface ConfirmStatusChangeDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  user: User
  newStatus: 'active' | 'inactive'
}

export function ConfirmStatusChangeDialog({
  open: _open,
  onOpenChange: _onOpenChange,
  user: _user,
  newStatus: _newStatus
}: ConfirmStatusChangeDialogProps) {
  return null
}
