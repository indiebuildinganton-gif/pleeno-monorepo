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

import { LayoutDashboard, CreditCard, FileText, Upload, Users, ChevronDown } from 'lucide-react'
import { NetworkActivityPanel } from './NetworkActivityPanel'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@pleeno/ui'

export function AppHeader() {
  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        {/* Logo/Brand */}
        <div className="flex items-center gap-6">
          <a href="/dashboard" className="flex items-center space-x-2">
            <span className="text-xl font-bold">Pleeno Dashboard</span>
          </a>

          {/* Main Navigation Links */}
          <nav className="hidden md:flex items-center gap-6">
            <a
              href="/dashboard"
              className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors flex items-center gap-2"
            >
              <LayoutDashboard className="h-4 w-4" />
              Dashboard
            </a>

            {/* Import Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger className="flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors focus:outline-none">
                <Upload className="h-4 w-4" />
                Import
                <ChevronDown className="h-3 w-3" />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-60 bg-white dark:bg-slate-950 border shadow-lg p-1">
                <DropdownMenuItem asChild className="focus:bg-blue-50 dark:focus:bg-blue-950 rounded-sm">
                  <a
                    href="/entities/students/import"
                    className="flex items-center gap-3 cursor-pointer px-3 py-2.5 text-gray-900 dark:text-gray-100 hover:no-underline"
                  >
                    <div className="flex h-8 w-8 items-center justify-center rounded-md bg-blue-100 dark:bg-blue-900">
                      <Users className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div className="flex flex-col">
                      <span className="font-medium text-sm">Import Students</span>
                      <span className="text-xs text-gray-500 dark:text-gray-400">Upload students via CSV</span>
                    </div>
                  </a>
                </DropdownMenuItem>
                <DropdownMenuSeparator className="my-1" />
                <div className="px-3 py-2 text-xs text-gray-400 dark:text-gray-500">
                  More import options coming soon
                </div>
              </DropdownMenuContent>
            </DropdownMenu>

            <a
              href="/payments"
              className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors flex items-center gap-2"
            >
              <CreditCard className="h-4 w-4" />
              Payment Plans
            </a>
            <a
              href="/reports"
              className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors flex items-center gap-2"
            >
              <FileText className="h-4 w-4" />
              Reports
            </a>
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
