/**
 * App Header Component
 *
 * Main navigation header for the agency application.
 * Includes app branding/logo on the left and user menu on the right.
 *
 * Epic 2: Agency & User Management
 * Story 2.4: User Profile Management
 * Task 13: Add navigation link to profile
 */

import Link from 'next/link'
import { UserMenu } from './UserMenu'

export function AppHeader() {
  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        {/* Logo/Brand */}
        <div className="flex items-center gap-6">
          <Link href="/" className="flex items-center space-x-2">
            <span className="text-xl font-bold">Pleeno</span>
          </Link>

          {/* Main Navigation Links */}
          <nav className="hidden md:flex items-center gap-6">
            <Link
              href="/users"
              className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
            >
              Team
            </Link>
            <Link
              href="/settings"
              className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
            >
              Settings
            </Link>
          </nav>
        </div>

        {/* User Menu */}
        <div className="flex items-center gap-4">
          <UserMenu />
        </div>
      </div>
    </header>
  )
}
