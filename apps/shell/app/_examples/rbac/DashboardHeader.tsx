/**
 * Dashboard Header - Conditional UI rendering based on role
 *
 * This is an example component demonstrating conditional UI rendering with RBAC.
 * Shows how to hide/show specific UI elements based on user roles.
 *
 * Epic 1: Foundation & Multi-Tenant Security
 * Story 1.3: Authentication & Authorization Framework
 * Task 4: Implement Role-Based Access Control
 *
 * ⚠️ SECURITY NOTE:
 * Client-side role checks are for UI rendering ONLY.
 * Backend API routes must enforce authorization with requireRole().
 */

'use client'

import { useAuth } from '@pleeno/auth'
import { isAgencyAdmin, getUserRole } from '@pleeno/auth'

/**
 * Dashboard Header Component
 *
 * Features:
 * - Conditional navigation items based on role
 * - Admin-only links hidden from regular users
 * - Role badge display
 * - Responsive design
 *
 * Usage:
 * ```tsx
 * import DashboardHeader from './_examples/rbac/DashboardHeader'
 *
 * export default function DashboardLayout({ children }) {
 *   return (
 *     <>
 *       <DashboardHeader />
 *       {children}
 *     </>
 *   )
 * }
 * ```
 */
export default function DashboardHeader() {
  const { user } = useAuth()
  const isAdmin = isAgencyAdmin(user)
  const role = getUserRole(user)

  return (
    <header className="border-b border-gray-200 bg-white shadow-sm">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          {/* Logo / Brand */}
          <div className="flex items-center">
            <h1 className="text-xl font-bold text-gray-900">Pleeno</h1>
            {role && (
              <span className="ml-3 rounded-full bg-blue-100 px-3 py-1 text-xs font-semibold text-blue-800">
                {role === 'agency_admin' ? 'Admin' : 'User'}
              </span>
            )}
          </div>

          {/* Navigation */}
          <nav className="flex items-center space-x-6">
            {/* Links available to all authenticated users */}
            <a
              href="/dashboard"
              className="text-sm font-medium text-gray-700 hover:text-gray-900"
            >
              Dashboard
            </a>
            <a
              href="/entities"
              className="text-sm font-medium text-gray-700 hover:text-gray-900"
            >
              Entities
            </a>
            <a
              href="/payments"
              className="text-sm font-medium text-gray-700 hover:text-gray-900"
            >
              Payments
            </a>
            <a
              href="/reports"
              className="text-sm font-medium text-gray-700 hover:text-gray-900"
            >
              Reports
            </a>

            {/* Admin-only navigation items */}
            {isAdmin && (
              <>
                <span className="text-gray-300">|</span>
                <a
                  href="/agency/users"
                  className="text-sm font-medium text-blue-600 hover:text-blue-800"
                  title="Admin only"
                >
                  User Management
                </a>
                <a
                  href="/agency/settings"
                  className="text-sm font-medium text-blue-600 hover:text-blue-800"
                  title="Admin only"
                >
                  Agency Settings
                </a>
              </>
            )}

            {/* User menu */}
            <div className="ml-3 flex items-center space-x-3 border-l border-gray-200 pl-6">
              <span className="text-sm text-gray-600">{user?.email}</span>
              <button
                className="text-sm font-medium text-gray-700 hover:text-gray-900"
                onClick={() => alert('Sign out functionality would go here')}
              >
                Sign Out
              </button>
            </div>
          </nav>
        </div>
      </div>
    </header>
  )
}
