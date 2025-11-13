/**
 * Navigation Component
 *
 * Main navigation bar for the agency application.
 * Displays links based on user role (admin-only features hidden from regular users).
 *
 * Features:
 * - Active state highlighting for current page
 * - Admin-only link visibility
 * - Responsive design
 * - Icons from lucide-react
 *
 * Epic 2: Agency Configuration & User Management
 * Story 2.3: User Management Interface
 * Task 12: Add Navigation Link to User Management
 */

'use client'

import { usePathname } from 'next/navigation'
import Link from 'next/link'
import { cn } from '@pleeno/ui'
import { Users, User, Settings, Home } from 'lucide-react'

interface NavigationProps {
  userName: string
  isAdmin: boolean
}

export function Navigation({ userName, isAdmin }: NavigationProps) {
  const pathname = usePathname()

  const navItems = [
    {
      label: 'Home',
      href: '/',
      icon: Home,
      adminOnly: false,
    },
    {
      label: 'Profile',
      href: '/profile',
      icon: User,
      adminOnly: false,
    },
    {
      label: 'Users',
      href: '/users',
      icon: Users,
      adminOnly: true,
    },
    {
      label: 'Settings',
      href: '/settings',
      icon: Settings,
      adminOnly: true,
    },
  ]

  const visibleItems = navItems.filter((item) => !item.adminOnly || isAdmin)

  return (
    <nav className="border-b bg-background">
      <div className="container mx-auto flex items-center gap-6 px-4 py-3">
        <div className="font-semibold text-lg">Pleeno Agency</div>
        <div className="flex gap-2">
          {visibleItems.map((item) => {
            const Icon = item.icon
            const isActive =
              pathname === item.href || pathname.startsWith(item.href + '/')

            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-primary text-primary-foreground'
                    : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
                )}
              >
                <Icon className="h-4 w-4" />
                {item.label}
              </Link>
            )
          })}
        </div>
        <div className="ml-auto text-sm text-muted-foreground">
          {userName || 'Guest'}
        </div>
      </div>
    </nav>
  )
}
