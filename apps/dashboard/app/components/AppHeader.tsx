/**
 * App Header Component
 *
 * Main navigation header for the dashboard application.
 * Includes app branding/logo on the left and navigation links.
 *
 * Epic 5: Payment Management Dashboard
 * Story 5.4: Payment Status Dashboard Widget
 * Task 1: Create Dashboard Page and Layout
 */

'use client'

import Link from 'next/link'
import { LayoutDashboard, CreditCard, FileText } from 'lucide-react'
import { NetworkActivityPanel } from './NetworkActivityPanel'

export function AppHeader() {
  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        {/* Logo/Brand */}
        <div className="flex items-center gap-6">
          <Link href="/dashboard" className="flex items-center space-x-2">
            <span className="text-xl font-bold">Pleeno Dashboard</span>
          </Link>

          {/* Main Navigation Links */}
          <nav className="hidden md:flex items-center gap-6">
            <Link
              href="/dashboard"
              className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors flex items-center gap-2"
            >
              <LayoutDashboard className="h-4 w-4" />
              Dashboard
            </Link>
            <Link
              href="/payments"
              className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors flex items-center gap-2"
            >
              <CreditCard className="h-4 w-4" />
              Payment Plans
            </Link>
            <Link
              href="/reports"
              className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors flex items-center gap-2"
            >
              <FileText className="h-4 w-4" />
              Reports
            </Link>
          </nav>
        </div>

        {/* User Info and Network Activity */}
        <div className="flex items-center gap-4">
          <span className="text-sm text-muted-foreground">Agency User</span>
          <NetworkActivityPanel />
        </div>
      </div>
    </header>
  )
}
