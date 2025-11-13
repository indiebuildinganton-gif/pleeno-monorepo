'use client'

// Placeholder component - will be fully implemented in Task 9

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
  return (
    <span className="text-sm text-muted-foreground">
      {/* Actions menu will be implemented in Task 9 */}
      -
    </span>
  )
}
