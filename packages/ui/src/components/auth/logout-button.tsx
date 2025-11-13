'use client'

import { useState } from 'react'
import { Button } from '../ui/button'
import { LogOut } from 'lucide-react'

interface LogoutButtonProps {
  onLogout: () => Promise<void>
  variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link'
  size?: 'default' | 'sm' | 'lg' | 'icon'
  showIcon?: boolean
  children?: React.ReactNode
}

export function LogoutButton({
  onLogout,
  variant = 'ghost',
  size = 'default',
  showIcon = true,
  children = 'Sign Out',
}: LogoutButtonProps) {
  const [loading, setLoading] = useState(false)

  const handleLogout = async () => {
    try {
      setLoading(true)
      await onLogout()
    } catch (error) {
      console.error('Logout failed:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Button onClick={handleLogout} variant={variant} size={size} disabled={loading}>
      {showIcon && <LogOut className="mr-2 h-4 w-4" />}
      {loading ? 'Signing out...' : children}
    </Button>
  )
}
