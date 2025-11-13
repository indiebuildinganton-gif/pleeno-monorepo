'use client'

/**
 * User Menu Client Component
 *
 * Client component for user menu dropdown with profile link and logout.
 * Shows active state for current page.
 *
 * Epic 2: Agency & User Management
 * Story 2.4: User Profile Management
 * Task 13: Add navigation link to profile
 */

import { usePathname, useRouter } from 'next/navigation'
import { User, LogOut } from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  Button,
} from '@pleeno/ui'
import { createClient } from '@pleeno/database/client'

interface UserMenuClientProps {
  name: string
  email: string
}

export function UserMenuClient({ name, email }: UserMenuClientProps) {
  const pathname = usePathname()
  const router = useRouter()
  const isProfileActive = pathname === '/profile'

  const handleLogout = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/auth/login')
  }

  const handleProfileClick = () => {
    router.push('/profile')
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          className="flex items-center gap-2 px-3"
          data-active={isProfileActive}
        >
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary">
            <User className="h-4 w-4" />
          </div>
          <div className="flex flex-col items-start text-left">
            <span className="text-sm font-medium">{name}</span>
          </div>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel>
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium leading-none">{name}</p>
            <p className="text-xs leading-none text-muted-foreground">{email}</p>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={handleProfileClick}
          className={isProfileActive ? 'bg-accent' : ''}
        >
          <User className="mr-2 h-4 w-4" />
          <span>Profile</span>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={handleLogout} className="text-destructive">
          <LogOut className="mr-2 h-4 w-4" />
          <span>Sign out</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
